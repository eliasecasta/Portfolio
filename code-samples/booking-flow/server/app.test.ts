import request from 'supertest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { BookingStore } from './bookingStore';

const slot = { id: 'a', title: 'Session A', startsAt: '2030-01-01T18:00:00.000Z', capacity: 1 };
const id1 = 'f8eb4e70-8231-40bc-a5d4-8191ce2b872f';
const id2 = 'a83bead1-5e1a-4c11-bf54-b0c0f4fbc963';

function makeApp() {
  return createApp(new BookingStore([slot], () => 'booking-1'));
}

describe('booking HTTP API', () => {
  it('lists available sessions', async () => {
    const response = await request(makeApp()).get('/api/slots');
    expect(response.status).toBe(200);
    expect(response.body.slots).toMatchObject([{ id: 'a', remaining: 1 }]);
  });

  it('validates request bodies and rejects extra fields', async () => {
    const response = await request(makeApp()).post('/api/bookings').send({
      slotId: 'a', email: 'invalid', requestId: id1, unexpected: true,
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates a reservation and safely handles a retry', async () => {
    const app = makeApp();
    const body = { slotId: 'a', email: 'a@example.com', requestId: id1 };
    const first = await request(app).post('/api/bookings').send(body);
    const retry = await request(app).post('/api/bookings').send(body);

    expect(first.status).toBe(201);
    expect(retry.status).toBe(200);
    expect(retry.body.booking.id).toBe(first.body.booking.id);
    expect((await request(app).get('/api/slots')).body.slots[0].remaining).toBe(0);
  });

  it('returns 404 for an unknown session', async () => {
    const response = await request(makeApp()).post('/api/bookings').send({
      slotId: 'unknown', email: 'a@example.com', requestId: id1,
    });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('SLOT_NOT_FOUND');
  });

  it('returns 409 when a session is full', async () => {
    const app = makeApp();
    await request(app).post('/api/bookings').send({ slotId: 'a', email: 'a@example.com', requestId: id1 });
    const response = await request(app).post('/api/bookings').send({
      slotId: 'a', email: 'b@example.com', requestId: id2,
    });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('SLOT_FULL');
  });

  it('resets shared demo data and permits the same booking again', async () => {
    const app = makeApp();
    const body = { slotId: 'a', email: 'a@example.com', requestId: id1 };
    await request(app).post('/api/bookings').send(body);
    expect((await request(app).post('/api/reset')).status).toBe(200);
    expect((await request(app).get('/api/slots')).body.slots[0].remaining).toBe(1);
    expect((await request(app).post('/api/bookings').send(body)).status).toBe(201);
  });

  it('returns JSON for unknown API paths', async () => {
    const response = await request(makeApp()).get('/api/missing');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('serves static files and the SPA fallback without swallowing API 404s', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'minibooker-'));
    try {
      writeFileSync(path.join(dir, 'index.html'), '<html>Demo</html>');
      writeFileSync(path.join(dir, 'asset.js'), 'demoAsset');
      const app = createApp(new BookingStore([slot]), dir);
      expect((await request(app).get('/asset.js')).text).toBe('demoAsset');
      expect((await request(app).get('/refresh')).text).toContain('Demo');
      expect((await request(app).get('/api/missing')).body.error.code).toBe('NOT_FOUND');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
