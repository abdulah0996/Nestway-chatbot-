import React from 'react';
import { motion } from 'framer-motion';
import ChatWindow from '../../components/chatbot/ChatWindow';
import { ShieldCheck, GraduationCap, Globe, Clock, Award, CheckCircle2, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import { Link } from 'react-router-dom';

export default function PublicChatbotPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071A33] via-[#0B254B] to-[#0F3B73] text-white flex flex-col antialiased selection:bg-[#3B82F6] selection:text-white relative overflow-x-hidden">
      <Navbar />

      {/* Background Floating Ambient Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#2563EB]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-80 right-10 w-96 h-96 bg-[#F59E0B]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-[#3B82F6]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="pt-10 pb-8 px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#25D366]/20 backdrop-blur-md border border-[#25D366]/40 text-[#25D366] text-xs font-black shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
            <span>WHATSAPP BUSINESS + INTERCOM + CHATGPT SALES AUTOMATION</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight text-white"
          >
            AI WhatsApp Automation Platform{' '}
            <span className="block bg-gradient-to-r from-[#25D366] via-emerald-300 to-[#3B82F6] bg-clip-text text-transparent">
              for Immigration Consultancy
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Receive WhatsApp leads, auto-qualify students with ChatGPT intelligence, schedule counselor consultations, and convert chats into enrolled clients.
          </motion.p>

          <div className="pt-2">
            <Link
              to="/crm"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:brightness-110 text-[#071A33] font-black text-xs shadow-xl shadow-[#25D366]/30 btn-whatsapp-glow transition-all hover:scale-105"
            >
              <span>Launch Counselor WhatsApp Inbox</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Floating Glass Hero Cards */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
          >
            <div className="glass-card px-4 py-2 rounded-2xl flex items-center space-x-2 animate-float shadow-xl">
              <span className="text-xl">🇬🇧</span>
              <div className="text-left text-xs">
                <div className="font-extrabold text-white">United Kingdom</div>
                <div className="text-[10px] text-emerald-400 font-bold">99% Visa Grant Rate</div>
              </div>
            </div>

            <div className="glass-card px-4 py-2 rounded-2xl flex items-center space-x-2 animate-float-delayed shadow-xl">
              <span className="text-xl">🇦🇺</span>
              <div className="text-left text-xs">
                <div className="font-extrabold text-white">Australia</div>
                <div className="text-[10px] text-blue-300 font-bold">Post-Study Work Permit</div>
              </div>
            </div>

            <div className="glass-card px-4 py-2 rounded-2xl flex items-center space-x-2 animate-float shadow-xl">
              <span className="text-xl">🇩🇪</span>
              <div className="text-left text-xs">
                <div className="font-extrabold text-white">Germany</div>
                <div className="text-[10px] text-[#F59E0B] font-bold">Zero Tuition Options</div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Main Fixed Chatbot Section (No Whole-Page Downward Displacement) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pb-16 relative z-10 flex flex-col justify-center">
        <ChatWindow />
      </main>

      {/* Footer */}
      <footer className="bg-[#071A33]/90 border-t border-white/10 text-slate-400 py-6 text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-white font-extrabold">
            <GraduationCap className="w-5 h-5 text-[#F59E0B]" />
            <span>AI Immigration Assistant & Student CRM Platform</span>
          </div>
          <div className="flex items-center space-x-6 font-semibold">
            <Link to="/crm" className="hover:text-white transition-colors">Counselor Portal</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
          <p className="text-[11px] text-slate-500">
            © 2026 AI Immigration SaaS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
