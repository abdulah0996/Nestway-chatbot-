import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Kanban, 
  Users, 
  CalendarDays, 
  GraduationCap, 
  FileCheck, 
  Settings,
  Bot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user } = useAuth();

  const navItems = [
    { id: 'stats', label: 'CRM Overview', icon: LayoutDashboard },
    { id: 'kanban', label: 'Kanban Pipeline', icon: Kanban },
    { id: 'leads', label: 'Student Leads', icon: Users },
    { id: 'meetings', label: 'Consultations', icon: CalendarDays },
    { id: 'universities', label: 'Universities Catalog', icon: GraduationCap },
    { id: 'documents', label: 'Document Verification', icon: FileCheck },
    ...(user && user.role === 'ADMIN' ? [{ id: 'users', label: 'User Management', icon: Settings }] : [])
  ];

  return (
    <aside className="w-64 bg-brand-dark border-r border-slate-800 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col p-4 space-y-6">
      
      {/* Platform Title */}
      <div className="px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-brand-royal flex items-center justify-center text-white">
          <Bot className="w-5 h-5 text-brand-gold" />
        </div>
        <div>
          <div className="text-xs font-bold text-white uppercase tracking-wider">CRM Control Hub</div>
          <div className="text-[11px] text-slate-400 font-medium">{user?.name || 'Counselor Desk'}</div>
        </div>
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-royal to-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-gold' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Support Banner */}
      <div className="p-3 bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 text-xs">
        <div className="font-semibold text-white mb-1 flex items-center justify-between">
          <span>Target Countries</span>
          <span className="text-[10px] text-brand-gold bg-brand-gold/10 px-1.5 py-0.5 rounded">5 Active</span>
        </div>
        <div className="flex space-x-1 mt-2 text-base">
          <span title="United Kingdom">🇬🇧</span>
          <span title="Australia">🇦🇺</span>
          <span title="Italy">🇮🇹</span>
          <span title="Germany">🇩🇪</span>
          <span title="Hungary">🇭🇺</span>
        </div>
      </div>

    </aside>
  );
}
