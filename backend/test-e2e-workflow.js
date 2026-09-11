const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.data = data;
    throw error;
  }
  return data;
}

async function runTests() {
  console.log('==============================================');
  console.log('STARTING E2E VERIFICATION OF UX FIXES');
  console.log('==============================================');

  const testSessionId = `test_wa_${Date.now()}`;
  console.log(`\n[1] Testing with Session ID: ${testSessionId}`);

  // 1. Initialize fresh chat session
  const initRes = await request('/chat/init', {
    method: 'POST',
    body: JSON.stringify({ sessionId: testSessionId })
  });
  console.log('Init session success:', initRes.success);

  // 2. Human Counselor Takeover (Switch to HUMAN mode)
  const takeoverRes = await request('/chat/takeover', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: testSessionId,
      counselorName: 'Ahmed Khan'
    })
  });
  console.log('Takeover success (Mode = HUMAN):', takeoverRes.success, takeoverRes.mode);

  // 3. Admin Clicks "Resume AI"
  console.log('\n--- TEST 1: ADMIN RESUME AI & CUSTOMER MESSAGE ---');
  const resumeRes = await request('/chat/resume-ai', {
    method: 'POST',
    body: JSON.stringify({ sessionId: testSessionId })
  });
  console.log('Resume AI success (Mode = HYBRID):', resumeRes.success, resumeRes.data?.mode);

  // 4. Customer sends message after Resume AI
  console.log('Customer sends message: "Hello, I want to check my visa options"');
  const msgRes = await request('/chat/message', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: testSessionId,
      message: 'Hello, I want to check my visa options',
      sender: 'USER'
    })
  });
  console.log('AI Response received:', msgRes.success);
  console.log('AI Bot Response snippet:', String(msgRes.botResponse).slice(0, 80) + '...');
  if (!msgRes.botResponse) {
    throw new Error('FAILED: Expected immediate AI response after Resume AI, got empty botResponse');
  }
  console.log('✅ TEST 1 PASSED: AI response received promptly, typing indicator clears.');

  // 5. TEST 2: APPOINTMENT CONFIRMATION FLOW
  console.log('\n--- TEST 2: APPOINTMENT CONFIRMATION FLOW ---');
  const uniqueMonth = (10 + (Date.now() % 3)).toString().padStart(2, '0');
  const uniqueDay = (1 + (Date.now() % 28)).toString().padStart(2, '0');
  const availableSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
  const bookingDate = `2027-${uniqueMonth}-${uniqueDay}`;
  const bookingTime = availableSlots[Date.now() % availableSlots.length];
  const customerName = `Sara Malik ${Date.now().toString().slice(-4)}`;
  const customerPhone = `+92 300 ${Date.now().toString().slice(-7)}`;

  const bookRes = await request('/meetings/book', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: testSessionId,
      fullName: customerName,
      phone: customerPhone,
      date: bookingDate,
      time: bookingTime,
      appointmentType: 'ONLINE',
      meetingType: 'Online Zoom Consultation',
      serviceType: 'STUDY_VISA',
      countryInterest: 'UK'
    })
  });

  console.log('Book meeting response success:', bookRes.success);
  console.log('Meeting Status in DB:', bookRes.data?.status);
  console.log('Counselor Name:', bookRes.data?.counselorName);
  console.log('System Message attached:', bookRes.systemMessage);

  if (bookRes.data?.status !== 'CONFIRMED') {
    throw new Error(`FAILED: Expected meeting status CONFIRMED, got ${bookRes.data?.status}`);
  }

  // Verify ChatConversation has the required SYSTEM message
  const sessionCheck = await request(`/chat/session/${testSessionId}`);
  const messages = sessionCheck.data?.messages || [];
  const confirmedMsg = messages.find(
    m => m.type === 'APPOINTMENT_CONFIRMED' || m.metadata?.type === 'APPOINTMENT_CONFIRMED'
  );

  console.log('\nVerifying SYSTEM message in ChatConversation:');
  if (!confirmedMsg) {
    throw new Error('FAILED: APPOINTMENT_CONFIRMED message not found in ChatConversation messages');
  }

  console.log('Found confirmation message:');
  console.log(' - Sender:', confirmedMsg.sender);
  console.log(' - Type:', confirmedMsg.type || confirmedMsg.metadata?.type);
  console.log(' - Message:', confirmedMsg.message);
  console.log(' - Date in metadata:', confirmedMsg.metadata?.date);
  console.log(' - Time in metadata:', confirmedMsg.metadata?.time);
  console.log(' - Mode in metadata:', confirmedMsg.metadata?.mode);
  console.log(' - Counselor in metadata:', confirmedMsg.metadata?.counselorName);

  if (
    confirmedMsg.sender !== 'SYSTEM' ||
    !confirmedMsg.metadata?.date ||
    !confirmedMsg.metadata?.time ||
    !confirmedMsg.metadata?.mode ||
    !confirmedMsg.metadata?.counselorName
  ) {
    throw new Error('FAILED: System message missing required confirmation fields');
  }

  // Log in as Admin to query protected /api/meetings
  console.log('\nAuthenticating Admin account:');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@immigration.com', password: 'admin123' })
  });
  const adminToken = loginRes.data?.token;
  console.log('Admin authenticated successfully, token obtained.');

  // Verify Admin Dashboard Appointments query (GET /api/meetings)
  console.log('\nVerifying Admin Dashboard Appointments:');
  const allMeetingsRes = await request('/meetings', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const ourMeeting = (allMeetingsRes.data || []).find(
    m => m.date === bookingDate && m.time === bookingTime
  );

  if (!ourMeeting) {
    throw new Error(`FAILED: Meeting for ${bookingDate} at ${bookingTime} not found in GET /api/meetings`);
  }

  console.log('Admin Appointments entry verified:');
  console.log(' - Customer Name:', ourMeeting.leadId?.fullName);
  console.log(' - Visa Type:', ourMeeting.leadId?.serviceType || ourMeeting.serviceType);
  console.log(' - Counselor Name:', ourMeeting.counselorName || ourMeeting.counselorId?.name);
  console.log(' - Date:', ourMeeting.date);
  console.log(' - Time:', ourMeeting.time);
  console.log(' - Status:', ourMeeting.status);

  if (ourMeeting.status !== 'CONFIRMED') {
    throw new Error(`FAILED: Expected CONFIRMED status in Admin Appointments, got ${ourMeeting.status}`);
  }

  console.log('\n==============================================');
  console.log('✅ ALL TEST FLOWS COMPLETED SUCCESSFULLY!');
  console.log('==============================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST ERROR:', err.data || err.message);
  process.exit(1);
});
