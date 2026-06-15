'use client';

import React from 'react';
import Link from 'next/link';
import {
  MessageCircle, Pencil, Trash2, AlertCircle,
  Send, ClipboardCheck, Calendar, Users,
} from 'lucide-react';
import { Project } from '@/types';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthContext';

interface ProjectCardProps {
  project: Project & { hasPendingPlans?: boolean };
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onSendForSurvey?: (project: Project) => void;
  onCompleteSurvey?: (project: Project) => void;
}

const statusColors: Record<string, string> = {
  'Initialized':        'text-blue-700 bg-blue-100 border-blue-200',
  'Planning':           'text-purple-700 bg-purple-100 border-purple-200',
  'Site Survey':        'text-cyan-700 bg-cyan-100 border-cyan-200',
  'Ongoing':            'text-emerald-700 bg-emerald-100 border-emerald-200',
  'Under Snagging':     'text-amber-700 bg-amber-100 border-amber-200',
  'Snagging Completed': 'text-orange-700 bg-orange-100 border-orange-200',
  'Completed':          'text-green-700 bg-green-100 border-green-200',
  'Pending Handover':   'text-violet-700 bg-violet-100 border-violet-200',
  'Handover Rejected':  'text-rose-700 bg-rose-100 border-rose-200',
  'Handover Completed': 'text-teal-700 bg-teal-100 border-teal-200',
  'On Hold':            'text-slate-600 bg-gray-100 border-gray-200',
  'Cancelled':          'text-red-700 bg-red-100 border-red-200',
};

const STATUS_PROGRESS: Record<string, number> = {
  'Initialized': 5, 'Planning': 15, 'Site Survey': 25, 'Ongoing': 50,
  'Under Snagging': 75, 'Snagging Completed': 90, 'Completed': 100,
  'Pending Handover': 95, 'Handover Rejected': 90, 'Handover Completed': 100,
  'On Hold': 40, 'Cancelled': 0,
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project, onEdit, onDelete, onSendForSurvey, onCompleteSurvey,
}) => {
  const progress = STATUS_PROGRESS[project.status] ?? 10;
  const { user } = useAuth();

  const categoryName = typeof project.category === 'string'
    ? project.category
    : (project.category as any)?.name || '';

  const surveyorId = typeof project.siteSurveyor === 'object'
    ? (project.siteSurveyor as any)?._id
    : project.siteSurveyor;
  const isAssignedSurveyor = !!(surveyorId && (user?.id === surveyorId || user?._id === surveyorId));

  const statusColor = statusColors[project.status] || 'text-blue-700 bg-blue-100 border-blue-200';
  const endDate = project.endDate ? new Date(project.endDate) : null;
  const isOverdue = endDate && endDate < new Date() && project.status !== 'Completed' && project.status !== 'Handover Completed' && project.status !== 'Cancelled';

  return (
    <GlassCard
      className="group hover:border-blue-500/40 hover:shadow-md transition-all duration-300 flex flex-col h-full shadow-sm relative p-0 overflow-hidden"
      gradient
    >
      {/* ── Clickable body (link to project) ── */}
      <Link href={`/projects/${project._id}`} className="flex flex-col flex-1 outline-none">

        {/* Status bar accent */}
        <div className={cn(
          'h-0.5 w-full',
          project.status === 'Completed' || project.status === 'Handover Completed' ? 'bg-emerald-400' :
          project.status === 'Cancelled' ? 'bg-red-400' :
          project.status === 'On Hold' ? 'bg-gray-300' :
          'bg-blue-500'
        )} />

        <div className="p-5 flex-1 space-y-3">
          {/* Header row: status badge + category */}
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              'px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border shrink-0',
              statusColor
            )}>
              {project.status}
            </span>
            {categoryName && (
              <span className="text-[10px] font-semibold text-slate-400 truncate">{categoryName}</span>
            )}
          </div>

          {/* Project name */}
          <div>
            <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
              {project.name}
            </h3>
            {(project as any).clientName && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{(project as any).clientName}</p>
            )}
          </div>

          {/* Description / location */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {project.description || 'No description provided.'}
          </p>

          {/* Meta row: date + members */}
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
            {endDate && (
              <span className={cn('flex items-center gap-1', isOverdue && 'text-red-500 font-bold')}>
                <Calendar className="w-3 h-3" />
                {isOverdue ? 'Overdue' : endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
              </span>
            )}
            {(project.members?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {project.members!.length}
              </span>
            )}
            {project.priority && (
              <span className={cn(
                'px-1.5 py-0.5 rounded text-[9px] font-black uppercase',
                project.priority === 'High' ? 'text-red-600 bg-red-50' :
                project.priority === 'Medium' ? 'text-amber-600 bg-amber-50' :
                'text-slate-500 bg-gray-100'
              )}>
                {project.priority}
              </span>
            )}
          </div>

          {/* Survey action buttons */}
          {project.needSiteSurvey && !project.siteSurveyor && onSendForSurvey && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSendForSurvey(project); }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Send for Survey
            </button>
          )}
          {isAssignedSurveyor && (project.status === 'Site Survey' || project.status === 'Planning') && project.surveyStatus !== 'Approved' && onCompleteSurvey && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCompleteSurvey(project); }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              {project.surveyStatus ? 'Edit Survey' : 'Start Survey'}
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-4">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
            <span>Progress</span>
            <span className="text-gray-700">{progress}%</span>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                project.status === 'Completed' || project.status === 'Handover Completed' ? 'bg-emerald-500' :
                project.status === 'Cancelled' ? 'bg-red-400' :
                'bg-blue-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Link>

      {/* ── Action strip (outside Link — no event propagation issues) ── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 bg-gray-50/60">
        {/* Member avatars */}
        <div className="flex -space-x-1.5">
          {project.members?.slice(0, 4).map((member: any, i: number) => {
            const name = (member.user?.name || member.name || '?');
            return (
              <div
                key={i}
                title={name}
                className="w-6 h-6 rounded-md bg-blue-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-blue-700"
              >
                {name.charAt(0).toUpperCase()}
              </div>
            );
          })}
          {(project.members?.length ?? 0) > 4 && (
            <div className="w-6 h-6 rounded-md bg-gray-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500">
              +{project.members!.length - 4}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { window.location.href = `/projects/${project._id}/chat`; }}
            title="Open chat"
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(project)}
              title="Edit project"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(project)}
              title="Delete project"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Pending plans badge */}
      {project.hasPendingPlans && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse pointer-events-none">
          <AlertCircle className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </GlassCard>
  );
};
