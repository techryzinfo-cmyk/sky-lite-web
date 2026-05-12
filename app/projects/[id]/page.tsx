'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { CreateProjectModal } from '@/components/ui/CreateProjectModal';
import { TeamManagementModal } from '@/components/project/TeamManagementModal';
import { BOQTab } from '@/components/project/BOQTab';
import { BudgetTab } from '@/components/project/BudgetTab';
import { MaterialsTab } from '@/components/project/MaterialsTab';
import { PlansTab } from '@/components/project/PlansTab';
import { DocumentsTab } from '@/components/project/DocumentsTab';
import { IssuesTab } from '@/components/project/IssuesTab';
import { RisksTab } from '@/components/project/RisksTab';
import { SurveyTab } from '@/components/project/SurveyTab';
import { DPRTab } from '@/components/project/DPRTab';
import { MilestonesTab } from '@/components/project/MilestonesTab';
import { TransactionsTab } from '@/components/project/TransactionsTab';
import { TimelineTab } from '@/components/project/TimelineTab';
import { useProjectSocket } from '@/hooks/useProjectSocket';
import {
  Info, FileText, IndianRupee, Package, Files, Map,
  AlertCircle, ShieldAlert, Calendar,
  TrendingUp, GanttChart, ClipboardList, CreditCard,
  Loader2, ChevronLeft, Pencil,
} from 'lucide-react';
import api from '@/lib/api';
import { Project } from '@/types';
import { cn } from '@/lib/utils';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/context/ToastContext';

const tabs = [
  { id: 'details',      name: 'Details',      icon: Info },
  { id: 'boq',         name: 'BOQ',           icon: FileText },
  { id: 'budget',      name: 'Budget',         icon: IndianRupee },
  { id: 'materials',   name: 'Materials',      icon: Package },
  { id: 'documents',   name: 'Documents',      icon: Files },
  { id: 'plans',       name: 'Plans',          icon: Map },
  { id: 'issues',      name: 'Issues & Snags', icon: AlertCircle },
  { id: 'risks',       name: 'Risks',          icon: ShieldAlert },
  { id: 'milestones',  name: 'Milestones',     icon: Calendar },
  { id: 'progress',    name: 'Progress',       icon: TrendingUp },
  { id: 'timeline',    name: 'Timeline',       icon: GanttChart },
  { id: 'survey',      name: 'Site Survey',    icon: ClipboardList },
  { id: 'transactions', name: 'Finance',       icon: CreditCard },
];

const IMPLEMENTED = new Set(['details','boq','budget','materials','plans','documents','issues','risks','milestones','survey','progress','transactions','timeline']);

