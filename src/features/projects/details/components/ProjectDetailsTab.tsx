'use client';
import React, { useState } from 'react';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { TeamManagementModal } from '@/features/projects/components/TeamManagementModal';
import { SendForSurveyModal } from '@/features/projects/site-survey/components/SendForSurveyModal';
import { useRouter } from 'next/navigation';
import { Map, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProjectDetailsTab() {
  const { project, projectId, fetchProject } = useProjectContext();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isSurveyAssignOpen, setIsSurveyAssignOpen] = useState(false);
  const router = useRouter();

  if (!project) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Surveyor assigned badge */}
      {project.siteSurveyor && (
        <div className="lg:col-span-3 flex items-center gap-3 px-5 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
          <Map className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800">
            Site survey assigned to <span className="font-bold">{(project.siteSurveyor as any)?.name || 'Surveyor'}</span>
          </p>
        </div>
      )}

      <div className="lg:col-span-2 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-5">About Project</h3>
          <p className="text-slate-500 leading-relaxed">{project.description || 'No description provided.'}</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-900">Project Members</h3>
            <button onClick={() => setIsTeamModalOpen(true)} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
              <Users className="w-3.5 h-3.5" /> + Manage
            </button>
          </div>
          <div className="space-y-3">
            {project.members?.map((member: any) => {
              const u = member.user || member;
              const name = u.name || member.name || 'Member';
              const role = typeof member.role === 'string' ? member.role : (member.role?.name || 'Member');
              return (
                <div key={u._id || name} className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <TeamManagementModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} onSuccess={fetchProject} projectId={projectId} currentMembers={project.members || []} />
    </div>
  );
}
