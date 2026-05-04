'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Pencil, 
  Square, 
  Circle, 
  Type, 
  Eraser, 
  Download,
  Save,
  Undo,
  ZoomIn,
  ZoomOut,
  MousePointer2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ isOpen, onClose, document }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tool, setTool] = useState<'pen' | 'rect' | 'circle' | 'text' | 'select'>('select');
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle resize
      const updateSize = () => {
        canvas.width = containerRef.current?.clientWidth || 800;
        canvas.height = containerRef.current?.clientHeight || 600;
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent) => {
    if (tool === 'select') return;
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pen') {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={cn(
            "relative z-10 bg-[#0F172A] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-all duration-500",
            isFullscreen ? "w-full h-full" : "w-full max-w-6xl h-[85vh]"
          )}
        >
          {/* Header Bar */}
          <div className="p-4 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Maximize2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{document?.name}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Plan Annotation Mode</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-950/50 p-1 rounded-2xl border border-white/5">
              {[
                { id: 'select', icon: MousePointer2 },
                { id: 'pen', icon: Pencil },
                { id: 'rect', icon: Square },
                { id: 'circle', icon: Circle },
                { id: 'text', icon: Type },
                { id: 'eraser', icon: Eraser },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id as any)}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    tool === t.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-white"
                  )}
                >
                  <t.icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-950/50 px-3 py-1.5 rounded-xl border border-white/5">
                <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="p-1 text-slate-500 hover:text-white"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-[10px] font-black text-white w-10 text-center">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(400, z + 25))} className="p-1 text-slate-500 hover:text-white"><ZoomIn className="w-4 h-4" /></button>
              </div>
              <div className="h-6 w-px bg-white/10 mx-2" />
              <button className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"><Save className="w-5 h-5" /></button>
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-400 hover:text-white transition-colors">
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Main Viewer Area */}
          <div className="flex-1 relative overflow-auto custom-scrollbar bg-[#020617] flex items-center justify-center p-8" ref={containerRef}>
            <div 
              className="relative shadow-2xl bg-white"
              style={{ 
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out'
              }}
            >
              {/* Simplified Plan Image Placeholder */}
              <div className="w-[800px] h-[1000px] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-5 pointer-events-none">
                  {Array.from({ length: 144 }).map((_, i) => (
                    <div key={i} className="border border-black"></div>
                  ))}
                </div>
                <div className="flex flex-col items-center opacity-20">
                  <FileIcon className="w-32 h-32 text-slate-900 mb-4" />
                  <p className="text-xl font-black text-slate-900 uppercase tracking-widest">{document?.name}</p>
                </div>

                {/* Canvas Overlay for Annotations */}
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className={cn(
                    "absolute inset-0 z-10 cursor-crosshair",
                    tool === 'select' && "cursor-default"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Footer Info Bar */}
          <div className="px-6 py-3 bg-slate-900/80 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Layers: {tool.toUpperCase()}</span>
              </span>
              <span>Author: {document?.uploadedBy?.name}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Resolution: 300 DPI</span>
              <span className="text-blue-400">Locked for Editing</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const FileIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
