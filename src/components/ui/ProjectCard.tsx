'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Users,
  Clock,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Construction
} from 'lucide-react';
import { Project } from '@/types';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project & { hasPendingPlans?: boolean };
}

const statusColors = {
  'Initialized': 'text-blue-700 bg-blue-100 border-blue-200',
  'Planning': 'text-purple-700 bg-purple-100 border-purple-200',
  'Site Survey': 'text-cyan-700 bg-cyan-100 border-cyan-200',
  'In Progress': 'text-emerald-700 bg-emerald-100 border-emerald-200',
  'Under Snagging': 'text-amber-700 bg-amber-100 border-amber-200',
  'Snagging Completed': 'text-orange-700 bg-orange-100 border-orange-200',
  'Completed': 'text-green-700 bg-green-100 border-green-200',
  'On Hold': 'text-slate-600 bg-gray-100 border-gray-200',
  'Cancelled': 'text-red-700 bg-red-100 border-red-200',
};

const STATUS_PROGRESS: Record<string, number> = {
  'Initialized': 5,
  'Planning': 15,
  'Site Survey': 25,
  'In Progress': 50,
  'Under Snagging': 75,
  'Snagging Completed': 90,
  'Completed': 100,
  'On Hold': 40,
  'Cancelled': 0,
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const latestBudget = project.budgetHistory?.[project.budgetHistory.length - 1]?.amount || 0;
  const progress = STATUS_PROGRESS[project.status] ?? 0;

  return (
    <GlassCard className="group hover:border-blue-500/50 transition-all duration-500 flex flex-col h-full shadow-sm" gradient>
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            statusColors[project.status]
          )}>
            {project.status}
          </div>
          <button className="text-slate-500 hover:text-gray-900 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
          {project.name}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-6 min-h-[40px]">
          {project.description || 'No description provided for this project.'}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center space-x-2 text-slate-500">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-medium">{project.members?.length || 0} Members</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium">{project.priority} Priority</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            <Construction className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium">₹{latestBudget.toLocaleString()}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Overall Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div
              className={cn(
                'h-full rounded-full',
                project.status === 'Completed' ? 'bg-emerald-500' :
                project.status === 'Cancelled' ? 'bg-gray-300' :
                'bg-gradient-to-r from-blue-600 to-blue-400'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-7 h-7 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
              {i}
            </div>
          ))}
          {project.members?.length > 3 && (
            <div className="w-7 h-7 rounded-lg bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">
              +{project.members.length - 3}
            </div>
          )}
        </div>

        <Link
          href={`/projects/${project._id}`}
          className="flex items-center space-x-1 text-sm font-bold text-blue-600 hover:text-blue-500 transition-colors group/link"
        >
          <span>Workspace</span>
          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Notifications */}
      {project.hasPendingPlans && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center border-2 border-white shadow-lg shadow-red-500/20 animate-pulse">
          <AlertCircle className="w-3 h-3 text-white" />
        </div>
      )}
    </GlassCard>
  );
};
