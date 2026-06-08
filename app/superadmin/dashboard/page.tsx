'use client';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

import React, { useState, useEffect } from 'react';
import {
  Users, Building2, ShieldCheck, Activity, Search, Plus, Loader2, LogOut,
  X, Eye, EyeOff, Trash2, Crown, Star, Zap,
  CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, Edit2, Ban,
  ToggleRight, ToggleLeft, Calendar, Package, HardDrive, ClipboardList,
  ArrowRight, MessageSquare,
} from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL;

const saAxios = () => {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('saToken') : null;
  return token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : { withCredentials: true };
};

// ─── Plan config ──────────────────────────────────────────────────────────────
const PLAN_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  Silver:   { label: 'Silver',   color: 'text-slate-600',  bg: 'bg-slate-100',   border: 'border-slate-300', icon: Star },
  Gold:     { label: 'Gold',     color: 'text-amber-700',  bg: 'bg-amber-50',    border: 'border-amber-300', icon: Crown },
  Platinum: { label: 'Platinum', color: 'text-blue-700',   bg: 'bg-blue-50',     border: 'border-blue-300',  icon: Zap },
};

const STATUS_META: Record<string, { color: string; bg: string; dot: string }> = {
  Active:    { color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-500' },
  Trial:     { color: 'text-purple-700',  bg: 'bg-purple-50',   dot: 'bg-purple-500' },
  Suspended: { color: 'text-red-700',     bg: 'bg-red-50',      dot: 'bg-red-500' },
  Expired:   { color: 'text-gray-600',    bg: 'bg-gray-100',    dot: 'bg-gray-400' },
};

const PlanBadge = ({ plan }: { plan: string }) => {
  const m = PLAN_META[plan] ?? PLAN_META.Silver;
  const Icon = m.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border', m.color, m.bg, m.border)}>
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const m = STATUS_META[status] ?? STATUS_META.Active;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold', m.color, m.bg)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', m.dot)} />
      {status}
    </span>
  );
};

