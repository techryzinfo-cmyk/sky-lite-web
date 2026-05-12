'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, UserPlus, UserCog, Mail, Lock, Phone, FolderOpen, Check, ChevronDown, Search } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all';

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
  });

  const toast = useToast();
  const isEditing = !!initialData;

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      try {
        const [rolesRes, projectsRes] = await Promise.all([
          api.get('/roles'),
          api.get('/projects'),
        ]);
        setRoles(rolesRes.data || []);
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data?.projects ?? []);
      } catch {
        // silent
      }
    };
    load();

    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        mobile: initialData.mobile || initialData.phone || '',
        password: '',
      });
      setSelectedRole(
        typeof initialData.role === 'object' ? initialData.role : null
      );
      setSelectedProjects(initialData.projects || []);
    } else {
      setFormData({ name: '', email: '', mobile: '', password: '' });
      setSelectedRole(null);
      setSelectedProjects([]);
    }
    setProjectSearch('');
  }, [isOpen, initialData]);

  const toggleProject = (project: any) => {
    setSelectedProjects(prev =>
      prev.some(p => p._id === project._id)
        ? prev.filter(p => p._id !== project._id)
        : [...prev, project]
    );
  };

  const filteredProjects = projects.filter(p =>
    p.name?.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }
    setIsLoading(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        role: selectedRole._id || selectedRole.name,
        projectIds: selectedProjects.map(p => p._id),
      };
      if (formData.password) payload.password = formData.password;

      if (isEditing) {
        await api.patch(`/users/${initialData._id}`, payload);
        toast.success('Member updated successfully!');
      } else {
        payload.password = formData.password;
        await api.post('/users', payload);
        toast.success('Team member onboarded successfully!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isEditing ? 'Failed to update user' : 'Failed to onboard user'));
    } finally {
      setIsLoading(false);
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
            <GlassCard className="border-gray-200" gradient>
              <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                      {isEditing ? <UserCog className="w-6 h-6 text-blue-600" /> : <UserPlus className="w-6 h-6 text-blue-600" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {isEditing ? 'Edit Member' : 'Add New Member'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isEditing ? 'Update team member details.' : 'Invite a team member to the platform.'}
                      </p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Full Name</label>
                    <input
                      type="text" required value={formData.name}
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      className={inputCls} placeholder="e.g. Rahul Sharma"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email" required value={formData.email}
                        onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                        className={`${inputCls} pl-10`} placeholder="rahul@example.com"
                      />
                    </div>
                  </div>

                  {/* Mobile + Password */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Mobile Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                          type="tel" value={formData.mobile}
                          onChange={e => setFormData(f => ({ ...f, mobile: e.target.value }))}
                          className={`${inputCls} pl-10`} placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">
                        {isEditing ? 'New Password' : 'Password'}
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                          type="password" required={!isEditing} value={formData.password}
                          onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                          className={`${inputCls} pl-10`}
                          placeholder={isEditing ? 'Leave blank to keep' : '••••••••'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role Selector — pills */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">Access Role</label>
                    <div className="flex flex-wrap gap-2">
                      {roles.map(role => (
                        <button
                          key={role._id} type="button"
                          onClick={() => setSelectedRole(role)}
                          className={cn(
                            'px-4 py-2 rounded-xl border text-sm font-bold transition-all',
                            selectedRole?._id === role._id
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-gray-50 border-gray-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                          )}
                        >
                          {role.name}
                        </button>
                      ))}
                      {roles.length === 0 && (
                        <p className="text-sm text-slate-400">No roles available</p>
                      )}
                    </div>
                  </div>

                  {/* Projects Multi-select */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-700">Assign to Projects</label>
                      <span className="text-xs text-slate-400">{selectedProjects.length} selected</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsProjectPickerOpen(true)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
                        {selectedProjects.length === 0 ? (
                          <span className="text-slate-400">Select projects...</span>
                        ) : (
                          <span className="truncate font-semibold">
                            {selectedProjects.map(p => p.name).join(', ')}
                          </span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 flex space-x-3 border-t border-gray-200">
                    <button
                      type="button" onClick={onClose}
                      className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit" disabled={isLoading}
                      className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>{isEditing ? 'Saving...' : 'Adding...'}</span></>
                      ) : (
                        <span>{isEditing ? 'Save Changes' : 'Add Member'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}

      {/* Project Picker Modal */}
      <AnimatePresence>
        {isProjectPickerOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsProjectPickerOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md relative z-10"
            >
              <GlassCard className="border-gray-200 p-6" gradient>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-900">Select Projects</h3>
                  <button onClick={() => setIsProjectPickerOpen(false)} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text" value={projectSearch}
                    onChange={e => setProjectSearch(e.target.value)}
                    className={`${inputCls} pl-10`} placeholder="Search projects..."
                    autoFocus
                  />
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                  {filteredProjects.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">No projects found</p>
                  ) : filteredProjects.map(project => {
                    const isSelected = selectedProjects.some(p => p._id === project._id);
                    return (
                      <button
                        key={project._id} type="button"
                        onClick={() => toggleProject(project)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-gray-50 border-gray-200 text-slate-700 hover:border-blue-200'
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{project.name}</p>
                          {project.status && (
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{project.status}</p>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button" onClick={() => setSelectedProjects([])}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold transition-all text-sm"
                  >
                    Clear All
                  </button>
                  <button
                    type="button" onClick={() => setIsProjectPickerOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-sm shadow-lg shadow-blue-600/20"
                  >
                    Done ({selectedProjects.length})
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};
