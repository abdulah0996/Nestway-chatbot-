import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  Sparkles,
  Bot,
  User,
  GraduationCap,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronLeft,
  X,
  Plus,
  Flame,
  Star,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Volume2,
  Play,
  Pause,
  CornerUpLeft,
  Copy,
  Trash2,
  Share2,
  Image as ImageIcon,
  Camera,
  File,
  PhoneCall,
  PhoneOff,
  Sliders,
  Check
} from 'lucide-react';
import { chatbotAPI, leadAPI, meetingAPI } from '../../services/api';

// Rich WhatsApp Initial Conversations
const INITIAL_CONVERSATIONS = [
  {
    id: 'c1',
    studentId: 'lead_1',
    name: 'Ali Khan',
    phone: '+92 300 1234567',
    country: 'United Kingdom',
    flag: '🇬🇧',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Interested in UK September intake for MSc Data Science',
    timestamp: '10:32 AM',
    unreadCount: 3,
    online: true,
    leadPriority: 'HOT',
    leadScore: 87,
    stage: 'Hot Leads',
    education: 'BS Computer Science (HEC Recognized)',
    cgpa: '3.42 / 4.0',
    ielts: 'Band 6.5 (R:7.0, W:6.0, L:6.5, S:6.5)',
    targetIntake: 'September 2026',
    budget: '£15,000 - £18,000 / year',
    assignedCounselor: 'Ahmed Khan',
    aiStatus: {
      qualification: 'Completed',
      autoReply: true,
      followUp: 'Tomorrow 10:00 AM',
      meeting: 'Booked'
    },
    notes: [
      { id: 'n1', author: 'Ahmed Khan', text: 'Strong profile for Russell Group. Sent Hertfordshire and Aston links.', time: 'Today 10:15 AM' },
      { id: 'n2', author: 'AI Assistant', text: 'Auto-evaluated GPA & IELTS. High probability of £3,000 scholarship.', time: 'Today 10:05 AM' }
    ],
    documents: [
      { name: 'Transcript_BSCS_HEC.pdf', size: '1.8 MB', date: 'Yesterday' },
      { name: 'IELTS_Academic_TRF.pdf', size: '920 KB', date: 'Yesterday' },
      { name: 'Passport_Copy_AliKhan.pdf', size: '2.4 MB', date: '2 days ago' }
    ],
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Hello, I want to apply for Masters in the UK for September 2026.',
        time: '10:15 AM',
        status: 'read'
      },
      {
        id: 'm2',
        sender: 'ai',
        text: 'Welcome to AI Immigration Assistant! 🇬🇧 I can evaluate your eligibility for top UK universities. Could you share your recent degree, CGPA, and IELTS score?',
        time: '10:16 AM'
      },
      {
        id: 'm3',
        sender: 'user',
        text: 'I completed BS Computer Science with 3.42 CGPA, and I scored 6.5 in IELTS.',
        time: '10:18 AM',
        status: 'read'
      },
      {
        id: 'm4',
        sender: 'ai',
        text: 'Based on your profile, you have high chances (87%) for Russell Group & top modern universities like University of Hertfordshire and Aston University with potential £3,000 scholarship!',
        time: '10:19 AM',
        quickReplies: ['University Options', 'Book Consultation', 'Scholarship Details', 'Talk to Counselor']
      },
      {
        id: 'm5',
        sender: 'user',
        text: 'Interested in UK September intake for MSc Data Science',
        time: '10:32 AM',
        status: 'read'
      }
    ]
  },
  {
    id: 'c2',
    studentId: 'lead_2',
    name: 'Hamza Tariq',
    phone: '+92 321 9876543',
    country: 'Australia',
    flag: '🇦🇺',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Does Deakin University accept MOI English waiver?',
    timestamp: '11:14 AM',
    unreadCount: 1,
    online: true,
    leadPriority: 'HOT',
    leadScore: 92,
    stage: 'Hot Leads',
    education: 'BBA Finance & Accounting',
    cgpa: '3.65 / 4.0',
    ielts: 'PTE Academic 68 (Equivalent to 7.0)',
    targetIntake: 'July 2026',
    budget: 'A$28,000 / year',
    assignedCounselor: 'Sara Malik',
    aiStatus: {
      qualification: 'Completed',
      autoReply: true,
      followUp: 'Today 5:00 PM',
      meeting: 'Booked'
    },
    notes: [
      { id: 'n1', author: 'Sara Malik', text: 'Verified PTE score 68. GTE assessment passed.', time: 'Today 9:30 AM' }
    ],
    documents: [
      { name: 'BBA_Degree_Cert.pdf', size: '2.1 MB', date: '3 days ago' },
      { name: 'PTE_Official_Score.pdf', size: '640 KB', date: '3 days ago' }
    ],
    messages: [
      {
        id: 'm201',
        sender: 'user',
        text: 'Hi, I want to study in Melbourne or Sydney for Master of Finance.',
        time: '11:00 AM',
        status: 'read'
      },
      {
        id: 'm202',
        sender: 'ai',
        text: 'Great choice! 🇦🇺 Australia offers 3-4 years post-study work rights. Deakin, Monash, and RMIT have excellent finance faculties. Do you have PTE or IELTS?',
        time: '11:02 AM'
      },
      {
        id: 'm203',
        sender: 'user',
        isVoice: true,
        voiceDuration: '0:22',
        time: '11:08 AM',
        status: 'read'
      },
      {
        id: 'm204',
        sender: 'user',
        text: 'Does Deakin University accept MOI English waiver?',
        time: '11:14 AM',
        status: 'read'
      }
    ]
  },
  {
    id: 'c3',
    studentId: 'lead_3',
    name: 'Sara Ahmed',
    phone: '+92 333 5551234',
    country: 'Canada',
    flag: '🇨🇦',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Uploaded my bank statement for PAL verification',
    timestamp: 'Yesterday',
    unreadCount: 0,
    online: false,
    leadPriority: 'QUALIFIED',
    leadScore: 78,
    stage: 'Leads',
    education: 'BS Biotechnology',
    cgpa: '3.18 / 4.0',
    ielts: 'IELTS Band 7.0',
    targetIntake: 'September 2026',
    budget: 'CAD $22,000 / year',
    assignedCounselor: 'Ahmed Khan',
    aiStatus: {
      qualification: 'Completed',
      autoReply: false,
      followUp: 'Friday 3:00 PM',
      meeting: 'Pending'
    },
    notes: [
      { id: 'n1', author: 'Ahmed Khan', text: 'Waiting for Ontario PAL cap clarification.', time: 'Yesterday' }
    ],
    documents: [
      { name: 'Bank_Statement_6Months.pdf', size: '3.5 MB', date: 'Yesterday' },
      { name: 'IELTS_Band7.pdf', size: '750 KB', date: 'May 10' }
    ],
    messages: [
      {
        id: 'm301',
        sender: 'user',
        text: 'What are the current Provincial Attestation Letter requirements for Canada?',
        time: '4:20 PM',
        status: 'read'
      },
      {
        id: 'm302',
        sender: 'ai',
        text: 'Under 2026 IRCC guidelines, all study permit applicants require a PAL issued by the province before submitting visa files. Most universities issue this alongside the official LOA.',
        time: '4:22 PM'
      },
      {
        id: 'm303',
        sender: 'user',
        text: 'Uploaded my bank statement for PAL verification',
        time: '5:45 PM',
        status: 'read'
      }
    ]
  },
  {
    id: 'c4',
    studentId: 'lead_4',
    name: 'Zainab Malik',
    phone: '+92 345 8889999',
    country: 'Germany',
    flag: '🇩🇪',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'My APS certificate has been dispatched from Islamabad',
    timestamp: 'Yesterday',
    unreadCount: 0,
    online: true,
    leadPriority: 'HOT',
    leadScore: 95,
    stage: 'Hot Leads',
    education: 'BSc Mechanical Engineering',
    cgpa: '3.80 / 4.0',
    ielts: 'IELTS 7.5 + Goethe A2 German',
    targetIntake: 'Winter 2026',
    budget: '€11,208 (Blocked Account)',
    assignedCounselor: 'Usman Ali',
    aiStatus: {
      qualification: 'Completed',
      autoReply: true,
      followUp: 'Tomorrow 2:00 PM',
      meeting: 'Booked'
    },
    notes: [
      { id: 'n1', author: 'Usman Ali', text: 'Exceptional GPA (3.8). Applied to TU Munich & RWTH Aachen.', time: 'Yesterday' }
    ],
    documents: [
      { name: 'APS_Verification_Slip.pdf', size: '1.2 MB', date: 'Yesterday' },
      { name: 'German_A2_Cert.pdf', size: '890 KB', date: '4 days ago' }
    ],
    messages: [
      {
        id: 'm401',
        sender: 'user',
        text: 'Hello! I need assistance with Public Universities in Germany for Winter Semester.',
        time: '1:10 PM',
        status: 'read'
      },
      {
        id: 'm402',
        sender: 'ai',
        text: 'Guten Tag Zainab! 🇩🇪 With a 3.8 CGPA in Mechanical Engineering, tuition is 100% free at public universities. Have you initiated the APS certificate verification?',
        time: '1:12 PM'
      },
      {
        id: 'm403',
        sender: 'user',
        text: 'My APS certificate has been dispatched from Islamabad',
        time: '2:30 PM',
        status: 'read'
      }
    ]
  },
  {
    id: 'c5',
    studentId: 'lead_5',
    name: 'Bilal Hassan',
    phone: '+92 301 7776655',
    country: 'Italy',
    flag: '🇮🇹',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Applying for DSU regional scholarship at Sapienza',
    timestamp: 'Sep 06',
    unreadCount: 0,
    online: false,
    leadPriority: 'QUALIFIED',
    leadScore: 82,
    stage: 'Assigned',
    education: 'BS Electrical Engineering',
    cgpa: '3.25 / 4.0',
    ielts: 'IELTS Band 6.5',
    targetIntake: 'Fall 2026',
    budget: '€3,000 / year (Seeking DSU Grant)',
    assignedCounselor: 'Ahmed Khan',
    aiStatus: {
      qualification: 'Completed',
      autoReply: true,
      followUp: 'Next Week',
      meeting: 'Pending'
    },
    notes: [
      { id: 'n1', author: 'Ahmed Khan', text: 'DSU scholarship documents translated to Italian with apostille.', time: 'Sep 06' }
    ],
    documents: [
      { name: 'Income_Certificate_ISEE.pdf', size: '2.8 MB', date: 'Sep 06' }
    ],
    messages: [
      {
        id: 'm501',
        sender: 'user',
        text: 'Is Sapienza Rome open for non-EU pre-enrollment on Universitaly?',
        time: '10:00 AM',
        status: 'read'
      },
      {
        id: 'm502',
        sender: 'ai',
        text: 'Yes! Universitaly portal is accepting pre-enrollments for Sapienza. If your family income is under €25,000, you are eligible for the 100% tuition waiver + €7,000 DSU annual grant.',
        time: '10:02 AM'
      },
      {
        id: 'm503',
        sender: 'user',
        text: 'Applying for DSU regional scholarship at Sapienza',
        time: '11:15 AM',
        status: 'read'
      }
    ]
  }
];

