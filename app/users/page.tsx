'use client';

import React, { useState } from 'react';
import { Users, Shield, UserPlus, ShieldPlus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { UserList } from '@/components/users/UserList';
import { RoleList } from '@/components/users/RoleList';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Team Management</h1>
          <p className="text-slate-400 mt-2 text-lg">Control user access, roles, and system permissions.</p>
        </div>

        <div className="flex p-1 bg-slate-900/50 border border-white/5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'users' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>
          <button 
            onClick={() => setActiveTab('roles')}
            className={cn(
              "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'roles' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Shield className="w-4 h-4" />
            <span>Roles & Permissions</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        {activeTab === 'users' ? <UserList /> : <RoleList />}
      </div>
    </div>
  );
}
