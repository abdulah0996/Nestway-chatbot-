import React, { useState, useEffect } from 'react';
import { leadAPI } from '../../services/api';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Phone, 
  Mail, 
  Award, 
  Filter, 
  Search, 
  Building, 
  FileText 
} from 'lucide-react';

const STAGES = [
  'New Lead',
  'AI Qualified',
  'Meeting Booked',
  'Profile Assessment',
  'Documents Pending',
  'Application Started',
  'University Applied',
  'Offer Received',
  'Deposit Paid',
  'Visa Submitted',
  'Visa Approved'
];

export default function KanbanBoard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, [selectedCountry]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await leadAPI.getLeads({ country: selectedCountry });
      if (res.success) {
        setLeads(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStage = async (leadId, currentStage, direction) => {
    const currentIndex = STAGES.indexOf(currentStage);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= STAGES.length) return;

    const nextStage = STAGES[nextIndex];

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l._id === leadId ? { ...l, stage: nextStage } : l))
    );

    try {
      await leadAPI.updateStage(leadId, nextStage);
    } catch (err) {
      console.error('Failed to update stage:', err);
      fetchLeads(); // Revert on failure
    }
  };

  const filteredLeads = leads.filter((l) =>
    l.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
    (l.phone && l.phone.includes(search))
  );

  const getCountryFlag = (country) => {
    switch (country) {
      case 'UK': return '🇬🇧';
      case 'Australia': return '🇦🇺';
      case 'Italy': return '🇮🇹';
      case 'Germany': return '🇩🇪';
      case 'Hungary': return '🇭🇺';
      default: return '🌐';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-royal focus:outline-none"
            />
          </div>
          
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-royal focus:outline-none bg-white font-semibold text-brand-dark"
          >
            <option value="">All Destination Countries</option>
            <option value="UK">🇬🇧 United Kingdom</option>
            <option value="Australia">🇦🇺 Australia</option>
            <option value="Italy">🇮🇹 Italy</option>
            <option value="Germany">🇩🇪 Germany</option>
            <option value="Hungary">🇭🇺 Hungary</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-brand-dark font-extrabold">{filteredLeads.length}</span> Active CRM Deals
        </div>
      </div>

      {/* Kanban Pipeline Columns Container */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-max">
          {STAGES.map((stageName) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stageName);

            return (
              <div
                key={stageName}
                className="w-72 bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col max-h-[700px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-extrabold text-brand-dark uppercase tracking-wider">
                    {stageName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-xs font-extrabold text-brand-royal shadow-sm">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
                      No deals in stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead._id}
                        onClick={() => setSelectedLead(lead)}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-brand-royal"
                      >
                        {/* Country & Score Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-brand-dark border border-slate-200 flex items-center">
                            <span className="mr-1">{getCountryFlag(lead.countryInterest)}</span> {lead.countryInterest}
                          </span>
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center">
                            <Award className="w-3 h-3 mr-0.5" /> {lead.leadScore || 80}%
                          </span>
                        </div>

                        {/* Student Name */}
                        <h4 className="font-extrabold text-sm text-brand-dark group-hover:text-brand-royal transition-colors">
                          {lead.fullName}
                        </h4>

                        {/* Meta */}
                        <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 text-slate-400 mr-1" />
                            <span>{lead.phone}</span>
                          </div>
                          {lead.qualification && (
                            <div className="flex items-center">
                              <Building className="w-3 h-3 text-slate-400 mr-1" />
                              <span className="truncate">{lead.qualification}</span>
                            </div>
                          )}
                        </div>

                        {/* Counselor Footer */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 truncate max-w-[120px]">
                            {lead.assignedCounselor?.name ? lead.assignedCounselor.name.split(' ')[0] : 'Unassigned'}
                          </span>

                          {/* Stage Shift Buttons */}
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleMoveStage(lead._id, lead.stage, 'prev')}
                              disabled={STAGES.indexOf(lead.stage) === 0}
                              title="Move to previous stage"
                              className="p-1 rounded bg-slate-100 hover:bg-brand-royal hover:text-white text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-600"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveStage(lead._id, lead.stage, 'next')}
                              disabled={STAGES.indexOf(lead.stage) === STAGES.length - 1}
                              title="Move to next stage"
                              className="p-1 rounded bg-slate-100 hover:bg-brand-royal hover:text-white text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-600"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