// ─── Trial countdown helper ───────────────────────────────────────────────────
function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orgs' | 'planRequests'>('orgs');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Trial' | 'Suspended' | 'Expired'>('All');

  // Orgs state (merged admins + subscriptions)
  const [orgs, setOrgs]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Plan modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingOrg, setEditingOrg]           = useState<any>(null);
  const [planForm, setPlanForm] = useState({
    plan: 'Silver', status: 'Active', trialEndsAt: '', renewalDate: '', reason: '',
    overrides: { maxProjects: '', maxUsers: '' },
  });
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Unused modal kept for compat
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [showPwd, setShowPwd]       = useState(false);

  // Plan requests state
  const [planRequests, setPlanRequests]     = useState<any[]>([]);
  const [prLoading, setPrLoading]           = useState(false);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [reviewAction, setReviewAction]     = useState<'Approved' | 'Rejected' | null>(null);
  const [reviewNote, setReviewNote]         = useState('');
  const [isReviewing, setIsReviewing]       = useState(false);

  const toast  = useToast();
  const router = useRouter();

  // ── Fetch orgs + subscriptions together, merge by orgId ────────────────────
  const fetchData = async () => {
    try {
      const [adminsRes, subsRes] = await Promise.allSettled([
        axios.get(`${API}/superadmin/admins`,        saAxios()),
        axios.get(`${API}/superadmin/subscriptions`, saAxios()),
      ]);
      if (adminsRes.status !== 'fulfilled') { router.push('/login'); return; }
      const adminList: any[] = adminsRes.value.data;
      const subMap: Record<string, any> = {};
      if (subsRes.status === 'fulfilled') {
        (subsRes.value.data as any[]).forEach(s => { subMap[String(s.orgId)] = s; });
      }
      const merged = adminList.map(a => ({
        ...a,
        subscription: subMap[String(a.orgId)]?.subscription ?? null,
        usage:        subMap[String(a.orgId)]?.usage        ?? { users: 0, projects: 0 },
      }));
      setOrgs(merged);
    } catch { router.push('/login'); }
    finally  { setLoading(false); }
  };

  const fetchPlanRequests = async () => {
    setPrLoading(true);
    try {
      const res = await axios.get(`${API}/superadmin/plan-requests`, saAxios());
      setPlanRequests(res.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load plan requests');
    } finally {
      setPrLoading(false);
    }
  };

  const handleReviewRequest = async () => {
    if (!activeReviewId || !reviewAction) return;
    setIsReviewing(true);
    try {
      await axios.patch(`${API}/superadmin/plan-requests/${activeReviewId}`, {
        action: reviewAction,
        reviewNote,
      }, saAxios());
      toast.success(`Request ${reviewAction}`);
      setActiveReviewId(null);
      setReviewNote('');
      setReviewAction(null);
      fetchPlanRequests();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to review request');
    } finally {
      setIsReviewing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (activeTab === 'planRequests') fetchPlanRequests(); }, [activeTab]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await axios.post(`${API}/superadmin/auth/logout`, {}, saAxios()); } catch {}
    sessionStorage.removeItem('saToken');
    router.push('/login');
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await axios.post(`${API}/superadmin/admins`, createForm, saAxios());
      toast.success('Admin account created');
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', email: '', password: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally { setIsCreating(false); }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!window.confirm(`Delete admin "${adminName}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/superadmin/admins/${adminId}`, saAxios());
      toast.success('Admin removed');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    }
  };

  const openPlanModal = (org: any) => {
    const sub = org.subscription;
    setEditingOrg(org);
    setPlanForm({
      plan:        sub?.plan        || 'Silver',
      status:      sub?.status      || 'Trial',
      trialEndsAt: sub?.trialEndsAt ? sub.trialEndsAt.split('T')[0] : '',
      renewalDate: sub?.renewalDate ? sub.renewalDate.split('T')[0] : '',
      reason:      '',
      overrides: {
        maxProjects: sub?.overrides?.maxProjects ?? '',
        maxUsers:    sub?.overrides?.maxUsers    ?? '',
      },
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    setIsSavingPlan(true);
    try {
      const payload: any = {
        orgId:   editingOrg.orgId,
        plan:    planForm.plan,
        status:  planForm.status,
        reason:  planForm.reason,
        overrides: {
          maxProjects: planForm.overrides.maxProjects !== '' ? Number(planForm.overrides.maxProjects) : null,
          maxUsers:    planForm.overrides.maxUsers    !== '' ? Number(planForm.overrides.maxUsers)    : null,
        },
      };
      if (planForm.trialEndsAt) payload.trialEndsAt = planForm.trialEndsAt;
      if (planForm.renewalDate) payload.renewalDate = planForm.renewalDate;

      await axios.post(`${API}/superadmin/subscriptions`, payload, saAxios());
      toast.success(`Plan updated to ${planForm.plan} for ${editingOrg.orgName}`);
      setIsPlanModalOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update plan');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleToggleSuspend = async (org: any) => {
    const sub = org.subscription;
    const newStatus = sub?.status === 'Suspended' ? 'Active' : 'Suspended';
    if (!window.confirm(`${newStatus === 'Suspended' ? 'Suspend' : 'Reactivate'} "${org.orgName}"?`)) return;
    try {
      await axios.post(`${API}/superadmin/subscriptions`, {
        orgId: org.orgId, plan: sub?.plan || 'Silver', status: newStatus,
        reason: `Manually ${newStatus.toLowerCase()} by Super Admin`,
      }, saAxios());
      toast.success(`Organization ${newStatus === 'Suspended' ? 'suspended' : 'reactivated'}`);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  if (loading) {
    return <SkeletonLoader loading={true} preset="dashboard"><div /></SkeletonLoader>;
  }

  const q = searchQuery.toLowerCase();
  const filteredOrgs = orgs.filter(o => {
    const matchSearch =
      o.orgName?.toLowerCase().includes(q) ||
      o.admin?.name?.toLowerCase().includes(q) ||
      o.admin?.email?.toLowerCase().includes(q);
    const status = o.subscription?.status || 'Trial';
    const matchFilter = statusFilter === 'All' || status === statusFilter;
    return matchSearch && matchFilter;
  });

  const planCounts = { Silver: 0, Gold: 0, Platinum: 0 };
  orgs.forEach(o => { const p = o.subscription?.plan; if (p) planCounts[p as keyof typeof planCounts]++; });

  const totalUsers  = orgs.reduce((sum, o) => sum + (o.stats?.userCount ?? o.usage?.users ?? 0), 0);
  const activeTenants = orgs.filter(o => ['Active', 'Trial'].includes(o.subscription?.status)).length;
  const suspended   = orgs.filter(o => o.subscription?.status === 'Suspended').length;

  const stats = [
    { label: 'Platform Orgs',  value: orgs.length,    icon: Building2, color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Global Users',   value: totalUsers,     icon: Users,     color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Active Tenants', value: activeTenants,  icon: Activity,  color: 'text-emerald-600',bg: 'bg-emerald-50' },
    { label: 'Suspended',      value: suspended,      icon: Ban,       color: 'text-red-600',    bg: 'bg-red-50' },
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
          <button onClick={handleLogout} className="flex items-center space-x-2 text-slate-500 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">System Overview</h1>
            <p className="text-slate-500 mt-1">Central control for organizational tenants and subscription plans.</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Plan distribution (computed from merged orgs data) */}
        {orgs.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {(['Silver', 'Gold', 'Platinum'] as const).map(plan => {
              const m = PLAN_META[plan];
              const Icon = m.icon;
              return (
                <div key={plan} className={cn('rounded-2xl border p-5 flex items-center justify-between', m.bg, m.border)}>
                  <div>
                    <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1', m.color)}>{plan} Plan</p>
                    <p className={cn('text-3xl font-black', m.color)}>{planCounts[plan]}</p>
                    <p className="text-xs text-slate-500 mt-0.5">organizations</p>
                  </div>
                  <Icon className={cn('w-10 h-10 opacity-20', m.color)} />
                </div>
              );
            })}
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 gap-1">
          {[
            { id: 'orgs',         label: 'Organizations', icon: Building2 },
            { id: 'planRequests', label: 'Plan Requests', icon: ClipboardList },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-500 hover:text-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'planRequests' && planRequests.filter(r => r.status === 'Pending').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black leading-none">
                  {planRequests.filter(r => r.status === 'Pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Organizations tab ── */}
        {activeTab === 'orgs' && (
          <div className="space-y-4">
            {/* Search + filter row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by org name or email..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['All', 'Active', 'Trial', 'Suspended', 'Expired'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors',
                      statusFilter === f
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white border-gray-200 text-slate-500 hover:border-red-300 hover:text-red-600'
                    )}
                  >
                    {f}
                    {f !== 'All' && (
                      <span className="ml-1 opacity-60">
                        ({orgs.filter(o => (o.subscription?.status || 'Trial') === f).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrgs.map((org) => {
                const sub    = org.subscription;
                const plan   = sub?.plan   || 'Silver';
                const status = sub?.status || 'Trial';
                const days   = trialDaysLeft(sub?.trialEndsAt);
                const limits = sub?.limits || {};
                const maxP   = limits.maxProjects ?? '∞';
                const maxU   = limits.maxUsers    ?? '∞';
                return (
                  <div key={org.orgId} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-red-200 transition-all group flex flex-col gap-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-black text-white shadow-sm flex-shrink-0">
                          {org.orgName?.charAt(0) || 'O'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors truncate text-sm">{org.orgName}</h4>
                          <p className="text-[11px] text-slate-400 truncate">{org.admin?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <PlanBadge plan={plan} />
                        <StatusBadge status={status} />
                      </div>
                    </div>

                    {/* Trial countdown */}
                    {status === 'Trial' && days !== null && (
                      <div className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold',
                        days <= 3 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                      )}>
                        <Clock className="w-3 h-3" />
                        {days > 0 ? `${days} day${days === 1 ? '' : 's'} left in trial` : 'Trial expired'}
                      </div>
                    )}

                    {/* Usage stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-xl p-2">
                        <p className="text-xs font-black text-gray-700">{org.stats?.userCount ?? org.usage?.users ?? 0}</p>
                        <p className="text-[10px] text-slate-400">Users</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2">
                        <p className="text-xs font-black text-gray-700">{org.stats?.projectCount ?? org.usage?.projects ?? 0}</p>
                        <p className="text-[10px] text-slate-400">Projects</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2">
                        <p className="text-xs font-black text-gray-700">{maxU} / {maxP}</p>
                        <p className="text-[10px] text-slate-400">Limits</p>
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => openPlanModal(org)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Manage Plan
                      </button>
                      <button
                        onClick={() => handleToggleSuspend(org)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                          status === 'Suspended'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        )}
                      >
                        {status === 'Suspended' ? <ToggleRight className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        {status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(org.admin?._id, org.admin?.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove admin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredOrgs.length === 0 && (
                <div className="md:col-span-3 py-16 text-center text-slate-400 italic">No organizations match your search.</div>
              )}
            </div>
          </div>
        )}

        {/* ── Plan Requests tab ── */}
        {activeTab === 'planRequests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Plan Upgrade Requests
                {planRequests.filter(r => r.status === 'Pending').length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                    {planRequests.filter(r => r.status === 'Pending').length} pending
                  </span>
                )}
              </h3>
              <button onClick={fetchPlanRequests} className="text-xs font-bold text-slate-400 hover:text-gray-700 transition-colors">
                Refresh
              </button>
            </div>

            {prLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
            ) : planRequests.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-gray-200">
                <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-bold text-gray-900">No plan requests yet</p>
                <p className="text-xs text-slate-400 mt-1">Organizations can submit upgrade requests from their settings.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {planRequests.map((req) => {
                  const isPending  = req.status === 'Pending';
                  const isApproved = req.status === 'Approved';
                  const isReviewingThis = activeReviewId === req._id;
                  const fromMeta = PLAN_META[req.currentPlan]  ?? PLAN_META.Silver;
                  const toMeta   = PLAN_META[req.requestedPlan] ?? PLAN_META.Silver;
                  const FromIcon = fromMeta.icon;
                  const ToIcon   = toMeta.icon;

                  return (
                    <div key={req._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          {/* Org + plan upgrade info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                {req.orgName?.charAt(0) || 'O'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{req.orgName || '—'}</p>
                                <p className="text-xs text-slate-400">{req.requestedByName || 'Unknown user'}</p>
                              </div>
                            </div>

                            {/* Plan change arrow */}
                            <div className="flex items-center gap-2 mt-3">
                              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border', fromMeta.color, fromMeta.bg, fromMeta.border)}>
                                <FromIcon className="w-3 h-3" />{req.currentPlan || '—'}
                              </span>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border', toMeta.color, toMeta.bg, toMeta.border)}>
                                <ToIcon className="w-3 h-3" />{req.requestedPlan}
                              </span>
                            </div>

                            {req.note && (
                              <div className="flex items-start gap-1.5 mt-3 p-3 bg-gray-50 rounded-xl">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-slate-600 italic">"{req.note}"</p>
                              </div>
                            )}

                            {!isPending && req.reviewNote && (
                              <div className={cn('flex items-start gap-1.5 mt-2 p-3 rounded-xl text-xs', isApproved ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800')}>
                                <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                <span>Review note: "{req.reviewNote}"</span>
                              </div>
                            )}
                          </div>

                          {/* Status + date + actions */}
                          <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                              isPending  ? 'bg-amber-50 text-amber-700'   :
                              isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            )}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', isPending ? 'bg-amber-500' : isApproved ? 'bg-emerald-500' : 'bg-red-500')} />
                              {req.status}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                            {isPending && !isReviewingThis && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setActiveReviewId(req._id); setReviewAction('Rejected'); setReviewNote(''); }}
                                  className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => { setActiveReviewId(req._id); setReviewAction('Approved'); setReviewNote(''); }}
                                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                                >
                                  Approve
                                </button>
                              </div>
                            )}
                            {!isPending && req.reviewedBy && (
                              <p className="text-[10px] text-slate-400">by {req.reviewedBy}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Inline review panel */}
                      {isReviewingThis && (
                        <div className={cn('border-t px-5 py-4', reviewAction === 'Approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200')}>
                          <p className={cn('text-xs font-black uppercase tracking-wider mb-3', reviewAction === 'Approved' ? 'text-emerald-700' : 'text-red-700')}>
                            {reviewAction === 'Approved' ? 'Approve' : 'Reject'} upgrade to {planRequests.find(r => r._id === activeReviewId)?.requestedPlan}
                          </p>
                          <input
                            type="text"
                            value={reviewNote}
                            onChange={e => setReviewNote(e.target.value)}
                            placeholder="Review note (optional)..."
                            className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 mb-3"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setActiveReviewId(null); setReviewAction(null); setReviewNote(''); }}
                              className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-slate-600 text-xs font-bold hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleReviewRequest}
                              disabled={isReviewing}
                              className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-50',
                                reviewAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                              )}
                            >
                              {isReviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Confirm {reviewAction}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Create Admin Modal ─────────────────────────────────────────── */}
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
                <input type="text" required autoFocus value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Admin Name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <input type="email" required value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@system.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} required minLength={8}
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 characters"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 pr-12 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all text-sm" />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gray-700 transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                This admin will have unrestricted access to all platform resources. Use with caution.
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold transition-all">Cancel</button>
                <button type="submit" disabled={isCreating} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center space-x-2">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{isCreating ? 'Creating...' : 'Create Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Plan Modal ────────────────────────────────────────────── */}
      {isPlanModalOpen && editingOrg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsPlanModalOpen(false)} />
          <div className="w-full max-w-lg relative z-10 bg-white rounded-2xl border border-gray-200 shadow-xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Manage Subscription</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingOrg.orgName}</p>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-5">
              {/* Plan selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Subscription Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Silver', 'Gold', 'Platinum'] as const).map(p => {
                    const m = PLAN_META[p];
                    const Icon = m.icon;
                    return (
                      <button
                        key={p} type="button"
                        onClick={() => setPlanForm(f => ({ ...f, plan: p }))}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                          planForm.plan === p ? `${m.bg} ${m.border} ${m.color}` : 'border-gray-200 text-slate-500 hover:border-gray-300'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-bold">{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Plan feature preview */}
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
                <p className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">{planForm.plan} includes</p>
                {planForm.plan === 'Silver' && <>
                  <p>• Up to 10 projects, 20 users</p>
                  <p>• Basic BOQ, Milestones, Materials, Issues, Risks</p>
                  <p>• 5 GB storage</p>
                </>}
                {planForm.plan === 'Gold' && <>
                  <p>• Up to 50 projects, 100 users</p>
                  <p>• Everything in Silver + BOQ Import, Interior projects</p>
                  <p>• Custom roles, Export reports, 25 GB storage</p>
                </>}
                {planForm.plan === 'Platinum' && <>
                  <p>• Unlimited projects & users</p>
                  <p>• Everything in Gold + Arabic/RTL, API access</p>
                  <p>• Dedicated support, 100 GB storage</p>
                </>}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Active', 'Trial', 'Suspended', 'Expired'].map(s => (
                    <button key={s} type="button"
                      onClick={() => setPlanForm(f => ({ ...f, status: s }))}
                      className={cn(
                        'py-2 rounded-xl border text-xs font-bold transition-all',
                        planForm.status === s
                          ? s === 'Suspended' || s === 'Expired' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'border-gray-200 text-slate-500 hover:border-gray-300'
                      )}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Trial Ends</label>
                  <input type="date" value={planForm.trialEndsAt}
                    onChange={e => setPlanForm(f => ({ ...f, trialEndsAt: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Renewal Date</label>
                  <input type="date" value={planForm.renewalDate}
                    onChange={e => setPlanForm(f => ({ ...f, renewalDate: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              </div>

              {/* Overrides */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Manual Limit Overrides <span className="text-slate-400 normal-case font-normal">(leave blank = use plan default)</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500">Max Projects</label>
                    <input type="number" min="1" value={planForm.overrides.maxProjects}
                      onChange={e => setPlanForm(f => ({ ...f, overrides: { ...f.overrides, maxProjects: e.target.value } }))}
                      placeholder="Plan default"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500">Max Users</label>
                    <input type="number" min="1" value={planForm.overrides.maxUsers}
                      onChange={e => setPlanForm(f => ({ ...f, overrides: { ...f.overrides, maxUsers: e.target.value } }))}
                      placeholder="Plan default"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Reason / Note</label>
                <input type="text" value={planForm.reason}
                  onChange={e => setPlanForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. Upgraded to Gold on annual contract"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold transition-all">Cancel</button>
                <button type="submit" disabled={isSavingPlan} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSavingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isSavingPlan ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
