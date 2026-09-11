import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { applicationAPI } from '../../services/api';
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  Building,
  Search
} from 'lucide-react';

const TIMELINE_STEPS = [
  { id: 'profile', title: 'Profile Created', desc: 'Initial qualification & CRM record' },
  { id: 'docs', title: 'Documents Verified', desc: 'Passports, degree & IELTS audited' },
  { id: 'shortlist', title: 'University Shortlisted', desc: 'Courses & entry criteria matched' },
  { id: 'submitted', title: 'Application Submitted', desc: 'Dispatched to admissions portal' },
  { id: 'offer', title: 'Offer Received', desc: 'Conditional / Unconditional offer' },
  { id: 'visa_sub', title: 'Visa Submitted', desc: 'Biometrics & financial proof filed' },
  { id: 'visa_app', title: 'Visa Approved', desc: 'Embassy grant & pre-departure' }
];

export default function ApplicationsView() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationAPI.getApplications();
      if (res.success) {
        setApplications(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const sampleApps = applications.length > 0 ? applications : [
    {
      _id: 'app1',
      studentName: 'Hamza Khan',
      universityName: 'University of Hertfordshire',
      country: 'UK',
      course: 'MSc Advanced Computer Science',
      intake: 'September 2026',
      currentStepIndex: 4,
      status: 'OFFER_RECEIVED',
      offerType: 'Conditional (MOI letter required)',
      deadline: '15 July 2026',
      flag: '🇬🇧'
    },
    {
      _id: 'app2',
      studentName: 'Ayesha Noor',
      universityName: 'Deakin University',
      country: 'Australia',
      course: 'Master of Information Technology',
      intake: 'July 2026',
      currentStepIndex: 5,
      status: 'VISA_SUBMITTED',
      offerType: 'Unconditional (CoE Issued)',
      deadline: '20 June 2026',
      flag: '🇦🇺'
    },
    {
      _id: 'app3',
      studentName: 'Bilal Tariq',
      universityName: 'IU International University of Applied Sciences',
      country: 'Germany',
      course: 'MSc Data Management',
      intake: 'October 2026',
      currentStepIndex: 3,
      status: 'SUBMITTED',
      offerType: 'Pending Decision',
      deadline: '30 August 2026',
      flag: '🇩🇪'
    },
    {
      _id: 'app4',
      studentName: 'Zainab Malik',
      universityName: 'University of Debrecen',
      country: 'Hungary',
      course: 'BSc Business Administration',
      intake: 'September 2026',
      currentStepIndex: 6,
      status: 'VISA_APPROVED',
      offerType: 'Stipendium Hungaricum Award',
      deadline: 'Completed',
      flag: '🇭🇺'
    }
  ];

  const filteredApps = sampleApps.filter((a) =>
    a.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    a.universityName?.toLowerCase().includes(search.toLowerCase()) ||
    a.course?.toLowerCase().includes(search.toLowerCase())
  );

  const activeApp = selectedApp || filteredApps[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6"
    >
      {/* Top Header */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              Application & Visa Journey Timeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#2563EB]/30 text-[#3B82F6] text-xs font-black border border-[#3B82F6]/40">
              {filteredApps.length} Active Pipelines
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Step-by-step visual progression tracking from student qualification to embassy visa issuance.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search application or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs glass-input rounded-xl focus:outline-none placeholder-slate-400"
          />
        </div>
      </div>

      {/* Visual Journey Stepper Banner */}
      {activeApp && (
        <div className="glass-card p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-4 sm:space-y-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#F59E0B]">
                Active Progression Tracker
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white mt-0.5">
                {activeApp.studentName} — {activeApp.universityName}
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-1">
                {activeApp.course} • Target Intake: {activeApp.intake} • Offer: {activeApp.offerType}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                {TIMELINE_STEPS[activeApp.currentStepIndex]?.title}
              </span>
            </div>
          </div>

          {/* Mobile Swipe Hint */}
          <div className="sm:hidden flex items-center justify-between text-[11px] text-slate-300 font-semibold px-1 pt-1 border-t border-white/10">
            <span>Current: Step {activeApp.currentStepIndex + 1} of 7</span>
            <span className="text-[#F59E0B]">Swipe steps →</span>
          </div>

          {/* 7-Step Visual Timeline Pipeline */}
          <div className="pt-2 sm:pt-4 overflow-x-auto pb-3 relative z-10 scrollbar-thin scrollbar-thumb-white/20">
            <div className="flex items-center min-w-[720px] justify-between relative px-2">
              
              <div className="absolute top-4 left-4 right-4 h-1 bg-white/10 rounded-full z-0" />

              {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = idx < activeApp.currentStepIndex;
                const isCurrent = idx === activeApp.currentStepIndex;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center text-center w-24">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs transition-all shadow-lg ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-[#F59E0B] text-[#071A33] ring-4 ring-[#F59E0B]/30 scale-110'
                          : 'bg-black/40 text-slate-400 border border-white/15'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </motion.div>

                    <div className="mt-2 text-[10px] font-bold text-white leading-tight">
                      {step.title}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 max-w-[80px] leading-tight">
                      {step.desc}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>
      )}

      {/* Applications Roster Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-white uppercase tracking-wider">
          All Student Admissions Pipelines ({filteredApps.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApps.map((app) => {
            const isSelected = activeApp?._id === app._id;
            return (
              <motion.div
                key={app._id}
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => setSelectedApp(app)}
                className={`p-5 rounded-3xl transition-all cursor-pointer space-y-4 shadow-xl ${
                  isSelected
                    ? 'glass-card border-[#3B82F6] ring-2 ring-[#3B82F6]/30'
                    : 'glass-card hover:border-white/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{app.flag}</span>
                    <div>
                      <h4 className="font-black text-sm text-white">{app.studentName}</h4>
                      <p className="text-xs text-slate-400 font-medium">{app.universityName}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-[#2563EB]/30 text-[#3B82F6] font-black text-[10px] border border-[#3B82F6]/40">
                    Step {app.currentStepIndex + 1} of 7
                  </span>
                </div>

                <div className="p-3 bg-black/30 rounded-2xl border border-white/10 text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Course:</span>
                    <span className="font-bold text-white">{app.course}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Intake:</span>
                    <span className="font-bold text-white">{app.intake}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Phase:</span>
                    <span className="font-black text-emerald-400">
                      {TIMELINE_STEPS[app.currentStepIndex]?.title}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#2563EB] to-emerald-400 h-full rounded-full"
                      style={{ width: `${((app.currentStepIndex + 1) / 7) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
