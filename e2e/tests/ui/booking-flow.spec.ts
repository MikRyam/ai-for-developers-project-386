import { test, expect, type APIRequestContext } from '@playwright/test';

const API = 'http://localhost:3000';

async function createEventTypeViaApi(
  request: APIRequestContext,
  title = 'E2E Test Meeting',
  durationMinutes = 30,
) {
  const res = await request.post(`${API}/event-types`, {
    data: { title, description: 'Created for e2e test', durationMinutes },
  });
  const data = await res.json();
  return data as {
    id: string;
    title: string;
    description: string;
    durationMinutes: number;
  };
}

test.describe('Guest booking flow', () => {
  let eventTypeId: string;

  test.beforeEach(async ({ request }) => {
    const et = await createEventTypeViaApi(request, 'Booking Flow Test', 30);
    eventTypeId = et.id;
  });

  test('complete booking journey', async ({ page }) => {
    await page.goto(`/event-types/${eventTypeId}`);

    const availableDay = page
      .locator(
        'button.mantine-Calendar-day:not([data-hidden]):not([data-disabled])',
      )
      .first();
    await expect(availableDay).toBeVisible({ timeout: 10000 });
    await availableDay.click();

    const slotCard = page.locator('[data-testid="slot-card"]');

    await expect(slotCard.first()).toBeVisible({ timeout: 5000 });
    await slotCard.first().click();

    await expect(page.getByLabel('Your Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Confirm Booking' }),
    ).toBeVisible();

    await page.getByLabel('Your Name').fill('Test Guest');
    await page.getByLabel('Email').fill('guest@example.com');
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    await expect(
      page.getByText('Your booking has been confirmed!'),
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Done' }).click();
  });

  test('days without slots are disabled in calendar', async ({ page }) => {
    await page.goto(`/event-types/${eventTypeId}`);

    const dayButtons = page.locator(
      'button.mantine-Calendar-day:not([data-hidden])',
    );
    await expect(dayButtons.first()).toBeVisible({ timeout: 10000 });

    const totalDays = await dayButtons.count();
    const availableDays = page.locator(
      'button.mantine-Calendar-day:not([data-hidden]):not([data-disabled])',
    );
    const availableCount = await availableDays.count();

    expect(availableCount).toBeGreaterThan(0);
    expect(availableCount).toBeLessThan(totalDays);
  });

  test('slot disappears after booking', async ({ page }) => {
    await page.goto(`/event-types/${eventTypeId}`);

    const availableDay = page
      .locator(
        'button.mantine-Calendar-day:not([data-hidden]):not([data-disabled])',
      )
      .first();
    await expect(availableDay).toBeVisible({ timeout: 10000 });
    await availableDay.click();

    const slotCard = page.locator('[data-testid="slot-card"]');

    await expect(slotCard.first()).toBeVisible({ timeout: 5000 });
    const slotCountBefore = await slotCard.count();

    await slotCard.first().click();
    await page.getByLabel('Your Name').fill('Guest');
    await page.getByLabel('Email').fill('guest@test.com');
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    await expect(
      page.getByText('Your booking has been confirmed!'),
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Done' }).click();

    await page.waitForTimeout(500);
    const slotCountAfter = await slotCard.count();
    expect(slotCountAfter).toBeLessThan(slotCountBefore);
  });

  test('shows conflict error when booking an already taken slot', async ({
    page,
    request,
  }) => {
    await page.goto(`/event-types/${eventTypeId}`);

    const availableDay = page
      .locator(
        'button.mantine-Calendar-day:not([data-hidden]):not([data-disabled])',
      )
      .first();
    await expect(availableDay).toBeVisible({ timeout: 10000 });
    await availableDay.click();

    const slotCard = page.locator('[data-testid="slot-card"]');
    await expect(slotCard.first()).toBeVisible({ timeout: 5000 });

    const startTime = await slotCard.first().getAttribute('data-start-time');
    if (!startTime) {
      test.skip(true, 'Could not read startTime from slot');
      return;
    }

    await request.post(`${API}/bookings`, {
      data: {
        eventTypeId,
        startTime,
        guestName: 'Early Booker',
        guestEmail: 'early@example.com',
      },
    });

    await slotCard.first().click();
    await page.getByLabel('Your Name').fill('Late Guest');
    await page.getByLabel('Email').fill('late@example.com');
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    await expect(
      page.getByText('Time slot is already booked'),
    ).toBeVisible({ timeout: 10000 });
  });
});
