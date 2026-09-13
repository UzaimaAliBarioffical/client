import assert from 'node:assert/strict';
import { test } from 'node:test';
import { access, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { createServer, preview } from 'vite';

// Browser-only API fixtures: these records never enter MongoDB or the real catalogue.
// Run: node --test tests/stories.browser.test.mjs (from client).
// Set STORIES_BROWSER_PREVIEW=1 after npm run build to exercise production assets and SPA refresh.
const clientRoot = fileURLToPath(new URL('../', import.meta.url));
const categories = [
  { _id: 'fixture-mystery', slug: 'fixture-mystery', name: 'Fixture Mystery', storyCount: 10 },
  { _id: 'fixture-classics', slug: 'fixture-classics', name: 'Fixture Classics', storyCount: 9 },
  { _id: 'fixture-novels', slug: 'fixture-novels', name: 'Fixture Novels', storyCount: 9 }
];
const urduStories = Array.from({ length: 25 }, (_, index) => ({
  _id: `fixture-urdu-${index + 1}`, slug: `fixture-urdu-${index + 1}`,
  title: `آزمائشی کہانی ${index + 1}`, author: `Fixture Author ${index + 1}`,
  shortDescription: `یہ صرف براؤزر کی جانچ کے لیے کہانی کی تفصیل ہے ${index + 1}۔`,
  description: `یہ صرف براؤزر کی جانچ کے لیے کہانی کی تفصیل ہے ${index + 1}۔`,
  category: categories[index % categories.length], language: index === 1 ? ' ur ' : index === 2 ? 'اردو' : 'Urdu',
  price: index === 0 ? 0 : 1000 + index, coverImage: `/uploads/covers/fixture-${index + 1}.png`,
  totalPages: 8, status: 'published'
}));
const englishStories = Array.from({ length: 3 }, (_, index) => ({
  ...urduStories[index], _id: `fixture-english-${index + 1}`, slug: `fixture-english-${index + 1}`,
  title: `English browser fixture ${index + 1}`, author: `English Fixture Author ${index + 1}`,
  shortDescription: `An English browser fixture ${index + 1}.`, language: index === 1 ? ' en ' : 'English',
  price: index === 0 ? 0 : index === 1 ? 249 : undefined, totalPages: index === 0 ? 8 : index === 1 ? 1 : 0
}));
const allStories = [...urduStories, ...englishStories];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const languageNav = (page) => page.getByRole('navigation', { name: 'Story languages', exact: true });
const languageLink = (page, language) => languageNav(page).getByRole('link', {
  name: language === 'all' ? 'All Stories' : language === 'Urdu' ? /Urdu Stories/ : 'English Stories'
});
const expectLanguage = async (page, language) => {
  await expect(languageLink(page, language)).toHaveAttribute('aria-current', 'page');
  await expect(languageNav(page).locator('[aria-current="page"]')).toHaveCount(1);
};
const fixtureLanguage = (value) => ['urdu', 'ur', 'اردو'].includes(value?.trim().toLowerCase()) ? 'Urdu' : 'English';
const categorySelect = (page) => page.locator('select:has(option:has-text("All Categories"))');
const storyActions = (page) => page.getByRole('link', { name: 'View Story', exact: true });
const params = (page) => new URL(page.url()).searchParams;
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

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

async function fixturePage(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const state = { mode: 'success', gate: null, requests: [], documents: [], errors: [] };
  page.on('pageerror', (error) => state.errors.push(error.message));
  page.on('request', (request) => {
    if (request.resourceType() === 'document') state.documents.push(request.url());
  });
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    let body;
    let status = 200;
    if (url.pathname === '/api/auth/me') {
      body = { success: false, message: 'Unauthenticated browser fixture' };
      status = 401;
    } else if (url.pathname === '/api/categories') {
      body = { success: true, data: categories };
    } else if (url.pathname === '/api/stories/featured') {
      body = { success: true, data: [] };
    } else if (url.pathname === '/api/stories') {
      state.requests.push(url);
      const requestMode = state.mode;
      if (state.gate && url.searchParams.get('language') === 'Urdu') await state.gate.promise;
      if (requestMode === 'error') {
        status = 503;
        body = { success: false, message: 'Browser fixture: temporarily unavailable' };
      } else {
        let stories = requestMode === 'empty' ? [] : requestMode === 'urdu-empty' ? englishStories
          : requestMode === 'english-empty' ? urduStories : allStories;
        const selectedLanguage = url.searchParams.get('language');
        if (selectedLanguage) stories = stories.filter((story) => fixtureLanguage(story.language) === selectedLanguage);
        if (url.searchParams.get('category')) stories = stories.filter((story) => story.category.slug === url.searchParams.get('category'));
        const search = url.searchParams.get('search')?.toLowerCase();
        if (search) stories = stories.filter((story) => [story.title, story.author, story.shortDescription].some((value) => value.toLowerCase().includes(search)));
        if (url.searchParams.has('minPrice')) stories = stories.filter((story) => story.price >= Number(url.searchParams.get('minPrice')));
        if (url.searchParams.has('maxPrice')) stories = stories.filter((story) => story.price <= Number(url.searchParams.get('maxPrice')));
        if (url.searchParams.get('pricing') === 'free') stories = stories.filter((story) => story.price === 0);
        if (url.searchParams.get('pricing') === 'paid') stories = stories.filter((story) => story.price > 0);
        const limit = Number(url.searchParams.get('limit') || 12);
        const totalPages = Math.ceil(stories.length / limit);
        const pageNumber = Math.max(1, Number(url.searchParams.get('page') || 1));
        body = { success: true, data: stories.slice((pageNumber - 1) * limit, pageNumber * limit),
          pagination: { total: stories.length, page: pageNumber, limit, totalPages } };
      }
    } else if (url.pathname.startsWith('/api/')) {
      body = { success: false, message: 'Unexpected browser fixture API request' };
      status = 404;
    } else if (url.pathname.startsWith('/uploads/')) {
      await route.fulfill({ status: 200, contentType: 'image/png', body: png });
      return;
    } else if (url.origin === base) {
      await route.continue();
      return;
    } else {
      await route.abort();
      return;
    }
    try {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    } catch (error) {
      // Changing a filter aborts its previous request; its delayed fixture can already be closed.
      if (!/closed|disposed|cancel|abort|Invalid InterceptionId/i.test(error.message)) throw error;
    }
  });
  return { context, page, state };
}

