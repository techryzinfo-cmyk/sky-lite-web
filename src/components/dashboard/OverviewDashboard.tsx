'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Activity,
  Layers,
  BarChart3,
  PieChart
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { motion } from 'framer-motion';

export const OverviewDashboard = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      name: 'Active Projects',
      value: projects.filter(p => p.status === 'In Progress' || p.status === 'Execution').length.toString(),
      icon: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      trend: '+12% from last month'
    },
    {
      name: 'Total Budget Managed',
      value: `₹${(projects.reduce((acc, p) => acc + (p.budgetHistory?.[0]?.amount || 0), 0) / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      trend: 'Across all active sites'
    },
    {
      name: 'Critical Blockers',
      value: '14',
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      trend: 'Requires immediate action'
    },
    {
      name: 'Avg. Progress',
      value: '68%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      trend: 'On schedule'
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
            <button className="text-[10px] font-black text-blue-600 hover:text-blue-500 uppercase tracking-[0.2em] transition-colors">
              View Analytics
            </button>
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

        {/* Global Activity Feed */}
        <GlassCard className="p-8 border-gray-200" gradient>
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-100 border border-purple-200">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Live Feed</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-black mt-0.5">Global Audit</p>
            </div>
          </div>

          <div className="space-y-6 relative">
            <div className="absolute left-1.5 top-2 bottom-0 w-px bg-gray-200" />

            {projects.slice(0, 5).map((project, i) => (
              <div key={i} className="flex items-start space-x-4 relative">
                <div className="w-3 h-3 rounded-full bg-blue-500 border-4 border-white z-10 mt-1" />
                <div>
                  <p className="text-sm text-gray-900 font-medium line-clamp-1">
                    {project.auditTrail?.[0]?.details || `Project ${project.name} was updated`}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">{project.name}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-[10px] text-slate-500">{new Date(project.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-8 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold text-slate-500 hover:bg-gray-100 hover:text-gray-900 transition-all">
            View All Activity
          </button>
        </GlassCard>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <GlassCard className="p-6 border-gray-200 group hover:border-emerald-500/30 transition-all cursor-pointer" gradient>
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-200">
              <Layers className="w-6 h-6 text-emerald-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-1">BOQ Compliance</h4>
          <p className="text-sm text-slate-500">Track variance between estimated and actual quantities.</p>
        </GlassCard>

        <GlassCard className="p-6 border-gray-200 group hover:border-amber-500/30 transition-all cursor-pointer" gradient>
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 rounded-2xl bg-amber-100 border border-amber-200">
              <CheckSquare className="w-6 h-6 text-amber-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-1">Handover Readiness</h4>
          <p className="text-sm text-slate-500">View snagging resolution status across all completion stages.</p>
        </GlassCard>

        <GlassCard className="p-6 border-gray-200 group hover:border-purple-500/30 transition-all cursor-pointer" gradient>
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 rounded-2xl bg-purple-100 border border-purple-200">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-1">Financial Intelligence</h4>
          <p className="text-sm text-slate-500">Consolidated cash flow and payment release cycles.</p>
        </GlassCard>
      </div>
    </div>
  );
};
