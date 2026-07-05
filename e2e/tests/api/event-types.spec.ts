import { test, expect } from '@playwright/test';

const API = 'http://localhost:3000';

test.describe('GET /event-types', () => {
  test('returns list of event types', async ({ request }) => {
    const res = await request.get(`${API}/event-types`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe('POST /event-types', () => {
  test('creates event type and returns 201 with id', async ({ request }) => {
    const body = {
      title: '30 Min Meeting',
      description: 'Quick sync',
      durationMinutes: 30,
    };

    const res = await request.post(`${API}/event-types`, { data: body });
    expect(res.status()).toBe(201);

    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(typeof data.id).toBe('string');
    expect(data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(data.title).toBe(body.title);
    expect(data.description).toBe(body.description);
    expect(data.durationMinutes).toBe(body.durationMinutes);
  });

  test('returns 400 when required field is missing', async ({ request }) => {
    const res = await request.post(`${API}/event-types`, {
      data: { description: 'no title', durationMinutes: 15 },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('GET /event-types/:id', () => {
  test('returns existing event type', async ({ request }) => {
    const createRes = await request.post(`${API}/event-types`, {
      data: { title: 'Test', description: 'Desc', durationMinutes: 15 },
    });
    const created = await createRes.json();

    const res = await request.get(`${API}/event-types/${created.id}`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(created.id);
    expect(data.title).toBe('Test');
  });

  test('returns 404 for non-existing event type', async ({ request }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request.get(`${API}/event-types/${fakeId}`);
    expect(res.status()).toBe(404);

    const data = await res.json();
    expect(data.code).toBe(404);
    expect(data.message).toBe('Event type not found');
  });
});

test.describe('GET /event-types/:id/slots', () => {
  test('returns slots for existing event type', async ({ request }) => {
    const createRes = await request.post(`${API}/event-types`, {
      data: { title: 'Meeting', description: 'Desc', durationMinutes: 60 },
    });
    const created = await createRes.json();

    const res = await request.get(`${API}/event-types/${created.id}/slots`);
    expect(res.status()).toBe(200);

    const slots: Array<{ startTime: string; endTime: string }> =
      await res.json();
    expect(Array.isArray(slots)).toBe(true);

    for (const slot of slots) {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);

      const diffMs = end.getTime() - start.getTime();
      expect(diffMs).toBe(created.durationMinutes * 60 * 1000);

      const dayUtc = start.getUTCDay();
      expect([1, 2, 3, 4, 5]).toContain(dayUtc);

      const hourUtc = start.getUTCHours();
      expect(hourUtc).toBeGreaterThanOrEqual(9);
      expect(hourUtc).toBeLessThan(18);
    }
  });

  test('returns empty array for non-existing event type', async ({ request }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request.get(`${API}/event-types/${fakeId}/slots`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