test('Stories language browser flow (intercepted test records; no real database writes)', { timeout: 240000 }, async (t) => {
  const production = process.env.STORIES_BROWSER_PREVIEW === '1';
  const server = production ? await preview({ root: clientRoot, logLevel: 'warn',
    preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } }) : await createServer({ root: clientRoot, logLevel: 'warn',
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify('') },
    server: { host: '127.0.0.1', port: 0, strictPort: true, open: false, hmr: false } });
  let browser;
  try {
    if (!production) await server.listen();
    const base = `http://127.0.0.1:${server.httpServer.address().port}`;
    browser = await launchBrowser();
    const check = (name, run) => t.test(name, { timeout: 30000 }, async () => {
      const fixture = await fixturePage(browser, base);
      try {
        await run({ ...fixture, base });
        assert.deepEqual(fixture.state.errors, [], 'No uncaught browser errors');
      } finally {
        fixture.state.gate?.resolve();
        await fixture.context.close();
      }
    });

    await check('All Stories is the default and the language selector exposes canonical links with a visible active state', async ({ page, state, base }) => {
      await page.goto(`${base}/stories`);
      await expect(storyActions(page)).toHaveCount(12);
      await expectLanguage(page, 'all');
      await expect(languageLink(page, 'all')).toHaveAttribute('href', '/stories');
      await expect(languageLink(page, 'Urdu')).toHaveAttribute('href', '/stories?language=Urdu');
      await expect(languageLink(page, 'English')).toHaveAttribute('href', '/stories?language=English');
      await expect(languageLink(page, 'Urdu').getByText('اردو کہانیاں', { exact: true })).toBeVisible();
      await expect(page.getByRole('status').filter({ hasText: 'Showing 12 of 28 stories' })).toBeVisible();
      assert.equal(state.requests.at(-1).searchParams.get('language'), null);
      assert.ok(state.requests.every((url) => url.searchParams.get('limit') !== '1'), 'Nonempty results do not need catalogue probes');
      const colors = await languageNav(page).getByRole('link').evaluateAll((links) => links.map((link) => getComputedStyle(link).backgroundColor));
      assert.notEqual(colors[0], colors[1], 'The active option has a visibly different background');
      await page.getByRole('button', { name: 'Next page', exact: true }).click();
      await page.getByRole('button', { name: 'Next page', exact: true }).click();
      await expect(storyActions(page)).toHaveCount(4);
      for (const story of englishStories) await expect(page.getByRole('heading', { name: story.title, exact: true })).toBeVisible();
      assert.equal(params(page).get('language'), null);
      await languageLink(page, 'English').click();
      await expect(page).toHaveURL(`${base}/stories?language=English`);
      await expectLanguage(page, 'English');
      await expect(storyActions(page)).toHaveCount(3);
      await page.reload();
      await expectLanguage(page, 'English');
      await expect(storyActions(page)).toHaveCount(3);
      await languageLink(page, 'Urdu').click();
      await expect(page).toHaveURL(`${base}/stories?language=Urdu`);
      await expectLanguage(page, 'Urdu');
      await expect(storyActions(page)).toHaveCount(12);
      await languageLink(page, 'all').click();
      await expect(page).toHaveURL(`${base}/stories`);
      await expectLanguage(page, 'all');
    });

    await check('whole Select a Story card navigates with React Router and requests all Urdu categories', async ({ page, state, base }) => {
      await page.goto(base);
      const card = page.getByRole('link', { name: /Select a Story/ });
      await expect(card).toHaveAttribute('href', '/stories?language=Urdu');
      await expect(card.getByRole('heading', { name: 'Select a Story' })).toBeVisible();
      assert.equal(await card.locator('p').count(), 1, 'The card description is inside the link');
      await page.evaluate(() => { window.__routerNavigationMarker = 'preserved'; });
      const documents = state.documents.length;
      await card.click({ position: { x: 4, y: 4 } });
      await expect(page).toHaveURL(`${base}/stories?language=Urdu`);
      await expect(storyActions(page)).toHaveCount(12);
      await expectLanguage(page, 'Urdu');
      await expect(categorySelect(page)).toHaveValue('all');
      assert.equal(state.documents.length, documents, 'Card click does not reload the document');
      assert.equal(await page.evaluate(() => window.__routerNavigationMarker), 'preserved');
      const query = state.requests.at(-1).searchParams;
      assert.equal(query.get('language'), 'Urdu');
      assert.equal(query.get('page'), '1');
      assert.equal(query.get('limit'), '12');
      assert.equal(query.get('category'), null);
      assert.equal(query.get('isFeatured'), null);
      for (const category of categories) await expect(page.getByText(category.name, { exact: true })).toHaveCount(4);
    });

    await check('card is reachable by Tab, has a visible keyboard focus indicator, and Enter activates it', async ({ page, state, base }) => {
      await page.goto(base);
      const card = page.getByRole('link', { name: /Select a Story/ });
      await expect(card).toBeVisible();
      for (let step = 0; step < 60 && !(await card.evaluate((node) => node === document.activeElement)); step++) {
        await page.keyboard.press('Tab');
      }
      await expect(card).toBeFocused();
      assert.equal(await card.evaluate((node) => node.matches(':focus-visible')), true);
      const focusStyle = await card.evaluate((node) => ({ outline: getComputedStyle(node).outlineWidth, shadow: getComputedStyle(node).boxShadow }));
      assert.ok(parseFloat(focusStyle.outline) > 0 || focusStyle.shadow !== 'none', 'Keyboard focus has an outline or ring');
      const documents = state.documents.length;
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(`${base}/stories?language=Urdu`);
      await expect(storyActions(page)).toHaveCount(12);
      assert.equal(state.documents.length, documents);
    });

    await check('cards show covers, Urdu RTL text and language badge, author, category, actual prices and detail/preview routes', async ({ page, base }) => {
      await page.goto(`${base}/stories?language=Urdu`);
      await expect(storyActions(page)).toHaveCount(12);
      for (const story of urduStories.slice(0, 12)) {
        const heading = page.getByRole('heading', { name: story.title, exact: true });
        const card = page.locator('.group').filter({ has: heading }).first();
        await expect(heading).toHaveAttribute('dir', 'rtl');
        await expect(heading).toHaveAttribute('lang', 'ur');
        assert.equal(await heading.evaluate((node) => getComputedStyle(node).direction), 'rtl');
        await expect(page.getByText(story.shortDescription, { exact: true })).toHaveAttribute('dir', 'rtl');
        await expect(card.getByText(story.author, { exact: true })).toHaveAttribute('dir', 'rtl');
        await expect(card.getByText(story.author, { exact: true })).toHaveAttribute('lang', 'ur');
        await expect(card.getByText('Urdu', { exact: true })).toBeVisible();
        const cover = page.getByRole('img', { name: story.title, exact: true });
        await expect(cover).toHaveAttribute('src', story.coverImage);
        await cover.scrollIntoViewIfNeeded();
        await expect.poll(() => cover.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
        await expect(page.locator(`a[href="/story/${story.slug}"]`)).toHaveText('View Story');
        await expect(page.locator(`a[href="/story/${story.slug}/read"]`)).toHaveText('Read 2 Pages Free');
        await expect(card.getByText(story.price === 0 ? 'Free' : `PKR ${story.price.toLocaleString('en-PK')}`, { exact: true })).toBeVisible();
      }
    });

    await check('English cards use LTR text, canonical badges, honest prices and previews only when supported', async ({ page, base }) => {
      await page.goto(`${base}/stories?language=English`);
      await expect(storyActions(page)).toHaveCount(3);
      for (const [index, story] of englishStories.entries()) {
        const heading = page.getByRole('heading', { name: story.title, exact: true });
        const card = page.locator('.group').filter({ has: heading }).first();
        for (const text of [heading, card.getByText(story.shortDescription, { exact: true }), card.getByText(story.author, { exact: true })]) {
          await expect(text).toHaveAttribute('dir', 'ltr');
          await expect(text).toHaveAttribute('lang', 'en');
        }
        await expect(card.getByText('English', { exact: true })).toBeVisible();
        await expect(card.getByText(index === 0 ? 'Free' : index === 1 ? 'PKR 249' : 'Price unavailable', { exact: true })).toBeVisible();
        await expect(card.getByRole('link', { name: 'View Story', exact: true })).toHaveAttribute('href', `/story/${story.slug}`);
        if (index === 2) {
          await expect(card.locator('a[href$="/read"]')).toHaveCount(0);
          await expect(card.getByText('Free', { exact: true })).toHaveCount(0);
        } else {
          await expect(card.getByRole('link', { name: index === 0 ? 'Read 2 Pages Free' : 'Read Free Preview', exact: true }))
            .toHaveAttribute('href', `/story/${story.slug}/read`);
        }
      }
    });

    await check('pagination reaches every fixture and preserves Urdu in URLs, refresh, back and forward', async ({ page, state, base }) => {
      await page.goto(`${base}/stories?language=Urdu`);
      const seen = new Set();
      for (let pageNumber = 1; pageNumber <= 3; pageNumber++) {
        await expect(page.getByRole('heading', { name: urduStories[(pageNumber - 1) * 12].title, exact: true })).toBeVisible();
        await expect(storyActions(page)).toHaveCount(pageNumber === 3 ? 1 : 12);
        for (const href of await storyActions(page).evaluateAll((links) => links.map((link) => link.getAttribute('href')))) seen.add(href);
        await expectLanguage(page, 'Urdu');
        assert.equal(params(page).get('language'), 'Urdu');
        if (pageNumber < 3) {
          await page.getByRole('button', { name: 'Next page', exact: true }).click();
          await expect.poll(() => params(page).get('page')).toBe(String(pageNumber + 1));
        }
      }
      assert.equal(seen.size, 25, 'Every fixture is reachable through pagination');
      await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
      await page.goBack();
      await expect.poll(() => params(page).get('page')).toBe('2');
      await expect(page.getByRole('heading', { name: urduStories[12].title, exact: true })).toBeVisible();
      await page.goForward();
      await expect.poll(() => params(page).get('page')).toBe('3');
      await expect(storyActions(page)).toHaveCount(1);
      await page.reload();
      await expect(storyActions(page)).toHaveCount(1);
      await expectLanguage(page, 'Urdu');
      assert.equal(params(page).get('page'), '3');
      assert.equal(state.requests.at(-1).searchParams.get('language'), 'Urdu');
      assert.equal(state.requests.at(-1).searchParams.get('page'), '3');
      await page.goto(`${base}/stories?language=Urdu&page=2`);
      await expect(page.getByRole('heading', { name: urduStories[12].title, exact: true })).toBeVisible();
      await expectLanguage(page, 'Urdu');
    });

    await check('direct language aliases normalize and filter changes reset pagination while history restores selection', async ({ page, state, base }) => {
      for (const value of ['urdu', 'URDU', 'اردو', 'ur', ' Urdu ']) {
        await page.goto(`${base}/stories?language=${encodeURIComponent(value)}`);
        await expect(storyActions(page)).toHaveCount(12);
        await expectLanguage(page, 'Urdu');
        await expect(page).toHaveURL(`${base}/stories?language=Urdu`);
        assert.equal(state.requests.at(-1).searchParams.get('language'), 'Urdu');
      }
      for (const value of ['english', 'ENGLISH', 'en', ' English ']) {
        await page.goto(`${base}/stories?language=${encodeURIComponent(value)}`);
        await expect(storyActions(page)).toHaveCount(3);
        await expectLanguage(page, 'English');
        await expect(page).toHaveURL(`${base}/stories?language=English`);
        assert.equal(state.requests.at(-1).searchParams.get('language'), 'English');
      }
      await page.goto(`${base}/stories?language=Urdu&page=2`);
      await expect(storyActions(page)).toHaveCount(12);
      await languageLink(page, 'English').click();
      await expect(page.getByRole('heading', { name: englishStories[0].title })).toBeVisible();
      assert.equal(params(page).get('language'), 'English');
      assert.ok(!params(page).get('page') || params(page).get('page') === '1');
      await page.goBack();
      await expectLanguage(page, 'Urdu');
      await expect(page.getByRole('heading', { name: urduStories[12].title, exact: true })).toBeVisible();
      await categorySelect(page).selectOption('fixture-classics');
      await expect(storyActions(page)).toHaveCount(8);
      assert.equal(params(page).get('category'), 'fixture-classics');
      assert.equal(params(page).get('language'), 'Urdu');
      assert.ok(!params(page).get('page') || params(page).get('page') === '1');
      await page.reload();
      await expect(categorySelect(page)).toHaveValue('fixture-classics');
      await expectLanguage(page, 'Urdu');
      await expect(storyActions(page)).toHaveCount(8);
    });

    await check('switching language preserves other applied filters and Reset All Filters clears every query parameter', async ({ page, state, base }) => {
      await page.goto(`${base}/stories?language=Urdu&page=2&search=Fixture&category=fixture-classics&minPrice=100&maxPrice=2000&sort=price-asc&pricing=paid`);
      await expect(storyActions(page)).toHaveCount(8);
      const englishHref = new URL(await languageLink(page, 'English').getAttribute('href'), base);
      assert.equal(englishHref.searchParams.get('page'), null);
      for (const [key, value] of Object.entries({ language: 'English', search: 'Fixture', category: 'fixture-classics', minPrice: '100', maxPrice: '2000', sort: 'price-asc', pricing: 'paid' })) {
        assert.equal(englishHref.searchParams.get(key), value);
      }
      await languageLink(page, 'English').click();
      await expect(storyActions(page)).toHaveCount(1);
      await expectLanguage(page, 'English');
      await expect(page.getByRole('textbox', { name: 'Search stories', exact: true })).toHaveValue('Fixture');
      await expect(categorySelect(page)).toHaveValue('fixture-classics');
      await expect(page.getByRole('spinbutton', { name: 'Minimum price in PKR' })).toHaveValue('100');
      await expect(page.getByRole('spinbutton', { name: 'Maximum price in PKR' })).toHaveValue('2000');
      await page.getByRole('button', { name: 'Reset All Filters', exact: true }).first().click();
      await expect(page).toHaveURL(`${base}/stories`);
      await expectLanguage(page, 'all');
      await expect(storyActions(page)).toHaveCount(12);
      await expect(page.getByRole('textbox', { name: 'Search stories', exact: true })).toHaveValue('');
      await expect(categorySelect(page)).toHaveValue('all');
      await expect(page.getByRole('spinbutton', { name: 'Minimum price in PKR' })).toHaveValue('');
      await expect(page.getByRole('spinbutton', { name: 'Maximum price in PKR' })).toHaveValue('');
      await expect(page.getByLabel('Sort By:', { exact: true })).toHaveValue('newest');
      assert.deepEqual([...state.requests.at(-1).searchParams.keys()].sort(), ['limit', 'page', 'sort']);
    });

    await check('loading placeholders transition to records; failed requests have working Retry', async ({ page, state, base }) => {
      state.gate = deferred();
      await page.goto(`${base}/stories?language=Urdu`);
      await expect(page.locator('.animate-pulse').first()).toBeVisible();
      await expect(storyActions(page)).toHaveCount(0);
      state.gate.resolve();
      state.gate = null;
      await expect(storyActions(page)).toHaveCount(12);
      state.mode = 'error';
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Could Not Load Stories' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
      state.mode = 'success';
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await expect(storyActions(page)).toHaveCount(12);
      await expectLanguage(page, 'Urdu');
      assert.equal(state.requests.at(-1).searchParams.get('language'), 'Urdu');
    });

    await check('a globally empty catalogue has its own state for all three language selections', async ({ page, state, base }) => {
      state.mode = 'empty';
      for (const language of ['all', 'Urdu', 'English']) {
        await page.goto(`${base}/stories${language === 'all' ? '' : `?language=${language}`}`);
        await expect(page.getByRole('heading', { name: 'No published stories yet', exact: true })).toBeVisible();
        await expect(storyActions(page)).toHaveCount(0);
        await expectLanguage(page, language);
        await expect(page.getByRole('button', { name: 'Next page', exact: true })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'No stories match your criteria', exact: true })).toHaveCount(0);
        if (language !== 'all') await expect(page.getByRole('link', { name: 'Browse All Stories', exact: true })).toHaveAttribute('href', '/stories');
      }
    });

    await check('a language with no published stories retains selection and offers Browse All Stories without showing fallback records', async ({ page, state, base }) => {
      for (const language of ['Urdu', 'English']) {
        state.mode = language === 'Urdu' ? 'urdu-empty' : 'english-empty';
        await page.goto(`${base}/stories?language=${language}`);
        await expect(page.getByRole('heading', { name: `No ${language} stories available`, exact: true })).toBeVisible();
        await expectLanguage(page, language);
        await expect(storyActions(page)).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'No published stories yet', exact: true })).toHaveCount(0);
        const probe = state.requests.at(-1).searchParams;
        assert.equal(probe.get('language'), null);
        assert.equal(probe.get('page'), '1');
        assert.equal(probe.get('limit'), '1');
        const browse = page.getByRole('link', { name: 'Browse All Stories', exact: true });
        await expect(browse).toHaveAttribute('href', '/stories');
        await browse.click();
        await expect(page).toHaveURL(`${base}/stories`);
        await expectLanguage(page, 'all');
        await expect(storyActions(page)).toHaveCount(language === 'Urdu' ? 3 : 12);
      }
    });

    await check('search and category zero matches have a reset state distinct from an empty catalogue', async ({ page, state, base }) => {
      for (const query of ['search=does-not-match', 'language=Urdu&category=missing-category', 'language=English&search=does-not-match']) {
        await page.goto(`${base}/stories?${query}`);
        await expect(page.getByRole('heading', { name: 'No stories match your criteria', exact: true })).toBeVisible();
        await expect(storyActions(page)).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'No published stories yet', exact: true })).toHaveCount(0);
        if (params(page).has('language')) await expect(page.getByRole('link', { name: 'Browse All Stories', exact: true })).toHaveAttribute('href', '/stories');
        const probe = state.requests.at(-1).searchParams;
        assert.equal(probe.get('limit'), '1');
        assert.equal(probe.get('search'), null);
        assert.equal(probe.get('category'), null);
        await page.getByRole('button', { name: 'Reset All Filters', exact: true }).last().click();
        await expect(page).toHaveURL(`${base}/stories`);
        await expect(storyActions(page)).toHaveCount(12);
        await expectLanguage(page, 'all');
      }
    });

    await check('a delayed old Urdu request cannot overwrite a newly selected language', async ({ page, state, base }) => {
      state.gate = deferred();
      await page.goto(`${base}/stories?language=Urdu`);
      await expect.poll(() => state.requests.some((url) => url.searchParams.get('language') === 'Urdu')).toBe(true);
      await languageLink(page, 'English').click();
      await expect(page.getByRole('heading', { name: englishStories[0].title })).toBeVisible();
      state.gate.resolve();
      state.gate = null;
      await expectLanguage(page, 'English');
      await expect(storyActions(page)).toHaveCount(3);
      await expect(page.getByRole('heading', { name: urduStories[0].title, exact: true })).toHaveCount(0);
      assert.equal(params(page).get('language'), 'English');
    });

    await check('out-of-range catalogue links recover the last page and invalid page values recover page one', async ({ page, state, base }) => {
      await page.goto(`${base}/stories?language=Urdu&page=999`);
      await expect.poll(() => params(page).get('page')).toBe('3');
      await expect(page.getByRole('heading', { name: urduStories[24].title, exact: true })).toBeVisible();
      await expect(storyActions(page)).toHaveCount(1);
      await expectLanguage(page, 'Urdu');
      await page.reload();
      await expect(storyActions(page)).toHaveCount(1);
      assert.equal(state.requests.at(-1).searchParams.get('page'), '3');
      await page.goto(`${base}/stories?language=Urdu&page=invalid`);
      await expect(page.getByRole('heading', { name: urduStories[0].title, exact: true })).toBeVisible();
      assert.equal(state.requests.at(-1).searchParams.get('page'), '1');
    });

    await check('mobile Urdu card keeps both full action labels visible without horizontal overflow', async ({ page, base }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${base}/stories?language=Urdu`);
      await expect(storyActions(page)).toHaveCount(12);
      for (const language of ['all', 'Urdu', 'English']) await expect(languageLink(page, language)).toBeVisible();
      const selectorBounds = await languageNav(page).boundingBox();
      assert.ok(selectorBounds.x >= 0 && selectorBounds.x + selectorBounds.width <= 390, 'All language options fit the mobile viewport');
      const heading = page.getByRole('heading', { name: urduStories[0].title, exact: true });
      const card = page.locator('.group').filter({ has: heading }).first();
      await card.scrollIntoViewIfNeeded();
      await expect(card.getByRole('link', { name: 'View Story', exact: true })).toBeVisible();
      await expect(card.getByRole('link', { name: 'Read 2 Pages Free', exact: true })).toBeVisible();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await mkdir(new URL('../.work/', import.meta.url), { recursive: true });
      await card.screenshot({ path: fileURLToPath(new URL('../.work/urdu-story-mobile.png', import.meta.url)) });
    });
  } finally {
    if (browser) await browser.close();
    if (production) await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()));
    else await server.close();
  }
});
