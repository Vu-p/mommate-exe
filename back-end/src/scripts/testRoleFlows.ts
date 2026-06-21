import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../config/db.js';

type Session = { _id: string; role: string; token: string };

const password = process.env.DEMO_SEED_PASSWORD || 'Demo@123456';

const run = async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('Integration smoke test is disabled in production');
  await connectDB();
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Cannot resolve integration server port');
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  const request = async (path: string, options: RequestInit = {}, token?: string) => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const text = await response.text();
    let body: any = text;
    try { body = text ? JSON.parse(text) : null; } catch { /* keep text response */ }
    return { response, body };
  };

  const login = async (email: string) => {
    const { response, body } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    assert.equal(response.status, 200, `Login failed for ${email}: ${JSON.stringify(body)}`);
    return body as Session;
  };

  try {
    const [parent, carer, admin] = await Promise.all([
      login('parent.demo@mommate.local'),
      login('carer.demo@mommate.local'),
      login('admin.demo@mommate.local'),
    ]);
    assert.equal(parent.role, 'parent');
    assert.equal(carer.role, 'carer');
    assert.equal(admin.role, 'admin');

    const parentBookings = await request('/bookings/my?page=1&limit=20', {}, parent.token);
    assert.equal(parentBookings.response.status, 200);
    assert.ok(parentBookings.body.items.length >= 2, 'Seeded parent should have bookings');

    const carerBookings = await request('/bookings/my?page=1&limit=20', {}, carer.token);
    assert.equal(carerBookings.response.status, 200);
    assert.ok(carerBookings.body.items.length >= 2, 'Seeded carer should have assigned bookings');

    const ownBooking = parentBookings.body.items[0];
    const ownDetail = await request(`/bookings/${ownBooking._id}`, {}, parent.token);
    assert.equal(ownDetail.response.status, 200);

    const refundStatus = await request(`/bookings/${ownBooking._id}/refund-status`, {}, parent.token);
    assert.equal(refundStatus.response.status, 200);
    assert.equal(refundStatus.body.bookingId, ownBooking._id);

    const forbiddenAdmin = await request('/admin/audit-logs?page=1&limit=1', {}, parent.token);
    assert.equal(forbiddenAdmin.response.status, 403);

    const adminBookings = await request('/bookings?page=1&limit=50', {}, admin.token);
    assert.equal(adminBookings.response.status, 200);
    const foreignBooking = adminBookings.body.items.find((booking: any) => String(booking.parent?._id || booking.parent) !== parent._id);
    if (foreignBooking) {
      const forbiddenBooking = await request(`/bookings/${foreignBooking._id}`, {}, parent.token);
      assert.equal(forbiddenBooking.response.status, 403);
    }

    for (const path of ['/admin/booking-change-requests?page=1&limit=5', '/admin/refunds?page=1&limit=5', '/admin/audit-logs?page=1&limit=5']) {
      const result = await request(path, {}, admin.token);
      assert.equal(result.response.status, 200, `${path} should be accessible to admin`);
      assert.ok(Array.isArray(result.body.items));
    }

    const completedBooking = adminBookings.body.items.find((item: any) => item.status === 'completed');
    if (completedBooking) {
      const invalidTransition = await request(`/bookings/${completedBooking._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }),
      }, admin.token);
      assert.equal(invalidTransition.response.status, 409, 'Invalid transition must require an audited override');
    }

    const pdfResponse = await fetch(`${baseUrl}/analytics/reconciliation/export.pdf`, {
      headers: { authorization: `Bearer ${admin.token}` },
    });
    assert.equal(pdfResponse.status, 200);
    assert.match(pdfResponse.headers.get('content-type') || '', /application\/pdf/);
    const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());
    assert.equal(Buffer.from(pdfBytes.subarray(0, 4)).toString(), '%PDF');

    const incidents = await request('/incidents?page=1&limit=1', {}, admin.token);
    if (incidents.body.items?.[0]) {
      const incidentId = incidents.body.items[0]._id;
      const adminConversation = await request(`/messages/incidents/${incidentId}/conversation`, { method: 'POST' }, admin.token);
      assert.equal(adminConversation.response.status, 200);
      const parentConversation = await request(`/messages/incidents/${incidentId}/conversation`, { method: 'POST' }, parent.token);
      assert.equal(parentConversation.response.status, 403);
    }

    console.log(`Role integration OK: parent=${parentBookings.body.pagination.total}, carer=${carerBookings.body.pagination.total}, admin workflows=3, PDF=true`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await mongoose.disconnect();
  }
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
