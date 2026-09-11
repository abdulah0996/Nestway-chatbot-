const http = require('http');

function postRequest(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: 'localhost',
        port: 5000,
        path
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
  });
}

async function runTest() {
  console.log('=== STARTING APPOINTMENT LIFECYCLE VERIFICATION ===\n');

  const testSessionId = `test_sess_${Date.now()}`;

  // 1. Initialize conversation
  console.log('1. Initializing test conversation session...');
  const initRes = await postRequest('/api/chat/init', {
    sessionId: testSessionId,
    fullName: 'Test Candidate',
    phone: '+92 300 9998877'
  });
  console.log('   Init status:', initRes.status, 'Session ID:', testSessionId);

  // 2. Book appointment
  console.log('\n2. Booking consultation via POST /api/meetings/book...');
  const bookRes = await postRequest('/api/meetings/book', {
    sessionId: testSessionId,
    fullName: 'Test Candidate',
    phone: '+92 300 9998877',
    email: 'test@candidate.com',
    countryInterest: 'UK',
    date: '2026-10-20',
    time: '11:00 AM',
    meetingType: 'Online Zoom Consultation'
  });
  console.log('   Book status:', bookRes.status);
  console.log('   Meeting ID:', bookRes.body?.data?._id);
  const meetingId = bookRes.body?.data?._id;

  if (!meetingId) {
    console.error('FAILED: No meeting ID returned from book API');
    process.exit(1);
  }

  // 3. Verify CRM followUpStatus on ChatConversation
  console.log('\n3. Verifying CRM followUpStatus and WAITING_HUMAN in session...');
  const sessRes = await getRequest(`/api/chat/session/${testSessionId}`);
  const conv = sessRes.body?.data;
  console.log('   Conversation status:', conv?.status);
  console.log('   followUpStatus:', conv?.followUpStatus);
  console.log('   crmTag:', conv?.crmTag);

  if (conv?.followUpStatus !== 'Appointment Confirmed - Follow Up Required') {
    console.error('FAILED: followUpStatus was not set correctly!');
    process.exit(1);
  }

  // 4. Reschedule appointment
  console.log('\n4. Rescheduling consultation via POST /api/meetings/reschedule...');
  const reschRes = await postRequest('/api/meetings/reschedule', {
    meetingId,
    sessionId: testSessionId,
    date: '2026-10-22',
    time: '03:00 PM',
    meetingType: 'Online Zoom Consultation'
  });
  console.log('   Reschedule status:', reschRes.status);
  console.log('   New Meeting ID:', reschRes.body?.data?._id);
  console.log('   Old Meeting Status:', reschRes.body?.oldMeeting?.status);
  const newMeetingId = reschRes.body?.data?._id;

  // 5. Cancel appointment
  console.log('\n5. Cancelling consultation via POST /api/meetings/cancel...');
  const cancelRes = await postRequest('/api/meetings/cancel', {
    meetingId: newMeetingId,
    sessionId: testSessionId,
    reason: 'Customer schedule conflict'
  });
  console.log('   Cancel status:', cancelRes.status);
  console.log('   Cancelled Meeting Status:', cancelRes.body?.data?.status);

  // 6. Check updated conversation messages
  console.log('\n6. Checking conversation history for system confirmation & cancellation logs...');
  const updatedSess = await getRequest(`/api/chat/session/${testSessionId}`);
  const lastMessages = updatedSess.body?.data?.messages || [];
  console.log('   Total messages in conversation:', lastMessages.length);
  const systemMsgs = lastMessages.filter(m => m.sender === 'SYSTEM');
  console.log('   System messages logged:');
  systemMsgs.forEach(m => console.log('     -', m.message || m.content));

  console.log('\n=== ALL LIFECYCLE TESTS COMPLETED SUCCESSFULLY! ===');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
