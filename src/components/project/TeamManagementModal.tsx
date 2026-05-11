'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Loader2, Search, Check, Trash2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  currentMembers: any[];
}

const ROLES = ['Project Manager', 'Site Engineer', 'Supervisor', 'Architect', 'Client', 'Contractor', 'Consultant', 'Labour', 'Other'];

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen, onClose, onSuccess, projectId, currentMembers,
}) => {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<{ userId: string; name: string; email: string; role: string; avatar?: string }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');

    const normalized = (currentMembers || []).map((m: any) => {
      const user = m.user || m;
      return {
        userId: user._id || user,
        name: user.name || m.name || 'Member',
        email: user.email || m.email || '',
        role: m.role || 'Site Engineer',
        avatar: user.avatar || m.avatar,
      };
    });
    setMembers(normalized);

    setLoading(true);
    api.get('/users')
      .then(r => setAllUsers(r.data?.users || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const memberIds = new Set(members.map(m => m.userId));

  const filteredUsers = allUsers.filter(u =>
    !memberIds.has(u._id) &&
    (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const addMember = (user: any) => {
    setMembers(prev => [...prev, { userId: user._id, name: user.name, email: user.email, role: 'Site Engineer', avatar: user.avatar }]);
    setSearch('');
  };

  const removeMember = (userId: string) => {
    setMembers(prev => prev.filter(m => m.userId !== userId));
  };

  const updateRole = (userId: string, role: string) => {
    setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role } : m));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/projects/${projectId}`, {
        members: members.map(m => ({ user: m.userId, role: m.role })),
      });
      toast.success('Team updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update team');
    } finally {
      setSaving(false);
    }
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
            className="w-full max-w-lg relative z-10"
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Manage Team</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''} assigned</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                {/* Add user search */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Team Member</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search users to add..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {search.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      {loading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          {allUsers.length === 0 ? 'No users found' : 'All matching users already added'}
                        </p>
                      ) : (
                        <div className="max-h-40 overflow-y-auto">
                          {filteredUsers.slice(0, 6).map(user => (
                            <button
                              key={user._id}
                              onClick={() => addMember(user)}
                              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
                            >
                              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {user.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                              </div>
                              <UserPlus className="w-4 h-4 text-blue-500 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Current members */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Current Team ({members.length})
                  </label>
                  {members.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6 border border-dashed border-gray-200 rounded-xl">
                      No members yet. Search above to add team members.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {members.map(member => (
                        <div key={member.userId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {member.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                          </div>
                          <select
                            value={member.role}
                            onChange={e => updateRole(member.userId, e.target.value)}
                            className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/30 shrink-0"
                          >
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button
                            onClick={() => removeMember(member.userId)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                  disabled={saving}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm shadow-blue-600/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Team</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
