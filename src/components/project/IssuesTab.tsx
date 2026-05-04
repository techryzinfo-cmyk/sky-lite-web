'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Loader2,
  Calendar,
  Flag,
  MessageSquare,
  Tag,
  ArrowUpRight
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { IssueModal } from './IssueModal';

interface IssuesTabProps {
  projectId: string;
}

export const IssuesTab: React.FC<IssuesTabProps> = ({ projectId }) => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<'Issue' | 'Snag'>('Issue');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const toast = useToast();

  const fetchIssues = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/issues`);
      setIssues(response.data);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [projectId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'High': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'In Progress': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Escalated': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const filteredIssues = issues.filter(i => 
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Issues & Snags</h3>
          <p className="text-sm text-slate-400 mt-1">Report and track site issues, snags, and risks.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex p-1 bg-slate-900/50 border border-white/5 rounded-xl">
            <button 
              onClick={() => setActiveType('Issue')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeType === 'Issue' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Issues
            </button>
            <button 
              onClick={() => setActiveType('Snag')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeType === 'Snag' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Snags
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Report {activeType}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: issues.filter(i => i.status === 'Open').length, color: 'text-blue-400' },
          { label: 'Critical', value: issues.filter(i => i.priority === 'Critical').length, color: 'text-red-400' },
          { label: 'In Progress', value: issues.filter(i => i.status === 'In Progress').length, color: 'text-amber-400' },
          { label: 'Resolved', value: issues.filter(i => i.status === 'Resolved').length, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-4 border-white/5" gradient>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Search & List */}
      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            placeholder={`Search ${activeType.toLowerCase()}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Syncing tracking board...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((issue) => (
              <GlassCard key={issue._id} className="p-5 border-white/5 group hover:border-blue-500/30 transition-all cursor-pointer" gradient>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className={cn(
                      "p-3 rounded-xl border flex items-center justify-center",
                      issue.priority === 'Critical' ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-slate-800 border-white/5 text-slate-400"
                    )}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          getPriorityColor(issue.priority)
                        )}>
                          {issue.priority}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {issue.category}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{issue.title}</h4>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-bold">
                          <User className="w-3 h-3" />
                          <span>Assigned: {issue.assignedTo?.name || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Reported {new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-4 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <span className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                      getStatusColor(issue.status)
                    )}>
                      {issue.status}
                    </span>
                    <div className="p-2 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}

            {filteredIssues.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <CheckCircle2 className="w-16 h-16 text-slate-700 mb-4" />
                <h4 className="text-lg font-bold text-slate-500">No {activeType.toLowerCase()}s found</h4>
                <p className="text-sm text-slate-600 max-w-xs mt-1">The tracking board is clear. All systems look good.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <IssueModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchIssues}
        projectId={projectId}
        type={activeType}
      />
    </div>
  );
};
