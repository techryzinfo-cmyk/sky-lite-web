'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  Search, 
  Plus,
  Loader2,
  Settings,
  LogOut
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      // If unauthorized, redirect to login
      router.push('/superadmin/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('superadmin_token');
    router.push('/superadmin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing System Core...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-red-500/30">
      {/* Top Bar */}
      <header className="h-20 border-b border-white/5 backdrop-blur-xl sticky top-0 z-40 px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-black tracking-tight">SuperAdmin <span className="text-red-500">Portal</span></h2>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Live</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Terminate Session</span>
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black tracking-tighter">System Overview</h1>
            <p className="text-slate-500 mt-2 text-lg">Central control for organizational tenants and platform administrators.</p>
          </div>
          <button className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all active:scale-[0.98]">
            <Plus className="w-5 h-5" />
            <span>Create Admin</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Platform Admins', value: admins.length, icon: ShieldCheck, color: 'text-red-500' },
            { label: 'Active Tenants', value: '12', icon: Building2, color: 'text-blue-500' },
            { label: 'Global Users', value: '1,420', icon: Users, color: 'text-purple-500' },
            { label: 'API Uptime', value: '99.9%', icon: Activity, color: 'text-emerald-500' },
          ].map((stat, i) => (
            <GlassCard key={i} className="p-6 border-white/5" gradient>
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/10", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-1 text-emerald-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">Stable</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-white">{stat.value}</p>
            </GlassCard>
          ))}
        </div>

        {/* Admins Table */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Platform Administrators</h3>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-red-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search identity..." 
                className="bg-slate-900/50 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {admins.map((admin) => (
              <GlassCard key={admin._id} className="p-6 border-white/5 hover:border-red-500/30 transition-all group" gradient>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center font-black text-white shadow-lg">
                    {admin.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-red-400 transition-colors">{admin.name}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{admin.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Root Access</span>
                  </div>
                  <button className="p-2 text-slate-500 hover:text-white transition-all">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
