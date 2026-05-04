'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  File, 
  Plus, 
  Search, 
  MoreVertical, 
  Upload, 
  Trash2, 
  ExternalLink,
  Loader2,
  FolderPlus,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { PlanRoom } from './PlanRoom';

interface PlansTabProps {
  projectId: string;
}

export const PlansTab: React.FC<PlansTabProps> = ({ projectId }) => {
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const toast = useToast();

  const fetchFolders = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/folders`);
      setFolders(response.data);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load plan folders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [projectId]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreating(true);
    try {
      await api.post(`/projects/${projectId}/folders`, { name: newFolderName });
      toast.success('Folder created successfully!');
      setNewFolderName('');
      setIsCreateModalOpen(false);
      fetchFolders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create folder');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'Rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Syncing plan room...</p>
      </div>
    );
  }

  if (selectedFolderId) {
    const selectedFolder = folders.find(f => f._id === selectedFolderId);
    if (selectedFolder) {
      return (
        <PlanRoom 
          folder={selectedFolder} 
          projectId={projectId} 
          onBack={() => setSelectedFolderId(null)} 
          onUpdate={fetchFolders}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Technical Plans & Drawings</h3>
          <p className="text-sm text-slate-400 mt-1">Manage project architectural and structural drawings.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Create Folder</span>
        </button>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder) => (
          <GlassCard 
            key={folder._id} 
            className="p-6 border-white/5 group hover:border-blue-500/50 transition-all cursor-pointer" 
            gradient
            onClick={() => setSelectedFolderId(folder._id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <Folder className="w-6 h-6 text-blue-400" />
              </div>
              <button className="p-2 text-slate-500 hover:text-white transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            
            <h4 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{folder.name}</h4>
            <p className="text-xs text-slate-500">{folder.documents?.length || 0} Documents</p>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex -space-x-1">
                {folder.documents?.slice(0, 3).map((doc: any, i: number) => (
                  <div key={i} className="w-6 h-6 rounded-md bg-slate-800 border border-[#0F172A] flex items-center justify-center">
                    <FileText className="w-3 h-3 text-slate-500" />
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-1 text-xs font-bold text-blue-400">
                <span>Open Room</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </GlassCard>
        ))}

        {folders.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-3xl">
            <Folder className="w-16 h-16 text-slate-700 mb-4" />
            <h4 className="text-lg font-bold text-slate-500">No folders yet</h4>
            <p className="text-sm text-slate-600 max-w-xs mt-1">Create folders to organize your technical drawings and plans.</p>
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md relative z-10"
          >
            <GlassCard className="p-8 border-white/10" gradient>
              <h3 className="text-xl font-bold text-white mb-6">New Plans Folder</h3>
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Folder Name</label>
                  <input 
                    type="text" 
                    required
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="e.g. Architectural Drawings"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isCreating}
                    className="flex-2 py-2.5 px-6 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Folder'}
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
};
