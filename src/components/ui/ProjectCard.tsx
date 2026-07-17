'use client';

import React from 'react';
import Link from 'next/link';
import {
  MessageCircle, Pencil, Trash2, AlertCircle,
  Send, ClipboardCheck, Calendar, Users, MapPin,
} from 'lucide-react';
import { Project } from '@/types';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthContext';

interface ProjectCardProps {
  project: Project & { 
    hasPendingPlans?: boolean;
    siteLocation?: {
      address?: string;
      latitude?: number;
      longitude?: number;
    };
  };
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onSendForSurvey?: (project: Project) => void;
  onCompleteSurvey?: (project: Project) => void;
}

const statusColors: Record<string, string> = {
  'Initialized':         'bg-blue-50 text-blue-750 border-blue-200/60',
  'Planning':            'bg-purple-50 text-purple-755 border-purple-200/60',
  'Site Survey':         'bg-cyan-50 text-cyan-755 border-cyan-200/60',
  'Ongoing':             'bg-emerald-50 text-emerald-755 border-emerald-200/60',
  'Under Snagging':      'bg-amber-50 text-amber-755 border-amber-200/60',
  'Snagging Completed':  'bg-orange-50 text-orange-755 border-orange-200/60',
  'Completed':           'bg-green-50 text-green-755 border-green-200/60',
  'Pending Handover':    'bg-violet-50 text-violet-755 border-violet-200/60',
  'Handover Rejected':   'bg-rose-50 text-rose-755 border-rose-200/60',
  'Handover Completed':  'bg-teal-50 text-teal-755 border-teal-200/60',
  'On Hold':             'bg-slate-100 text-slate-700 border-slate-200/60',
  'Cancelled':           'bg-red-50 text-red-755 border-red-200/60',
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

  // Standardize progress color
  const isFinished = project.status === 'Completed' || project.status === 'Handover Completed';
  const progressColorClass = isFinished ? 'bg-emerald-500' : 'bg-blue-600';

  return (
    <GlassCard
      className="group hover:border-slate-350 hover:shadow-md transition-all duration-200 flex flex-col h-full shadow-sm relative p-0 overflow-hidden rounded-2xl bg-white border border-slate-200/60"
      gradient={false}
    >
      {/* ── Clickable body (link to project) ── */}
      <Link href={`/projects/${project._id}`} className="flex flex-col flex-1 outline-none">

        {/* Card Body - Increased font scale */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2.5">
            
            {/* Header row: status badge + category */}
            <div className="flex items-center justify-between gap-2">
              <span className={cn(
                'px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0',
                statusColor
              )}>
                {project.status}
              </span>
              {categoryName && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-200/60 max-w-[110px] truncate">
                  {categoryName}
                </span>
              )}
            </div>

            {/* Project name & Client */}
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug tracking-tight">
                {project.name}
              </h3>
              {(project as any).clientName && (
                <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
                  {(project as any).clientName}
                </p>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-slate-450 line-clamp-2 leading-relaxed min-h-[2.5rem]">
              {project.description || 'No description provided.'}
            </p>

            {/* Location & Date Inline Metadata (readable scale) */}
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold truncate pt-0.5">
              {project.siteLocation?.address && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{project.siteLocation.address}</span>
                </span>
              )}
              {project.siteLocation?.address && endDate && <span className="text-slate-300 font-normal">•</span>}
              {endDate && (
                <span className={cn(
                  'flex items-center gap-1.5 shrink-0',
                  isOverdue ? 'text-red-655 font-black' : 'text-slate-450'
                )}>
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {isOverdue ? 'Overdue' : endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Section: Survey action buttons */}
          {((project.needSiteSurvey && !project.siteSurveyor && onSendForSurvey) || 
            (isAssignedSurveyor && (project.status === 'Site Survey' || project.status === 'Planning') && project.surveyStatus !== 'Approved' && onCompleteSurvey)) && (
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              {project.needSiteSurvey && !project.siteSurveyor && onSendForSurvey && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSendForSurvey(project); }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send for Survey
                </button>
              )}
              {isAssignedSurveyor && (project.status === 'Site Survey' || project.status === 'Planning') && project.surveyStatus !== 'Approved' && onCompleteSurvey && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCompleteSurvey(project); }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  {project.surveyStatus ? 'Edit Survey' : 'Start Survey'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3.5">
          <div className="flex justify-between text-[10px] font-black text-slate-450 mb-1.5 uppercase tracking-wider">
            <span>Progress</span>
            <span className="text-slate-750 font-bold">{progress}%</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                progressColorClass
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Link>

      {/* ── Action strip (outside Link) ── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50">
        {/* Member avatars */}
        <div className="flex -space-x-1.5">
          {project.members?.slice(0, 4).map((member: any, i: number) => {
            const name = (member.user?.name || member.name || '?');
            return (
              <div
                key={i}
                title={name}
                className="w-6 h-6 rounded bg-blue-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm"
              >
                {name.charAt(0).toUpperCase()}
              </div>
            );
          })}
          {(project.members?.length ?? 0) > 4 && (
            <div className="w-6 h-6 rounded bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">
              +{project.members!.length - 4}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { window.location.href = `/projects/${project._id}/chat`; }}
            title="Open chat"
            className="flex items-center gap-1 py-1 px-2 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/40 rounded-lg transition-all hover:bg-emerald-100/80 active:scale-95 shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Chat</span>
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(project)}
              title="Edit project"
              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all active:scale-90"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(project)}
              title="Delete project"
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all active:scale-90"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Pending plans badge */}
      {project.hasPendingPlans && (
        <div className="absolute top-2 right-2 w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse pointer-events-none">
          <AlertCircle className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </GlassCard>
  );
};
