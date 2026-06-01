'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Clock, User, Shield, Info, ArrowLeft, ArrowRight,
  Activity, ClipboardCheck, Package, CheckCircle2, AlertCircle
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

interface AuditTrailItem {
  _id?: string;
  user?: string | any;
  userName?: string;
  userRole?: string;
  action: string;
  details: string;
  timestamp?: string;
  createdAt?: string;
}

interface AuditTabProps {
  project: any;
}

const ITEMS_PER_PAGE = 10;
// Helper to determine icon, colors and labels based on action types
const getActionMeta = (action: string) => {
  const norm = action.toLowerCase();
  if (norm.includes('status') || norm.includes('handover') || norm.includes('archive')) {
    return {
      icon: Activity,
      color: 'text-violet-700 bg-violet-50 border-violet-200',
      dotColor: 'bg-violet-500 ring-violet-200',
    };
  }
  if (norm.includes('approval') || norm.includes('reject') || norm.includes('plan') || norm.includes('drawing')) {
    return {
      icon: ClipboardCheck,
      color: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200',
      dotColor: 'bg-fuchsia-500 ring-fuchsia-200',
    };
  }
  if (norm.includes('material') || norm.includes('usage') || norm.includes('purchase') || norm.includes('requisition')) {
    return {
      icon: Package,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      dotColor: 'bg-amber-500 ring-amber-200',
    };
  }
  if (norm.includes('task') || norm.includes('milestone') || norm.includes('complete') || norm.includes('done')) {
    return {
      icon: CheckCircle2,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      dotColor: 'bg-emerald-500 ring-emerald-200',
    };
  }
  return {
    icon: History,
    color: 'text-slate-600 bg-slate-50 border-slate-200',
    dotColor: 'bg-slate-500 ring-slate-200',
  };
};

export const AuditTab: React.FC<AuditTabProps> = ({ project }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const logs = Array.isArray(project.auditTrail) ? [...project.auditTrail] : [];
  
  // Sort reverse-chronologically (newest first)
  const sortedLogs = logs.sort((a, b) => {
    const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
    const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const totalItems = sortedLogs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = sortedLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-1 sm:px-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            Project Audit Trail
          </h3>
          <p className="text-sm text-slate-500 mt-1">Immutable transaction ledger and execution history.</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-slate-100 rounded-xl border text-slate-600 self-start sm:self-auto">
          Total Logs: <span className="font-black text-slate-900">{totalItems}</span>
        </div>
      </div>

      {totalItems === 0 ? (
        <GlassCard className="py-24 text-center border-gray-200" gradient>
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">No activity logs recorded yet.</p>
          <p className="text-slate-400 text-xs mt-1">Changes and executions will appear here automatically.</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* Timeline Wrapper */}
          <div className="relative pl-6 sm:pl-8 before:absolute before:top-4 before:bottom-4 before:left-2 sm:before:left-3 before:w-[2px] before:bg-slate-200">
            <AnimatePresence mode="popLayout">
              {paginatedLogs.map((log, index) => {
                const meta = getActionMeta(log.action);
                const ActionIcon = meta.icon;
                const timestamp = log.timestamp || log.createdAt;
                const formattedTime = timestamp
                  ? new Date(timestamp).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'TBD';

                return (
                  <motion.div
                    key={log._id || index}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className="relative mb-6 last:mb-0 group"
                  >
                    {/* Dot */}
                    <div className={cn(
                      "absolute -left-[30px] sm:-left-[37px] top-1.5 w-4 h-4 rounded-full ring-4 transition-all group-hover:scale-110",
                      meta.dotColor
                    )} />

                    {/* Card Content */}
                    <GlassCard className="p-4 sm:p-5 border-gray-200 hover:border-blue-500/30 transition-all shadow-sm" gradient>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0",
                            meta.color
                          )}>
                            <ActionIcon className="w-3.5 h-3.5" />
                            {log.action}
                          </span>
                          
                          {/* User tag */}
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-slate-800 font-bold truncate max-w-[100px] sm:max-w-none">
                              {log.userName || (typeof log.user === 'object' ? log.user?.name : 'System')}
                            </span>
                            {log.userRole && (
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 border border-slate-100 bg-slate-50 px-1.5 py-0.5 rounded shrink-0">
                                {log.userRole}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          {formattedTime}
                        </div>
                      </div>

                      {/* Log details */}
                      <p className="text-xs sm:text-sm text-gray-800 mt-3 font-medium leading-relaxed">
                        {log.details}
                      </p>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              
              <span className="text-xs font-semibold text-slate-500">
                Page <span className="font-black text-slate-900">{currentPage}</span> of <span className="font-black text-slate-900">{totalPages}</span>
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
