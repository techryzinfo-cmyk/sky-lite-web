'use client';

import React, { useState, useEffect } from 'react';
import { Users, Building2, ShieldCheck, Activity, Search, Plus, Loader2, LogOut, Settings } from 'lucide-react';
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
    } catch {
      router.push('/superadmin/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleLogout = () => {
    localStorage.removeItem('superadmin_token');
    router.push('/superadmin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing System Core...</p>
      </div>
    );
  }

  const stats = [
    { label: 'Platform Admins', value: admins.length, icon: ShieldCheck, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Active Tenants', value: '12', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Global Users', value: '1,420', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'API Uptime', value: '99.9%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFF] text-gray-900">
      {/* Top Bar */}
      <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-lg font-black tracking-tight text-gray-900">SuperAdmin <span className="text-red-600">Portal</span></h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">System Live</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">System Overview</h1>
            <p className="text-slate-500 mt-1">Central control for organizational tenants and platform administrators.</p>
          </div>
          <button className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider shadow-sm shadow-red-600/20 transition-all active:scale-[0.98]">
            <Plus className="w-5 h-5" />
            <span>Create Admin</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Stable</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Admins Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Platform Administrators</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search identity..."
                className="bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {admins.map((admin) => (
              <div key={admin._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-red-200 transition-all group">
                <div className="flex items-center space-x-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-black text-white shadow-sm">
                    {admin.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{admin.name}</h4>
                    <p className="text-xs text-slate-500">{admin.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Root Access</span>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-gray-700 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
