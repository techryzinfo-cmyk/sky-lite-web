'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, GanttChart, CalendarDays, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface TimelineTabProps {
  projectId: string;
}

const STATUS_COLORS: Record<string, { bar: string; border: string; text: string }> = {
  'Completed':   { bar: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-700' },
  'In Progress': { bar: 'bg-blue-500',    border: 'border-blue-600',    text: 'text-blue-700' },
  'Delayed':     { bar: 'bg-red-500',     border: 'border-red-600',     text: 'text-red-700' },
  'Pending':     { bar: 'bg-gray-300',    border: 'border-gray-400',    text: 'text-gray-600' },
  'On Hold':     { bar: 'bg-amber-400',   border: 'border-amber-500',   text: 'text-amber-700' },
};

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

const DAY_W = 28; // px per day column

export const TimelineTab: React.FC<TimelineTabProps> = ({ projectId }) => {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    api.get(`/projects/${projectId}/milestones`)
      .then(r => setMilestones(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load milestones'))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Building timeline...</p>
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-gray-200 rounded-3xl">
        <div className="p-6 rounded-full bg-gray-100 mb-6">
          <GanttChart className="w-12 h-12 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No timeline data yet</h3>
        <p className="text-slate-500 max-w-xs">Add milestones with due dates to visualize your project timeline.</p>
      </div>
    );
  }

  // Compute range
  const allDates = milestones.flatMap(m => [
    m.startDate ? new Date(m.startDate) : null,
    m.dueDate ? new Date(m.dueDate) : null,
  ]).filter(Boolean) as Date[];

  const today = startOfDay(new Date());
  const rangeStart = startOfDay(allDates.reduce((a, b) => a < b ? a : b));
  const rangeEnd = startOfDay(allDates.reduce((a, b) => a > b ? a : b));

  // Pad 7 days on each side
  const viewStart = addDays(rangeStart, -7);
  const viewEnd = addDays(rangeEnd, 7);
  const totalDays = diffDays(viewStart, viewEnd) + 1;

  const todayOffset = diffDays(viewStart, today);

  // Build month markers
  const months: { label: string; offset: number; span: number }[] = [];
  {
    let cur = new Date(viewStart.getFullYear(), viewStart.getMonth(), 1);
    while (cur <= viewEnd) {
      const monthStart = cur < viewStart ? viewStart : cur;
      const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const monthEnd = nextMonth > viewEnd ? viewEnd : addDays(nextMonth, -1);
      months.push({
        label: monthLabel(cur),
        offset: diffDays(viewStart, monthStart),
        span: diffDays(monthStart, monthEnd) + 1,
      });
      cur = nextMonth;
    }
  }

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * DAY_W * 7, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Project Timeline</h3>
          <p className="text-sm text-slate-500 mt-1">Gantt view of all milestones and their schedules.</p>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-3">
          {Object.entries(STATUS_COLORS).map(([s, c]) => (
            <div key={s} className="flex items-center space-x-1.5">
              <div className={cn('w-3 h-3 rounded-sm', c.bar)} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s}</span>
            </div>
          ))}
          <div className="flex items-center space-x-1.5">
            <div className="w-px h-3 bg-red-500" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Today</span>
          </div>
        </div>
      </div>

      {/* Scroll nav */}
      <div className="flex items-center justify-end space-x-2">
        <button onClick={() => scroll(-1)} className="p-2 rounded-xl bg-white border border-gray-200 text-slate-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={() => scroll(1)} className="p-2 rounded-xl bg-white border border-gray-200 text-slate-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Gantt table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex">
          {/* Left labels column */}
          <div className="w-52 shrink-0 border-r border-gray-200 bg-gray-50 z-10">
            {/* Header spacer row */}
            <div className="h-10 border-b border-gray-200 flex items-center px-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Milestone</span>
            </div>
            {/* Day-header row spacer */}
            <div className="h-8 border-b border-gray-200" />
            {/* Milestone rows */}
            {milestones.map((m, i) => {
              const c = STATUS_COLORS[m.status] || STATUS_COLORS['Pending'];
              return (
                <div key={m._id || i} className={cn('h-14 flex items-center px-4 border-b border-gray-100 last:border-0', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60')}>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <Flag className={cn('w-3 h-3 shrink-0', c.text)} />
                      <p className="text-xs font-bold text-gray-900 truncate">{m.name}</p>
                    </div>
                    <p className={cn('text-[9px] font-black uppercase tracking-widest mt-0.5', c.text)}>{m.status}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scrollable chart area */}
          <div ref={scrollRef} className="flex-1 overflow-x-auto custom-scrollbar">
            <div style={{ width: totalDays * DAY_W, minWidth: '100%', position: 'relative' }}>
              {/* Month header */}
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

              {/* Day numbers header */}
              <div className="h-8 border-b border-gray-200 flex items-end pb-1" style={{ width: totalDays * DAY_W }}>
                {Array.from({ length: totalDays }).map((_, di) => {
                  const d = addDays(viewStart, di);
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = di === todayOffset;
                  return (
                    <div
                      key={di}
                      className={cn(
                        'text-center text-[8px] font-bold shrink-0',
                        isToday ? 'text-red-500' : isWeekend ? 'text-slate-300' : 'text-slate-400'
                      )}
                      style={{ width: DAY_W }}
                    >
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>

              {/* Milestone rows */}
              {milestones.map((m, mi) => {
                const mStart = m.startDate ? startOfDay(new Date(m.startDate)) : null;
                const mEnd = m.dueDate ? startOfDay(new Date(m.dueDate)) : null;

                let barOffset = 0, barWidth = DAY_W;
                if (mEnd) {
                  const endOff = diffDays(viewStart, mEnd);
                  if (mStart) {
                    barOffset = diffDays(viewStart, mStart) * DAY_W;
                    barWidth = Math.max(DAY_W, (diffDays(mStart, mEnd) + 1) * DAY_W);
                  } else {
                    barOffset = endOff * DAY_W;
                    barWidth = DAY_W;
                  }
                }

                const c = STATUS_COLORS[m.status] || STATUS_COLORS['Pending'];
                const tasksDone = (m.tasks || []).filter((t: any) => t.isCompleted).length;
                const totalTasks = (m.tasks || []).length;
                const pct = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : (m.status === 'Completed' ? 100 : 0);

                return (
                  <div
                    key={m._id || mi}
                    className={cn('relative border-b border-gray-100 last:border-0', mi % 2 === 0 ? 'bg-white' : 'bg-gray-50/60')}
                    style={{ height: 56, width: totalDays * DAY_W }}
                  >
                    {/* Weekend shading */}
                    {Array.from({ length: totalDays }).map((_, di) => {
                      const d = addDays(viewStart, di);
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return isWeekend ? (
                        <div key={di} className="absolute top-0 bottom-0 bg-gray-100/60" style={{ left: di * DAY_W, width: DAY_W }} />
                      ) : null;
                    })}

                    {/* Today line */}
                    {todayOffset >= 0 && todayOffset < totalDays && (
                      <div className="absolute top-0 bottom-0 w-px bg-red-400/70 z-10" style={{ left: todayOffset * DAY_W + DAY_W / 2 }} />
                    )}

                    {/* Milestone bar */}
                    {mEnd && (
                      <div
                        className={cn('absolute top-3 h-8 rounded-lg border flex items-center px-2 overflow-hidden z-20', c.bar, c.border)}
                        style={{ left: barOffset, width: barWidth }}
                        title={`${m.name} — ${pct}%`}
                      >
                        {/* Progress fill */}
                        <div
                          className="absolute inset-0 bg-white/30 rounded-lg"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="relative text-[9px] font-black text-white truncate">{m.name}</span>
                        {pct > 0 && barWidth > 60 && (
                          <span className="relative ml-auto text-[9px] font-black text-white shrink-0">{pct}%</span>
                        )}
                      </div>
                    )}

                    {/* Diamond marker for milestones with only dueDate */}
                    {!m.startDate && mEnd && (
                      <div
                        className={cn('absolute top-4 w-5 h-5 rotate-45 border-2 z-20', c.bar, c.border)}
                        style={{ left: diffDays(viewStart, mEnd) * DAY_W + DAY_W / 2 - 10 }}
                      />
                    )}
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
          const count = milestones.filter(m => m.status === status).length;
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
