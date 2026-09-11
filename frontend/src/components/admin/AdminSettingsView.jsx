import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI, universityAPI } from '../../services/api';
import {
  Users,
  ShieldCheck,
  Building,
  Globe,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Key,
  Database,
  Sliders,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react';
import UniversityCatalog from '../universities/UniversityCatalog';

export default function AdminSettingsView() {
  const [activeSubTab, setActiveSubTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getUsers();
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const countries = [
    { name: 'United Kingdom', code: 'UK', flag: '🇬🇧', unis: 28, status: 'Active', visaSpeed: '3 Weeks' },
    { name: 'Australia', code: 'AU', flag: '🇦🇺', unis: 16, status: 'Active', visaSpeed: '4 Weeks' },
    { name: 'Germany', code: 'DE', flag: '🇩🇪', unis: 12, status: 'Active', visaSpeed: '6 Weeks' },
    { name: 'Italy', code: 'IT', flag: '🇮🇹', unis: 8, status: 'Active', visaSpeed: '5 Weeks' },
    { name: 'Hungary', code: 'HU', flag: '🇭🇺', unis: 6, status: 'Active', visaSpeed: '4 Weeks' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Top Header */}
      <div className="glass-card p-4 sm:p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Master Enterprise Administrator Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            System Administration & Platform Governance
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Manage counselor access control, agency destination portfolios, university partner roster, and security parameters.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3.5 py-1.5 bg-white/10 text-white rounded-xl text-xs font-bold border border-white/20">
            Role: SUPER_ADMIN
          </span>
        </div>
      </div>

      {/* Admin Modules Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'users', label: 'User & Counselor Directory', icon: Users },
          { id: 'universities', label: 'Universities Catalog', icon: Building },
          { id: 'countries', label: 'Destination Hubs', icon: Globe },
          { id: 'permissions', label: 'Role Permissions & Security', icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-[#2563EB]/30'
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* MODULE 1: USERS & COUNSELORS */}
        {activeSubTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card rounded-3xl overflow-hidden p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  System Accounts & Counselors ({users.length})
                </h3>
                <p className="text-xs text-slate-400 font-medium">Verified platform users and assigned roles</p>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-y border-white/10">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Assigned Role</th>
                    <th className="p-3.5">Contact Phone</th>
                    <th className="p-3.5 text-right">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-3.5 font-black text-white flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#2563EB]/30 border border-[#3B82F6]/30 text-white flex items-center justify-center text-xs font-bold">
                          {u.name?.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="p-3.5 text-slate-400">{u.email}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : u.role === 'COUNSELOR'
                            ? 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#3B82F6]/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{u.phone || '+92 300 1234567'}</td>
                      <td className="p-3.5 text-right">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                          Active Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {users.map((u) => (
                <div key={u._id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#2563EB]/30 border border-[#3B82F6]/30 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {u.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{u.name}</h4>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] shrink-0 ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : u.role === 'COUNSELOR'
                        ? 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#3B82F6]/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                    <span>{u.phone || '+92 300 1234567'}</span>
                    <span className="text-emerald-400 font-bold">Active Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* MODULE 2: UNIVERSITIES */}
        {activeSubTab === 'universities' && (
          <motion.div
            key="universities"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <UniversityCatalog />
          </motion.div>
        )}

        {/* MODULE 3: DESTINATION COUNTRIES */}
        {activeSubTab === 'countries' && (
          <motion.div
            key="countries"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {countries.map((c) => (
              <motion.div
                key={c.code}
                whileHover={{ y: -4 }}
                className="glass-card p-6 rounded-3xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{c.flag}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                    {c.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-lg text-white">{c.name}</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Standard Processing: {c.visaSpeed}</p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Partner Universities:</span>
                  <span className="text-[#60A5FA]">{c.unis} Active</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* MODULE 4: PERMISSIONS */}
        {activeSubTab === 'permissions' && (
          <motion.div
            key="permissions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 rounded-3xl space-y-4"
          >
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Enterprise Role Based Access Control (RBAC)
            </h3>

            <div className="space-y-3 text-xs">
              {[
                { role: 'ADMIN', perms: 'Full system access, manage counselors, delete records, view agency financial projections' },
                { role: 'COUNSELOR', perms: 'Access assigned leads, conduct consultations, verify student documents, advance CRM deals' },
                { role: 'STUDENT', perms: 'Check eligibility via AI, view submitted applications, upload documents, schedule meetings' }
              ].map((r) => (
                <div key={r.role} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-black text-sm text-white">{r.role}</div>
                    <p className="text-slate-400 mt-1 font-medium">{r.perms}</p>
                  </div>
                  <span className="px-3 py-1 bg-white/10 rounded-xl border border-white/10 font-bold text-slate-300 text-[11px] shrink-0">
                    Configured
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
