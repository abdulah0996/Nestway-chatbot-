import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Video,
  Building2,
  User,
  Phone,
  Mail,
  Globe,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { meetingAPI } from '../../services/api';

const DEFAULT_SLOTS = [
  { time: '10:00 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '12:00 PM', available: true },
  { time: '02:00 PM', available: true },
  { time: '03:00 PM', available: true },
  { time: '04:00 PM', available: true },
  { time: '05:00 PM', available: true }
];

const COUNSELORS = [
  { id: 'ahmed', name: 'Ahmed Khan', role: 'Senior Admissions & Visa Consultant', specialty: 'UK & Australia Visas' },
  { id: 'sarah', name: 'Sarah Jenkins', role: 'European University Advisor', specialty: 'Germany & Italy Free Tuition' },
  { id: 'zaheer', name: 'Dr. Zaheer Babar', role: 'Head of Immigration Counseling', specialty: 'Complex Refusals & Appeals' }
];

const COUNTRIES = [
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'US', name: 'United States', flag: '🇺🇸' }
];

export default function NewAppointmentView() {
  const navigate = useNavigate();

  // Mode: ONLINE vs IN_PERSON
  const [meetingType, setMeetingType] = useState('Online Zoom Consultation');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState('');

  // Counselor selection
  const [selectedCounselor, setSelectedCounselor] = useState(COUNSELORS[0]);

  // Candidate Details
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    countryInterest: 'UK',
    visaCategory: 'Study Visa',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdAppointment, setCreatedAppointment] = useState(null);

  // Quick date helper presets
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  useEffect(() => {
    loadSlots(selectedDate);
  }, [selectedDate]);

  const loadSlots = async (date) => {
    setLoadingSlots(true);
    setSlotError('');
    setSelectedSlot('');
    try {
      const res = await meetingAPI.getSlots(date);
      if (res?.success && Array.isArray(res.slots) && res.slots.length > 0) {
        setSlots(res.slots);
      } else {
        // Fallback default slots if API slots array is empty
        setSlots(DEFAULT_SLOTS);
      }
    } catch (err) {
      console.warn('[NewAppointmentView] Could not fetch live slots, utilizing active schedule fallback:', err);
      setSlots(DEFAULT_SLOTS);
      setSlotError('Using standard slot availability.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setSubmitError('Please enter candidate full name.');
      return;
    }
    if (!formData.phone.trim()) {
      setSubmitError('Please enter candidate WhatsApp/phone number.');
      return;
    }
    if (!selectedSlot) {
      setSubmitError('Please choose an available appointment time slot.');
      return;
    }

    setSubmitError('');
    setSubmitting(true);

    try {
      const isOnline = meetingType.includes('Online');
      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        countryInterest: formData.countryInterest,
        visaCategory: formData.visaCategory,
        notes: formData.notes,
        date: selectedDate,
        time: selectedSlot,
        meetingType,
        consultationType: isOnline ? 'ONLINE' : 'IN_PERSON',
        appointmentType: isOnline ? 'ONLINE' : 'IN_PERSON',
        counselorName: selectedCounselor.name,
        counselorRole: selectedCounselor.role
      };

      const res = await meetingAPI.bookMeeting(payload);

      if (res?.success && res.data) {
        setCreatedAppointment(res.data);
        window.dispatchEvent(new CustomEvent('appointments-updated', { detail: res.data }));
        try {
          localStorage.setItem('appointments_last_update', Date.now().toString());
        } catch (err) {}
      } else {
        setSubmitError(res?.message || 'Slot reservation conflict. Please choose another time.');
      }
    } catch (err) {
      console.error('[NewAppointmentView] Booking failed:', err);
      setSubmitError(err.message || 'Failed to schedule appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCreatedAppointment(null);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      countryInterest: 'UK',
      visaCategory: 'Study Visa',
      notes: ''
    });
    setSelectedSlot('');
    setSubmitError('');
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Breadcrumbs & Back Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/appointments')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center space-x-1 text-xs font-bold"
            title="Back to Appointments"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center space-x-2 text-xs">
            <span
              onClick={() => navigate('/admin/appointments')}
              className="text-slate-400 hover:text-white cursor-pointer font-semibold"
            >
              Appointments
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[#3B82F6] font-bold">New Appointment</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Calendar Scheduler</span>
          </span>
        </div>
      </div>

      {/* Confirmation Success Screen */}
      <AnimatePresence>
        {createdAppointment ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 sm:p-10 rounded-3xl space-y-6 shadow-2xl max-w-3xl mx-auto border border-emerald-500/30 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Appointment Scheduled Successfully! 🎉
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto font-medium">
                The consultation has been booked and registered in the CRM appointments roster.
                Both candidate and counselor notifications are synchronized.
              </p>
            </div>

            {/* Appointment Dossier Details */}
            <div className="p-6 bg-black/40 rounded-2xl border border-white/10 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Candidate Name</span>
                <p className="text-white font-black text-sm">{createdAppointment.fullName || createdAppointment.leadId?.fullName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Phone / WhatsApp</span>
                <p className="text-emerald-400 font-bold font-mono">{createdAppointment.phone || createdAppointment.leadId?.phone}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Consultation Date & Time</span>
                <p className="text-[#3B82F6] font-extrabold text-sm flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 mr-1 text-[#3B82F6]" />
                  <span>{createdAppointment.date} at {createdAppointment.time}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Consultation Mode</span>
                <p className="text-white font-bold flex items-center space-x-1">
                  {createdAppointment.meetingType?.includes('Online') ? (
                    <Video className="w-4 h-4 text-blue-400 mr-1" />
                  ) : (
                    <Building2 className="w-4 h-4 text-amber-400 mr-1" />
                  )}
                  <span>{createdAppointment.meetingType || meetingType}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Assigned Counselor</span>
                <p className="text-slate-200 font-bold">{createdAppointment.counselorName || selectedCounselor.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Status</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-500/40 uppercase">
                  {createdAppointment.status || 'CONFIRMED'}
                </span>
              </div>

              {createdAppointment.meetingLink && (
                <div className="sm:col-span-2 pt-3 border-t border-white/10">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1">Zoom Meeting Link</span>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <span className="text-blue-300 font-mono text-xs truncate mr-2">
                      {createdAppointment.meetingLink}
                    </span>
                    <a
                      href={createdAppointment.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-lg font-bold text-xs shrink-0 flex items-center space-x-1"
                    >
                      <span>Join Zoom</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/appointments')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>View in Appointments Roster</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const phone = createdAppointment.phone || createdAppointment.leadId?.phone;
                  navigate(`/admin/inbox?session=${encodeURIComponent(phone || '')}`);
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 font-extrabold text-xs transition-all flex items-center justify-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open WhatsApp Chat</span>
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 font-bold text-xs transition-all text-center"
              >
                Schedule Another Appointment
              </button>
            </div>
          </motion.div>
        ) : (
          /* Main Two-Column Appointment Creation Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (7 cols): Input Form */}
            <div className="lg:col-span-7 glass-card rounded-3xl p-4 sm:p-8 space-y-6 shadow-xl border border-white/10">
              
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Schedule New Consultation
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#2563EB]/30 text-[#3B82F6] text-xs font-black border border-[#3B82F6]/40">
                    Step 1 of 2
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  Configure consultation mode, select counselor availability, and register candidate information.
                </p>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-bold flex items-center space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Consultation Type */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>1. Consultation Mode</span>
                    <span className="text-[10px] text-blue-400 font-medium lowercase">select platform</span>
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMeetingType('Online Zoom Consultation')}
                      className={`p-4 rounded-2xl border text-left transition-all relative ${
                        meetingType.includes('Online')
                          ? 'border-[#3B82F6] bg-[#2563EB]/25 shadow-lg shadow-blue-500/20 text-white'
                          : 'border-white/10 bg-black/20 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl ${meetingType.includes('Online') ? 'bg-[#2563EB] text-white' : 'bg-white/10 text-slate-400'}`}>
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-white">🌐 Online Consultation</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Zoom HD Call + Calendar Invite</div>
                        </div>
                      </div>
                      {meetingType.includes('Online') && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#3B82F6]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMeetingType('In-Person Office Consultation')}
                      className={`p-4 rounded-2xl border text-left transition-all relative ${
                        meetingType.includes('In-Person')
                          ? 'border-[#3B82F6] bg-[#2563EB]/25 shadow-lg shadow-blue-500/20 text-white'
                          : 'border-white/10 bg-black/20 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl ${meetingType.includes('In-Person') ? 'bg-[#2563EB] text-white' : 'bg-white/10 text-slate-400'}`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-white">🏢 In-Person Consultation</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Branch Office Desk Meeting</div>
                        </div>
                      </div>
                      {meetingType.includes('In-Person') && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#3B82F6]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Date Selection with Quick Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#3B82F6]" />
                      <span>2. Select Consultation Date</span>
                    </label>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedDate(todayStr)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          selectedDate === todayStr ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(tomorrowStr)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          selectedDate === tomorrowStr ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        Tomorrow
                      </button>
                    </div>
                  </div>

                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-xs text-white font-semibold focus:outline-none focus:border-[#3B82F6] transition-all"
                  />
                </div>

                {/* 3. Time Slot Grid with Loading State */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-[#3B82F6]" />
                      <span>3. Select Time Slot</span>
                    </label>
                    {loadingSlots && (
                      <span className="text-[10px] text-[#3B82F6] font-bold flex items-center space-x-1">
                        <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                        <span>Checking availability...</span>
                      </span>
                    )}
                  </div>

                  {slotError && (
                    <p className="text-[11px] text-amber-300 font-medium">{slotError}</p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {slots.map((slot, index) => {
                      const isSelected = selectedSlot === slot.time;
                      return (
                        <button
                          key={index}
                          type="button"
                          disabled={!slot.available || loadingSlots}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white border-blue-400 shadow-md scale-102'
                              : slot.available
                              ? 'bg-black/30 text-slate-200 border-white/10 hover:border-blue-500 hover:bg-blue-500/10'
                              : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed line-through'
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Counselor Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5 text-[#3B82F6]" />
                    <span>4. Assigned Counselor</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {COUNSELORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCounselor(c)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedCounselor.id === c.id
                            ? 'border-[#3B82F6] bg-[#2563EB]/20 text-white shadow-md'
                            : 'border-white/10 bg-black/20 hover:border-white/20 text-slate-300'
                        }`}
                      >
                        <div className="font-extrabold text-xs text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{c.role}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Candidate Information */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                      5. Candidate Information
                    </span>
                    <span className="text-[10px] text-slate-400">* Required fields</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Student Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Usman Ali"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3B82F6]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">WhatsApp / Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +92 300 1234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Email Address (Optional)</label>
                      <input
                        type="email"
                        placeholder="e.g. usman@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3B82F6]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Target Country</label>
                      <select
                        value={formData.countryInterest}
                        onChange={(e) => setFormData({ ...formData, countryInterest: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#071A33] border border-white/15 text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code} className="bg-[#071A33] text-white">
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Consultation Purpose / Visa Type</label>
                    <input
                      type="text"
                      placeholder="e.g. UK MSc Computer Science Visa, Australia Partner Assessment"
                      value={formData.visaCategory}
                      onChange={(e) => setFormData({ ...formData, visaCategory: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={submitting || !selectedSlot}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 disabled:opacity-50 text-white font-black text-xs shadow-xl shadow-blue-500/30 flex items-center justify-center space-x-2 transition-all active:scale-98"
                >
                  <Calendar className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Confirming Appointment...'
                      : selectedSlot
                      ? `Confirm & Book Appointment (${selectedSlot})`
                      : 'Select a Time Slot to Proceed'}
                  </span>
                </button>

              </form>
            </div>

            {/* Right Column (5 cols): Live Summary Widget & Advisor Info */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Dynamic Live Summary Card */}
              <div className="glass-card rounded-3xl p-6 space-y-5 shadow-xl border border-white/15">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Appointment Summary
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                    Drafting
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Consultation Mode</span>
                    <div className="font-extrabold text-white flex items-center space-x-1.5">
                      {meetingType.includes('Online') ? (
                        <Video className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Building2 className="w-4 h-4 text-amber-400" />
                      )}
                      <span>{meetingType}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Scheduled Time</span>
                    <div className="font-extrabold text-[#3B82F6] flex items-center space-x-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{selectedDate} at {selectedSlot || '— (Please select slot)'}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Candidate</span>
                    <div className="font-extrabold text-white">
                      {formData.fullName || 'Candidate name pending'}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {formData.phone || 'Phone number pending'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Counselor</span>
                    <div className="font-extrabold text-white">{selectedCounselor.name}</div>
                    <div className="text-[11px] text-slate-400">{selectedCounselor.role}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Auto-confirms consultation and creates CRM timeline activity.</span>
                </div>
              </div>

              {/* Office / Online Guarantee Card */}
              <div className="glass-card rounded-3xl p-6 space-y-3 shadow-xl border border-white/10 text-xs">
                <h4 className="font-extrabold text-white flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-[#3B82F6]" />
                  <span>Immigration Consultation Standards</span>
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  All sessions include visa eligibility review, admissions deadline assessment,
                  and documentation checklist generation.
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Average Duration: 30 Mins</span>
                  <span className="text-emerald-400 font-bold">100% Free Consultation</span>
                </div>
              </div>

            </div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
