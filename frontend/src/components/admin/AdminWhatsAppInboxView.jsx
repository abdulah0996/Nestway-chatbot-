import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Send,
  User,
  Bot,
  UserCheck,
  Clock,
  CheckCheck,
  Sparkles,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  X,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Menu,
  Filter,
  FileText,
  Lock,
  MoreVertical,
  Flame,
  Award,
  Bell
} from 'lucide-react';
import { chatbotAPI, counselorAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminWhatsAppInboxView() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState(() => new URLSearchParams(window.location.search).get('filter') === 'FOLLOWUP' ? 'FOLLOWUP' : 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [counselors, setCounselors] = useState([]);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showConversationsDrawer, setShowConversationsDrawer] = useState(false);
  const [showMobileLeadDetails, setShowMobileLeadDetails] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const messagesEndRef = useRef(null);
  const chatScrollRef = useRef(null);
  const appliedTarget = useRef(null);

  // Quick Response Presets
  const QUICK_TEMPLATES = [
    'Hello! I saw your consultation is booked. Please have your academic transcripts and passport ready.',
    'Hello! I am reviewing your qualifications right now.',
    'Could you please provide your latest IELTS or English test score?',
    'You qualify for partner scholarships! Would you like to book a 1-on-1 consultation?',
    'Please upload your undergraduate transcript and passport copy.'
  ];

  useEffect(() => {
    fetchConversations(true);
    fetchCounselors();

    // Live polling every 3 seconds for new incoming WhatsApp messages
    const pollInterval = setInterval(() => {
      fetchConversations(false);
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  const fetchConversations = async (showInitialLoader = false) => {
    if (showInitialLoader) setLoading(true);
    try {
      const res = await chatbotAPI.getHistory();
      if (res.success && res.data) {
        setConversations(res.data);

        // Check if a specific session is requested via URL query string
        const urlParams = new URLSearchParams(window.location.search);
        const targetSession = urlParams.get('session') || urlParams.get('sessionId');
        const targetLead = urlParams.get('lead');
        const targetKey = targetSession || targetLead;

        if (targetKey && appliedTarget.current !== targetKey) {
          const matched = res.data.find(c => 
            c.leadId?._id === targetLead ||
            c.sessionId === targetSession ||
            c.leadId?.phone === targetSession ||
            c.answers?.phone === targetSession
          );
          if (matched) {
            appliedTarget.current = targetKey;
            setSelectedSessionId(matched.sessionId);
            return;
          }
        }

        if (showInitialLoader && res.data.length > 0 && !selectedSessionId) {
          // Select first follow-up or human mode chat or first chat
          const priorityChat = res.data.find(c => c.followUpStatus || c.mode === 'HUMAN' || c.status === 'WAITING_HUMAN');
          setSelectedSessionId(priorityChat ? priorityChat.sessionId : res.data[0].sessionId);
        }
      }
    } catch (err) {
      console.error('Failed to load chat conversations:', err);
    } finally {
      if (showInitialLoader) setLoading(false);
    }
  };

  const fetchCounselors = async () => {
    try {
      const res = await counselorAPI.getCounselors();
      if (res.success && res.data) {
        setCounselors(res.data);
      }
    } catch (err) {
      console.error('Failed to load counselors list:', err);
    }
  };

  const activeConversation = conversations.find(c => c.sessionId === selectedSessionId) || conversations[0] || null;

  // Auto-scroll inside chat area
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages?.length, selectedSessionId]);

  const showToast = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Send Admin Reply
  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeConversation) return;

    const messageContent = replyText.trim();
    setReplyText('');
    setSending(true);

    try {
      const res = await chatbotAPI.sendCounselorReply({
        sessionId: activeConversation.sessionId,
        message: messageContent,
        sender: 'ADMIN',
        counselorName: user?.name || 'Administrator',
        counselorId: user?._id || undefined
      });

      if (res.success) {
        showToast('Reply delivered to customer chat!');
        fetchConversations(false);
      }
    } catch (err) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  // Resume AI Hybrid Mode
  const handleResumeAi = async () => {
    if (!activeConversation) return;
    try {
      const res = await chatbotAPI.resumeAi({ sessionId: activeConversation.sessionId });
      if (res.success) {
        showToast('AI Hybrid Mode resumed for this conversation 🤖');
        fetchConversations(false);
      }
    } catch (err) {
      showToast(err.message || 'Error resuming AI', 'error');
    }
  };

  // Assign Counselor
  const handleAssignCounselor = async (counselorId, counselorName) => {
    if (!activeConversation) return;
    try {
      const res = await chatbotAPI.assignCounselor({
        sessionId: activeConversation.sessionId,
        counselorId,
        counselorName
      });
      if (res.success) {
        showToast(`Assigned to ${counselorName}`);
        fetchConversations(false);
      }
    } catch (err) {
      showToast(err.message || 'Failed to assign counselor', 'error');
    }
  };

  // Add Internal Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !activeConversation) return;

    setNoteSubmitting(true);
    try {
      const res = await chatbotAPI.addNote({
        sessionId: activeConversation.sessionId,
        text: newNoteText.trim(),
        author: user?.name || 'Administrator'
      });
      if (res.success) {
        setNewNoteText('');
        showToast('Case note added to CRM');
        fetchConversations(false);
      }
    } catch (err) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Close Conversation
  const handleCloseChat = async () => {
    if (!activeConversation) return;
    if (!window.confirm('Mark this conversation as closed?')) return;

    try {
      const res = await chatbotAPI.closeConversation({ sessionId: activeConversation.sessionId });
      if (res.success) {
        showToast('Conversation closed');
        fetchConversations(false);
      }
    } catch (err) {
      showToast(err.message || 'Failed to close conversation', 'error');
    }
  };

  const waitingHumanCount = conversations.filter(c => c.mode === 'HUMAN' || c.status === 'WAITING_HUMAN').length;

  const isConvFollowUp = (c) => {
    return !!(
      c.followUpStatus ||
      c.status === 'NEEDS_FOLLOW_UP' ||
      c.status === 'FOLLOW_UP_REQUIRED' ||
      c.leadId?.status === 'NEEDS_FOLLOW_UP' ||
      c.leadId?.followUpStatus === 'REQUIRED' ||
      c.leadId?.followUpStatus === 'SENT' ||
      c.leadId?.followUpStatus === 'REPLIED' ||
      c.crmTag === 'APPOINTMENT_CONFIRMED' ||
      c.crmTag === 'APPOINTMENT_CANCELLED'
    );
  };

  const followUpCount = conversations.filter(isConvFollowUp).length;

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const isHuman = c.mode === 'HUMAN' || c.status === 'WAITING_HUMAN';
    const isClosed = c.status === 'CLOSED';
    const isFollowUp = isConvFollowUp(c);

    if (filterMode === 'HUMAN' && !isHuman) return false;
    if (filterMode === 'FOLLOWUP' && !isFollowUp) return false;
    if (filterMode === 'AI' && (isHuman || isClosed)) return false;
    if (filterMode === 'CLOSED' && !isClosed) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (c.leadId?.fullName || c.answers?.fullName || '').toLowerCase();
      const phone = (c.leadId?.phone || c.sessionId || '').toLowerCase();
      const visa = (c.leadId?.visaCategory || c.serviceType || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || visa.includes(q);
    }
    return true;
  });

  // Render Conversation List (shared between desktop Column 1 & mobile slide drawer)
  const renderConversationList = (isDrawer = false) => (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header & Stats */}
      <div className="p-3.5 sm:p-4 border-b border-white/10 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">WhatsApp Inbox</h2>
              <p className="text-[10px] text-slate-400 font-medium">Customer CRM Conversations</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {waitingHumanCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] sm:text-[10px] font-black animate-pulse flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1"></span>
                <span>{waitingHumanCount} Need Reply</span>
              </span>
            )}
            {isDrawer && (
              <button
                type="button"
                onClick={() => setShowConversationsDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close conversation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, or visa..."
            className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'FOLLOWUP', label: `Follow-Up (${followUpCount})` },
            { id: 'HUMAN', label: `Human Mode (${waitingHumanCount})` },
            { id: 'AI', label: 'AI Active' },
            { id: 'CLOSED', label: 'Closed' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${
                filterMode === f.id
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-bold">
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
            <p>No conversations found under '{filterMode}'</p>
            <p className="text-[10px] text-slate-500">New customer WhatsApp messages will appear here live.</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = activeConversation?.sessionId === conv.sessionId;
            const isHumanMode = conv.mode === 'HUMAN' || conv.status === 'WAITING_HUMAN';
            const lastMsg = conv.messages && conv.messages.length > 0
              ? conv.messages[conv.messages.length - 1]
              : null;
            const customerName = conv.leadId?.fullName || conv.answers?.fullName || 'Prospective Student';
            const visaType = conv.leadId?.visaCategory || conv.serviceType || 'Study Visa';
            const leadScore = conv.leadId?.leadScore || conv.answers?.leadScore || 85;

            return (
              <div
                key={conv.sessionId}
                onClick={() => {
                  setSelectedSessionId(conv.sessionId);
                  if (isDrawer) setShowConversationsDrawer(false);
                }}
                className={`p-3.5 cursor-pointer transition-all flex items-start space-x-3 relative group ${
                  isSelected
                    ? 'bg-blue-600/20 border-l-4 border-l-[#2563EB]'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                {/* Customer Avatar with status dot */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white font-black text-sm shadow-md">
                    {customerName.charAt(0)}
                  </div>
                  {isHumanMode && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-[#07162C] rounded-full animate-ping" />
                  )}
                  <span
                    className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-[#07162C] rounded-full ${
                      isHumanMode ? 'bg-amber-400' : 'bg-[#25D366]'
                    }`}
                  />
                </div>

                {/* Meta & Last Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white truncate">
                      {customerName}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  {/* Visa Category & Score */}
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-slate-300 truncate">
                      {visaType}
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 flex items-center">
                      <Flame className="w-2.5 h-2.5 mr-0.5" />
                      {leadScore} pts
                    </span>
                    {isHumanMode ? (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 uppercase">
                        Human Mode
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                        AI Active
                      </span>
                    )}
                  </div>

                  {/* Follow Up Status Highlight */}
                  {(conv.followUpStatus || conv.status === 'NEEDS_FOLLOW_UP' || conv.leadId?.status === 'NEEDS_FOLLOW_UP' || conv.leadId?.followUpStatus === 'REQUIRED') && (
                    <div className="mt-1.5 flex items-center">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-black border ${
                        conv.followUpStatus === 'FOLLOW_UP_SENT' || conv.leadId?.followUpStatus === 'SENT'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : conv.followUpStatus === 'FOLLOW_UP_REPLIED' || conv.leadId?.followUpStatus === 'REPLIED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/25 text-amber-300 border-amber-500/50 animate-pulse'
                      }`}>
                        <Calendar className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                        <span className="truncate uppercase">
                          {conv.followUpStatus === 'FOLLOW_UP_SENT' || conv.leadId?.followUpStatus === 'SENT'
                            ? 'FOLLOW UP SENT'
                            : conv.followUpStatus === 'FOLLOW_UP_REPLIED' || conv.leadId?.followUpStatus === 'REPLIED'
                            ? 'FOLLOW UP REPLIED'
                            : 'FOLLOW UP REQUIRED'}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Last Message snippet */}
                  <p className="text-[11px] text-slate-400 truncate mt-1.5 font-medium">
                    {lastMsg ? (
                      <>
                        <span className="text-slate-500 font-bold">
                          {lastMsg.sender === 'USER' ? 'Customer: ' : (lastMsg.sender === 'ADMIN' ? 'Admin: ' : 'AI: ')}
                        </span>
                        {lastMsg.message}
                      </>
                    ) : (
                      'No messages yet'
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Render CRM Lead Details Content (shared between desktop Column 3 & mobile bottom sheet)
  const renderCrmDetails = (isBottomSheet = false) => {
    if (!activeConversation) return null;
    return (
      <div className="space-y-4 text-xs">
        {/* Lead Card Header */}
        <div className="border-b border-white/10 pb-3 flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#F59E0B] tracking-wider block">
              CRM Lead Record
            </span>
            <h3 className="text-sm font-black text-white mt-0.5">
              {activeConversation.leadId?.fullName || activeConversation.answers?.fullName || 'Student'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              {activeConversation.leadId?.phone || activeConversation.answers?.phone || 'No phone recorded'}
            </p>
          </div>
          {isBottomSheet && (
            <button
              onClick={() => setShowMobileLeadDetails(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
              aria-label="Close lead details"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Visa Target</span>
            <span className="text-white font-extrabold truncate block">
              {activeConversation.leadId?.visaCategory || activeConversation.serviceType || 'Study Visa'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Lead Score</span>
            <span className="text-[#25D366] font-extrabold flex items-center">
              <Flame className="w-3 h-3 mr-1 text-[#F59E0B]" />
              {activeConversation.leadId?.leadScore || 85} / 100
            </span>
          </div>
        </div>

        {/* Academic & Journey Info */}
        <div className="space-y-2 bg-white/5 p-3 rounded-2xl border border-white/5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Profile Parameters
          </span>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Country:</span>
              <strong className="text-white">{activeConversation.leadId?.preferredCountry || 'UK'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Intake:</span>
              <strong className="text-white">{activeConversation.leadId?.intake || 'Fall 2026'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Education:</span>
              <strong className="text-white truncate">{activeConversation.leadId?.qualification || 'Bachelor in CS'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CGPA:</span>
              <strong className="text-white">{activeConversation.leadId?.cgpa || '3.40 / 4.0'}</strong>
            </div>
          </div>
        </div>

        {/* Reassign Counselor */}
        <div className="space-y-1.5 bg-white/5 p-3 rounded-2xl border border-white/5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Assigned Counselor
          </span>
          <select
            value={activeConversation.assignedCounselor?._id || ''}
            onChange={(e) => {
              const cId = e.target.value;
              const cObj = counselors.find(c => c._id === cId);
              handleAssignCounselor(cId, cObj?.name || 'Assigned Counselor');
            }}
            className="w-full p-2 bg-[#071A33] border border-white/20 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Direct Admin Oversight --</option>
            {counselors.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.countries?.join(', ') || 'Global'})
              </option>
            ))}
          </select>
        </div>

        {/* Internal Counselor Notes */}
        <div className="space-y-2 flex-1 flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Internal Case Notes
          </span>

          {/* Notes List */}
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {activeConversation.answers?.notes && activeConversation.answers.notes.length > 0 ? (
              activeConversation.answers.notes.map((n, idx) => (
                <div key={idx} className="p-2 bg-white/5 rounded-xl border border-white/5 text-[11px] space-y-0.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>{n.author || 'Staff'}</span>
                    <span>{n.time || ''}</span>
                  </div>
                  <p className="text-slate-200">{n.text}</p>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-500 italic">No notes recorded yet.</p>
            )}
          </div>

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="space-y-1.5 pt-2">
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Add case remark..."
              className="w-full p-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={noteSubmitting || !newNoteText.trim()}
              className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-40"
            >
              {noteSubmitting ? 'Saving Note...' : 'Add Remark'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100dvh-70px)] sm:h-[calc(100vh-80px)] flex flex-col space-y-2 sm:space-y-3 relative overflow-hidden">
      
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-20 right-8 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-xl border flex items-center space-x-2 ${
              feedback.type === 'error'
                ? 'bg-rose-500/90 text-white border-rose-400'
                : 'bg-emerald-600/90 text-white border-emerald-400'
            }`}
          >
            {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{feedback.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 3-Column Glass Layout */}
      <div className="flex-1 flex gap-0 sm:gap-3 overflow-hidden rounded-2xl sm:rounded-3xl glass-card border border-white/10 shadow-2xl bg-[#081B38]/90 relative">
        
        {/* ========================================================================= */}
        {/* COLUMN 1: CONVERSATION LIST (DESKTOP) */}
        <div className="hidden lg:flex w-72 xl:w-96 flex-col border-r border-white/10 bg-[#07162C]/70 shrink-0">
          {renderConversationList(false)}
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: ACTIVE CHAT WINDOW (CENTER - FULL WIDTH ON MOBILE)              */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0B2144]/60 relative h-full">
          {activeConversation ? (
            <>
              {/* Center Top Chat Header (Native WhatsApp Mobile Feel on < lg) */}
              <div className="h-15 sm:h-16 px-2.5 sm:px-6 border-b border-white/10 flex items-center justify-between bg-[#071833]/95 backdrop-blur-md shrink-0 gap-2">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  
                  {/* Native WhatsApp Mobile Back Arrow */}
                  <button
                    type="button"
                    onClick={() => setShowConversationsDrawer(true)}
                    className="lg:hidden p-1.5 -ml-1 text-slate-200 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0"
                    title="All Chats"
                    aria-label="All Chats"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] flex items-center justify-center font-black text-white text-sm shadow-md">
                      {(activeConversation.leadId?.fullName || activeConversation.answers?.fullName || 'C').charAt(0)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-[#071833] rounded-full"></span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-xs sm:text-sm font-black text-white truncate">
                        {activeConversation.leadId?.fullName || activeConversation.answers?.fullName || 'Prospective Candidate'}
                      </h3>
                      <span className="text-xs shrink-0">{activeConversation.leadId?.preferredCountry === 'UK' ? '🇬🇧' : '🌍'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium truncate flex items-center space-x-1.5">
                      <span className="text-[#25D366] font-semibold">online</span>
                      <span>•</span>
                      <span>{activeConversation.leadId?.visaCategory || activeConversation.serviceType || 'Study Visa'}</span>
                    </p>
                  </div>
                </div>

                {/* Header Action Controls */}
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs shrink-0">
                  {/* Call icon */}
                  <button
                    type="button"
                    onClick={() => {
                      const phone = activeConversation.leadId?.phone || activeConversation.answers?.phone;
                      if (phone) window.open(`tel:${phone}`);
                    }}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Call Candidate"
                  >
                    <Phone className="w-4 h-4 text-[#25D366]" />
                  </button>

                  {/* Resume AI Button */}
                  {(activeConversation.mode === 'HUMAN' || activeConversation.automationPaused) && (
                    <button
                      onClick={handleResumeAi}
                      className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold transition-all text-[11px] shrink-0"
                      title="Resume Conversational AI"
                    >
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Resume AI</span>
                    </button>
                  )}

                  {/* Mobile Open CRM Lead Details Button */}
                  <button
                    onClick={() => setShowMobileLeadDetails(true)}
                    className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center space-x-1 text-xs font-bold shrink-0 transition-colors bg-white/5 border border-white/10"
                    title="Open Lead Details"
                    aria-label="Open Lead Details"
                  >
                    <FileText className="w-4 h-4 text-[#F59E0B]" />
                    <span className="hidden sm:inline text-[11px]">CRM</span>
                  </button>

                  {/* Close Chat */}
                  {activeConversation.status !== 'CLOSED' && (
                    <button
                      onClick={handleCloseChat}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-300 hover:bg-white/10 rounded-xl transition-colors"
                      title="Close Conversation"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  )}

                  {/* Desktop Toggle Right Panel Button */}
                  <button
                    onClick={() => setShowRightPanel(!showRightPanel)}
                    className={`hidden lg:flex p-2 rounded-xl transition-colors ${
                      showRightPanel ? 'bg-blue-600/30 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title="Toggle Case Intelligence Sidebar"
                  >
                    <User className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Follow-Up Guidance Banner */}
              {(activeConversation.followUpStatus || activeConversation.status === 'NEEDS_FOLLOW_UP' || activeConversation.leadId?.status === 'NEEDS_FOLLOW_UP') && (
                <div className="mx-3 sm:mx-4 mt-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-200 shadow-md shrink-0">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-extrabold text-amber-300 block truncate">
                        {activeConversation.followUpStatus || 'Appointment Cancelled - Follow Up Required'}
                      </span>
                      <span className="text-[11px] text-amber-100/80 leading-snug block">
                        {activeConversation.followUpStatus?.includes('Cancelled') || activeConversation.status === 'NEEDS_FOLLOW_UP' || activeConversation.leadId?.status === 'NEEDS_FOLLOW_UP'
                          ? 'Consultation was cancelled. Send a direct follow-up message to reschedule.'
                          : 'Candidate has a consultation booking or follow-up note.'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const candidateName = activeConversation.leadId?.fullName || activeConversation.answers?.fullName || 'there';
                      if (activeConversation.followUpStatus?.includes('Cancelled') || activeConversation.status === 'NEEDS_FOLLOW_UP' || activeConversation.leadId?.status === 'NEEDS_FOLLOW_UP') {
                        setReplyText(`Hello ${candidateName},\n\nWe noticed your consultation was cancelled.\n\nWould you like to reschedule your immigration consultation?\n\nOur team is available to assist you.`);
                      } else {
                        setReplyText(`Hello ${candidateName}, I saw your consultation is booked. Please have your academic transcripts and passport ready.`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-900 font-extrabold text-xs hover:bg-amber-300 transition-all shrink-0 shadow-sm self-end sm:self-auto"
                  >
                    Use Template
                  </button>
                </div>
              )}

              {/* Chat Messages Feed */}
              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 whatsapp-chat-bg bg-opacity-10 relative -webkit-overflow-scrolling-touch"
              >
                {/* System Banner */}
                <div className="flex justify-center">
                  <div className="bg-[#071A33]/80 backdrop-blur-md border border-white/10 text-slate-300 text-[10px] sm:text-[11px] px-3 py-1 rounded-full shadow-sm flex items-center space-x-1.5 text-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>WhatsApp Enterprise Live Thread • Unified Customer Record</span>
                  </div>
                </div>

                {activeConversation.messages?.map((msg, idx) => {
                  const isUser = msg.sender === 'USER' || msg.sender === 'user';
                  const isAi = msg.sender === 'AI' || msg.sender === 'bot';
                  const isAdminOrCounselor = msg.sender === 'ADMIN' || msg.sender === 'COUNSELOR';
                  const isSystem = msg.sender === 'SYSTEM';

                  if (isSystem) {
                    return (
                      <div key={idx} className="flex justify-center my-1.5">
                        <span className="bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[10px] font-medium px-3 py-1 rounded-full text-center">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        isUser
                          ? 'items-start'
                          : 'items-end'
                      }`}
                    >
                      {/* Bubble Sender Label */}
                      <div className="flex items-center space-x-1 mb-1 px-1 text-[10px] font-bold text-slate-400">
                        {isUser && (
                          <span className="text-[#25D366] font-black flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {activeConversation.leadId?.fullName || 'Customer'}
                          </span>
                        )}
                        {isAi && (
                          <span className="text-blue-400 font-black flex items-center">
                            <Bot className="w-3 h-3 mr-1" />
                            AI Assistant
                          </span>
                        )}
                        {isAdminOrCounselor && (
                          <span className="text-purple-300 font-black flex items-center">
                            <UserCheck className="w-3 h-3 mr-1" />
                            {msg.sender === 'ADMIN' ? 'Administrator' : (msg.metadata?.counselorName || 'Counselor')}
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Bubble Content */}
                      <div
                        className={`max-w-[88%] sm:max-w-[70%] p-3 sm:p-3.5 rounded-2xl text-xs leading-relaxed shadow-md break-words [overflow-wrap:anywhere] ${
                          isUser
                            ? 'bg-[#DCF8C6] text-slate-900 rounded-tl-xs font-medium'
                            : (msg.type === 'FOLLOW_UP' || msg.messageType === 'follow_up')
                            ? 'bg-amber-50 border-2 border-amber-300 text-slate-900 rounded-tr-xs font-medium shadow-md'
                            : isAdminOrCounselor
                            ? 'bg-purple-600 text-white rounded-tr-xs font-medium'
                            : 'bg-white/95 text-slate-900 rounded-tr-xs font-medium'
                        }`}
                      >
                        {(msg.type === 'FOLLOW_UP' || msg.messageType === 'follow_up') && (
                          <div className="flex items-center space-x-1 font-black text-[11px] text-amber-800 pb-1 mb-1.5 border-b border-amber-200">
                            <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>🔔 Follow-up from Immigration Team</span>
                          </div>
                        )}
                        <div className="whitespace-pre-line">{msg.message}</div>

                        {/* Options / Action Chips if any */}
                        {msg.options && msg.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-slate-200/50">
                            {msg.options.map((opt, oIdx) => (
                              <span key={oIdx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                                {opt.label || opt.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Template Replies */}
              <div className="px-3 sm:px-4 py-2 bg-[#07162C] border-t border-white/10 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center">
                  <Sparkles className="w-3 h-3 text-[#F59E0B] mr-1" /> Templates:
                </span>
                {QUICK_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setReplyText(tmpl)}
                    className="text-[10px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded-lg border border-white/10 shrink-0 transition-colors text-left"
                  >
                    {tmpl.slice(0, 32)}...
                  </button>
                ))}
              </div>

              {/* Bottom Message Composer (Sticky at bottom like native WhatsApp) */}
              <form onSubmit={handleSendReply} className="p-2 sm:p-3.5 bg-[#071833]/95 backdrop-blur-md border-t border-white/10 flex items-center space-x-2 shrink-0 sticky bottom-0 z-20">
                <div className="flex-1 flex items-center bg-white/5 border border-white/15 rounded-full px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:border-transparent transition-all">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type reply to WhatsApp..."
                    className="flex-1 min-w-0 bg-transparent py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-lg shadow-blue-500/30 shrink-0 active:scale-95"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs font-bold text-center">
              Select a conversation to view chat stream.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3: CASE INTELLIGENCE & LEAD PROFILE (DESKTOP) */}
        {showRightPanel && activeConversation && (
          <div className="hidden lg:flex w-64 xl:w-80 border-l border-white/10 bg-[#07162C]/80 flex-col p-4 space-y-4 overflow-y-auto shrink-0 text-xs">
            {renderCrmDetails(false)}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE DRAWER: CONVERSATION LIST (OFF-CANVAS)                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showConversationsDrawer && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowConversationsDrawer(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-80 sm:w-96 max-w-[88vw] h-full bg-[#07162C] text-white flex flex-col shadow-2xl z-50 border-r border-white/10"
            >
              {renderConversationList(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM SHEET: CRM LEAD DETAILS                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showMobileLeadDetails && activeConversation && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowMobileLeadDetails(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full sm:max-w-lg max-h-[85vh] h-auto bg-[#07162C] text-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-50 border border-white/15 flex flex-col overflow-hidden"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-2 shrink-0 sm:hidden" />
              <div className="overflow-y-auto p-4 sm:p-5 flex-1 space-y-4">
                {renderCrmDetails(true)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
