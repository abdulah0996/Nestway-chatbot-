import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, LogOut, UserCheck, LayoutDashboard, Bot, Calendar, FileText, ArrowRight, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-[#071A33]/80 backdrop-blur-2xl text-white shadow-xl border-b border-white/10 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-[#2563EB]/40 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                AI Immigration
              </span>
              <span className="hidden sm:inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#2563EB]/20 text-[#60A5FA] border border-[#3B82F6]/30 tracking-wider uppercase">
                Enterprise CRM v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Global Student Admissions Platform</p>
          </div>
        </Link>

        {/* Quick Nav Links */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            to="/"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bot className="w-4 h-4 text-[#F59E0B]" />
            <span>AI Admissions Advisor</span>
          </Link>
          
          {user && (
            <>
              {user.role === 'STUDENT' && (
                <Link
                  to="/student"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Student Portal</span>
                </Link>
              )}

              {(user.role === 'COUNSELOR' || user.role === 'ADMIN') && (
                <Link
                  to="/crm"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#3B82F6]" />
                  <span>Counselor CRM Hub</span>
                </Link>
              )}

              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <span>Admin Console</span>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* User Auth Section */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white">{user.name}</div>
                <div className="text-[10px] uppercase font-bold text-[#F59E0B] tracking-wider">{user.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 transition-all shadow-md shadow-[#2563EB]/30"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#071A33] bg-[#F59E0B] hover:bg-amber-400 transition-all shadow-md shadow-[#F59E0B]/20"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
