import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { counselorAPI, authAPI } from '../../services/api';
import {
  Users,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  CheckCircle2,
  Calendar,
  Briefcase,
  UserCheck,
  Clock,
  Sparkles,
  Plus
} from 'lucide-react';

export default function AllCounselorsView() {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounselors();
  }, []);

  const fetchCounselors = async () => {
    setLoading(true);
    try {
      const res = await counselorAPI.getCounselors();
      if (res.success && res.data && res.data.length > 0) {
        setCounselors(res.data);
      } else {
        // Fallback to auth counselors
        const authRes = await authAPI.getCounselors();
        if (authRes.success) setCounselors(authRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load counselors:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Top Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold mb-2">
            <UserCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Staff & Immigration Advisors Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            All Specialized Counselors
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Oversee certified consultants, manage workload distribution, country portfolios, and active student assignments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-3 px-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Staff</span>
            <span className="text-xl font-black text-white">{counselors.length || 4} Active</span>
          </div>
        </div>
      </div>

      {/* Counselors Grid */}
      {loading ? (
        <div className="glass-card p-12 text-center text-xs font-bold text-slate-400 rounded-3xl">
          Loading authorized counselors...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {counselors.map((c) => (
            <motion.div
              key={c._id}
              whileHover={{ y: -3 }}
              className="glass-card p-6 rounded-3xl space-y-4 border border-white/10 hover:border-blue-500/40 transition-all shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] text-white flex items-center justify-center font-black text-base shadow-lg shadow-[#2563EB]/30">
                      {c.name ? c.name.charAt(0) : 'C'}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white leading-snug">{c.name}</h3>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                          {c.active !== false ? 'Active Online' : 'Offline'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Load: <strong className="text-white">{c.currentWorkload || 2}</strong> / {c.maxDailyLeads || 15}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs text-slate-300">
                  <div className="flex items-center space-x-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <Mail className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{c.phone || '+92 300 1234567'}</span>
                  </div>
                </div>

                {/* Specializations */}
                {c.specialization && c.specialization.length > 0 && (
                  <div className="mt-3.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                      Expertise & Visa Categories
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {c.specialization.map((spec, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-white/10 text-slate-200 border border-white/10"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Countries Covered */}
                {c.countries && c.countries.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                      Destination Portfolio
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {c.countries.map((cntry, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#2563EB]/20 text-[#60A5FA] border border-[#3B82F6]/30"
                        >
                          {cntry}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] flex items-center">
                  <Clock className="w-3 h-3 text-[#F59E0B] mr-1" />
                  Hours: {c.availability?.hours || '09:00 AM - 06:00 PM'}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/5 text-white font-bold text-[10px] border border-white/10">
                  Senior Immigration Lead
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
