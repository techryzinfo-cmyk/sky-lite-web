'use client';
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Shell } from '@/components/layouts/Shell';
import { SkeletonLoader } from '@/components/skeletons/SkeletonLoader';
import { CreateProjectModal } from '@/components/modals/CreateProjectModal';
import { ProjectProvider, useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { cn } from '@/lib/utils';
import {
  Info, FileText, DollarSign, Package, Files, Map,
  AlertCircle, ShieldAlert, Calendar,
  TrendingUp, GanttChart, ClipboardList, CreditCard,
  ChevronLeft, Pencil, MessageSquare,
  ClipboardCheck, History, LayoutGrid, Sofa, LayoutDashboard, Clock,
} from 'lucide-react';

// ── All tab definitions ────────────────────────────────────────
const ALL_TABS = [
  { id: 'dashboard',    name: 'Dashboard',      icon: LayoutDashboard },
  { id: 'details',      name: 'Details',        icon: Info },
  { id: 'boq',          name: 'BOQ',            icon: FileText },
  { id: 'milestones',   name: 'Milestones',     icon: Calendar },
  { id: 'timeline',     name: 'Timeline',       icon: GanttChart },
  { id: 'progress',     name: 'Progress',       icon: TrendingUp },
  { id: 'transactions', name: 'Transactions',   icon: CreditCard },
  { id: 'plans',        name: 'Plans',          icon: Map },
  { id: 'documents',    name: 'Documents',      icon: Files },
  { id: 'materials',    name: 'Materials',      icon: Package },
  { id: 'site-survey',  name: 'Site Survey',    icon: ClipboardList },
  { id: 'attendance',   name: 'Attendance',     icon: Clock },
  { id: 'issues',       name: 'Issues & Snags', icon: AlertCircle },
  { id: 'risks',        name: 'Risks',          icon: ShieldAlert },
  { id: 'handover',     name: 'Handover',       icon: ClipboardCheck },
  { id: 'audit',        name: 'Audit Trail',    icon: History },
  { id: 'chat',         name: 'Chat',           icon: MessageSquare },
  { id: 'rooms',        name: 'Rooms',          icon: LayoutGrid },
  { id: 'ffe',          name: 'FFE',            icon: Sofa },
] as const;

type TabId = typeof ALL_TABS[number]['id'];

type TabGroup = {
  id: string;
  label: string;
  icon: React.ElementType;
  tabIds: TabId[];
};

// ── Group definitions (order matters — first tab in group = default landing) ──
const TAB_GROUPS: TabGroup[] = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard, tabIds: ['dashboard', 'details'] },
  { id: 'work',      label: 'Work',      icon: Calendar,        tabIds: ['boq', 'milestones', 'timeline', 'progress'] },
  { id: 'finance',   label: 'Finance',   icon: DollarSign,      tabIds: ['transactions'] },
  { id: 'site',      label: 'Site',      icon: Map,             tabIds: ['plans', 'documents', 'materials', 'site-survey', 'attendance'] },
  { id: 'quality',   label: 'Quality',   icon: ShieldAlert,     tabIds: ['issues', 'risks', 'handover', 'audit'] },
  { id: 'chat',      label: 'Chat',      icon: MessageSquare,   tabIds: ['chat'] },
  { id: 'interior',  label: 'Interior',  icon: Sofa,            tabIds: ['rooms', 'ffe'] },
];

// ── Builds visible tabs respecting project type & surveyor ──
function getVisibleTabs(projectType?: string, siteSurveyor?: any) {
  return ALL_TABS
    .filter(t => t.id !== 'site-survey' || !!siteSurveyor)
    .filter(t => t.id !== 'rooms' && t.id !== 'ffe' || projectType === 'Interior');
}

// ── Status badge colors ────────────────────────────────────────
const statusBadgeColor: Record<string, string> = {
  'Initialized':         'bg-blue-100 text-blue-700 border-blue-200',
  'Planning':            'bg-purple-100 text-purple-700 border-purple-200',
  'Site Survey':         'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Ongoing':             'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Under Snagging':      'bg-amber-100 text-amber-700 border-amber-200',
  'Snagging Completed':  'bg-orange-100 text-orange-700 border-orange-200',
  'Completed':           'bg-green-100 text-green-700 border-green-200',
  'Pending Handover':    'bg-violet-100 text-violet-700 border-violet-200',
  'Handover Rejected':   'bg-rose-100 text-rose-700 border-rose-200',
  'Handover Completed':  'bg-teal-100 text-teal-700 border-teal-200',
  'On Hold':             'bg-gray-100 text-slate-600 border-gray-200',
  'Cancelled':           'bg-red-100 text-red-700 border-red-200',
};

// ── Inner layout ───────────────────────────────────────────────
function LayoutInner({ children }: { children: React.ReactNode }) {
  const { project, loading, fetchProject, projectId } = useProjectContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const visibleTabs = getVisibleTabs(project?.projectType, project?.siteSurveyor);
  const activeTab = (ALL_TABS as readonly { id: string }[]).find(t => pathname.includes(`/${t.id}`))?.id || 'dashboard';

  return (
    <Shell>
      <SkeletonLoader loading={loading} preset="detail">
        {!project && !loading ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
            <button
              onClick={() => router.push('/projects')}
              className="mt-4 text-blue-600 font-medium hover:text-blue-700"
            >
              Back to Projects
            </button>
          </div>
        ) : project ? (
          <>
            <div className="space-y-0">
              {/* ── Navigation card ── */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4">

                {/* Row 1: Back · Name · Status · Edit */}
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => router.push('/projects')}
                      className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-slate-400 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h1 className="text-sm font-bold text-gray-900 truncate max-w-[180px] sm:max-w-xs md:max-w-none">
                      {project.name}
                    </h1>
                    <span className={cn(
                      'shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border',
                      statusBadgeColor[project.status] || 'bg-blue-100 text-blue-700 border-blue-200'
                    )}>
                      {project.status}
                    </span>
                    {project.projectType && (
                      <span className="hidden md:inline shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border bg-gray-100 text-slate-500 border-gray-200">
                        {project.projectType}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    title="Edit project"
                    className="shrink-0 p-2 rounded-lg bg-gray-50 border border-gray-200 text-slate-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100" />

                {/* Row 2: All Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-3 py-2">
                  {visibleTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => router.push(`/projects/${projectId}/${tab.id}`)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0',
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                            : 'text-slate-500 hover:bg-gray-100 hover:text-gray-800'
                        )}
                      >
                        <TabIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="inline">{tab.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {children}
            </div>

            <CreateProjectModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSuccess={fetchProject}
              initialData={project || undefined}
              projectId={projectId}
            />
          </>
        ) : null}
      </SkeletonLoader>
    </Shell>
  );
}

export default function ProjectWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <LayoutInner>{children}</LayoutInner>
    </ProjectProvider>
  );
}
