'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Calendar, AlertTriangle, CheckCircle2,
  RefreshCw, X, Download, Info, UserPlus, Users
} from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useToast } from '@/providers/ToastContext';
import api from '@/services/api.client';
import { cn } from '@/lib/utils';
import { isProjectLocked } from '@/lib/permissions';
import { LabourManagementTab } from './LabourManagementTab';

interface AttendanceTabProps {
  projectId: string;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ projectId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const userRoleName = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const isManagerOrAdmin = userRoleName === 'Admin' || userRoleName === 'Project Manager';

  // ── States ──
  const [project, setProject] = useState<any>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [monthlyLogs, setMonthlyLogs] = useState<any[]>([]);

  const [loadingLogs, setLoadingLogs] = useState(true);

  // Reports Filter
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportUser, setReportUser] = useState('all');
  const [projectUsers, setProjectUsers] = useState<any[]>([]);

  // Lightbox Selfie
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Export States
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [exportEndDate, setExportEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [exportUser, setExportUser] = useState('all');
  const [exporting, setExporting] = useState(false);

  // Team / Labour split (admins & managers only)
  const [activeSection, setActiveSection] = useState<'Team' | 'Labour'>('Team');

  // Manual Override States
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualUserId, setManualUserId] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  // Fetch Project details
  const fetchProjectDetails = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
    } catch (err) {
      toast.error('Failed to load project details');
    }
  };

  // Fetch Attendance logs for current month (useful for both Daily and Monthly sections)
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      // Fetch for current month
      const currentMonth = new Date().toISOString().substring(0, 7);
      const res = await api.get(`/attendance/monthly?projectId=${projectId}&month=${currentMonth}`);

      const records = res.data?.records || [];
      // Group records: today's date vs others
      const todayStr = new Date().toISOString().substring(0, 10);
      const todayRecords = records.filter((r: any) => r.attendanceDate === todayStr);

      setDailyLogs(todayRecords);

      // Update monthly view
      if (reportMonth === currentMonth) {
        setMonthlyLogs(records);
      }
    } catch (err) {
      console.error('Error fetching attendance logs', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch Monthly history based on filter
  const fetchMonthlyHistory = async () => {
    try {
      const res = await api.get(`/attendance/monthly?projectId=${projectId}&month=${reportMonth}`);
      let records = res.data?.records || [];
      if (reportUser !== 'all') {
        records = records.filter((r: any) => (r.user?._id || r.user) === reportUser);
      }
      setMonthlyLogs(records);
    } catch (err) {
      console.error('Error fetching monthly history', err);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchLogs();
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchMonthlyHistory();
    }
  }, [reportMonth, reportUser, projectId]);

  // Extract users list from logs for filter dropdown
  useEffect(() => {
    if (monthlyLogs.length > 0) {
      const uniqueUsers: any[] = [];
      const userIds = new Set();
      monthlyLogs.forEach((log: any) => {
        if (log.user && typeof log.user === 'object' && !userIds.has(log.user._id)) {
          userIds.add(log.user._id);
          uniqueUsers.push(log.user);
        }
      });
      setProjectUsers(uniqueUsers);
    }
  }, [monthlyLogs]);

  const handleManualOverride = async () => {
    if (!manualUserId) return;
    if (isProjectLocked(project)) { toast.error('This project is locked and can no longer be modified.'); return; }
    setSubmittingManual(true);
    try {
      const todayStr = new Date().toISOString().substring(0, 10);
      await api.post('/attendance/manual', { projectId, userId: manualUserId, date: todayStr });
      toast.success('Attendance marked manually!');
      setManualModalVisible(false);
      setManualUserId('');
      fetchLogs();
      fetchMonthlyHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportStartDate || !exportEndDate) {
      toast.error('Please select both start and end dates.');
      return;
    }
    if (new Date(exportStartDate) > new Date(exportEndDate)) {
      toast.error('Start date cannot be after end date.');
      return;
    }

    setExporting(true);
    try {
      let url = `/attendance/export?projectId=${projectId}&startDate=${exportStartDate}&endDate=${exportEndDate}`;
      if (exportUser !== 'all') {
        url += `&userId=${exportUser}`;
      }

      const response = await api.get(url, {
        responseType: 'blob',
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Attendance_Export_${exportStartDate}_to_${exportEndDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Attendance exported successfully!');
      setIsExportOpen(false);
    } catch (err: any) {
      console.error('Export failed', err);
      toast.error('Failed to export attendance. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Helper to format Date
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Members who haven't checked in today — eligible for manual override
  const presentUserIds = dailyLogs.map((r: any) => r.user?._id || r.user).filter(Boolean);
  const eligibleTeamMembers = (project?.members || [])
    .map((m: any) => m.user)
    .filter((u: any) => u && !presentUserIds.includes(u._id));

  return (
    <div className="space-y-6">

      {/* Tabs for reporting: Today's Logs vs Monthly History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Sub-tab selection */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex-wrap gap-3">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
            {isManagerOrAdmin ? 'Attendance' : 'Attendance Logs & Reports'}
          </h3>

          {isManagerOrAdmin && (
            <div className="flex p-1 bg-gray-100 border border-gray-200 rounded-xl">
              <button
                onClick={() => setActiveSection('Team')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                  activeSection === 'Team' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-gray-900'
                )}
              >
                <Users className="w-3.5 h-3.5" /> Team
              </button>
              <button
                onClick={() => setActiveSection('Labour')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                  activeSection === 'Labour' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-gray-900'
                )}
              >
                <UserPlus className="w-3.5 h-3.5" /> Labour
              </button>
            </div>
          )}
        </div>

        {isManagerOrAdmin && activeSection === 'Labour' ? (
          <div className="p-6">
            <LabourManagementTab projectId={projectId} />
          </div>
        ) : (
        <div className="p-6 space-y-6">
          {/* Today's log for the project */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">On-Site Log (Today)</h4>
              </div>
              {isManagerOrAdmin && !isProjectLocked(project) && (
                <button
                  onClick={() => setManualModalVisible(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Manual Override
                </button>
              )}
            </div>

            {loadingLogs ? (
              <div className="flex justify-center py-10">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
            ) : dailyLogs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">No one has checked in today yet.</p>
              </div>
            ) : (
              <>
                {/* Mobile: stacked cards */}
                <div className="sm:hidden space-y-3">
                  {dailyLogs.map((log) => (
                    <div key={log._id} className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-950 text-xs truncate">{log.user?.name || 'Unknown User'}</p>
                          <p className="text-[10px] text-slate-400 font-semibold truncate">{log.user?.email}</p>
                        </div>
                        <span className={cn(
                          "shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border",
                          log.status === 'Late'
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : log.status === 'Half Day'
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : log.status === 'Absent'
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}>
                          {log.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-600 font-semibold flex-wrap">
                        <span>In: {formatTime(log.checkInTime)}</span>
                        <span>Out: {formatTime(log.checkOutTime)}</span>
                        <span className="font-mono font-bold text-slate-800">
                          {log.totalWorkHours ? `${log.totalWorkHours.toFixed(2)}h` : 'Active'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        {log.withinAllowedRadius ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified ({Math.round(log.siteDistanceInMeters || 0)}m)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3" />
                            Outside ({Math.round(log.siteDistanceInMeters || 0)}m)
                          </span>
                        )}
                        {log.checkInPhoto && (
                          <button onClick={() => setLightboxPhoto(log.checkInPhoto)} className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 relative hover:opacity-85 transition-opacity shrink-0">
                            <img src={log.checkInPhoto} alt="Selfie" className="w-full h-full object-cover" />
                          </button>
                        )}
                      </div>

                      {log.notes && (
                        <p className="text-[10px] text-slate-500 italic font-medium">{log.notes}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 font-bold text-slate-600">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Check-In</th>
                        <th className="py-3 px-4">Check-Out</th>
                        <th className="py-3 px-4">Working Hours</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Geofence Verified</th>
                        <th className="py-3 px-4 text-center">Selfie</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dailyLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-950">
                            {log.user?.name || 'Unknown User'}
                            <span className="block text-[10px] text-slate-400 font-semibold">{log.user?.email}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{formatTime(log.checkInTime)}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{formatTime(log.checkOutTime)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {log.totalWorkHours ? `${log.totalWorkHours.toFixed(2)}h` : 'Active'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold border",
                              log.status === 'Late'
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : log.status === 'Half Day'
                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                  : log.status === 'Absent'
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {log.withinAllowedRadius ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Yes ({Math.round(log.siteDistanceInMeters || 0)}m)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>No ({Math.round(log.siteDistanceInMeters || 0)}m away)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {log.checkInPhoto && (
                              <button onClick={() => setLightboxPhoto(log.checkInPhoto)} className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 inline-block relative hover:opacity-85 transition-opacity">
                                <img src={log.checkInPhoto} alt="Selfie" className="w-full h-full object-cover" />
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 italic font-medium max-w-[150px] truncate" title={log.notes}>
                            {log.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6">
            {/* Monthly History filtering */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Monthly Records History</h4>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Month filter */}
                <input
                  type="month"
                  value={reportMonth}
                  onChange={e => setReportMonth(e.target.value)}
                  className="flex-1 sm:flex-none min-w-[130px] bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-bold focus:outline-none transition-all"
                />

                {/* User filter (Admin/Manager only) */}
                {isManagerOrAdmin && (
                  <select
                    value={reportUser}
                    onChange={e => setReportUser(e.target.value)}
                    className="flex-1 sm:flex-none min-w-[130px] bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-bold focus:outline-none transition-all"
                  >
                    <option value="all">All Employees</option>
                    {projectUsers.map((u: any) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                )}

                {/* Export button */}
                <button
                  type="button"
                  onClick={() => setIsExportOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl py-1.5 px-3 text-xs font-bold transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {monthlyLogs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">No records found for this period.</p>
              </div>
            ) : (
              <>
                {/* Mobile: stacked cards */}
                <div className="sm:hidden space-y-3">
                  {monthlyLogs.map((log) => (
                    <div key={log._id} className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-xs">{formatDate(log.attendanceDate)}</p>
                          <p className="text-[10px] text-slate-500 font-semibold truncate">{log.user?.name || 'Unknown User'}</p>
                        </div>
                        <span className={cn(
                          "shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border",
                          log.status === 'Late'
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : log.status === 'Half Day'
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : log.status === 'Absent'
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}>
                          {log.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
                        <span>In: {formatTime(log.checkInTime)}</span>
                        <span>Out: {formatTime(log.checkOutTime)}</span>
                        <span className="font-mono font-bold text-slate-800">
                          {log.totalWorkHours ? `${log.totalWorkHours.toFixed(2)}h` : 'Active'}
                        </span>
                      </div>

                      {log.withinAllowedRadius ? (
                        <p className="text-[10px] text-emerald-600 font-semibold">Verified ({Math.round(log.siteDistanceInMeters || 0)}m)</p>
                      ) : (
                        <p className="text-[10px] text-red-600 font-semibold">Outside ({Math.round(log.siteDistanceInMeters || 0)}m)</p>
                      )}

                      {log.notes && (
                        <p className="text-[10px] text-slate-500 italic">{log.notes}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 font-bold text-slate-600">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">In Time</th>
                        <th className="py-3 px-4">Out Time</th>
                        <th className="py-3 px-4">Hours</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Geofence</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {monthlyLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900">{formatDate(log.attendanceDate)}</td>
                          <td className="py-3 px-4 font-bold text-slate-700">{log.user?.name || 'Unknown User'}</td>
                          <td className="py-3 px-4 text-slate-600">{formatTime(log.checkInTime)}</td>
                          <td className="py-3 px-4 text-slate-600">{formatTime(log.checkOutTime)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {log.totalWorkHours ? `${log.totalWorkHours.toFixed(2)}h` : 'Active'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold border",
                              log.status === 'Late'
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : log.status === 'Half Day'
                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                  : log.status === 'Absent'
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {log.withinAllowedRadius ? (
                              <span className="text-emerald-600 font-semibold">Verified ({Math.round(log.siteDistanceInMeters || 0)}m)</span>
                            ) : (
                              <span className="text-red-600 font-semibold">Outside ({Math.round(log.siteDistanceInMeters || 0)}m)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 italic max-w-[120px] truncate" title={log.notes}>
                            {log.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
        )}

      </div>

      {/* ── Lightbox Modal for selfie ── */}
      <AnimatePresence>
        {lightboxPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLightboxPhoto(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 max-w-lg w-full bg-white rounded-3xl overflow-hidden border border-gray-800 shadow-2xl p-2"
            >
              <button
                onClick={() => setLightboxPhoto(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>
              <img src={lightboxPhoto} alt="Expanded Selfie" className="w-full aspect-square object-cover rounded-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Export Modal ── */}
      <AnimatePresence>
        {isExportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsExportOpen(false)}
              className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md relative z-10 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-black text-gray-900 text-base">Export Attendance Report</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Excel / XLSX Format</p>
                </div>
                <button
                  onClick={() => setIsExportOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-gray-900 bg-white border border-gray-100 rounded-lg transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleExport} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Start Date</label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={e => setExportStartDate(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">End Date</label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={e => setExportEndDate(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {isManagerOrAdmin && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Employee Filter</label>
                    <select
                      value={exportUser}
                      onChange={e => setExportUser(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="all">All Employees</option>
                      {projectUsers.map((u: any) => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 leading-normal font-medium">
                    This will export attendance records for the selected period. The resulting Excel document will contain date, employee name, check-in time, check-out time, status, and total work hours.
                  </p>
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsExportOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={exporting}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-xs disabled:opacity-50 shadow-lg shadow-blue-600/10 flex items-center justify-center gap-1.5"
                  >
                    {exporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>{exporting ? 'Exporting...' : 'Export File'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Manual Override Modal ── */}
      <AnimatePresence>
        {manualModalVisible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setManualModalVisible(false); setManualUserId(''); }}
              className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md relative z-10 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-gray-900 text-base">Manual Override</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mark a team member present today</p>
                </div>
                <button
                  onClick={() => { setManualModalVisible(false); setManualUserId(''); }}
                  className="p-1.5 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                <p className="text-xs text-slate-500">
                  Select a member who hasn&apos;t checked in today ({new Date().toLocaleDateString()}):
                </p>

                {eligibleTeamMembers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">All team members are already present!</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {eligibleTeamMembers.map((member: any) => (
                      <button
                        key={member._id}
                        type="button"
                        onClick={() => setManualUserId(member._id)}
                        className={cn(
                          'w-full text-left p-3 rounded-xl border transition-all text-sm font-semibold',
                          manualUserId === member._id
                            ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-300 text-blue-700'
                            : 'bg-gray-50 border-gray-200 text-slate-600 hover:border-gray-300'
                        )}
                      >
                        {member.name || member.email}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setManualModalVisible(false); setManualUserId(''); }}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold transition-all text-xs"
                  >
                    Cancel
                  </button>
                  {eligibleTeamMembers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleManualOverride}
                      disabled={!manualUserId || submittingManual}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-xs disabled:opacity-50 shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-1.5"
                    >
                      {submittingManual ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Mark Present</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
