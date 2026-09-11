async function testFollowUpWorkflow() {
  const BASE_URL = 'http://localhost:5001/api';
  console.log('=======================================================');
  console.log('STARTING IMMIGRATION CRM FOLLOW-UP WORKFLOW TEST SUITE');
  console.log('=======================================================');

  // 1. Admin Login
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
  if (!token) throw new Error('Failed to acquire admin token');
  console.log('Admin login successful. Token acquired.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Book appointment for a student candidate
  const testPhone = `+92300${Date.now().toString().slice(-7)}`;
  const testSessionId = `wa_followup_${Date.now()}`;
  console.log(`\n2. Creating test appointment for candidate with phone: ${testPhone}...`);

  const bookRes = await fetch(`${BASE_URL}/meetings/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Hamza Tariq',
      email: 'hamza.tariq@test.com',
      phone: testPhone,
      date: '2026-09-29',
      time: '02:00 PM',
      consultationType: 'Online Consultation',
      serviceType: 'STUDY_VISA',
      countryInterest: 'UK',
      sessionId: testSessionId,
      notes: 'Initial test appointment'
    })
  });
  const bookData = await bookRes.json();
  if (!bookData.success) throw new Error(`Booking failed: ${JSON.stringify(bookData)}`);

  const meetingId = bookData.data._id;
  const leadId = bookData.data.leadId;
  console.log(`Booking confirmed! Meeting ID: ${meetingId}, Lead ID: ${leadId}`);

  // 3. Cancel Appointment & Verify Follow-Up Automation Trigger
  console.log(`\n3. Cancelling meeting ${meetingId} via Admin API...`);
  const cancelRes = await fetch(`${BASE_URL}/meetings/${meetingId}/cancel`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      reason: 'Candidate had sudden schedule conflict'
    })
  });
  const cancelData = await cancelRes.json();
  if (!cancelData.success) throw new Error(`Cancellation failed: ${JSON.stringify(cancelData)}`);
  console.log('Cancellation successful. Verifying Lead and Conversation follow-up state...');

  // Verify Lead State
  const leadRes = await fetch(`${BASE_URL}/leads/${leadId}`, { headers: authHeaders });
  const leadData = await leadRes.json();
  const lead = leadData.data;

  console.log(`Lead Status: ${lead.status} (Expected: NEEDS_FOLLOW_UP)`);
  console.log(`Lead FollowUpStatus: ${lead.followUpStatus} (Expected: REQUIRED)`);
  if (lead.status !== 'NEEDS_FOLLOW_UP' || lead.followUpStatus !== 'REQUIRED') {
    throw new Error(`Lead status mismatch! Expected NEEDS_FOLLOW_UP/REQUIRED, got ${lead.status}/${lead.followUpStatus}`);
  }

  // Verify Conversation State
  const convRes = await fetch(`${BASE_URL}/chat/session/${testSessionId}`);
  const convData = await convRes.json();
  const conv = convData.data;
  console.log(`Conversation Status: ${conv.status} (Expected: NEEDS_FOLLOW_UP)`);
  console.log(`Conversation FollowUpStatus: ${conv.followUpStatus}`);
  if (conv.status !== 'NEEDS_FOLLOW_UP') {
    throw new Error(`Conversation status mismatch! Expected NEEDS_FOLLOW_UP, got ${conv.status}`);
  }

  // 4. Send Follow-Up Message via Lead API
  console.log('\n4. Dispatching Follow-Up Message via POST /api/leads/:id/follow-up...');
  const followUpText = `Hello ${lead.fullName},\n\nWe noticed your consultation was cancelled.\n\nWould you like to reschedule your immigration consultation?\n\nOur team is available to assist you.`;
  
  const followUpRes = await fetch(`${BASE_URL}/leads/${leadId}/follow-up`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ message: followUpText })
  });
  const followUpResult = await followUpRes.json();
  if (!followUpResult.success) throw new Error(`Send follow-up failed: ${JSON.stringify(followUpResult)}`);
  console.log('Follow-up message sent successfully!');

  // Verify Lead and Conversation after follow-up sent
  const leadAfterFUPRes = await fetch(`${BASE_URL}/leads/${leadId}`, { headers: authHeaders });
  const leadAfterFUP = (await leadAfterFUPRes.json()).data;
  console.log(`Lead FollowUpStatus after send: ${leadAfterFUP.followUpStatus} (Expected: SENT)`);
  console.log(`Lead LastFollowUpAt: ${leadAfterFUP.lastFollowUpAt}`);
  if (leadAfterFUP.followUpStatus !== 'SENT' || !leadAfterFUP.lastFollowUpAt) {
    throw new Error(`Lead after follow-up mismatch: ${leadAfterFUP.followUpStatus}`);
  }

  const convAfterFUPRes = await fetch(`${BASE_URL}/chat/session/${testSessionId}`);
  const convAfterFUP = (await convAfterFUPRes.json()).data;
  const lastMsg = convAfterFUP.messages[convAfterFUP.messages.length - 1];
  console.log(`Last Conversation Message Sender: ${lastMsg.sender} (Expected: ADMIN)`);
  console.log(`Last Conversation Message Type: ${lastMsg.type} (Expected: FOLLOW_UP)`);
  console.log(`Last Message Text: "${lastMsg.message.slice(0, 40)}..."`);
  if (lastMsg.sender !== 'ADMIN' || lastMsg.type !== 'FOLLOW_UP') {
    throw new Error(`Message in conversation mismatch: sender=${lastMsg.sender}, type=${lastMsg.type}`);
  }

  // 5. Simulate Customer Reply
  console.log('\n5. Simulating Customer reply to follow-up message via /api/chat/message...');
  const customerReplyText = 'Yes, I would love to reschedule for next Monday please!';
  const replyRes = await fetch(`${BASE_URL}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      message: customerReplyText
    })
  });
  const replyData = await replyRes.json();
  if (!replyData.success) throw new Error(`Reply failed: ${JSON.stringify(replyData)}`);
  console.log('Customer reply processed.');

  // Verify Lead and Conversation updated to REPLIED
  const leadAfterReplyRes = await fetch(`${BASE_URL}/leads/${leadId}`, { headers: authHeaders });
  const leadAfterReply = (await leadAfterReplyRes.json()).data;
  console.log(`Lead FollowUpStatus after customer reply: ${leadAfterReply.followUpStatus} (Expected: REPLIED)`);
  if (leadAfterReply.followUpStatus !== 'REPLIED') {
    throw new Error(`Lead followUpStatus mismatch: Expected REPLIED, got ${leadAfterReply.followUpStatus}`);
  }

  // 6. Test Add Note API
  console.log('\n6. Testing Add Note API: POST /api/leads/:id/notes...');
  const noteRes = await fetch(`${BASE_URL}/leads/${leadId}/notes`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      note: 'Student requested rescheduling for next Monday 10:00 AM'
    })
  });
  const noteData = await noteRes.json();
  if (!noteData.success) throw new Error(`Add note failed: ${JSON.stringify(noteData)}`);
  console.log('Case note saved successfully!');

  // 7. Verify Timeline API
  console.log('\n7. Verifying Lead Activity Timeline: GET /api/leads/:id/timeline...');
  const timelineRes = await fetch(`${BASE_URL}/leads/${leadId}/timeline`, { headers: authHeaders });
  const timelineData = await timelineRes.json();
  console.log(`Found ${timelineData.data.length} timeline events.`);

  const eventTypes = timelineData.data.map(e => e.type);
  console.log('Recorded timeline event types:', eventTypes);

  const hasFollowUpReq = eventTypes.includes('FOLLOW_UP_REQUIRED');
  const hasFollowUpSent = eventTypes.includes('FOLLOW_UP_SENT');
  const hasFollowUpReplied = eventTypes.includes('FOLLOW_UP_REPLIED');
  const hasNoteAdded = eventTypes.includes('NOTE_ADDED');

  console.log(`- FOLLOW_UP_REQUIRED logged: ${hasFollowUpReq ? '✅' : '❌'}`);
  console.log(`- FOLLOW_UP_SENT logged: ${hasFollowUpSent ? '✅' : '❌'}`);
  console.log(`- FOLLOW_UP_REPLIED logged: ${hasFollowUpReplied ? '✅' : '❌'}`);
  console.log(`- NOTE_ADDED logged: ${hasNoteAdded ? '✅' : '❌'}`);

  if (!hasFollowUpReq || !hasFollowUpSent || !hasFollowUpReplied || !hasNoteAdded) {
    throw new Error('Some timeline events were not logged!');
  }

  // 8. Verify Admin WhatsApp Inbox API includes conversation with tag
  console.log('\n8. Verifying Admin WhatsApp Inbox History: GET /api/chat/history...');
  const historyRes = await fetch(`${BASE_URL}/chat/history`);
  const historyData = await historyRes.json();
  const inboxEntry = historyData.data.find(c => c.sessionId === testSessionId);
  console.log('Inbox Entry Found:', !!inboxEntry);
  console.log('Inbox Entry FollowUpStatus:', inboxEntry?.followUpStatus);
  console.log('Inbox Entry Customer:', inboxEntry?.leadId?.fullName);

  console.log('\n=======================================================');
  console.log('🎉 ALL 7 FOLLOW-UP AUTOMATION WORKFLOW TESTS PASSED! 🎉');
  console.log('=======================================================');
}

testFollowUpWorkflow().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
