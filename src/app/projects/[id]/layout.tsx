'use client';
import React, { useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { Shell } from '@/components/layouts/Shell';
import { SkeletonLoader } from '@/components/skeletons/SkeletonLoader';
import { CreateProjectModal } from '@/components/modals/CreateProjectModal';
import { TeamManagementModal } from '@/features/projects/components/TeamManagementModal';
import { SendForSurveyModal } from '@/features/projects/site-survey/components/SendForSurveyModal';
import { ProjectProvider, useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/providers/ToastContext';
import {
  Info, FileText, DollarSign, Package, Files, Map,
  AlertCircle, ShieldAlert, Calendar,
  TrendingUp, GanttChart, ClipboardList, CreditCard,
  ChevronLeft, Pencil, MessageSquare, Users,
  ClipboardCheck, History
} from 'lucide-react';

const tabs = [
  { id: 'details',      name: 'Details',        icon: Info },
  { id: 'boq',         name: 'BOQ',             icon: FileText },
  { id: 'budget',      name: 'Budget',           icon: DollarSign },
  { id: 'materials',   name: 'Materials',        icon: Package },
  { id: 'documents',   name: 'Documents',        icon: Files },
  { id: 'plans',       name: 'Plans',            icon: Map },
  { id: 'issues',      name: 'Issues & Snags',   icon: AlertCircle },
  { id: 'risks',       name: 'Risks',            icon: ShieldAlert },
  { id: 'milestones',  name: 'Milestones',       icon: Calendar },
  { id: 'progress',    name: 'Progress',         icon: TrendingUp },
  { id: 'timeline',    name: 'Timeline',         icon: GanttChart },
  { id: 'site-survey', name: 'Site Survey',      icon: ClipboardList },
  { id: 'transactions', name: 'Transactions',    icon: CreditCard },
  { id: 'chat',        name: 'Chat',             icon: MessageSquare },
  { id: 'handover',     name: 'Handover',         icon: ClipboardCheck },
  { id: 'audit',        name: 'Audit Trail',      icon: History },
];

const statusBadgeColor: Record<string, string> = {
  'Initialized':        'bg-blue-100 text-blue-700 border-blue-200',
  'Planning':           'bg-purple-100 text-purple-700 border-purple-200',
  'Site Survey':        'bg-cyan-100 text-cyan-700 border-cyan-200',
  'In Progress':        'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Under Snagging':     'bg-amber-100 text-amber-700 border-amber-200',
  'Snagging Completed': 'bg-orange-100 text-orange-700 border-orange-200',
  'Completed':          'bg-green-100 text-green-700 border-green-200',
  'On Hold':            'bg-gray-100 text-slate-600 border-gray-200',
  'Cancelled':          'bg-red-100 text-red-700 border-red-200',
};

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { project, loading, fetchProject, projectId } = useProjectContext();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isSurveyAssignOpen, setIsSurveyAssignOpen] = useState(false);

  // Derive active tab from pathname
  const activeTab = tabs.find(t => pathname.endsWith(`/${t.id}`))?.id || 'details';

  return (
    <Shell>
      <SkeletonLoader loading={loading} preset="detail">
        {!project && !loading ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
            <button onClick={() => router.push('/projects')} className="text-blue-600 mt-4 font-medium hover:text-blue-700">Back to Projects</button>
          </div>
        ) : project ? (
          <>
          <div className="space-y-0">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-5 py-3 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    onClick={() => router.push('/projects')}
                    className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-400 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-base font-bold text-gray-900 truncate leading-tight max-w-[200px] sm:max-w-none">
                        {project.name}
                      </h1>
                      <span className={cn(
                        'px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border shrink-0 leading-tight',
                        statusBadgeColor[project.status] || 'bg-blue-100 text-blue-700 border-blue-200'
                      )}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-3 -mx-5" />

              <div className="flex overflow-x-auto scrollbar-hide -mb-3 mt-0">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => router.push(`/projects/${projectId}/${tab.id}`)}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-all relative shrink-0 border-b-2",
                        isActive
                          ? "text-blue-600 border-blue-600"
                          : "text-slate-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                      )}
                    >
                      <tab.icon className={cn("w-3.5 h-3.5", isActive ? "text-blue-600" : "text-slate-400")} />
                      {tab.name}
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
