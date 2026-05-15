'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ChevronRight,
  Activity,
  Layers,
  BarChart3,
  Target,
  CreditCard,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';

export const OverviewDashboard = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [materials, setMaterials] = useState<{ requested: number; received: number; pending: number }>({ requested: 0, received: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/projects');
        const projectList = Array.isArray(res.data)
          ? res.data
          : res.data?.projects ?? res.data?.data ?? [];
        setProjects(projectList);
        const first5 = projectList.slice(0, 5);
        const [msResults, issueResults, materialResults] = await Promise.all([
          Promise.allSettled(first5.map((p: any) => api.get(`/projects/${p._id}/milestones`))),
          Promise.allSettled(first5.map((p: any) => api.get(`/projects/${p._id}/issues`))),
          Promise.allSettled(first5.map((p: any) => api.get(`/projects/${p._id}/material-requests`))),
        ]);
        const allMs = msResults.flatMap(r => r.status === 'fulfilled' ? r.value.data : []);
        const allIssues = issueResults.flatMap(r => r.status === 'fulfilled' ? r.value.data : []);
        const allMrReqs = materialResults.flatMap(r => r.status === 'fulfilled' ? r.value.data : []);
        setMilestones(allMs);
        setIssues(allIssues);
        setMaterials({
          requested: allMrReqs.length,
          received: allMrReqs.filter((m: any) => m.status === 'Delivered' || m.status === 'Received').length,
          pending: allMrReqs.filter((m: any) => m.status === 'Pending' || m.status === 'Approved').length,
        });
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalBudget = projects.reduce((acc, p) => acc + (p.budgetHistory?.[p.budgetHistory?.length - 1]?.amount || 0), 0);
  const completedMs = milestones.filter(m => m.status === 'Completed').length;
  const msCompletionPct = milestones.length > 0 ? Math.round((completedMs / milestones.length) * 100) : 0;

  const stats = [
    {
      name: 'Active Projects',
      value: projects.filter(p => p.status === 'In Progress' || p.status === 'Planning').length.toString(),
      icon: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      trend: `${projects.length} total projects`
    },
    {
      name: 'Total Budget',
      value: totalBudget >= 1_000_000
        ? `₹${(totalBudget / 1_000_000).toFixed(1)}M`
        : `₹${(totalBudget / 1_000).toFixed(0)}K`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      trend: 'Across all projects'
    },
    {
      name: 'Milestones Done',
      value: `${completedMs}/${milestones.length}`,
      icon: Target,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      trend: `${msCompletionPct}% completion rate`
    },
    {
      name: 'Completed',
      value: projects.filter(p => p.status === 'Completed').length.toString(),
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      trend: 'Projects handed over'
    },
  ];

  const statusDistribution = projects.reduce((acc: any, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 rounded-3xl bg-gray-50 animate-pulse border border-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <GlassCard key={stat.name} className="p-6 border-gray-200 group hover:border-blue-500/30 transition-all" gradient>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-blue-100 transition-colors">
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.name}</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{stat.value}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{stat.trend}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project Pipeline */}
        <GlassCard className="lg:col-span-2 p-8 border-gray-200" gradient>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-100 border border-blue-200">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Project Pipeline</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-black mt-0.5">Status Distribution</p>
              </div>
            </div>
            <Link href="/projects" className="text-[10px] font-black text-blue-600 hover:text-blue-500 uppercase tracking-[0.2em] transition-colors flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-6">
            {Object.entries(statusDistribution).map(([status, count]: any, i) => {
              const percentage = (count / projects.length) * 100;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-bold text-gray-900">{status}</span>
                    <span className="text-xs font-black text-slate-500">{count} Projects ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: i * 0.1, duration: 0.8 }}
                      className={cn(
                        "h-full rounded-full",
                        status === 'Execution' ? "bg-blue-500" :
                        status === 'Completed' ? "bg-emerald-500" : "bg-gray-300"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Global Activity Feed [C7] */}
        <GlassCard className="p-8 border-gray-200" gradient>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 rounded-xl bg-purple-100 border border-purple-200">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Live Feed</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-black mt-0.5">Global Audit Trail</p>
            </div>
          </div>

          {(() => {
            const actionDot: Record<string, string> = {
              created: 'bg-emerald-500',
              updated: 'bg-blue-500',
              deleted: 'bg-red-500',
              approved: 'bg-emerald-500',
              rejected: 'bg-red-500',
              status_changed: 'bg-amber-500',
            };

            const allEntries = projects.flatMap(p =>
              (p.auditTrail || []).map((entry: any) => ({
                ...entry,
                projectName: p.name,
                projectId: p._id,
              }))
            ).sort((a: any, b: any) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime()).slice(0, 8);

            const fallbackEntries = projects.slice(0, 5).map(p => ({
              details: `Project "${p.name}" was last modified`,
              projectName: p.name,
              updatedByName: p.members?.[0]?.user?.name || 'Team',
              timestamp: p.updatedAt,
              action: 'updated',
            }));

            const feed = allEntries.length > 0 ? allEntries : fallbackEntries;

            return (
              <div className="space-y-4 relative">
                <div className="absolute left-1.5 top-2 bottom-0 w-px bg-gray-200" />
                {feed.map((entry: any, i: number) => {
                  const dot = actionDot[entry.action?.toLowerCase()] || 'bg-blue-500';
                  const ts = entry.timestamp || entry.createdAt;
                  const dateStr = ts ? new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                  return (
                    <div key={i} className="flex items-start space-x-3 relative">
                      <div className={cn('w-3 h-3 rounded-full border-2 border-white z-10 mt-1.5 shrink-0', dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-900 font-medium line-clamp-2">{entry.details || entry.description || `${entry.projectName} updated`}</p>
                        <div className="flex items-center flex-wrap gap-x-2 mt-1">
                          <span className="text-[10px] font-bold text-purple-600 uppercase truncate">{entry.projectName}</span>
                          {entry.updatedByName && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                              <span className="text-[10px] text-slate-500 truncate">{entry.updatedByName}</span>
                            </>
                          )}
                          <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                          <span className="text-[10px] text-slate-400">{dateStr}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {feed.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6 pl-4">No activity recorded yet.</p>
                )}
              </div>
            );
          })()}
        </GlassCard>
      </div>

      {/* Milestone Completion + Finance + Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Milestone Completion Widget [13.5] */}
        <GlassCard className="p-6 border-gray-200" gradient>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-100 border border-purple-200">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Milestones</h4>
            </div>
            <span className="text-2xl font-black text-purple-600">{msCompletionPct}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${msCompletionPct}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-purple-500 rounded-full"
            />
          </div>
          <div className="space-y-2">
            {[
              { label: 'Completed', count: completedMs, color: 'text-emerald-600' },
              { label: 'In Progress', count: milestones.filter(m => m.status === 'In Progress').length, color: 'text-blue-600' },
              { label: 'Delayed', count: milestones.filter(m => m.status === 'Delayed').length, color: 'text-red-600' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">{row.label}</span>
                <span className={cn('font-black', row.color)}>{row.count}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Financial Summary [13.3] */}
        <GlassCard className="p-6 border-gray-200" gradient>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-200">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Financials</h4>
            </div>
            <Link href="/finance" className="text-[10px] font-black text-blue-600 hover:text-blue-500 uppercase tracking-widest transition-colors">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {projects.slice(0, 4).map(p => {
              const budget = p.budgetHistory?.[p.budgetHistory?.length - 1]?.amount || 0;
              return (
                <div key={p._id} className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 truncate max-w-[140px]">{p.name}</span>
                  <span className="text-xs font-black text-emerald-600 shrink-0">
                    ₹{budget >= 1_000_000 ? `${(budget / 1_000_000).toFixed(1)}M` : `${(budget / 1_000).toFixed(0)}K`}
                  </span>
                </div>
              );
            })}
            {projects.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No projects yet.</p>
            )}
          </div>
        </GlassCard>

        {/* Quick Links */}
        <GlassCard className="p-6 border-gray-200" gradient>
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2.5 rounded-xl bg-blue-100 border border-blue-200">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Quick Access</h4>
          </div>
          <div className="space-y-2">
            {[
              { label: 'All Projects', href: '/projects', color: 'text-blue-700 bg-blue-50 border-blue-100 hover:bg-blue-100' },
              { label: 'Finance Overview', href: '/finance', color: 'text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100' },
              { label: 'Templates', href: '/templates', color: 'text-purple-700 bg-purple-50 border-purple-100 hover:bg-purple-100' },
              { label: 'User Management', href: '/users', color: 'text-amber-700 bg-amber-50 border-amber-100 hover:bg-amber-100' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn('flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-bold transition-all', link.color)}
              >
                <span>{link.label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Material Flow + Issue Heatmap [13.2 / 13.4] */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Flow Widget [13.2] */}
        <GlassCard className="p-6 border-gray-200" gradient>
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-200">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">Material Flow</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-0.5">Across first 5 projects</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Total Requested', value: materials.requested, color: 'bg-blue-500', pct: 100 },
              { label: 'Received / Delivered', value: materials.received, color: 'bg-emerald-500', pct: materials.requested > 0 ? Math.round((materials.received / materials.requested) * 100) : 0 },
              { label: 'Pending Delivery', value: materials.pending, color: 'bg-amber-500', pct: materials.requested > 0 ? Math.round((materials.pending / materials.requested) * 100) : 0 },
            ].map(row => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">{row.label}</span>
                  <span className="font-black text-gray-900">{row.value}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.pct}%` }}
                    transition={{ duration: 0.8 }}
                    className={cn('h-full rounded-full', row.color)}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Issue & Snag Heatmap [13.4] */}
        <GlassCard className="p-6 border-gray-200" gradient>
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2.5 rounded-xl bg-red-100 border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">Issue Heatmap</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-0.5">By priority × status</p>
            </div>
          </div>
          {issues.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">No issues tracked yet.</p>
            </div>
          ) : (() => {
            const priorities = ['Critical', 'High', 'Medium', 'Low'];
            const statuses = ['Open', 'In Progress', 'Escalated', 'Resolved'];
            const heatIntensity = (count: number, max: number) => {
              if (count === 0) return 'bg-gray-100 text-gray-300';
              const pct = count / max;
              if (pct > 0.6) return 'bg-red-500 text-white';
              if (pct > 0.3) return 'bg-orange-400 text-white';
              if (pct > 0) return 'bg-amber-200 text-amber-800';
              return 'bg-gray-100 text-gray-300';
            };
            const matrix = priorities.map(p => statuses.map(s => issues.filter(i => i.priority === p && i.status === s).length));
            const maxVal = Math.max(1, ...matrix.flat());
            return (
              <div>
                <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${statuses.length}, 1fr)` }}>
                  <div />
                  {statuses.map(s => (
                    <div key={s} className="text-[9px] font-bold text-slate-500 text-center pb-1 truncate">{s}</div>
                  ))}
                  {priorities.map((p, pi) => (
                    <React.Fragment key={p}>
                      <div className="text-[10px] font-bold text-gray-700 flex items-center pr-1">{p}</div>
                      {statuses.map((s, si) => {
                        const count = matrix[pi][si];
                        return (
                          <div key={s} className={cn('rounded-lg h-9 flex items-center justify-center text-xs font-black transition-all', heatIntensity(count, maxVal))}>
                            {count || '–'}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex items-center space-x-3 mt-4 pt-3 border-t border-gray-100">
                  {[['bg-gray-100', 'None'], ['bg-amber-200', 'Low'], ['bg-orange-400', 'Med'], ['bg-red-500', 'High']].map(([c, l]) => (
                    <div key={l} className="flex items-center space-x-1">
                      <div className={cn('w-3 h-3 rounded-sm', c)} />
                      <span className="text-[10px] text-slate-500 font-semibold">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </GlassCard>
      </div>
    </div>
  );
};
