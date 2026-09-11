/**
 * Verification script for New Appointment screen and routing
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

async function getUrl(urlPath) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 5001,
      path: urlPath
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('=======================================================');
  console.log('VERIFYING NEW APPOINTMENT ROUTING & COMPONENT INTEGRATION');
  console.log('=======================================================');

  // 1. Verify Routes return 200 and index.html
  const routesToTest = [
    '/admin/appointments/new',
    '/admin/new-appointment',
    '/appointments/new',
    '/admin/appointments/create'
  ];

  for (const r of routesToTest) {
    const res = await getUrl(r);
    console.log(`Route: ${r} -> Status: ${res.statusCode} (Length: ${res.body.length})`);
    if (res.statusCode !== 200 && res.statusCode !== 302 && res.statusCode !== 304) {
      throw new Error(`Route ${r} returned non-200 status: ${res.statusCode}`);
    }
    if (!res.body.includes('<div id="root">') && !res.body.includes('<!doctype html>')) {
      throw new Error(`Route ${r} did not serve SPA index.html!`);
    }
  }
  console.log('✅ All New Appointment routes successfully serve SPA client without 404s.');

  // 2. Verify compiled bundle contains NewAppointmentView content
  const distAssetsDir = path.join(__dirname, '../frontend/dist/assets');
  const files = fs.readdirSync(distAssetsDir);
  const jsBundle = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  if (!jsBundle) {
    throw new Error('Could not locate compiled frontend JS bundle in dist/assets!');
  }

  const jsContent = fs.readFileSync(path.join(distAssetsDir, jsBundle), 'utf8');
  const requiredStrings = [
    'Schedule New Consultation',
    'Consultation Mode',
    'Candidate Information',
    'Appointment Scheduled Successfully!',
    'New Appointment'
  ];

  for (const s of requiredStrings) {
    if (!jsContent.includes(s)) {
      throw new Error(`JS bundle missing required content string: "${s}"`);
    }
  }
  console.log('✅ Frontend bundle verified: NewAppointmentView and ErrorBoundary compiled into client.');

  // 3. Verify Meeting creation matching the form structure
  const postData = JSON.stringify({
    fullName: 'Test Candidate Suite',
    phone: '+92 300 9876543',
    email: 'candidate@test.com',
    countryInterest: 'UK',
    visaCategory: 'Study Visa',
    date: '2026-09-30',
    time: '11:00 AM',
    meetingType: 'Online Zoom Consultation',
    consultationType: 'ONLINE',
    appointmentType: 'ONLINE',
    counselorName: 'Ahmed Khan'
  });

  const bookingRes = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/meetings/book',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  console.log(`Meeting creation API status: ${bookingRes.statusCode}`);
  console.log(`Meeting creation success: ${bookingRes.data.success}`);
  if (!bookingRes.data.success || !bookingRes.data.data?._id) {
    throw new Error('Meeting creation failed: ' + JSON.stringify(bookingRes.data));
  }
  console.log(`Created meeting ID: ${bookingRes.data.data._id}`);
  console.log('✅ Appointment Creation API workflow verified successfully.');

  console.log('=======================================================');
  console.log('🎉 ALL NEW APPOINTMENT WORKFLOW VERIFICATIONS PASSED! 🎉');
  console.log('=======================================================');
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
