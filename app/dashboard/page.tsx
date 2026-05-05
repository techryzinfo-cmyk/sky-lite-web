'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';

export default function DashboardPage() {
  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Project Intelligence</h1>
          <p className="text-slate-500 mt-1">Centralized command center for all construction operations.</p>
        </div>
        <OverviewDashboard />
      </div>
    </Shell>
  );
}
