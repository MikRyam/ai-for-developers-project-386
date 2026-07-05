import { test, expect } from '@playwright/test';

const API = 'http://localhost:3000';

test.describe('Admin pages', () => {
  test('creates event type and sees it in the list', async ({ page }) => {
    await page.goto('/admin/event-types');
    await expect(
      page.getByRole('heading', { name: 'Event Types' }),
    ).toBeVisible();

    await page.getByLabel('Title').fill('Admin Created Meeting');
    await page.getByLabel('Description').fill('From admin panel');
    await page.getByLabel('Duration (minutes)').fill('45');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Admin Created Meeting')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText('From admin panel')).toBeVisible();
    await expect(page.getByText('45 min')).toBeVisible();
  });

  test('event type list page shows created types', async ({
    page,
    request,
  }) => {
    const uniqueTitle = `List Test ${Date.now()}`;
    await request.post(`${API}/event-types`, {
      data: {
        title: uniqueTitle,
        description: 'For list page',
        durationMinutes: 60,
      },
    });

    await page.goto('/');
    await expect(page.getByText(uniqueTitle)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText('Duration: 60 min').first()).toBeVisible();
  });

  test('non-existing event type shows 404 in UI', async ({ page }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await page.goto(`/event-types/${fakeId}`);
    await expect(page.getByText('Event type not found.')).toBeVisible();
  });

  test('admin bookings page loads without error', async ({ page }) => {
    await page.goto('/admin');
    await expect(
      page.getByRole('heading', { name: 'Upcoming Bookings' }),
    ).toBeVisible({ timeout: 10000 });
  });
});
