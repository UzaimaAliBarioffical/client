import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { createServer } from 'vite';

const clientRoot = fileURLToPath(new URL('../', import.meta.url));
const serverRequire = createRequire(new URL('../../server/package.json', import.meta.url));
const { MongoMemoryReplSet } = serverRequire('mongodb-memory-server');
const { PDFDocument } = serverRequire('pdf-lib');

async function launchBrowser() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
    return chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  }
  for (const executablePath of [chromium.executablePath(),
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']) {
    try { await access(executablePath); } catch { continue; }
    return chromium.launch({ executablePath });
  }
  return chromium.launch();
}

// No API interception: React -> Axios -> Vite proxy -> the real Express app -> MongoDB.
// Both uploads and database are disposable; the configured application database is never used.
test('real stories stack serves empty and published catalogues safely', { timeout: 180000 }, async (t) => {
  const uploads = await mkdtemp(path.join(os.tmpdir(), 'qissaghar-stories-e2e-'));
  let database;
  let backend;
  let vite;
  let browser;
  let disconnectDB;
  try {
    database = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
      instanceOpts: [{ launchTimeout: 30000 }]
    });
    // Start Vite first so the real browser origin can be explicitly trusted by Express.
    const proxies = [];
    const proxy = () => ({ target: 'http://127.0.0.1:1', changeOrigin: true,
      configure(instance) { proxies.push(instance); } });
    vite = await createServer({
      root: clientRoot,
      logLevel: 'warn',
      define: { 'import.meta.env.VITE_API_URL': JSON.stringify('') },
      server: { host: '127.0.0.1', port: 0, strictPort: true, open: false, hmr: false,
        proxy: { '/api': proxy(), '/uploads': proxy() }
      }
    });
    await new Promise((resolve, reject) => {
      vite.httpServer.once('error', reject);
      vite.httpServer.listen(0, '127.0.0.1', resolve);
    });
    const base = `http://127.0.0.1:${vite.httpServer.address().port}`;
    // Set every connection/storage value before any application module loads its .env.
    Object.assign(process.env, {
      NODE_ENV: 'test',
      MONGODB_URI: database.getUri('qissaghar_stories_e2e'),
      USE_MEMORY_DB: 'false',
      UPLOADS_ROOT: uploads,
      JWT_SECRET: randomBytes(48).toString('hex'),
      JWT_EXPIRES_IN: '5m',
      CLIENT_URL: `${base},http://localhost:5173`,
      TRUST_PROXY_HOPS: ''
    });
    const [{ startServer }, db, { Story }, { Category }] = await Promise.all([
      import('../../server/server.js'), import('../../server/config/db.js'),
      import('../../server/models/Story.js'), import('../../server/models/Category.js')
    ]);
    disconnectDB = db.disconnectDB;
    backend = await startServer(0);
    await Promise.all([Story.init(), Category.init()]);
    const backendOrigin = `http://127.0.0.1:${backend.address().port}`;
    for (const proxyInstance of proxies) proxyInstance.options.target = backendOrigin;
    const request = (endpoint, options = {}) => fetch(`${base}${endpoint}`, {
      ...options, signal: AbortSignal.timeout(10000)
    });
    const catalogue = async (query = '') => {
      const response = await request(`/api/stories${query}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /application\/json/);
      const body = await response.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      for (const story of body.data) {
        assert.equal(story.status, 'published');
        assert.equal(story.privateFullPdf, undefined);
        assert.equal(story.previewPdf, undefined);
        assert.ok(story.category.name && story.category.slug);
      }
      return body;
    };
    browser = await launchBrowser();
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(15000);
    const pageErrors = [];
    const storyResponses = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (new URL(response.url()).pathname === '/api/stories') storyResponses.push(response);
    });
    const actions = page.getByRole('link', { name: 'View Story', exact: true });
    const languages = page.getByRole('navigation', { name: 'Story languages' });
    const languageLink = (language = 'All') => languages.getByRole('link', { name: new RegExp(`^${language} Stories`) });
    const assertLanguage = async (language = 'All') => {
      await expect(languageLink(language)).toHaveAttribute('aria-current', 'page');
      await expect(languages.locator('[aria-current="page"]')).toHaveCount(1);
      assert.equal(new URL(page.url()).searchParams.get('language'), language === 'All' ? null : language);
    };

    await t.test('empty database returns 200 and all language URLs show the unpublished catalogue state', async () => {
      const health = await request('/api/health');
      assert.equal(health.status, 200);
      assert.deepEqual(await health.json(), { status: 'healthy', database: 'connected' });
      for (const query of ['', '?language=Urdu', '?language=English']) {
        const body = await catalogue(query);
        assert.deepEqual(body.data, []);
        assert.deepEqual(body.pagination, { page: 1, limit: 12, total: 0, totalPages: 0 });
      }
      for (const language of ['All', 'Urdu', 'English']) {
        const sessionProbe = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/auth/me');
        await page.goto(`${base}/stories${language === 'All' ? '' : `?language=${language}`}`);
        assert.equal((await sessionProbe).status(), 401);
        await expect(page.getByRole('heading', { name: 'No published stories yet' })).toBeVisible();
        await expect(page.getByRole('status')).toHaveText('Showing 0 of 0 stories');
        await expect(page.getByRole('alert')).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Sign In to Your Library' })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Could Not Load Stories' })).toHaveCount(0);
        await assertLanguage(language);
        if (language !== 'All') {
          await expect(page.getByRole('link', { name: 'Browse All Stories', exact: true })).toHaveAttribute('href', '/stories');
        }
      }
      assert.ok(storyResponses.every((response) => response.status() === 200));
      assert.ok(storyResponses.some((response) => new URL(response.url()).search === '?page=1&limit=1'));
    });

    const category = await Category.create({ name: 'Isolated E2E Fiction', slug: 'isolated-e2e-fiction' });
    const pdf = await PDFDocument.create();
    for (let index = 0; index < 4; index++) pdf.addPage().drawText(`Isolated story page ${index + 1}`);
    const preview = await PDFDocument.create();
    for (const pdfPage of await preview.copyPages(pdf, [0, 1])) preview.addPage(pdfPage);
    await Promise.all([
      writeFile(path.join(uploads, 'covers', 'fixture.png'), Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')),
      writeFile(path.join(uploads, 'previews', 'fixture.pdf'), await preview.save()),
      writeFile(path.join(uploads, 'private_pdfs', 'fixture.pdf'), await pdf.save())
    ]);
    const fixture = {
      title: 'Isolated Urdu story', slug: 'isolated-urdu', author: 'E2E Author',
      shortDescription: 'Disposable story for end-to-end verification.',
      description: 'This fixture exists only in an isolated temporary test database.',
      category: category._id, language: 'Urdu', price: 125, status: 'published',
      coverImage: 'uploads/covers/fixture.png', previewPdf: 'uploads/previews/fixture.pdf',
      privateFullPdf: 'uploads/private_pdfs/fixture.pdf', totalPages: 4
    };
    const records = await Story.create([
      fixture,
      { ...fixture, title: 'Isolated native Urdu story', slug: 'isolated-native-urdu', language: 'اردو' },
      { ...fixture, title: 'Isolated Urdu code story', slug: 'isolated-code-urdu', language: 'ur' },
      { ...fixture, title: 'Isolated English story', slug: 'isolated-english', language: 'English', price: 0 },
      { ...fixture, title: 'Private draft story', slug: 'isolated-draft', status: 'draft' }
    ]);
    const urduIds = records.slice(0, 3).map((record) => String(record._id)).sort();

    await t.test('published Urdu aliases and the unfiltered catalogue return safe public metadata', async () => {
      for (const language of ['Urdu', 'urdu', 'URDU', 'ur', 'اردو']) {
        const body = await catalogue(`?language=${encodeURIComponent(language)}`);
        assert.equal(body.pagination.total, 3);
        assert.deepEqual(body.data.map((story) => story._id).sort(), urduIds);
      }
      assert.equal((await catalogue()).pagination.total, 4);
      for (const language of ['English', 'english', 'ENGLISH', 'en']) {
        assert.equal((await catalogue(`?language=${language}`)).pagination.total, 1);
      }
      assert.equal((await catalogue('?language=Urdu&status=draft')).pagination.total, 3);
      assert.equal((await catalogue('?language=Urdu&category=isolated-e2e-fiction')).pagination.total, 3);
      const empty = await catalogue('?language=Urdu&search=does-not-exist');
      assert.deepEqual(empty.data, []);
      assert.equal(empty.pagination.total, 0);
      assert.equal((await request('/api/api/stories')).status, 404);
    });

    await t.test('browser reload and language filters show real database results without errors', async () => {
      await page.goto(`${base}/stories`);
      await expect(actions).toHaveCount(4);
      await assertLanguage();
      await languageLink('Urdu').click();
      await expect(actions).toHaveCount(3);
      await assertLanguage('Urdu');
      await expect(page.getByRole('status')).toHaveText('Showing 3 of 3 stories');
      for (const record of records.slice(0, 3)) {
        await expect(page.getByRole('heading', { name: record.title, exact: true })).toBeVisible();
      }
      const cover = page.getByRole('img', { name: fixture.title, exact: true });
      await expect.poll(() => cover.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
      await expect(cover).toHaveAttribute('src', '/uploads/covers/fixture.png');
      await expect(page.getByRole('heading', { name: fixture.title, exact: true })).toHaveAttribute('dir', 'rtl');
      await expect(page.getByText('PKR 125', { exact: true })).toHaveCount(3);
      await page.reload();
      await expect(actions).toHaveCount(3);
      await assertLanguage('Urdu');
      await languageLink('English').click();
      await expect(actions).toHaveCount(1);
      await expect(page.getByRole('heading', { name: 'Isolated English story', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Isolated English story', exact: true })).toHaveAttribute('dir', 'ltr');
      await expect(page.getByText('Free', { exact: true })).toBeVisible();
      await page.reload();
      await expect(actions).toHaveCount(1);
      await assertLanguage('English');
      await languageLink().click();
      await expect(actions).toHaveCount(4);
      await assertLanguage();
      await expect(page.getByRole('heading', { name: 'Private draft story', exact: true })).toHaveCount(0);
      for (const [alias, canonical, count] of [['ur', 'Urdu', 3], ['اردو', 'Urdu', 3], ['en', 'English', 1]]) {
        await page.goto(`${base}/stories?language=${encodeURIComponent(alias)}`);
        await expect(actions).toHaveCount(count);
        await assertLanguage(canonical);
      }
      assert.ok(storyResponses.length >= 4);
      assert.ok(storyResponses.every((response) => response.status() === 200));
      assert.deepEqual(pageErrors, []);
    });

    await t.test('selected languages never substitute other stories and no-match filters reset completely', async () => {
      for (const [language, hiddenRecords, remaining] of [
        ['English', [records[3]], 3], ['Urdu', records.slice(0, 3), 1]
      ]) {
        const ids = hiddenRecords.map((record) => record._id);
        await Story.updateMany({ _id: { $in: ids } }, { status: 'draft' });
        try {
          await page.goto(`${base}/stories?language=${language}`);
          await expect(page.getByRole('heading', { name: `No ${language} stories available` })).toBeVisible();
          await expect(actions).toHaveCount(0);
          await assertLanguage(language);
          await page.getByRole('link', { name: 'Browse All Stories', exact: true }).click();
          await expect(actions).toHaveCount(remaining);
          await assertLanguage();
        } finally {
          await Story.updateMany({ _id: { $in: ids } }, { status: 'published' });
        }
      }
      await page.goto(`${base}/stories?language=Urdu&category=${category.slug}&search=does-not-exist&pricing=paid&minPrice=100&maxPrice=200&sort=price-asc&page=2`);
      await expect(page.getByRole('heading', { name: 'No stories match your criteria', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'No published stories yet' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Reset All Filters', exact: true }).first().click();
      await expect(actions).toHaveCount(4);
      await assertLanguage();
      assert.equal(new URL(page.url()).search, '');
      await expect(page.getByLabel('Search stories', { exact: true })).toHaveValue('');
      await expect(page.getByLabel('Category:', { exact: true })).toHaveValue('all');
      await expect(page.getByLabel('Minimum price in PKR', { exact: true })).toHaveValue('');
      await expect(page.getByLabel('Maximum price in PKR', { exact: true })).toHaveValue('');
      await expect(page.getByLabel('Sort By:', { exact: true })).toHaveValue('newest');
    });

    await t.test('story cards open real details and the protected reader serves only its two-page preview', async () => {
      for (const record of [records[0], records[3]]) {
        await page.goto(`${base}/stories?language=${record.language}`);
        const view = page.locator(`a[href="/story/${record.slug}"]`).filter({ hasText: 'View Story' });
        await view.click();
        await expect(page).toHaveURL(`${base}/story/${record.slug}`);
        await expect(page.getByRole('heading', { level: 1, name: record.title, exact: true })).toBeVisible();
        await expect(page.getByText(record.shortDescription, { exact: true }).first()).toBeVisible();
        await expect(page.getByRole('link', { name: 'Read 2 Pages Free', exact: true }).first()).toHaveAttribute('href', `/story/${record.slug}/read`);
      }
      await page.goto(`${base}/stories?language=Urdu`);
      const previewResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/stories/${records[0]._id}/preview`);
      await page.locator(`a[href="/story/${records[0].slug}/read"]`).click();
      await expect(page).toHaveURL(`${base}/story/${records[0].slug}/read`);
      assert.equal((await previewResponse).status(), 200);
      await expect(page.getByText('Page 1 of 2', { exact: true })).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible();
      await expect.poll(() => page.locator('canvas').evaluate((canvas) => canvas.width > 0 && canvas.height > 0)).toBe(true);
      await page.getByRole('button', { name: 'Next Page', exact: true }).click();
      await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Next Page', exact: true }).click();
      await expect(page.getByText('End of Free 2-Page Preview', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign In to Unlock Story', exact: true })).toHaveAttribute('href', '/login');
      await expect(page.locator('canvas')).toHaveCount(0);
      await page.getByRole('link', { name: 'Sign In to Unlock Story', exact: true }).click();
      await expect(page).toHaveURL(`${base}/login`);
      assert.deepEqual(pageErrors, []);
    });

    await t.test('pagination persists on refresh and resets on language changes and Reset All Filters', async () => {
      await Story.create(Array.from({ length: 12 }, (_, index) => ({
        ...fixture, title: `Isolated pagination story ${String(index + 1).padStart(2, '0')}`,
        slug: `isolated-pagination-${index + 1}`
      })));
      await page.goto(`${base}/stories?language=Urdu&sort=title`);
      await expect(actions).toHaveCount(12);
      await expect(page.getByRole('status')).toContainText('Showing 12 of 15 stories');
      const firstPageLinks = await actions.evaluateAll((links) => links.map((link) => link.getAttribute('href')));
      await expect(page.getByRole('button', { name: 'Previous page', exact: true })).toBeDisabled();
      await page.getByRole('button', { name: 'Next page', exact: true }).click();
      await expect(actions).toHaveCount(3);
      assert.equal(new URL(page.url()).searchParams.get('page'), '2');
      const secondPageLinks = await actions.evaluateAll((links) => links.map((link) => link.getAttribute('href')));
      assert.ok(secondPageLinks.every((link) => !firstPageLinks.includes(link)));
      await page.reload();
      await expect(actions).toHaveCount(3);
      await expect(page.getByRole('status')).toContainText('Page 2 of 2');
      await assertLanguage('Urdu');
      await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
      await languageLink('English').click();
      await expect(actions).toHaveCount(1);
      await assertLanguage('English');
      assert.equal(new URL(page.url()).searchParams.get('page'), null);
      await languageLink().click();
      await expect(actions).toHaveCount(12);
      await assertLanguage();
      await expect(page.getByRole('status')).toContainText('Showing 12 of 16 stories');
      await page.goto(`${base}/stories?language=Urdu&category=${category.slug}&search=Isolated&pricing=paid&minPrice=100&maxPrice=200&sort=title&page=2`);
      await expect(actions).toHaveCount(3);
      assert.equal(new URL(page.url()).searchParams.get('page'), '2');
      await page.getByRole('button', { name: 'Reset All Filters', exact: true }).click();
      await expect(actions).toHaveCount(12);
      assert.equal(new URL(page.url()).search, '');
      await expect(page.getByRole('status')).toContainText('Page 1 of 2');
      await page.goto(`${base}/stories?language=Urdu&page=99`);
      await expect(actions).toHaveCount(3);
      assert.equal(new URL(page.url()).searchParams.get('page'), '2');
      await page.setViewportSize({ width: 375, height: 812 });
      await languageLink('English').click();
      await expect(actions).toHaveCount(1);
      await expect(languageLink()).toBeVisible();
      await expect(languageLink('Urdu')).toBeVisible();
      await expect(languageLink('English')).toBeVisible();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
      await page.setViewportSize({ width: 1280, height: 900 });
      assert.deepEqual(pageErrors, []);
    });

    await t.test('real auth, CSRF, CORS and private PDF checks remain enforced', async () => {
      const fullPath = `/api/stories/${records[0]._id}/full-content`;
      assert.equal((await request(fullPath)).status, 401);
      assert.equal((await request('/uploads/private_pdfs/fixture.pdf')).status, 404);
      assert.equal((await request('/api/auth/register', { method: 'POST' })).status, 403);
      assert.equal((await request('/api/stories', { headers: { Origin: 'https://untrusted.invalid' } })).status, 403);
      const registration = await request('/api/auth/register', {
        method: 'POST', headers: {
          'Content-Type': 'application/json', 'X-QissaGhar-Request': '1', Origin: 'http://localhost:5173'
        },
        body: JSON.stringify({ name: 'Isolated E2E Reader', email: 'e2e-reader@example.invalid',
          password: randomBytes(20).toString('hex') })
      });
      assert.equal(registration.status, 201);
      const { token } = await registration.json();
      assert.ok(token);
      assert.match(registration.headers.get('set-cookie'), /HttpOnly/);
      assert.equal((await request('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })).status, 200);
      assert.equal((await request(fullPath, { headers: { Authorization: `Bearer ${token}` } })).status, 403);
      assert.equal((await request('/api/admin/stories')).status, 401);
      assert.equal((await request('/api/admin/stories', { headers: { Authorization: `Bearer ${token}` } })).status, 403);
      assert.equal((await request('/api/stories', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'X-QissaGhar-Request': '1' }
      })).status, 403);
      const publicPreview = await request(`/api/stories/${records[0]._id}/preview`);
      assert.equal(publicPreview.status, 200);
      assert.match(publicPreview.headers.get('content-type'), /application\/pdf/);
      assert.equal((await PDFDocument.load(await publicPreview.arrayBuffer())).getPageCount(), 2);
      assert.equal((await request(`/api/stories/${records[4]._id}/preview`)).status, 404);
      for (const protectedPath of ['/account/library', `/checkout/${records[0]._id}`]) {
        await page.goto(`${base}${protectedPath}`);
        await expect(page).toHaveURL(`${base}/login`);
        await expect(page.getByRole('heading', { name: 'Sign In to Your Library', exact: true })).toBeVisible();
      }
      await page.goto(`${base}/admin/stories/new`);
      await expect(page).toHaveURL(`${base}/admin/login`);
      await expect(page.getByRole('heading', { name: 'Staff Administrator Portal', exact: true })).toBeVisible();
    });

    await t.test('admin browser creates Urdu and English drafts with uploads, then explicitly publishes them', async () => {
      const { User } = await import('../../server/models/User.js');
      const bcrypt = serverRequire('bcryptjs');
      const password = randomBytes(24).toString('hex');
      const email = 'isolated-browser-admin@example.invalid';
      await User.create({ name: 'Isolated Browser Admin', email, role: 'admin',
        passwordHash: await bcrypt.hash(password, 12) });
      const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      try {
        const adminPage = await adminContext.newPage();
        adminPage.setDefaultTimeout(15000);
        adminPage.on('pageerror', (error) => pageErrors.push(error.message));
        await adminPage.goto(`${base}/admin/login`);
        await adminPage.locator('input[type="email"]').fill(email);
        await adminPage.locator('input[type="password"]').fill(password);
        await adminPage.getByRole('button', { name: 'Enter Admin Console', exact: true }).click();
        await expect(adminPage).toHaveURL(`${base}/admin`);
        for (const [language, title, slug, author, shortDescription, description, price] of [
          ['Urdu', 'آزمائشی اردو کہانی', 'آزمائشی-اردو-کہانی', 'آزمائشی مصنف', 'یہ الگ آزمائشی کہانی ہے۔', 'یہ اردو کہانی صرف عارضی آزمائشی ڈیٹابیس میں محفوظ ہے۔', 175],
          ['English', 'Browser upload English story', 'browser-upload-english-story', 'Browser Test Author', 'A separate browser upload verification story.', 'This English story exists only in the disposable test database.', 0]
        ]) {
          await adminPage.goto(`${base}/admin/stories/new`);
          await expect(adminPage.getByRole('heading', { name: 'Upload New Story', exact: true })).toBeVisible();
          await adminPage.getByLabel('Language', { exact: true }).selectOption(language);
          const titleInput = adminPage.getByPlaceholder('e.g. Ishq e Majazi', { exact: true });
          await titleInput.fill(title);
          await expect(titleInput).toHaveAttribute('dir', language === 'Urdu' ? 'rtl' : 'ltr');
          await expect(adminPage.getByPlaceholder('e.g. ishq-e-majazi', { exact: true })).toHaveValue(slug);
          await adminPage.getByPlaceholder('e.g. Farida Bano', { exact: true }).fill(author);
          await adminPage.locator('select[required]').selectOption(String(category._id));
          await adminPage.locator('input[type="number"]').fill(String(price));
          await adminPage.getByPlaceholder('1-2 sentences capturing reader attention...', { exact: true }).fill(shortDescription);
          await adminPage.getByPlaceholder('Detailed background, context, and storyline overview...', { exact: true }).fill(description);
          await adminPage.locator('input[type="file"][accept="image/jpeg,image/png,image/webp"]').setInputFiles(path.join(uploads, 'covers', 'fixture.png'));
          await adminPage.locator('input[type="file"][accept="application/pdf"]').setInputFiles(path.join(uploads, 'private_pdfs', 'fixture.pdf'));
          await expect(adminPage.getByLabel('Status', { exact: true })).toHaveValue('draft');
          const createdResponse = adminPage.waitForResponse((response) =>
            new URL(response.url()).pathname === '/api/stories' && response.request().method() === 'POST');
          await adminPage.getByRole('button', { name: 'Upload Draft Story', exact: true }).click();
          assert.equal((await createdResponse).status(), 201);
          await expect(adminPage).toHaveURL(`${base}/admin/stories`);
          const draft = await Story.findOne({ slug });
          assert.ok(draft);
          assert.equal(draft.status, 'draft');
          assert.equal(draft.language, language);
          assert.equal(draft.price, price);
          assert.equal(draft.totalPages, 4);
          assert.equal((await catalogue(`?search=${encodeURIComponent(title)}`)).pagination.total, 0);
          assert.equal((await request(`/api/stories/${draft._id}/preview`)).status, 404);
          await adminPage.goto(`${base}/admin/stories/${draft._id}/edit`);
          await expect(adminPage.getByRole('heading', { name: 'Edit Story', exact: true })).toBeVisible();
          await expect(adminPage.getByLabel('Language', { exact: true })).toHaveValue(language);
          await expect(adminPage.getByText('4 pages currently configured', { exact: true })).toBeVisible();
          await adminPage.getByLabel('Status', { exact: true }).selectOption('published');
          const publishedResponse = adminPage.waitForResponse((response) =>
            new URL(response.url()).pathname === `/api/stories/${draft._id}` && response.request().method() === 'PUT');
          await adminPage.getByRole('button', { name: 'Save Changes', exact: true }).click();
          assert.equal((await publishedResponse).status(), 200);
          await expect(adminPage).toHaveURL(`${base}/admin/stories`);
          const published = await catalogue(`?language=${language}&search=${encodeURIComponent(title)}`);
          assert.equal(published.pagination.total, 1);
          assert.equal(published.data[0].title, title);
          assert.equal((await request(`/${published.data[0].coverImage}`)).status, 200);
          const publicPreview = await request(`/api/stories/${draft._id}/preview`);
          assert.equal(publicPreview.status, 200);
          assert.equal((await PDFDocument.load(await publicPreview.arrayBuffer())).getPageCount(), 2);
          assert.equal((await request(`/api/stories/${draft._id}/full-content`)).status, 401);
          await page.goto(`${base}/stories?language=${language}&search=${encodeURIComponent(title)}`);
          await expect(actions).toHaveCount(1);
          await actions.click();
          await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
          assert.equal(decodeURIComponent(new URL(page.url()).pathname), `/story/${slug}`);
        }
        assert.deepEqual(pageErrors, []);
      } finally {
        await adminContext.close();
      }
    });
  } finally {
    // Attempt every cleanup even when a previous close fails.
    const failures = [];
    for (const close of [
      () => browser?.close(),
      () => vite?.close(),
      () => backend && new Promise((resolve, reject) => {
        backend.close((error) => error ? reject(error) : resolve());
        backend.closeAllConnections();
      }),
      () => disconnectDB?.(),
      () => database?.stop(),
      async () => {
        assert.equal(path.dirname(path.resolve(uploads)), path.resolve(os.tmpdir()));
        assert.ok(path.basename(uploads).startsWith('qissaghar-stories-e2e-'));
        await rm(uploads, { recursive: true, force: true });
      }
    ]) {
      try { await close(); } catch (error) { failures.push(error); }
    }
    if (failures.length) throw new AggregateError(failures, 'Stories E2E cleanup failed');
  }
});
