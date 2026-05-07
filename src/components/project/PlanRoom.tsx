'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Upload,
  FileText,
  MoreVertical,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Send,
  Loader2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { DocumentViewer } from './DocumentViewer';

interface PlanRoomProps {
  folder: any;
  projectId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export const PlanRoom: React.FC<PlanRoomProps> = ({ folder, projectId, onBack, onUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'Admin';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const dummyUrl = URL.createObjectURL(file);
      await api.put(`/projects/${projectId}/folders/${folder._id}`, {
        url: dummyUrl,
        name: file.name,
        mimeType: file.type,
        size: file.size
      });
      toast.success('Document uploaded successfully!');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAction = async (docId: string, action: string, extra = {}) => {
    setIsProcessing(true);
    try {
      await api.patch(`/projects/${projectId}/folders/${folder._id}`, {
        docId,
        action,
        ...extra
      });
      toast.success(`Action '${action}' successful`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'Rejected': return 'text-red-700 bg-red-100 border-red-200';
      case 'Pending': return 'text-amber-700 bg-amber-100 border-amber-200';
      default: return 'text-slate-500 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-500 hover:text-gray-900 transition-colors group"
        >
          <div className="p-2 rounded-xl bg-gray-50 border border-gray-200 group-hover:border-gray-300">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">Back to Folders</span>
        </button>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 border border-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{isUploading ? 'Uploading...' : 'Upload Plan'}</span>
            <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      <GlassCard className="p-8 border-gray-200" gradient>
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-4 rounded-2xl bg-blue-100 border border-blue-200">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{folder.name}</h3>
            <p className="text-sm text-slate-500">{folder.documents?.length || 0} Documents total</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {folder.documents?.map((doc: any) => (
            <div key={doc._id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all group/item">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-gray-200 group-hover/item:border-blue-400 transition-all">
                    <FileIconSvg className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover/item:text-blue-600 transition-colors">{doc.name}</h4>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="text-[10px] text-slate-500 font-bold">{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        getStatusBadge(doc.approvalStatus)
                      )}>
                        {doc.approvalStatus || 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {doc.approvalStatus === 'Draft' && isAdmin && (
                    <button
                      onClick={() => handleAction(doc._id, 'sendForApproval', { approverIds: [user?.id] })}
                      className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-all"
                      title="Send for Approval"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}

                  {doc.approvalStatus === 'Pending' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAction(doc._id, 'respond', { response: 'Approved' })}
                        className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-all"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction(doc._id, 'respond', { response: 'Rejected' })}
                        className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="h-8 w-px bg-gray-200 mx-2" />

                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-slate-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                    title="View Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleAction(doc._id, 'deleteDocument')}
                      className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {doc.approvals?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center space-x-6">
                  {doc.approvals.map((app: any, i: number) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-[10px]",
                        app.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                        app.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      )}>
                        {app.status === 'Approved' ? <UserCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{app.userName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {(!folder.documents || folder.documents.length === 0) && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Upload className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-slate-500 italic">This folder is empty. Upload your first plan.</p>
            </div>
          )}
        </div>
      </GlassCard>

      <DocumentViewer
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
      />
    </div>
  );
};

const FileIconSvg = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
