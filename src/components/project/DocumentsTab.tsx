'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Files,
  Upload,
  Trash2,
  Download,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileImage,
  Film,
  Plus,
  X,
  FolderOpen,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { uploadToCloudinary } from '@/lib/upload';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES = ['Contract', 'Specification', 'Report', 'RFI', 'Submittal', 'Meeting Minutes', 'Other'] as const;
type Category = typeof CATEGORIES[number];

interface Doc {
  _id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  category: Category;
  uploadedAt: string;
  uploadedBy?: { name: string };
}

function fileIcon(mimeType: string) {
  if (mimeType?.startsWith('image/')) return FileImage;
  if (mimeType?.startsWith('video/')) return Film;
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || mimeType?.includes('csv')) return FileSpreadsheet;
  return FileText;
}

function fmtSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

const CATEGORY_COLORS: Record<Category, string> = {
  'Contract':        'bg-blue-100 border-blue-200 text-blue-700',
  'Specification':   'bg-purple-100 border-purple-200 text-purple-700',
  'Report':          'bg-emerald-100 border-emerald-200 text-emerald-700',
  'RFI':             'bg-amber-100 border-amber-200 text-amber-700',
  'Submittal':       'bg-orange-100 border-orange-200 text-orange-700',
  'Meeting Minutes': 'bg-cyan-100 border-cyan-200 text-cyan-700',
  'Other':           'bg-gray-100 border-gray-200 text-gray-700',
};

interface DocumentsTabProps {
  projectId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ projectId }) => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingCategory, setPendingCategory] = useState<Category>('Other');
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'Admin';

  const fetchDocs = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/documents`);
      setDocs(Array.isArray(res.data) ? res.data : res.data?.documents ?? []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, [projectId]);

  const openUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setIsModalOpen(true);
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(pendingFile);
      await api.post(`/projects/${projectId}/documents`, {
        url,
        name: pendingFile.name,
        mimeType: pendingFile.type,
        size: pendingFile.size,
        category: pendingCategory,
      });
      toast.success('Document uploaded successfully');
      setIsModalOpen(false);
      setPendingFile(null);
      fetchDocs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${projectId}/documents/${docId}`);
      toast.success('Document deleted');
      fetchDocs();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const filtered = activeCategory === 'All'
    ? docs
    : docs.filter(d => d.category === activeCategory);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Project Documents</h3>
          <p className="text-sm text-slate-500 mt-1">Contracts, reports, RFIs, submittals and other project files.</p>
        </div>
        <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 border border-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
          <input type="file" className="hidden" onChange={openUpload} />
        </label>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['All', ...CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
              activeCategory === cat
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-gray-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
            )}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1.5 opacity-60">{docs.filter(d => d.category === cat).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Files', value: docs.length, color: 'text-blue-600' },
          { label: 'Contracts', value: docs.filter(d => d.category === 'Contract').length, color: 'text-purple-600' },
          { label: 'RFIs', value: docs.filter(d => d.category === 'RFI').length, color: 'text-amber-600' },
          { label: 'Reports', value: docs.filter(d => d.category === 'Report').length, color: 'text-emerald-600' },
        ].map((s, i) => (
          <GlassCard key={i} className="p-4 border-gray-200" gradient>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Documents list */}
      <GlassCard className="p-0 border-gray-200 overflow-hidden" gradient>
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-slate-500 font-medium">No documents in this category.</p>
            <p className="text-slate-400 text-sm mt-1">Upload your first document to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_80px_80px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
              {['Name', 'Category', 'Uploaded', 'Size', ''].map(h => (
                <span key={h} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</span>
              ))}
            </div>

            {filtered.map(doc => {
              const Icon = fileIcon(doc.mimeType);
              return (
                <div key={doc._id} className="grid grid-cols-[2fr_1fr_1fr_80px_80px] gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors group">
                  {/* Name */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
                      {doc.uploadedBy?.name && (
                        <p className="text-[10px] text-slate-400">{doc.uploadedBy.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border w-fit',
                    CATEGORY_COLORS[doc.category] || CATEGORY_COLORS['Other']
                  )}>
                    {doc.category}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-slate-500">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>

                  {/* Size */}
                  <span className="text-xs font-semibold text-slate-500">{fmtSize(doc.size)}</span>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(doc._id, doc.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Upload category picker modal */}
      <AnimatePresence>
        {isModalOpen && pendingFile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsModalOpen(false); setPendingFile(null); }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md relative z-10"
            >
              <GlassCard className="p-8 border-gray-200" gradient>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                      <Files className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Upload Document</h3>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{pendingFile.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsModalOpen(false); setPendingFile(null); }}
                    className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-600 mb-3 block">Document Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setPendingCategory(cat)}
                          className={cn(
                            'px-3 py-2 rounded-xl text-xs font-bold border text-left transition-all',
                            pendingCategory === cat
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-gray-50 border-gray-200 text-slate-600 hover:border-blue-300'
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => { setIsModalOpen(false); setPendingFile(null); }}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Upload</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
