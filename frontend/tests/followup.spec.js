import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../backend/package.json', import.meta.url));

test('lead follow-up reaches both chats and a new customer chat preserves the booked lead', async ({ page, context, request }) => {
  test.setTimeout(90000);
  const sessionId = `web_test_${Date.now()}`;
  const name = `Followup Test ${Date.now()}`;
  let booking;
  let freshSession;
  try {
    const login = await request.post('/api/auth/login', { data: { email: 'admin@immigration.com', password: 'admin123' } });
    expect(login.ok()).toBeTruthy();
    const { data: user } = await login.json();
    const headers = { Authorization: `Bearer ${user.token}` };
    await context.addInitScript(user => {
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
    }, user);
    await request.post('/api/chat/init', { data: { sessionId } });
    const future = new Date();
    future.setDate(future.getDate() + 67);
    const date = future.toISOString().slice(0, 10);
    const availability = await (await request.get(`/api/meetings/slots?date=${date}`)).json();
    const slot = availability.slots.find(s => s.available);
    const booked = await request.post('/api/meetings/book', { data: {
      sessionId, date, time: slot.time, fullName: name, phone: `+923${Date.now().toString().slice(-9)}`,
      email: 'followup-test@example.test', appointmentType: 'ONLINE'
    } });
    expect(booked.status()).toBe(201);
    booking = (await booked.json()).data;
    const confirmed = await request.post(`/api/meetings/${booking._id}/confirm`, { data: { sessionId }, headers });
    expect(confirmed.ok()).toBeTruthy();

    await page.goto(`/whatsapp?sessionId=${sessionId}`);
    await expect(page.getByRole('button', { name: 'Start New Conversation', exact: true })).toBeVisible();
    const admin = await context.newPage();
    await admin.goto('/admin/appointments');
    await expect(admin.getByRole('row').filter({ hasText: name })).toContainText('CONFIRMED');
    await admin.goto('/admin/leads');
    const leadRow = admin.getByRole('row').filter({ hasText: name });
    await expect(leadRow).toContainText('Required');
    await leadRow.getByRole('button', { name: 'Follow Up', exact: true }).click();
    const followup = `Hello ${name}, please prepare your documents for the confirmed appointment.`;
    await admin.getByPlaceholder('Enter follow-up message...').fill(followup);
    await admin.getByRole('button', { name: 'Send Follow-up', exact: true }).click();
    await expect(admin).toHaveURL(new RegExp(`/admin/inbox\\?session=${sessionId}&filter=FOLLOWUP`));
    await expect(admin.getByText(followup, { exact: true })).toBeVisible();
    await expect(page.getByText(followup, { exact: true })).toBeVisible({ timeout: 12000 });
    const records = await (await request.get(`/api/followups?leadId=${booking.leadId}`, { headers })).json();
    expect(records.data.some(f => f.type === 'MANUAL' && f.message === followup && f.conversationId.sessionId === sessionId)).toBeTruthy();
    await request.post('/api/chat/takeover', { data: { sessionId } });
    await request.post('/api/chat/message', { data: { sessionId, message: 'Thanks, I will bring them.', sender: 'USER' } });
    const replied = await (await request.get(`/api/chat/session/${sessionId}`)).json();
    expect(replied.data.followUpStatus).toBe('FOLLOW_UP_REPLIED');
    await admin.goto('/admin/leads');
    await expect(admin.getByRole('row').filter({ hasText: name })).toContainText('Replied');

    await page.getByRole('button', { name: 'Start New Conversation', exact: true }).click();
    await expect(page).toHaveURL(/\/whatsapp\?sessionId=web_chat_/);
    freshSession = new URL(page.url()).searchParams.get('sessionId');
    await expect.poll(async () => {
      const response = await request.get(`/api/chat/session/${freshSession}`);
      return response.status();
    }).toBe(200);
    const fresh = await (await request.get(`/api/chat/session/${freshSession}`)).json();
    expect(fresh.data.leadId).toBeFalsy();
    expect(fresh.data.leadCaptureStage).toBe('NAME');
    expect(fresh.data.messages).toHaveLength(1);
    await expect(page.getByText(followup, { exact: true })).toHaveCount(0);
    await page.reload();
    expect(new URL(page.url()).searchParams.get('sessionId')).toBe(freshSession);
    await admin.goto(`/admin/inbox?session=${sessionId}&filter=FOLLOWUP`);
    await expect(admin.getByText(followup, { exact: true })).toBeVisible();
    const saved = await (await request.get('/api/meetings', { headers })).json();
    expect(saved.data.find(m => m._id === booking._id).status).toBe('CONFIRMED');
  } finally {
    require('dotenv').config({ path: fileURLToPath(new URL('../../backend/.env', import.meta.url)) });
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    try {
      await require('./models/ChatConversation').deleteMany({ sessionId: { $in: [sessionId, freshSession].filter(Boolean) } });
      if (booking) {
        await require('./models/Meeting').deleteOne({ _id: booking._id });
        await require('./models/FollowUp').deleteMany({ leadId: booking.leadId });
        await require('./models/Activity').deleteMany({ leadId: booking.leadId });
        await require('./models/Lead').deleteOne({ _id: booking.leadId, fullName: name });
      }
    } finally { await mongoose.disconnect(); }
  }
});
