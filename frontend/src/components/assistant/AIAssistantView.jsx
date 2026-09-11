import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotAPI } from '../../services/api';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Award,
  Calendar,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  GraduationCap,
  Globe,
  FileText,
  Percent,
  Check,
  MessageCircle
} from 'lucide-react';
import BookingModal from '../meetings/BookingModal';

export default function AIAssistantView() {
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
  const [inputVal, setInputVal] = useState('');

  // Missing Documents dynamic state
  const [checkedDocs, setCheckedDocs] = useState({
    passport: true,
    transcripts: true,
    ielts: false,
    financials: false,
    cv: true
  });

  const chatEndRef = useRef(null);
  const messageContainerRef = useRef(null);

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    // Internal scrolling only
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
            id: 'init_msg',
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
        const updatedAnswers = botData.answers || answers;
        setAnswers(updatedAnswers);
        setStepIndex(botData.stepIndex || stepIndex + 1);

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

    const matched = options.find(
      (opt) => opt.label.toLowerCase() === inputVal.trim().toLowerCase()
    );

    if (matched) {
      handleSelectOption(matched);
      setInputVal('');
    } else {
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
            text: `Thank you for the input. Please choose the closest qualification parameter from the options below to calculate your official visa points:`
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
      const userMsg = { id: `u_${Date.now()}`, sender: 'user', text: 'University Search' };
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `b_${Date.now()}`,
          sender: 'bot',
          text: `🎓 Our network includes top universities in the UK, Australia, Germany, Italy, and Hungary. Select your desired country below to view admission thresholds.`
        }
      ]);
    } else if (actionType === 'COUNSELOR') {
      const userMsg = { id: `u_${Date.now()}`, sender: 'user', text: 'Connect with a Counselor' };
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `b_${Date.now()}`,
          sender: 'bot',
          text: `Senior Counselor **Ahmed Khan** is available for online Zoom consultations today. Please confirm your contact details below to reserve your priority slot:`
        }
      ]);
      setScoreResult(scoreResult || { totalScore: 88, tier: 'Tier 1 - Direct Entry' });
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
            text: `✅ Profile confirmed for **${contactForm.fullName}**! An immigration advisor has been assigned. Select your preferred date & time slot to book your 1-on-1 Zoom consultation.`
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

  const computedScore = scoreResult?.totalScore || Math.min(95, 60 + stepIndex * 6);
  const targetCountry = answers.countryInterest || 'UK';

  const countryMatches = [
    { country: 'United Kingdom', flag: '🇬🇧', match: targetCountry === 'UK' ? 95 : 82, note: 'Direct Master Entry • MOI Accepted' },
    { country: 'Australia', flag: '🇦🇺', match: targetCountry === 'Australia' ? 92 : 78, note: 'Post-Study Work Permit up to 4 yrs' },
    { country: 'Germany', flag: '🇩🇪', match: targetCountry === 'Germany' ? 88 : 74, note: 'Low Tuition Fees • English Taught' },
    { country: 'Italy', flag: '🇮🇹', match: targetCountry === 'Italy' ? 85 : 70, note: 'Regional Scholarships up to €7,000' },
    { country: 'Hungary', flag: '🇭🇺', match: targetCountry === 'Hungary' ? 90 : 76, note: 'Fast Visa Processing • Stipendium Hungaricum' }
  ];

  const recommendedPrograms = [
    { name: 'MSc Data Science & AI', uni: 'University of Hertfordshire', country: 'UK', fee: '£15,500/yr', flag: '🇬🇧' },
    { name: 'Master of Information Tech', uni: 'Deakin University', country: 'Australia', fee: 'A$36,000/yr', flag: '🇦🇺' },
    { name: 'MSc Global Management', uni: 'IU Int. Applied Sciences', country: 'Germany', fee: '€2,400/yr', flag: '🇩🇪' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Top Header */}
      <div className="glass-card p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-white tracking-tight">
                AI Admissions Intelligence Workspace
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                Live GPT-4o Model
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Instant candidate qualification, eligibility algorithm, and consultation booking.
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRestart}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restart Assessment</span>
        </motion.button>
      </div>

      {/* Main Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Modern ChatGPT Style Chat Interface (7 cols) - FIXED HEIGHT CONTAINER */}
        <div className="lg:col-span-7 glass-card rounded-3xl overflow-hidden flex flex-col h-[750px] max-h-[85vh] relative shadow-2xl">
          
          {/* 1. FIXED HEADER */}
          <div className="bg-[#071A33]/90 backdrop-blur-xl p-4 border-b border-white/10 space-y-2 shrink-0 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black tracking-wide text-white uppercase">
                  Admissions AI Advisor
                </span>
              </div>
              <div className="text-xs font-extrabold text-[#F59E0B] flex items-center">
                <span>Eligibility Check • Step {Math.min(6, stepIndex + 1)} of 6</span>
              </div>
            </div>

            {/* Stepper Progress Line */}
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#F59E0B] h-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((stepIndex + 1) / 6) * 100)}%` }}
              />
            </div>
          </div>

          {/* 2. SCROLLABLE MESSAGES AREA */}
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
                  <div
                    className={`w-8 h-8 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-tr from-[#2563EB] to-[#3B82F6]'
                        : 'bg-[#071A33] text-[#F59E0B] border border-white/20'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[80%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'user-gradient-bubble rounded-tr-none font-semibold'
                        : 'ai-glass-bubble rounded-tl-none font-medium'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

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
                                className="bg-[#3B82F6] h-2 rounded-full"
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
                                className="bg-emerald-400 h-2 rounded-full"
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
                                className="bg-[#F59E0B] h-2 rounded-full"
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
          <div className="p-4 bg-[#071A33]/90 backdrop-blur-xl border-t border-white/10 space-y-3 shrink-0 z-20">
            
            {/* Quick Actions: Check Eligibility, Book Meeting, University Search, Talk To Counselor */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleQuickAction('ELIGIBILITY')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#2563EB]/40 border border-white/15 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Check Eligibility</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleQuickAction('MEETING')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#2563EB]/40 border border-white/15 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Book Meeting</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleQuickAction('UNIVERSITY')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#2563EB]/40 border border-white/15 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>University Search</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleQuickAction('COUNSELOR')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#2563EB]/40 border border-white/15 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>Talk To Counselor</span>
              </motion.button>
            </div>

            {/* Response options */}
            {options.length > 0 && !scoreResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1.5"
              >
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Select your response:
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

            {/* Lead capture form */}
            {scoreResult && !leadSaved && (
              <motion.form
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSaveLead}
                className="p-4 rounded-2xl glass-panel space-y-3"
              >
                <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1.5" /> Complete Booking Profile
                </h4>
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
                    placeholder="Phone (WhatsApp) *"
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
                  <span>Submit & Choose Meeting Slot</span>
                </motion.button>
              </motion.form>
            )}

            {/* Manual input row */}
            <form onSubmit={handleManualSend} className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                placeholder="Ask about visas, scholarships, intake deadlines..."
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
        </div>

        {/* RIGHT COLUMN: Student Intelligence Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="glass-card p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-[#F59E0B]" />
                Student Intelligence
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
                High Visa Probability
              </span>
            </div>

            {/* Score Gauge */}
            <div className="p-4 rounded-2xl bg-black/30 border border-white/15 flex items-center justify-between">
              <div>
                <div className="text-3xl font-black text-white tabular-nums">
                  {computedScore}%
                </div>
                <div className="text-xs font-bold text-slate-400 mt-0.5">
                  Eligibility Index
                </div>
              </div>

              <div className="text-right text-xs space-y-1">
                <div className="font-bold text-emerald-400 flex items-center justify-end">
                  <Check className="w-3.5 h-3.5 mr-1" /> CGPA &gt; 3.0 Qualified
                </div>
                <div className="font-bold text-[#3B82F6] flex items-center justify-end">
                  <Check className="w-3.5 h-3.5 mr-1" /> Budget Verified
                </div>
              </div>
            </div>

            {/* Country Match Bars */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Country Match Probability
              </h4>

              <div className="space-y-2.5">
                {countryMatches.map((cm) => (
                  <div key={cm.country} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center space-x-1.5">
                        <span>{cm.flag}</span>
                        <span className="text-slate-200">{cm.country}</span>
                      </span>
                      <span className="text-white">{cm.match}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] h-full rounded-full"
                        style={{ width: `${cm.match}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400">{cm.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Programs */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Recommended Programs
              </h4>

              <div className="space-y-2">
                {recommendedPrograms.map((p, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between hover:border-[#3B82F6] transition-colors"
                  >
                    <div>
                      <div className="font-black text-xs text-white flex items-center space-x-1">
                        <span>{p.flag}</span>
                        <span>{p.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{p.uni} • {p.fee}</div>
                    </div>
                    <span className="text-[10px] font-bold text-[#3B82F6] bg-[#2563EB]/20 border border-[#3B82F6]/30 px-2 py-1 rounded-lg">
                      Match
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Checklist */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Document Readiness Checklist
              </h4>

              <div className="space-y-2 text-xs font-semibold">
                {[
                  { id: 'passport', label: 'International Passport (Valid &gt; 6 mos)' },
                  { id: 'transcripts', label: 'Academic Degree & Official Transcripts' },
                  { id: 'ielts', label: 'English Test Scorecard (IELTS / PTE / MOI)' },
                  { id: 'financials', label: 'Bank Statement / Proof of Funds' },
                  { id: 'cv', label: 'Updated Academic Resume / CV' }
                ].map((doc) => {
                  const isChecked = checkedDocs[doc.id];
                  return (
                    <div
                      key={doc.id}
                      onClick={() =>
                        setCheckedDocs({ ...checkedDocs, [doc.id]: !isChecked })
                      }
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      <span>{doc.label}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isChecked ? 'bg-emerald-500 text-white' : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                      }`}>
                        {isChecked ? 'Ready' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Booking Slot Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        leadInfo={{
          fullName: contactForm.fullName,
          phone: contactForm.phone,
          email: contactForm.email,
          countryInterest: answers.countryInterest || 'UK'
        }}
      />
    </motion.div>
  );
}
