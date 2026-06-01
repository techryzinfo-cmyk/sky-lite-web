'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck, Upload, Loader2, CheckCircle2,
  AlertTriangle, FileText, Download, Calendar, User, MessageSquare, Award
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import api from '@/lib/api';
import { uploadToCloudinary } from '@/lib/upload';
import { useToast } from '@/context/ToastContext';

interface HandoverTabProps {
  projectId: string;
  project: any;
  onUpdate: () => void;
}

export const HandoverTab: React.FC<HandoverTabProps> = ({ projectId, project, onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  
  // Form states
  const [clientRepName, setClientRepName] = useState('');
  const [handoverDate, setHandoverDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUrl, setDocUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [msRes, isRes] = await Promise.all([
          api.get(`/projects/${projectId}/milestones`),
          api.get(`/projects/${projectId}/issues`)
        ]);

        const msData = Array.isArray(msRes.data)
          ? msRes.data
          : Array.isArray(msRes.data?.milestones)
            ? msRes.data.milestones
            : [];
        setMilestones(msData);

        const isData = Array.isArray(isRes.data)
          ? isRes.data
          : Array.isArray(isRes.data?.issues)
            ? isRes.data.issues
            : [];
        setIssues(isData);
      } catch (err) {
        console.error('Error fetching checklist details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  // Checklist Calculations
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const isMilestonesDone = totalMilestones > 0 && completedMilestones === totalMilestones;
  
  const openIssues = issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length;
  const isIssuesClear = openIssues === 0;

  const canHandover = isMilestonesDone && isIssuesClear;

  // Handle Document upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    setUploadingDoc(true);
    try {
      const url = await uploadToCloudinary(file);
      setDocUrl(url);
      toast.success('Certificate uploaded successfully!');
    } catch {
      toast.error('Certificate upload failed');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmitHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientRepName.trim()) {
      toast.error('Client representative name is required');
      return;
    }
    if (!docUrl) {
      toast.error('Handover sign-off completion certificate is required');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save document to project's documents array
      if (docFile) {
        await api.post(`/projects/${projectId}/documents`, {
          url: docUrl,
          name: docFile.name,
          mimeType: docFile.type,
          size: docFile.size,
          category: 'Contract',
        });
      }

      // 2. Perform handover PATCH
      const formattedDetails = `Project Handover Completed. Client Representative: ${clientRepName.trim()}. Handover Date: ${handoverDate}. Notes: ${notes.trim() || 'None'}. Certificate URL: ${docUrl}`;
      
      await api.patch(`/projects/${projectId}`, {
        status: 'Completed',
        auditAction: 'StatusChange',
        auditDetails: formattedDetails
      });

      toast.success('Project Handover completed successfully!');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete handover');
    } finally {
      setSubmitting(false);
    }
  };

  // If already completed, parse audit trail for handover details
  const handoverAudit = project.auditTrail?.find(
    (log: any) => log.action === 'StatusChange' && log.details?.includes('Project Handover Completed')
  );

  const savedClientRep = handoverAudit?.details?.match(/Client Representative:\s*(.*?)(?=\.\s*\w+:|$)/)?.[1] || project.clientRepName || 'N/A';
  const savedHandoverDate = handoverAudit?.details?.match(/Handover Date:\s*(.*?)(?=\.\s*\w+:|$)/)?.[1] || 'N/A';
  const savedNotes = handoverAudit?.details?.match(/Notes:\s*(.*?)(?=\.\s*\w+:|$)/)?.[1] || 'None';
  const savedCertUrl = handoverAudit?.details?.match(/Certificate URL:\s*(.*?)(?=\.\s*\w+:|$)/)?.[1] || '';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-500 mt-2 text-sm">Verifying project handover checklist...</p>
      </div>
    );
  }

  // Completed State View
  if (project.status === 'Completed') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <GlassCard className="p-8 text-center border-emerald-200 overflow-hidden relative" gradient>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Award className="w-64 h-64 text-emerald-600" />
            </div>
            
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            
            <h3 className="text-2xl font-black text-emerald-900">Project Fully Completed!</h3>
            <p className="text-emerald-600 font-medium text-sm mt-1 max-w-md mx-auto">
              This project has successfully completed the structured handover process and is now securely archived.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Status</span>
                <span className="text-emerald-700 font-black text-sm mt-1 block">ARCHIVED</span>
              </div>
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Milestones</span>
                <span className="text-slate-800 font-black text-sm mt-1 block">{completedMilestones}/{totalMilestones} Completed</span>
              </div>
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Snags</span>
                <span className="text-slate-800 font-black text-sm mt-1 block">ALL CLEARED</span>
              </div>
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Handover Date</span>
                <span className="text-slate-800 font-black text-sm mt-1 block">{savedHandoverDate}</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Certificate Download Card */}
          <GlassCard className="p-6 border-gray-200" gradient>
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Completion Sign-Off
            </h4>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center py-6">
              <Award className="w-12 h-12 text-slate-400 mb-3" />
              {savedCertUrl ? (
                <a
                  href={savedCertUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Download Certificate
                </a>
              ) : (
                <span className="text-xs text-slate-400 italic">No document attached</span>
              )}
            </div>
          </GlassCard>

          {/* Handover Details */}
          <GlassCard className="p-6 md:col-span-2 border-gray-200" gradient>
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-500" />
              Handover Execution Log
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 border flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Client Representative</span>
                  <span className="text-sm font-semibold text-gray-800">{savedClientRep}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 border flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Handover Date</span>
                  <span className="text-sm font-semibold text-gray-800">{savedHandoverDate}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 border flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Feedback / Comments</span>
                  <span className="text-sm text-slate-600 italic leading-relaxed">"{savedNotes}"</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Handover Execution Form View
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {/* Checklist Card */}
      <div className="lg:col-span-1 space-y-6">
        <GlassCard className="p-6 border-gray-200" gradient>
          <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-blue-600" />
            Completion Checklist
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Verify that all tasks, objectives, and milestones are completed before execution.
          </p>

          <div className="space-y-4">
            {/* Milestones Checklist Item */}
            <div className={`p-4 rounded-xl border transition-all ${isMilestonesDone ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' : 'bg-red-50/50 border-red-100 text-red-900'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">Milestones Target</span>
                {isMilestonesDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <p className="text-xs opacity-80 mt-1 font-medium">
                {completedMilestones} of {totalMilestones} Milestones Completed
              </p>
              {!isMilestonesDone && (
                <span className="text-[10px] text-red-600 font-semibold block mt-1">
                  * All milestones must be set to "Completed".
                </span>
              )}
            </div>

            {/* Snags Checklist Item */}
            <div className={`p-4 rounded-xl border transition-all ${isIssuesClear ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' : 'bg-amber-50/50 border-amber-100 text-amber-900'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">Active Issues & Snags</span>
                {isIssuesClear ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-xs opacity-80 mt-1 font-medium">
                {openIssues} unresolved snags/issues remaining
              </p>
              {!isIssuesClear && (
                <span className="text-[10px] text-amber-600 font-semibold block mt-1">
                  * Resolve all open issues to prevent post-handover snags.
                </span>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Handover Form Card */}
      <div className="lg:col-span-2">
        <GlassCard className="p-6 border-gray-200" gradient>
          <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            Project Handover Sign-Off
          </h4>
          <p className="text-xs text-slate-400 mb-6">
            Input representative information and sign-off certifications to finalize the handover of the project.
          </p>

          {!canHandover && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold">Project is not ready for handover!</p>
                <p className="mt-0.5 opacity-90">Please ensure all milestones are marked Completed and all Issues/Snags are cleared before continuing.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitHandover} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Client Representative Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!canHandover || submitting}
                  value={clientRepName}
                  onChange={e => setClientRepName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Handover Date *
                </label>
                <input
                  type="date"
                  required
                  disabled={!canHandover || submitting}
                  value={handoverDate}
                  onChange={e => setHandoverDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Handover Document Uploader */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Completion Sign-Off Certificate *
              </label>
              {docUrl ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-xl">
                  <FileText className="w-8 h-8 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {docFile?.name || 'Handover_Certificate.pdf'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Uploaded & validated</p>
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => { setDocUrl(''); setDocFile(null); }}
                    className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 hover:border-blue-500/50 hover:bg-blue-50/20 rounded-2xl cursor-pointer transition-all ${(!canHandover || uploadingDoc) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="file"
                    disabled={!canHandover || uploadingDoc || submitting}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  {uploadingDoc ? (
                    <>
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                      <span className="text-xs text-slate-400 font-semibold">Uploading to secure servers...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs text-slate-500 font-bold">Upload Sign-Off Certificate</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">PDF, DOC, PNG, or JPG up to 10MB</span>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* Handover Comments */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Handover Notes / Feedback
              </label>
              <textarea
                rows={3}
                disabled={!canHandover || submitting}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Details of feedback, site transfer logs, or handover meeting logs..."
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={!canHandover || submitting || uploadingDoc}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing Project Handover...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Handover & Archive Project
                </>
              )}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};
