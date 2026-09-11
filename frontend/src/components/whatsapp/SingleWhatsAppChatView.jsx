import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Camera,
  Send,
  Sparkles,
  Bot,
  CheckCheck,
  Play,
  Pause,
  GraduationCap,
  Calendar,
  Clock,
  RotateCcw,
  Award,
  UserCheck,
  CheckCircle2,
  FileText,
  Volume2,
  PhoneOff,
  X,
  Plus,
  AlertCircle,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { chatbotAPI, meetingAPI } from '../../services/api';
import BookingModal from '../meetings/BookingModal';
import { startNewCustomerChat } from '../../services/customerChat';

// Helper to normalize any server message (USER, AI, ADMIN, COUNSELOR, SYSTEM)
const normalizeServerMessage = (m, idx) => {
  const rawSender = String(m.sender || 'AI').trim().toUpperCase();
  let senderRole = 'ai';
  if (rawSender === 'USER') {
    senderRole = 'user';
  } else if (rawSender === 'ADMIN') {
    senderRole = 'admin';
  } else if (rawSender === 'COUNSELOR' || rawSender === 'AGENT') {
    senderRole = 'counselor';
  } else if (rawSender === 'SYSTEM') {
    senderRole = 'system';
  } else {
    senderRole = 'ai';
  }

  const textContent = m.content || m.message || m.text || '';
  const timestamp = m.timestamp ? new Date(m.timestamp) : new Date();
  const meta = m.metadata || {};

  const isAppointmentRequested =
    m.type === 'APPOINTMENT_REQUESTED' ||
    meta.type === 'APPOINTMENT_REQUESTED' ||
    meta.status === 'PENDING' ||
    textContent.includes('Appointment Request Submitted');

  const isAppointmentCancelled =
    m.type === 'APPOINTMENT_CANCELLED' ||
    meta.type === 'APPOINTMENT_CANCELLED' ||
    meta.status === 'CANCELLED' ||
    textContent.includes('consultation has been cancelled');

  const isAppointmentRescheduled =
    m.type === 'APPOINTMENT_RESCHEDULED' ||
    meta.type === 'APPOINTMENT_RESCHEDULED' ||
    meta.status === 'RESCHEDULED' ||
    textContent.includes('consultation has been rescheduled');

  const isAppointmentConfirmed =
    !isAppointmentRequested &&
    !isAppointmentCancelled &&
    !isAppointmentRescheduled &&
    (m.type === 'APPOINTMENT_CONFIRMED' ||
      meta.type === 'APPOINTMENT_CONFIRMED' ||
      meta.status === 'CONFIRMED' ||
      meta.appointmentConfirmed === true ||
      textContent.includes('consultation has been confirmed'));

  const isFollowUp =
    m.type === 'FOLLOW_UP' ||
    meta.type === 'FOLLOW_UP' ||
    m.messageType === 'follow_up' ||
    meta.followUpTitle?.includes('Follow-up') ||
    textContent.includes('Follow-up from Immigration Team') ||
    (rawSender === 'ADMIN' && textContent.toLowerCase().includes('reschedule your immigration consultation'));

  const meetingId = meta.meetingId || m.meetingId || meta._id || m._id;
  const isAnyAppointmentCard = isAppointmentRequested || isAppointmentConfirmed || isAppointmentCancelled || isAppointmentRescheduled;

  const consultationTypeStr = meta.consultationType === 'IN_PERSON'
    ? 'In-Person Consultation'
    : meta.consultationType === 'ONLINE'
    ? 'Online Consultation'
    : (meta.mode || meta.consultationMode || meta.meetingType || 'Online Zoom Consultation');

  const statusLabel = isAppointmentRequested
    ? 'PENDING'
    : isAppointmentCancelled
    ? 'CANCELLED'
    : isAppointmentRescheduled
    ? 'RESCHEDULED'
    : isAppointmentConfirmed
    ? 'CONFIRMED'
    : (meta.status || 'CONFIRMED');

  return {
    id: m._id ? String(m._id) : `db_msg_${idx}_${timestamp.getTime()}`,
    sender: senderRole,
    rawSender,
    text: textContent,
    isCard: m.messageType === 'card' || isAnyAppointmentCard,
    isFollowUp,
    isAppointmentRequested,
    isAppointmentConfirmed,
    isAppointmentCancelled,
    isAppointmentRescheduled,
    appointmentDetails: isAnyAppointmentCard ? {
      meetingId,
      date: meta.date || m.date || 'Scheduled',
      time: meta.time || m.time || '10:00 AM',
      mode: consultationTypeStr,
      consultationType: meta.consultationType || (consultationTypeStr.includes('In-Person') ? 'IN_PERSON' : 'ONLINE'),
      counselor: meta.counselorName || meta.counselor || 'Senior Immigration Counselor',
      status: statusLabel
    } : null,
    isVoice: m.messageType === 'voice',
    voiceDuration: meta.voiceDuration || '0:22',
    isMeetingCard: m.messageType === 'meeting_booking',
    meetingSlots: meta.meetingSlots || ['Tomorrow 10:00 AM', 'Tomorrow 02:00 PM', 'Tomorrow 04:00 PM', 'Friday 11:00 AM'],
    time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    options: m.options || [],
    actionChips: m.actionChips || (m.options?.map(o => ({ label: o.label, action: o.value })) || []),
    status: m.deliveryStatus || 'delivered',
    metadata: meta
  };
};

// Initial Student Info & Fallback State
const INITIAL_STUDENT = {
  name: 'Ali Khan',
  flag: '🇬🇧',
  country: 'United Kingdom',
  phone: '+92 300 1234567',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  education: 'BS Computer Science (3.42 CGPA)',
  ielts: 'Band 6.5',
  intake: 'September 2026',
  eligibilityScore: 87
};

