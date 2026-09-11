import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  Award,
  Globe,
  DollarSign,
  Download,
  Calendar,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import AnimatedCounter from '../common/AnimatedCounter';

export default function ReportsView() {
  const leadSources = [
    { source: 'AI Website Chatbot', count: 740, share: '52%', color: 'from-[#2563EB] to-[#3B82F6]' },
    { source: 'Direct Student Referrals', count: 342, share: '24%', color: 'from-emerald-500 to-teal-400' },
    { source: 'Meta & Google Ads Campaign', count: 228, share: '16%', color: 'from-[#F59E0B] to-amber-300' },
    { source: 'Partner School Seminars', count: 114, share: '8%', color: 'from-purple-600 to-indigo-400' }
  ];

  const counselorLeaderboard = [
    { name: 'Ahmed Khan', role: 'Senior Consultant', activeLeads: 86, meetings: 38, converted: 24, successRate: '99%' },
    { name: 'Sarah Jenkins', role: 'Admissions Lead', activeLeads: 72, meetings: 32, converted: 19, successRate: '98%' },
    { name: 'Zeeshan Ali', role: 'Visa Compliance Officer', activeLeads: 54, meetings: 26, converted: 15, successRate: '97%' },
    { name: 'Maria Rossi', role: 'European Regional Expert', activeLeads: 48, meetings: 22, converted: 14, successRate: '96%' }
  ];

  const intakeProjections = [
    { intake: 'Fall (Sept) 2026', students: 134, tuitionVol: '£2.1M / A$1.8M', commProjected: '$148,000' },
    { intake: 'Spring (Jan) 2027', students: 68, tuitionVol: '£950K / €420K', commProjected: '$72,000' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Top Header */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2563EB]/20 border border-[#3B82F6]/30 text-[#60A5FA] flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Executive Analytics & Performance Reports
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
                  Q3 2026 Live
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Real-time acquisition channels, counselor conversion rates, tuition projections, and visa metrics.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold border border-white/10 shadow-sm flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
        >
          <Download className="w-4 h-4 text-slate-300" />
          <span>Export Analytics PDF</span>
        </button>
      </div>

      {/* Analytics Grid: Lead Sources & Intake Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources Distribution */}
        <div className="glass-card p-4 sm:p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Lead Acquisition Channels
              </h3>
              <p className="text-xs text-slate-400 font-medium">Breakdown of student inquiry attribution</p>
            </div>
            <span className="text-xs font-bold text-[#60A5FA]">
              <AnimatedCounter target={1424} /> Total Leads
            </span>
          </div>

          <div className="space-y-4">
            {leadSources.map((ls, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">{ls.source}</span>
                  <span className="text-white tabular-nums">{ls.count} ({ls.share})</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: ls.share }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={`bg-gradient-to-r ${ls.color} h-full rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial & Tuition Volume Projections */}
        <div className="glass-card p-4 sm:p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Intake Revenue & Tuition Volume
              </h3>
              <p className="text-xs text-slate-400 font-medium">Estimated commissions and enrollment value</p>
            </div>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              $220,000+ Projected
            </span>
          </div>

          <div className="space-y-3.5">
            {intakeProjections.map((ip, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-center justify-between font-black text-sm text-white">
                  <span>{ip.intake}</span>
                  <span className="text-[#60A5FA]">{ip.commProjected} Agency Fee</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Enrolled Candidates: <b className="text-white">{ip.students}</b></span>
                  <span>Gross Tuition: <b className="text-white">{ip.tuitionVol}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Counselor Performance Leaderboard */}
      <div className="glass-card rounded-3xl overflow-hidden space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Counselor Performance Leaderboard
            </h3>
            <p className="text-xs text-slate-400 font-medium">Team productivity and conversion metrics</p>
          </div>
          <span className="text-xs font-bold text-[#60A5FA]">Weekly Audit</span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-y border-white/10">
              <tr>
                <th className="p-3.5">Counselor</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Active Leads</th>
                <th className="p-3.5">Consultations</th>
                <th className="p-3.5">Converted Students</th>
                <th className="p-3.5 text-right">Visa Grant Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-slate-300">
              {counselorLeaderboard.map((c, i) => (
                <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-3.5 font-black text-white flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-[#2563EB]/30 border border-[#3B82F6]/30 text-white flex items-center justify-center text-xs font-bold">
                      {c.name.charAt(0)}
                    </div>
                    <span>{c.name}</span>
                  </td>
                  <td className="p-3.5 text-slate-400">{c.role}</td>
                  <td className="p-3.5 font-bold text-white">{c.activeLeads}</td>
                  <td className="p-3.5 font-bold text-[#60A5FA]">{c.meetings}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-500/30">
                      {c.converted} Enrolled
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-black text-emerald-400">{c.successRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-3">
          {counselorLeaderboard.map((c, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#2563EB]/30 border border-[#3B82F6]/30 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{c.name}</h4>
                    <p className="text-[10px] text-slate-400">{c.role}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400">{c.successRate} Visa</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center text-xs">
                <div className="p-2 rounded-xl bg-black/20">
                  <span className="text-[10px] text-slate-400 block">Active Leads</span>
                  <span className="font-bold text-white">{c.activeLeads}</span>
                </div>
                <div className="p-2 rounded-xl bg-black/20">
                  <span className="text-[10px] text-slate-400 block">Meetings</span>
                  <span className="font-bold text-[#60A5FA]">{c.meetings}</span>
                </div>
                <div className="p-2 rounded-xl bg-black/20">
                  <span className="text-[10px] text-slate-400 block">Enrolled</span>
                  <span className="font-bold text-emerald-300">{c.converted}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
