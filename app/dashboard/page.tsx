'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Briefcase, CheckSquare, AlertCircle, TrendingUp } from 'lucide-react';

import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';

export default function DashboardPage() {
  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Project Intelligence</h1>
          <p className="text-slate-400 mt-2 text-lg">Centralized command center for all construction operations.</p>
        </div>

        <OverviewDashboard />
      </div>
    </Shell>
  );
}
