import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { followUpAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  X,
  MessageSquare,
  Calendar,
  User,
  Globe,
  Filter,
  Sparkles,
  Send
} from 'lucide-react';

export default function FollowUpsView() {
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const res = await followUpAPI.getFollowUps();
      if (res.success && res.data) {
        setFollowUps(res.data);
      }
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessDue = async () => {
    setProcessing(true);
    try {
      const res = await followUpAPI.processDue();
      setFeedback({ type: 'success', message: res.message || 'Due follow-ups successfully dispatched!' });
      fetchFollowUps();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error processing follow-ups' });
    } finally {
      setProcessing(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleCancelFollowUp = async (id) => {
    if (!window.confirm('Cancel this scheduled follow-up reminder?')) return;
    try {
      await followUpAPI.cancel(id, 'Counselor manually cancelled');
      fetchFollowUps();
    } catch (err) {
      alert(err.message || 'Failed to cancel follow-up');
    }
  };

  const filteredFollowUps = followUps.filter((f) => {
    if (statusFilter === 'ALL') return true;
    return f.status === statusFilter;
  });

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
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-2">
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>AI Automated & Manual Follow-Up Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            Lead Follow-ups & Reminders
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Keep high-intent student leads warm with timely WhatsApp follow-ups, document nudges, and meeting check-ins.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleProcessDue}
            disabled={processing}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-[#2563EB]/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 text-[#F59E0B]" />
            <span>{processing ? 'Processing...' : 'Run Due Follow-ups Now'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs">
        {['ALL', 'SCHEDULED', 'SENT', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              statusFilter === st
                ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md'
                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            {st === 'ALL' ? 'All Follow-ups' : st}
          </button>
        ))}
      </div>

      {/* Follow-ups List */}
      {loading ? (
        <div className="glass-card p-12 text-center text-xs font-bold text-slate-400 rounded-3xl">
          Loading follow-ups roster...
        </div>
      ) : filteredFollowUps.length === 0 ? (
        <div className="glass-card p-12 text-center text-xs font-bold text-slate-400 rounded-3xl space-y-2">
          <Clock className="w-8 h-8 text-slate-500 mx-auto" />
          <p>No follow-ups recorded under filter '{statusFilter}'.</p>
          <p className="text-[11px] text-slate-500">Auto follow-ups will be generated as student leads progress through WhatsApp.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFollowUps.map((item) => (
            <div
              key={item._id}
              className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10 hover:border-white/20 transition-all shadow-md"
            >
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB]/30 to-[#3B82F6]/30 border border-[#3B82F6]/30 text-white flex items-center justify-center font-bold text-sm">
                  {item.leadId?.fullName ? item.leadId.fullName.charAt(0) : 'L'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-black text-white">
                      {item.leadId?.fullName || 'Prospective Student'}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2563EB]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                      {item.leadId?.preferredCountry || 'Global'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1 font-medium">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-[#F59E0B]" />
                      Scheduled: {new Date(item.scheduledAt).toLocaleDateString()} at {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1 text-emerald-400" />
                      Channel: {item.channel || 'WHATSAPP'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 self-end sm:self-center">
                <button type="button" onClick={() => navigate(item.conversationId?.sessionId
                  ? `/admin/inbox?session=${encodeURIComponent(item.conversationId.sessionId)}&filter=FOLLOWUP`
                  : `/admin/inbox?lead=${encodeURIComponent(item.leadId?._id || '')}&filter=FOLLOWUP`)}
                  className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold">
                  Open Chat
                </button>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                    item.status === 'SENT'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : item.status === 'SCHEDULED'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                  }`}
                >
                  {item.status}
                </span>

                {item.status === 'SCHEDULED' && (
                  <button
                    onClick={() => handleCancelFollowUp(item._id)}
                    className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-bold transition-all"
                    title="Cancel Follow-Up"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
