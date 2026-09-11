import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { meetingAPI } from '../../services/api';
import {
  CalendarDays,
  Clock,
  Video,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  MessageSquare,
  RotateCcw,
  XCircle,
  Check,
  Phone,
  Building2,
  AlertCircle,
  X
} from 'lucide-react';
import BookingModal from './BookingModal';
import { startNewCustomerChat } from '../../services/customerChat';
import ErrorBoundary from '../common/ErrorBoundary';

function MeetingsViewContent() {
  const navigate = useNavigate();
  const [calendarView, setCalendarView] = useState('monthly');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedMeetingForReschedule, setSelectedMeetingForReschedule] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [toastNotice, setToastNotice] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchMeetings();
    const refresh = () => fetchMeetings(false);
    const timer = setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);
    window.addEventListener('appointments-updated', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('appointments-updated', refresh);
    };
  }, []);

  const triggerToast = (text) => {
    setToastNotice(text);
    setTimeout(() => setToastNotice(null), 3000);
  };

  const fetchMeetings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const apiUrl = '/api/meetings';
    console.log(`[MeetingsView] API URL called: ${apiUrl}`);
    try {
      const res = await meetingAPI.getMeetings();
      const status = res?.success ? 200 : 'unknown';
      const count = Array.isArray(res?.data) ? res.data.length : (res?.count || 0);
      console.log(`[MeetingsView] Response status: ${status}`);
      console.log(`[MeetingsView] Returned appointments count: ${count}`);
      if (res && (res.success || Array.isArray(res.data))) {
        setMeetings(res.data || []);
        setLoadError('');
      }
    } catch (err) {
      console.error(`[MeetingsView] API URL called: ${apiUrl}`);
      console.error(`[MeetingsView] Response status: ${err?.status || err?.statusCode || 401}`);
      console.error(`[MeetingsView] Returned appointments count: 0`);
      console.error('Failed to load meetings:', err);
      setLoadError(err.message || 'Could not load appointments. Retrying automatically.');
    } finally {
      setLoading(false);
    }
  };

  const sampleMeetings = meetings;

  // Filtering Logic
  const todayStr = new Date().toISOString().split('T')[0];
  const calendarDate = new Date(`${selectedDate}T12:00:00`);
  const monthPrefix = selectedDate.slice(0, 7);
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const firstWeekday = (new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay() + 6) % 7;
  const dayMeetings = meetings.filter(m => m.date === selectedDate);
  const todayMeetings = meetings.filter(m => m.date === todayStr && ['CONFIRMED', 'PENDING', 'Scheduled'].includes(m.status));
  const weekStart = new Date(calendarDate);
  weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekMeetings = meetings.filter(m => {
    const date = new Date(`${m.date}T12:00:00`);
    return date >= weekStart && date < weekEnd;
  });
  const changeMonth = (offset) => {
    const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + offset, 1, 12);
    setSelectedDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
  };
  const filteredMeetings = sampleMeetings.filter((m) => {
    const status = (m.status || 'PENDING').toUpperCase();
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return status === 'PENDING';
    if (statusFilter === 'CONFIRMED') return status === 'CONFIRMED';
    if (statusFilter === 'UPCOMING') {
      return (status === 'CONFIRMED' || status === 'PENDING' || status === 'RESCHEDULED') && (m.date >= todayStr);
    }
    if (statusFilter === 'COMPLETED') return status === 'COMPLETED';
    if (statusFilter === 'CANCELLED') return status === 'CANCELLED';
    if (statusFilter === 'RESCHEDULED') return status === 'RESCHEDULED';
    return true;
  });

  // Action Handlers
  const handleOpenChat = (m) => {
    const sessionKey = m.sessionId || m.leadId?.phone || m.phone || '';
    if (sessionKey) {
      navigate(`/admin/inbox?session=${encodeURIComponent(sessionKey)}`);
    } else {
      navigate('/admin/inbox');
    }
  };

  const handleConfirmMeeting = async (m) => {
    try {
      const res = await meetingAPI.confirmMeeting({
        meetingId: m._id,
        sessionId: m.sessionId
      });
      if (res?.success) {
        triggerToast('Consultation Confirmed! ✅');
        window.dispatchEvent(new CustomEvent('appointments-updated', { detail: res.data }));
        try { localStorage.setItem('appointments_last_update', Date.now().toString()); } catch (e) {}
        fetchMeetings(false);
      } else {
        triggerToast(res?.message || 'Failed to confirm appointment.');
      }
    } catch (err) {
      console.error('Failed to confirm meeting:', err);
      triggerToast(err.message || 'Failed to confirm appointment.');
    }
  };

  const handleReschedule = (m) => {
    setSelectedMeetingForReschedule({
      ...m,
      fullName: m.leadId?.fullName || m.fullName,
      phone: m.leadId?.phone || m.phone,
      email: m.leadId?.email || m.email,
      meetingType: m.meetingType,
      consultationType: m.consultationType || m.appointmentType
    });
    setIsRescheduleOpen(true);
  };

  const handleCancelClick = (m) => {
    setMeetingToCancel(m);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!meetingToCancel) return;
    setCancelLoading(true);
    try {
      const targetId = meetingToCancel._id || meetingToCancel.id || meetingToCancel.meetingId;
      const res = await meetingAPI.cancelMeeting({
        meetingId: targetId,
        id: targetId,
        sessionId: meetingToCancel.sessionId || meetingToCancel.leadId?.sessionId,
        reason: cancelReason.trim() || 'Cancelled by Admin'
      });
      if (res?.success) {
        triggerToast('Consultation cancelled successfully ❌');
        window.dispatchEvent(new CustomEvent('appointments-updated', { detail: res.data }));
        try { localStorage.setItem('appointments_last_update', Date.now().toString()); } catch (e) {}
        setShowCancelModal(false);
        setMeetingToCancel(null);
        setCancelReason('');
        await fetchMeetings(false);
      } else {
        triggerToast(res?.message || 'Failed to cancel meeting.');
      }
    } catch (err) {
      console.error('Failed to cancel meeting:', err);
      triggerToast(err.message || 'Failed to cancel meeting.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleMarkCompleted = async (m) => {
    try {
      await meetingAPI.updateStatus(m._id, 'COMPLETED');
      triggerToast('Consultation marked as Completed! ✅');
      window.dispatchEvent(new CustomEvent('appointments-updated'));
      try { localStorage.setItem('appointments_last_update', Date.now().toString()); } catch (e) {}
      fetchMeetings(false);
    } catch (err) {
      console.error('Failed to update status:', err);
      triggerToast('Failed to update meeting status.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Toast Alert */}
      <AnimatePresence>
        {toastNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 px-4 py-2 bg-[#008069] text-white rounded-xl text-xs font-bold shadow-2xl flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex justify-end">
        <button type="button" onClick={startNewCustomerChat} className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold">
          WhatsApp — Start New Conversation
        </button>
      </div>
      {loadError && <p role="alert" className="text-red-400 text-sm">{loadError}</p>}
      <div className="glass-card p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Consultation Schedule & Calendar
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#2563EB]/30 text-[#3B82F6] text-xs font-black border border-[#3B82F6]/40">
              {sampleMeetings.length} Total Bookings
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Manage counselor calendar availability, student Zoom consultations, and visa preparation sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-black/40 p-1 rounded-xl flex items-center space-x-1 border border-white/10">
            {['monthly', 'weekly', 'daily'].map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  calendarView === view
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/admin/appointments/new')}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/30 flex items-center space-x-1.5 btn-glow"
            title="Create New Appointment"
          >
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </motion.button>
        </div>
      </div>

      {/* Main Grid: Calendar on Left (8 cols) + Upcoming Widget on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CALENDAR WORKSPACE (8 cols) */}
        <div className="lg:col-span-8 glass-card rounded-3xl p-6 space-y-6 shadow-xl">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-black text-white">{calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
              <span className="text-xs font-bold text-[#3B82F6] bg-[#2563EB]/20 px-2.5 py-0.5 rounded-full border border-[#3B82F6]/30">
                Current Cycle
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button aria-label="Previous month" onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button aria-label="Next month" onClick={() => changeMonth(1)} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MONTHLY GRID */}
          {calendarView === 'monthly' && (
            <div className="space-y-2">
              <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 py-2 border-b border-white/10 uppercase tracking-wider">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-xs">
                {Array.from({ length: firstWeekday }).map((_, i) => <div key={`blank-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = `${monthPrefix}-${String(day).padStart(2, '0')}`;
                  const isToday = date === todayStr;
                  const count = meetings.filter(m => m.date === date && !['CANCELLED', 'RESCHEDULED'].includes(m.status)).length;
                  const hasMeetings = count > 0;

                  return (
                    <motion.button
                      type="button"
                      aria-label={`${date}: ${count} appointments`}
                      key={day}
                      whileHover={{ scale: 1.03 }}
                      onClick={() => { setSelectedDate(date); setCalendarView('daily'); }}
                      className={`min-h-[52px] sm:min-h-[85px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isToday
                          ? 'border-[#3B82F6] bg-[#2563EB]/25 shadow-lg shadow-blue-500/20'
                          : 'border-white/10 hover:border-white/30 bg-black/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black ${isToday ? 'text-[#3B82F6]' : 'text-slate-300'}`}>
                          {day}
                        </span>
                        {hasMeetings && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                        )}
                      </div>

                      {hasMeetings && (
                        <div className="space-y-1 mt-0.5 sm:mt-1">
                          <div className="p-0.5 sm:p-1 rounded bg-[#2563EB]/40 text-blue-200 font-bold text-[8px] sm:text-[9px] truncate text-center sm:text-left">
                            <span className="sm:hidden">{count}</span>
                            <span className="hidden sm:inline">{count} {count === 1 ? 'Consultation' : 'Consultations'}</span>
                          </div>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEKLY VIEW */}
          {calendarView === 'weekly' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#2563EB]/20 rounded-2xl border border-[#3B82F6]/30 text-xs font-bold text-blue-200">
                Week of {weekStart.toLocaleDateString()}
              </div>
              <div className="space-y-2">
                {weekMeetings.map((m) => (
                  <div key={m._id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-black text-sm text-white">{m.leadId?.fullName || m.fullName}</div>
                      <div className="text-xs text-slate-400 font-medium">{m.date} • {m.time} • {m.meetingType}</div>
                    </div>
                    {m.meetingLink && (
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl text-xs font-bold shadow-md"
                      >
                        Launch Zoom
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DAILY VIEW */}
          {calendarView === 'daily' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-slate-300">Viewing Schedule for:</span>
                <span className="text-xs font-black text-white">{selectedDate}</span>
              </div>

              <div className="space-y-3">
                {dayMeetings.map((m) => {
                  const isCancelled = (m.status || '').toUpperCase() === 'CANCELLED';
                  const isCompleted = (m.status || '').toUpperCase() === 'COMPLETED';
                  const isConfirmed = (m.status || '').toUpperCase() === 'CONFIRMED';
                  return (
                    <div key={m._id} className="p-4 rounded-2xl border border-white/10 bg-black/20 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-sm text-white">{m.leadId?.fullName || m.fullName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                            isCancelled ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                            isConfirmed ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                            'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{m.meetingType} • Counselor: {m.counselorId?.name || m.counselorName || 'Ahmed'}</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-1.5">
                        <span className="text-xs font-black text-[#3B82F6] mr-1">{m.time}</span>
                        
                        {!isCancelled && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleCancelClick(m)}
                            className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold text-xs transition-all flex items-center space-x-1"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-3.5 h-3.5 text-red-400" />
                            <span>Cancel</span>
                          </button>
                        )}

                        {!isCancelled && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleReschedule(m)}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 font-bold text-xs transition-all flex items-center space-x-1"
                            title="Reschedule Booking"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                            <span>Reschedule</span>
                          </button>
                        )}

                        {m.meetingLink && !isCancelled && (
                          <a
                            href={m.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl text-xs font-bold shadow-md"
                          >
                            Join Call
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: UPCOMING MEETINGS WIDGET (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-[#3B82F6]" />
                Upcoming Today
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                {todayMeetings.length} Sessions
              </span>
            </div>

            <div className="space-y-3">
              {todayMeetings.slice(0, 3).map((m) => (
                <div
                  key={m._id}
                  className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{m.leadId?.fullName || m.fullName}</span>
                    <span className="px-2 py-0.5 rounded bg-[#2563EB]/30 text-[#3B82F6] font-black text-[10px]">
                      {m.time}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-0.5 font-medium">
                    <div>Counselor: {m.counselorId?.name || m.counselorName || 'Ahmed Khan'}</div>
                    <div className="text-blue-300 font-bold">{m.meetingType}</div>
                  </div>

                  {m.meetingLink ? (
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-1.5 transition-colors btn-glow"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Online Zoom Room</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenChat(m)}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Customer Chat</span>
                    </button>
                  )}

                  {!['CANCELLED', 'COMPLETED'].includes(m.status) && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => handleCancelClick(m)}
                        className="py-1.5 px-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-[11px] transition-all flex items-center justify-center space-x-1"
                      >
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span>Cancel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReschedule(m)}
                        className="py-1.5 px-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-[11px] transition-all flex items-center justify-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3 text-blue-400" />
                        <span>Reschedule</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full py-2.5 rounded-2xl border border-dashed border-white/20 hover:border-[#3B82F6] text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center justify-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Book Candidate Consultation</span>
            </motion.button>
          </div>
        </div>

      </div>

      {/* 2. ENHANCED APPOINTMENTS MASTER ROSTER WITH ALL FILTERS & ROW ACTIONS */}
      <div className="glass-card p-6 rounded-3xl space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="text-base font-black text-white">Appointments Roster</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
              {filteredMeetings.length} Showing
            </span>
            <button
              type="button"
              onClick={() => navigate('/admin/appointments/new')}
              className="ml-2 px-3 py-1 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-1 transition-transform active:scale-95"
              title="Schedule New Appointment"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Appointment</span>
            </button>
          </div>

          {/* Filter Chips: ALL, PENDING, CONFIRMED, UPCOMING, RESCHEDULED, CANCELLED, COMPLETED */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'CONFIRMED', label: 'Confirmed' },
              { id: 'RESCHEDULED', label: 'Rescheduled' },
              { id: 'UPCOMING', label: 'Upcoming' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'CANCELLED', label: 'Cancelled' }
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setStatusFilter(chip.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  statusFilter === chip.id
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-black/30 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-white/10">
              <tr>
                <th className="py-3 px-3.5">Customer Name</th>
                <th className="py-3 px-3.5">Phone Number</th>
                <th className="py-3 px-3.5">Visa Category</th>
                <th className="py-3 px-3.5">Consultation Type</th>
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5">Time</th>
                <th className="py-3 px-3.5">Assigned Counselor</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMeetings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No appointments found under the '{statusFilter}' filter.
                  </td>
                </tr>
              ) : (
                filteredMeetings.map((m) => {
                  const status = (m.status || 'PENDING').toUpperCase();
                  const isPending = status === 'PENDING';
                  const isCancelled = status === 'CANCELLED';
                  const isCompleted = status === 'COMPLETED';
                  const isRescheduled = status === 'RESCHEDULED';
                  const isConfirmed = status === 'CONFIRMED';
                  const isOnline = (m.consultationType || m.appointmentType || m.meetingType || '').toUpperCase() === 'ONLINE' || (m.meetingType || '').toLowerCase().includes('online');

                  return (
                    <tr key={m._id} className="hover:bg-white/5 transition-colors">
                      {/* 1. Customer Name */}
                      <td className="py-3.5 px-3.5 font-bold text-white whitespace-nowrap">
                        {m.leadId?.fullName || m.fullName || 'Candidate'}
                      </td>

                      {/* 2. Phone Number */}
                      <td className="py-3.5 px-3.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {m.leadId?.phone || m.phone || '—'}
                      </td>

                      {/* 3. Visa Category */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 font-semibold text-[11px] border border-blue-500/20">
                          {m.leadId?.visaCategory || m.leadId?.serviceType || m.serviceType || 'Study Visa'}
                        </span>
                      </td>

                      {/* 4. Consultation Type */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isOnline
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {isOnline ? <Video className="w-3 h-3 mr-1" /> : <Building2 className="w-3 h-3 mr-1" />}
                          <span>{isOnline ? 'Online Consultation' : 'In-Person Consultation'}</span>
                        </span>
                      </td>

                      {/* 5. Date */}
                      <td className="py-3.5 px-3.5 font-medium text-slate-300 whitespace-nowrap">
                        {m.date}
                      </td>

                      {/* 6. Time */}
                      <td className="py-3.5 px-3.5 font-bold text-[#3B82F6] whitespace-nowrap">
                        {m.time}
                      </td>

                      {/* 7. Assigned Counselor */}
                      <td className="py-3.5 px-3.5 text-slate-200 whitespace-nowrap font-medium">
                        {m.counselorId?.name || m.counselorName || 'Senior Counselor'}
                      </td>

                      {/* 8. Status */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isCompleted
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : isCancelled
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : isRescheduled
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : isConfirmed
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {status}
                        </span>
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {!isConfirmed && !isCancelled && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleConfirmMeeting(m)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all flex items-center space-x-1 shadow-xs active:scale-98"
                              title="Confirm Appointment"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Confirm</span>
                            </button>
                          )}

                          {!isCancelled && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleReschedule(m)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 font-bold text-xs transition-all flex items-center space-x-1 shadow-xs active:scale-98"
                              title="Reschedule Appointment"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                              <span>Reschedule</span>
                            </button>
                          )}

                          {!isCancelled && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleCancelClick(m)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold text-xs transition-all flex items-center space-x-1 shadow-xs active:scale-98"
                              title="Cancel Appointment"
                            >
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                              <span>Cancel</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenChat(m)}
                            className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-all"
                            title="Open Customer Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="md:hidden space-y-3">
          {filteredMeetings.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium glass-card rounded-2xl">
              No appointments found under the '{statusFilter}' filter.
            </div>
          ) : (
            filteredMeetings.map((m) => {
              const status = (m.status || 'PENDING').toUpperCase();
              const isPending = status === 'PENDING';
              const isCancelled = status === 'CANCELLED';
              const isCompleted = status === 'COMPLETED';
              const isRescheduled = status === 'RESCHEDULED';
              const isConfirmed = status === 'CONFIRMED';
              const isOnline = (m.consultationType || m.appointmentType || m.meetingType || '').toUpperCase() === 'ONLINE' || (m.meetingType || '').toLowerCase().includes('online');

              return (
                <div key={m._id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {m.leadId?.fullName || m.fullName || 'Candidate'}
                      </h4>
                      <p className="text-xs text-slate-300 font-mono mt-0.5">
                        {m.leadId?.phone || m.phone || '—'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                      isCompleted
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : isCancelled
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : isRescheduled
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : isConfirmed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Date & Time</span>
                      <span className="font-semibold text-slate-200">{m.date} at <strong className="text-[#3B82F6]">{m.time}</strong></span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Counselor</span>
                      <span className="font-semibold text-slate-200 truncate block">{m.counselorId?.name || m.counselorName || 'Senior Counselor'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 font-semibold text-[11px] border border-blue-500/20 truncate">
                      {m.leadId?.visaCategory || m.leadId?.serviceType || m.serviceType || 'Study Visa'}
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      isOnline
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {isOnline ? <Video className="w-3 h-3 mr-1" /> : <Building2 className="w-3 h-3 mr-1" />}
                      <span>{isOnline ? 'Online' : 'In-Person'}</span>
                    </span>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-white/10 flex-wrap">
                    {!isConfirmed && !isCancelled && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleConfirmMeeting(m)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all flex items-center space-x-1 active:scale-98"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Confirm</span>
                      </button>
                    )}

                    {!isCancelled && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleReschedule(m)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 font-bold text-xs transition-all flex items-center space-x-1 active:scale-98"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                        <span>Reschedule</span>
                      </button>
                    )}

                    {!isCancelled && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleCancelClick(m)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold text-xs transition-all flex items-center space-x-1 active:scale-98"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                        <span>Cancel</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenChat(m)}
                      className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-all ml-auto"
                      title="Open Customer Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Admin Cancellation Dialog */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B254B] text-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl border border-white/10 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-3 border border-red-500/40">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-black text-white">Cancel Appointment</h3>
            <p className="text-xs text-slate-200 mt-2 font-bold">
              Are you sure you want to cancel this appointment?
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Customer: <strong className="text-white">{meetingToCancel?.leadId?.fullName || meetingToCancel?.fullName}</strong> • Date: <strong className="text-white">{meetingToCancel?.date}</strong> at <strong className="text-white">{meetingToCancel?.time}</strong>
            </p>

            {/* Optional Cancellation Reason */}
            <div className="mt-3 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Cancellation Reason (Optional):
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Candidate requested, Schedule conflict"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setMeetingToCancel(null);
                  setCancelReason('');
                }}
                className="py-2.5 px-4 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/10 transition-all"
              >
                Keep
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={confirmCancel}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md active:scale-98 disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Slot Modal (New Appointment) */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        leadInfo={{
          fullName: 'Prospective Student',
          phone: '+92 300 0000000',
          email: '',
          countryInterest: 'UK'
        }}
        onBookingConfirmed={() => {
          triggerToast('New appointment scheduled successfully!');
          fetchMeetings();
        }}
      />

      {/* Reschedule Modal */}
      <BookingModal
        isOpen={isRescheduleOpen}
        isReschedule={true}
        currentAppointment={selectedMeetingForReschedule}
        onClose={() => {
          setIsRescheduleOpen(false);
          setSelectedMeetingForReschedule(null);
        }}
        leadInfo={{
          fullName: selectedMeetingForReschedule?.leadId?.fullName || selectedMeetingForReschedule?.fullName || '',
          phone: selectedMeetingForReschedule?.leadId?.phone || selectedMeetingForReschedule?.phone || '',
          email: selectedMeetingForReschedule?.leadId?.email || selectedMeetingForReschedule?.email || '',
          countryInterest: 'UK',
          leadId: selectedMeetingForReschedule?.leadId?._id || selectedMeetingForReschedule?.leadId
        }}
        onBookingConfirmed={() => {
          triggerToast('Consultation successfully rescheduled! 📅');
          fetchMeetings();
        }}
      />
    </motion.div>
  );
}

export default function MeetingsView(props) {
  return (
    <ErrorBoundary title="Appointments Calendar Error">
      <MeetingsViewContent {...props} />
    </ErrorBoundary>
  );
}
