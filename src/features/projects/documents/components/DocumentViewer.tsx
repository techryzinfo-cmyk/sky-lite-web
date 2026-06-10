'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  MapPin,
  Mic,
  StopCircle,
  ImageIcon,
  Video,
  Camera,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/providers/ToastContext';
import { useAuth } from '@/providers/AuthContext';
import api from '@/services/api.client';
import { uploadToCloudinary } from '@/lib/upload';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  projectId?: string;
}

interface PinAnnotation {
  _id: string;
  text: string;
  x: number;
  y: number;
  position?: {
    x: number;
    y: number;
  };
  imageUri?: string;
  videoUri?: string;
  voiceNoteUri?: string;
  createdBy?: string;
  [key: string]: any;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  document,
  projectId,
}) => {
  const [zoom, setZoom] = useState(100);
  const [pinMode, setPinMode] = useState(false);
  const [annotations, setAnnotations] = useState<PinAnnotation[]>([]);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState('');
  const [modalImageUri, setModalImageUri] = useState('');
  const [modalVideoUri, setModalVideoUri] = useState('');
  const [modalVoiceUri, setModalVoiceUri] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'Admin';

  useEffect(() => {
    if (!isOpen || !projectId || !document?._id) return;
    loadAnnotations();
  }, [isOpen, projectId, document?._id]);

  useEffect(() => {
    if (!isOpen) {
      setZoom(100);
      setPinMode(false);
      setAnnotations([]);
      setHoveredPin(null);
      setActivePin(null);
      setPendingPos(null);
      setShowModal(false);
      resetModal();
    }
  }, [isOpen]);

  const loadAnnotations = async () => {
    if (!projectId || !document?._id) return;
    try {
      const res = await api.get(`/projects/${projectId}/annotations?document=${document._id}`);
      setAnnotations(
        (res.data || []).map((a: any) => ({
          ...a,
          x: a.position?.x ?? a.x ?? 0,
          y: a.position?.y ?? a.y ?? 0,
        }))
      );
    } catch {
      // silent
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pinMode || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setPendingPos({ x, y });
    setPinMode(false);
    setShowModal(true);
  };

  const handleSaveAnnotation = async () => {
    if (!pendingPos || !projectId) return;
    const text = modalText.trim() || '(No text)';
    setIsSaving(true);
    try {
      const res = await api.post(`/projects/${projectId}/annotations`, {
        document: document._id,
        documentName: document.name,
        text,
        position: pendingPos,
        imageUri: modalImageUri || undefined,
        videoUri: modalVideoUri || undefined,
        voiceNoteUri: modalVoiceUri || undefined,
      });
      const saved = res.data;
      setAnnotations(prev => [
        { ...saved, x: saved.position?.x ?? 0, y: saved.position?.y ?? 0 },
        ...prev,
      ]);
      toast.success('Annotation saved');
      resetModal();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save annotation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!projectId) return;
    try {
      await api.delete(`/projects/${projectId}/annotations/${annotationId}`);
      setAnnotations(prev => prev.filter(a => a._id !== annotationId));
      if (activePin === annotationId) setActivePin(null);
    } catch {
      toast.error('Failed to delete annotation');
    }
  };

  const handleUndo = () => {
    const last = annotations[0];
    if (!last) return;
    const canDelete = isAdmin || last.createdBy === (user as any)?._id;
    if (!canDelete) { toast.error('You cannot delete this annotation'); return; }
    handleDeleteAnnotation(last._id);
  };

  const resetModal = () => {
    setShowModal(false);
    setPendingPos(null);
    setModalText('');
    setModalImageUri('');
    setModalVideoUri('');
    setModalVoiceUri('');
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'voice-note.webm', { type: 'audio/webm' });
        try {
          const url = await uploadToCloudinary(file);
          setModalVoiceUri(url);
          toast.success('Voice note recorded');
        } catch {
          toast.error('Failed to upload voice note');
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const url = await uploadToCloudinary(file);
      setModalImageUri(url);
    } catch {
      toast.error('Image upload failed');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    try {
      const url = await uploadToCloudinary(file);
      setModalVideoUri(url);
    } catch {
      toast.error('Video upload failed');
    } finally {
      setIsUploadingVideo(false);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Main viewer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 bg-white rounded-3xl overflow-hidden flex flex-col shadow-2xl w-full max-w-2xl"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <h3 className="text-sm font-bold text-gray-900 truncate max-w-[260px]">
              {document?.name}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-slate-400 hover:text-gray-700 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Plan image area */}
          <div
            className={cn(
              'relative flex-1 bg-gray-50 flex items-center justify-center overflow-auto',
              pinMode && 'cursor-crosshair'
            )}
            style={{ minHeight: 340 }}
            onClick={handleContainerClick}
          >
            {/* Scaled image + pins wrapper */}
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {document?.url ? (
                <img
                  ref={imageRef}
                  src={document.url}
                  alt={document.name}
                  className="max-w-full object-contain rounded-xl select-none"
                  style={{ maxHeight: '55vh', display: 'block' }}
                  draggable={false}
                />
              ) : (
                <div
                  ref={imageRef as any}
                  className="w-72 h-64 flex items-center justify-center text-slate-300"
                >
                  <FileIconSvg className="w-20 h-20" />
                </div>
              )}

              {/* Annotation pins — rendered relative to the image */}
              {annotations.map((ann, idx) => (
                <div
                  key={ann._id}
                  className="absolute z-20"
                  style={{
                    left: `${ann.x * 100}%`,
                    top: `${ann.y * 100}%`,
                    transform: 'translate(-50%, -100%)',
                    cursor: 'pointer',
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    setActivePin(activePin === ann._id ? null : ann._id);
                  }}
                  onMouseEnter={() => setHoveredPin(ann._id)}
                  onMouseLeave={() => setHoveredPin(null)}
                >
                  {/* Tooltip */}
                  {(hoveredPin === ann._id || activePin === ann._id) && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none z-30">
                      <div className="bg-gray-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-xl whitespace-nowrap max-w-[200px] truncate shadow-xl">
                        {ann.text}
                      </div>
                    </div>
                  )}

                  {/* Delete button when pin is active */}
                  {activePin === ann._id && (isAdmin || ann.createdBy === (user as any)?._id) && (
                    <button
                      className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow z-40 pointer-events-auto"
                      onClick={e => handleDeleteAnnotation(ann._id, e)}
                    >
                      ✕
                    </button>
                  )}

                  {/* Pin icon */}
                  <div className="relative">
                    <MapPin
                      className="w-9 h-9 drop-shadow-lg"
                      style={{ color: '#ef4444', fill: '#ef4444' }}
                      strokeWidth={1}
                    />
                    <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-white text-[9px] font-black leading-none">
                      {idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pin-mode hint banner */}
            {pinMode && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg pointer-events-none z-10">
                Tap on the plan to place a pin
              </div>
            )}

            {/* Camera / screenshot button */}
            <button className="absolute bottom-4 left-4 w-9 h-9 rounded-full bg-gray-900/60 flex items-center justify-center text-white hover:bg-gray-900/80 transition-all z-10">
              <Camera className="w-4 h-4" />
            </button>

            {/* Version label */}
            <span className="absolute bottom-4 right-4 text-xs font-bold text-gray-400 z-10">
              Version 1
            </span>
          </div>

          {/* Bottom toolbar */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              {/* Undo */}
              <button
                onClick={handleUndo}
                disabled={annotations.length === 0}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-slate-400 hover:text-gray-700 disabled:opacity-30 transition-all"
                title="Undo last annotation"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              {/* Redo (no-op) */}
              <button
                disabled
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-slate-400 opacity-30 transition-all"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              {/* Zoom in */}
              <button
                onClick={() => setZoom(z => Math.min(200, z + 25))}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-slate-400 hover:text-gray-700 transition-all"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Zoom out */}
              <button
                onClick={() => setZoom(z => Math.max(50, z - 25))}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-slate-400 hover:text-gray-700 transition-all"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Add pin — only when projectId is provided */}
              {projectId && (
                <button
                  onClick={() => { setPinMode(p => !p); setActivePin(null); }}
                  className={cn(
                    'w-9 h-9 rounded-full border flex items-center justify-center transition-all',
                    pinMode
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'border-gray-200 text-slate-400 hover:text-gray-700 hover:border-gray-300'
                  )}
                  title="Add annotation pin"
                >
                  <MapPin className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Change Version */}
            <button
              onClick={() => toast.success('Version management coming soon')}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
            >
              Change Version
            </button>
          </div>
        </motion.div>

        {/* Add Annotation Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute z-[120] bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h4 className="text-base font-bold text-gray-900">Add Annotation</h4>
                <button
                  onClick={resetModal}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-slate-400 hover:text-gray-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 pb-6 space-y-4">
                {/* Text Note */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Text Note
                  </label>
                  <input
                    type="text"
                    value={modalText}
                    onChange={e => setModalText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveAnnotation(); }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="Enter your note..."
                    autoFocus
                  />
                </div>

                {/* Voice Note */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Voice Note
                  </label>
                  {modalVoiceUri ? (
                    <div className="flex items-center px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 shrink-0" />
                      <span className="text-xs font-semibold text-green-700 flex-1">Voice note recorded</span>
                      <button
                        onClick={() => setModalVoiceUri('')}
                        className="text-red-400 hover:text-red-600 text-xs font-semibold ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      className={cn(
                        'w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-semibold transition-all',
                        isRecording
                          ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                          : 'bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100'
                      )}
                    >
                      {isRecording
                        ? <><StopCircle className="w-4 h-4" /><span>Stop Recording</span></>
                        : <><Mic className="w-4 h-4" /><span>Record Voice</span></>
                      }
                    </button>
                  )}
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image</label>
                  {modalImageUri ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={modalImageUri} alt="attached" className="w-full h-24 object-cover" />
                      <button
                        onClick={() => setModalImageUri('')}
                        className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-400 transition-all"
                    >
                      {isUploadingImage
                        ? <Loader2 className="w-6 h-6 animate-spin" />
                        : <ImageIcon className="w-6 h-6" />
                      }
                      <span className="text-xs font-semibold mt-1.5">
                        {isUploadingImage ? 'Uploading...' : 'Add Image'}
                      </span>
                    </button>
                  )}
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>

                {/* Video */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Video</label>
                  {modalVideoUri ? (
                    <div className="flex items-center px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 shrink-0" />
                      <span className="text-xs font-semibold text-green-700 flex-1">Video attached</span>
                      <button
                        onClick={() => setModalVideoUri('')}
                        className="text-red-400 hover:text-red-600 text-xs font-semibold ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isUploadingVideo}
                      className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-400 transition-all"
                    >
                      {isUploadingVideo
                        ? <Loader2 className="w-6 h-6 animate-spin" />
                        : <Video className="w-6 h-6" />
                      }
                      <span className="text-xs font-semibold mt-1.5">
                        {isUploadingVideo ? 'Uploading...' : 'Add Video'}
                      </span>
                    </button>
                  )}
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    onClick={resetModal}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-slate-600 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAnnotation}
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save</span>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

const FileIconSvg = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
