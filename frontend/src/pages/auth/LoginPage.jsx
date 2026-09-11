import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, LogIn, Lock, Mail, ShieldAlert, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import Navbar from '../../components/common/Navbar';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to appropriate role dashboard
  useEffect(() => {
    if (user && user.role) {
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'COUNSELOR') {
        navigate('/admin/inbox', { replace: true });
      } else if (user.role === 'STUDENT') {
        navigate('/student/chat', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (loggedUser.role === 'COUNSELOR') {
        navigate('/admin/inbox');
      } else if (loggedUser.role === 'STUDENT') {
        navigate('/student/chat');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex flex-col antialiased relative overflow-hidden bg-gradient-to-br from-[#F1F5F9] via-[#EFEAE2] to-[#E2E8F0]">
      {/* Ambient background glowing orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#2563EB]/15 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#3B82F6]/15 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-slate-900/10"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] text-white mx-auto flex items-center justify-center shadow-lg shadow-[#2563EB]/40">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: '#0F172A' }}>
              Enterprise Sign In
            </h2>
            <p className="text-xs font-medium" style={{ color: '#64748B' }}>
              Access Counselor CRM, Student Portal, or Admin Hub
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-rose-500/15 text-rose-700 text-xs font-semibold border border-rose-500/30 flex items-center"
            >
              <ShieldAlert className="w-4 h-4 mr-2 shrink-0 text-rose-600" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: '#334155' }}
              >
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5" style={{ color: '#64748B' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@immigration.com"
                  className="w-full pl-10 pr-3 py-3 text-xs font-medium rounded-xl border border-slate-200/90 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent focus:outline-none transition-all shadow-sm placeholder:text-[#64748B]"
                  style={{ color: '#111827' }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: '#334155' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5" style={{ color: '#64748B' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-3 text-xs font-medium rounded-xl border border-slate-200/90 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent focus:outline-none transition-all shadow-sm placeholder:text-[#64748B]"
                  style={{ color: '#111827' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 font-black text-xs rounded-xl shadow-lg shadow-[#2563EB]/30 transition-all flex items-center justify-center space-x-2 active:scale-95 btn-glow text-white"
            >
              <LogIn className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-white" style={{ color: '#FFFFFF' }}>
                {loading ? 'Authenticating Enterprise Account...' : 'Sign In to Workspace'}
              </span>
            </button>
          </form>

          {/* Quick Demo Login Credentials Buttons */}
          <div className="pt-4 border-t border-slate-200/70 space-y-2.5">
            <p
              className="text-[10px] font-extrabold uppercase tracking-wider text-center flex items-center justify-center"
              style={{ color: '#64748B' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] mr-1" /> Quick Demo Roles (1-Click Fill)
            </p>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickDemo('counselor@immigration.com', 'counselor123')}
                className="p-2.5 rounded-xl bg-blue-50/90 hover:bg-blue-100 text-blue-700 font-black border border-blue-200/70 transition-all hover:scale-102"
              >
                Counselor
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@immigration.com', 'admin123')}
                className="p-2.5 rounded-xl bg-purple-50/90 hover:bg-purple-100 text-purple-700 font-black border border-purple-200/70 transition-all hover:scale-102"
              >
                Admin Hub
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('student@immigration.com', 'student123')}
                className="p-2.5 rounded-xl bg-emerald-50/90 hover:bg-emerald-100 text-emerald-700 font-black border border-emerald-200/70 transition-all hover:scale-102"
              >
                Student
              </button>
            </div>
          </div>

          <div className="text-center text-xs font-medium" style={{ color: '#64748B' }}>
            Don't have an enterprise account?{' '}
            <Link to="/register" className="font-bold hover:underline" style={{ color: '#2563EB' }}>
              Create student account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