export default function SingleWhatsAppChatView() {
  const [sessionId, setSessionId] = useState(() => {
    // 1. Explicit query parameter (?sessionId=... or ?session=...)
    const urlParams = new URLSearchParams(window.location.search);
    const explicitSessionId = urlParams.get('sessionId') || urlParams.get('session');
    if (explicitSessionId) {
      try { localStorage.setItem('whatsapp_customer_session_id', explicitSessionId); } catch (e) {}
      return explicitSessionId;
    }
    // 2. LocalStorage persistence across page visits/refreshes
    try {
      const saved = localStorage.getItem('whatsapp_customer_session_id');
      if (saved) return saved;
    } catch (e) {}
    // 3. Fallback: generate a fresh unique session ID
    const freshId = `wa_chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    try { localStorage.setItem('whatsapp_customer_session_id', freshId); } catch (e) {}
    return freshId;
  });

  const [collisionError, setCollisionError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatMode, setChatMode] = useState('HYBRID'); // 'AI' | 'HUMAN' | 'HYBRID'
  const [activeLead, setActiveLead] = useState(null);
  const [assignedCounselorName, setAssignedCounselorName] = useState('Senior Counselor');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCallModal, setShowCallModal] = useState(null); // 'voice' | 'video' | null
  const [callDuration, setCallDuration] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [actionNotice, setActionNotice] = useState(null);
  const [selectedMeetingSlot, setSelectedMeetingSlot] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedMeetingForReschedule, setSelectedMeetingForReschedule] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const chatAreaRef = useRef(null);

  // Initialize or fetch existing conversation session from MongoDB
  useEffect(() => {
    let isCancelled = false;

    async function initSession() {
      // 1. Try to fetch existing conversation from database
      try {
        const sessionRes = await chatbotAPI.getSession(sessionId);
        if (!isCancelled && sessionRes && sessionRes.success && sessionRes.data) {
          const conv = sessionRes.data;
          setChatMode(conv.mode || 'HYBRID');
          if (conv.leadId) setActiveLead(conv.leadId);
          if (conv.assignedCounselor) setAssignedCounselorName(conv.assignedCounselor.name);

          if (Array.isArray(conv.messages) && conv.messages.length > 0) {
            setMessages(conv.messages.map(normalizeServerMessage));
            return;
          }
        }
      } catch (err) {
        // Fresh session, will initialize below
      }

      // 2. Fresh session creation via /api/chat/init
      try {
        const initRes = await chatbotAPI.initSession({ sessionId });

        if (!isCancelled && initRes && initRes.success) {
          setChatMode(initRes.mode || 'HYBRID');
          if (initRes.lead) setActiveLead(initRes.lead);

          if (Array.isArray(initRes.messages) && initRes.messages.length > 0) {
            setMessages(initRes.messages.map(normalizeServerMessage));
          } else {
            setMessages([
              {
                id: 'init_msg',
                sender: 'ai',
                rawSender: 'AI',
                isCard: false,
                text: initRes.botResponse || 'Welcome to **AI WhatsApp Immigration Assistant**! 🌍\n\nI am your 24/7 automated immigration advisor.\n\nMay I know your full name?',
                options: initRes.options || [],
                actionChips: initRes.actionChips || [],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
        }
      } catch (error) {
        console.error('Error initializing fresh chat prompt:', error);
      } finally {
        if (!isCancelled) setIsAiTyping(false);
      }
    }

    initSession();
    return () => {
      isCancelled = true;
    };
  }, [sessionId]);

  // Real-time synchronization: Polls session messages & listens to appointment events across windows
  useEffect(() => {
    let isCancelled = false;

    const syncMessages = async () => {
      try {
        const sessionRes = await chatbotAPI.getSession(sessionId);
        if (!isCancelled && sessionRes && sessionRes.success && sessionRes.data) {
          const conv = sessionRes.data;
          if (conv.mode) setChatMode(conv.mode);
          if (conv.leadId) setActiveLead(conv.leadId);
          if (conv.assignedCounselor) setAssignedCounselorName(conv.assignedCounselor.name);

          if (Array.isArray(conv.messages) && conv.messages.length > 0) {
            setMessages((prev) => {
              if (
                prev.length !== conv.messages.length ||
                (conv.messages[conv.messages.length - 1]?._id &&
                  prev[prev.length - 1]?.id !== String(conv.messages[conv.messages.length - 1]._id))
              ) {
                return conv.messages.map(normalizeServerMessage);
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // Background sync catch
      }
    };

    // Live polling every 2.5 seconds
    const pollTimer = setInterval(syncMessages, 2500);

    const handleLocalSync = () => syncMessages();
    window.addEventListener('appointments-updated', handleLocalSync);
    window.addEventListener('storage', handleLocalSync);
    window.addEventListener('focus', handleLocalSync);

    return () => {
      isCancelled = true;
      clearInterval(pollTimer);
      window.removeEventListener('appointments-updated', handleLocalSync);
      window.removeEventListener('storage', handleLocalSync);
      window.removeEventListener('focus', handleLocalSync);
    };
  }, [sessionId]);

  // AI Typing Indicator Auto-Dismiss Safety Timeout (Guarantees no infinite typing state)
  useEffect(() => {
    if (!isAiTyping) return;
    const safetyTimer = setTimeout(() => {
      setIsAiTyping(false);
    }, 10000);
    return () => clearTimeout(safetyTimer);
  }, [isAiTyping]);

  // Auto-scroll inside chat area only (never shifts outer page)
  const scrollToBottom = (behavior = 'smooth') => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTo({
        top: chatAreaRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length, isAiTyping]);

  // Voice Call Timer
  useEffect(() => {
    let interval;
    if (showCallModal) {
      interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [showCallModal]);

  // Voice Recording Timer
  useEffect(() => {
    let interval;
    if (isRecordingVoice) {
      interval = setInterval(() => setRecordTimer((t) => t + 1), 1000);
    } else {
      setRecordTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  const triggerNotice = (text) => {
    setActionNotice(text);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Real-time synchronization: Poll for Admin and Counselor replies every 1800ms
  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;

    const pollTimer = setInterval(async () => {
      try {
        const sessionRes = await chatbotAPI.getSession(sessionId);
        if (!isMounted) return;

        if (sessionRes && sessionRes.success && sessionRes.data) {
          const conv = sessionRes.data;
          if (conv.mode && conv.mode !== chatMode) {
            setChatMode(conv.mode);
          }
          if (conv.assignedCounselor) {
            setAssignedCounselorName(conv.assignedCounselor.name);
          }
          if (conv.leadId) {
            setActiveLead(conv.leadId);
          }

          if (Array.isArray(conv.messages) && conv.messages.length > 0) {
            const serverMapped = conv.messages.map(normalizeServerMessage);
            const lastServerMsg = serverMapped[serverMapped.length - 1];

            // If the latest message on server is from AI/staff/system, clear typing immediately
            if (lastServerMsg && lastServerMsg.sender !== 'user') {
              setIsAiTyping(false);
            }

            setMessages((prev) => {
              // Retain any pending optimistic user message not yet written to server
              const pendingLocal = prev.filter(p =>
                String(p.id).startsWith('local_') &&
                !serverMapped.some(s => s.sender === 'user' && s.text?.trim() === p.text?.trim())
              );

              const currentServerItems = prev.filter(p => !String(p.id).startsWith('local_'));
              const lastServer = serverMapped[serverMapped.length - 1];
              const lastCurrent = currentServerItems[currentServerItems.length - 1];

              const hasUpdates = serverMapped.length !== currentServerItems.length ||
                !lastCurrent ||
                lastServer.id !== lastCurrent.id ||
                lastServer.text !== lastCurrent.text;

              if (hasUpdates) {
                return [...serverMapped, ...pendingLocal];
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // silent polling error
      }
    }, 1800);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [sessionId, chatMode]);

  // Resume AI Hybrid Mode Handler
  const handleResumeAi = async () => {
    setIsAiTyping(false);
    try {
      const res = await chatbotAPI.resumeAi({ sessionId });
      if (res && res.success) {
        setChatMode('HYBRID');
        setIsAiTyping(false);
        triggerNotice('AI Assistant resumed 🤖');
        setMessages((prev) => [
          ...prev,
          {
            id: `sys_${Date.now()}`,
            sender: 'system',
            text: 'AI Hybrid Mode has been resumed. Automated responses are now active.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error('Error resuming AI mode:', err);
    }
  };

  // Send Message via Backend API
  const handleSendMessage = async (customText = null, isVoice = false) => {
    const textToSend = (customText !== null ? customText : inputText).trim();
    if (!textToSend && !isVoice) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localId = `local_${Date.now()}`;

    // Optimistically add user message so it appears instantly in chat UI
    const userMsgObj = isVoice
      ? {
          id: localId,
          sender: 'user',
          isVoice: true,
          voiceDuration: `0:${recordTimer < 10 ? '0' : ''}${recordTimer || 22}`,
          time: timeStr,
          status: 'delivered'
        }
      : {
          id: localId,
          sender: 'user',
          text: textToSend,
          time: timeStr,
          status: 'delivered'
        };

    setMessages((prev) => [...prev, userMsgObj]);
    setInputText('');
    setIsRecordingVoice(false);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);

    // AI typing indicator only if NOT in human mode
    if (chatMode !== 'HUMAN') {
      setIsAiTyping(true);
    }

    try {
      // Backend Request
      const response = await chatbotAPI.sendMessage({
        sessionId,
        message: textToSend || 'Voice message',
        sender: 'USER',
        phone: activeLead?.phone || undefined,
        fullName: activeLead?.fullName || undefined
      });

      if (response && response.success) {
        if (response.lead) setActiveLead(response.lead);
        if (response.mode) setChatMode(response.mode);

        // When in HUMAN mode, AI generation is disabled. User message is already in UI.
        if (response.mode === 'HUMAN' || chatMode === 'HUMAN') {
          setIsAiTyping(false);
          return;
        }

        const aiTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // If qualification is complete (AI mode)
        if (response.isComplete) {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai_${Date.now()}`,
              sender: 'ai',
              isCard: true,
              title: 'Immigration AI 🤖',
              text: response.botResponse,
              scoreReport: response.scoreReport,
              actionChips: response.actionChips || [
                { label: '📅 Book Consultation', action: 'book_meeting' },
                { label: '🎓 University Options', action: 'university_options' },
                { label: '🏆 Scholarship Details', action: 'scholarship_details' },
                { label: '👨‍💼 Talk to Counselor', action: 'talk_counselor' }
              ],
              time: aiTimeStr
            }
          ]);
        } else if (response.botResponse) {
          // Next qualification question
          setMessages((prev) => [
            ...prev,
            {
              id: `ai_${Date.now()}`,
              sender: 'ai',
              isCard: false,
              text: response.botResponse,
              options: response.options || [],
              actionChips: response.actionChips || (response.options?.map(o => ({ label: o.label, action: o.value })) || []),
              time: aiTimeStr
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error sending message to backend:', error);
      triggerNotice('Note: Message recorded in local preview');
    } finally {
      setIsAiTyping(false);
    }
  };

  // Handle Quick Reply / Action Chip Click
  const handleChipClick = async (chip) => {
    const action = chip.action || chip.value || chip.label;

    if (action === 'talk_counselor' || chip.label?.includes('Counselor')) {
      // Trigger Human Counselor Takeover via API
      try {
        const takeoverRes = await chatbotAPI.takeoverChat({ sessionId });
        if (takeoverRes && takeoverRes.success) {
          setChatMode('HUMAN');
          triggerNotice('Senior Counselor assigned. Conversational AI paused 👨‍💼');
          setMessages((prev) => [
            ...prev,
            {
              id: `sys_${Date.now()}`,
              sender: 'ai',
              text: 'Senior Counselor has taken over the conversation. You are now communicating directly with human staff. Conversational AI replies are paused.',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          return;
        }
      } catch (err) {
        console.error('Takeover error:', err);
      }
    }

    if (action === 'book_meeting' || chip.label?.includes('Book Consultation')) {
      setBookingOpen(true);
      return;
    }

    // Default: send label to chatbot
    handleSendMessage(chip.label || chip.value);
  };

  // Use the same live availability and confirmation flow for in-chat suggestions.
  const handleBookSlot = (slot) => {
    setSelectedMeetingSlot(slot);
    setCollisionError(null);
    setBookingOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-[100dvh] w-full max-w-full overflow-hidden bg-[#EFEAE2] select-none text-[#111111] antialiased"
    >
      {/* ========================================================================= */}
      {/* 1. TOP WHATSAPP HEADER                                                    */}
      {/* ========================================================================= */}
      <header className="h-[64px] sm:h-[68px] bg-[#F0F2F5]/95 backdrop-blur-md px-2.5 sm:px-6 flex items-center justify-between border-b border-[#D1D7DB] shrink-0 z-30 shadow-xs">
        {/* Left: Back Arrow + Avatar + Student Info + Status */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 mr-2">
          <button
            onClick={() => triggerNotice('WhatsApp Home')}
            className="p-1 sm:p-1.5 -ml-1 text-[#54656F] hover:text-[#111111] hover:bg-[#E9EDEF] rounded-full transition-colors shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar with Online Indicator */}
          <div className="relative cursor-pointer shrink-0">
            <img
              src={INITIAL_STUDENT.avatar}
              alt={INITIAL_STUDENT.name}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-xs"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-[#25D366] border-2 border-white rounded-full"></span>
          </div>

          {/* Student Name & AI Status */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
              <h1 className="font-bold text-sm sm:text-base text-[#111111] leading-tight truncate flex items-center space-x-1">
                <span className="truncate">{activeLead?.fullName || INITIAL_STUDENT.name}</span>
                <span className="shrink-0">{INITIAL_STUDENT.flag}</span>
              </h1>

              {/* Mode Badge */}
              <button
                onClick={chatMode === 'HUMAN' ? handleResumeAi : undefined}
                className={`hidden xs:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black border transition-colors shrink-0 ${
                  chatMode === 'HUMAN'
                    ? 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300 cursor-pointer'
                    : 'bg-[#E7FCE3] text-[#008069] border-[#25D366]/40 cursor-default'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${chatMode === 'HUMAN' ? 'bg-purple-600' : 'bg-[#25D366] animate-pulse'}`}></span>
                <span>{chatMode === 'HUMAN' ? 'Human' : 'AI Active'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-1.5 text-[11px] sm:text-xs text-[#667781] mt-0.5 min-w-0">
              <span className="text-[#008069] font-medium flex items-center shrink-0">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#25D366] inline-block mr-1"></span>
                Online
              </span>
              <span className="shrink-0">•</span>
              <span className="text-slate-600 font-medium truncate">
                {chatMode === 'HUMAN' ? `Handled by ${assignedCounselorName}` : 'AI WhatsApp Assistant'}
              </span>
              {activeLead && activeLead.leadScore > 0 && (
                <span className="hidden md:inline text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0">
                  {activeLead.leadScore}% {activeLead.leadTemperature || 'HOT'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-0.5 sm:space-x-1 text-[#54656F] shrink-0">
          <button
            onClick={() => triggerNotice('Searching in chat...')}
            className="hidden sm:inline-flex p-2 hover:bg-[#E9EDEF] rounded-full transition-colors"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCallModal('voice')}
            className="p-1.5 sm:p-2 hover:bg-[#E9EDEF] rounded-full transition-colors text-[#008069]"
            title="Voice Call"
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setShowCallModal('video')}
            className="p-1.5 sm:p-2 hover:bg-[#E9EDEF] rounded-full transition-colors text-[#008069]"
            title="Video Call"
          >
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 sm:p-2 hover:bg-[#E9EDEF] rounded-full transition-colors"
              title="More"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs font-medium">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    triggerNotice(`Student Profile: Ali Khan • ${activeLead ? activeLead.serviceType : 'Study Visa'} • ${activeLead ? activeLead.leadScore : 87}% Score`);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F0F2F5] text-slate-800 flex items-center space-x-2"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Student Profile Dossier</span>
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleResumeAi();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F0F2F5] text-slate-800 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Resume AI Hybrid Mode</span>
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    startNewCustomerChat();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F0F2F5] text-red-600 flex items-center space-x-2 border-t border-slate-100"
                >
                  <X className="w-4 h-4" />
                  <span>Start New Conversation</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Temporary Toast Notice */}
      {messages.some(message => message.isAppointmentConfirmed) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-emerald-50 border-b border-emerald-200">
          <p className="text-xs text-emerald-900">Appointment saved. This conversation remains available in the inbox for follow-up.</p>
          <button type="button" onClick={startNewCustomerChat} className="shrink-0 px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold">
            Start New Conversation
          </button>
        </div>
      )}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-[#008069] text-white px-5 py-2 rounded-full text-xs font-bold shadow-xl z-50 flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{actionNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. CHAT CONVERSATION AREA (Strict Fixed-Height Internal Scroll)            */}
      {/* ========================================================================= */}
      <main
        ref={chatAreaRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4 whatsapp-chat-bg relative"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Day Separator */}
          <div className="flex justify-center my-2">
            <span className="bg-[#FFFFFF]/90 backdrop-blur-sm text-[#54656F] text-[11px] font-bold px-3.5 py-1 rounded-md shadow-xs border border-slate-200 uppercase tracking-wider">
              TODAY
            </span>
          </div>

          {/* AI Banner Notice */}
          <div className="flex justify-center my-2">
            <div className="bg-[#FFFDE7]/90 backdrop-blur-md border border-amber-300/80 text-amber-900 text-xs px-4 py-2 rounded-xl shadow-xs flex items-center space-x-2 text-center max-w-lg">
              <Bot className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>AI WhatsApp Immigration Platform:</strong> Supporting Study Visa, Skilled Migration, Business Visas, and Visit Visas.
              </span>
            </div>
          </div>

          {/* Message List */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isAdmin = msg.sender === 'admin';
            const isCounselor = msg.sender === 'counselor';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              if (msg.isAppointmentRequested) {
                return (
                  <div key={msg.id} className="flex justify-center my-3 w-full px-2">
                    <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-amber-300 shadow-md p-4 space-y-3">
                      <div className="flex items-center space-x-2 text-amber-700 font-black text-sm pb-2 border-b border-amber-100">
                        <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
                        <span>📅 Appointment Request Submitted</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-800">
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Status:</span>
                          <span className="font-black px-2 py-0.5 rounded-full text-[10px] uppercase bg-amber-100 text-amber-800 border border-amber-300">
                            Pending Confirmation
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Consultation Type:</span>
                          <span className="font-bold text-slate-900">{msg.appointmentDetails?.mode || 'Online Consultation'}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Date:</span>
                          <span className="font-bold text-slate-900">{msg.appointmentDetails?.date || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Time:</span>
                          <span className="font-bold text-slate-900">{msg.appointmentDetails?.time || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                          <span className="font-semibold text-slate-500">Counselor:</span>
                          <span className="font-bold text-amber-800">{msg.appointmentDetails?.counselor || assignedCounselorName}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center space-x-2 font-medium">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Your consultation request is pending confirmation from our counselors.</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2.5 border-t border-amber-100 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMeetingForReschedule({
                                ...msg.appointmentDetails,
                                _id: msg.appointmentDetails?.meetingId || msg.appointmentDetails?._id,
                                fullName: activeLead?.fullName || INITIAL_STUDENT.name,
                                phone: activeLead?.phone || INITIAL_STUDENT.phone,
                                email: activeLead?.email || 'student@immigration.com',
                                meetingType: msg.appointmentDetails?.mode
                              });
                              setIsRescheduleOpen(true);
                            }}
                            className="py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center justify-center space-x-1 shadow-xs active:scale-98"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Reschedule</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMeetingToCancel(msg.appointmentDetails);
                              setShowCancelModal(true);
                            }}
                            className="py-2 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-all flex items-center justify-center space-x-1 shadow-xs active:scale-98"
                          >
                            <X className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-end text-[10px] text-[#667781] pt-0.5">
                        <span>{msg.time}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.isAppointmentCancelled) {
                return (
                  <div key={msg.id} className="flex justify-center my-3 w-full px-2">
                    <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-red-300 shadow-md p-4 space-y-3">
                      <div className="flex items-center space-x-2 text-red-600 font-black text-sm pb-2 border-b border-red-100">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <span>❌ Appointment Cancelled</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-800">
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Date:</span>
                          <span className="font-bold text-slate-900">{msg.appointmentDetails?.date || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Time:</span>
                          <span className="font-bold text-slate-900">{msg.appointmentDetails?.time || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                          <span className="font-semibold text-slate-500">Status:</span>
                          <span className="font-bold text-red-600 uppercase">CANCELLED</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-red-700 bg-red-50/80 p-2 rounded-xl border border-red-200 flex items-center space-x-2 font-medium">
                        <X className="w-4 h-4 text-red-600 shrink-0" />
                        <span>❌ Your consultation has been cancelled.</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setBookingOpen(true)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                        >
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>Book a new appointment</span>
                        </button>
                        <span className="text-[10px] text-[#667781]">{msg.time}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.isAppointmentRescheduled) {
                return (
                  <div key={msg.id} className="flex justify-center my-3 w-full px-2">
                    <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-purple-300 shadow-md p-4 space-y-3">
                      <div className="flex items-center space-x-2 text-purple-700 font-black text-sm pb-2 border-b border-purple-100">
                        <RotateCcw className="w-5 h-5 text-purple-600 shrink-0" />
                        <span>🔄 Appointment Rescheduled</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-800">
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Date:</span>
                          <span className="font-bold text-slate-900">{msg.appointmentDetails?.date || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Time:</span>
                          <span className="font-bold text-slate-900">{msg.appointmentDetails?.time || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Consultation Type:</span>
                          <span className="font-bold text-slate-900">{msg.appointmentDetails?.mode || 'Online Zoom Consultation'}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                          <span className="font-semibold text-slate-500">Counselor:</span>
                          <span className="font-bold text-purple-700">{msg.appointmentDetails?.counselor || assignedCounselorName}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-purple-800 bg-purple-50 p-2 rounded-xl border border-purple-200 flex items-center space-x-2 font-medium">
                        <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>Your consultation has been rescheduled.</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2.5 border-t border-purple-100 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMeetingForReschedule({
                                ...msg.appointmentDetails,
                                _id: msg.appointmentDetails?.meetingId || msg.appointmentDetails?._id,
                                fullName: activeLead?.fullName || INITIAL_STUDENT.name,
                                phone: activeLead?.phone || INITIAL_STUDENT.phone,
                                email: activeLead?.email || 'student@immigration.com',
                                meetingType: msg.appointmentDetails?.mode
                              });
                              setIsRescheduleOpen(true);
                            }}
                            className="py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center justify-center space-x-1 shadow-xs active:scale-98"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Reschedule</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMeetingToCancel(msg.appointmentDetails);
                              setShowCancelModal(true);
                            }}
                            className="py-2 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-all flex items-center justify-center space-x-1 shadow-xs active:scale-98"
                          >
                            <X className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Cancel</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleChipClick({ action: 'talk_counselor', label: '👨‍💼 Talk to Counselor' })}
                          className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-all flex items-center justify-center space-x-1.5 shadow-xs active:scale-98"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>Talk to Counselor</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-end text-[10px] text-[#667781] pt-0.5">
                        <span>{msg.time}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.isAppointmentConfirmed) {
                return (
                  <div key={msg.id} className="flex justify-center my-3 w-full px-2">
                    <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-[#25D366] shadow-md p-4 space-y-3">
                      <div className="flex items-center space-x-2 text-[#008069] font-black text-sm pb-2 border-b border-emerald-100">
                        <CheckCircle2 className="w-5 h-5 text-[#25D366] shrink-0" />
                        <span>✅ Appointment Confirmed</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-800">
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Consultation Type:</span>
                          <span className="font-bold text-slate-900">{msg.appointmentDetails?.mode || 'Online Consultation'}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Date:</span>
                          <span className="font-bold text-slate-900">{msg.appointmentDetails?.date || 'Confirmed'}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Time:</span>
                          <span className="font-bold text-slate-900">{msg.appointmentDetails?.time || 'Confirmed'}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                          <span className="font-semibold text-slate-500">Counselor:</span>
                          <span className="font-bold text-[#008069]">{msg.appointmentDetails?.counselor || assignedCounselorName || 'Senior Immigration Counselor'}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100 flex items-center space-x-2 font-medium">
                        <Calendar className="w-4 h-4 text-[#008069] shrink-0" />
                        <span>✅ Your consultation has been confirmed.</span>
                      </div>

                      {/* Action Buttons: Reschedule, Cancel, Talk to Counselor */}
                      <div className="pt-2.5 border-t border-emerald-100 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMeetingForReschedule({
                                ...msg.appointmentDetails,
                                _id: msg.appointmentDetails?.meetingId || msg.appointmentDetails?._id,
                                fullName: activeLead?.fullName || INITIAL_STUDENT.name,
                                phone: activeLead?.phone || INITIAL_STUDENT.phone,
                                email: activeLead?.email || 'student@immigration.com',
                                meetingType: msg.appointmentDetails?.mode
                              });
                              setIsRescheduleOpen(true);
                            }}
                            className="py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center justify-center space-x-1 shadow-xs active:scale-98"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Reschedule</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMeetingToCancel(msg.appointmentDetails);
                              setShowCancelModal(true);
                            }}
                            className="py-2 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-all flex items-center justify-center space-x-1 shadow-xs active:scale-98"
                          >
                            <X className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Cancel</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleChipClick({ action: 'talk_counselor', label: '👨‍💼 Talk to Counselor' })}
                          className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-all flex items-center justify-center space-x-1.5 shadow-xs active:scale-98"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>Talk to Counselor</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-end text-[10px] text-[#667781] pt-0.5">
                        <span>{msg.time}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="bg-[#FFFDE7] border border-amber-300 text-amber-900 text-[11px] font-medium px-3.5 py-1.5 rounded-full shadow-xs text-center max-w-md">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-end space-x-2 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar beside left-aligned messages */}
                {!isUser && (
                  <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center shadow-xs shrink-0 mb-1 ${
                    isAdmin ? 'bg-[#0F3B73]' : isCounselor ? 'bg-purple-600' : 'bg-[#00A884]'
                  }`}>
                    {isAdmin ? <ShieldCheck className="w-4 h-4 text-[#25D366]" /> : isCounselor ? <UserCheck className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`max-w-[90%] sm:max-w-[75%] p-3.5 text-[13px] relative ${
                    isUser
                      ? 'whatsapp-bubble-user'
                      : msg.isFollowUp
                        ? 'bg-amber-50/95 border-2 border-amber-300 text-slate-900 rounded-2xl rounded-bl-xs shadow-md'
                        : isAdmin
                          ? 'bg-blue-50/95 border border-blue-200 text-slate-900 rounded-2xl rounded-bl-xs shadow-xs'
                          : isCounselor
                            ? 'bg-purple-50/95 border border-purple-200 text-slate-900 rounded-2xl rounded-bl-xs shadow-xs'
                            : 'whatsapp-bubble-ai'
                  }`}
                >
                  {/* Follow-up Header (Requirement 4) */}
                  {msg.isFollowUp ? (
                    <div className="flex items-center space-x-1.5 font-black text-xs text-amber-900 mb-2 pb-1.5 border-b border-amber-200">
                      <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>🔔 Follow-up from Immigration Team</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ml-auto bg-amber-200/80 text-amber-900 border border-amber-300">
                        Priority
                      </span>
                    </div>
                  ) : (isAdmin || isCounselor) && (
                    <div className="flex items-center space-x-1.5 font-bold text-xs text-blue-900 mb-1.5 pb-1 border-b border-blue-200/60">
                      {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                      <span>Admin / Counselor:</span>
                      {msg.metadata?.counselorName && (
                        <span className="text-[11px] font-semibold text-slate-600">
                          ({msg.metadata.counselorName})
                        </span>
                      )}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-wider ml-auto ${
                        isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {isAdmin ? 'Staff Verified' : 'Counselor'}
                      </span>
                    </div>
                  )}

                  {/* Rich Card Header */}
                  {msg.isCard && (
                    <div className="flex items-center space-x-1.5 font-bold text-xs text-[#008069] mb-1.5 pb-1 border-b border-slate-100">
                      <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>{msg.title || 'Immigration AI Evaluation'}</span>
                    </div>
                  )}

                  {/* Voice Note Player */}
                  {msg.isVoice ? (
                    <div className="flex items-center space-x-3 py-1 pr-3 min-w-[230px]">
                      <button
                        onClick={() => setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)}
                        className="w-10 h-10 rounded-full bg-[#00A884] text-white flex items-center justify-center shadow-xs hover:scale-105 transition-transform shrink-0"
                      >
                        {playingVoiceId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      {/* Moving Waveform */}
                      <div className="flex-1 flex items-center space-x-1 h-6">
                        {[40, 75, 30, 95, 60, 100, 45, 85, 50, 90, 35, 80, 65, 40].map((h, idx) => (
                          <span
                            key={idx}
                            style={{ height: `${h}%` }}
                            className={`w-1 rounded-full transition-all ${
                              playingVoiceId === msg.id ? 'bg-[#008069] voice-wave-active' : 'bg-slate-400'
                            }`}
                          />
                        ))}
                      </div>

                      <span className="text-[11px] font-mono text-slate-600 shrink-0">{msg.voiceDuration}</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line leading-relaxed text-[#111111]">{msg.text}</div>
                  )}

                  {/* Follow-up Quick Action Button */}
                  {msg.isFollowUp && (
                    <div className="mt-3 pt-2 border-t border-amber-200/80 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingOpen(true)}
                        className="py-1.5 px-3 bg-[#008069] hover:bg-[#006A57] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Reschedule Consultation</span>
                      </button>
                    </div>
                  )}

                  {/* Interactive In-Chat Meeting Booking Card */}
                  {msg.isMeetingCard && (
                    <div className="mt-3 p-3 bg-blue-50/80 rounded-xl border border-blue-200 space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>Select a 1-on-1 Consultation Slot:</span>
                      </div>

                      {collisionError && (
                        <div className="p-2 bg-red-100 text-red-700 text-xs rounded-lg flex items-center space-x-1 font-medium">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{collisionError}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.meetingSlots?.map((slot, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleBookSlot(slot)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              selectedMeetingSlot === slot
                                ? 'bg-[#25D366] text-white shadow-md'
                                : 'bg-white text-blue-800 border border-blue-300 hover:bg-blue-100'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rich AI Action Chips / Buttons */}
                  {msg.actionChips && msg.actionChips.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                      {msg.actionChips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleChipClick(chip)}
                          className="ai-action-pill text-xs bg-[#E7FCE3] hover:bg-[#D3F9CD] text-[#008069] font-bold px-3 py-1.5 rounded-full border border-emerald-300/80 shadow-xs flex items-center space-x-1"
                        >
                          <span>{chip.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp & Double Read Ticks */}
                  <div className="flex items-center justify-end space-x-1 mt-1.5 text-[10px] text-[#667781] select-none">
                    <span>{msg.time}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5 whatsapp-read-tick" />}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* AI Typing Animation */}
          {isAiTyping && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end space-x-2"
            >
              <div className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center shadow-xs shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="whatsapp-bubble-ai px-4 py-2.5 text-xs flex items-center space-x-2 shadow-xs">
                <span className="text-slate-600 font-medium">Immigration AI is typing</span>
                <span className="inline-flex space-x-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#008069] typing-dot-1"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#008069] typing-dot-2"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#008069] typing-dot-3"></span>
                </span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. FIXED MESSAGE COMPOSER DOCK (Anchored at Bottom, Glass Floating)        */}
      {/* ========================================================================= */}
      <footer className="p-2 sm:p-4 bg-transparent shrink-0 z-30">
        <div className="max-w-3xl mx-auto relative">
          <div className="whatsapp-composer-dock rounded-2xl p-1.5 sm:p-2.5 flex items-center space-x-1.5 sm:space-x-2 relative">
            {/* Emoji Button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 sm:p-2 text-[#54656F] hover:text-[#111111] hover:bg-slate-100 rounded-full transition-colors"
                title="Emojis"
              >
                <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Emoji Popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-14 left-0 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 sm:p-3 flex space-x-2 sm:space-x-2.5 text-lg sm:text-xl z-50">
                  {['🎓', '💼', '🏢', '✈️', '🇬🇧', '🇦🇺', '🇨🇦', '📄', '✅', '🙏'].map((emo) => (
                    <button
                      key={emo}
                      onClick={() => {
                        setInputText((prev) => prev + emo);
                        setShowEmojiPicker(false);
                      }}
                      className="hover:scale-130 transition-transform"
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Attachment Button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="p-1.5 sm:p-2 text-[#54656F] hover:text-[#111111] hover:bg-slate-100 rounded-full transition-colors"
                title="Attach Document"
              >
                <Paperclip className="w-5 h-5 rotate-45" />
              </button>

              {showAttachMenu && (
                <div className="absolute bottom-14 left-0 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 z-50 text-xs font-medium">
                  <button
                    onClick={() => {
                      setShowAttachMenu(false);
                      handleSendMessage('Attached Academic Transcript (PDF)');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F0F2F5] flex items-center space-x-2 text-slate-800"
                  >
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Document (PDF)</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAttachMenu(false);
                      handleSendMessage('Attached Passport Bio Page (Photo)');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F0F2F5] flex items-center space-x-2 text-slate-800"
                  >
                    <Camera className="w-4 h-4 text-pink-600" />
                    <span>Camera / Photo</span>
                  </button>
                </div>
              )}
            </div>

            {/* Camera Quick Button */}
            <button
              onClick={() => triggerNotice('Opening document scanner camera...')}
              className="p-1.5 sm:p-2 text-[#54656F] hover:text-[#111111] hover:bg-slate-100 rounded-full transition-colors hidden sm:inline-block shrink-0"
              title="Camera"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Text Input / Voice Recording */}
            {isRecordingVoice ? (
              <div className="flex-1 min-w-0 bg-white rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between text-xs text-red-600 font-bold shadow-inner">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0"></span>
                  <span className="truncate">Recording Voice Note...</span>
                </div>
                <span className="font-mono text-slate-700 shrink-0 ml-2">0:{recordTimer < 10 ? '0' : ''}{recordTimer}</span>
              </div>
            ) : (
              <input
                type="text"
                placeholder={chatMode === 'HUMAN' ? 'Chatting with counselor...' : 'Type a message...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                className="flex-1 min-w-0 bg-white rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-[#111111] placeholder:text-[#54656F] focus:outline-none border border-slate-200 focus:border-[#00A884] shadow-xs"
              />
            )}

            {/* Send or Voice Record Button */}
            {inputText.trim() ? (
              <button
                onClick={() => handleSendMessage()}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#25D366] hover:bg-[#00A884] text-white flex items-center justify-center transition-all shadow-md hover:scale-105 shrink-0"
                title="Send"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (isRecordingVoice) {
                    handleSendMessage(null, true);
                  } else {
                    setIsRecordingVoice(true);
                  }
                }}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:scale-105 shrink-0 ${
                  isRecordingVoice ? 'bg-red-600 text-white animate-pulse' : 'bg-[#25D366] text-white hover:bg-[#00A884]'
                }`}
                title={isRecordingVoice ? 'Send Voice Note' : 'Record Voice Note'}
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 4. CALL SIMULATOR MODAL (Voice & Video)                                    */}
      {/* ========================================================================= */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#111B21] text-white rounded-3xl w-full max-w-sm p-7 text-center shadow-2xl border border-slate-700"
          >
            <div className="relative inline-block mx-auto mb-4">
              <img
                src={INITIAL_STUDENT.avatar}
                alt={INITIAL_STUDENT.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#25D366] animate-pulse"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#25D366] rounded-full border-2 border-[#111B21]"></span>
            </div>

            <h3 className="text-xl font-bold">{INITIAL_STUDENT.name}</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">{INITIAL_STUDENT.phone}</p>
            <p className="text-xs text-[#25D366] mt-3 font-semibold">
              WhatsApp {showCallModal === 'video' ? 'Video' : 'Voice'} Call • {Math.floor(callDuration / 60)}:
              {callDuration % 60 < 10 ? '0' : ''}
              {callDuration % 60}
            </p>

            <div className="flex items-center justify-center space-x-6 mt-8">
              <button
                onClick={() => triggerNotice('Microphone toggled')}
                className="p-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowCallModal(null)}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors shadow-lg"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={() => triggerNotice('Speaker volume adjusted')}
                className="p-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CANCELLATION CONFIRMATION MODAL                                        */}
      {/* ========================================================================= */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Cancel Consultation?</h3>
            <p className="text-xs text-slate-600 mt-2">
              Are you sure you want to cancel your scheduled appointment on{' '}
              <strong className="text-slate-900">{meetingToCancel?.date}</strong> at{' '}
              <strong className="text-slate-900">{meetingToCancel?.time}</strong>?
            </p>
            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setMeetingToCancel(null);
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                disabled={cancellingLoading}
                onClick={async () => {
                  setCancellingLoading(true);
                  try {
                    await meetingAPI.cancelMeeting({
                      meetingId: meetingToCancel?.meetingId || meetingToCancel?._id,
                      sessionId: sessionId || activeLead?.sessionId,
                      reason: 'Customer requested cancellation from chat'
                    });
                    setShowCancelModal(false);
                    setMeetingToCancel(null);
                    triggerNotice('Consultation cancelled ❌');
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `cancel_conf_${Date.now()}`,
                        sender: 'system',
                        rawSender: 'SYSTEM',
                        isCard: false,
                        text: 'Your consultation has been cancelled.',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                  } catch (err) {
                    console.error('Failed to cancel meeting:', err);
                    triggerNotice('Failed to cancel meeting. Please try again.');
                  } finally {
                    setCancellingLoading(false);
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md active:scale-98 disabled:opacity-50"
              >
                {cancellingLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CONSULTATION BOOKING & RESCHEDULE MODAL                                 */}
      {/* ========================================================================= */}
      <BookingModal
        isOpen={bookingOpen || isRescheduleOpen}
        isReschedule={isRescheduleOpen}
        currentAppointment={selectedMeetingForReschedule}
        onClose={() => {
          setBookingOpen(false);
          setIsRescheduleOpen(false);
          setSelectedMeetingForReschedule(null);
        }}
        sessionId={sessionId}
        leadInfo={{
          fullName: activeLead?.fullName || INITIAL_STUDENT.name,
          phone: activeLead?.phone || INITIAL_STUDENT.phone,
          email: activeLead?.email || 'student@immigration.com',
          countryInterest: activeLead?.countryInterest || INITIAL_STUDENT.country,
          leadId: activeLead?._id,
          sessionId: sessionId
        }}
        onBookingConfirmed={(bookingData, wasRescheduled) => {
          const isResched = wasRescheduled || isRescheduleOpen || bookingData?.status === 'RESCHEDULED';
          const isPending = (bookingData?.status === 'PENDING' || !bookingData?.status) && !isResched;
          
          if (isResched) {
            triggerNotice(`Appointment Rescheduled for ${bookingData.date} at ${bookingData.time}! 🔄`);
          } else if (isPending) {
            triggerNotice(`Appointment Request Submitted! Status: Pending Confirmation 📅`);
          } else {
            triggerNotice(`Appointment Confirmed for ${bookingData.date} at ${bookingData.time}! 📅`);
          }

          const counselorLabel = bookingData.counselorName || assignedCounselorName || 'Senior Immigration Counselor';
          const modeLabel = bookingData.consultationType === 'IN_PERSON' || bookingData.appointmentType === 'IN_PERSON'
            ? 'In-Person Consultation'
            : 'Online Consultation';
          
          setMessages((prev) => [
            ...prev,
            {
              id: `book_conf_${Date.now()}`,
              sender: 'system',
              rawSender: 'SYSTEM',
              isCard: true,
              isAppointmentRequested: isPending,
              isAppointmentConfirmed: !isPending && !isResched,
              isAppointmentRescheduled: isResched,
              appointmentDetails: {
                meetingId: bookingData._id || bookingData.id,
                date: bookingData.date,
                time: bookingData.time,
                mode: modeLabel,
                counselor: counselorLabel,
                status: bookingData.status || (isResched ? 'RESCHEDULED' : (isPending ? 'PENDING' : 'CONFIRMED'))
              },
              text: isResched 
                ? 'Your consultation has been successfully rescheduled.' 
                : (isPending 
                    ? '📅 Appointment Request Submitted\n\nStatus:\nPending Confirmation' 
                    : 'Your consultation has been successfully booked.'),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }}
      />
    </motion.div>
  );
}
