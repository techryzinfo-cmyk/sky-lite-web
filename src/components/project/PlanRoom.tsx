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
  FileIcon,
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
  const isAdmin = user?.role === 'Admin';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // In a real app, we would upload to Cloudinary/S3 here
      // For now, we simulate the upload and send the URL to backend
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
      case 'Approved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'Pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors group"
        >
          <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/10">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">Back to Folders</span>
        </button>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 border border-blue-500 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{isUploading ? 'Uploading...' : 'Upload Plan'}</span>
            <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      <GlassCard className="p-8 border-white/5" gradient>
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{folder.name}</h3>
            <p className="text-sm text-slate-500">{folder.documents?.length || 0} Documents total</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {folder.documents?.map((doc: any) => (
            <div key={doc._id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group/item">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 border border-white/5 group-hover/item:border-blue-500/30 transition-all">
                    <FileIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover/item:text-blue-400 transition-colors">{doc.name}</h4>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                      <span className="text-[10px] text-slate-500 font-bold">{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
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
                  {/* Approval Actions */}
                  {doc.approvalStatus === 'Draft' && isAdmin && (
                    <button 
                      onClick={() => handleAction(doc._id, 'sendForApproval', { approverIds: [user?.id] })}
                      className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 transition-all"
                      title="Send for Approval"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}

                  {doc.approvalStatus === 'Pending' && (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleAction(doc._id, 'respond', { response: 'Approved' })}
                        className="p-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 transition-all"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleAction(doc._id, 'respond', { response: 'Rejected' })}
                        className="p-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 transition-all"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="h-8 w-px bg-white/5 mx-2" />

                  <button 
                    onClick={() => setViewingDoc(doc)}
                    className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    title="View Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {isAdmin && (
                    <button 
                      onClick={() => handleAction(doc._id, 'deleteDocument')}
                      className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Approval History Snippet */}
              {doc.approvals?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center space-x-6">
                  {doc.approvals.map((app: any, i: number) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-[10px]",
                        app.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 
                        app.status === 'Rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
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
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
              <Upload className="w-12 h-12 text-slate-700 mb-4" />
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
