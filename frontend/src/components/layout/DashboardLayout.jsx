import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Kanban,
  Users,
  Bot,
  CalendarDays,
  FileCheck2,
  GraduationCap,
  FileText,
  BarChart3,
  Settings,
  Search,
  Bell,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  UserCheck,
  ShieldCheck,
  Plus,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Command,
  Globe
} from 'lucide-react';

export default function DashboardLayout({
  children,
  activeTab,
  setActiveTab,
  onNewLeadClick,
  onBookMeetingClick
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [counselorStatus, setCounselorStatus] = useState('Available');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setNotificationsOpen(false);
        setMessagesOpen(false);
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'inbox', label: 'Inbox', icon: MessageSquare, badge: 'WhatsApp' },
    { id: 'leads', label: 'Leads', icon: Kanban, badge: null },
    { id: 'counselors', label: 'Counselors', icon: Users, badge: null },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays, badge: null },
    { id: 'applications', label: 'Applications', icon: GraduationCap, badge: null },
    { id: 'documents', label: 'Documents', icon: FileText, badge: null },
    { id: 'reports', label: 'Reports', icon: BarChart3, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null }
  ];

  const notifications = [
    {
      id: 1,
      title: 'High-Intent Student Qualified',
      desc: 'Hamza Khan scored 92% for UK MSc Computer Science',
      time: '5m ago',
      unread: true,
      type: 'ai'
    },
    {
      id: 2,
      title: 'New Document Uploaded',
      desc: 'Sarah Ahmed submitted IELTS Scorecard (Band 7.5)',
      time: '24m ago',
      unread: true,
      type: 'doc'
    },
    {
      id: 3,
      title: 'Consultation In 30 Mins',
      desc: 'Zoom meeting with Zainab Malik for Australia Visa Assessment',
      time: '32m ago',
      unread: false,
      type: 'meeting'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071A33] via-[#0B254B] to-[#0F3B73] text-[#F8FAFC] flex flex-col antialiased selection:bg-[#3B82F6] selection:text-white">
      
      {/* 1. TOP GLASS NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#071A33]/80 backdrop-blur-2xl border-b border-white/10 shadow-lg h-16 flex items-center justify-between px-3 sm:px-6 gap-2">
        
        {/* Left: Brand Logo & Mobile Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 lg:hidden focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => {
              if (user?.role === 'ADMIN') {
                if (setActiveTab) setActiveTab('dashboard');
                navigate('/admin/dashboard');
              } else if (user?.role === 'COUNSELOR') {
                if (setActiveTab) setActiveTab('whatsapp-inbox');
                navigate('/counselor/inbox');
              } else {
                navigate('/student/chat');
              }
            }}
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/30 group-hover:scale-105 transition-transform shrink-0">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
                  WhatsApp AI
                </span>
                <span className="hidden xs:inline-flex text-[9px] sm:text-[10px] uppercase font-black px-1.5 sm:px-2 py-0.5 rounded-full bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 tracking-wider items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
                  <span className="hidden sm:inline">WhatsApp Business</span>
                  <span className="sm:hidden">CRM</span>
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-400 font-medium -mt-0.5">Immigration Sales & Student CRM Automation</p>
            </div>
          </div>
        </div>

        {/* Middle: Universal Search Bar */}
        <div className="flex-1 max-w-xl mx-2 sm:mx-4 hidden md:block">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 text-slate-300 px-3.5 py-2 rounded-2xl border border-white/10 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <div className="flex items-center space-x-2.5">
              <Search className="w-4 h-4 text-[#3B82F6]" />
              <span className="truncate">Search students, leads, universities, documents...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-white/10 rounded-lg border border-white/10 shrink-0">
              <Command className="w-2.5 h-2.5 mr-0.5" /> K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Action, Search Icon on Mobile, Notifications, Profile */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          
          {/* Mobile Search Button */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 md:hidden transition-colors"
            title="Search"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-[#3B82F6]" />
          </button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onBookMeetingClick || (() => navigate('/admin/appointments/new'))}
            className="hidden md:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            title="Schedule New Consultation"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>New Appointment</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onNewLeadClick || (() => { if (setActiveTab) setActiveTab('leads'); })}
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white text-xs font-bold shadow-lg shadow-blue-500/30 btn-glow whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lead</span>
          </motion.button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setMessagesOpen(false);
                setProfileMenuOpen(false);
              }}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F59E0B] ring-2 ring-[#071A33]"></span>
            </button>

            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 glass-card rounded-2xl overflow-hidden z-50 shadow-2xl"
              >
                <div className="p-3.5 bg-black/40 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h4>
                    <span className="px-1.5 py-0.2 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold">2 new</span>
                  </div>
                  <button className="text-[11px] font-bold text-[#3B82F6] hover:underline">Mark all read</button>
                </div>
                <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3.5 hover:bg-white/5 transition-colors flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 text-[#3B82F6] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{n.title}</div>
                        <p className="text-[11px] text-slate-300 leading-snug mt-0.5">{n.desc}</p>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileMenuOpen(!profileMenuOpen);
                setNotificationsOpen(false);
                setMessagesOpen(false);
              }}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors text-left"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white text-xs font-black shadow-inner">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#071A33] ${
                  counselorStatus === 'Available' ? 'bg-emerald-400' : 'bg-[#F59E0B]'
                }`} />
              </div>
              <div className="hidden lg:block">
                <div className="text-xs font-bold text-white leading-tight">{user?.name || 'Ahmed Khan'}</div>
                <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 capitalize">
                  {user?.role ? user.role.toLowerCase() : 'Senior Counselor'}
                </div>
              </div>
            </button>

            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-64 glass-card rounded-2xl overflow-hidden z-50 shadow-2xl"
              >
                <div className="p-4 bg-black/40 border-b border-white/10">
                  <div className="font-bold text-xs text-white">{user?.name || 'Ahmed Khan'}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email || 'ahmed@immigration.ai'}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                    <select
                      value={counselorStatus}
                      onChange={(e) => setCounselorStatus(e.target.value)}
                      className="text-[11px] font-bold border border-white/20 rounded-lg px-2 py-0.5 bg-[#071A33] text-white focus:outline-none"
                    >
                      <option value="Available">🟢 Available</option>
                      <option value="In Consultation">🟡 In Meeting</option>
                      <option value="Busy">🔴 Away</option>
                    </select>
                  </div>
                </div>

                <div className="p-1.5 text-xs font-semibold text-slate-300">
                  <button
                    onClick={() => {
                      if (setActiveTab) setActiveTab('students');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>My Assigned Students</span>
                  </button>
                  <button
                    onClick={() => {
                      if (setActiveTab) setActiveTab('meetings');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                  >
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    <span>Consultation Schedule</span>
                  </button>
                </div>

                <div className="p-1.5 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      </header>

      {/* 2. BODY SHELL: FLOATING GLASS SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden p-1.5 sm:p-3 md:p-4 gap-2 sm:gap-4">
        
        {/* FLOATING GLASS SIDEBAR DESKTOP */}
        <motion.aside
          layout
          className={`hidden lg:flex flex-col glass-card rounded-3xl transition-all duration-300 z-30 shrink-0 overflow-hidden ${
            collapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Header Toggle */}
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
            {!collapsed && (
              <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 pl-2">
                Navigation
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors mx-auto"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (setActiveTab) setActiveTab(item.id);
                    navigate(`/admin/${item.id}`);
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-2xl text-xs font-bold transition-all relative group ${
                    collapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 space-x-3'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {/* Glowing Accent Indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="sidebarActiveGlow"
                      className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-[#F59E0B]"
                    />
                  )}

                  <Icon
                    className={`shrink-0 transition-transform ${
                      collapsed ? 'w-5 h-5' : 'w-4 h-4'
                    } ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />

                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            item.badge === 'WhatsApp'
                              ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40'
                              : 'bg-white/20 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Sidebar Footer Widget: Target Study Hubs */}
          {!collapsed ? (
            <div className="p-3.5 m-3 bg-black/40 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-2">
                <span className="flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Target Countries</span>
                </span>
                <span className="text-[10px] text-[#F59E0B] font-black">5 Hubs</span>
              </div>
              <div className="flex items-center justify-between text-base px-1 pt-1">
                <span title="United Kingdom" className="hover:scale-125 transition-transform cursor-pointer">🇬🇧</span>
                <span title="Australia" className="hover:scale-125 transition-transform cursor-pointer">🇦🇺</span>
                <span title="Italy" className="hover:scale-125 transition-transform cursor-pointer">🇮🇹</span>
                <span title="Germany" className="hover:scale-125 transition-transform cursor-pointer">🇩🇪</span>
                <span title="Hungary" className="hover:scale-125 transition-transform cursor-pointer">🇭🇺</span>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-lg text-slate-400 border-t border-white/10">
              🌍
            </div>
          )}
        </motion.aside>

        {/* MOBILE HAMBURGER DRAWER */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/75 backdrop-blur-md"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="relative w-72 max-w-[85vw] glass-card text-white flex flex-col p-4 shadow-2xl z-50 bg-[#071A33]/95 border-r border-white/15 h-full"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#25D366] flex items-center justify-center shadow-md">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-black text-white text-sm block">WhatsApp AI Suite</span>
                      <span className="text-[10px] text-[#25D366] font-bold">Immigration CRM</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Navigation Links */}
                <nav className="flex-1 py-3 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (setActiveTab) setActiveTab(item.id);
                          navigate(`/admin/${item.id}`);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-lg'
                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              item.badge === 'WhatsApp'
                                ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40'
                                : 'bg-white/20 text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Target Hubs in Mobile Drawer */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/10 text-xs mb-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5">
                    <span className="flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Target Hubs</span>
                    </span>
                    <span className="text-[10px] text-[#F59E0B] font-black">5 Countries</span>
                  </div>
                  <div className="flex items-center justify-between text-base px-1">
                    <span>🇬🇧</span>
                    <span>🇦🇺</span>
                    <span>🇮🇹</span>
                    <span>🇩🇪</span>
                    <span>🇭🇺</span>
                  </div>
                </div>

                {/* Sign Out CTA in Drawer */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-bold transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 3. MAIN WORKSPACE CANVAS WITH FRAMER MOTION PAGE TRANSITION */}
        <main
          className={`flex-1 min-w-0 rounded-2xl sm:rounded-3xl relative ${
            activeTab === 'inbox' || activeTab === 'whatsapp-inbox'
              ? 'overflow-hidden p-0'
              : 'overflow-y-auto'
          }`}
        >
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </main>

      </div>

      {/* QUICK SEARCH MODAL (CMD+K) */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl glass-card rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center space-x-3">
              <Search className="w-5 h-5 text-[#3B82F6]" />
              <input
                type="text"
                autoFocus
                placeholder="Search leads, students, programs, documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 bg-white/10 rounded-lg"
              >
                ESC
              </button>
            </div>

            <div className="p-4 space-y-2 text-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Navigation</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (setActiveTab) setActiveTab('leads');
                    setSearchModalOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center space-x-2 text-left"
                >
                  <Kanban className="w-4 h-4 text-[#3B82F6]" />
                  <span className="font-bold text-white">Open CRM Leads</span>
                </button>
                <button
                  onClick={() => {
                    if (setActiveTab) setActiveTab('ai-assistant');
                    setSearchModalOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center space-x-2 text-left"
                >
                  <Bot className="w-4 h-4 text-[#F59E0B]" />
                  <span className="font-bold text-white">AI Admissions Advisor</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