function ProjectWorkspaceInner() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { joinProject, leaveProject } = useSocket();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'details');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const toast = useToast();

  useProjectSocket(id as string);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch {
      console.error('Error fetching project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    joinProject(id as string);
    return () => leaveProject(id as string);
  }, [id]);

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading workspace...</p>
        </div>
      </Shell>
    );
  }

  if (!project) {
    return (
      <Shell>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          <button onClick={() => router.push('/projects')} className="text-blue-600 mt-4 font-medium hover:text-blue-700">Back to Projects</button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-0">
        {/* Compact header card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-5 py-3">
          {/* Top row: back + name + status + actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/projects')}
                className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-400 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-gray-900 truncate leading-tight">{project.name}</h1>
                  <select
                    value={project.status}
                    onChange={async (e) => {
                      try {
                        await api.patch(`/projects/${id}`, { status: e.target.value });
                        toast.success('Status updated');
                        fetchProject();
                      } catch {
                        toast.error('Failed to update status');
                      }
                    }}
                    className="bg-blue-50 border border-blue-200 rounded-md px-2 py-0.5 text-[9px] font-black text-blue-700 uppercase tracking-widest focus:outline-none cursor-pointer shrink-0 leading-tight"
                  >
                    {['Initialized','Planning','Site Survey','In Progress','Under Snagging','Snagging Completed','Completed','On Hold','Cancelled'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-mono text-slate-400">{(id as string).slice(-6).toUpperCase()}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[10px] text-slate-400">{project.members?.length || 0} members</span>
                  {project.clientName && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{project.clientName}</span>
                    </>
                  )}
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
              <button
                onClick={() => {
                  const data = {
                    project: { name: project.name, status: project.status, description: project.description, clientName: project.clientName, startDate: project.startDate, endDate: project.endDate },
                    budget: project.budgetHistory?.at(-1)?.amount,
                    members: project.members?.length,
                    exportedAt: new Date().toISOString(),
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = window.document.createElement('a');
                  a.href = url;
                  a.download = `${project.name.replace(/\s+/g, '_')}_report.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Report exported');
                }}
                className="px-3 py-1.5 bg-blue-600 rounded-lg text-xs font-bold text-white hover:bg-blue-500 shadow-sm shadow-blue-600/20 transition-all"
              >
                Export
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mt-3 -mx-5" />

          {/* Tab bar — underline style */}
          <div className="flex overflow-x-auto scrollbar-hide -mb-3 mt-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-5">About Project</h3>
                  <p className="text-slate-500 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <div className="space-y-3">
                      {[
                        { label: 'Client', value: project.clientName || 'N/A' },
                        { label: 'Timeline', value: `${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} — ${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}` },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-sm text-slate-500">{label}</span>
                          <span className="text-sm font-semibold text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-sm text-slate-500">Current Budget</span>
                        <span className="text-sm font-bold text-emerald-600">
                          ₹{(project.budgetHistory?.[project.budgetHistory.length - 1]?.amount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-sm text-slate-500">Priority</span>
                        <span className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-lg",
                          project.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                          project.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        )}>
                          {project.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-gray-900">Project Members</h3>
                    <button
                      onClick={() => setIsTeamModalOpen(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-3">
                    {project.members?.map((member: any) => {
                      const u = member.user || member;
                      const name = u.name || member.name || 'Member';
                      const role = typeof member.role === 'string' ? member.role : member.role?.name || 'Member';
                      return (
                        <div key={member._id || u._id || member} className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{role}</p>
                          </div>
                        </div>
                      );
                    })}
                    {(!project.members || project.members.length === 0) && (
                      <p className="text-sm text-slate-400 text-center py-4">No members assigned.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Add Snag', color: 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100', tab: 'snags' },
                      { label: 'Upload Plan', color: 'bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100', tab: 'plans' },
                      { label: 'Log Progress', color: 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100', tab: 'progress' },
                      { label: 'Request Material', color: 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100', tab: 'materials' },
                    ].map(({ label, color, tab }) => (
                      <button
                        key={label}
                        onClick={() => setActiveTab(tab)}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${color}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'boq' && <BOQTab projectId={id as string} />}
          {activeTab === 'budget' && <BudgetTab project={project} onUpdate={fetchProject} />}
          {activeTab === 'materials' && <MaterialsTab projectId={id as string} />}
          {activeTab === 'documents' && <DocumentsTab projectId={id as string} />}
          {activeTab === 'plans' && <PlansTab projectId={id as string} />}
          {activeTab === 'issues' && <IssuesTab projectId={id as string} />}
          {activeTab === 'risks' && <RisksTab projectId={id as string} />}
          {activeTab === 'survey' && <SurveyTab projectId={id as string} />}
          {activeTab === 'progress' && <DPRTab projectId={id as string} />}
          {activeTab === 'milestones' && <MilestonesTab projectId={id as string} />}
          {activeTab === 'timeline' && <TimelineTab projectId={id as string} />}
          {activeTab === 'transactions' && <TransactionsTab projectId={id as string} />}

          {!IMPLEMENTED.has(activeTab) && (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div className="p-6 rounded-full bg-gray-100 mb-6">
                <GanttChart className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{tabs.find(t => t.id === activeTab)?.name} — Coming Soon</h3>
              <p className="text-slate-500 max-w-xs">This module is under development. Check back soon!</p>
            </div>
          )}
        </div>
      </div>

      <CreateProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchProject}
        initialData={project}
        projectId={id as string}
      />

      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onSuccess={fetchProject}
        projectId={id as string}
        currentMembers={project.members || []}
      />
    </Shell>
  );
}

export default function ProjectWorkspacePage() {
  return (
    <Suspense>
      <ProjectWorkspaceInner />
    </Suspense>
  );
}
