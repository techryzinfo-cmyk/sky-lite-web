'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, AlertTriangle, User, Clock, Loader2, CheckCircle2,
  Image as ImageIcon, MessageSquare, Tag, MapPin, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface IssueDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  issue: any;
  projectId: string;
}

const STATUSES = ['Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Critical': return 'text-red-700 bg-red-100 border-red-200';
    case 'High': return 'text-orange-700 bg-orange-100 border-orange-200';
    case 'Medium': return 'text-amber-700 bg-amber-100 border-amber-200';
    default: return 'text-blue-700 bg-blue-100 border-blue-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Resolved':
    case 'Closed': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    case 'In Progress': return 'text-blue-700 bg-blue-100 border-blue-200';
    case 'Escalated': return 'text-purple-700 bg-purple-100 border-purple-200';
    default: return 'text-slate-600 bg-gray-100 border-gray-200';
  }
};

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  isOpen, onClose, onSuccess, issue, projectId,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(issue?.status || 'Open');
  const [resolutionNote, setResolutionNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (issue) {
      setCurrentStatus(issue.status);
      setResolutionNote(issue.resolutionNote || '');
    }
  }, [issue]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    setIsUpdating(true);
    try {
      await api.patch(`/projects/${projectId}/issues/${issue._id}`, { status: newStatus });
      setCurrentStatus(newStatus);
      toast.success('Status updated');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNote = async () => {
    if (!resolutionNote.trim()) return;
    setSavingNote(true);
    try {
      await api.patch(`/projects/${projectId}/issues/${issue._id}`, { resolutionNote });
      toast.success('Resolution note saved');
      onSuccess();
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  if (!issue) return null;

  const isResolved = currentStatus === 'Resolved' || currentStatus === 'Closed';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-xl relative z-10"
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-start justify-between shrink-0">
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    'p-3 rounded-xl border shrink-0',
                    issue.priority === 'Critical' ? 'bg-red-100 border-red-200 text-red-600' :
                    issue.priority === 'High' ? 'bg-orange-100 border-orange-200 text-orange-600' :
                    'bg-amber-100 border-amber-200 text-amber-600'
                  )}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border', getPriorityColor(issue.priority))}>
                        {issue.priority}
                      </span>
                      {issue.category && (
                        <span className="flex items-center space-x-1 text-[10px] font-bold text-slate-500">
                          <Tag className="w-3 h-3" />
                          <span>{issue.category}</span>
                        </span>
                      )}
                      {issue.location && (
                        <span className="flex items-center space-x-1 text-[10px] font-bold text-slate-500">
                          <MapPin className="w-3 h-3" />
                          <span>{issue.location}</span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-gray-900 leading-snug">{issue.title}</h2>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                {/* Status toggle */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusUpdate(s)}
                        disabled={isUpdating}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                          currentStatus === s
                            ? getStatusColor(s)
                            : 'bg-gray-50 border-gray-200 text-slate-500 hover:border-gray-300 hover:text-gray-900',
                          isUpdating && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[72px]">
                    {issue.description || 'No description provided.'}
                  </p>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned To</p>
                      <p className="text-xs font-semibold text-gray-900 truncate">{issue.assignedTo?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reported</p>
                      <p className="text-xs font-semibold text-gray-900">{new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  {issue.dueDate && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due Date</p>
                        <p className="text-xs font-semibold text-gray-900">{new Date(issue.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  )}
                  {issue.type && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                        <p className="text-xs font-semibold text-gray-900">{issue.type}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photos */}
                {issue.photos?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Site Photos ({issue.photos.length})</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {issue.photos.map((photo: string, i: number) => (
                        <a key={i} href={photo} target="_blank" rel="noreferrer">
                          <img
                            src={photo}
                            alt={`Photo ${i + 1}`}
                            className="w-full h-24 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution note */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Resolution Note</span>
                    {isResolved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </p>
                  <div className="relative">
                    <textarea
                      value={resolutionNote}
                      onChange={e => setResolutionNote(e.target.value)}
                      placeholder="Describe how this issue was resolved or add follow-up notes..."
                      rows={3}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none pr-12"
                    />
                    <button
                      onClick={handleSaveNote}
                      disabled={savingNote || !resolutionNote.trim()}
                      className="absolute right-3 bottom-3 p-1.5 text-blue-600 hover:text-blue-500 disabled:text-slate-300 transition-colors"
                      title="Save note"
                    >
                      {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  {isUpdating
                    ? <><Loader2 className="w-4 h-4 animate-spin text-blue-500" /><span className="text-xs font-bold text-blue-600">Updating...</span></>
                    : <span className={cn('px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border', getStatusColor(currentStatus))}>{currentStatus}</span>
                  }
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-100 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
