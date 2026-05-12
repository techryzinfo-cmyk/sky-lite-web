'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, GanttChart, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface TimelineTabProps {
  projectId: string;
}

const STATUS_COLORS: Record<string, { bar: string; fill: string; text: string; border: string }> = {
  'Completed':   { bar: 'bg-emerald-500', fill: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-300' },
  'In Progress': { bar: 'bg-blue-500',    fill: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-300'   },
  'Delayed':     { bar: 'bg-red-500',     fill: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-300'    },
  'Pending':     { bar: 'bg-slate-400',   fill: 'bg-slate-50',    text: 'text-slate-600',   border: 'border-slate-300'  },
  'On Hold':     { bar: 'bg-amber-400',   fill: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-300'  },
};

const STATUS_DOT: Record<string, string> = {
  'Completed':   'bg-emerald-500',
  'In Progress': 'bg-blue-500',
  'Delayed':     'bg-red-500',
  'Pending':     'bg-slate-400',
  'On Hold':     'bg-amber-400',
};

const MILESTONE_H = 64;
const TASK_H      = 44;
const DAY_W       = 32;

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffDays(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

function monthLabel(d: Date) {
  return d.toLocaleString('default', { month: 'short', year: '2-digit' });
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ projectId }) => {
  const [milestones, setMilestones]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    api.get(`/projects/${projectId}/milestones`)
      .then(r => setMilestones(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load milestones'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Building timeline...</p>
      </div>
    );
  }

  // Normalize dates — barStart must always be <= barEnd and both in the milestone's real period
  const normalized = milestones.map(m => {
    const due = (m.dueDate || m.targetDate)
      ? startOfDay(new Date(m.dueDate || m.targetDate))
      : null;
    const explicitStart = m.startDate
      ? startOfDay(new Date(m.startDate))
      : null;

    let barEnd: Date;
    let barStart: Date;

    if (due) {
      barEnd   = due;
      barStart = explicitStart ?? addDays(due, -30);
    } else {
      barStart = explicitStart ?? startOfDay(new Date(m.createdAt));
      barEnd   = addDays(barStart, 30);
    }

    // Safety: guarantee start ≤ end
    if (barStart > barEnd) barStart = addDays(barEnd, -30);

    return {
      ...m,
      label:    m.name || m.title || 'Untitled',
      barStart,
      barEnd,
      tasks:    Array.isArray(m.tasks) ? m.tasks : [],
    };
  });

  if (normalized.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-gray-200 rounded-3xl">
        <div className="p-6 rounded-full bg-gray-100 mb-6">
          <GanttChart className="w-12 h-12 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No timeline data yet</h3>
        <p className="text-slate-500 max-w-xs">Add milestones to visualize your project timeline.</p>
      </div>
    );
  }

  const today       = startOfDay(new Date());
  const allDates    = normalized.flatMap(m => [m.barStart, m.barEnd]);
  const rangeStart  = allDates.reduce((a, b) => a < b ? a : b);
  const rangeEnd    = allDates.reduce((a, b) => a > b ? a : b);
  const viewStart   = addDays(rangeStart, -7);
  const viewEnd     = addDays(rangeEnd, 7);
  const totalDays   = diffDays(viewStart, viewEnd) + 1;
  const todayOffset = diffDays(viewStart, today);

  const months: { label: string; span: number }[] = [];
  {
    let cur = new Date(viewStart.getFullYear(), viewStart.getMonth(), 1);
    while (cur <= viewEnd) {
      const monthStart = cur < viewStart ? viewStart : cur;
      const nextMonth  = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const monthEnd   = nextMonth > viewEnd ? viewEnd : addDays(nextMonth, -1);
      months.push({ label: monthLabel(cur), span: diffDays(monthStart, monthEnd) + 1 });
      cur = nextMonth;
    }
  }

  const scroll = (dir: -1 | 1) =>
    scrollRef.current?.scrollBy({ left: dir * DAY_W * 7, behavior: 'smooth' });

  const todayVisible = todayOffset >= 0 && todayOffset < totalDays;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Project Timeline</h3>
          <p className="text-sm text-slate-500 mt-1">Gantt view — click a milestone to expand its tasks.</p>
        </div>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
          {Object.entries(STATUS_COLORS).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={cn('w-2.5 h-2.5 rounded-full', c.bar)} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-px h-3 bg-red-500" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Today</span>
          </div>
        </div>
      </div>

      {/* Scroll nav */}
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => scroll(-1)} className="p-2 rounded-xl bg-white border border-gray-200 text-slate-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={() => scroll(1)} className="p-2 rounded-xl bg-white border border-gray-200 text-slate-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Gantt */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex">

          {/* ── Left labels column ── */}
          <div className="w-56 shrink-0 border-r border-gray-200 bg-gray-50/80">
            {/* Month header spacer */}
            <div className="h-10 border-b border-gray-200 flex items-center px-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Milestone / Task</span>
            </div>

            {normalized.map((m, i) => {
              const rowKey   = m._id || String(i);
              const expanded = expandedIds.has(rowKey);
              const hasTasks = m.tasks.length > 0;
              const c        = STATUS_COLORS[m.status] || STATUS_COLORS['Pending'];
              const dotColor = STATUS_DOT[m.status] || STATUS_DOT['Pending'];
              const done     = m.tasks.filter((t: any) => t.isCompleted).length;

              return (
                <div key={rowKey}>
                  {/* Milestone row */}
                  <div
                    onClick={() => hasTasks && toggleExpand(rowKey)}
                    className={cn(
                      'flex items-center gap-2 px-3 border-b border-gray-100',
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60',
                      hasTasks ? 'cursor-pointer hover:bg-blue-50/40 transition-colors' : ''
                    )}
                    style={{ height: MILESTONE_H }}
                  >
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200',
                        hasTasks ? 'opacity-100' : 'opacity-0',
                        expanded ? 'rotate-0' : '-rotate-90'
                      )}
                    />
                    <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', dotColor)} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate leading-tight">{m.label}</p>
                      <p className={cn('text-[9px] font-black uppercase tracking-widest mt-0.5', c.text)}>
                        {m.status || 'Pending'}
                        {hasTasks && (
                          <span className="ml-1.5 normal-case font-semibold text-slate-400">
                            · {done}/{m.tasks.length}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Task sub-rows */}
                  {expanded && m.tasks.map((task: any, ti: number) => (
                    <div
                      key={task._id || ti}
                      className={cn(
                        'flex items-center gap-2 pl-10 pr-3 border-b border-gray-100',
                        i % 2 === 0 ? 'bg-blue-50/20' : 'bg-blue-50/30'
                      )}
                      style={{ height: TASK_H }}
                    >
                      {task.isCompleted
                        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                        : <Circle className="w-3.5 h-3.5 shrink-0 text-gray-300" />
                      }
                      <p className={cn(
                        'text-[10px] font-semibold truncate',
                        task.isCompleted ? 'text-emerald-600 line-through' : 'text-slate-600'
                      )}>
                        {task.title || task.name || 'Task'}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* ── Scrollable chart area ── */}
          <div ref={scrollRef} className="flex-1 overflow-x-auto">
            <div style={{ width: totalDays * DAY_W, minWidth: '100%', position: 'relative' }}>

              {/* Month headers */}
              <div className="h-10 border-b border-gray-200 flex" style={{ width: totalDays * DAY_W }}>
                {months.map((mo, i) => (
                  <div
                    key={i}
                    className="border-r border-gray-200 flex items-center px-2 shrink-0"
                    style={{ width: mo.span * DAY_W }}
                  >
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{mo.label}</span>
                  </div>
                ))}
              </div>

              {/* Milestone + task chart rows */}
              {normalized.map((m, mi) => {
                const rowKey   = m._id || String(mi);
                const expanded = expandedIds.has(rowKey);
                const isEven   = mi % 2 === 0;
                const c        = STATUS_COLORS[m.status] || STATUS_COLORS['Pending'];

                const barLeft  = Math.max(0, diffDays(viewStart, m.barStart)) * DAY_W;
                const barDays  = Math.max(1, diffDays(m.barStart, m.barEnd) + 1);
                const barWidth = barDays * DAY_W;

                const done  = m.tasks.filter((t: any) => t.isCompleted).length;
                const total = m.tasks.length;
                const pct   = total > 0 ? Math.round((done / total) * 100) : (m.status === 'Completed' ? 100 : 0);

                const WeekendShading = () => (
                  <>
                    {Array.from({ length: totalDays }).map((_, di) => {
                      const d = addDays(viewStart, di);
                      return (d.getDay() === 0 || d.getDay() === 6) ? (
                        <div key={di} className="absolute top-0 bottom-0 bg-gray-100/50" style={{ left: di * DAY_W, width: DAY_W }} />
                      ) : null;
                    })}
                  </>
                );

                return (
                  <div key={rowKey}>
                    {/* Milestone chart row */}
                    <div
                      className={cn('relative border-b border-gray-100', isEven ? 'bg-white' : 'bg-gray-50/40')}
                      style={{ height: MILESTONE_H, width: totalDays * DAY_W }}
                    >
                      <WeekendShading />

                      {/* Today line */}
                      {todayVisible && (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-red-400/80 z-10" style={{ left: todayOffset * DAY_W + DAY_W / 2 }} />
                      )}

                      {/* Milestone bar */}
                      <div
                        className={cn('absolute top-4 h-9 rounded-xl border overflow-hidden z-20 flex items-center', c.fill, c.border)}
                        style={{ left: barLeft, width: barWidth }}
                        title={`${m.label} — ${pct}%`}
                      >
                        {/* Progress fill */}
                        <div
                          className={cn('absolute left-0 top-0 bottom-0 rounded-xl transition-all', c.bar)}
                          style={{ width: `${pct}%`, opacity: 0.75 }}
                        />
                        {/* Label */}
                        <span className={cn('relative px-2.5 text-[9px] font-black uppercase tracking-wider truncate', c.text)}>
                          {barWidth > 80 ? m.label : (m.status || 'Pending')}
                        </span>
                        {pct > 0 && barWidth > 90 && (
                          <span className={cn('relative ml-auto px-2 text-[9px] font-black shrink-0', c.text)}>{pct}%</span>
                        )}
                      </div>
                    </div>

                    {/* Task chart rows */}
                    {expanded && m.tasks.map((task: any, ti: number) => (
                      <div
                        key={task._id || ti}
                        className={cn('relative border-b border-gray-100', isEven ? 'bg-blue-50/20' : 'bg-blue-50/30')}
                        style={{ height: TASK_H, width: totalDays * DAY_W }}
                      >
                        <WeekendShading />

                        {/* Today line */}
                        {todayVisible && (
                          <div className="absolute top-0 bottom-0 w-0.5 bg-red-400/60 z-10" style={{ left: todayOffset * DAY_W + DAY_W / 2 }} />
                        )}

                        {/* Task bar — spans parent's date range, inset slightly */}
                        <div
                          className={cn(
                            'absolute top-2.5 h-5 rounded-lg border z-20 flex items-center px-2 overflow-hidden',
                            task.isCompleted
                              ? 'bg-emerald-500 border-emerald-600'
                              : 'bg-white border-gray-300 border-dashed'
                          )}
                          style={{ left: barLeft + 12, width: Math.max(DAY_W * 2, barWidth - 24) }}
                          title={task.title || task.name}
                        >
                          <span className={cn(
                            'text-[8px] font-bold truncate',
                            task.isCompleted ? 'text-white' : 'text-slate-400'
                          )}>
                            {task.title || task.name || 'Task'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(STATUS_COLORS).map(([status, c]) => {
          const count = normalized.filter(m => (m.status || 'Pending') === status).length;
          return (
            <div key={status} className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
              <p className={cn('text-2xl font-black', c.text)}>{count}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{status}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
