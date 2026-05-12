'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Loader2, Check, Search, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface BOQApproversModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: any;
  projectId: string;
}

export const BOQApproversModal: React.FC<BOQApproversModalProps> = ({
  isOpen, onClose, onSuccess, item, projectId,
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (!isOpen || !item) return;
    setSearch('');
    const currentApprovers: string[] = (item.approvers || []).map((a: any) => a._id || a);
    setSelected(new Set(currentApprovers));
    setLoading(true);
    api.get('/users')
      .then(r => setUsers(r.data?.users || r.data || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [isOpen, item]);

  const toggle = (userId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/projects/${projectId}/boq/${item._id}`, {
        approvers: Array.from(selected),
      });
      toast.success('Approvers updated');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update approvers');
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

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
            className="w-full max-w-md relative z-10"
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Assign Approvers</h2>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[240px]">{item.itemDescription}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {filtered.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">No users found.</p>
                    )}
                    {filtered.map(user => {
                      const isSelected = selected.has(user._id);
                      return (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => toggle(user._id)}
                          className={cn(
                            'w-full flex items-center space-x-3 p-3 rounded-xl border transition-all text-left',
                            isSelected
                              ? 'bg-purple-50 border-purple-300'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0',
                            isSelected ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
                          )}>
                            {isSelected ? <Check className="w-4 h-4" /> : user.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                          </div>
                          {user.role?.name && (
                            <span className="text-[10px] font-bold text-slate-400 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
                              {user.role.name}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selected.size > 0 && (
                  <p className="text-xs text-purple-600 font-semibold text-center">
                    {selected.size} approver{selected.size > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm shadow-purple-600/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  <span>Save Approvers</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
