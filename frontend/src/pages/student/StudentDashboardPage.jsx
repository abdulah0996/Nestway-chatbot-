import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { applicationAPI, meetingAPI } from '../../services/api';
import DocumentsWorkspaceView from '../../components/documents/DocumentsWorkspaceView';
import AIAssistantView from '../../components/assistant/AIAssistantView';
import ApplicationsView from '../../components/applications/ApplicationsView';
import {
  User,
  FileText,
  GraduationCap,
  Calendar,
  Award,
  CheckCircle2,
  Bot,
  ShieldCheck,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Normalize tab for Student: default to 'chat' (/student/chat)
  const getInitialTab = (t) => {
    if (t === 'chat' || t === 'ai-counselor') return 'chat';
    if (t === 'profile' || t === 'dashboard') return 'profile';
    if (t === 'applications') return 'applications';
    if (t === 'documents') return 'documents';
    return 'chat';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab(tab));
  const [applications, setApplications] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab) {
      setActiveTab(getInitialTab(tab));
    }
  }, [tab]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [appRes, meetRes] = await Promise.all([
        applicationAPI.getApplications(),
        meetingAPI.getMeetings()
      ]);

      if (appRes.success) setApplications(appRes.data || []);
      if (meetRes.success) setMeetings(meetRes.data || []);
    } catch (err) {
      console.error('Error fetching student data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`/student/${newTab}`);
  };

  const studentTabs = [
    { id: 'chat', label: 'AI Chat Assistant', icon: Bot },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'applications', label: 'Applications', icon: GraduationCap },
    { id: 'documents', label: 'Documents', icon: CheckCircle2 }
  ];

  return (
    <div className="min-h-screen text-slate-100 flex flex-col antialiased">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Student Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-[#2563EB]/30">
              {user?.name ? user.name.charAt(0) : 'S'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Welcome back, {user?.name || 'Student Candidate'}!
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  Target Fall 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center mt-1 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#F59E0B] mr-1" />
                Verified Student Portal • Admissions & Visa Journey
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-white/5 p-3 px-4 rounded-2xl border border-white/10 text-xs">
            <User className="w-5 h-5 text-[#F59E0B]" />
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-bold">Assigned Immigration Advisor</div>
              <div className="font-extrabold text-white">Ahmed Khan (Senior Consultant)</div>
            </div>
          </div>
        </motion.div>

        {/* 4 Role Dashboard Tabs: AI Chat Assistant, Profile, Applications, Documents */}
        <div className="flex flex-wrap gap-2">
          {studentTabs.map((tabItem) => {
            const Icon = tabItem.icon;
            const isActive = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                onClick={() => handleTabChange(tabItem.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-[#2563EB]/30'
                    : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tabItem.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          {/* TAB 1: AI CHAT ASSISTANT */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AIAssistantView />
            </motion.div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* 3 Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <motion.div whileHover={{ y: -4 }} className="glass-card p-5 rounded-3xl flex items-center space-x-4 shadow-lg">
                  <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/20 border border-[#3B82F6]/30 text-[#60A5FA] flex items-center justify-center font-black">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Active Applications</p>
                    <h3 className="text-2xl font-black text-white">{applications.length || 2} Active</h3>
                  </div>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} className="glass-card p-5 rounded-3xl flex items-center space-x-4 shadow-lg">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-[#F59E0B] flex items-center justify-center font-black">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Consultations</p>
                    <h3 className="text-2xl font-black text-white">{meetings.length || 1} Upcoming</h3>
                  </div>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} className="glass-card p-5 rounded-3xl flex items-center space-x-4 shadow-lg">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Admissions Eligibility</p>
                    <h3 className="text-2xl font-black text-white">88% High Match</h3>
                  </div>
                </motion.div>
              </div>

              {/* Student Candidate Profile Card */}
              <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-white">Student Candidate Profile</h2>
                    <p className="text-xs text-slate-400 font-medium">Personal academic background and immigration roadmap</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#2563EB]/20 text-[#60A5FA] border border-[#3B82F6]/30 text-xs font-bold">
                    Profile Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
                  <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Full Name</span>
                    <strong className="text-white text-sm block">{user?.name || 'Ali Raza'}</strong>
                  </div>
                  <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Email Address</span>
                    <strong className="text-white text-sm block">{user?.email || 'student@immigration.com'}</strong>
                  </div>
                  <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Phone / WhatsApp</span>
                    <strong className="text-white text-sm block">{user?.phone || '+92 300 1234567'}</strong>
                  </div>
                  <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Target Country</span>
                    <strong className="text-emerald-400 text-sm block">🇬🇧 United Kingdom</strong>
                  </div>
                  <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Intended Intake</span>
                    <strong className="text-amber-400 text-sm block">Fall 2026 (September)</strong>
                  </div>
                  <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Academic Background</span>
                    <strong className="text-white text-sm block">Bachelor in Computer Science (CGPA: 3.4)</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: APPLICATIONS */}
          {activeTab === 'applications' && (
            <motion.div key="apps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ApplicationsView />
            </motion.div>
          )}

          {/* TAB 4: DOCUMENTS */}
          {activeTab === 'documents' && (
            <motion.div key="docs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <DocumentsWorkspaceView isCounselorView={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
