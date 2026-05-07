'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldPlus,
  MoreVertical,
  Users,
  CheckCircle2,
  Lock,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { RoleModal } from './RoleModal';

export const RoleList = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toast = useToast();

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load access roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading permission matrices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 text-slate-500">
          <Info className="w-4 h-4" />
          <p className="text-sm">Manage Role-Based Access Control (RBAC) across all projects.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-white border border-gray-200 hover:border-blue-500/50 hover:bg-blue-50 text-gray-900 px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] shadow-sm"
        >
          <ShieldPlus className="w-4 h-4 text-blue-500" />
          <span>Define New Role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <GlassCard key={role._id} className="p-8 border-gray-200 group hover:border-blue-500/50 transition-all flex flex-col h-full" gradient>
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-2xl bg-blue-100 border border-blue-200 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-500">
                <Shield className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <button className="p-2 text-slate-400 hover:text-gray-900 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <h4 className="text-2xl font-black text-gray-900 mb-2">{role.name}</h4>
            <div className="flex items-center space-x-3 text-slate-500 mb-6 font-bold uppercase tracking-widest text-[10px]">
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{role.userCount || 0} Users Assigned</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <div className="flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>{role.permissions?.length || 0} Permissions</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 mb-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Key Privileges</p>
              {role.permissions?.slice(0, 4).map((perm: string, i: number) => (
                <div key={i} className="flex items-center space-x-2 text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs">{perm.replace(':', ' ')}</span>
                </div>
              ))}
              {role.permissions?.length > 4 && (
                <p className="text-[10px] font-bold text-slate-400 pt-1">+{role.permissions.length - 4} more permissions...</p>
              )}
            </div>

            <button className="w-full py-4 px-6 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all active:scale-[0.98] group/btn">
              <span className="flex items-center justify-center space-x-2">
                <span>Manage Permissions</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </span>
            </button>
          </GlassCard>
        ))}

        {roles.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-500">No roles defined</h3>
            <p className="text-slate-400 mt-1">Start by defining system access levels.</p>
          </div>
        )}
      </div>

      <RoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRoles}
      />
    </div>
  );
};
