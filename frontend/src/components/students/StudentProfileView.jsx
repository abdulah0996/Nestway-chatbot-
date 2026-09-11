import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { leadAPI, applicationAPI, documentAPI } from '../../services/api';
import {
  User,
  Phone,
  Mail,
  Award,
  BookOpen,
  Globe,
  FileText,
  Calendar,
  MessageSquare,
  ChevronLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Send,
  Download,
  AlertCircle,
  Building,
  GraduationCap,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function StudentProfileView({ initialStudent, onBack }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(initialStudent || null);
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState([
    { id: 1, author: 'Ahmed Khan (Senior Counselor)', date: 'Today at 10:30 AM', text: 'Student is aiming for UK September 2026 intake. Transcripts verified with 3.4 CGPA. Recommending University of Hertfordshire and Aston University with MOI waiver.' },
    { id: 2, author: 'System Bot', date: 'Yesterday at 4:15 PM', text: 'Candidate completed AI Eligibility assessment with 88% overall qualification score.' }
  ]);

  useEffect(() => {
    if (!initialStudent) {
      loadStudents();
    }
  }, [initialStudent]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await leadAPI.getLeads();
      if (res.success && res.data?.length > 0) {
        setStudents(res.data);
        if (!selectedStudent) setSelectedStudent(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes([
      {
        id: Date.now(),
        author: 'Ahmed Khan (Counselor)',
        date: 'Just now',
        text: newNote
      },
      ...notes
    ]);
    setNewNote('');
  };

  const current = selectedStudent || {
    fullName: 'Hamza Khan',
    email: 'hamza.khan@example.com',
    phone: '+92 300 1234567',
    countryInterest: 'UK',
    qualification: 'Bachelor of Science in Computer Science',
    cgpa: '3.42',
    englishTest: 'IELTS Band 7.0 (L:7.5, R:7.0, W:6.5, S:7.0)',
    leadScore: 88,
    stage: 'Application Started',
    intake: 'Fall 2026',
    budget: '£16,000 / year',
    assignedCounselor: { name: 'Ahmed Khan' }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'academic', label: 'Academic Background', icon: BookOpen },
    { id: 'english', label: 'English Test', icon: Award },
    { id: 'countries', label: 'Preferred Countries', icon: Globe },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'applications', label: 'Applications', icon: GraduationCap },
    { id: 'communication', label: 'Counselor Notes', icon: MessageSquare }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Top Navigation & Student Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl glass-card text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Student 360 CRM Profile
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Complete applicant record, academic dossier, verified documents, and counselor interaction logs.
            </p>
          </div>
        </div>

        {students.length > 1 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400">Switch Student:</span>
            <select
              value={current._id || ''}
              onChange={(e) => {
                const found = students.find((s) => s._id === e.target.value);
                if (found) setSelectedStudent(found);
              }}
              className="px-3.5 py-2 text-xs font-bold glass-input rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              {students.map((s) => (
                <option key={s._id} value={s._id} className="bg-[#071A33] text-white">
                  {s.fullName} ({s.countryInterest})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Header Profile Dossier Card */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-[#2563EB]/30">
            {current.fullName?.charAt(0) || 'S'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-black text-white">{current.fullName}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
                {current.stage || 'Application Started'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center space-x-2">
              <span>{current.email}</span>
              <span>•</span>
              <span>{current.phone}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="p-3 px-4 glass-card rounded-2xl text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Profile Score</div>
            <div className="text-lg font-black text-[#F59E0B]">{current.leadScore || 88}%</div>
          </div>

          <div className="p-3 px-4 glass-card rounded-2xl text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Counselor</div>
            <div className="text-xs font-extrabold text-white mt-0.5">
              {current.assignedCounselor?.name || 'Ahmed Khan'}
            </div>
          </div>

          <a
            href={`https://wa.me/${current.phone?.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center space-x-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-[#2563EB]/30'
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {/* 1. PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Primary Identity & Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Full Legal Name</span>
                  <p className="font-extrabold text-sm text-white">{current.fullName}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Primary Email</span>
                  <p className="font-extrabold text-sm text-white">{current.email || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Phone (WhatsApp)</span>
                  <p className="font-extrabold text-sm text-white">{current.phone}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Nationality</span>
                  <p className="font-extrabold text-sm text-white">Pakistan / South Asia</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Passport Status</span>
                  <p className="font-extrabold text-sm text-emerald-400">Valid until March 2031</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">CRM Pipeline Stage</span>
                  <p className="font-extrabold text-sm text-[#60A5FA]">{current.stage}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. ACADEMIC BACKGROUND */}
          {activeTab === 'academic' && (
            <motion.div
              key="academic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Educational Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Highest Degree</span>
                    <span className="px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#60A5FA] font-extrabold text-[10px]">4 Years BS</span>
                  </div>
                  <h4 className="text-base font-black text-white">{current.qualification || "Bachelor's in CS"}</h4>
                  <p className="text-slate-400 font-medium">Graduation Year: 2024 • Verified by HEC</p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Cumulative GPA</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px]">First Division</span>
                  </div>
                  <h4 className="text-2xl font-black text-white">{current.cgpa || '3.40'} <span className="text-sm font-bold text-slate-400">/ 4.0</span></h4>
                  <p className="text-slate-400 font-medium">Meets top UK/Australia Russell Group & Go8 standards.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. ENGLISH TEST */}
          {activeTab === 'english' && (
            <motion.div
              key="english"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Language Proficiency Examination
              </h3>
              <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-white">IELTS Academic Test</h4>
                    <p className="text-xs text-slate-400 font-medium">Valid until August 2027</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#60A5FA]">Band 7.0</div>
                    <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">CEFR C1 Qualified</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10">
                    <div className="text-slate-400 font-bold text-[10px]">Listening</div>
                    <div className="text-base font-black text-white mt-1">7.5</div>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10">
                    <div className="text-slate-400 font-bold text-[10px]">Reading</div>
                    <div className="text-base font-black text-white mt-1">7.0</div>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10">
                    <div className="text-slate-400 font-bold text-[10px]">Writing</div>
                    <div className="text-base font-black text-white mt-1">6.5</div>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10">
                    <div className="text-slate-400 font-bold text-[10px]">Speaking</div>
                    <div className="text-base font-black text-white mt-1">7.0</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. PREFERRED COUNTRIES */}
          {activeTab === 'countries' && (
            <motion.div
              key="countries"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Study Abroad Preferences & Budget
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Primary Country</span>
                  <p className="font-black text-sm text-white mt-1">🇬🇧 {current.countryInterest || 'United Kingdom'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Target Intake</span>
                  <p className="font-black text-sm text-white mt-1">{current.intake || 'September 2026'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Budget Bracket</span>
                  <p className="font-black text-sm text-white mt-1">{current.budget || '£15,000 - £18,000'}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 5. DOCUMENTS */}
          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Uploaded Verification Files (4)
                </h3>
                <span className="text-xs font-bold text-[#60A5FA]">All Files Encrypted</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { name: 'Passport_Hamza_Khan.pdf', size: '2.4 MB', status: 'Verified', date: 'Yesterday' },
                  { name: 'BS_Computer_Science_Transcript.pdf', size: '4.1 MB', status: 'Verified', date: 'Yesterday' },
                  { name: 'IELTS_Official_TRF_Result.pdf', size: '1.2 MB', status: 'Verified', date: 'Today' },
                  { name: 'Bank_Statement_Sponsorship.pdf', size: '3.6 MB', status: 'Pending Review', date: 'Today' }
                ].map((doc, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-[#60A5FA]" />
                      <div>
                        <div className="font-bold text-white">{doc.name}</div>
                        <div className="text-[10px] text-slate-400">{doc.size} • Uploaded {doc.date}</div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-black text-[10px] ${
                      doc.status === 'Verified'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 6. APPLICATIONS */}
          {activeTab === 'applications' && (
            <motion.div
              key="applications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Submitted University Applications
              </h3>
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-white">University of Hertfordshire (UK)</h4>
                  <p className="text-xs text-slate-400 font-medium">MSc Advanced Computer Science • September 2026</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#2563EB]/20 text-[#60A5FA] border border-[#3B82F6]/30 font-black text-xs">
                  Conditional Offer Received
                </span>
              </div>
            </motion.div>
          )}

          {/* 7. COMMUNICATION HISTORY */}
          {activeTab === 'communication' && (
            <motion.div
              key="communication"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Counselor Notes & Communication Stream
              </h3>

              {/* Note Input */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  placeholder="Log a call, interview notes, or visa guidance remarks..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full p-3.5 text-xs glass-input rounded-2xl text-white placeholder-slate-400 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl text-xs font-bold hover:brightness-110 flex items-center space-x-1.5 transition-all shadow-md shadow-[#2563EB]/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Counselor Note</span>
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-3 pt-2">
                {notes.map((n) => (
                  <div key={n.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-white">{n.author}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{n.date}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-medium">{n.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
