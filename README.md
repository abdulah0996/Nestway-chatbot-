# AI Immigration Assistant & Student CRM

## Current setup

Requires Node.js 18+ and MongoDB. Configure `backend/.env` using `backend/.env.example`.
From this directory run `npm.cmd install`, then `npm.cmd start` to build and serve
the complete application at http://localhost:5000. Use `npm` on non-Windows systems.

If port 5000 is occupied, run `$env:PORT = '5001'` in PowerShell before starting,
then open http://localhost:5001. Login is at `/login`, admin workspace at
`/admin/dashboard`, and student workspace at `/student/chat`.

An empty database seeds development accounts: `admin@immigration.com` / `admin123`,
`counselor@immigration.com` / `counselor123`, and `student@immigration.com` / `student123`.
Public registration creates students only.

Run `npm.cmd run lint` and `npm.cmd run build` for frontend checks.
For development run `npm.cmd run dev` and, in another terminal,
`npm.cmd run dev --prefix frontend`. Vite uses port 3000 and proxies to backend port 5000.
Backend workflow scripts require port 5000 and create test data; use a development database.
The server waits for MongoDB before listening; `/api/health` reports database readiness.

## Archived documentation

### Booking regression tests

With the app running on port 5001 and Microsoft Edge installed, run
`npm.cmd run test:booking --prefix frontend`. Set `TEST_BASE_URL` to test a different port.
The browser tests verify a persistent confirmation, automatic appointment-roster refresh,
calendar counts, and failure messages. They require the seeded development admin account
and clean up the booking records they create. Use a development database.

The clinic documentation below belongs to an earlier project and does not describe this application.

Complete full-stack patient-facing AI clinic assistant + admin/staff dashboard + Node.js Express backend + MongoDB database system built for **Dr. Muhammad Zaheer Anjum** (Pain Management & Regenerative Medicine Specialist at Stay Young Clinic, Lahore).

---

## 🏥 Clinic & Specialist Details

- **Doctor**: Dr. Muhammad Zaheer Anjum
- **Specialty**: Pain Management & Regenerative Medicine Specialist
- **Clinic**: Stay Young Clinic, Lahore
- **Address**: 684 Shadman Main Road, Shadman 1, opposite Fatima Memorial Hospital, Lahore
- **Phone / WhatsApp**: +92 321 3733332
- **Working Days**: Monday – Saturday
- **Consultation Hours**: 12:00 PM – 7:30 PM
- **Timezone**: Asia/Karachi

---

## 📁 Approved Project Structure

```
dr-muhammad-zaheer-anjum-clinic/
│
├── frontend/
│   ├── patient/
│   │   ├── index.html
│   │   ├── style.css
│   │   └── app.js
│   └── admin/
│       ├── admin.html
│       ├── admin.css
│       └── admin.js
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env
│   ├── .env.example
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── Appointment.js
│   │   ├── Patient.js
│   │   ├── Report.js
│   │   ├── Admin.js
│   │   ├── Clinic.js
│   │   ├── Treatment.js
│   │   ├── Consultation.js
│   │   ├── StaffMessage.js
│   │   ├── EmergencyAlert.js
│   │   ├── BlockedSlot.js
│   │   ├── OffDay.js
│   │   └── SpecialSchedule.js
│   ├── controllers/
│   │   ├── appointmentController.js
│   │   ├── patientController.js
│   │   ├── reportController.js
│   │   ├── adminController.js
│   │   ├── clinicController.js
│   │   ├── treatmentController.js
│   │   ├── consultationController.js
│   │   ├── staffController.js
│   │   └── dashboardController.js
│   ├── routes/
│   │   ├── appointmentRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── clinicRoutes.js
│   │   ├── treatmentRoutes.js
│   │   ├── consultationRoutes.js
│   │   ├── staffRoutes.js
│   │   └── dashboardRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   ├── errorHandler.js
│   │   └── validationMiddleware.js
│   ├── utils/
│   │   ├── tokenGenerator.js
│   │   ├── appointmentIdGenerator.js
│   │   ├── slotGenerator.js
│   │   └── response.js
│   └── uploads/
│       └── medical-reports/
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── logos/
│
├── README.md
└── .gitignore
```

---

## ⚡ Installation & Setup

### 1. Prerequisites
- **Node.js**: v18+ installed
- **MongoDB**: Local MongoDB instance running or MongoDB Atlas connection URI

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Environment Variables (`backend/.env`)
Create `.env` inside `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/ai_immigration_crm_db
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5000
MAX_UPLOAD_SIZE=10485760
```

### 4. Running Development Server
```bash
cd backend
npm start
```
The server will be running on `http://localhost:5000`:
- **Patient Portal**: `http://localhost:5000/patient/index.html`
- **Admin Dashboard**: `http://localhost:5000/admin/admin.html`

---

## 🔐 Security & Validation Features

- **JWT Authentication**: Protects administrative endpoints.
- **Double-Booking Prevention**: Database-level compound indexes and slot verification.
- **Sequential Daily Tokens**: Database-safe sequential token numbers (`001`, `002`, `009`).
- **File Upload Security**: Restricted file types (`.pdf`, `.jpg`, `.jpeg`, `.png`), 10MB limit, file content type validation, and filename sanitization.
- **Production Guard**: Prevents production startup without active MongoDB connection.

---

## 📡 Key REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/appointments/slots?date=YYYY-MM-DD` | Returns available slots for a date (excludes Sundays, off-days, blocked slots) |
| `POST` | `/api/appointments` | Book appointment & generate token |
| `GET` | `/api/appointments` | List all appointments |
| `PATCH` | `/api/appointments/:id/status` | Confirm, Complete, or Cancel appointment |
| `POST` | `/api/reports` | Upload patient medical report |
| `GET` | `/api/reports` | List uploaded medical reports |
| `GET` | `/api/dashboard/stats` | Real-time analytics metrics |
| `POST` | `/api/auth/login` | Admin login |
| `POST` | `/api/staff/handover` | Request human staff assistance |
| `POST` | `/api/staff/emergency` | Register emergency support alert |
