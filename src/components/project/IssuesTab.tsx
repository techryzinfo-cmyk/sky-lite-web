'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Clock,
  User,
  CheckCircle2,
  ChevronRight,
  Loader2,
  GitBranch,
  Pencil,
  Trash2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { IssueModal } from './IssueModal';
import { IssueDetailModal } from './IssueDetailModal';
import { EscalationMatrixModal } from './EscalationMatrixModal';

interface IssuesTabProps {
  projectId: string;
  initialType?: 'Issue' | 'Snag';
}

const STATUS_FILTERS = ['All', 'Open', 'In Progress', 'Escalated', 'Resolved', 'Closed', 'My Task'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export const IssuesTab: React.FC<IssuesTabProps> = ({ projectId, initialType = 'Issue' }) => {
  const [issues, setIssues]             = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeType, setActiveType]     = useState<'Issue' | 'Snag'>(initialType);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [isEscalationOpen, setIsEscalationOpen] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  const toast = useToast();
  const { user } = useAuth();

  const fetchIssues = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/issues`);
      setIssues(response.data);
    } catch (error) {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, [projectId]);

  const handleDeleteIssue = async (e: React.MouseEvent, issueId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this issue? This cannot be undone.')) return;
    setDeletingId(issueId);
    try {
      await api.delete(`/projects/${projectId}/issues/${issueId}`);
      toast.success('Issue deleted');
      fetchIssues();
    } catch (error: any) {
      if (error.response?.status >= 500) {
        toast.success('Issue deleted');
        fetchIssues();
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete issue');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'High':     return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'Medium':   return 'text-amber-700 bg-amber-100 border-amber-200';
      default:         return 'text-blue-700 bg-blue-100 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':      return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'In Progress': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'Escalated':   return 'text-purple-700 bg-purple-100 border-purple-200';
      default:            return 'text-slate-600 bg-gray-100 border-gray-200';
    }
  };

  const getFilterActiveClass = (f: StatusFilter) => {
    switch (f) {
      case 'Escalated':   return 'bg-purple-600 text-white border-purple-600';
      case 'Resolved':
      case 'Closed':      return 'bg-emerald-600 text-white border-emerald-600';
      case 'In Progress': return 'bg-blue-500 text-white border-blue-500';
      case 'My Task':     return 'bg-amber-500 text-white border-amber-500';
      default:            return 'bg-blue-600 text-white border-blue-600';
    }
  };

  const typeMatches = (i: any) =>
    i.type === activeType ||
    (activeType === 'Snag' && (!i.type || i.type === '') && i.category === 'Snag') ||
    (activeType === 'Issue' && !i.type && i.category !== 'Snag');

  const typeIssues = issues.filter(typeMatches);
  const currentUserId = user?.id || (user as any)?._id;

  const filteredIssues = typeIssues.filter(i => {
    if (!i.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === 'All') return true;
    if (statusFilter === 'My Task') {
      const assignedId = i.assignedTo?._id || i.assignedTo;
      return assignedId === currentUserId;
    }
    return i.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{activeType === 'Snag' ? 'Snag Tracker' : 'Issue Tracker'}</h3>
          <p className="text-sm text-slate-500 mt-1">{activeType === 'Snag' ? 'Track defects and snagging items on site.' : 'Report and track site issues and field problems.'}</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex p-1 bg-gray-100 border border-gray-200 rounded-xl">
            <button
              onClick={() => setActiveType('Issue')}
              className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition-all', activeType === 'Issue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-gray-900')}
            >
              Issues
            </button>
            <button
              onClick={() => setActiveType('Snag')}
              className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition-all', activeType === 'Snag' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-gray-900')}
            >
              Snags
            </button>
          </div>
          <button
            onClick={() => setIsEscalationOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-xl text-sm font-bold text-orange-700 hover:bg-orange-100 transition-all"
          >
            <GitBranch className="w-4 h-4" />
            <span>Escalation Matrix</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Report {activeType}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open',        value: typeIssues.filter(i => i.status === 'Open').length,        color: 'text-blue-600' },
          { label: 'Critical',    value: typeIssues.filter(i => i.priority === 'Critical').length,  color: 'text-red-600' },
          { label: 'In Progress', value: typeIssues.filter(i => i.status === 'In Progress').length, color: 'text-amber-600' },
          { label: 'Resolved',    value: typeIssues.filter(i => i.status === 'Resolved').length,    color: 'text-emerald-600' },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-4 border-gray-200" gradient>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <p className={cn('text-2xl font-black', stat.color)}>{stat.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder={`Search ${activeType.toLowerCase()}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                statusFilter === f
                  ? getFilterActiveClass(f)
                  : 'bg-white border-gray-200 text-slate-500 hover:border-gray-300 hover:text-gray-900'
              )}
            >
              {f}
              {f !== 'All' && f !== 'My Task' && (
                <span className="ml-1.5 opacity-70">
                  ({typeIssues.filter(i => i.status === f).length})
                </span>
              )}
              {f === 'My Task' && currentUserId && (
                <span className="ml-1.5 opacity-70">
                  ({typeIssues.filter(i => (i.assignedTo?._id || i.assignedTo) === currentUserId).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Syncing tracking board...</p>
          </div>
        ) : (
          <>
            {filteredIssues.map((issue) => (
              <GlassCard
                key={issue._id}
                onClick={() => setSelectedIssue(issue)}
                className="p-5 border-gray-200 group hover:border-blue-500/50 transition-all cursor-pointer"
                gradient
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className={cn(
                      'p-3 rounded-xl border flex items-center justify-center',
                      issue.priority === 'Critical' ? 'bg-red-100 border-red-200 text-red-600' : 'bg-gray-100 border-gray-200 text-slate-500'
                    )}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border', getPriorityColor(issue.priority))}>
                          {issue.priority}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {issue.category}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{issue.title}</h4>
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

                  <div className="flex items-center justify-between md:justify-end space-x-2 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                    <span className={cn('px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border', getStatusColor(issue.status))}>
                      {issue.status}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingIssue(issue); }}
                        title="Edit issue"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteIssue(e, issue._id)}
                        disabled={deletingId === issue._id}
                        title="Delete issue"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                      >
                        {deletingId === issue._id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                      <div className="p-2 rounded-lg bg-gray-100 text-slate-500 hover:text-gray-900 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}

            {filteredIssues.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                <CheckCircle2 className="w-16 h-16 text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-slate-500">No {activeType.toLowerCase()}s found</h4>
                <p className="text-sm text-slate-400 max-w-xs mt-1">
                  {statusFilter !== 'All'
                    ? `No ${activeType.toLowerCase()}s match the "${statusFilter}" filter.`
                    : 'The tracking board is clear. All systems look good.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <IssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchIssues}
        projectId={projectId}
        type={activeType}
      />

      <IssueModal
        isOpen={!!editingIssue}
        onClose={() => setEditingIssue(null)}
        onSuccess={() => { fetchIssues(); setEditingIssue(null); }}
        projectId={projectId}
        type={activeType}
        existingIssue={editingIssue}
      />

      <IssueDetailModal
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onSuccess={fetchIssues}
        issue={selectedIssue}
        projectId={projectId}
      />

      <EscalationMatrixModal
        isOpen={isEscalationOpen}
        onClose={() => setIsEscalationOpen(false)}
        projectId={projectId}
      />
    </div>
  );
};
