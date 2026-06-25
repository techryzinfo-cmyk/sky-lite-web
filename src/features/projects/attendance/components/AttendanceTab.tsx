'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, MapPin, User, Calendar, Camera, AlertTriangle, CheckCircle2,
  RefreshCw, Play, Square, X, Eye, Settings, Map, ChevronLeft, ChevronRight,
  TrendingUp, Download, Info
} from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useToast } from '@/providers/ToastContext';
import api from '@/services/api.client';
import { cn } from '@/lib/utils';

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
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [monthlyLogs, setMonthlyLogs] = useState<any[]>([]);
  
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [submittingCheck, setSubmittingCheck] = useState(false);

  // Check-In Modal & Form States
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [checkNote, setCheckNote] = useState('');
  
  // Geolocation Simulation & Details
  const [simulateLocation, setSimulateLocation] = useState(true); // Default to true in dev for easier testing
  const [locSimulationType, setLocSimulationType] = useState<'onsite' | 'offsite'>('onsite');
  const [realLocation, setRealLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

  // Photo Capture
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Geofence Settings Form
  const [geoAddress, setGeoAddress] = useState('');
  const [geoLat, setGeoLat] = useState('');
  const [geoLng, setGeoLng] = useState('');
  const [geoRadius, setGeoRadius] = useState(100);
  const [savingGeofence, setSavingGeofence] = useState(false);

  // Reports Filter
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportUser, setReportUser] = useState('all');
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  
  // Lightbox Selfie
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Active Timer
  const [timerText, setTimerText] = useState('00:00:00');

  // Fetch Project details
  const fetchProjectDetails = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
      if (res.data?.siteLocation) {
        setGeoAddress(res.data.siteLocation.address || '');
        setGeoLat(res.data.siteLocation.latitude?.toString() || '');
        setGeoLng(res.data.siteLocation.longitude?.toString() || '');
      }
      setGeoRadius(res.data?.attendanceRadius ?? 100);
    } catch (err) {
      toast.error('Failed to load project details');
    } finally {
      setLoadingProject(false);
    }
  };

  // Fetch Today's user session
  const fetchTodayStatus = async () => {
    setLoadingToday(true);
    try {
      const res = await api.get(`/attendance/today?projectId=${projectId}`);
      setTodayRecord(res.data?.record || null);
    } catch (err) {
      console.error('Error fetching today status', err);
    } finally {
      setLoadingToday(false);
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
      fetchTodayStatus();
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

  // Active Timer Effect
  useEffect(() => {
    if (!todayRecord || todayRecord.checkOutTime) {
      setTimerText('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const checkIn = new Date(todayRecord.checkInTime).getTime();
      const now = new Date().getTime();
      const diff = now - checkIn;

      if (diff < 0) {
        setTimerText('00:00:00');
        return;
      }

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimerText(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [todayRecord]);

  // ── Camera Helpers ──
  const startCamera = async () => {
    setCapturedPhoto(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 480 },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraPermission('granted');
    } catch (err) {
      console.error('Camera access failed', err);
      setCameraPermission('denied');
      toast.error('Could not access camera. Please upload a photo manually or grant permission.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 480, 480);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  // ── Location Helpers ──
  const getCoordinates = (): Promise<{ latitude: number; longitude: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      if (simulateLocation) {
        // Return simulated coordinates based on project coordinates or placeholder
        const projLat = Number(geoLat) || 25.078;
        const projLng = Number(geoLng) || 55.135;
        if (locSimulationType === 'onsite') {
          // Exactly on site (with minor noise)
          resolve({
            latitude: projLat + (Math.random() - 0.5) * 0.0001,
            longitude: projLng + (Math.random() - 0.5) * 0.0001,
            accuracy: 10
          });
        } else {
          // 2km away
          resolve({
            latitude: projLat + 0.02,
            longitude: projLng + 0.02,
            accuracy: 15
          });
        }
        return;
      }

      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setRealLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // ── Actions ──
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedPhoto) {
      toast.error('Selfie photo is required for attendance validation.');
      return;
    }

    setSubmittingCheck(true);
    try {
      const location = await getCoordinates();
      
      const payload = {
        projectId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: simulateLocation ? 'Simulated Location' : 'Web Check-In Browser Location'
        },
        checkInPhoto: capturedPhoto,
        notes: checkNote || undefined,
        deviceInfo: {
          platform: 'Web Browser',
          appVersion: '1.0.0'
        }
      };

      const res = await api.post('/attendance/check-in', payload);
      toast.success(res.data?.message || 'Checked in successfully!');
      setIsCheckInOpen(false);
      setCheckNote('');
      setCapturedPhoto(null);
      fetchTodayStatus();
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Check-in failed. Please verify your geofence radius.');
    } finally {
      setSubmittingCheck(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmittingCheck(true);
    try {
      const location = await getCoordinates();

      const payload = {
        projectId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: simulateLocation ? 'Simulated Location' : 'Web Check-Out Browser Location'
        }
      };

      const res = await api.put('/attendance/check-out', payload);
      toast.success(res.data?.message || 'Checked out successfully!');
      setIsCheckOutOpen(false);
      fetchTodayStatus();
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Check-out failed.');
    } finally {
      setSubmittingCheck(false);
    }
  };

  const saveGeofenceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geoLat || !geoLng) {
      toast.error('Geofence coordinates are required');
      return;
    }

    setSavingGeofence(true);
    try {
      await api.patch(`/projects/${projectId}`, {
        siteLocation: {
          address: geoAddress,
          latitude: Number(geoLat),
          longitude: Number(geoLng)
        },
        attendanceRadius: Number(geoRadius)
      });
      toast.success('Geofencing settings updated successfully!');
      fetchProjectDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update geofence');
    } finally {
      setSavingGeofence(false);
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

  return (
    <div className="space-y-6">
      
      {/* Upper Grid: Status Widget & Geofence Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Check-In/Out widget */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between h-[360px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attendance Status</span>
              {todayRecord ? (
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                  todayRecord.checkOutTime 
                    ? "bg-gray-100 text-slate-500 border-gray-200" 
                    : todayRecord.status === 'Late'
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-green-100 text-green-700 border-green-200"
                )}>
                  {todayRecord.checkOutTime ? 'Session Completed' : todayRecord.status}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border bg-red-100 text-red-700 border-red-200">
                  Not Checked In
                </span>
              )}
            </div>

            {loadingToday ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-xs text-slate-400 font-bold">Checking sessions...</span>
              </div>
            ) : todayRecord ? (
              <div className="space-y-4">
                {/* Active Session details */}
                <div className="flex items-center gap-3">
                  {todayRecord.checkInPhoto ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 cursor-pointer relative group shrink-0" onClick={() => setLightboxPhoto(todayRecord.checkInPhoto)}>
                      <img src={todayRecord.checkInPhoto} alt="Selfie" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-slate-400 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-semibold">Today's Check-in</p>
                    <p className="text-sm font-black text-gray-900">{formatTime(todayRecord.checkInTime)}</p>
                    {todayRecord.checkOutTime && (
                      <p className="text-xs text-slate-500 font-semibold">Checkout: {formatTime(todayRecord.checkOutTime)}</p>
                    )}
                  </div>
                </div>

                {!todayRecord.checkOutTime ? (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Active Working Time</span>
                    <span className="text-2xl font-black text-blue-900 font-mono tracking-tight mt-1">{timerText}</span>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Working Hours</span>
                    <span className="text-2xl font-black text-slate-700 font-mono tracking-tight mt-1">
                      {todayRecord.totalWorkHours?.toFixed(2) || '0.00'} hrs
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm font-semibold text-slate-500 max-w-[200px] mx-auto">
                  You haven't checked in for this project today.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100">
            {!todayRecord ? (
              <button
                onClick={() => { setIsCheckInOpen(true); startCamera(); }}
                disabled={loadingToday}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/10 transition-all text-sm active:scale-[0.98] disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                <span>Check In to Site</span>
              </button>
            ) : !todayRecord.checkOutTime ? (
              <button
                onClick={() => setIsCheckOutOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-600/10 transition-all text-sm active:scale-[0.98]"
              >
                <Clock className="w-4 h-4" />
                <span>Check Out of Site</span>
              </button>
            ) : (
              <div className="text-xs font-semibold text-slate-400 text-center py-2 bg-slate-50 rounded-xl border border-gray-200/50">
                Attendance logged for today
              </div>
            )}
          </div>
        </div>

        {/* Geofence Configuration card (Manager/Admin only) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between h-[360px]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Geofencing & Site Location</span>
            </div>
            
            {loadingProject ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
            ) : isManagerOrAdmin ? (
              <form onSubmit={saveGeofenceSettings} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Project Site Address</label>
                  <input
                    type="text"
                    value={geoAddress}
                    onChange={e => setGeoAddress(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                    placeholder="e.g. Dubai Marina Tower, Sector 4"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={geoLat}
                      onChange={e => setGeoLat(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      placeholder="e.g. 25.078"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={geoLng}
                      onChange={e => setGeoLng(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      placeholder="e.g. 55.135"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Allowed Radius (m)</label>
                    <input
                      type="number"
                      required
                      value={geoRadius}
                      onChange={e => setGeoRadius(Number(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      placeholder="e.g. 100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-200/50 p-3 rounded-xl">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Geofencing prevents workers from checking in if they are outside this allowed radius.</span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingGeofence}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {savingGeofence ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Settings className="w-3.5 h-3.5" />}
                    <span>Save Geofence Settings</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 py-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <Map className="w-8 h-8 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{project?.siteLocation?.address || 'Address Unspecified'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Coordinates: {project?.siteLocation?.latitude || '—'}, {project?.siteLocation?.longitude || '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Attendance Radius: {project?.attendanceRadius || 100} meters
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 text-center">
                  Only Project Managers and Administrators can modify Geofencing targets.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Tabs for reporting: Today's Logs vs Monthly History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Sub-tab selection */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <div className="px-6 py-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Attendance Logs & Reports</h3>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Today's log for the project */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">On-Site Log (Today)</h4>
              </div>
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
              <div className="overflow-x-auto rounded-xl border border-gray-200">
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
            )}
          </div>

          <div className="border-t border-gray-100 pt-6">
            {/* Monthly History filtering */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Monthly Records History</h4>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Month filter */}
                <input
                  type="month"
                  value={reportMonth}
                  onChange={e => setReportMonth(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-bold focus:outline-none transition-all"
                />

                {/* User filter (Admin/Manager only) */}
                {isManagerOrAdmin && (
                  <select
                    value={reportUser}
                    onChange={e => setReportUser(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-bold focus:outline-none transition-all"
                  >
                    <option value="all">All Employees</option>
                    {projectUsers.map((u: any) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {monthlyLogs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">No records found for this period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
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
            )}
          </div>
        </div>

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

      {/* ── Check-In Modal ── */}
      <AnimatePresence>
        {isCheckInOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setIsCheckInOpen(false); stopCamera(); }}
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
                  <h3 className="font-black text-gray-900 text-base">Check-In Verification</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Location & Photo Verification Required</p>
                </div>
                <button
                  onClick={() => { setIsCheckInOpen(false); stopCamera(); }}
                  className="p-1.5 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCheckIn} className="p-6 space-y-5 overflow-y-auto">
                
                {/* Geolocation simulation panel for development testing */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Developer Simulation Mode</span>
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simulateLocation}
                        onChange={e => setSimulateLocation(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {simulateLocation ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-amber-700 leading-tight">
                        Since browser geolocations require HTTPS/real GPS coordinate calibration, you can choose if the check-in occurs within the geofenced circle or outside.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setLocSimulationType('onsite')}
                          className={cn(
                            "py-1.5 px-3 rounded-lg text-xs font-bold border transition-all",
                            locSimulationType === 'onsite'
                              ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                              : "bg-white border-amber-200 text-amber-700 hover:bg-amber-100/30"
                          )}
                        >
                          On Site (Within Radius)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocSimulationType('offsite')}
                          className={cn(
                            "py-1.5 px-3 rounded-lg text-xs font-bold border transition-all",
                            locSimulationType === 'offsite'
                              ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                              : "bg-white border-amber-200 text-amber-700 hover:bg-amber-100/30"
                          )}
                        >
                          Off Site (Outside Radius)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Will request actual device geolocation (`navigator.geolocation`) upon submission.
                    </p>
                  )}
                </div>

                {/* Webcam viewport / Captured selfie preview */}
                <div className="flex flex-col items-center">
                  <span className="block text-[10px] font-bold text-slate-600 self-start mb-1.5">Verify Identity Selfie *</span>
                  <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-gray-200 relative flex items-center justify-center">
                    {capturedPhoto ? (
                      <img src={capturedPhoto} alt="Captured Selfie" className="w-full h-full object-cover" />
                    ) : cameraActive ? (
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover scale-x-[-1]"
                        playsInline
                        muted
                      />
                    ) : (
                      <div className="text-center p-6 space-y-3">
                        <Camera className="w-10 h-10 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-400 font-semibold max-w-[200px]">
                          Camera permission requested to verify presence
                        </p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
                        >
                          Start Camera
                        </button>
                      </div>
                    )}

                    {/* Camera Control overlay */}
                    {cameraActive && !capturedPhoto && (
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-white hover:bg-slate-100 border-4 border-slate-900/10 hover:border-slate-950/20 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all z-10"
                      />
                    )}
                  </div>

                  {capturedPhoto && (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retake Snapshot</span>
                    </button>
                  )}
                </div>

                {/* Note Field */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={checkNote}
                    onChange={e => setCheckNote(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                    placeholder="e.g. Sheikh Zayed Road traffic delay"
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsCheckInOpen(false); stopCamera(); }}
                    className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCheck || !capturedPhoto}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-xs disabled:opacity-50 shadow-lg shadow-blue-600/10 flex items-center justify-center gap-1.5"
                  >
                    {submittingCheck ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Verify & Check In</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Check-Out Modal ── */}
      <AnimatePresence>
        {isCheckOutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCheckOutOpen(false)}
              className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm relative z-10 bg-white rounded-2xl shadow-xl border border-gray-200 p-6 space-y-5 text-center flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-black text-gray-900 text-lg">Check Out of Site</h3>
                <p className="text-xs text-slate-500">
                  Are you ready to submit your work hours and checkout of the project site?
                </p>
              </div>

              {/* Developer simulation check for Checkout */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-800">Developer Simulation Mode</span>
                  <input
                    type="checkbox"
                    checked={simulateLocation}
                    onChange={e => setSimulateLocation(e.target.checked)}
                    className="w-3.5 h-3.5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                </div>
                {simulateLocation && (
                  <p className="text-[9px] text-amber-700 leading-tight">
                    Check-out coordinates will be simulated.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckOutOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={submittingCheck}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all text-xs disabled:opacity-50 shadow-lg shadow-red-600/10 flex items-center justify-center gap-1"
                >
                  {submittingCheck ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  <span>Confirm Checkout</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
