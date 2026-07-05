import { test, expect, type APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3000';

async function createEventType(
  request: APIRequestContext,
  title = 'Test Meeting',
  durationMinutes = 30,
) {
  const res = await request.post(`${API}/event-types`, {
    data: { title, description: 'For testing', durationMinutes },
  });
  return res.json();
}

async function getFirstSlot(
  request: APIRequestContext,
  eventTypeId: string,
): Promise<{ startTime: string; endTime: string } | null> {
  const res = await request.get(`${API}/event-types/${eventTypeId}/slots`);
  const slots: Array<{ startTime: string; endTime: string }> = await res.json();
  return slots.length > 0 ? slots[0] : null;
}

test.describe('POST /bookings', () => {
  test('creates booking successfully and returns 201', async ({ request }) => {
    const et = await createEventType(request, 'Quick Call', 30);
    const slot = await getFirstSlot(request, et.id);

    if (!slot) {
      test.skip(true, 'No slots available');
      return;
    }

    const res = await request.post(`${API}/bookings`, {
      data: {
        eventTypeId: et.id,
        startTime: slot.startTime,
        guestName: 'John',
        guestEmail: 'john@example.com',
      },
    });

    expect(res.status()).toBe(201);

    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.eventTypeId).toBe(et.id);
    expect(data.startTime).toBe(slot.startTime);
    expect(data.guestName).toBe('John');
    expect(data.guestEmail).toBe('john@example.com');
    expect(data).toHaveProperty('createdAt');
  });

  test('returns 409 when slot is already booked (conflict)', async ({
    request,
  }) => {
    const et = await createEventType(request, 'Conflict Test', 30);
    const slot = await getFirstSlot(request, et.id);

    if (!slot) {
      test.skip(true, 'No slots available');
      return;
    }

    const bookingData = {
      eventTypeId: et.id,
      startTime: slot.startTime,
      guestName: 'Alice',
      guestEmail: 'alice@example.com',
    };

    const first = await request.post(`${API}/bookings`, {
      data: bookingData,
    });
    expect(first.status()).toBe(201);

    const second = await request.post(`${API}/bookings`, {
      data: bookingData,
    });
    expect(second.status()).toBe(409);

    const body = await second.json();
    expect(body.code).toBe(409);
    expect(body.message).toBe('Time slot is already booked');
  });

  test('returns 409 when eventTypeId does not exist', async ({ request }) => {
    const fakeEventTypeId = '00000000-0000-0000-0000-000000000000';
    const now = new Date().toISOString();

    const res = await request.post(`${API}/bookings`, {
      data: {
        eventTypeId: fakeEventTypeId,
        startTime: now,
        guestName: 'Ghost',
        guestEmail: 'ghost@example.com',
      },
    });

    expect(res.status()).toBe(409);

    const body = await res.json();
    expect(body.code).toBe(409);
    expect(body.message).toBe('Event type does not exist');
  });
});

test.describe('GET /bookings', () => {
  test('returns only upcoming bookings sorted by startTime ASC', async ({
    request,
  }) => {
    const et = await createEventType(request, 'Sort Test', 30);
    const slots = await (async () => {
      const res = await request.get(`${API}/event-types/${et.id}/slots`);
      return (await res.json()) as Array<{
        startTime: string;
        endTime: string;
      }>;
    })();

    if (slots.length < 2) {
      test.skip(true, 'Need at least 2 slots for sort test');
      return;
    }

    const bookings: Array<{ startTime: string }> = [];

    for (const slot of slots.slice(0, 3)) {
      const res = await request.post(`${API}/bookings`, {
        data: {
          eventTypeId: et.id,
          startTime: slot.startTime,
          guestName: 'Tester',
          guestEmail: 'tester@example.com',
        },
      });
      if (res.status() === 201) {
        bookings.push(await res.json());
      }
    }

    const listRes = await request.get(`${API}/bookings`);
    expect(listRes.status()).toBe(200);

    const list: Array<{ startTime: string }> = await listRes.json();
    expect(list.length).toBeGreaterThanOrEqual(1);

    const now = Date.now();
    for (const b of list) {
      expect(new Date(b.startTime).getTime()).toBeGreaterThanOrEqual(now);
    }

    for (let i = 1; i < list.length; i++) {
      const prev = new Date(list[i - 1].startTime).getTime();
      const curr = new Date(list[i].startTime).getTime();
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });
});
