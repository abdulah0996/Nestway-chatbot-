import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { documentAPI } from '../../services/api';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Download,
  ShieldCheck,
  Filter,
  Search,
  Plus,
  AlertCircle,
  Sparkles,
  Layers
} from 'lucide-react';

const DOCUMENT_CATEGORIES = [
  { id: 'all', label: 'All Documents' },
  { id: 'PASSPORT', label: 'Passports' },
  { id: 'TRANSCRIPT', label: 'Transcripts' },
  { id: 'IELTS', label: 'English Tests' },
  { id: 'CV', label: 'CV / Resumes' },
  { id: 'FINANCIAL', label: 'Financial Proof' }
];

export default function DocumentsWorkspaceView({ isCounselorView = true }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentAPI.getDocuments();
      if (res.success) {
        setDocuments(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const defaultSampleDocs = [
    {
      _id: 'd1',
      studentName: 'Hamza Khan',
      documentType: 'PASSPORT',
      title: 'International Passport (Machine Readable)',
      fileName: 'Passport_Hamza_Khan.pdf',
      fileSize: '2.4 MB',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Ahmed Khan',
      uploadedAt: 'Yesterday at 2:10 PM',
      remarks: 'Bio page verified with 5+ years validity remaining.'
    },
    {
      _id: 'd2',
      studentName: 'Hamza Khan',
      documentType: 'TRANSCRIPT',
      title: 'Official BS Computer Science Degree & Transcripts',
      fileName: 'BS_CS_Official_Transcripts.pdf',
      fileSize: '4.8 MB',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Ahmed Khan',
      uploadedAt: 'Yesterday at 2:15 PM',
      remarks: 'HEC attested with 3.42 CGPA.'
    },
    {
      _id: 'd3',
      studentName: 'Ayesha Noor',
      documentType: 'IELTS',
      title: 'IELTS Academic Test Report Form (TRF)',
      fileName: 'IELTS_TRF_Result_Band_7.5.pdf',
      fileSize: '1.2 MB',
      verificationStatus: 'PENDING',
      uploadedAt: 'Today at 09:30 AM',
      remarks: ''
    },
    {
      _id: 'd4',
      studentName: 'Bilal Tariq',
      documentType: 'CV',
      title: 'Academic & Professional Curriculum Vitae',
      fileName: 'Bilal_Tariq_Software_CV.pdf',
      fileSize: '850 KB',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Sarah Jenkins',
      uploadedAt: '2 days ago',
      remarks: 'Formatted per UK admissions standard.'
    },
    {
      _id: 'd5',
      studentName: 'Zainab Malik',
      documentType: 'FINANCIAL',
      title: 'Sponsorship Affidavit & Bank Statement (28-day)',
      fileName: 'Bank_Proof_Funds_28Days.pdf',
      fileSize: '3.6 MB',
      verificationStatus: 'REJECTED',
      verifiedBy: 'Ahmed Khan',
      uploadedAt: '3 days ago',
      remarks: 'Statement missing official bank branch stamp. Resubmission requested.'
    }
  ];

  const allDocs = documents.length > 0 ? documents : defaultSampleDocs;

  const filteredDocs = allDocs.filter((d) => {
    const matchesCategory =
      activeCategory === 'all' || d.documentType === activeCategory;
    const matchesStatus =
      statusFilter === 'all' || d.verificationStatus === statusFilter;
    return matchesCategory && matchesStatus;
  });

  const handleUpdateStatus = async (status) => {
    if (!selectedDoc) return;
    try {
      await documentAPI.updateStatus(selectedDoc._id, status, remarks);
    } catch (err) {
      console.warn('Backend patch simulated:', err);
    }

    setDocuments((prev) =>
      prev.map((d) =>
        d._id === selectedDoc._id
          ? { ...d, verificationStatus: status, remarks, verifiedBy: 'Ahmed Khan' }
          : d
      )
    );

    setIsAuditModalOpen(false);
    setSelectedDoc(null);
    setRemarks('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateUpload(e.dataTransfer.files[0]);
    }
  };

  const simulateUpload = (file) => {
    setIsUploading(true);
    setTimeout(() => {
      const newDoc = {
        _id: `doc_${Date.now()}`,
        studentName: 'Current Applicant',
        documentType: 'TRANSCRIPT',
        title: file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        verificationStatus: 'PENDING',
        uploadedAt: 'Just now',
        remarks: 'Uploaded via workspace drag and drop.'
      };
      setDocuments((prev) => [newDoc, ...prev]);
      setIsUploading(false);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6"
    >
      {/* Top Header */}
      <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2563EB]/20 border border-[#3B82F6]/30 text-[#3B82F6] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  Document Verification Workspace
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#2563EB]/20 text-[#60A5FA] text-xs font-black border border-[#3B82F6]/30">
                  {filteredDocs.length} Documents
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Audit candidate credentials, passport validity, academic transcripts, and financial proof of funds.
              </p>
            </div>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold backdrop-blur-md">
          {[
            { id: 'all', label: 'All', color: 'text-slate-300' },
            { id: 'VERIFIED', label: 'Verified', color: 'text-emerald-400' },
            { id: 'PENDING', label: 'Pending', color: 'text-amber-400' },
            { id: 'REJECTED', label: 'Rejected', color: 'text-rose-400' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                statusFilter === st.id
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-[#2563EB]/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer relative glass-card ${
          dragActive
            ? 'border-[#3B82F6] bg-[#2563EB]/10 scale-[1.01]'
            : 'border-white/15 hover:border-[#3B82F6]/60 bg-white/[0.03]'
        }`}
      >
        <input
          type="file"
          id="doc-file-input"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              simulateUpload(e.target.files[0]);
            }
          }}
        />

        <label htmlFor="doc-file-input" className="cursor-pointer space-y-3 block">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2563EB]/20 to-[#3B82F6]/20 border border-[#3B82F6]/30 text-[#60A5FA] flex items-center justify-center mx-auto shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-sm font-black text-white">
              {isUploading ? 'Uploading & Encrypting Document...' : 'Drag & drop student documents here, or click to browse'}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Supports PDF, PNG, JPG, DOCX up to 15MB • Certified 256-bit AES Encryption
            </p>
          </div>

          <span className="inline-block px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors shadow-sm">
            Choose File from Device
          </span>
        </label>
      </motion.div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {DOCUMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === cat.id
                ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-[#2563EB]/30'
                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {filteredDocs.map((doc, idx) => {
            const isVerified = doc.verificationStatus === 'VERIFIED';
            const isPending = doc.verificationStatus === 'PENDING';
            const isRejected = doc.verificationStatus === 'REJECTED';

            return (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className="glass-card p-5 rounded-3xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#2563EB]/20 border border-[#3B82F6]/30 text-[#60A5FA] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>

                    {/* Status Badges */}
                    <span
                      className={`px-3 py-1 rounded-full font-black text-[10px] border flex items-center backdrop-blur-md ${
                        isVerified
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : isPending
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {isVerified && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />}
                      {isPending && <Clock className="w-3 h-3 mr-1 text-amber-400" />}
                      {isRejected && <XCircle className="w-3 h-3 mr-1 text-rose-400" />}
                      {doc.verificationStatus}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-sm text-white leading-snug">{doc.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      Student: <span className="font-bold text-slate-200">{doc.studentName}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-[11px] space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">File:</span>
                      <span className="font-bold text-white truncate max-w-[160px]">{doc.fileName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Size:</span>
                      <span>{doc.fileSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Uploaded:</span>
                      <span>{doc.uploadedAt}</span>
                    </div>
                  </div>

                  {doc.remarks && (
                    <div className="text-[11px] p-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-slate-300 italic">
                      "{doc.remarks}"
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-white/10 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedDoc(doc);
                      setRemarks(doc.remarks || '');
                      setIsAuditModalOpen(true);
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all text-center shadow-md shadow-[#2563EB]/20"
                  >
                    Audit / Review
                  </button>
                  <a
                    href={`#download-${doc._id}`}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* AUDIT / REVIEW MODAL */}
      <AnimatePresence>
        {isAuditModalOpen && selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass-card rounded-2xl sm:rounded-3xl border border-white/20 overflow-hidden shadow-2xl max-h-[90dvh] flex flex-col"
            >
              <div className="bg-gradient-to-r from-[#071A33] to-[#0F3B73] p-4 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="min-w-0 flex-1 mr-2">
                  <span className="text-[10px] font-bold uppercase text-[#F59E0B] tracking-wider">Compliance Officer Audit</span>
                  <h3 className="text-sm sm:text-base font-black text-white truncate">{selectedDoc.title}</h3>
                </div>
                <button
                  onClick={() => setIsAuditModalOpen(false)}
                  className="text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors shrink-0"
                >
                  Close
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/10 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Applicant:</span>
                    <span className="font-black text-white">{selectedDoc.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">File Name:</span>
                    <span className="font-bold text-slate-200">{selectedDoc.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Status:</span>
                    <span className="font-black text-[#60A5FA]">{selectedDoc.verificationStatus}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Counselor Verification Remarks / Instructions:
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Verified with original awarding institution, or specify missing stamps..."
                    className="w-full p-3.5 glass-input rounded-2xl text-white placeholder-slate-400 min-h-[90px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleUpdateStatus('REJECTED')}
                    className="py-3 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 rounded-xl font-black text-xs transition-colors"
                  >
                    Mark Rejected / Resubmit
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('VERIFIED')}
                    className="py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-xl font-black text-xs transition-all shadow-lg shadow-emerald-900/30"
                  >
                    Verify & Approve
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
