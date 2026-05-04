'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { BOQTab } from '@/components/project/BOQTab';
import { BudgetTab } from '@/components/project/BudgetTab';
import { MaterialsTab } from '@/components/project/MaterialsTab';
import { PlansTab } from '@/components/project/PlansTab';
import { IssuesTab } from '@/components/project/IssuesTab';
import { RisksTab } from '@/components/project/RisksTab';
import { SurveyTab } from '@/components/project/SurveyTab';
import { DPRTab } from '@/components/project/DPRTab';
import { MilestonesTab } from '@/components/project/MilestonesTab';
import { useProjectSocket } from '@/hooks/useProjectSocket';
import { 
  Info, 
  FileText, 
  IndianRupee, 
  Package, 
  Files, 
  Map, 
  AlertCircle, 
  CheckSquare, 
  ShieldAlert, 
  Calendar, 
  TrendingUp, 
  GanttChart, 
  ClipboardList, 
  CreditCard,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import api from '@/lib/api';
import { Project } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/context/ToastContext';

const tabs = [
  { id: 'details', name: 'Details', icon: Info },
  { id: 'boq', name: 'BOQ', icon: FileText },
  { id: 'budget', name: 'Budget', icon: IndianRupee },
  { id: 'materials', name: 'Materials', icon: Package },
  { id: 'documents', name: 'Documents', icon: Files },
  { id: 'plans', name: 'Plans', icon: Map },
  { id: 'issues', name: 'Issues', icon: AlertCircle },
  { id: 'snags', name: 'Snags', icon: CheckSquare },
  { id: 'risks', name: 'Risks', icon: ShieldAlert },
  { id: 'milestones', name: 'Milestones', icon: Calendar },
  { id: 'progress', name: 'Progress', icon: TrendingUp },
  { id: 'timeline', name: 'Timeline', icon: GanttChart },
  { id: 'survey', name: 'Site Survey', icon: ClipboardList },
  { id: 'transactions', name: 'Finance', icon: CreditCard },
];

export default function ProjectWorkspacePage() {
  const { id } = useParams();
  const router = useRouter();
  const { joinProject, leaveProject } = useSocket();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const toast = useToast();

  // Real-time socket integration
  useProjectSocket(id as string);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
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
          <p className="text-slate-400 font-medium">Loading workspace...</p>
        </div>
      </Shell>
    );
  }

  if (!project) {
    return (
      <Shell>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-white">Project not found</h2>
          <button onClick={() => router.push('/projects')} className="text-blue-400 mt-4">Back to Projects</button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        {/* Project Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/projects')}
              className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <select 
                  value={project.status}
                  onChange={async (e) => {
                    try {
                      await api.patch(`/projects/${id}`, { status: e.target.value });
                      toast.success('Project status updated');
                      fetchProject();
                    } catch (err) {
                      toast.error('Failed to update status');
                    }
                  }}
                  className="bg-slate-900 border border-white/5 rounded-lg px-2 py-0.5 text-[10px] font-black text-blue-400 uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                >
                  <option value="Initialized">Initialized</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Execution">Execution</option>
                  <option value="Hold">Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 mt-1 text-xs">
                <span className="text-slate-400">Project ID:</span>
                <span className="text-slate-500 font-mono">{(id as string).slice(-6).toUpperCase()}</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                <span className="text-slate-500">{(project.members?.length || 0)} Team Members</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-all">
              Team Settings
            </button>
            <button className="px-4 py-2 bg-blue-600 border border-blue-500 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all">
              Export Report
            </button>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex overflow-x-auto pb-2 -mx-2 px-2 space-x-2 custom-scrollbar scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border shrink-0",
                activeTab === tab.id 
                  ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20" 
                  : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10 hover:text-white"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <GlassCard className="p-8 border-white/5" gradient>
                  <h3 className="text-xl font-bold text-white mb-6">About Project</h3>
                  <p className="text-slate-400 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-sm text-slate-500">Client</span>
                        <span className="text-sm font-bold text-white">{project.clientName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-sm text-slate-500">Timeline</span>
                        <span className="text-sm font-bold text-white">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Start'} 
                          {' - '} 
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'End'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-sm text-slate-500">Current Budget</span>
                        <span className="text-sm font-bold text-emerald-400">
                          ₹{project.budgetHistory?.[project.budgetHistory.length - 1]?.amount.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-sm text-slate-500">Priority</span>
                        <span className={cn(
                          "text-sm font-bold px-2 py-0.5 rounded-lg",
                          project.priority === 'Urgent' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                        )}>
                          {project.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-8 border-white/5">
                  <h3 className="text-xl font-bold text-white mb-6">Project Timeline</h3>
                  <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/2">
                    <p className="text-slate-500 italic">Timeline visualization placeholder</p>
                  </div>
                </GlassCard>
              </div>

              <div className="space-y-6">
                <GlassCard className="p-6 border-white/5" gradient>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Project Members</h3>
                    <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">+ Add</button>
                  </div>
                  <div className="space-y-4">
                    {project.members?.map((member: any) => (
                      <div key={member._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-white/5">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{member.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{member.role?.name || 'Member'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!project.members || project.members.length === 0) && (
                      <p className="text-sm text-slate-500 text-center py-4">No members assigned.</p>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-6 border-white/5">
                  <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-bold text-center hover:bg-blue-600/20 transition-all">
                      Add Snag
                    </button>
                    <button className="p-3 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 text-xs font-bold text-center hover:bg-purple-600/20 transition-all">
                      Upload Plan
                    </button>
                    <button className="p-3 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center hover:bg-emerald-600/20 transition-all">
                      Log Progress
                    </button>
                    <button className="p-3 rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-400 text-xs font-bold text-center hover:bg-amber-600/20 transition-all">
                      Request Material
                    </button>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {activeTab === 'boq' && (
            <BOQTab projectId={id as string} />
          )}

          {activeTab === 'budget' && (
            <BudgetTab project={project} onUpdate={fetchProject} />
          )}

          {activeTab === 'materials' && (
            <MaterialsTab projectId={id as string} />
          )}

          {activeTab === 'plans' && (
            <PlansTab projectId={id as string} />
          )}

          {(activeTab === 'issues' || activeTab === 'snags') && (
            <IssuesTab projectId={id as string} />
          )}

          {activeTab === 'risks' && (
            <RisksTab projectId={id as string} />
          )}

          {activeTab === 'survey' && (
            <SurveyTab projectId={id as string} />
          )}

          {activeTab === 'dpr' && (
            <DPRTab projectId={id as string} />
          )}

          {activeTab === 'milestones' && (
            <MilestonesTab projectId={id as string} />
          )}

          {activeTab !== 'details' && 
           activeTab !== 'boq' && 
           activeTab !== 'budget' && 
           activeTab !== 'materials' && 
           activeTab !== 'plans' && 
           activeTab !== 'issues' && 
           activeTab !== 'snags' && 
           activeTab !== 'risks' && 
           activeTab !== 'survey' && 
           activeTab !== 'dpr' && 
           activeTab !== 'milestones' && (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div className="p-6 rounded-full bg-slate-900/50 border border-white/5 mb-6">
                <Loader2 className="w-12 h-12 text-slate-700 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{tabs.find(t => t.id === activeTab)?.name} Coming Soon</h3>
              <p className="text-slate-500 max-w-xs">We're working on the next phase of this module. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
