'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  ShoppingCart,
  Loader2,
  CreditCard,
  Building2,
  Search,
} from 'lucide-react';
import { Shell } from '@/components/layout/Shell';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface ProjectFinanceSummary {
  _id: string;
  name: string;
  budget: number;
  totalIncoming: number;
  totalOutgoing: number;
  totalPurchases: number;
  balance: number;
}

interface LedgerItem {
  _id: string;
  type: string;
  amount: number;
  partyName: string;
  referenceNumber?: string;
  description?: string;
  date: string;
  isPurchase?: boolean;
  projectName?: string;
}

function getTxMeta(item: LedgerItem) {
  if (item.isPurchase) return { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: ShoppingCart, prefix: '-' };
  switch (item.type) {
    case 'Incoming': return { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: ArrowDownLeft, prefix: '+' };
    case 'Outgoing': return { color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: ArrowUpRight, prefix: '-' };
    case 'Debit Note': return { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle, prefix: '+' };
    default: return { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: CreditCard, prefix: '' };
  }
}

export default function FinancePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, txRes] = await Promise.allSettled([
          api.get('/projects'),
          api.get('/transactions'),
        ]);

        if (projectsRes.status === 'fulfilled') {
          setProjects(projectsRes.value.data);
        }
        if (txRes.status === 'fulfilled') {
          setTransactions(txRes.value.data);
        }
      } catch {
        toast.error('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const summaries: ProjectFinanceSummary[] = projects.map(p => {
    const budget = p.budgetHistory?.[p.budgetHistory.length - 1]?.amount || 0;
    const projectTx = transactions.filter((t: any) => t.projectId === p._id);
    const totalIncoming = projectTx.filter(t => t.type === 'Incoming').reduce((s, t) => s + t.amount, 0);
    const totalOutgoing = projectTx.filter(t => t.type === 'Outgoing' && !t.isPurchase).reduce((s, t) => s + t.amount, 0);
    const totalPurchases = projectTx.filter(t => t.isPurchase).reduce((s, t) => s + t.amount, 0);
    return { _id: p._id, name: p.name, budget, totalIncoming, totalOutgoing, totalPurchases, balance: totalIncoming - totalOutgoing - totalPurchases };
  });

  const totalBudget = summaries.reduce((s, p) => s + p.budget, 0);
  const totalIncoming = summaries.reduce((s, p) => s + p.totalIncoming, 0);
  const totalOutgoing = summaries.reduce((s, p) => s + p.totalOutgoing + p.totalPurchases, 0);
  const netBalance = totalIncoming - totalOutgoing;

  const recentTx = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20)
    .filter(t =>
      !searchQuery ||
      t.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading financial overview...</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-900">Finance Overview</h1>
          <p className="text-slate-500 mt-1">Platform-wide financial summary across all projects.</p>
        </div>

        {/* Top-level KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Budget', value: totalBudget, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50', prefix: '₹' },
            { label: 'Total Incoming', value: totalIncoming, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', prefix: '₹' },
            { label: 'Total Outgoing', value: totalOutgoing, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50', prefix: '₹' },
            { label: 'Net Balance', value: netBalance, icon: CreditCard, color: netBalance >= 0 ? 'text-emerald-600' : 'text-red-600', bg: netBalance >= 0 ? 'bg-emerald-50' : 'bg-red-50', prefix: '₹' },
          ].map((stat, i) => (
            <GlassCard key={i} className="p-6 border-gray-200" gradient>
              <div className="flex items-center justify-between mb-4">
                <div className={cn('p-3 rounded-xl', stat.bg)}>
                  <stat.icon className={cn('w-5 h-5', stat.color)} />
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={cn('text-2xl font-black', stat.color)}>
                {stat.prefix}{Math.abs(stat.value).toLocaleString()}
              </p>
            </GlassCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Project Breakdown */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Project Breakdown</h3>
            <div className="space-y-3">
              {summaries.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-gray-200 rounded-2xl">
                  <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No projects found.</p>
                </div>
              ) : summaries.map(p => {
                const spent = p.totalOutgoing + p.totalPurchases;
                const pct = p.budget > 0 ? Math.min((spent / p.budget) * 100, 100) : 0;
                return (
                  <GlassCard key={p._id} className="p-4 border-gray-200" gradient>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-gray-900 truncate pr-2">{p.name}</p>
                      <span className={cn('text-xs font-black shrink-0', p.balance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {p.balance >= 0 ? '+' : ''}₹{p.balance.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200 mb-2">
                      <div
                        className={cn('h-full rounded-full', pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>Spent: ₹{spent.toLocaleString()}</span>
                      <span>Budget: ₹{p.budget.toLocaleString()}</span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Transactions</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-xs text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-44"
                />
              </div>
            </div>

            {recentTx.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-gray-200 rounded-2xl">
                <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No transactions recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTx.map(tx => {
                  const meta = getTxMeta(tx);
                  const Icon = meta.icon;
                  return (
                    <div key={tx._id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all">
                      <div className="flex items-center space-x-3">
                        <div className={cn('p-2.5 rounded-xl border', meta.bg)}>
                          <Icon className={cn('w-4 h-4', meta.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{tx.partyName}</p>
                          <div className="flex items-center space-x-2 mt-0.5">
                            {tx.projectName && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
                                {tx.projectName}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(tx.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <span className={cn('text-sm font-black', meta.color)}>
                        {meta.prefix}₹{tx.amount?.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
