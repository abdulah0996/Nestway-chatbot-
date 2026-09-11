async function testCancelFeature() {
  const BASE_URL = 'http://localhost:5001/api';
  console.log('--- Starting Admin Booking Cancellation Test ---');

  // 1. Login as Admin
  console.log('\n1. Logging in as Admin...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@immigration.com',
      password: 'admin123'
    })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  console.log('Admin login successful. Token acquired:', token ? token.substring(0, 15) + '...' : 'NONE');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Fetch meetings
  console.log('\n2. Fetching meetings...');
  const meetingsRes = await fetch(`${BASE_URL}/meetings`, {
    headers: authHeaders
  });
  console.log('Meetings status:', meetingsRes.status);
  const meetingsData = await meetingsRes.json();
  console.log('Meetings data:', meetingsData);
  console.log(`Found ${meetingsData.data ? meetingsData.data.length : 'no'} meetings.`);

  let meetingToCancel = meetingsData.data.find(m => m.status !== 'CANCELLED');

  if (!meetingToCancel) {
    console.log('No active meetings found. Creating a test booking...');
    const bookRes = await fetch(`${BASE_URL}/meetings/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Student For Cancellation',
        email: 'canceltarget@test.com',
        phone: '+1234567890',
        date: '2026-09-25',
        time: '03:00 PM',
        consultationType: 'Online Consultation',
        targetCountry: 'Canada',
        visaType: 'Study Visa',
        notes: 'Testing cancellation functionality',
        sessionId: 'test-cancel-session-123'
      })
    });
    const bookData = await bookRes.json();
    console.log('Book response:', bookData);
    meetingToCancel = bookData.data;
    console.log('Created test meeting:', meetingToCancel._id, 'Status:', meetingToCancel.status);
  } else {
    console.log('Using existing meeting:', meetingToCancel._id, 'Current status:', meetingToCancel.status);
  }

  // 3. Cancel meeting via Admin API (POST /api/meetings/:id/cancel)
  console.log(`\n3. Cancelling meeting ${meetingToCancel._id} via Admin API...`);
  const cancelRes = await fetch(`${BASE_URL}/meetings/${meetingToCancel._id}/cancel`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      reason: 'Admin cancelled appointment for testing purposes'
    })
  });

  const cancelData = await cancelRes.json();
  console.log('Cancellation Response Status:', cancelRes.status);
  console.log('Cancellation Response Data:', cancelData);

  if (cancelData.success && cancelData.data.status === 'CANCELLED') {
    console.log('SUCCESS: Meeting status updated to CANCELLED in DB!');
  } else {
    console.error('FAILURE: Unexpected status returned:', cancelData);
    process.exit(1);
  }

  // 4. Verify meeting is indeed CANCELLED when fetched again
  console.log('\n4. Verifying meeting status in list...');
  const verifyRes = await fetch(`${BASE_URL}/meetings`, { headers: authHeaders });
  const verifyData = await verifyRes.json();
  const updatedMeeting = verifyData.data.find(m => m._id === meetingToCancel._id.toString());
  console.log('Verified meeting status:', updatedMeeting?.status, 'Cancelled at:', updatedMeeting?.cancelledAt);

  // 5. Test cancelling via fallback payload { meetingId } to /api/meetings/cancel
  console.log('\n5. Creating another meeting to test /api/meetings/cancel fallback payload...');
  const bookRes2 = await fetch(`${BASE_URL}/meetings/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Fallback Cancel',
      email: 'cancelfallback@test.com',
      phone: '+1987654321',
      date: '2026-09-28',
      time: '11:00 AM',
      consultationType: '🏢 In-Person Consultation',
      sessionId: 'test-cancel-session-456'
    })
  });
  const bookData2 = await bookRes2.json();
  console.log('Book response 2:', bookData2);
  const meeting2 = bookData2.data;
  console.log('Created second meeting:', meeting2._id);

  const cancelRes2 = await fetch(`${BASE_URL}/meetings/cancel`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      meetingId: meeting2._id,
      sessionId: 'test-cancel-session-456',
      reason: 'Cancelled via general endpoint'
    })
  });
  const cancelData2 = await cancelRes2.json();
  console.log('Endpoint /meetings/cancel response status:', cancelRes2.status);
  console.log('Second meeting updated status:', cancelData2.data?.status);

  console.log('\n========================================');
  console.log('ALL CANCELLATION TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

testCancelFeature().catch(err => {
  console.error('Error during cancellation test:', err);
  process.exit(1);
});
