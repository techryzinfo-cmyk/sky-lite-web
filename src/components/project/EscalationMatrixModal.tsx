'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitBranch, Loader2, Plus, Trash2, Save } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface EscalationRule {
  priority: string;
  escalateTo: string;
  escalateAfterHours: number;
  notifyEmails: string;
}

interface EscalationMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const defaultRules = (): EscalationRule[] =>
  PRIORITIES.map(p => ({ priority: p, escalateTo: '', escalateAfterHours: p === 'Critical' ? 2 : p === 'High' ? 8 : 24, notifyEmails: '' }));

export const EscalationMatrixModal: React.FC<EscalationMatrixModalProps> = ({ isOpen, onClose, projectId }) => {
  const [rules, setRules] = useState<EscalationRule[]>(defaultRules());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.get(`/projects/${projectId}/escalation-matrix`)
      .then(r => {
        if (r.data?.rules?.length) setRules(r.data.rules);
        else setRules(defaultRules());
      })
      .catch(() => setRules(defaultRules()))
      .finally(() => setLoading(false));
  }, [isOpen, projectId]);

  const update = (index: number, field: keyof EscalationRule, value: string | number) => {
    setRules(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/escalation-matrix`, { rules });
      toast.success('Escalation matrix saved');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save escalation matrix');
    } finally {
      setSaving(false);
    }
  };

  const priorityColors: Record<string, string> = {
    Low: 'bg-blue-50 border-blue-200 text-blue-700',
    Medium: 'bg-amber-50 border-amber-200 text-amber-700',
    High: 'bg-orange-50 border-orange-200 text-orange-700',
    Critical: 'bg-red-50 border-red-200 text-red-700',
  };

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
            className="w-full max-w-2xl relative z-10"
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200">
                    <GitBranch className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Escalation Matrix</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Configure who gets notified when issues are escalated by priority.</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rules.map((rule, i) => (
                      <div key={rule.priority} className={`p-5 rounded-2xl border ${priorityColors[rule.priority] || 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-black uppercase tracking-widest">{rule.priority} Priority</span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Escalate after {rule.escalateAfterHours}h
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-current opacity-70 uppercase tracking-wider">Escalate To (Name/Role)</label>
                            <input
                              type="text"
                              value={rule.escalateTo}
                              onChange={e => update(i, 'escalateTo', e.target.value)}
                              placeholder="e.g. Site Manager"
                              className="w-full bg-white border border-current/20 rounded-xl py-2 px-3 text-xs text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-current/20 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-current opacity-70 uppercase tracking-wider">Escalate After (Hours)</label>
                            <input
                              type="number"
                              min={1}
                              value={rule.escalateAfterHours}
                              onChange={e => update(i, 'escalateAfterHours', parseInt(e.target.value) || 1)}
                              className="w-full bg-white border border-current/20 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-current/20 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-current opacity-70 uppercase tracking-wider">Notify Emails (comma-sep)</label>
                            <input
                              type="text"
                              value={rule.notifyEmails}
                              onChange={e => update(i, 'notifyEmails', e.target.value)}
                              placeholder="a@co.com, b@co.com"
                              className="w-full bg-white border border-current/20 rounded-xl py-2 px-3 text-xs text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-current/20 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="mt-2 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        <span className="font-bold text-gray-700">How it works:</span> When an issue is marked as "Escalated", the system will notify the configured contacts based on the issue's priority level. Emails are sent after the configured hours threshold is exceeded without resolution.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3 shrink-0">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm shadow-orange-600/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Matrix</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