export default function WhatsAppInboxView({ onOpenCrm, onOpenMeetings, onOpenDocs }) {
  // State
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeChatId, setActiveChatId] = useState('c1');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // All, Unread, Leads, Hot Leads, Assigned
  const [messageInput, setMessageInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLeftMenu, setShowLeftMenu] = useState(false);
  const [showCallModal, setShowCallModal] = useState(null); // 'voice' | 'video' | null
  const [callDuration, setCallDuration] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [actionNotice, setActionNotice] = useState(null);

  // Mobile navigation state: 'list' | 'chat' | 'info'
  const [mobileScreen, setMobileScreen] = useState('chat');

  // DOM Refs
  const messagesEndRef = useRef(null);
  const chatStreamRef = useRef(null);

  // Selected Active Conversation
  const activeChat = conversations.find((c) => c.id === activeChatId) || conversations[0];

  // Auto-scroll inside chat area only
  const scrollToBottom = (behavior = 'smooth') => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTo({
        top: chatStreamRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeChatId]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [activeChat?.messages?.length, isAiTyping]);

  // Voice Call Timer Simulation
  useEffect(() => {
    let interval;
    if (showCallModal) {
      interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [showCallModal]);

  // Voice Note Recording Timer Simulation
  useEffect(() => {
    let interval;
    if (isRecordingVoice) {
      interval = setInterval(() => setRecordTimer((t) => t + 1), 1000);
    } else {
      setRecordTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  // Temporary Action Toasts
  const triggerNotice = (text) => {
    setActionNotice(text);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Switch Active Conversation
  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setReplyingTo(null);
    setShowAttachMenu(false);
    setShowEmojiPicker(false);
    setMobileScreen('chat');

    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Send Message Handler
  const handleSendMessage = (customText = null, isVoice = false) => {
    const textToSend = (customText !== null ? customText : messageInput).trim();
    if (!textToSend && !isVoice) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `m_${Date.now()}`;

    const newMsg = isVoice
      ? {
          id: userMsgId,
          sender: 'user',
          isVoice: true,
          voiceDuration: `0:${recordTimer < 10 ? '0' : ''}${recordTimer || 12}`,
          time: timeStr,
          status: 'read',
          replyTo: replyingTo ? replyingTo.text : null
        }
      : {
          id: userMsgId,
          sender: 'user',
          text: textToSend,
          time: timeStr,
          status: 'read',
          replyTo: replyingTo ? replyingTo.text : null
        };

    // Update conversation and bring it to top of list!
    setConversations((prev) => {
      const target = prev.find((c) => c.id === activeChatId);
      if (!target) return prev;
      const updatedTarget = {
        ...target,
        lastMessage: isVoice ? '🎤 Voice message' : textToSend,
        timestamp: 'Just now',
        messages: [...target.messages, newMsg]
      };
      return [updatedTarget, ...prev.filter((c) => c.id !== activeChatId)];
    });

    setMessageInput('');
    setReplyingTo(null);
    setIsRecordingVoice(false);

    // Trigger Smart AI Response
    setIsAiTyping(true);
    setTimeout(() => {
      generateAiResponse(textToSend || 'voice note', activeChat);
      setIsAiTyping(false);
    }, 1200);
  };

  // Generate Automated AI Intelligence Response
  const generateAiResponse = (userInput, chat) => {
    const lower = userInput.toLowerCase();
    let replyText = `Thanks for sharing! For ${chat.country}, your profile qualifies for priority visa processing. Our counselor ${chat.assignedCounselor} is reviewing your documents.`;
    let quickReplies = ['University Options', 'Book Consultation', 'Scholarship Details', 'Talk to Counselor'];

    if (lower.includes('university') || lower.includes('options')) {
      replyText = `Top recommendations for ${chat.country} in your subject:\n1. University of Manchester / Hertfordshire\n2. Aston University (up to £3,500 Merit Grant)\n3. Birmingham City University\nWould you like to initiate an application?`;
      quickReplies = ['Start Application', 'Scholarship Criteria', 'Book Zoom Meeting'];
    } else if (lower.includes('meeting') || lower.includes('consultation') || lower.includes('book')) {
      replyText = `📅 Let's get your visa strategy aligned! Counselor ${chat.assignedCounselor} has available 1-on-1 consultation slots:`;
      quickReplies = ['Tomorrow 10:00 AM', 'Tomorrow 2:30 PM', 'Friday 4:00 PM'];
    } else if (lower.includes('scholarship')) {
      replyText = `Based on your CGPA of ${chat.cgpa}, you are eligible for the Global Academic Excellence Award (£3,000 - £5,000 waiver).`;
      quickReplies = ['Required Documents', 'Apply for Scholarship', 'Book Consultation'];
    } else if (lower.includes('ielts') || lower.includes('pte')) {
      replyText = `Your English test (${chat.ielts}) meets direct unconditional entry standards. No pre-sessional English course is required!`;
    }

    const aiMsgId = `ai_${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setConversations((prev) => {
      const target = prev.find((c) => c.id === chat.id);
      if (!target) return prev;
      const updated = {
        ...target,
        lastMessage: replyText.substring(0, 55) + '...',
        timestamp: 'Just now',
        messages: [
          ...target.messages,
          {
            id: aiMsgId,
            sender: 'ai',
            text: replyText,
            time: timeStr,
            quickReplies
          }
        ]
      };
      return [updated, ...prev.filter((c) => c.id !== chat.id)];
    });
  };

  // Add Emoji Reaction to a Message
  const handleReactMessage = (msgId, emoji) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        return {
          ...c,
          messages: c.messages.map((m) =>
            m.id === msgId ? { ...m, reaction: m.reaction === emoji ? null : emoji } : m
          )
        };
      })
    );
  };

  // Add Counselor Note
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const noteObj = {
      id: `note_${Date.now()}`,
      author: 'Ahmed Khan (Counselor)',
      text: newNoteText.trim(),
      time: 'Just now'
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, notes: [noteObj, ...(c.notes || [])] } : c))
    );
    setNewNoteText('');
    triggerNotice('Internal note saved to student dossier');
  };

  // Toggle AI Auto Reply
  const handleToggleAutoReply = () => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, aiStatus: { ...c.aiStatus, autoReply: !c.aiStatus.autoReply } }
          : c
      )
    );
    triggerNotice(
      `AI Auto-Reply ${!activeChat.aiStatus?.autoReply ? 'Enabled 🟢' : 'Paused ⏸️'}`
    );
  };

  // Filtered Conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'Unread') return c.unreadCount > 0;
    if (activeFilter === 'Hot Leads') return c.leadPriority === 'HOT';
    if (activeFilter === 'Leads') return c.stage === 'Leads' || c.leadPriority === 'HOT';
    if (activeFilter === 'Assigned') return !!c.assignedCounselor;
    return true;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#EFEAE2] select-none text-[#111111] antialiased">
      {/* ========================================================================= */}
      {/* 1. LEFT PANEL: WHATSAPP CHAT LIST (30% WIDTH)                              */}
      {/* ========================================================================= */}
      <div
        className={`${
          mobileScreen === 'list' ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-[30%] min-w-[320px] max-w-[420px] bg-white border-r border-[#D1D7DB] h-full z-20 shrink-0`}
      >
        {/* Top Header */}
        <div className="h-[60px] bg-[#F0F2F5] px-4 flex items-center justify-between border-b border-[#E9EDEF] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Counselor Profile"
                className="w-10 h-10 rounded-full object-cover border border-slate-300"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-sm text-[#111111]">Immigration AI</span>
                <span className="bg-[#25D366] text-white p-0.5 rounded-full">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              </div>
              <div className="flex items-center space-x-1 text-[11px] text-[#008069] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#008069] animate-pulse"></span>
                <span>WhatsApp Business Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-[#54656F]">
            <button
              onClick={() => triggerNotice('WhatsApp Status: AI qualification engine listening')}
              className="p-2 hover:bg-[#E9EDEF] rounded-full transition-colors"
              title="Status"
            >
              <Sparkles className="w-5 h-5 text-[#008069]" />
            </button>
            <button
              onClick={() => triggerNotice('Starting new student chat stream...')}
              className="p-2 hover:bg-[#E9EDEF] rounded-full transition-colors"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowLeftMenu(!showLeftMenu)}
                className="p-2 hover:bg-[#E9EDEF] rounded-full transition-colors"
                title="Menu"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Left Header Dropdown */}
              {showLeftMenu && (
                <div className="absolute right-0 top-11 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 text-xs">
                  <button
                    onClick={() => {
                      setShowLeftMenu(false);
                      if (onOpenCrm) onOpenCrm();
                      else triggerNotice('Opening CRM Pipeline');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F0F2F5] text-slate-800 flex items-center space-x-2"
                  >
                    <Sliders className="w-4 h-4 text-[#008069]" />
                    <span>Open CRM Kanban</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowLeftMenu(false);
                      if (onOpenMeetings) onOpenMeetings();
                      else triggerNotice('Opening Consultations Calendar');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F0F2F5] text-slate-800 flex items-center space-x-2"
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Meetings & Consultations</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowLeftMenu(false);
                      if (onOpenDocs) onOpenDocs();
                      else triggerNotice('Opening Student Document Vault');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F0F2F5] text-slate-800 flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Document Vault</span>
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      setShowLeftMenu(false);
                      triggerNotice('AI WhatsApp Web v3.0 - Online');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#F0F2F5] text-slate-500 text-[11px]"
                  >
                    About WhatsApp AI Suite
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 bg-white border-b border-[#E9EDEF]">
          <div className="relative flex items-center bg-[#F0F2F5] rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#00A884]">
            <Search className="w-4 h-4 text-[#54656F] mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#111111] placeholder:text-[#54656F] focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#54656F] hover:text-[#111111]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 mt-2 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
            {['All', 'Unread', 'Leads', 'Hot Leads', 'Assigned'].map((tab) => {
              const isActive = activeFilter === tab;
              const unreadTotal = conversations.reduce((acc, curr) => acc + curr.unreadCount, 0);
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap flex items-center space-x-1 ${
                    isActive
                      ? 'bg-[#E7FCE3] text-[#008069] font-bold'
                      : 'bg-[#F0F2F5] text-[#54656F] hover:bg-[#E9EDEF]'
                  }`}
                >
                  {tab === 'Hot Leads' && <Flame className="w-3 h-3 text-red-500 fill-red-500 inline" />}
                  <span>{tab}</span>
                  {tab === 'Unread' && unreadTotal > 0 && (
                    <span className="ml-1 bg-[#25D366] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {unreadTotal}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation List Stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No conversations found for "{searchQuery}"
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeChatId;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectChat(conv.id)}
                  className={`px-4 py-3 cursor-pointer flex items-center space-x-3 transition-colors select-none relative ${
                    isSelected ? 'bg-[#F0F2F5]' : 'hover:bg-[#F5F6F6] bg-white'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="font-semibold text-sm text-[#111111] truncate">{conv.name}</span>
                        <span className="text-sm">{conv.flag}</span>
                        {conv.leadPriority === 'HOT' && (
                          <span className="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded">
                            HOT
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] shrink-0 ${conv.unreadCount > 0 ? 'text-[#25D366] font-bold' : 'text-[#667781]'}`}>
                        {conv.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-[#667781] truncate pr-2">
                        {conv.messages[conv.messages.length - 1]?.sender === 'user' && (
                          <CheckCheck className="w-3.5 h-3.5 inline text-[#53BDEB] mr-1" />
                        )}
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 bg-[#25D366] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center badge-pulse">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER PANEL: MAIN CHAT CONVERSATION (45% WIDTH / FLEX-1)               */}
      {/* ========================================================================= */}
      <div
        className={`${
          mobileScreen === 'chat' ? 'flex' : 'hidden'
        } md:flex flex-col flex-1 h-full relative overflow-hidden bg-[#EFEAE2] border-r border-[#D1D7DB]`}
      >
        {/* Header */}
        <div className="h-[60px] bg-[#F0F2F5] px-4 flex items-center justify-between border-b border-[#D1D7DB] shrink-0 z-20">
          <div className="flex items-center space-x-3">
            {/* Mobile Back Button */}
            <button
              onClick={() => setMobileScreen('list')}
              className="md:hidden p-1 hover:bg-[#E9EDEF] rounded-full text-[#54656F]"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Student Info Trigger */}
            <div
              onClick={() => setShowRightPanel(!showRightPanel)}
              className="flex items-center space-x-3 cursor-pointer hover:opacity-90"
            >
              <div className="relative">
                <img
                  src={activeChat.avatar}
                  alt={activeChat.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                {activeChat.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-sm text-[#111111]">{activeChat.name}</span>
                  <span className="text-sm">{activeChat.flag}</span>
                </div>
                <div className="text-[11px] text-[#667781] flex items-center space-x-1">
                  <span>{activeChat.online ? 'online on WhatsApp' : 'offline'}</span>
                  <span>•</span>
                  <span className="text-[#008069] font-medium">AI Assistant Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-2 text-[#54656F]">
            <button
              onClick={() => setShowCallModal('voice')}
              className="p-2 hover:bg-[#E9EDEF] rounded-full transition-colors"
              title="Voice Call"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCallModal('video')}
              className="p-2 hover:bg-[#E9EDEF] rounded-full transition-colors"
              title="Video Call"
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              onClick={() => triggerNotice('Searching messages in conversation...')}
              className="p-2 hover:bg-[#E9EDEF] rounded-full transition-colors"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setShowRightPanel(!showRightPanel);
                if (window.innerWidth < 768) setMobileScreen('info');
              }}
              className="p-2 hover:bg-[#E9EDEF] rounded-full transition-colors"
              title="Contact Info"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Business Quick Action Strip */}
        <div className="bg-[#FFFFFF]/90 backdrop-blur-md px-4 py-2 border-b border-[#E9EDEF] flex items-center space-x-2 overflow-x-auto text-xs shrink-0 z-10 shadow-sm scrollbar-none">
          <span className="text-[11px] font-bold uppercase text-[#54656F] shrink-0 mr-1">CRM Actions:</span>
          <button
            onClick={() => triggerNotice(`Lead ${activeChat.name} converted to Registered Client! 🎓`)}
            className="px-3 py-1 rounded-full bg-emerald-50 text-[#008069] hover:bg-emerald-100 border border-emerald-200 font-semibold flex items-center space-x-1 shrink-0 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#008069]" />
            <span>Convert Lead</span>
          </button>
          <button
            onClick={() => triggerNotice(`Consultation scheduled for ${activeChat.name} via Zoom 📅`)}
            className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold flex items-center space-x-1 shrink-0 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Book Meeting</span>
          </button>
          <button
            onClick={() => triggerNotice(`Assigned to Senior Counselor ${activeChat.assignedCounselor}`)}
            className="px-3 py-1 rounded-full bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 font-semibold flex items-center space-x-1 shrink-0 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Assign Agent</span>
          </button>
          <button
            onClick={() => triggerNotice(`Immigration Case File created for ${activeChat.country}`)}
            className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-semibold flex items-center space-x-1 shrink-0 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Create Case</span>
          </button>
          <button
            onClick={() => {
              setShowRightPanel(true);
              triggerNotice('Add internal notes in the right panel');
            }}
            className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-semibold flex items-center space-x-1 shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-purple-600" />
            <span>Add Note</span>
          </button>
        </div>

        {/* Temporary Notice Banner */}
        {actionNotice && (
          <div className="bg-[#008069] text-white text-xs px-4 py-1.5 text-center font-medium shadow-md transition-all">
            {actionNotice}
          </div>
        )}

        {/* Message Stream: Fixed Height, Internal Scroll, Never spills or scrolls outer page */}
        <div
          ref={chatStreamRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5 whatsapp-chat-bg relative"
        >
          {/* Day Separator */}
          <div className="flex justify-center my-2">
            <span className="bg-[#FFFFFF]/90 text-[#54656F] text-[11px] font-semibold px-3 py-1 rounded-md shadow-sm border border-slate-200">
              TODAY
            </span>
          </div>

          {/* AI Active Notice */}
          <div className="flex justify-center my-2">
            <div className="bg-[#FFF9C4]/90 border border-amber-300 text-amber-900 text-xs px-3.5 py-1.5 rounded-lg shadow-sm flex items-center space-x-2 max-w-md text-center">
              <Bot className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>AI Sales Automation Active:</strong> Inquiries are auto-evaluated against university admission & scholarship criteria.
              </span>
            </div>
          </div>

          {/* Messages */}
          {activeChat.messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isAi = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                className={`flex flex-col group relative ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Quoted Message Preview inside bubble if present */}
                <div
                  className={`max-w-[85%] sm:max-w-[70%] p-2.5 text-[13px] relative shadow-sm ${
                    isUser ? 'whatsapp-bubble-user' : 'whatsapp-bubble-ai'
                  }`}
                >
                  {/* In-Reply-To Banner */}
                  {msg.replyTo && (
                    <div className="mb-2 p-1.5 rounded bg-black/5 border-l-4 border-[#008069] text-[11px] text-slate-700 italic">
                      <span className="font-bold text-[#008069] block not-italic">Replied:</span>
                      {msg.replyTo}
                    </div>
                  )}

                  {/* Message Content */}
                  {msg.isVoice ? (
                    /* Voice Note WhatsApp Player */
                    <div className="flex items-center space-x-3 py-1 pr-4 min-w-[220px]">
                      <button
                        onClick={() => setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)}
                        className="w-9 h-9 rounded-full bg-[#00A884] text-white flex items-center justify-center shadow-sm hover:scale-105 transition-transform shrink-0"
                      >
                        {playingVoiceId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      {/* Moving Waveform Bars */}
                      <div className="flex-1 flex items-center space-x-1 h-6">
                        {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 35, 75, 60, 40].map((h, idx) => (
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

                  {/* Interactive Quick Action Chips (for AI messages) */}
                  {msg.quickReplies && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.quickReplies.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(chip)}
                          className="text-[11px] bg-[#E7FCE3] hover:bg-[#D4F8CD] text-[#008069] font-semibold px-2.5 py-1 rounded-full border border-emerald-200 transition-colors shadow-xs"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp & Double Read Ticks */}
                  <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-[#667781] select-none">
                    <span>{msg.time}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5 whatsapp-read-tick" />}
                  </div>

                  {/* Reaction Pill on message */}
                  {msg.reaction && (
                    <span className="absolute -bottom-2.5 right-2 whatsapp-reaction-pill px-1.5 py-0.5 text-xs">
                      {msg.reaction}
                    </span>
                  )}
                </div>

                {/* Hover Action Bar: Emoji Reactions & Context Menu */}
                {hoveredMessageId === msg.id && (
                  <div
                    className={`absolute -top-7 ${
                      isUser ? 'right-0' : 'left-0'
                    } flex items-center space-x-1 bg-white border border-slate-200 px-2 py-1 rounded-full shadow-lg z-30`}
                  >
                    {['👍', '❤️', '😂', '😮', '🙏'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReactMessage(msg.id, emoji)}
                        className="hover:scale-125 transition-transform text-xs px-0.5"
                      >
                        {emoji}
                      </button>
                    ))}
                    <div className="w-px h-3 bg-slate-200 mx-1"></div>
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="text-[#54656F] hover:text-[#111111] p-0.5"
                      title="Reply"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(msg.text || '');
                        triggerNotice('Message copied to clipboard');
                      }}
                      className="text-[#54656F] hover:text-[#111111] p-0.5"
                      title="Copy"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Typing Indicator */}
          {isAiTyping && (
            <div className="flex items-center space-x-2">
              <div className="whatsapp-bubble-ai px-3.5 py-2 text-xs flex items-center space-x-1.5 shadow-sm">
                <Bot className="w-3.5 h-3.5 text-[#008069]" />
                <span className="text-slate-600 font-medium">AI is typing</span>
                <span className="inline-flex space-x-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#008069] typing-dot-1"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#008069] typing-dot-2"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#008069] typing-dot-3"></span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Replying Banner */}
        {replyingTo && (
          <div className="bg-[#F0F2F5] px-4 py-2 border-t border-[#D1D7DB] flex items-center justify-between text-xs text-slate-700">
            <div className="border-l-4 border-[#008069] pl-2 truncate">
              <span className="font-bold text-[#008069] block">
                Replying to {replyingTo.sender === 'user' ? activeChat.name : 'AI Assistant'}:
              </span>
              <span className="text-slate-600 truncate">{replyingTo.text || 'Voice note'}</span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="text-[#54656F] hover:text-[#111111] p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Fixed Message Input Dock: Strictly anchored at bottom, never moves */}
        <div className="bg-[#F0F2F5] px-4 py-2.5 border-t border-[#D1D7DB] flex items-center space-x-2 shrink-0 z-20">
          {/* Emoji Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-[#54656F] hover:text-[#111111] hover:bg-[#E9EDEF] rounded-full transition-colors"
            >
              <Smile className="w-6 h-6" />
            </button>

            {/* Quick Emoji Popover */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 flex space-x-2 text-lg z-50">
                {['😊', '🎓', '🇬🇧', '🇦🇺', '✈️', '📄', '✅', '🙏', '🔥', '💼'].map((emo) => (
                  <button
                    key={emo}
                    onClick={() => {
                      setMessageInput((prev) => prev + emo);
                      setShowEmojiPicker(false);
                    }}
                    className="hover:scale-125 transition-transform"
                  >
                    {emo}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Attachment Paperclip */}
          <div className="relative">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2 text-[#54656F] hover:text-[#111111] hover:bg-[#E9EDEF] rounded-full transition-colors"
            >
              <Paperclip className="w-5 h-5 rotate-45" />
            </button>

            {/* Attachment Popover */}
            {showAttachMenu && (
              <div className="absolute bottom-12 left-0 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs">
                <button
                  onClick={() => {
                    setShowAttachMenu(false);
                    handleSendMessage('Uploaded Academic Transcript (PDF)');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#F0F2F5] flex items-center space-x-2.5 text-slate-800"
                >
                  <File className="w-4 h-4 text-purple-600" />
                  <span>Document (PDF)</span>
                </button>
                <button
                  onClick={() => {
                    setShowAttachMenu(false);
                    handleSendMessage('Shared Passport Bio Page (Image)');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#F0F2F5] flex items-center space-x-2.5 text-slate-800"
                >
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Photos & Videos</span>
                </button>
                <button
                  onClick={() => {
                    setShowAttachMenu(false);
                    triggerNotice('Opening camera scanner...');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#F0F2F5] flex items-center space-x-2.5 text-slate-800"
                >
                  <Camera className="w-4 h-4 text-pink-600" />
                  <span>Camera</span>
                </button>
              </div>
            )}
          </div>

          {/* Text Input or Voice Recording Indicator */}
          {isRecordingVoice ? (
            <div className="flex-1 bg-white rounded-lg px-4 py-2 flex items-center justify-between text-xs text-red-600 font-semibold shadow-inner">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                <span>Recording WhatsApp Voice Note...</span>
              </div>
              <span className="font-mono text-slate-700">0:{recordTimer < 10 ? '0' : ''}{recordTimer}</span>
            </div>
          ) : (
            <input
              type="text"
              placeholder="Type a message"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              className="flex-1 bg-white rounded-lg px-4 py-2 text-sm text-[#111111] placeholder:text-[#54656F] focus:outline-none shadow-xs"
            />
          )}

          {/* Voice Record Mic Button or Send Button */}
          {messageInput.trim() ? (
            <button
              onClick={() => handleSendMessage()}
              className="w-10 h-10 rounded-full bg-[#00A884] hover:bg-[#008069] text-white flex items-center justify-center transition-colors shadow-md"
              title="Send"
            >
              <Send className="w-4 h-4" />
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
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md ${
                isRecordingVoice ? 'bg-red-600 text-white animate-pulse' : 'bg-[#00A884] text-white hover:bg-[#008069]'
              }`}
              title={isRecordingVoice ? 'Send Voice Note' : 'Record Voice Note'}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT PANEL: AI CRM & CONTACT DOSSIER (25% WIDTH)                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '25%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`${
              mobileScreen === 'info' ? 'flex' : 'hidden md:flex'
            } flex-col w-full md:w-[25%] min-w-[320px] max-w-[380px] bg-white border-l border-[#D1D7DB] h-full overflow-y-auto shrink-0 z-30`}
          >
            {/* Header */}
            <div className="h-[60px] bg-[#F0F2F5] px-4 flex items-center justify-between border-b border-[#D1D7DB] shrink-0 sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowRightPanel(false);
                    setMobileScreen('chat');
                  }}
                  className="p-1 hover:bg-[#E9EDEF] rounded-full text-[#54656F]"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="font-semibold text-sm text-[#111111]">Student Dossier</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {activeChat.stage}
              </span>
            </div>

            {/* Profile Overview Card */}
            <div className="p-5 text-center border-b border-slate-200 bg-white">
              <div className="relative inline-block mx-auto mb-3">
                <img
                  src={activeChat.avatar}
                  alt={activeChat.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                />
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#25D366] border-2 border-white rounded-full"></span>
              </div>
              <h2 className="text-base font-bold text-[#111111] flex items-center justify-center space-x-1">
                <span>{activeChat.name}</span>
                <span>{activeChat.flag}</span>
              </h2>
              <p className="text-xs text-[#54656F] font-mono mt-0.5">{activeChat.phone}</p>
              <div className="mt-2 inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>Target: {activeChat.country}</span>
              </div>

              {/* Quick Contact Buttons */}
              <div className="flex items-center justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowCallModal('voice')}
                  className="p-2.5 rounded-full bg-[#F0F2F5] hover:bg-[#E9EDEF] text-[#008069] transition-colors"
                  title="Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowCallModal('video')}
                  className="p-2.5 rounded-full bg-[#F0F2F5] hover:bg-[#E9EDEF] text-[#008069] transition-colors"
                  title="Video"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  onClick={() => triggerNotice('Sharing student profile via WhatsApp')}
                  className="p-2.5 rounded-full bg-[#F0F2F5] hover:bg-[#E9EDEF] text-[#54656F] transition-colors"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Immigration Assessment Dossier */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-[#54656F] tracking-wider">Immigration Details</span>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {activeChat.leadScore}% Score
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Education</span>
                  <span className="font-semibold text-slate-800 text-right">{activeChat.education}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">CGPA</span>
                  <span className="font-semibold text-slate-800">{activeChat.cgpa}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">English Test</span>
                  <span className="font-semibold text-slate-800">{activeChat.ielts}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Budget</span>
                  <span className="font-semibold text-slate-800">{activeChat.budget}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Intake</span>
                  <span className="font-semibold text-slate-800">{activeChat.targetIntake}</span>
                </div>
              </div>
            </div>

            {/* AI Sales Automation Status */}
            <div className="p-4 border-b border-slate-200 bg-[#F8FAFC]">
              <span className="text-xs font-bold uppercase text-[#54656F] tracking-wider block mb-3">
                AI Automation Controls
              </span>

              <div className="space-y-2 text-xs">
                {/* Auto-reply Toggle */}
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div>
                    <span className="font-bold text-slate-800 block">AI Auto-Reply</span>
                    <span className="text-[10px] text-slate-500">Handles qualification & FAQs</span>
                  </div>
                  <button
                    onClick={handleToggleAutoReply}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      activeChat.aiStatus?.autoReply ? 'bg-[#25D366]' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        activeChat.aiStatus?.autoReply ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-medium">Next Follow-up</span>
                  <span className="font-bold text-slate-800">{activeChat.aiStatus?.followUp}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-medium">Counselor Consultation</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {activeChat.aiStatus?.meeting}
                  </span>
                </div>
              </div>
            </div>

            {/* Internal Counselor Notes */}
            <div className="p-4 border-b border-slate-200">
              <span className="text-xs font-bold uppercase text-[#54656F] tracking-wider block mb-3">
                Internal Counselor Notes
              </span>

              <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
                {activeChat.notes?.map((note) => (
                  <div key={note.id} className="p-2 bg-[#F0F2F5] rounded text-xs">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                      <span className="font-bold text-slate-700">{note.author}</span>
                      <span>{note.time}</span>
                    </div>
                    <p className="text-slate-800">{note.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Input */}
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  placeholder="Add note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNote();
                  }}
                  className="flex-1 bg-[#F0F2F5] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#00A884]"
                />
                <button
                  onClick={handleAddNote}
                  className="px-3 py-1.5 bg-[#008069] text-white rounded text-xs font-semibold hover:bg-[#006A57]"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Shared Student Documents */}
            <div className="p-4">
              <span className="text-xs font-bold uppercase text-[#54656F] tracking-wider block mb-3">
                Shared Documents ({activeChat.documents?.length || 0})
              </span>
              <div className="space-y-2">
                {activeChat.documents?.map((doc, idx) => (
                  <div
                    key={idx}
                    onClick={() => triggerNotice(`Downloading ${doc.name}...`)}
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-[#008069] bg-white flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <FileText className="w-5 h-5 text-red-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-medium text-slate-800 truncate block">{doc.name}</span>
                        <span className="text-[10px] text-slate-400">{doc.size} • {doc.date}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. MODALS: REAL-TIME CALL SIMULATOR (Voice & Video)                        */}
      {/* ========================================================================= */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#111B21] text-white rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl border border-slate-700"
          >
            <div className="relative inline-block mx-auto mb-4">
              <img
                src={activeChat.avatar}
                alt={activeChat.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#00A884] animate-pulse"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#25D366] rounded-full border-2 border-[#111B21]"></span>
            </div>

            <h3 className="text-lg font-bold">{activeChat.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{activeChat.phone}</p>
            <p className="text-xs text-[#25D366] mt-2 font-medium">
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
    </div>
  );
}
