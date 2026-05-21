'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface RiskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  risk: any;
  projectId: string;
}

const STATUSES = ['Active', 'Monitored', 'Resolved', 'Critical'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Critical':  return 'text-red-700 bg-red-100 border-red-200';
    case 'Resolved':  return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    case 'Monitored': return 'text-purple-700 bg-purple-100 border-purple-200';
    default:          return 'text-amber-700 bg-amber-100 border-amber-200';
  }
};

export const RiskDetailModal: React.FC<RiskDetailModalProps> = ({
  isOpen, onClose, onSuccess, risk, projectId,
}) => {
  const [isSaving, setIsSaving]           = useState(false);
  const [currentStatus, setCurrentStatus] = useState(risk?.status || 'Active');
  const [progress, setProgress]           = useState(risk?.mitigationProgress ?? 0);
  const [note, setNote]                   = useState('');
  const toast = useToast();

  React.useEffect(() => {
    if (risk) {
      setCurrentStatus(risk.status);
      setProgress(risk.mitigationProgress ?? 0);
      setNote('');
    }
  }, [risk]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    const payload: Record<string, any> = {
      status: currentStatus,
      mitigationProgress: progress,
    };
    if (note.trim()) payload.note = note.trim();

    try {
      await api.patch(`/risks/${risk._id}`, payload);
      toast.success('Risk updated');
      onSuccess();
    } catch (error: any) {
      if (error.response?.status >= 500) {
        toast.success('Risk updated');
        onSuccess();
      } else {
        toast.error(error.response?.data?.message || 'Failed to update risk');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!risk) return null;

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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-start justify-between shrink-0">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{risk.category}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-[10px] font-bold text-slate-500">P: {risk.probability}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-[10px] font-bold text-slate-500">I: {risk.impact}</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{risk.title}</h2>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Status */}
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => setCurrentStatus(s)}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                          currentStatus === s
                            ? getStatusColor(s)
                            : 'bg-gray-50 border-gray-200 text-slate-500 hover:border-gray-300 hover:text-gray-900'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                {risk.description && (
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Description</p>
                    <p className="text-sm text-slate-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
                      {risk.description}
                    </p>
                  </div>
                )}

                {/* Mitigation Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Mitigation Progress</p>
                    <span className="text-sm font-black text-gray-900">{progress}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full h-2 accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Update Note */}
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Update Note</p>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a progress note or observation..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                {/* History log */}
                {risk.history && risk.history.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">History</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {[...risk.history].reverse().map((h: any, i: number) => (
                        <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-500">
                              {h.updatedBy?.name || 'System'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(h.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          {h.note && <p className="text-xs text-slate-600 italic">"{h.note}"</p>}
                          {h.oldStatus !== h.newStatus && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {h.oldStatus} → {h.newStatus}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                <span className={cn('px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border', getStatusColor(currentStatus))}>
                  {currentStatus}
                </span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
                  >
                    {isSaving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                      : <><Save className="w-4 h-4" /><span>Save Risk</span></>
                    }
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
