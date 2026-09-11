import React, { useState, useEffect } from 'react';
import { documentAPI } from '../../services/api';
import { FileUp, FileCheck, FileX, Clock, CheckCircle2, UploadCloud, AlertCircle } from 'lucide-react';

const DOC_TYPES = ['Passport', 'Transcript', 'Degree', 'CV', 'IELTS', 'Financial Documents'];

export default function DocumentUploader({ studentId, leadId, isCounselorView = false }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('Passport');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [studentId, leadId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentAPI.getDocuments({ studentId, leadId });
      if (res.success) {
        setDocuments(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', selectedType);
      formData.append('documentName', file.name);
      if (studentId) formData.append('studentId', studentId);
      if (leadId) formData.append('leadId', leadId);

      const res = await documentAPI.upload(formData);
      if (res.success) {
        setMsg('✅ Document uploaded successfully!');
        setFile(null);
        fetchDocuments();
      }
    } catch (err) {
      setMsg(`❌ Upload failed: ${err.message || 'Error uploading file'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStatus = async (id, verificationStatus) => {
    try {
      await documentAPI.updateStatus(id, verificationStatus);
      fetchDocuments();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upload Box (Visible to Student or Counselor) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-extrabold text-brand-dark uppercase tracking-wider mb-3 flex items-center">
          <UploadCloud className="w-4 h-4 text-brand-royal mr-2" /> Upload Student Required Documents
        </h3>

        {msg && (
          <div className="p-3 mb-3 text-xs rounded-xl bg-blue-50 text-brand-dark border border-blue-200">
            {msg}
          </div>
        )}

        <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Document Type *</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-royal focus:outline-none bg-white font-semibold"
            >
              {DOC_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Select File (PDF / Image / DOCX) *</label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-royal file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-2.5 bg-brand-royal hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              <FileUp className="w-4 h-4 text-brand-gold" />
              <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Document List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-brand-dark uppercase tracking-wider">
            Uploaded Checklist & Verification Desk ({documents.length})
          </h4>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 italic">No documents uploaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3.5">Document Type</th>
                  <th className="p-3.5">File Name</th>
                  <th className="p-3.5">Upload Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-brand-dark">{doc.documentType}</td>
                    <td className="p-3.5 text-brand-royal truncate max-w-xs">{doc.documentName}</td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      {doc.verificationStatus === 'Verified' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center w-fit">
                          <FileCheck className="w-3 h-3 mr-1" /> Verified
                        </span>
                      )}
                      {doc.verificationStatus === 'Pending' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center w-fit">
                          <Clock className="w-3 h-3 mr-1" /> Pending Verification
                        </span>
                      )}
                      {doc.verificationStatus === 'Rejected' && (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center w-fit">
                          <FileX className="w-3 h-3 mr-1" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <a
                        href={doc.fileURL}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                      >
                        View File
                      </a>
                      
                      {isCounselorView && doc.verificationStatus !== 'Verified' && (
                        <button
                          onClick={() => handleUpdateStatus(doc._id, 'Verified')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                        >
                          Approve
                        </button>
                      )}
                      {isCounselorView && doc.verificationStatus !== 'Rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(doc._id, 'Rejected')}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
