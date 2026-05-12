'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Save,
  ZoomIn,
  ZoomOut,
  MousePointer2,
  Undo2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
}

type ToolType = 'select' | 'pen' | 'rect' | 'circle' | 'text' | 'eraser';

type Point = { x: number; y: number };

type Annotation =
  | { type: 'pen'; points: Point[]; color: string; width: number }
  | { type: 'rect'; x: number; y: number; w: number; h: number; color: string; width: number }
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number; color: string; width: number }
  | { type: 'text'; x: number; y: number; text: string; color: string; size: number };

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#000000'];

function drawAnnotation(ctx: CanvasRenderingContext2D, ann: Annotation) {
  ctx.save();
  if (ann.type === 'pen') {
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = ann.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ann.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
  } else if (ann.type === 'rect') {
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = ann.width;
    ctx.strokeRect(ann.x, ann.y, ann.w, ann.h);
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = ann.color;
    ctx.fillRect(ann.x, ann.y, ann.w, ann.h);
  } else if (ann.type === 'ellipse') {
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = ann.width;
    ctx.beginPath();
    ctx.ellipse(ann.cx, ann.cy, Math.abs(ann.rx), Math.abs(ann.ry), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = ann.color;
    ctx.fill();
  } else if (ann.type === 'text') {
    ctx.fillStyle = ann.color;
    ctx.font = `bold ${ann.size}px sans-serif`;
    ctx.fillText(ann.text, ann.x, ann.y);
  }
  ctx.restore();
}

function redrawAll(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, annotations: Annotation[]) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  annotations.forEach(a => drawAnnotation(ctx, a));
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ isOpen, onClose, document }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tool, setTool] = useState<ToolType>('select');
  const [zoom, setZoom] = useState(100);
  const [color, setColor] = useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<Point>({ x: 0, y: 0 });
  const [currentPenPoints, setCurrentPenPoints] = useState<Point[]>([]);
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef<ImageData | null>(null);
  const toast = useToast();

  const getCtx = useCallback(() => canvasRef.current?.getContext('2d') ?? null, []);

  useEffect(() => {
    if (!isOpen || !canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const resize = () => {
      const w = containerRef.current?.clientWidth || 800;
      const h = containerRef.current?.clientHeight || 600;
      const ctx = canvas.getContext('2d');
      const snapshot = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = w;
      canvas.height = h;
      if (snapshot && ctx) ctx.putImageData(snapshot, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [isOpen]);

  // Re-render when annotations change
  useEffect(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    redrawAll(ctx, canvas, annotations);
  }, [annotations]);

  const getPos = (e: React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === 'select') return;
    if (tool === 'text') {
      const pos = getPos(e);
      setTextInput(pos);
      setTextValue('');
      return;
    }
    const pos = getPos(e);
    setStartPos(pos);
    setIsDrawing(true);

    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    if (tool === 'pen') {
      setCurrentPenPoints([pos]);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else {
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (tool === 'eraser') {
      ctx.clearRect(pos.x - 12, pos.y - 12, 24, 24);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const pos = getPos(e);

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setCurrentPenPoints(prev => [...prev, pos]);
    } else if (tool === 'eraser') {
      ctx.clearRect(pos.x - 12, pos.y - 12, 24, 24);
    } else if (tool === 'rect' && snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      const previewAnn: Annotation = { type: 'rect', x: startPos.x, y: startPos.y, w: pos.x - startPos.x, h: pos.y - startPos.y, color, width: strokeWidth };
      drawAnnotation(ctx, previewAnn);
    } else if (tool === 'circle' && snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      const previewAnn: Annotation = { type: 'ellipse', cx: (startPos.x + pos.x) / 2, cy: (startPos.y + pos.y) / 2, rx: Math.abs(pos.x - startPos.x) / 2, ry: Math.abs(pos.y - startPos.y) / 2, color, width: strokeWidth };
      drawAnnotation(ctx, previewAnn);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const pos = getPos(e);

    if (tool === 'pen') {
      setAnnotations(prev => [...prev, { type: 'pen', points: currentPenPoints, color, width: strokeWidth }]);
      setCurrentPenPoints([]);
    } else if (tool === 'rect') {
      setAnnotations(prev => [...prev, { type: 'rect', x: startPos.x, y: startPos.y, w: pos.x - startPos.x, h: pos.y - startPos.y, color, width: strokeWidth }]);
    } else if (tool === 'circle') {
      setAnnotations(prev => [...prev, { type: 'ellipse', cx: (startPos.x + pos.x) / 2, cy: (startPos.y + pos.y) / 2, rx: Math.abs(pos.x - startPos.x) / 2, ry: Math.abs(pos.y - startPos.y) / 2, color, width: strokeWidth }]);
    }
    snapshotRef.current = null;

    const ctx = getCtx();
    if (ctx) ctx.beginPath();
  };

  const commitText = () => {
    if (!textInput || !textValue.trim()) {
      setTextInput(null);
      return;
    }
    setAnnotations(prev => [...prev, { type: 'text', x: textInput.x, y: textInput.y, text: textValue.trim(), color, size: 14 + strokeWidth * 2 }]);
    setTextInput(null);
    setTextValue('');
  };

  const undo = () => setAnnotations(prev => prev.slice(0, -1));

  const clearAll = () => {
    setAnnotations([]);
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = window.document.createElement('a');
    link.href = dataUrl;
    link.download = `${document?.name?.replace(/\.[^.]+$/, '') || 'annotation'}_annotated.png`;
    link.click();
    toast.success('Annotated canvas exported');
  };

  if (!isOpen) return null;

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Ellipse' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ] as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={cn(
            'relative z-10 bg-white border border-gray-200 rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-all duration-300',
            isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-[90vh]'
          )}
        >
          {/* Header */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 rounded-xl bg-blue-100 border border-blue-200 shrink-0">
                <Square className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">{document?.name}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Annotation Canvas</p>
              </div>
            </div>

            {/* Tool Palette */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-2xl border border-gray-200">
              {tools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  title={t.label}
                  className={cn(
                    'p-2 rounded-xl transition-all',
                    tool === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-gray-900'
                  )}
                >
                  <t.icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Color + Stroke */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn('w-5 h-5 rounded-full border-2 transition-all', color === c ? 'border-gray-900 scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <select
                value={strokeWidth}
                onChange={e => setStrokeWidth(Number(e.target.value))}
                className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600"
              >
                <option value={1}>Thin</option>
                <option value={2}>Normal</option>
                <option value={4}>Thick</option>
                <option value={8}>Bold</option>
              </select>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1.5 rounded-xl border border-gray-200">
                <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="p-1 text-slate-400 hover:text-gray-900"><ZoomOut className="w-3.5 h-3.5" /></button>
                <span className="text-[10px] font-black text-gray-900 w-8 text-center">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(400, z + 25))} className="p-1 text-slate-400 hover:text-gray-900"><ZoomIn className="w-3.5 h-3.5" /></button>
              </div>
              <div className="h-6 w-px bg-gray-200" />
              <button onClick={undo} disabled={annotations.length === 0} title="Undo" className="p-2 text-slate-400 hover:text-gray-900 disabled:opacity-30"><Undo2 className="w-4 h-4" /></button>
              <button onClick={clearAll} title="Clear all" className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              <button onClick={handleSave} title="Export as PNG" className="p-2 text-slate-400 hover:text-emerald-600"><Save className="w-4 h-4" /></button>
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-slate-400 hover:text-gray-900">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative overflow-auto bg-gray-200 flex items-center justify-center p-8" ref={containerRef}>
            <div
              className="relative shadow-2xl"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
            >
              <div className="w-[800px] h-[1000px] bg-white relative overflow-hidden border border-gray-300">
                {/* Grid background */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, #000 0, #000 1px, transparent 1px, transparent 64px), repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 1px, transparent 64px)'
                }} />

                {/* Document placeholder / image */}
                {document?.url ? (
                  <img src={document.url} alt={document.name} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-15 pointer-events-none">
                    <FileIconSvg className="w-24 h-24 text-slate-400 mb-4" />
                    <p className="text-lg font-black text-slate-400 uppercase tracking-widest text-center px-8">{document?.name}</p>
                  </div>
                )}

                {/* Annotation canvas */}
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => { if (isDrawing) handleMouseUp({ clientX: 0, clientY: 0 } as any); }}
                  className={cn(
                    'absolute inset-0 z-10',
                    tool === 'select' ? 'cursor-default' :
                    tool === 'eraser' ? 'cursor-cell' :
                    tool === 'text' ? 'cursor-text' : 'cursor-crosshair'
                  )}
                />

                {/* Floating text input */}
                {textInput && (
                  <div
                    className="absolute z-20"
                    style={{ left: textInput.x, top: textInput.y - 20 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      autoFocus
                      type="text"
                      value={textValue}
                      onChange={e => setTextValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') setTextInput(null); }}
                      onBlur={commitText}
                      placeholder="Type here..."
                      className="min-w-[120px] bg-white/90 border-2 border-blue-500 rounded-lg px-2 py-1 text-sm font-medium outline-none shadow-lg"
                      style={{ color, fontSize: `${14 + strokeWidth * 2}px` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
            <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span>Tool: {tool}</span>
              </span>
              <span>{annotations.length} annotation{annotations.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Zoom: {zoom}%</span>
              <span>{document?.uploadedBy?.name ? `By: ${document.uploadedBy.name}` : ''}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const FileIconSvg = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
