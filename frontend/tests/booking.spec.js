import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../backend/package.json', import.meta.url));

test('booking keeps confirmation visible and appears in an already open appointments dashboard', async ({ page, context, request }) => {
  const sessionId = `booking_ui_${Date.now()}`;
  const name = `Booking UI ${Date.now()}`;
  let booking;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const login = await request.post('/api/auth/login', {
      data: { email: 'admin@immigration.com', password: 'admin123' }
    });
    expect(login.ok()).toBeTruthy();
    const { data: user } = await login.json();
    await context.addInitScript(user => {
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
    }, user);
    const dashboard = await context.newPage();
    await dashboard.goto('/admin/appointments');
    await expect(dashboard.getByText('Appointments Roster')).toBeVisible();

    await request.post('/api/chat/init', { data: { sessionId } });
    // Make the consultation action available without walking through visa qualification.
    await page.route(`**/api/chat/session/${sessionId}`, async route => {
      const response = await route.fetch();
      const json = await response.json();
      json.data.messages.push({ sender: 'AI', message: 'Choose your next step.',
        actionChips: [{ label: 'Book Consultation', action: 'book_meeting' }] });
      await route.fulfill({ response, json });
    });
    await page.goto(`/?sessionId=${sessionId}`);
    await page.getByRole('button', { name: 'Book Consultation', exact: true }).click();
    await page.getByPlaceholder('Full Name *', { exact: true }).fill(name);
    await page.getByPlaceholder('Phone / WhatsApp *', { exact: true }).fill(`+923${Date.now().toString().slice(-9)}`);
    await page.getByPlaceholder('Email Address', { exact: true }).fill('booking-ui@example.test');
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 45);
    const date = future.toISOString().slice(0, 10);
    const slotsResponse = page.waitForResponse(r => r.url().includes(`/api/meetings/slots?date=${date}`));
    await page.locator('input[type=date]').fill(date);
    const slots = (await (await slotsResponse).json()).slots;
    const slot = slots.find(s => s.available);
    expect(slot).toBeTruthy();
    await page.getByRole('button', { name: slot.time, exact: true }).click();
    // Dashboard refresh and parent re-renders must not erase the chosen slot or form.
    await expect(page.getByPlaceholder('Full Name *', { exact: true })).toHaveValue(name);
    const booked = page.waitForResponse(r => r.url().endsWith('/api/meetings/book') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Confirm & Reserve Slot' }).click();
    const response = await booked;
    expect(response.status()).toBe(201);
    booking = (await response.json()).data;
    await expect(page.getByRole('heading', { name: 'Appointment Confirmed!' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText(date);
    await expect(page.getByRole('status')).toContainText(slot.time);
    await expect(page.getByRole('status')).toContainText(booking.counselorName);
    const row = dashboard.getByRole('row').filter({ hasText: name });
    await expect(row).toContainText('CONFIRMED', { timeout: 12000 });
    await expect(row).toContainText(date);
    const now = new Date();
    const monthsAhead = (future.getUTCFullYear() - now.getUTCFullYear()) * 12 + future.getUTCMonth() - now.getUTCMonth();
    for (let i = 0; i < monthsAhead; i++) await dashboard.getByRole('button', { name: 'Next month' }).click();
    await expect(dashboard.getByRole('button', { name: new RegExp(`^${date}: [1-9][0-9]* appointments$`) })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Appointment Confirmed!' })).toBeVisible();
    await page.getByRole('button', { name: 'Done & Close' }).click();
    await expect(page.getByText('Your consultation has been successfully booked.', { exact: true })).toBeVisible();
    await page.unroute(`**/api/chat/session/${sessionId}`);
    await page.reload();
    await expect(page.getByText('Your consultation has been successfully booked.', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    require('dotenv').config({ path: fileURLToPath(new URL('../../backend/.env', import.meta.url)) });
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    try {
      await require('./models/ChatConversation').deleteOne({ sessionId });
      if (booking) {
        await require('./models/Meeting').deleteOne({ _id: booking._id });
        await require('./models/Activity').deleteMany({ leadId: booking.leadId });
        await require('./models/Lead').deleteOne({ _id: booking.leadId, fullName: name });
      }
    } finally { await mongoose.disconnect(); }
  }
});

test('booking conflicts and unavailable slots show errors without false confirmations', async ({ page }) => {
  await page.route('**/api/chat/session/*', route => route.fulfill({ json: {
    success: true, data: { messages: [{ sender: 'AI', message: 'Book a consultation.',
      actionChips: [{ label: 'Book Consultation', action: 'book_meeting' }] }] }
  } }));
  await page.route('**/api/meetings/slots?*', route => route.fulfill({ json: {
    success: true, slots: [{ time: '09:00 AM', available: true }]
  } }));
  await page.route('**/api/meetings/book', route => route.fulfill({ status: 409, json: {
    success: false, code: 'DOUBLE_BOOKING_COLLISION', message: 'This slot was just booked. Please choose another time.'
  } }));
  await page.goto('/?sessionId=booking_error_test');
  await page.getByRole('button', { name: 'Book Consultation', exact: true }).click();
  await page.getByRole('button', { name: '09:00 AM', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm & Reserve Slot' }).click();
  await expect(page.getByText('This slot was just booked. Please choose another time.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Appointment Confirmed!' })).toHaveCount(0);
  await expect(page.getByPlaceholder('Full Name *', { exact: true })).toBeVisible();

  await page.route('**/api/meetings/slots?*', route => route.fulfill({ status: 503, json: {
    success: false, message: 'Availability is temporarily unavailable.'
  } }));
  const future = new Date();
  future.setUTCDate(future.getUTCDate() + 20);
  await page.locator('input[type=date]').fill(future.toISOString().slice(0, 10));
  await expect(page.getByText('Availability is temporarily unavailable.')).toBeVisible();
  await expect(page.getByRole('button', { name: '09:00 AM', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Select a Time Slot Above' })).toBeDisabled();
});
