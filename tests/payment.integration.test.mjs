import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clientRoot = fileURLToPath(new URL('../', import.meta.url));
const requireServer = createRequire(new URL('../../server/package.json', import.meta.url));
const { MongoMemoryReplSet } = requireServer('mongodb-memory-server');
const mongoose = requireServer('mongoose');
const express = requireServer('express');
const jwt = requireServer('jsonwebtoken');
const cookieParser = requireServer('cookie-parser');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

test('manual payments and private library use an isolated replica set', { timeout: 180000 }, async (t) => {
  const uploads = await fs.mkdtemp(path.join(clientRoot, '.work', 'payment-test-'));
  process.env.NODE_ENV = 'test';
  process.env.UPLOADS_ROOT = uploads;
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const [
    { User }, { Story }, { Category }, { Payment }, { Entitlement }, { PaymentSetting }, { AuditLog },
    { default: paymentRoutes }, { default: userRoutes }
  ] = await Promise.all([
    import('../../server/models/User.js'), import('../../server/models/Story.js'), import('../../server/models/Category.js'),
    import('../../server/models/Payment.js'), import('../../server/models/Entitlement.js'), import('../../server/models/PaymentSetting.js'),
    import('../../server/models/AuditLog.js'), import('../../server/routes/paymentRoutes.js'), import('../../server/routes/userRoutes.js')
  ]);
  let repl;
  let server;
  try {
    repl = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
    await mongoose.connect(repl.getUri(), { dbName: 'qissaghar_payment_integration' });
    await Promise.all([User, Story, Category, Payment, Entitlement, PaymentSetting, AuditLog].map((model) => model.init()));
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/payments', paymentRoutes);
    app.use('/api/users', userRoutes);
    app.use((error, req, res, next) => res.status(error.status || 400).json({ success: false, message: error.message }));
    server = await new Promise((resolve) => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    const base = `http://127.0.0.1:${server.address().port}`;
    const admin = await User.create({ name: 'Test Admin', email: 'admin@integration.invalid', passwordHash: 'unused-test-password', role: 'admin' });
    const buyer = await User.create({ name: 'Test Buyer', email: 'buyer@integration.invalid', passwordHash: 'unused-test-password' });
    const other = await User.create({ name: 'Other Buyer', email: 'other@integration.invalid', passwordHash: 'unused-test-password' });
    const category = await Category.create({ name: 'Integration', slug: 'integration' });
    const createStory = (suffix) => Story.create({ title: `Story ${suffix}`, slug: `story-${suffix}`, author: 'Test', category: category._id,
      shortDescription: 'Test story', description: 'Integration fixture', price: 125, coverImage: '/uploads/covers/fixture.png',
      previewPdf: 'uploads/previews/fixture.pdf', privateFullPdf: 'uploads/private_pdfs/fixture.pdf', totalPages: 4, status: 'published' });
    const story = await createStory('one');
    const secondStory = await createStory('two');
    const token = (user) => jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const call = async (route, { user, method = 'GET', body, binary = false } = {}) => {
      const headers = { 'X-QissaGhar-Request': '1' };
      if (user) headers.Authorization = `Bearer ${token(user)}`;
      if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
      const response = await fetch(base + route, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
      return { status: response.status, headers: response.headers, data: binary ? Buffer.from(await response.arrayBuffer()) : await response.json() };
    };
    let sequence = 0;
    const submission = (overrides = {}) => {
      const form = new FormData();
      const values = { storyId: String(story._id), amount: '125', paymentMethod: 'easypaisa', senderName: 'Test Buyer', senderPhone: '03189999888', transactionId: `TEST_${++sequence}`, ...overrides };
      for (const [key, value] of Object.entries(values)) if (value !== undefined) form.append(key, value);
      form.append('screenshot', new Blob([png], { type: 'image/png' }), 'receipt.png');
      return form;
    };
    const submit = (user = buyer, overrides) => call('/api/payments', { method: 'POST', user, body: submission(overrides) });
    let firstPayment;

    await t.test('methods GET never seeds accounts; only admins can configure enabled real accounts', async () => {
      assert.deepEqual((await call('/api/payments/methods')).data.data, []);
      assert.equal(await PaymentSetting.countDocuments(), 0);
      assert.equal((await call('/api/payments/admin/settings/easypaisa', { method: 'PUT', user: buyer, body: {} })).status, 403);
      assert.equal((await call('/api/payments/admin/settings/easypaisa', { method: 'PUT', user: admin, body: { isEnabled: true, accountTitle: 'Demo', accountNumber: '0300-1234567' } })).status, 400);
      assert.equal((await call('/api/payments/admin/settings/easypaisa', { method: 'PUT', user: admin, body: { isEnabled: true, accountTitle: 'Isolated Test Only', accountNumber: '03189999888' } })).status, 200);
      assert.equal((await call('/api/payments/admin/settings/jazzcash', { method: 'PUT', user: admin, body: { isEnabled: false } })).status, 200);
      assert.equal((await call('/api/payments/methods')).data.data.length, 1);
      assert.equal((await call('/api/payments/methods', { user: admin })).data.data.length, 2);
    });

    await t.test('submission rejects wrong/missing price, disabled methods, invalid inputs; unused receipts are deleted', async () => {
      for (const fields of [{ amount: '1' }, { amount: undefined }, { paymentMethod: 'jazzcash' }, { storyId: 'bad-id' }, { transactionId: '   ' }, { senderName: ' ' }, { paymentDate: 'invalid' }]) {
        const response = await submit(buyer, fields);
        assert.ok([400, 409].includes(response.status), `Unexpected status ${response.status}`);
      }
      assert.equal(await Payment.countDocuments(), 0);
      assert.deepEqual(await fs.readdir(path.join(uploads, 'screenshots')), []);
    });

    await t.test('receipts remain pending, never grant access, and are private to owner and admin', async () => {
      const response = await submit(buyer, { status: 'Approved', user: String(other._id) });
      assert.equal(response.status, 201);
      firstPayment = response.data.data;
      assert.equal(firstPayment.status, 'Pending');
      assert.equal(firstPayment.amount, 125);
      assert.equal(firstPayment.user, String(buyer._id));
      assert.equal(firstPayment.screenshot, `/api/payments/${firstPayment._id}/screenshot`);
      assert.equal(await Entitlement.countDocuments(), 0);
      const receiptRoute = `/api/payments/${firstPayment._id}/screenshot`;
      assert.equal((await call(receiptRoute)).status, 401);
      assert.equal((await call(receiptRoute, { user: other })).status, 404);
      assert.equal((await call(`/api/payments/${firstPayment._id}`, { user: other })).status, 404);
      for (const user of [buyer, admin]) {
        const receipt = await call(receiptRoute, { user, binary: true });
        assert.equal(receipt.status, 200);
        assert.match(receipt.headers.get('cache-control'), /private, no-store/);
        assert.match(receipt.headers.get('content-type'), /image\/png/);
        assert.deepEqual(receipt.data, png);
      }
      assert.deepEqual((await call('/api/users/me/library', { user: buyer })).data.data, []);
      assert.equal((await call(`/api/payments/admin/${firstPayment._id}/approve`, { method: 'PATCH', user: buyer })).status, 403);
    });

    await t.test('duplicates and concurrent pending requests are enforced by database uniqueness', async () => {
      assert.equal((await submit(buyer)).status, 409);
      assert.equal((await submit(other, { transactionId: firstPayment.transactionId.toLowerCase() })).status, 409);
      const concurrent = await Promise.all([submit(other), submit(other)]);
      assert.deepEqual(concurrent.map((response) => response.status).sort(), [201, 409]);
      assert.equal(await Payment.countDocuments({ user: other._id, story: story._id, status: 'Pending' }), 1);
      const duplicate = { user: buyer._id, story: secondStory._id, amount: 125, paymentMethod: 'easypaisa', senderName: 'Test Buyer', senderPhone: '03189999888', transactionId: firstPayment.transactionId.toLowerCase(), screenshot: 'receipt.png' };
      await assert.rejects(Payment.create(duplicate), { code: 11000 });
    });

    await t.test('approval atomically unlocks only the purchased story for its buyer', async () => {
      const response = await call(`/api/payments/admin/${firstPayment._id}/approve`, { method: 'PATCH', user: admin });
      assert.equal(response.status, 200);
      assert.equal(response.data.data.status, 'Approved');
      const entitlement = await Entitlement.findOne({ user: buyer._id, story: story._id });
      assert.equal(String(entitlement.payment), firstPayment._id);
      assert.equal(entitlement.accessStatus, 'active');
      assert.equal(await Entitlement.countDocuments({ user: buyer._id, story: secondStory._id }), 0);
      assert.equal(await Entitlement.countDocuments({ user: other._id }), 0);
      const library = (await call('/api/users/me/library', { user: buyer })).data.data;
      assert.equal(library.length, 1);
      assert.equal(library[0]._id, String(story._id));
      assert.equal(library[0].privateFullPdf, undefined);
      assert.equal(await AuditLog.countDocuments({ entityId: firstPayment._id, action: 'APPROVE_PAYMENT' }), 1);
      assert.equal((await call(`/api/payments/admin/${firstPayment._id}/approve`, { method: 'PATCH', user: admin })).status, 409);
      assert.equal((await call(`/api/payments/admin/${firstPayment._id}/reject`, { method: 'PATCH', user: admin, body: { reason: 'Already reviewed' } })).status, 409);
    });

    await t.test('rejection never unlocks content and cannot later be approved', async () => {
      const payment = await Payment.findOne({ user: other._id, status: 'Pending' });
      const route = `/api/payments/admin/${payment._id}`;
      assert.equal((await call(`${route}/reject`, { method: 'PATCH', user: admin, body: { reason: '' } })).status, 400);
      assert.equal((await call(`${route}/reject`, { method: 'PATCH', user: admin, body: { reason: 'Transaction not found in account' } })).status, 200);
      assert.equal((await call(`${route}/approve`, { method: 'PATCH', user: admin })).status, 409);
      assert.equal(await Entitlement.countDocuments({ user: other._id }), 0);
    });

    await t.test('simultaneous approve/reject produces exactly one final state and consistent entitlement', async () => {
      const pending = await submit(other, { storyId: String(secondStory._id) });
      assert.equal(pending.status, 201);
      const id = pending.data.data._id;
      const results = await Promise.all([
        call(`/api/payments/admin/${id}/approve`, { method: 'PATCH', user: admin }),
        call(`/api/payments/admin/${id}/reject`, { method: 'PATCH', user: admin, body: { reason: 'Conflicting review test' } })
      ]);
      assert.deepEqual(results.map((response) => response.status).sort(), [200, 409]);
      const payment = await Payment.findById(id);
      assert.equal(await Entitlement.countDocuments({ payment: id, accessStatus: 'active' }), payment.status === 'Approved' ? 1 : 0);
      assert.equal(await AuditLog.countDocuments({ entityId: id }), 1);
    });

    await t.test('approval failure rolls back status and does not create access or audit records', async () => {
      const draft = await createStory('unavailable');
      const pending = await submit(buyer, { storyId: String(draft._id) });
      assert.equal(pending.status, 201);
      await Story.updateOne({ _id: draft._id }, { status: 'draft' });
      const id = pending.data.data._id;
      assert.equal((await call(`/api/payments/admin/${id}/approve`, { method: 'PATCH', user: admin })).status, 409);
      assert.equal((await Payment.findById(id)).status, 'Pending');
      assert.equal(await Entitlement.countDocuments({ payment: id }), 0);
      assert.equal(await AuditLog.countDocuments({ entityId: id }), 0);
    });

    await t.test('library excludes revoked, unpublished, deleted and inconsistent purchase records', async () => {
      await Entitlement.updateOne({ user: buyer._id, story: story._id }, { accessStatus: 'revoked' });
      assert.deepEqual((await call('/api/users/me/library', { user: buyer })).data.data, []);
      await Entitlement.updateOne({ user: buyer._id, story: story._id }, { accessStatus: 'active' });
      await Story.updateOne({ _id: story._id }, { status: 'draft' });
      assert.deepEqual((await call('/api/users/me/library', { user: buyer })).data.data, []);
      await Story.updateOne({ _id: story._id }, { status: 'published' });
      await Entitlement.updateOne({ user: buyer._id, story: story._id }, { payment: new mongoose.Types.ObjectId() });
      assert.deepEqual((await call('/api/users/me/library', { user: buyer })).data.data, []);
      await Entitlement.updateOne({ user: buyer._id, story: story._id }, { payment: firstPayment._id });
      await Story.deleteOne({ _id: story._id });
      assert.deepEqual((await call('/api/users/me/library', { user: buyer })).data.data, []);
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    if (repl) await repl.stop();
    const workspace = path.resolve(clientRoot, '.work');
    assert.equal(path.dirname(path.resolve(uploads)), workspace);
    await fs.rm(uploads, { recursive: true, force: true });
  }
});
