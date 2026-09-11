import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { leadAPI } from '../../services/api';
import BookingModal from '../meetings/BookingModal';
import {
  Kanban,
  Table as TableIcon,
  Search,
  Award,
  Phone,
  Mail,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Plus,
  Download,
  X,
  ExternalLink,
  ShieldCheck,
  Bell,
  MessageSquare,
  Calendar,
  FileText,
  Send,
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  User,
  RotateCcw
} from 'lucide-react';

const KANBAN_STAGES = [
  'New Leads',
  'Qualified',
  'Meeting Scheduled',
  'Counseling Completed',
  'Application Started',
  'Converted'
];

export default function LeadsView({ onSelectStudent, onNewLeadClick }) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // Default to table view for rapid lead actions
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLeadModal, setSelectedLeadModal] = useState(null);

  // Follow-Up Composer State
  const [followUpModalLead, setFollowUpModalLead] = useState(null);
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [followUpSending, setFollowUpSending] = useState(false);

  // Add Note Modal State
  const [noteModalLead, setNoteModalLead] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Booking Modal State
  const [bookingModalLead, setBookingModalLead] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Timeline / History Modal State
  const [timelineModalLead, setTimelineModalLead] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Action Notice Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchLeads();
    const handleRefresh = () => fetchLeads();
    window.addEventListener('appointments-updated', handleRefresh);
    return () => window.removeEventListener('appointments-updated', handleRefresh);
  }, [selectedCountry]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await leadAPI.getLeads({ country: selectedCountry });
      if (res.success) {
        setLeads(res.data || []);
      }
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeStage = (backendStage) => {
    if (!backendStage) return 'New Leads';
    const s = backendStage.toLowerCase();
    if (s.includes('new')) return 'New Leads';
    if (s.includes('qualified') || s.includes('assessment')) return 'Qualified';
    if (s.includes('meet') || s.includes('booked')) return 'Meeting Scheduled';
    if (s.includes('counsel') || s.includes('document')) return 'Counseling Completed';
    if (s.includes('application') || s.includes('applied') || s.includes('offer')) return 'Application Started';
    if (s.includes('convert') || s.includes('visa') || s.includes('approved')) return 'Converted';
    return 'New Leads';
  };

  const handleMoveStage = async (leadId, currentStage, direction) => {
    const norm = normalizeStage(currentStage);
    const currentIndex = KANBAN_STAGES.indexOf(norm);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= KANBAN_STAGES.length) return;

    const nextStage = KANBAN_STAGES[nextIndex];

    setLeads((prev) =>
      prev.map((l) => (l._id === leadId ? { ...l, stage: nextStage } : l))
    );

    try {
      await leadAPI.updateStage(leadId, nextStage);
    } catch (err) {
      console.error('Failed to update lead stage:', err);
      fetchLeads();
    }
  };

  // 1. Open Chat Action
  const handleOpenChat = (lead, e) => {
    if (e) e.stopPropagation();
    const targetSession = lead.conversationId?.sessionId;
    navigate(targetSession ? `/admin/inbox?session=${encodeURIComponent(targetSession)}` : `/admin/inbox?lead=${encodeURIComponent(lead._id)}`);
  };

  // 2. Open Follow-Up Composer Modal (with requested default template)
  const handleOpenFollowUpModal = (lead, e) => {
    if (e) e.stopPropagation();
    setFollowUpModalLead(lead);
    const candidateName = lead.fullName || 'there';
    setFollowUpMessage(
      lead.status === 'MEETING_BOOKED'
        ? `Hello ${candidateName},\n\nFollowing up on your consultation booking. Do you have any questions or need help preparing your documents?`
        : `Hello ${candidateName},\n\nFollowing up on your immigration enquiry. How can our team help with your next step?`
    );
  };

  // Submit Follow-Up
  const handleSendFollowUp = async () => {
    if (!followUpModalLead || !followUpMessage.trim()) return;
    setFollowUpSending(true);
    try {
      const res = await leadAPI.sendFollowUp(followUpModalLead._id, {
        message: followUpMessage.trim()
      });
      if (res.success) {
        showToast(`Follow-up delivered to ${followUpModalLead.fullName}! 🔔`);
        setFollowUpModalLead(null);
        fetchLeads();
        window.dispatchEvent(new CustomEvent('appointments-updated'));
        if (res.data?.conversation?.sessionId) {
          navigate(`/admin/inbox?session=${encodeURIComponent(res.data.conversation.sessionId)}&filter=FOLLOWUP`);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to send follow-up', 'error');
    } finally {
      setFollowUpSending(false);
    }
  };

  // 3. Open Book Appointment Action
  const handleOpenBooking = (lead, e) => {
    if (e) e.stopPropagation();
    setBookingModalLead(lead);
    setIsBookingOpen(true);
  };

  // 4. Open Add Note Modal
  const handleOpenNoteModal = (lead, e) => {
    if (e) e.stopPropagation();
    setNoteModalLead(lead);
    setNoteText('');
  };

  // Submit Note
  const handleSaveNote = async () => {
    if (!noteModalLead || !noteText.trim()) return;
    setNoteSubmitting(true);
    try {
      const res = await leadAPI.addNote(noteModalLead._id, noteText.trim());
      if (res.success) {
        showToast(`Case note logged for ${noteModalLead.fullName}!`);
        setNoteModalLead(null);
        setNoteText('');
        fetchLeads();
      }
    } catch (err) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setNoteSubmitting(false);
    }
  };

  // 5. Open Follow-Up & Journey Timeline
  const handleOpenTimeline = async (lead, e) => {
    if (e) e.stopPropagation();
    setTimelineModalLead(lead);
    setTimelineLoading(true);
    try {
      const res = await leadAPI.getTimeline(lead._id);
      if (res.success && res.data) {
        setTimelineData(res.data);
      } else {
        setTimelineData(lead.followUpHistory || []);
      }
    } catch (err) {
      setTimelineData(lead.followUpHistory || []);
    } finally {
      setTimelineLoading(false);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search);
    const matchesCountry = !selectedCountry || l.countryInterest === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  const getCountryFlag = (country) => {
    switch (country) {
      case 'UK': return '🇬🇧';
      case 'Australia': return '🇦🇺';
      case 'Canada': return '🇨🇦';
      case 'USA': return '🇺🇸';
      case 'Germany': return '🇩🇪';
      case 'Italy': return '🇮🇹';
      case 'Sweden': return '🇸🇪';
      default: return '🌐';
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Toast Notice */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-bold border ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header & Search / Filters */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#2563EB]/20 text-[#60A5FA] border border-[#3B82F6]/30 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>CRM Lead Management & Automated Follow-Up</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Prospective Candidate Leads ({filteredLeads.length})
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Manage candidates, send instant WhatsApp follow-ups, book consultations, and log internal case notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Country Selector */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white focus:outline-none font-medium"
          >
            <option value="">All Destinations</option>
            <option value="UK">🇬🇧 United Kingdom</option>
            <option value="Canada">🇨🇦 Canada</option>
            <option value="Australia">🇦🇺 Australia</option>
            <option value="USA">🇺🇸 United States</option>
            <option value="Germany">🇩🇪 Germany</option>
            <option value="Italy">🇮🇹 Italy</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                viewMode === 'table' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                viewMode === 'kanban' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Pipeline View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
          </div>

          {onNewLeadClick && (
            <button
              onClick={onNewLeadClick}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: TABLE VIEW (Rapid Action Center) */}
      {viewMode === 'table' && (
        <div className="glass-card rounded-3xl overflow-hidden shadow-xl border border-white/10">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Country & Visa</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Status & Stage</th>
                  <th className="p-4">Follow-Up</th>
                  <th className="p-4">Assigned Owner</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                      Loading candidate leads...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">
                      No leads match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isNeedsFollowUp = lead.status === 'NEEDS_FOLLOW_UP' || lead.followUpStatus === 'REQUIRED';
                    const isFollowUpSent = lead.followUpStatus === 'SENT';
                    const isFollowUpReplied = lead.followUpStatus === 'REPLIED';

                    return (
                      <tr
                        key={lead._id}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        {/* Candidate */}
                        <td className="p-4">
                          <div
                            onClick={() => {
                              if (onSelectStudent) onSelectStudent(lead);
                              else setSelectedLeadModal(lead);
                            }}
                            className="font-black text-white hover:text-blue-400 cursor-pointer flex items-center space-x-1.5"
                          >
                            <span>{lead.fullName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{lead.email || lead.phone}</div>
                        </td>

                        {/* Country & Visa */}
                        <td className="p-4">
                          <div className="flex items-center space-x-1 font-bold text-white">
                            <span>{getCountryFlag(lead.countryInterest)}</span>
                            <span>{lead.countryInterest || 'UK'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{lead.visaCategory || lead.serviceType || 'Study Visa'}</span>
                        </td>

                        {/* Lead Score */}
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] font-black text-[11px] rounded-full border border-[#F59E0B]/30 inline-flex items-center">
                            <Flame className="w-3 h-3 mr-0.5" />
                            {lead.leadScore || 80}%
                          </span>
                        </td>

                        {/* Status & Stage */}
                        <td className="p-4">
                          {isNeedsFollowUp ? (
                            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-black text-[10px] rounded-full border border-amber-500/40 uppercase tracking-wider inline-flex items-center animate-pulse">
                              <Bell className="w-3 h-3 mr-1 text-amber-400" />
                              Follow-Up Required
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] rounded-full border border-emerald-500/30">
                              {lead.stage || lead.status}
                            </span>
                          )}
                        </td>

                        {/* Follow-Up Status */}
                        <td className="p-4">
                          {isFollowUpSent ? (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-md border border-blue-500/30 inline-flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-blue-400" />
                              Sent
                            </span>
                          ) : isFollowUpReplied ? (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-md border border-emerald-500/30 inline-flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                              Replied
                            </span>
                          ) : isNeedsFollowUp ? (
                            <span className="text-[10px] font-bold text-amber-300">
                              Pending action
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {lead.lastFollowUpAt ? new Date(lead.lastFollowUpAt).toLocaleDateString() : 'None'}
                            </span>
                          )}
                        </td>

                        {/* Assigned Owner */}
                        <td className="p-4 text-slate-300 font-semibold">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[9px] font-black">
                              {lead.assignedCounselor?.name ? lead.assignedCounselor.name.charAt(0) : 'C'}
                            </div>
                            <span className="truncate max-w-[100px]">
                              {lead.assignedCounselor?.name ? lead.assignedCounselor.name.split(' ')[0] : 'Dr. Zaheer'}
                            </span>
                          </div>
                        </td>

                        {/* 4 MANDATORY ACTIONS */}
                        <td className="p-4">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={(e) => handleOpenChat(lead, e)}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all font-bold text-[11px] flex items-center space-x-1 shadow-xs active:scale-95"
                              title="Open WhatsApp Chat"
                            >
                              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden xl:inline">Open Chat</span>
                            </button>

                            <button
                              onClick={(e) => handleOpenFollowUpModal(lead, e)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-all font-black text-[11px] flex items-center space-x-1 shadow-xs active:scale-95"
                              title="Send Follow-Up Message"
                            >
                              <Bell className="w-3.5 h-3.5 shrink-0 text-amber-400 group-hover:text-slate-950" />
                              <span>Follow Up</span>
                            </button>

                            <button
                              onClick={(e) => handleOpenBooking(lead, e)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all font-bold text-[11px] flex items-center space-x-1 shadow-xs active:scale-95"
                              title="Book Consultation Appointment"
                            >
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden xl:inline">Book</span>
                            </button>

                            <button
                              onClick={(e) => handleOpenNoteModal(lead, e)}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all font-bold text-[11px] flex items-center space-x-1 shadow-xs active:scale-95"
                              title="Add Note"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden xl:inline">Note</span>
                            </button>

                            <button
                              onClick={(e) => handleOpenTimeline(lead, e)}
                              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border border-white/10 transition-all font-bold text-[11px]"
                              title="View Follow-up History Timeline"
                            >
                              <History className="w-3.5 h-3.5" />
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

          {/* Mobile Responsive Leads Cards */}
          <div className="md:hidden space-y-3 p-3">
            {loading ? (
              <div className="p-8 text-center text-slate-400 font-bold">
                Loading candidate leads...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium">
                No leads match your criteria.
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isNeedsFollowUp = lead.status === 'NEEDS_FOLLOW_UP' || lead.followUpStatus === 'REQUIRED';

                return (
                  <div
                    key={lead._id}
                    className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        onClick={() => {
                          if (onSelectStudent) onSelectStudent(lead);
                          else setSelectedLeadModal(lead);
                        }}
                        className="cursor-pointer"
                      >
                        <h4 className="font-black text-white text-sm hover:text-blue-400">
                          {lead.fullName}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {lead.phone || lead.email || '—'}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] font-black text-[11px] rounded-full border border-[#F59E0B]/30 inline-flex items-center shrink-0">
                        <Flame className="w-3 h-3 mr-0.5" />
                        {lead.leadScore || 80}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                      <div className="flex items-center space-x-1 font-bold text-white">
                        <span>{getCountryFlag(lead.countryInterest)}</span>
                        <span>{lead.countryInterest || 'UK'}</span>
                        <span className="text-slate-400 font-normal text-[11px]">· {lead.visaCategory || lead.serviceType || 'Study Visa'}</span>
                      </div>
                      {isNeedsFollowUp ? (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-black text-[9px] rounded-full border border-amber-500/40 uppercase tracking-wider inline-flex items-center animate-pulse shrink-0">
                          <Bell className="w-2.5 h-2.5 mr-1 text-amber-400" />
                          Action Req.
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-extrabold text-[9px] rounded-full border border-emerald-500/30 shrink-0">
                          {lead.stage || lead.status}
                        </span>
                      )}
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/10 flex-wrap">
                      <button
                        onClick={(e) => handleOpenChat(lead, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all font-bold text-xs flex items-center space-x-1 flex-1 justify-center active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenFollowUpModal(lead, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-all font-black text-xs flex items-center space-x-1 flex-1 justify-center active:scale-95"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                        <span>Follow Up</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenBooking(lead, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all font-bold text-xs flex items-center space-x-1 flex-1 justify-center active:scale-95"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenNoteModal(lead, e)}
                        className="p-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all font-bold text-xs flex items-center justify-center active:scale-95"
                        title="Add Note"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleOpenTimeline(lead, e)}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border border-white/10 transition-all font-bold text-xs flex items-center justify-center active:scale-95"
                        title="Follow-up History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: PIPELINE / KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1300px]">
            {KANBAN_STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter(
                (l) => normalizeStage(l.stage) === stage
              );

              return (
                <div key={stage} className="flex-1 min-w-[280px]">
                  <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-white/10 mb-3">
                    <span className="font-extrabold text-xs text-white">{stage}</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {stageLeads.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 font-medium border border-dashed border-white/10 rounded-2xl">
                        No candidates in this stage
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <motion.div
                          key={lead._id}
                          whileHover={{ y: -2 }}
                          className="glass-card p-4 rounded-2xl shadow-md border border-white/10 hover:border-[#3B82F6] space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white/10 text-white border border-white/15 flex items-center">
                              <span className="mr-1">{getCountryFlag(lead.countryInterest)}</span>
                              {lead.countryInterest}
                            </span>
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center">
                              <Award className="w-3 h-3 mr-0.5 text-[#F59E0B]" />
                              {lead.leadScore || 82}%
                            </span>
                          </div>

                          <div>
                            <h4
                              onClick={() => {
                                if (onSelectStudent) onSelectStudent(lead);
                                else setSelectedLeadModal(lead);
                              }}
                              className="font-black text-sm text-white hover:text-blue-400 cursor-pointer transition-colors"
                            >
                              {lead.fullName}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">{lead.email || lead.phone}</p>
                          </div>

                          {/* Action Buttons Row */}
                          <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/10">
                            <button
                              onClick={(e) => handleOpenChat(lead, e)}
                              className="py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center transition-all"
                              title="Open Chat"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleOpenFollowUpModal(lead, e)}
                              className="py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all"
                              title="Follow Up"
                            >
                              <Bell className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleOpenBooking(lead, e)}
                              className="py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center transition-all"
                              title="Book Appointment"
                            >
                              <Calendar className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleOpenNoteModal(lead, e)}
                              className="py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center transition-all"
                              title="Add Note"
                            >
                              <FileText className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Stage Mover */}
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {lead.assignedCounselor?.name || 'Dr. Zaheer'}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleMoveStage(lead._id, lead.stage, 'prev')}
                                disabled={KANBAN_STAGES.indexOf(normalizeStage(lead.stage)) === 0}
                                className="p-1 rounded-lg bg-white/10 hover:bg-[#2563EB] text-white disabled:opacity-25"
                                title="Previous Stage"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveStage(lead._id, lead.stage, 'next')}
                                disabled={KANBAN_STAGES.indexOf(normalizeStage(lead.stage)) === KANBAN_STAGES.length - 1}
                                className="p-1 rounded-lg bg-white/10 hover:bg-[#2563EB] text-white disabled:opacity-25"
                                title="Next Stage"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: FOLLOW-UP COMPOSER (Requirement 3) */}
      <AnimatePresence>
        {followUpModalLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-card rounded-3xl shadow-2xl overflow-hidden border border-amber-500/30"
            >
              {/* Header */}
              <div className="bg-[#07162C] p-5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Follow-up message</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Recipient: <span className="text-amber-300 font-bold">{followUpModalLead.fullName}</span> ({followUpModalLead.phone})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFollowUpModalLead(null)}
                  className="p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span>Customizable Follow-up Content:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const candidateName = followUpModalLead.fullName || 'there';
                      setFollowUpMessage(
                        `Hello ${candidateName},\n\nFollowing up on your immigration enquiry. How can our team help with your next step?`
                      );
                    }}
                    className="text-[11px] text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset to Default Template
                  </button>
                </div>

                <textarea
                  rows="7"
                  value={followUpMessage}
                  onChange={(e) => setFollowUpMessage(e.target.value)}
                  placeholder="Enter follow-up message..."
                  className="w-full p-4 rounded-2xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/50 leading-relaxed resize-none"
                />

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-200/90 leading-relaxed">
                  💡 <strong>Direct WhatsApp Delivery:</strong> This message will appear as a high-priority <code>🔔 Follow-up from Immigration Team</code> card in the customer's chat and flag their thread in the Admin Inbox.
                </div>

                {/* Buttons: Send Follow-up | Cancel */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFollowUpModalLead(null)}
                    className="py-2.5 px-4 rounded-xl border border-white/15 text-slate-300 font-bold hover:bg-white/5 transition-all text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={followUpSending || !followUpMessage.trim()}
                    onClick={handleSendFollowUp}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black hover:brightness-110 transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/30 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{followUpSending ? 'Sending...' : 'Send Follow-up'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD NOTE MODAL */}
      <AnimatePresence>
        {noteModalLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-card rounded-3xl shadow-2xl overflow-hidden border border-purple-500/30"
            >
              <div className="bg-[#07162C] p-5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Add Internal CRM Note</h3>
                    <p className="text-xs text-slate-400 font-medium">Candidate: {noteModalLead.fullName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setNoteModalLead(null)}
                  className="p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <textarea
                  rows="4"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record counseling notes, document verification updates, or intake preferences..."
                  className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none leading-relaxed"
                />

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNoteModalLead(null)}
                    className="py-2.5 px-4 rounded-xl border border-white/15 text-slate-300 font-bold hover:bg-white/5 transition-all text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={noteSubmitting || !noteText.trim()}
                    onClick={handleSaveNote}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:brightness-110 transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-purple-600/30 disabled:opacity-50"
                  >
                    <span>{noteSubmitting ? 'Saving...' : 'Save Note'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: FOLLOW-UP TIMELINE & HISTORY (Requirement 5) */}
      <AnimatePresence>
        {timelineModalLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl glass-card rounded-3xl shadow-2xl overflow-hidden border border-blue-500/30 max-h-[85vh] flex flex-col"
            >
              <div className="bg-[#07162C] p-5 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Follow-Up & Journey Timeline</h3>
                    <p className="text-xs text-slate-400 font-medium">Candidate: {timelineModalLead.fullName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTimelineModalLead(null)}
                  className="p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                {timelineLoading ? (
                  <div className="py-12 text-center text-slate-400 font-bold">
                    Loading timeline events...
                  </div>
                ) : timelineData.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-medium space-y-2">
                    <Clock className="w-8 h-8 mx-auto text-slate-600" />
                    <p>No follow-up activity recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                    {timelineData.map((act, idx) => {
                      const isFollowUpSent = act.type === 'FOLLOW_UP_SENT';
                      const isFollowUpReplied = act.type === 'FOLLOW_UP_REPLIED';
                      const isFollowUpRequired = act.type === 'FOLLOW_UP_REQUIRED';
                      const isAppointmentCancelled = act.type === 'APPOINTMENT_CANCELLED';

                      return (
                        <div key={idx} className="relative pl-8 group">
                          {/* Dot */}
                          <div
                            className={`absolute left-1.5 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-[#07162C] ${
                              isFollowUpSent
                                ? 'bg-amber-400'
                                : isFollowUpReplied
                                ? 'bg-emerald-400'
                                : isAppointmentCancelled
                                ? 'bg-rose-500'
                                : 'bg-blue-400'
                            }`}
                          />

                          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  isFollowUpSent
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : isFollowUpReplied
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : isFollowUpRequired
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                }`}
                              >
                                {act.type || 'ACTIVITY'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {act.sentAt ? new Date(act.sentAt).toLocaleString() : (act.createdAt ? new Date(act.createdAt).toLocaleString() : 'Recent')}
                              </span>
                            </div>

                            <h5 className="font-extrabold text-sm text-white">
                              {act.title || act.action || 'Activity Entry'}
                            </h5>

                            {/* Message / Description */}
                            <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                              {act.message || act.description || ''}
                            </p>

                            {/* Status and Sender */}
                            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-400">
                              <span>Sender: <strong className="text-white">{act.sender || 'System / Admin'}</strong></span>
                              <span>Status: <strong className="text-white uppercase">{act.status || 'LOGGED'}</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: BOOKING MODAL INTEGRATION */}
      {bookingModalLead && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => {
            setIsBookingOpen(false);
            setBookingModalLead(null);
          }}
          leadInfo={bookingModalLead}
          onBookingConfirmed={() => {
            showToast(`Appointment confirmed for ${bookingModalLead.fullName}!`);
            setIsBookingOpen(false);
            setBookingModalLead(null);
            fetchLeads();
            window.dispatchEvent(new CustomEvent('appointments-updated'));
          }}
        />
      )}

      {/* MODAL 5: QUICK DOSSIER MODAL */}
      <AnimatePresence>
        {selectedLeadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-card rounded-3xl shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="bg-[#07162C] p-5 flex items-center justify-between border-b border-white/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">Candidate Profile</span>
                  <h3 className="text-lg font-black text-white">{selectedLeadModal.fullName}</h3>
                </div>
                <button
                  onClick={() => setSelectedLeadModal(null)}
                  className="p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-black/30 border border-white/10">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Destination</div>
                    <div className="font-extrabold text-sm text-white mt-0.5">
                      {getCountryFlag(selectedLeadModal.countryInterest)} {selectedLeadModal.countryInterest}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/30 border border-white/10">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Lead Score</div>
                    <div className="font-extrabold text-sm text-[#F59E0B] mt-0.5">
                      {selectedLeadModal.leadScore || 85}% Score
                    </div>
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-black/30 rounded-2xl border border-white/10 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-bold text-white">{selectedLeadModal.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-bold text-white">{selectedLeadModal.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Education:</span>
                    <span className="font-bold text-white">{selectedLeadModal.qualification || "Bachelor's"} ({selectedLeadModal.cgpa || '3.2'} CGPA)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-amber-300">{selectedLeadModal.status}</span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      const l = selectedLeadModal;
                      setSelectedLeadModal(null);
                      handleOpenFollowUpModal(l);
                    }}
                    className="py-2 px-3 bg-amber-500/20 text-amber-300 rounded-xl font-bold flex items-center justify-center space-x-1.5 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 transition-all"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Send Follow-Up</span>
                  </button>
                  <button
                    onClick={() => {
                      const l = selectedLeadModal;
                      setSelectedLeadModal(null);
                      handleOpenChat(l);
                    }}
                    className="py-2 px-3 bg-blue-600/20 text-blue-300 rounded-xl font-bold flex items-center justify-center space-x-1.5 border border-blue-500/40 hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Live Chat</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
