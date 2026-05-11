'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, User, Clock, Loader2 } from 'lucide-react';
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
  isOpen,
  onClose,
  onSuccess,
  issue,
  projectId,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(issue?.status || 'Open');
  const toast = useToast();

  React.useEffect(() => {
    if (issue) setCurrentStatus(issue.status);
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

  if (!issue) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-xl relative z-10"
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    'p-3 rounded-xl border',
                    issue.priority === 'Critical'
                      ? 'bg-red-100 border-red-200 text-red-600'
                      : 'bg-amber-100 border-amber-200 text-amber-600'
                  )}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border', getPriorityColor(issue.priority))}>
                        {issue.priority}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{issue.category}</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{issue.title}</h2>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Update Status</p>
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

                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[80px]">
                    {issue.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned To</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{issue.assignedTo?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reported</p>
                      <p className="text-sm font-semibold text-gray-900">{new Date(issue.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
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
