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
  'Initialized': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Planning': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Site Survey': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'In Progress': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Under Snagging': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Snagging Completed': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'Completed': 'text-green-400 bg-green-500/10 border-green-500/20',
  'On Hold': 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  'Cancelled': 'text-red-400 bg-red-500/10 border-red-500/20',
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const latestBudget = project.budgetHistory?.[project.budgetHistory.length - 1]?.amount || 0;

  return (
    <GlassCard className="group hover:border-blue-500/50 transition-all duration-500 flex flex-col h-full shadow-2xl shadow-black/20" gradient>
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            statusColors[project.status]
          )}>
            {project.status}
          </div>
          <button className="text-slate-500 hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
          {project.name}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-6 min-h-[40px]">
          {project.description || 'No description provided for this project.'}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center space-x-2 text-slate-400">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-medium">{project.members?.length || 0} Members</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium">{project.priority} Priority</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Construction className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium">₹{latestBudget.toLocaleString()}</span>
          </div>
        </div>

        {/* Progress Bar (Placeholder) */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Overall Progress</span>
            <span>45%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[45%]" />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-7 h-7 rounded-lg bg-slate-800 border-2 border-[#0F172A] flex items-center justify-center text-[10px] font-bold text-slate-400">
              {i}
            </div>
          ))}
          {project.members?.length > 3 && (
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border-2 border-[#0F172A] flex items-center justify-center text-[10px] font-bold text-blue-400">
              +{project.members.length - 3}
            </div>
          )}
        </div>

        <Link 
          href={`/projects/${project._id}`}
          className="flex items-center space-x-1 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors group/link"
        >
          <span>Workspace</span>
          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Notifications */}
      {project.hasPendingPlans && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center border-2 border-[#0F172A] shadow-lg shadow-red-500/20 animate-pulse">
          <AlertCircle className="w-3 h-3 text-white" />
        </div>
      )}
    </GlassCard>
  );
};
