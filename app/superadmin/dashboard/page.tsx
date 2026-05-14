'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Building2, ShieldCheck, Activity, Search, Plus, Loader2, LogOut, Settings, X, Eye, EyeOff, Trash2, MoreVertical } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [adminMenuId, setAdminMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const router = useRouter();

  const fetchAdmins = async () => {
    try {
      const [adminsRes, statsRes] = await Promise.allSettled([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/admins`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/stats`, { withCredentials: true }),
      ]);
      if (adminsRes.status === 'fulfilled') {
        setAdmins(adminsRes.value.data);
      } else {
        router.push('/superadmin/login');
        return;
      }
      if (statsRes.status === 'fulfilled') {
        setPlatformStats(statsRes.value.data);
      }
    } catch {
      router.push('/superadmin/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  useEffect(() => {
    if (!adminMenuId) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAdminMenuId(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [adminMenuId]);

  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/auth/logout`, {}, { withCredentials: true });
    } catch {}
    router.push('/superadmin/login');
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/admins`, createForm, { withCredentials: true });
      toast.success('Admin account created');
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    setAdminMenuId(null);
    if (!window.confirm(`Delete admin "${adminName}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/admins/${adminId}`, { withCredentials: true });
      toast.success('Admin removed');
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing System Core...</p>
      </div>
    );
  }

  const filteredAdmins = admins.filter(a =>
    a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Platform Admins', value: admins.length, icon: ShieldCheck, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Active Tenants', value: platformStats?.activeTenants ?? '—', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Global Users', value: platformStats?.totalUsers != null ? platformStats.totalUsers.toLocaleString() : '—', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'API Uptime', value: platformStats?.apiUptime != null ? `${platformStats.apiUptime}%` : '—', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider shadow-sm shadow-red-600/20 transition-all active:scale-[0.98]"
          >
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search identity..."
                className="bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAdmins.map((admin) => (
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
                  <div className="relative" ref={adminMenuId === admin._id ? menuRef : null}>
                    <button
                      onClick={() => setAdminMenuId(adminMenuId === admin._id ? null : admin._id)}
                      className="p-2 text-slate-400 hover:text-gray-700 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {adminMenuId === admin._id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                        <button
                          onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                          className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Admin</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredAdmins.length === 0 && (
              <div className="md:col-span-2 lg:col-span-3 py-16 text-center text-slate-400 italic">
                No admins match your search.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Admin Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <div className="w-full max-w-md relative z-10 bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">New Platform Admin</h3>
                <p className="text-xs text-slate-500 mt-0.5">This account will have full system access.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Admin Name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@system.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 characters"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 pr-12 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gray-700 transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                This admin will have unrestricted access to all platform resources. Use with caution.
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center space-x-2">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{isCreating ? 'Creating...' : 'Create Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
