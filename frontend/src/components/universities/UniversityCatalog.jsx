import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { universityAPI, applicationAPI } from '../../services/api';
import { Building, MapPin, GraduationCap, DollarSign, CheckCircle2, Search, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UniversityCatalog() {
  const { user } = useAuth();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [search, setSearch] = useState('');
  const [applySuccess, setApplySuccess] = useState('');

  useEffect(() => {
    fetchUniversities();
  }, [selectedCountry]);

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const res = await universityAPI.getUniversities({ country: selectedCountry });
      if (res.success) {
        setUniversities(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load universities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (uni) => {
    if (!user) {
      alert('Please sign in to apply for universities.');
      return;
    }

    try {
      const courseName = uni.courses && uni.courses.length > 0 ? uni.courses[0].name : 'General International Program';
      const res = await applicationAPI.create({
        universityId: uni._id,
        course: courseName,
        intake: uni.intakes && uni.intakes.length > 0 ? uni.intakes[0] : 'Fall 2026'
      });

      if (res.success) {
        setApplySuccess(`🎉 Applied successfully to ${uni.name} for ${courseName}!`);
        setTimeout(() => setApplySuccess(''), 5000);
      }
    } catch (err) {
      alert(err.message || 'Application failed.');
    }
  };

  const filtered = universities.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner & Filters */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center">
            <GraduationCap className="w-6 h-6 text-[#F59E0B] mr-2" /> Global University Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Explore top accredited universities across UK, Australia, Italy, Germany, and Hungary.
          </p>
        </div>

        {/* Filter inputs */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search university..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass-input text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl glass-input text-white font-extrabold focus:outline-none"
          >
            <option value="" className="bg-[#071A33] text-white">All Countries</option>
            <option value="UK" className="bg-[#071A33] text-white">🇬🇧 UK</option>
            <option value="Australia" className="bg-[#071A33] text-white">🇦🇺 Australia</option>
            <option value="Italy" className="bg-[#071A33] text-white">🇮🇹 Italy</option>
            <option value="Germany" className="bg-[#071A33] text-white">🇩🇪 Germany</option>
            <option value="Hungary" className="bg-[#071A33] text-white">🇭🇺 Hungary</option>
          </select>
        </div>
      </div>

      {applySuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center"
        >
          <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" /> {applySuccess}
        </motion.div>
      )}

      {/* Grid List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">
          Fetching destination universities...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs italic">
          No universities matching search filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((uni, idx) => (
            <motion.div
              key={uni._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="glass-card rounded-3xl p-6 flex flex-col justify-between group space-y-4"
            >
              <div>
                {/* Top Country Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-extrabold border border-white/10 flex items-center">
                    <MapPin className="w-3 h-3 text-[#3B82F6] mr-1" /> {uni.country}
                  </span>
                  {uni.featured && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[#F59E0B] border border-amber-500/30 text-[10px] font-extrabold">
                      ⭐ Featured Partner
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-base font-extrabold text-white group-hover:text-[#60A5FA] transition-colors">
                  {uni.name}
                </h3>

                {/* Fee & Requirements */}
                <div className="mt-3 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center font-bold text-[#60A5FA]">
                    <DollarSign className="w-4 h-4 text-emerald-400 mr-1" />
                    <span>Tuition Fee: {uni.fees}</span>
                  </div>

                  <div className="p-3.5 bg-white/[0.04] rounded-2xl border border-white/10 space-y-1.5 text-[11px]">
                    <div className="font-semibold text-slate-300">Requirements:</div>
                    <div className="flex justify-between text-slate-400">
                      <span>Min Academic CGPA:</span>
                      <span className="font-bold text-white">{uni.requirements?.minCGPA || '2.8 / 4.0'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Min IELTS:</span>
                      <span className="font-bold text-white">{uni.requirements?.minIELTS || '6.0'}</span>
                    </div>
                    {uni.requirements?.acceptMOI && (
                      <div className="text-emerald-400 font-bold text-[10px] pt-1 border-t border-white/5">
                        ✓ Accepts Medium of Instruction (MOI) Waiver
                      </div>
                    )}
                  </div>
                </div>

                {/* Popular Courses */}
                {uni.courses && uni.courses.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      Available Degree Programs:
                    </p>
                    <ul className="text-xs space-y-1.5 text-slate-300">
                      {uni.courses.map((c, i) => (
                        <li key={i} className="flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-2"></span>
                          <span className="font-semibold">{c.name}</span>
                          <span className="ml-auto text-[10px] text-slate-400">({c.level})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleApply(uni)}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-[#2563EB]/20 flex items-center justify-center space-x-1.5"
              >
                <span>Apply to University</span>
                <ArrowRight className="w-4 h-4 text-[#F59E0B]" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
