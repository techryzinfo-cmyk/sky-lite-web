'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Loader2, Check, Lock, Globe, Briefcase, FileText, Settings } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

const permissionGroups = [
  {
    id: 'projects',
    name: 'Projects',
    icon: Briefcase,
    permissions: [
      { id: 'projects:create', name: 'Create Projects' },
      { id: 'projects:edit', name: 'Edit Projects' },
      { id: 'projects:delete', name: 'Delete Projects' },
      { id: 'projects:view', name: 'View All Projects' },
    ]
  },
  {
    id: 'boq',
    name: 'BOQ & Budget',
    icon: FileText,
    permissions: [
      { id: 'boq:manage', name: 'Manage BOQ Items' },
      { id: 'boq:approve', name: 'Approve BOQ' },
      { id: 'budget:manage', name: 'Manage Budgets' },
      { id: 'budget:approve', name: 'Approve Budget Requests' },
    ]
  },
  {
    id: 'materials',
    name: 'Supply Chain',
    icon: Globe,
    permissions: [
      { id: 'materials:manage', name: 'Inventory Management' },
      { id: 'materials:purchase', name: 'Create Purchase Orders' },
      { id: 'materials:approve_request', name: 'Approve Material Requests' },
      { id: 'materials:verify_receipt', name: 'Verify GRNs' },
    ]
  },
  {
    id: 'system',
    name: 'System Admin',
    icon: Settings,
    permissions: [
      { id: 'users:manage', name: 'Manage Users' },
      { id: 'roles:manage', name: 'Manage Roles' },
      { id: 'templates:manage', name: 'Manage Templates' },
      { id: 'organization:edit', name: 'Organization Settings' },
    ]
  }
];

export const RoleModal: React.FC<RoleModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    permissions: initialData?.permissions || []
  });

  const toast = useToast();

  const togglePermission = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.permissions.includes(id);
      if (isSelected) {
        return { ...prev, permissions: prev.permissions.filter((p: string) => p !== id) };
      } else {
        return { ...prev, permissions: [...prev.permissions, id] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (initialData) {
        await api.patch(`/roles/${initialData._id}`, formData);
        toast.success('Role updated successfully');
      } else {
        await api.post('/roles', formData);
        toast.success('New role defined successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
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
            className="w-full max-w-4xl relative z-10"
          >
            <GlassCard className="border-gray-200" gradient>
              <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-blue-100 border border-blue-200">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Role' : 'Define New Role'}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Configure access levels and security permissions.</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 ml-1">Role Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                        placeholder="e.g. Project Manager"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 ml-1">Description</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                        placeholder="Brief purpose of this role"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Permissions Matrix</h3>
                      <span className="text-[10px] font-bold text-blue-600 uppercase">{formData.permissions.length} active privileges</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {permissionGroups.map((group) => (
                        <div key={group.id} className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <group.icon className="w-4 h-4 text-slate-500" />
                            <h4 className="text-sm font-bold text-gray-900">{group.name}</h4>
                          </div>

                          <div className="space-y-2">
                            {group.permissions.map((perm) => (
                              <button
                                key={perm.id}
                                type="button"
                                onClick={() => togglePermission(perm.id)}
                                className={cn(
                                  "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                                  formData.permissions.includes(perm.id)
                                    ? "bg-blue-50 border-blue-200 text-gray-900"
                                    : "bg-white border-gray-200 text-slate-500 hover:border-gray-300"
                                )}
                              >
                                <span className="text-xs font-medium">{perm.name}</span>
                                {formData.permissions.includes(perm.id) ? (
                                  <Check className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-gray-300" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 flex space-x-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-4 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-2 py-4 px-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-blue-600/20 flex items-center justify-center space-x-3"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          <span>{initialData ? 'Update Privileges' : 'Create Access Role'}</span>
                        </>
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
