import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotAPI } from '../../services/api';
import {
  Bot,
  User,
  Send,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Award,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Globe,
  Search,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import BookingModal from '../meetings/BookingModal';

export default function ChatWindow({ onOpenBooking, onOpenSearch }) {
  const [messages, setMessages] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [scoreResult, setScoreResult] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Student Lead Contact Form State
  const [contactForm, setContactForm] = useState({ fullName: '', phone: '', email: '' });
  const [leadSaved, setLeadSaved] = useState(false);

  // Manual text input for user
  const [inputVal, setInputVal] = useState('');

  const chatEndRef = useRef(null);
  const messageContainerRef = useRef(null);

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    // Scroll only the internal message container, NOT the whole page
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  const initChat = async () => {
    setLoading(true);
    try {
      const res = await chatbotAPI.sendMessage({ sessionId });
      if (res.success) {
        setMessages([
          {
            id: 'm_init',
            sender: 'bot',
            text: res.data.message
          }
        ]);
        setStepIndex(res.data.stepIndex || 0);
        setOptions(res.data.options || []);
      }
    } catch (err) {
      console.error('Chat init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (option) => {
    const userMsg = { id: `u_${Date.now()}`, sender: 'user', text: option.label };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatbotAPI.sendMessage({
        sessionId,
        stepIndex,
        selectedOption: option.value,
        answers
      });

      if (res.success) {
        const botData = res.data;
        setAnswers(botData.answers || answers);
        setStepIndex(botData.stepIndex);

        if (botData.isComplete) {
          setScoreResult(botData.scoreResult);
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              sender: 'bot',
              text: botData.message,
              isScoreCard: true,
              scoreResult: botData.scoreResult
            }
          ]);
          setOptions([]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              sender: 'bot',
              text: botData.message
            }
          ]);
          setOptions(botData.options || []);
        }
      }
    } catch (err) {
      console.error('Chat step error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    // Check if input matches one of the current options
    const matched = options.find(
      (opt) => opt.label.toLowerCase() === inputVal.trim().toLowerCase()
    );

    if (matched) {
      handleSelectOption(matched);
      setInputVal('');
    } else {
      // Add user message and let bot answer or prompt
      const userMsg = { id: `u_${Date.now()}`, sender: 'user', text: inputVal.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInputVal('');
      setLoading(true);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: `Thank you for sharing. Please select the closest option below to calculate your official visa points:`
          }
        ]);
        setLoading(false);
      }, 700);
    }
  };

  const handleQuickAction = (actionType) => {
    if (actionType === 'ELIGIBILITY') {
      handleRestart();
    } else if (actionType === 'MEETING') {
      setIsBookingOpen(true);
    } else if (actionType === 'UNIVERSITY') {
      const userMsg = { id: `u_${Date.now()}`, sender: 'user', text: 'Search partner universities' };
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `b_${Date.now()}`,
          sender: 'bot',
          text: `🎓 We have 120+ accredited partner universities across the UK (Russell Group), Australia (Go8), Germany, Italy, and Hungary. Select your destination country below to see requirements.`
        }
      ]);
    } else if (actionType === 'COUNSELOR') {
      const userMsg = { id: `u_${Date.now()}`, sender: 'user', text: 'Connect with a Senior Counselor' };
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `b_${Date.now()}`,
          sender: 'bot',
          text: `Senior Counselor **Ahmed Khan** is available today for online Zoom consultations. Complete your contact details below to reserve your 30-min priority slot:`
        }
      ]);
      setScoreResult(scoreResult || { totalScore: 88, tier: 'Tier 1 - High Eligibility' });
    }
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (!contactForm.fullName || !contactForm.phone) return;

    setLoading(true);
    try {
      const res = await chatbotAPI.qualify({
        ...contactForm,
        countryInterest: answers.countryInterest || 'UK',
        qualification: answers.qualification || "Bachelor's",
        cgpa: answers.cgpa || '3.2',
        englishTest: answers.englishTest || 'IELTS',
        intake: answers.intake || 'Fall 2026',
        budget: answers.budget || '$15,000+'
      });

      if (res.success) {
        setLeadSaved(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: `✅ Thank you, **${contactForm.fullName}**! Your profile is verified. Please click below to choose your consultation slot:`
          }
        ]);
        setIsBookingOpen(true);
      }
    } catch (err) {
      console.error('Save lead error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setMessages([]);
    setAnswers({});
    setScoreResult(null);
    setLeadSaved(false);
    setStepIndex(0);
    initChat();
  };

  return (
    /* FIXED CHAT CONTAINER: Strict height, flex column, overflow-hidden */
    <div className="w-full max-w-4xl mx-auto h-[720px] max-h-[85vh] flex flex-col rounded-3xl glass-card overflow-hidden shadow-2xl relative">
      
      {/* 1. FIXED HEADER */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#071A33]/90 via-[#0B254B]/90 to-[#0F3B73]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#071A33] rounded-full animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                AI Admissions Advisor
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 text-[10px] font-black uppercase">
                GPT-4o
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              Verified Immigration Assessment • Fall 2026
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRestart}
            className="flex items-center space-x-1 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/15 transition-all"
            title="Restart Assessment"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">Restart</span>
          </motion.button>
        </div>
      </div>

      {/* 2. SCROLLABLE MESSAGES AREA: Internally scrolls, page stays locked */}
      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-transparent"
        style={{ scrollBehavior: 'smooth' }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={`flex items-start space-x-3 ${
                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-tr from-[#2563EB] to-[#3B82F6]'
                    : 'bg-[#071A33] text-[#F59E0B] border border-white/20'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'user-gradient-bubble rounded-tr-none font-semibold'
                    : 'ai-glass-bubble rounded-tl-none font-medium'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Score Breakdown Card */}
                {msg.isScoreCard && msg.scoreResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="mt-4 p-4 rounded-2xl bg-black/30 border border-[#F59E0B]/40 space-y-3 shadow-xl backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-black uppercase text-[#F59E0B] flex items-center">
                        <Award className="w-4 h-4 mr-1.5" /> Eligibility Verdict
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold border border-emerald-500/30">
                        {msg.scoreResult.tier}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span className="text-slate-300">Academic Score:</span>
                          <span className="text-[#F59E0B]">{msg.scoreResult.academicScore}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-[#3B82F6] h-2 rounded-full transition-all duration-700"
                            style={{ width: `${msg.scoreResult.academicScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span className="text-slate-300">English Proficiency:</span>
                          <span className="text-[#F59E0B]">{msg.scoreResult.englishScore}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-emerald-400 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${msg.scoreResult.englishScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span className="text-slate-300">Budget Match:</span>
                          <span className="text-[#F59E0B]">{msg.scoreResult.budgetScore}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-[#F59E0B] h-2 rounded-full transition-all duration-700"
                            style={{ width: `${msg.scoreResult.budgetScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-bold">Total Visa Points:</span>
                      <span className="text-2xl font-black text-[#F59E0B]">
                        {msg.scoreResult.totalScore}%
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI Typing Indicator: 3 Animated Dots ● ● ● */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3 pl-1"
          >
            <div className="w-8 h-8 rounded-2xl bg-[#071A33] text-[#F59E0B] border border-white/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl ai-glass-bubble flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] typing-dot-1" />
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] typing-dot-2" />
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] typing-dot-3" />
              <span className="text-xs text-slate-300 pl-2 font-medium">Evaluating immigration criteria...</span>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 3. FIXED BOTTOM CONTROLS & INPUT AREA */}
      <div className="p-4 bg-gradient-to-b from-[#071A33]/80 to-[#071A33] backdrop-blur-xl border-t border-white/10 space-y-3 shrink-0 z-20">
        
        {/* Quick Action Pills: Check Eligibility, Book Meeting, University Search, Talk To Counselor */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleQuickAction('ELIGIBILITY')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#2563EB]/40 border border-white/15 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Check Eligibility</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleQuickAction('MEETING')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#2563EB]/40 border border-white/15 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Book Meeting</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleQuickAction('UNIVERSITY')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#2563EB]/40 border border-white/15 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>University Search</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleQuickAction('COUNSELOR')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#2563EB]/40 border border-white/15 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
            <span>Talk To Counselor</span>
          </motion.button>
        </div>

        {/* Dynamic Qualification Option Buttons */}
        {options.length > 0 && !scoreResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5"
          >
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Choose your answer:
            </p>
            <div className="flex flex-wrap gap-2">
              {options.map((opt, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectOption(opt)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-white/10 to-white/15 hover:from-[#2563EB] hover:to-[#3B82F6] text-white text-xs font-bold border border-white/20 shadow-md transition-all flex items-center space-x-2"
                >
                  <span>{opt.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Lead Capture Form after assessment */}
        {scoreResult && !leadSaved && (
          <motion.form
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSaveLead}
            className="p-4 rounded-2xl glass-card space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1.5" /> Book Consultation with Assigned Advisor
              </h4>
              <span className="text-[10px] text-[#F59E0B] font-bold">1-on-1 Zoom Session</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Full Name *"
                required
                value={contactForm.fullName}
                onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })}
                className="px-3 py-2 rounded-xl text-xs glass-input focus:outline-none"
              />
              <input
                type="tel"
                placeholder="WhatsApp Number *"
                required
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                className="px-3 py-2 rounded-xl text-xs glass-input focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="px-3 py-2 rounded-xl text-xs glass-input focus:outline-none"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2 transition-all btn-glow"
            >
              <Calendar className="w-4 h-4 text-[#F59E0B]" />
              <span>Confirm Details & Select Date/Time Slot</span>
            </motion.button>
          </motion.form>
        )}

        {/* Text Input Row */}
        <form onSubmit={handleManualSend} className="flex items-center space-x-2 pt-1">
          <input
            type="text"
            placeholder="Type your question or message to the AI Advisor..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl glass-input text-xs font-medium focus:outline-none placeholder-slate-400"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!inputVal.trim() || loading}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white disabled:opacity-40 shadow-lg shadow-blue-500/30 btn-glow"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>

      </div>

      {/* Booking Slot Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        leadInfo={{
          fullName: contactForm.fullName || 'Student Applicant',
          phone: contactForm.phone || '',
          email: contactForm.email || '',
          countryInterest: answers.countryInterest || 'UK'
        }}
      />

    </div>
  );
}
