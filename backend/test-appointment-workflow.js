/**
 * test-appointment-workflow.js
 * Comprehensive automated verification for the new Appointment Management Workflow:
 * Test 1: Customer books appointment -> DB record created with status: PENDING and consultationType.
 * Test 2: Admin confirms appointment -> status changes to CONFIRMED, confirmedAt set, activity logged, WhatsApp confirmation message sent.
 * Test 3: Admin cancels appointment -> status changes to CANCELLED, cancelledAt set, activity logged, cancellation message with rebooking option sent.
 * Test 4: Admin reschedules appointment -> new date/time set, status: RESCHEDULED, rescheduledAt set, activity logged, reschedule message sent.
 * Test 5: Verify ChatConversation updates and data integrity across all 4 appointment states.
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

const Meeting = require('./models/Meeting');
const Activity = require('./models/Activity');
const Lead = require('./models/Lead');
const ChatConversation = require('./models/ChatConversation');
const meetingController = require('./controllers/meetingController');

// Helper to mock Express req, res
function createMockReqRes(body = {}, params = {}, query = {}) {
  const req = {
    body,
    params,
    query,
    user: { id: new mongoose.Types.ObjectId(), name: 'Senior Immigration Admin', role: 'admin' }
  };
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return { req, res };
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 STARTING APPOINTMENT MANAGEMENT SYSTEM AUTOMATED TESTS');
  console.log('================================================================\n');

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_immigration_crm_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB successfully.\n');

    // Pre-test cleanup of test dates to avoid conflict collisions
    await Meeting.deleteMany({ date: { $in: ['2026-09-20', '2026-09-25'] } });

    const testSessionId = `test_session_${Date.now()}`;
    const testPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;

    // Create a mock lead profile and chat conversation
    const lead = await Lead.create({
      fullName: 'Sarah Jenkins',
      phone: testPhone,
      email: 'sarah.jenkins@test.com',
      countryInterest: 'Canada',
      currentStage: 'CONSULTATION_SCHEDULED'
    });

    const conversation = await ChatConversation.create({
      sessionId: testSessionId,
      studentProfileId: lead._id,
      messages: [
        {
          sender: 'USER',
          text: 'Hello, I want to book a Canada student visa consultation.'
        }
      ]
    });

    console.log(`Created test Lead: ${lead.fullName} (${lead._id})`);
    console.log(`Created test Conversation: sessionId=${testSessionId}\n`);

    // =========================================================================
    // TEST 1: Customer books appointment -> DB record created with status: PENDING
    // =========================================================================
    console.log('--- TEST 1: Customer Books Appointment (Pending Flow) ---');
    const bookPayload = {
      leadId: lead._id,
      sessionId: testSessionId,
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      countryInterest: lead.countryInterest,
      date: '2026-09-20',
      time: '11:00 AM',
      consultationType: 'ONLINE',
      appointmentType: 'ONLINE',
      meetingType: 'Online Zoom Consultation',
      visaCategory: 'Student Visa (Study Permit)',
      adminNotes: 'Interested in Toronto University'
    };

    const mock1 = createMockReqRes(bookPayload);
    await meetingController.bookMeeting(mock1.req, mock1.res);

    if (mock1.res.statusCode !== 200 && mock1.res.statusCode !== 201) {
      throw new Error(`bookMeeting failed with status ${mock1.res.statusCode}: ${JSON.stringify(mock1.res.data)}`);
    }

    const createdMeeting = mock1.res.data.data;
    console.log(`Booking response success: ${mock1.res.data.success}`);
    console.log(`Appointment ID: ${createdMeeting._id}`);
    console.log(`Appointment Status: ${createdMeeting.status}`);
    console.log(`Consultation Type: ${createdMeeting.consultationType}`);

    if (createdMeeting.status !== 'PENDING') {
      throw new Error(`Expected status PENDING, got: ${createdMeeting.status}`);
    }
    if (createdMeeting.consultationType !== 'ONLINE') {
      throw new Error(`Expected consultationType ONLINE, got: ${createdMeeting.consultationType}`);
    }

    // Verify DB record directly
    const dbMeeting1 = await Meeting.findById(createdMeeting._id);
    if (!dbMeeting1 || dbMeeting1.status !== 'PENDING') {
      throw new Error('Database meeting status verification failed');
    }
    console.log('✅ TEST 1 PASSED: Appointment successfully created with status: PENDING and consultationType: ONLINE.\n');

    // =========================================================================
    // TEST 2: Admin Confirms Appointment -> status: CONFIRMED, confirmedAt set
    // =========================================================================
    console.log('--- TEST 2: Admin Confirms Appointment ---');
    const confirmPayload = {
      meetingId: dbMeeting1._id,
      sessionId: testSessionId,
      counselorName: 'Dr. Zaheer Ahmad',
      meetingLink: 'https://zoom.us/j/9876543210'
    };

    const mock2 = createMockReqRes(confirmPayload, { id: dbMeeting1._id.toString() });
    await meetingController.confirmMeeting(mock2.req, mock2.res);

    if (mock2.res.statusCode !== 200) {
      throw new Error(`confirmMeeting failed with status ${mock2.res.statusCode}: ${JSON.stringify(mock2.res.data)}`);
    }

    const dbMeeting2 = await Meeting.findById(dbMeeting1._id);
    console.log(`Updated Meeting Status: ${dbMeeting2.status}`);
    console.log(`Confirmed At: ${dbMeeting2.confirmedAt}`);
    console.log(`Meeting Link: ${dbMeeting2.meetingLink}`);

    if (dbMeeting2.status !== 'CONFIRMED') {
      throw new Error(`Expected status CONFIRMED, got: ${dbMeeting2.status}`);
    }
    if (!dbMeeting2.confirmedAt) {
      throw new Error('Expected confirmedAt timestamp to be set');
    }

    // Verify Activity log
    const confirmActivity = await Activity.findOne({
      leadId: lead._id,
      type: 'APPOINTMENT_CONFIRMED'
    });
    if (!confirmActivity) {
      throw new Error('Expected APPOINTMENT_CONFIRMED activity log in database');
    }
    console.log(`Logged Activity: ${confirmActivity.type} - "${confirmActivity.title}"`);
    console.log('✅ TEST 2 PASSED: Appointment confirmed, timestamp set, activity logged.\n');

    // =========================================================================
    // TEST 4: Admin Reschedules Appointment -> new date/time, status: RESCHEDULED
    // =========================================================================
    console.log('--- TEST 4: Admin Reschedules Appointment ---');
    const reschedulePayload = {
      meetingId: dbMeeting1._id,
      sessionId: testSessionId,
      date: '2026-09-25',
      time: '03:30 PM',
      notes: 'Counselor conflict - moving to afternoon session'
    };

    const mock4 = createMockReqRes(reschedulePayload, { id: dbMeeting1._id.toString() });
    await meetingController.rescheduleMeeting(mock4.req, mock4.res);

    if (mock4.res.statusCode !== 200) {
      throw new Error(`rescheduleMeeting failed with status ${mock4.res.statusCode}: ${JSON.stringify(mock4.res.data)}`);
    }

    const dbMeeting4 = await Meeting.findById(dbMeeting1._id);
    console.log(`Rescheduled Meeting Date: ${dbMeeting4.date}`);
    console.log(`Rescheduled Meeting Time: ${dbMeeting4.time}`);
    console.log(`Meeting Status: ${dbMeeting4.status}`);
    console.log(`Rescheduled At: ${dbMeeting4.rescheduledAt}`);

    if (dbMeeting4.status !== 'RESCHEDULED') {
      throw new Error(`Expected status RESCHEDULED, got: ${dbMeeting4.status}`);
    }
    if (dbMeeting4.date !== '2026-09-25' || dbMeeting4.time !== '03:30 PM') {
      throw new Error(`Date/Time not updated correctly: ${dbMeeting4.date} ${dbMeeting4.time}`);
    }
    if (!dbMeeting4.rescheduledAt) {
      throw new Error('Expected rescheduledAt timestamp to be set');
    }

    // Verify Activity log
    const rescheduleActivity = await Activity.findOne({
      leadId: lead._id,
      type: 'APPOINTMENT_RESCHEDULED'
    });
    if (!rescheduleActivity) {
      throw new Error('Expected APPOINTMENT_RESCHEDULED activity log in database');
    }
    console.log(`Logged Activity: ${rescheduleActivity.type} - "${rescheduleActivity.title}"`);
    console.log('✅ TEST 4 PASSED: Appointment successfully rescheduled, date/time updated, status: RESCHEDULED.\n');

    // =========================================================================
    // TEST 3: Admin Cancels Appointment -> status: CANCELLED, cancelledAt set
    // =========================================================================
    console.log('--- TEST 3: Admin Cancels Appointment ---');
    const cancelPayload = {
      meetingId: dbMeeting1._id,
      sessionId: testSessionId,
      reason: 'Candidate requested cancellation due to travel'
    };

    const mock3 = createMockReqRes(cancelPayload, { id: dbMeeting1._id.toString() });
    await meetingController.cancelMeeting(mock3.req, mock3.res);

    if (mock3.res.statusCode !== 200) {
      throw new Error(`cancelMeeting failed with status ${mock3.res.statusCode}: ${JSON.stringify(mock3.res.data)}`);
    }

    const dbMeeting3 = await Meeting.findById(dbMeeting1._id);
    console.log(`Cancelled Meeting Status: ${dbMeeting3.status}`);
    console.log(`Cancelled At: ${dbMeeting3.cancelledAt}`);

    if (dbMeeting3.status !== 'CANCELLED') {
      throw new Error(`Expected status CANCELLED, got: ${dbMeeting3.status}`);
    }
    if (!dbMeeting3.cancelledAt) {
      throw new Error('Expected cancelledAt timestamp to be set');
    }

    // Verify Activity log
    const cancelActivity = await Activity.findOne({
      leadId: lead._id,
      type: 'APPOINTMENT_CANCELLED'
    });
    if (!cancelActivity) {
      throw new Error('Expected APPOINTMENT_CANCELLED activity log in database');
    }
    console.log(`Logged Activity: ${cancelActivity.type} - "${cancelActivity.title}"`);
    console.log('✅ TEST 3 PASSED: Appointment cancelled, cancelledAt set, activity logged.\n');

    // =========================================================================
    // TEST 5: Customer Chat Verification (WhatsApp Card & Notifications)
    // =========================================================================
    console.log('--- TEST 5: Verify WhatsApp Customer Chat Messages & Cards ---');
    const updatedConv = await ChatConversation.findOne({ sessionId: testSessionId });
    console.log(`Total messages in chat: ${updatedConv.messages.length}`);
    
    const messages = updatedConv.messages.map(m => {
      const content = m.message || m.content || m.text || '';
      return {
        sender: m.sender,
        text: content ? content.substring(0, 70).replace(/\n/g, ' ') + '...' : ''
      };
    });
    console.log('Chat conversation timeline:');
    messages.forEach((m, idx) => console.log(`  [${idx + 1}] ${m.sender}: ${m.text}`));

    const checkMsg = (predicate) => updatedConv.messages.some(m => {
      const txt = m.message || m.content || m.text || '';
      return predicate(txt);
    });

    const hasRequestedMsg = checkMsg(t => t.includes('Appointment Request Submitted'));
    const hasConfirmedMsg = checkMsg(t => t.includes('consultation has been confirmed') || t.includes('Appointment Confirmed'));
    const hasRescheduledMsg = checkMsg(t => t.includes('consultation has been rescheduled') || t.includes('Appointment Rescheduled'));
    const hasCancelledMsg = checkMsg(t => t.includes('consultation has been cancelled') || t.includes('Appointment Cancelled'));

    if (!hasRequestedMsg) throw new Error('Missing "Appointment Request Submitted" message in chat');
    if (!hasConfirmedMsg) throw new Error('Missing "Appointment Confirmed" message in chat');
    if (!hasRescheduledMsg) throw new Error('Missing "Appointment Rescheduled" message in chat');
    if (!hasCancelledMsg) throw new Error('Missing "Appointment Cancelled" message in chat');

    console.log('✅ TEST 5 PASSED: All 4 appointment state messages present in customer chat conversation.\n');

    // Clean up test data
    console.log('Cleaning up test data...');
    await Meeting.deleteMany({ _id: dbMeeting1._id });
    await Activity.deleteMany({ leadId: lead._id });
    await ChatConversation.deleteMany({ sessionId: testSessionId });
    await Lead.deleteMany({ _id: lead._id });
    console.log('Cleaned up test data.');

    console.log('================================================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! WORKFLOW FULLY VERIFIED.');
    console.log('================================================================');
  } catch (error) {
    console.error('❌ TEST RUN FAILED:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTests();
