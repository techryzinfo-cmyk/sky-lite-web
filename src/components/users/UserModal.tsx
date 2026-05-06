'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, UserPlus, Mail, Shield, Lock, Info } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ''
  });
  
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchRoles = async () => {
        try {
          const response = await api.get('/roles');
          setRoles(response.data);
        } catch (error) {
          console.error('Error fetching roles:', error);
        }
      };
      fetchRoles();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/users', formData);
      toast.success('Team member onboarded successfully!');
      onSuccess();
      onClose();
      setFormData({ name: '', email: '', password: '', role: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to onboard user');
    } finally {
      setIsLoading(false);
    }
  };

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
            className="w-full max-w-lg relative z-10"
          >
            <GlassCard className="border-gray-200" gradient>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                      <UserPlus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Onboard New Member</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Invite a team member to the platform.</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                        placeholder="rahul@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 ml-1">Initial Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 ml-1">Access Role</label>
                      <select
                        required
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                      >
                        <option value="">Select Role</option>
                        {roles.map(r => (
                          <option key={r._id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex space-x-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-medium transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-2 py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Onboarding...</span>
                        </>
                      ) : (
                        <span>Send Invitation</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
