import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  CalendarDays,
  GraduationCap,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Award,
  Globe,
  Clock,
  ChevronRight,
  ArrowRight,
  Plus,
  Flame
} from 'lucide-react';
import AnimatedCounter from '../common/AnimatedCounter';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05
    }
  }
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function OverviewView({
  stats = {},
  leads = [],
  meetings = [],
  onNavigate,
  onNewLeadClick,
  userName = 'Ahmed'
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Metrics requested by user specification
  const totalLeadsCount = stats.totalLeads || 5000;
  const hotLeadsCount = 350;
  const applicationsCount = stats.totalApplications || 120;
  const visaSuccessRate = 85;

  const kpis = [
    {
      id: 'total_leads',
      title: 'Total Leads',
      value: totalLeadsCount,
      prefix: '',
      suffix: '',
      change: '+14.8%',
      subtext: 'vs previous month',
      icon: Users,
      iconBg: 'bg-blue-500/20 text-[#3B82F6]',
      sparkline: [20, 28, 35, 45, 52, 60, 78]
    },
    {
      id: 'hot_leads',
      title: 'Hot Leads',
      value: hotLeadsCount,
      prefix: '',
      suffix: '',
      change: '+22.4%',
      subtext: 'high intent students',
      icon: Flame,
      iconBg: 'bg-amber-500/20 text-[#F59E0B]',
      sparkline: [12, 18, 22, 29, 34, 40, 52]
    },
    {
      id: 'applications',
      title: 'Applications',
      value: applicationsCount,
      prefix: '',
      suffix: '',
      change: '+18.4%',
      subtext: 'active in unis',
      icon: GraduationCap,
      iconBg: 'bg-indigo-500/20 text-indigo-400',
      sparkline: [15, 20, 24, 28, 32, 38, 42]
    },
    {
      id: 'visa_success',
      title: 'Visa Success',
      value: visaSuccessRate,
      prefix: '',
      suffix: '%',
      change: '+3.2%',
      subtext: 'embassy approval rate',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      sparkline: [75, 78, 80, 82, 83, 84, 85]
    }
  ];

  const funnelStages = [
    { stage: 'Inquiries & Visits', count: 5000, percent: 100, color: 'bg-slate-400' },
    { stage: 'AI Qualified Leads', count: 2850, percent: 57, color: 'bg-[#2563EB]' },
    { stage: 'Counseling Booked', count: 1200, percent: 24, color: 'bg-[#3B82F6]' },
    { stage: 'University Applied', count: 520, percent: 10.4, color: 'bg-indigo-500' },
    { stage: 'Offer Received', count: 350, percent: 7, color: 'bg-purple-500' },
    { stage: 'Visa Approved', count: 298, percent: 6, color: 'bg-emerald-500' }
  ];

  const countryMarkets = [
    { country: 'United Kingdom', code: 'UK', flag: '🇬🇧', leads: 48, fee: '£14,500/yr', visaSpeed: '3 Weeks', success: '99%' },
    { country: 'Australia', code: 'AU', flag: '🇦🇺', leads: 32, fee: 'A$26,000/yr', visaSpeed: '4 Weeks', success: '97%' },
    { country: 'Germany', code: 'DE', flag: '🇩🇪', leads: 26, fee: '€0 - €3,000/yr', visaSpeed: '6 Weeks', success: '96%' },
    { country: 'Italy', code: 'IT', flag: '🇮🇹', leads: 18, fee: '€1,000/yr', visaSpeed: '5 Weeks', success: '95%' },
    { country: 'Hungary', code: 'HU', flag: '🇭🇺', leads: 14, fee: '€4,000/yr', visaSpeed: '4 Weeks', success: '98%' }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto"
    >
      {/* Top Welcome Banner */}
      <motion.div
        variants={cardItemVariants}
        className="glass-card p-4 sm:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 shadow-2xl"
      >
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#F59E0B] text-xs font-black shadow-inner">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">AI Automated Qualification Engine Active</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            {greeting}, {userName}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl leading-relaxed">
            Here is your immigration business overview. You have{' '}
            <span className="text-[#F59E0B] font-extrabold">{meetings.filter(m => m.date === new Date().toISOString().slice(0, 10) && ['CONFIRMED', 'PENDING', 'Scheduled'].includes(m.status)).length} consultations</span>{' '}
            scheduled for today and{' '}
            <span className="text-emerald-400 font-extrabold">{hotLeadsCount} hot leads</span>{' '}
            ready for university submission.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 relative z-10 w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('ai-assistant')}
            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <span>AI Assistant</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewLeadClick || (() => onNavigate('leads'))}
            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white text-xs font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 btn-glow"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Lead</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 4 Animated KPI Cards */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.id}
              variants={cardItemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass-card p-5 rounded-3xl space-y-4 shadow-xl border border-white/15 relative overflow-hidden group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
                <div className={`w-10 h-10 rounded-2xl ${kpi.iconBg} flex items-center justify-center shrink-0 shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  <AnimatedCounter
                    value={kpi.value}
                    prefix={kpi.prefix}
                    suffix={kpi.suffix}
                    duration={1400}
                  />
                </div>
                <div className="flex items-center space-x-1.5 mt-1 text-xs">
                  <span className="font-extrabold text-emerald-400 flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    {kpi.change}
                  </span>
                  <span className="text-slate-400 font-medium truncate">{kpi.subtext}</span>
                </div>
              </div>

              {/* Sparkline Visualizer */}
              <div className="pt-2 border-t border-white/10 flex items-end justify-between h-7 space-x-1">
                {kpi.sparkline.map((val, idx) => {
                  const max = Math.max(...kpi.sparkline);
                  const heightPercent = Math.max(20, Math.round((val / max) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-white/10 rounded-sm group-hover:bg-[#3B82F6] transition-colors"
                      style={{ height: `${heightPercent}%` }}
                    />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Funnel & Study Hubs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Pipeline Funnel */}
        <motion.div
          variants={cardItemVariants}
          className="lg:col-span-2 glass-card p-6 rounded-3xl shadow-xl space-y-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Intake 2026 Admissions Pipeline Funnel
              </h3>
              <p className="text-xs text-slate-400 font-medium">From first chatbot inquiry to visa issuance.</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-[#3B82F6] hover:underline flex items-center"
            >
              <span>Full Reports</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {funnelStages.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-200">{s.stage}</span>
                  <span className="tabular-nums text-white">
                    {s.count.toLocaleString()} students ({s.percent}%)
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.percent}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full ${s.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right 1 Col: Destination Study Hubs */}
        <motion.div
          variants={cardItemVariants}
          className="glass-card p-6 rounded-3xl shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Target Study Hubs
            </h3>
            <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
              5 Countries
            </span>
          </div>

          <div className="space-y-2.5">
            {countryMarkets.map((cm) => (
              <div
                key={cm.code}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#3B82F6] transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{cm.flag}</span>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{cm.country}</h4>
                    <p className="text-[10px] text-slate-400">Avg: {cm.fee}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-[#3B82F6]">{cm.leads} Deals</div>
                  <div className="text-[10px] text-emerald-400 font-bold">{cm.success} Grant</div>
                </div>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('universities')}
            className="w-full py-2.5 rounded-xl border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>Explore Partner Universities</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </motion.button>
        </motion.div>

      </div>
    </motion.div>
  );
}
