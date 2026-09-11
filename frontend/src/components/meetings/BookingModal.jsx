import React, { useState, useEffect, useRef } from 'react';
import { meetingAPI } from '../../services/api';
import { X, Calendar, Clock, Video, CheckCircle2, User, Phone, Mail, Globe, Building2 } from 'lucide-react';

const DEFAULT_FALLBACK_SLOTS = [
  { time: '10:00 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '12:00 PM', available: true },
  { time: '02:00 PM', available: true },
  { time: '03:00 PM', available: true },
  { time: '04:00 PM', available: true },
  { time: '05:00 PM', available: true }
];

export default function BookingModal({ 
  isOpen, 
  onClose, 
  leadInfo = {}, 
  sessionId, 
  onBookingConfirmed,
  isReschedule = false,
  currentAppointment = null
}) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState(DEFAULT_FALLBACK_SLOTS);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [meetingType, setMeetingType] = useState('Online Zoom Consultation');
  const [formData, setFormData] = useState({
    fullName: leadInfo.fullName || '',
    phone: leadInfo.phone || '',
    email: leadInfo.email || '',
    countryInterest: leadInfo.countryInterest || 'UK'
  });

  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const openingData = useRef({ leadInfo, currentAppointment });
  openingData.current = { leadInfo, currentAppointment };
  const submitting = useRef(false);

  useEffect(() => {
    if (isOpen) {
      const { leadInfo, currentAppointment } = openingData.current;
      setFormData({
        fullName: leadInfo.fullName || currentAppointment?.fullName || currentAppointment?.leadId?.fullName || '',
        phone: leadInfo.phone || currentAppointment?.phone || currentAppointment?.leadId?.phone || '',
        email: leadInfo.email || currentAppointment?.email || currentAppointment?.leadId?.email || '',
        countryInterest: leadInfo.countryInterest || currentAppointment?.countryInterest || 'UK'
      });
      setMeetingType(currentAppointment?.meetingType || 'Online Zoom Consultation');
      setSelectedDate(currentAppointment?.date || new Date().toISOString().split('T')[0]);
      setBookingSuccess(null);
      setErrorMsg('');
      setSelectedSlot('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setSelectedSlot('');
    setLoadingSlots(true);
    meetingAPI.getSlots(selectedDate).then(res => {
      if (res?.success && Array.isArray(res.slots) && res.slots.length > 0) {
        if (!cancelled) setSlots(res.slots);
      } else {
        if (!cancelled) setSlots(DEFAULT_FALLBACK_SLOTS);
      }
    }).catch(err => {
      console.warn('[BookingModal] Could not fetch live slots, using fallback slots:', err);
      if (!cancelled) {
        setSlots(DEFAULT_FALLBACK_SLOTS);
      }
    }).finally(() => {
      if (!cancelled) setLoadingSlots(false);
    });
    return () => { cancelled = true; };
  }, [isOpen, selectedDate]);

  const handleBook = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting.current || loadingSlots) return;
    if (!selectedSlot) {
      setErrorMsg('Please select an available time slot.');
      return;
    }
    setErrorMsg('');
    submitting.current = true;
    setLoading(true);

    try {
      let res;
      if (isReschedule && (currentAppointment?._id || currentAppointment?.id)) {
        res = await meetingAPI.rescheduleMeeting({
          meetingId: currentAppointment._id || currentAppointment.id,
          sessionId: sessionId || leadInfo.sessionId || currentAppointment.sessionId,
          date: selectedDate,
          time: selectedSlot,
          meetingType,
          consultationType: meetingType.includes('Online') ? 'ONLINE' : 'IN_PERSON',
          appointmentType: meetingType.includes('Online') ? 'ONLINE' : 'IN_PERSON'
        });
      } else {
        res = await meetingAPI.bookMeeting({
          leadId: leadInfo.leadId || leadInfo._id,
          sessionId: sessionId || leadInfo.sessionId,
          fullName: formData.fullName || 'Student Applicant',
          phone: formData.phone,
          email: formData.email,
          countryInterest: formData.countryInterest || 'UK',
          date: selectedDate,
          time: selectedSlot,
          meetingType,
          consultationType: meetingType.includes('Online') ? 'ONLINE' : 'IN_PERSON',
          appointmentType: meetingType.includes('Online') ? 'ONLINE' : 'IN_PERSON'
        });
      }

      if (res?.success && res.data?._id) {
        const savedMeeting = res.data;
        setBookingSuccess(savedMeeting);
        window.dispatchEvent(new CustomEvent('appointments-updated', { detail: savedMeeting }));
        try {
          localStorage.setItem('appointments_last_update', Date.now().toString());
        } catch (e) {}

        if (onBookingConfirmed) {
          Promise.resolve().then(() => onBookingConfirmed(savedMeeting, isReschedule)).catch(console.error);
        }
      } else {
        setErrorMsg(res?.message || 'Booking slot conflict. Please choose another time.');
      }
    } catch (err) {
      // API failure: Show error inside modal. Do NOT close modal.
      setErrorMsg(err.message || 'Slot reservation failed. Please choose another time.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isPendingStatus = bookingSuccess?.status === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto max-h-[92dvh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#071A33] text-white p-4 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {isReschedule ? 'Reschedule Consultation' : 'Schedule 1-on-1 Consultation'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300">
                {isReschedule ? 'Select a new date and time slot' : 'Select consultation type, date and available time slot'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {bookingSuccess ? (
            <div role="status" aria-live="polite" className="text-center py-6 space-y-4">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-inner ${
                isPendingStatus ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {isPendingStatus ? (
                  <Clock className="w-10 h-10 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                )}
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {isReschedule 
                  ? 'Appointment Rescheduled!' 
                  : isPendingStatus 
                  ? '📅 Appointment Request Submitted' 
                  : 'Appointment Confirmed!'}
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                {isPendingStatus ? (
                  <span>
                    Your consultation request for <strong className="text-slate-900">{bookingSuccess.date}</strong> at <strong className="text-slate-900">{bookingSuccess.time}</strong> has been submitted with status: <strong className="text-amber-700 uppercase">Pending Confirmation</strong>.
                  </span>
                ) : (
                  <span>
                    Your consultation has been successfully {isReschedule ? 'rescheduled for' : 'confirmed for'}{' '}
                    <strong className="text-slate-900">{bookingSuccess.date}</strong> at <strong className="text-slate-900">{bookingSuccess.time}</strong>.
                  </span>
                )}
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className={`font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase ${
                    isPendingStatus 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {bookingSuccess.status || 'PENDING'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Assigned Counselor:</span>
                  <span className="font-bold text-slate-900">{bookingSuccess.counselorName || bookingSuccess.counselorId?.name || 'Senior Admissions Counselor'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Consultation Type:</span>
                  <span className="font-bold text-blue-700 flex items-center space-x-1">
                    {meetingType.includes('Online') ? <Video className="w-3.5 h-3.5 mr-1" /> : <Building2 className="w-3.5 h-3.5 mr-1" />}
                    <span>{bookingSuccess.meetingType || meetingType}</span>
                  </span>
                </div>
                {bookingSuccess.meetingLink && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-1">Meeting Link:</span>
                    <a
                      href={bookingSuccess.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline font-bold break-all"
                    >
                      {bookingSuccess.meetingLink}
                    </a>
                  </div>
                )}
              </div>

              {/* Explicit Confirmation Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-[#071A33] hover:bg-[#0B254B] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
              >
                Done & Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleBook} className="space-y-4">
              
              {/* Reschedule Current Appointment Banner */}
              {isReschedule && currentAppointment && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 mb-1">
                  <div>
                    <span className="font-bold text-amber-800 block">Current Appointment</span>
                    <span>{currentAppointment.date} at {currentAppointment.time} ({currentAppointment.meetingType || 'Consultation'})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase tracking-wide">
                    To Reschedule
                  </span>
                </div>
              )}

              {/* Error Message Display (Keeps modal open) */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Consultation Mode (Online vs In-Person) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                  <Globe className="w-3.5 h-3.5 mr-1 text-blue-600" /> Consultation Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMeetingType('Online Zoom Consultation')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                      meetingType.includes('Online')
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Online Consultation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingType('In-Person Office Consultation')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                      meetingType.includes('In-Person')
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>In-Person Consultation</span>
                  </button>
                </div>
              </div>

              {/* 2. Date Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" /> Select Preferred Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-slate-900"
                />
              </div>

              {/* 3. Available Time Slots Grid */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" /> Available Time Slots
                  </label>
                  {loadingSlots && <span className="text-[10px] text-blue-600 font-bold animate-pulse">Loading slots...</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {slots.map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={loading || loadingSlots || !slot.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedSlot === slot.time
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-102'
                          : slot.available
                          ? 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-500 hover:bg-blue-50'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Contact Details Inputs */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Candidate Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="px-3.5 py-2 rounded-xl text-xs border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900"
                  />
                  <input
                    type="tel"
                    placeholder="Phone / WhatsApp *"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="px-3.5 py-2 rounded-xl text-xs border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900"
                />
              </div>

              {/* 5. Submit Button */}
              <button
                type="submit"
                disabled={loading || loadingSlots || !selectedSlot}
                className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:brightness-110 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98"
              >
                <Calendar className="w-4 h-4 text-white" />
                <span>
                  {loading 
                    ? (isReschedule ? 'Rescheduling Appointment...' : 'Reserving Appointment...') 
                    : (selectedSlot 
                        ? (isReschedule ? `Confirm Reschedule (${selectedSlot})` : `Confirm & Reserve Slot (${selectedSlot})`) 
                        : (isReschedule ? 'Select a New Time Slot Above' : 'Select a Time Slot Above'))}
                </span>
              </button>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
