import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, UserPlus, User, Mail, Lock, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import Navbar from '../../components/common/Navbar';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'STUDENT'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await register(formData);
      if (user.role === 'STUDENT') {
        navigate('/student');
      } else {
        navigate('/crm');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col antialiased relative overflow-hidden">
      {/* Ambient background glowing orbs */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-[#2563EB]/15 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#3B82F6]/15 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2.5s' }} />

      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] text-white mx-auto flex items-center justify-center shadow-lg shadow-[#2563EB]/40">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Create Platform Account</h2>
            <p className="text-xs text-slate-400 font-medium">Join the AI Immigration & Student CRM Platform</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ali Raza"
                  className="w-full pl-10 pr-3 py-2.5 text-xs font-medium glass-input rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-[#3B82F6] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ali@example.com"
                  className="w-full pl-10 pr-3 py-2.5 text-xs font-medium glass-input rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-[#3B82F6] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Phone / WhatsApp Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="w-full pl-10 pr-3 py-2.5 text-xs font-medium glass-input rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-[#3B82F6] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Account Type *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-bold glass-input rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:outline-none text-white"
              >
                <option value="STUDENT" className="bg-[#071A33] text-white">Student Candidate Account</option>
                <option value="COUNSELOR" className="bg-[#071A33] text-white">Immigration Counselor Portal</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-xs font-medium glass-input rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-[#3B82F6] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 text-white font-black text-xs rounded-xl shadow-lg shadow-[#2563EB]/30 transition-all flex items-center justify-center space-x-2 mt-2 active:scale-95 btn-glow"
            >
              <UserPlus className="w-4 h-4 text-[#F59E0B]" />
              <span>{loading ? 'Registering Account...' : 'Create Account'}</span>
            </button>
          </form>

          <div className="text-center text-xs text-slate-400 font-medium">
            Already registered?{' '}
            <Link to="/login" className="text-[#60A5FA] font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
