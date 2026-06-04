'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  Send, Check, Copy, RefreshCw, Sparkles, AlertCircle, CheckCircle2,
  Loader2, Hash, AtSign, Clock, Zap, Globe, ImageIcon, Upload, X,
  Crop, Eye, EyeOff, Type, Plus, Trash2, ChevronDown, Square, MousePointer2, Circle, Triangle, Hexagon,
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd
} from 'lucide-react';
import { loadFromImageDB, saveToImageDB } from '@/lib/image-db';
import { FacebookIcon, InstagramIcon, LinkedinIcon, XSocialIcon } from '@/components/SocialIcons';
import Link from 'next/link';

// ─── Platform definitions ─────────────────────────────────────────────────────
const platforms = [
  { id: 'facebook', label: 'Facebook', icon: FacebookIcon, color: '#1877F2', charLimit: 63206, tip: 'Longer posts with storytelling work best. Use emojis & strong CTAs.', maxHashtags: 10, aspectRatio: '1.91:1' },
  { id: 'instagram', label: 'Instagram', icon: InstagramIcon, color: '#E1306C', charLimit: 2200, tip: 'Punchy first line, heavy hashtags (up to 30), emojis encouraged.', maxHashtags: 30, aspectRatio: '1:1' },
  { id: 'x (twitter)', label: 'X (Twitter)', icon: XSocialIcon, color: 'currentColor', charLimit: 280, tip: 'Short & punchy. Max 280 chars. 1-2 hashtags is ideal.', maxHashtags: 2, aspectRatio: '16:9' },
  { id: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon, color: '#0A66C2', charLimit: 3000, tip: 'Professional tone. Thought leadership stories convert best.', maxHashtags: 5, aspectRatio: '1.91:1' },
];

const BRAND_FONTS = [
  { id: 'Inter', label: 'Inter', css: "'Inter', sans-serif" },
  { id: 'Playfair Display', label: 'Playfair Display', css: "'Playfair Display', serif" },
  { id: 'Roboto', label: 'Roboto', css: "'Roboto', sans-serif" },
  { id: 'Montserrat', label: 'Montserrat', css: "'Montserrat', sans-serif" },
  { id: 'Space Mono', label: 'Space Mono', css: "'Space Mono', monospace" },
];

type PublishStatus = 'idle' | 'publishing' | 'success' | 'error';
interface PlatformStatus { status: PublishStatus; message?: string; }
interface CropRect { x: number; y: number; w: number; h: number; }
interface TextLayer {
  id: string; text: string;
  x: number; y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: '400' | '700' | '900';
  color: string;
  rotation?: number;
  textAlign?: 'left' | 'center' | 'right';
}

interface ShapeLayer {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'hex';
  x: number; y: number;
  w: number; h: number;
  color: string;
  borderRadius: number;
  rotation?: number;
}

// ─── Tool type ───────────────────────────────────────────────────────────────
type ActiveTool = 'select' | 'crop' | 'text' | 'shape';

export default function EditorPage() {
  // ── Caption state ──────────────────────────────────────────────────────────
  const [captions, setCaptions] = useState<Record<string, string>>(Object.fromEntries(platforms.map(p => [p.id, ''])));
  const [activePlatform, setActivePlatform] = useState('facebook');
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, PlatformStatus>>(Object.fromEntries(platforms.map(p => [p.id, { status: 'idle' }])));
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [isPublishingAll, setIsPublishingAll] = useState(false);
  const [publishDone, setPublishDone] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [enabledPlatforms, setEnabledPlatforms] = useState<Record<string, boolean>>(Object.fromEntries(platforms.map(p => [p.id, true])));

  // ── Images ─────────────────────────────────────────────────────────────────
  const [images, setImages] = useState<string[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPos, setAddMenuPos] = useState({ top: 0, left: 0 });
  const addMenuBtnRef = useRef<HTMLDivElement>(null);
  const [showStudioPicker, setShowStudioPicker] = useState(false);
  const [studioImages, setStudioImages] = useState<{ id: string; url: string }[]>([]);

  // ── Active tool ────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');

  // ── Crop state ─────────────────────────────────────────────────────────────
  const [cropRect, setCropRect] = useState<CropRect>({ x: 10, y: 10, w: 80, h: 80 });
  const [activeCropRatio, setActiveCropRatio] = useState<number | null>(null);
  const cropDragRef = useRef<{ handle: string; startX: number; startY: number; startRect: CropRect } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // ── Logo state ─────────────────────────────────────────────────────────────
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoHiddenMap, setLogoHiddenMap] = useState<Record<number, boolean>>({});
  const showLogo = !(logoHiddenMap[activeImageIdx] ?? false);
  const [logoScaleMap, setLogoScaleMap] = useState<Record<number, number>>({});
  const [logoPosMap, setLogoPosMap] = useState<Record<number, { x: number; y: number }>>({});
  const [logoAspectRatio, setLogoAspectRatio] = useState(1);
  const logoScale = logoScaleMap[activeImageIdx] ?? null;
  const logoPos = logoPosMap[activeImageIdx] ?? null;
  const setLogoScale = (val: number | ((p: number) => number)) =>
    setLogoScaleMap(prev => ({ ...prev, [activeImageIdx]: typeof val === 'function' ? val(prev[activeImageIdx] ?? 10) : val }));
  const setLogoPos = (val: { x: number; y: number } | ((p: { x: number; y: number }) => { x: number; y: number })) =>
    setLogoPosMap(prev => ({ ...prev, [activeImageIdx]: typeof val === 'function' ? val(prev[activeImageIdx] ?? { x: 75, y: 5 }) : val }));
  const logoDragRef = useRef<{ startX: number; startY: number; startPos: { x: number; y: number } } | null>(null);
  const logoResizeRef = useRef<{ handle: string; startX: number; startY: number; startScale: number; startPos: { x: number; y: number } } | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // ── Brand font ─────────────────────────────────────────────────────────────
  const [brandFont, setBrandFont] = useState('Inter');
  useEffect(() => {
    const load = () => {
      const id = localStorage.getItem('ai_marketing_active_company_id');
      const str = localStorage.getItem('ai_marketing_companies');
      if (id && str) {
        try { const c = JSON.parse(str) as { id: string; font?: string }[]; const a = c.find(x => x.id === id); if (a?.font) setBrandFont(a.font); } catch { }
      }
    };
    load(); window.addEventListener('brand-updated', load); return () => window.removeEventListener('brand-updated', load);
  }, []);

  // ── Text layers ────────────────────────────────────────────────────────────
  const [textLayersMap, setTextLayersMap] = useState<Record<number, TextLayer[]>>({});
  const textLayers: TextLayer[] = textLayersMap[activeImageIdx] ?? [];
  const setTextLayers = (val: TextLayer[] | ((p: TextLayer[]) => TextLayer[])) =>
    setTextLayersMap(prev => ({ ...prev, [activeImageIdx]: typeof val === 'function' ? val(prev[activeImageIdx] ?? []) : val }));
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const textDragRef = useRef<{ id: string; startX: number; startY: number; startPx: number; startPy: number } | null>(null);
  const selectedLayer = textLayers.find(l => l.id === selectedTextId) ?? null;
  const getBrandFontCss = (id: string) => BRAND_FONTS.find(f => f.id === id)?.css ?? "'Inter', sans-serif";

  const addTextLayer = useCallback(() => {
    const id = `txt-${Date.now()}`;
    setTextLayers(prev => [...prev, { id, text: 'Your Text', x: 10, y: 10, fontSize: 36, fontFamily: brandFont, fontWeight: '700', color: '#ffffff', rotation: 0 }]);
    setSelectedTextId(id);
    setActiveTool('text');
  }, [brandFont]);

  const updateLayer = useCallback((id: string, patch: Partial<TextLayer>) => {
    setTextLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }, []);

  const deleteLayer = useCallback((id: string) => {
    setTextLayers(prev => prev.filter(l => l.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
  }, [selectedTextId]);

  // ── Shape layers ───────────────────────────────────────────────────────────
  const [shapeLayersMap, setShapeLayersMap] = useState<Record<number, ShapeLayer[]>>({});
  const shapeLayers: ShapeLayer[] = shapeLayersMap[activeImageIdx] ?? [];
  const setShapeLayers = (val: ShapeLayer[] | ((p: ShapeLayer[]) => ShapeLayer[])) =>
    setShapeLayersMap(prev => ({ ...prev, [activeImageIdx]: typeof val === 'function' ? val(prev[activeImageIdx] ?? []) : val }));
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const shapeDragRef = useRef<{ id: string; startX: number; startY: number; startPx: number; startPy: number } | null>(null);
  const shapeResizeRef = useRef<{ id: string; handle: string; startX: number; startY: number; startW: number; startH: number; startXPos: number; startYPos: number } | null>(null);
  const selectedShapeLayer = shapeLayers.find(l => l.id === selectedShapeId) ?? null;

  const addShapeLayer = useCallback((type: 'rectangle' | 'circle' | 'triangle' | 'hex') => {
    const id = `shape-${Date.now()}`;
    const borderRadius = type === 'circle' ? 50 : 0;
    let initialH = 20;
    if (imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      initialH = 20 * (rect.width / rect.height);
    }
    setShapeLayers(prev => [...prev, { id, type, x: 20, y: 20, w: 20, h: initialH, color: '#3b82f6', borderRadius, rotation: 0 }]);
    setSelectedShapeId(id);
    setActiveTool('shape');
  }, []);

  const updateShapeLayer = useCallback((id: string, patch: Partial<ShapeLayer>) => {
    setShapeLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }, []);

  const deleteShapeLayer = useCallback((id: string) => {
    setShapeLayers(prev => prev.filter(l => l.id !== id));
    if (selectedShapeId === id) setSelectedShapeId(null);
  }, [selectedShapeId]);

  // ── Text drag ──────────────────────────────────────────────────────────────
  const startTextDrag = useCallback((layerId: string, e: React.MouseEvent) => {
    if (editingTextId === layerId) return;
    e.preventDefault(); e.stopPropagation();
    if (!imageContainerRef.current) return;
    const layer = (textLayersMap[activeImageIdx] ?? []).find(l => l.id === layerId);
    if (!layer) return;
    textDragRef.current = { id: layerId, startX: e.clientX, startY: e.clientY, startPx: layer.x, startPy: layer.y };
    const onMove = (ev: MouseEvent) => {
      if (!textDragRef.current || !imageContainerRef.current) return;
      const { id, startX, startY, startPx, startPy } = textDragRef.current;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      setTextLayersMap(prev => ({ ...prev, [activeImageIdx]: (prev[activeImageIdx] ?? []).map(l => l.id === id ? { ...l, x: Math.max(0, Math.min(94, startPx + dx)), y: Math.max(0, Math.min(94, startPy + dy)) } : l) }));
    };
    const onUp = () => { textDragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImageIdx, textLayersMap, editingTextId]);

  // ── Shape interactions ─────────────────────────────────────────────────────
  const startShapeDrag = useCallback((layerId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setActiveTool('shape');
    setSelectedShapeId(layerId);
    setSelectedTextId(null);
    if (!imageContainerRef.current) return;
    const layer = (shapeLayersMap[activeImageIdx] ?? []).find(l => l.id === layerId);
    if (!layer) return;
    shapeDragRef.current = { id: layerId, startX: e.clientX, startY: e.clientY, startPx: layer.x, startPy: layer.y };
    const onMove = (ev: MouseEvent) => {
      if (!shapeDragRef.current || !imageContainerRef.current) return;
      const { id, startX, startY, startPx, startPy } = shapeDragRef.current;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      setShapeLayersMap(prev => ({ ...prev, [activeImageIdx]: (prev[activeImageIdx] ?? []).map(l => l.id === id ? { ...l, x: startPx + dx, y: startPy + dy } : l) }));
    };
    const onUp = () => { shapeDragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImageIdx, shapeLayersMap]);

  const startShapeResize = useCallback((layerId: string, handle: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setActiveTool('shape');
    setSelectedShapeId(layerId);
    setSelectedTextId(null);
    if (!imageContainerRef.current) return;
    const layer = (shapeLayersMap[activeImageIdx] ?? []).find(l => l.id === layerId);
    if (!layer) return;
    shapeResizeRef.current = { id: layerId, handle, startX: e.clientX, startY: e.clientY, startW: layer.w, startH: layer.h, startXPos: layer.x, startYPos: layer.y };

    const onMove = (ev: MouseEvent) => {
      if (!shapeResizeRef.current || !imageContainerRef.current) return;
      const { id, handle, startX, startY, startW, startH, startXPos, startYPos } = shapeResizeRef.current;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;

      setShapeLayersMap(prev => ({
        ...prev,
        [activeImageIdx]: (prev[activeImageIdx] ?? []).map(l => {
          if (l.id !== id) return l;
          let newW = startW, newH = startH, newX = startXPos, newY = startYPos;
          if (handle.includes('e')) newW = Math.max(2, startW + dx);
          if (handle.includes('w')) newW = Math.max(2, startW - dx);
          if (handle.includes('s')) newH = Math.max(2, startH + dy);
          if (handle.includes('n')) newH = Math.max(2, startH - dy);

          if (!ev.shiftKey) {
            const scaleW = newW / startW;
            const scaleH = newH / startH;
            const scale = Math.abs(scaleW - 1) > Math.abs(scaleH - 1) ? scaleW : scaleH;
            newW = startW * scale;
            newH = startH * scale;
          }

          if (handle.includes('w')) newX = startXPos + (startW - newW);
          if (handle.includes('n')) newY = startYPos + (startH - newH);
          return { ...l, w: newW, h: newH, x: newX, y: newY };
        })
      }));
    };
    const onUp = () => { shapeResizeRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImageIdx, shapeLayersMap]);

  // ── Load images & logo ─────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const activeId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
      let db = await loadFromImageDB(`creative_studio_selected_images_${activeId}`);
      if (!db?.length) {
        const raw = localStorage.getItem(`creative_studio_selected_images_${activeId}`) || sessionStorage.getItem(`creative_studio_selected_images_${activeId}`);
        if (raw) { try { db = JSON.parse(raw); } catch { db = [raw]; } }
      }
      setImages(Array.isArray(db) ? db : []);
      setActiveImageIdx(0);
      setLogoScaleMap({});
      setLogoPosMap({});
      setLogoHiddenMap({});
      setTextLayersMap({});
      setShapeLayersMap({});
      const ps = ['facebook', 'instagram', 'x', 'linkedin'];
      setCaptions(Object.fromEntries(ps.map(p => [p, ''])));
    };
    load(); window.addEventListener('brand-updated', load); return () => window.removeEventListener('brand-updated', load);
  }, []);

  useEffect(() => {
    const load = () => {
      const id = localStorage.getItem('ai_marketing_active_company_id');
      const str = localStorage.getItem('ai_marketing_companies');
      if (id && str) {
        const companies = JSON.parse(str) as { id: string; logo?: string | null }[];
        const active = companies.find(c => c.id === id);
        if (active?.logo) { setCompanyLogo(active.logo); setLogoHiddenMap({}); return; }
      }
      setCompanyLogo(null);
    };
    load(); window.addEventListener('brand-updated', load); return () => window.removeEventListener('brand-updated', load);
  }, []);

  // ── Image upload / Studio picker ───────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { const r = ev.target?.result as string; if (r) setImages(prev => prev.length < 5 ? [...prev, r] : prev); };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const openStudioPicker = async () => {
    const id = localStorage.getItem('ai_marketing_active_company_id') || 'default';
    const h = await loadFromImageDB(`creative_studio_history_${id}`);
    setStudioImages(Array.isArray(h) ? h.filter((x: { url?: string }) => x?.url).map((x: { id: string; url: string }) => ({ id: x.id, url: x.url })) : []);
    setShowAddMenu(false); setShowStudioPicker(true);
  };

  const syncRemoveToStudio = async (url: string) => {
    try {
      const id = localStorage.getItem('ai_marketing_active_company_id') || 'default';
      const key = `creative_studio_selected_images_${id}`;
      const saved = await loadFromImageDB(key);
      if (Array.isArray(saved)) { const u = saved.filter((s: string) => s !== url); await saveToImageDB(key, u); sessionStorage.setItem(key, JSON.stringify(u)); }
    } catch { }
  };

  const handleRemoveImage = (idx: number) => {
    const url = images[idx];
    setImages(prev => prev.filter((_, i) => i !== idx));
    setLogoScaleMap(prev => { const n: Record<number, number> = {}; Object.entries(prev).forEach(([k, v]) => { const ki = Number(k); if (ki < idx) n[ki] = v; else if (ki > idx) n[ki - 1] = v; }); return n; });
    setLogoPosMap(prev => { const n: Record<number, { x: number; y: number }> = {}; Object.entries(prev).forEach(([k, v]) => { const ki = Number(k); if (ki < idx) n[ki] = v; else if (ki > idx) n[ki - 1] = v; }); return n; });
    setLogoHiddenMap(prev => { const n: Record<number, boolean> = {}; Object.entries(prev).forEach(([k, v]) => { const ki = Number(k); if (ki < idx) n[ki] = v; else if (ki > idx) n[ki - 1] = v; }); return n; });
    setTextLayersMap(prev => { const n: Record<number, TextLayer[]> = {}; Object.entries(prev).forEach(([k, v]) => { const ki = Number(k); if (ki < idx) n[ki] = v; else if (ki > idx) n[ki - 1] = v; }); return n; });
    if (activeImageIdx >= idx && activeImageIdx > 0) setActiveImageIdx(v => v - 1);
    syncRemoveToStudio(url);
  };

  // ── Captions ───────────────────────────────────────────────────────────────
  const handleGenerateCaptions = async () => {
    if (!images.length) return; setIsAnalyzing(true);
    try {
      const companyId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
      const res = await fetch('/api/captions/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: images[activeImageIdx] || images[0], companyId }) });
      const d = await res.json(); if (d.captions) setCaptions(d.captions);
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  };

  // ── Crop ───────────────────────────────────────────────────────────────────
  const isCropping = activeTool === 'crop';
  useEffect(() => {
    if (activeCropRatio && isCropping) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCropRect(prev => { const h = prev.w / activeCropRatio; if (prev.y + h <= 100) return { ...prev, h }; return { ...prev, w: prev.h * activeCropRatio }; });
    }
  }, [activeCropRatio, isCropping]);

  const startCropDrag = useCallback((handle: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    cropDragRef.current = { handle, startX: e.clientX, startY: e.clientY, startRect: { ...cropRect } };
    const onMove = (ev: MouseEvent) => {
      if (!cropDragRef.current || !imageContainerRef.current) return;
      const { handle, startX, startY, startRect } = cropDragRef.current;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      setCropRect(() => {
        let { x, y, w, h } = startRect;
        if (handle === 'move') { x = Math.max(0, Math.min(100 - w, x + dx)); y = Math.max(0, Math.min(100 - h, y + dy)); }
        else {
          if (handle === 'nw') { const nx = Math.min(x + w - 5, x + dx); const ny = Math.min(y + h - 5, y + dy); w = w - (nx - x); h = h - (ny - y); x = nx; y = ny; }
          if (handle === 'ne') { w = Math.max(5, w + dx); const ny = Math.min(y + h - 5, y + dy); h = h - (ny - y); y = ny; }
          if (handle === 'sw') { const nx = Math.min(x + w - 5, x + dx); w = w - (nx - x); x = nx; h = Math.max(5, h + dy); }
          if (handle === 'se') { w = Math.max(5, w + dx); h = Math.max(5, h + dy); }
          if (activeCropRatio) {
            let nw = w, nh = w / activeCropRatio, nx = x, ny = y;
            if (handle === 'nw' || handle === 'ne') ny = startRect.y + startRect.h - nh;
            if (nx < 0) { nw += nx; nx = 0; nh = nw / activeCropRatio; if (handle === 'nw' || handle === 'ne') ny = startRect.y + startRect.h - nh; }
            if (ny < 0) { nh += ny; ny = 0; nw = nh * activeCropRatio; if (handle === 'nw' || handle === 'sw') nx = startRect.x + startRect.w - nw; }
            if (nx + nw > 100) { nw = 100 - nx; nh = nw / activeCropRatio; if (handle === 'nw' || handle === 'ne') ny = startRect.y + startRect.h - nh; }
            if (ny + nh > 100) { nh = 100 - ny; nw = nh * activeCropRatio; if (handle === 'nw' || handle === 'sw') nx = startRect.x + startRect.w - nw; }
            w = nw; h = nh; x = nx; y = ny;
          }
        }
        return { x: Math.max(0, x), y: Math.max(0, y), w: Math.min(100 - x, w), h: Math.min(100 - y, h) };
      });
    };
    const onUp = () => { cropDragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  }, [cropRect, activeCropRatio]);

  const applyCrop = useCallback(() => {
    const img = new Image(); img.src = images[activeImageIdx];
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const cx = (cropRect.x / 100) * img.naturalWidth; const cy = (cropRect.y / 100) * img.naturalHeight;
      const cw = (cropRect.w / 100) * img.naturalWidth; const ch = (cropRect.h / 100) * img.naturalHeight;
      canvas.width = cw; canvas.height = ch;
      canvas.getContext('2d')!.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
      setImages(prev => prev.map((im, i) => i === activeImageIdx ? canvas.toDataURL('image/jpeg', 0.9) : im));
      setActiveTool('select'); setCropRect({ x: 10, y: 10, w: 80, h: 80 });
    };
  }, [images, activeImageIdx, cropRect]);

  // ── Logo drag / resize ─────────────────────────────────────────────────────
  const startLogoDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setActiveTool('select');
    setSelectedTextId(null);
    setSelectedShapeId(null);
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const es = logoScale ?? (50 / rect.width) * 100;
    const sp = logoPos ?? { x: 100 - es - (20 / rect.width) * 100, y: (20 / rect.height) * 100 };
    logoDragRef.current = { startX: e.clientX, startY: e.clientY, startPos: { ...sp } };
    const onMove = (ev: MouseEvent) => {
      if (!logoDragRef.current || !imageContainerRef.current) return;
      const r = imageContainerRef.current.getBoundingClientRect();
      const { startX, startY, startPos } = logoDragRef.current;
      setLogoPos({ x: Math.max(0, Math.min(100 - es, startPos.x + ((ev.clientX - startX) / r.width) * 100)), y: Math.max(0, Math.min(100 - (es / logoAspectRatio), startPos.y + ((ev.clientY - startY) / r.height) * 100)) });
    };
    const onUp = () => { logoDragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  }, [logoPos, logoScale, logoAspectRatio]);

  const startLogoResize = useCallback((handle: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setActiveTool('select');
    setSelectedTextId(null);
    setSelectedShapeId(null);
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const es = logoScale ?? (50 / rect.width) * 100;
    const sp = logoPos ?? { x: 100 - es - (20 / rect.width) * 100, y: (20 / rect.height) * 100 };
    logoResizeRef.current = { handle, startX: e.clientX, startY: e.clientY, startScale: es, startPos: { ...sp } };
    const onMove = (ev: MouseEvent) => {
      if (!logoResizeRef.current || !imageContainerRef.current) return;
      const r = imageContainerRef.current.getBoundingClientRect();
      const { handle, startX, startScale, startPos } = logoResizeRef.current;
      const dx = ((ev.clientX - startX) / r.width) * 100;
      let ns = startScale, nx = startPos.x, ny = startPos.y;
      if (handle === 'se') ns = Math.max(5, startScale + dx);
      else if (handle === 'sw') { ns = Math.max(5, startScale - dx); nx = startPos.x + startScale - ns; }
      else if (handle === 'ne') { ns = Math.max(5, startScale + dx); ny = startPos.y - (ns - startScale) / logoAspectRatio; }
      else if (handle === 'nw') { ns = Math.max(5, startScale - dx); nx = startPos.x + startScale - ns; ny = startPos.y - (ns - startScale) / logoAspectRatio; }
      if (ns > 100) ns = 100;
      setLogoScale(ns); setLogoPos({ x: nx, y: ny });
    };
    const onUp = () => { logoResizeRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  }, [logoPos, logoScale, logoAspectRatio]);

  // ── Compose canvas ─────────────────────────────────────────────────────────
  const composeImageWithSettings = useCallback((base64: string, scale: number | null, pos: { x: number; y: number } | null, hideLogo: boolean, layers: TextLayer[], shapeLayers: ShapeLayer[]): Promise<string> => {
    return new Promise(resolve => {
      const img = new Image(); img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        // Draw Shapes
        for (const shape of shapeLayers) {
          ctx.save();
          const sx = (shape.x / 100) * canvas.width;
          const sy = (shape.y / 100) * canvas.height;
          const sw = (shape.w / 100) * canvas.width;
          const sh = (shape.h / 100) * canvas.height;

          const cx = sx + sw / 2;
          const cy = sy + sh / 2;

          if (shape.rotation) {
            ctx.translate(cx, cy);
            ctx.rotate(shape.rotation * Math.PI / 180);
            ctx.translate(-cx, -cy);
          }

          ctx.fillStyle = shape.color;
          ctx.beginPath();
          if (shape.type === 'rectangle' || shape.type === 'circle') {
            let radius = (shape.borderRadius / 100) * (Math.min(sw, sh) / 2);
            if (shape.type === 'circle') radius = Math.min(sw, sh) / 2;
            if (ctx.roundRect) {
              ctx.roundRect(sx, sy, sw, sh, radius);
            } else {
              ctx.rect(sx, sy, sw, sh);
            }
          } else if (shape.type === 'triangle') {
            ctx.moveTo(sx + sw * 0.5, sy + sh * 0.134);
            ctx.lineTo(sx, sy + sh);
            ctx.lineTo(sx + sw, sy + sh);
          } else if (shape.type === 'hex') {
            ctx.moveTo(sx + sw * 0.5, sy);
            ctx.lineTo(sx + sw * 0.933, sy + sh * 0.25);
            ctx.lineTo(sx + sw * 0.933, sy + sh * 0.75);
            ctx.lineTo(sx + sw * 0.5, sy + sh);
            ctx.lineTo(sx + sw * 0.067, sy + sh * 0.75);
            ctx.lineTo(sx + sw * 0.067, sy + sh * 0.25);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Draw Texts
        for (const layer of layers) {
          const sf = (layer.fontSize / 500) * canvas.width;
          ctx.save();
          ctx.font = `${layer.fontWeight} ${sf}px ${getBrandFontCss(layer.fontFamily).replace(/'/g, '')}`;
          ctx.fillStyle = layer.color; ctx.textBaseline = 'top';
          ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = sf * 0.3; ctx.shadowOffsetY = sf * 0.05;
          const tx = (layer.x / 100) * canvas.width; const ty = (layer.y / 100) * canvas.height;
          const maxW = canvas.width - tx - 20;

          let maxLineWidth = 0;
          const lines: string[] = [];
          const words = layer.text.split(' '); let line = '';
          for (const w of words) {
            const t = line ? `${line} ${w}` : w;
            const mw = ctx.measureText(t).width;
            if (mw > maxW && line) {
              lines.push(line);
              maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
              line = w;
            } else line = t;
          }
          lines.push(line); maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);

          const totalHeight = lines.length * (sf * 1.25);
          const cx = tx + maxLineWidth / 2;
          const cy = ty + totalHeight / 2;

          if (layer.rotation) {
            ctx.translate(cx, cy);
            ctx.rotate(layer.rotation * Math.PI / 180);
            ctx.translate(-cx, -cy);
          }

          let ly = ty;
          ctx.textAlign = layer.textAlign || 'left';
          for (const l of lines) {
            let ltx = tx;
            if (ctx.textAlign === 'center') ltx = tx + maxLineWidth / 2;
            else if (ctx.textAlign === 'right') ltx = tx + maxLineWidth;
            ctx.fillText(l, ltx, ly);
            ly += sf * 1.25;
          }
          ctx.restore();
        }

        if (companyLogo && !hideLogo) {
          const logo = new Image(); logo.src = companyLogo;
          logo.onload = () => {
            const lw = scale ? (scale / 100) * canvas.width : 50;
            const lh = (logo.naturalHeight / logo.naturalWidth) * lw;
            const lx = pos ? (pos.x / 100) * canvas.width : canvas.width - lw - 20;
            const ly = pos ? (pos.y / 100) * canvas.height : 20;
            ctx.drawImage(logo, lx, ly, lw, lh); resolve(canvas.toDataURL('image/jpeg', 0.9));
          };
          logo.onerror = () => resolve(canvas.toDataURL('image/jpeg', 0.9));
        } else resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(base64);
    });
  }, [companyLogo]);

  // ── Publish ────────────────────────────────────────────────────────────────
  const handlePublishAll = async () => {
    setIsPublishingAll(true); setPublishDone(false);
    if (!images.length) { alert('No image available'); setIsPublishingAll(false); return; }
    const composed = await Promise.all(images.map((img, idx) => composeImageWithSettings(img, logoScaleMap[idx] ?? null, logoPosMap[idx] ?? null, logoHiddenMap[idx] ?? false, textLayersMap[idx] ?? [], shapeLayersMap[idx] ?? [])));
    for (const p of platforms) {
      if (!enabledPlatforms[p.id]) continue;
      setPlatformStatuses(prev => ({ ...prev, [p.id]: { status: 'publishing' } }));
      try {
        const res = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: p.id, images: composed, caption: captions[p.id] || '' }) });
        if (!res.ok) { const t = await res.text(); let m = t.substring(0, 50); try { m = JSON.parse(t).error || m; } catch { } setPlatformStatuses(prev => ({ ...prev, [p.id]: { status: 'error', message: `Error ${res.status}: ${m}` } })); continue; }
        const d = await res.json();
        setPlatformStatuses(prev => ({ ...prev, [p.id]: { status: d.success ? 'success' : 'error', message: d.success ? undefined : d.error || 'Failed' } }));
      } catch (e) { setPlatformStatuses(prev => ({ ...prev, [p.id]: { status: 'error', message: e instanceof Error ? e.message : 'Network error' } })); }
    }
    setIsPublishingAll(false); setPublishDone(true);
  };

  const handleCopy = (id: string, text: string) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000); };
  const handleRegenerate = (id: string) => { setIsRegenerating(id); setTimeout(() => setIsRegenerating(null), 2000); };
  const statusIcon = (s: PublishStatus) => s === 'publishing' ? <Loader2 size={13} className="spin-slow" color="#f59e0b" /> : s === 'success' ? <CheckCircle2 size={13} color="#10b981" /> : s === 'error' ? <AlertCircle size={13} color="#ef4444" /> : null;

  const platform = platforms.find(p => p.id === activePlatform)!;
  const caption = captions[activePlatform] || '';
  const charPct = Math.min((caption.length / platform.charLimit) * 100, 100);
  const activeImage = images[activeImageIdx] || null;

  // ── Tool button component ──────────────────────────────────────────────────
  const ToolBtn = ({ tool, icon: Icon, label, onClick, danger, disabled }: { tool?: ActiveTool; icon: React.ElementType; label: string; onClick?: () => void; danger?: boolean; disabled?: boolean }) => {
    const isActive = tool ? activeTool === tool : false;
    const isDisabled = disabled ?? false;
    return (
      <motion.button
        title={isDisabled ? 'Load an image first' : label}
        whileTap={isDisabled ? {} : { scale: 0.9 }}
        onClick={isDisabled ? undefined : (onClick ?? (() => tool && setActiveTool(tool)))}
        style={{
          width: '40px', height: '40px', borderRadius: '10px', border: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          background: isActive ? 'rgba(124,58,237,0.2)' : 'transparent',
          color: isDisabled ? 'var(--text-muted)' : isActive ? '#a78bfa' : danger ? '#f87171' : 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
          boxShadow: isActive && !isDisabled ? '0 0 0 1.5px rgba(124,58,237,0.5)' : 'none',
          opacity: isDisabled ? 0.35 : 1,
          pointerEvents: isDisabled ? 'none' : 'auto',
        }}
        onMouseEnter={e => { if (!isActive && !isDisabled) e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { if (!isActive && !isDisabled) e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon size={16} />
      </motion.button>
    );
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Topbar title="Unified Editor" subtitle="Compose, brand & publish to all platforms" />
          <div className="page-content" style={{ paddingBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 480px', gap: '16px', alignItems: 'start', maxWidth: '1260px' }}>

              {/* ══════ COL 1 — Vertical Tool Rail ══════ */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}
                style={{ position: 'sticky', top: '80px' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '4px',
                  background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                  borderRadius: '14px', padding: '8px 6px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                }}>
                  <ToolBtn tool="select" icon={() => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-7 1-4 7z" /></svg>} label="Select" disabled={!activeImage} />
                  <ToolBtn tool="crop" icon={Crop} label="Crop" disabled={!activeImage} />
                  <ToolBtn tool="text" icon={Type} label="Add Text" onClick={addTextLayer} disabled={!activeImage} />
                  <ToolBtn tool="shape" icon={Square} label="Shapes" onClick={() => setActiveTool('shape')} disabled={!activeImage} />
                  <div style={{ width: '28px', height: '1px', background: 'var(--glass-border)', margin: '2px auto' }} />
                  {/* Add image */}
                  <div ref={addMenuBtnRef} style={{ position: 'relative' }}>
                    <ToolBtn icon={Upload} label="Add image" disabled={!activeImage} onClick={() => {
                      if (addMenuBtnRef.current) {
                        const r = addMenuBtnRef.current.getBoundingClientRect();
                        setAddMenuPos({ top: r.top, left: r.right + 8 });
                      }
                      setShowAddMenu(v => !v);
                    }} />
                  </div>
                  {companyLogo && (
                    <ToolBtn icon={showLogo ? Eye : EyeOff} label={showLogo ? 'Hide logo' : 'Show logo'}
                      onClick={() => setLogoHiddenMap(prev => ({ ...prev, [activeImageIdx]: !prev[activeImageIdx] }))} disabled={!activeImage} />
                  )}
                  {/* AI Captions */}
                  <motion.button
                    whileTap={!activeImage || isAnalyzing ? {} : { scale: 0.9 }}
                    title={!activeImage ? 'Load an image first' : 'Write AI Captions'}
                    disabled={!activeImage || isAnalyzing}
                    onClick={!activeImage ? undefined : handleGenerateCaptions}
                    style={{
                      width: '40px', height: '40px', borderRadius: '10px', border: 'none',
                      cursor: !activeImage ? 'not-allowed' : 'pointer',
                      background: 'rgba(124,58,237,0.15)', color: !activeImage ? 'var(--text-muted)' : '#a78bfa',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                      opacity: !activeImage ? 0.35 : 1,
                    }}
                    onMouseEnter={e => { if (activeImage) e.currentTarget.style.background = 'rgba(124,58,237,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; }}
                  >
                    {isAnalyzing ? <Loader2 size={15} className="spin-slow" /> : <Sparkles size={15} />}
                  </motion.button>
                  <div style={{ width: '28px', height: '1px', background: 'var(--glass-border)', margin: '2px auto' }} />
                  <ToolBtn icon={X} label="Clear all" danger disabled={!activeImage} onClick={async () => {
                    setImages([]); setActiveImageIdx(0); setLogoScaleMap({}); setLogoPosMap({}); setLogoHiddenMap({}); setTextLayersMap({});
                    try { const id = localStorage.getItem('ai_marketing_active_company_id') || 'default'; const k = `creative_studio_selected_images_${id}`; await saveToImageDB(k, []); sessionStorage.setItem(k, '[]'); } catch { }
                  }} />
                </div>
              </motion.div>

              {/* ══════ COL 2 — Canvas ══════ */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* ── Canvas card ── */}
                <div className="glass-card" style={{ position: 'relative' }}>

                  {/* ── Canvas image area ── */}

                  <div
                    ref={imageContainerRef}
                    style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: activeImage ? 'var(--bg-primary)' : 'var(--gradient-card)', overflow: 'hidden', cursor: isCropping ? 'crosshair' : activeTool === 'text' ? 'text' : 'default', borderRadius: 'inherit' }}
                    onClick={() => {
                      if (!isCropping) {
                        setSelectedTextId(null);
                        setSelectedShapeId(null);
                      }
                    }}
                  >
                    {activeImage ? (
                      <>
                        <img src={activeImage} alt="canvas" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', userSelect: 'none' }} draggable={false} />

                        {/* ── Shape layers on canvas ── */}
                        {!isCropping && shapeLayers.map(layer => {
                          const isSel = selectedShapeId === layer.id;
                          return (
                            <div
                              key={layer.id}
                              onMouseDown={e => startShapeDrag(layer.id, e)}
                              onClick={e => { e.stopPropagation(); setSelectedShapeId(layer.id); setActiveTool('shape'); setSelectedTextId(null); }}
                              style={{
                                position: 'absolute',
                                left: `${layer.x}%`, top: `${layer.y}%`,
                                width: `${layer.w}%`, height: `${layer.h}%`,
                                cursor: 'grab',
                                zIndex: 12
                              }}
                            >
                              <div style={{
                                width: '100%', height: '100%',
                                transform: `rotate(${layer.rotation || 0}deg)`,
                                border: isSel && (layer.type === 'rectangle' || layer.type === 'circle') ? '2px dashed rgba(124,58,237,0.8)' : 'none',
                                boxShadow: isSel && (layer.type === 'rectangle' || layer.type === 'circle') ? '0 0 0 2px rgba(255,255,255,0.5)' : 'none'
                              }}>
                                {/* Inner Shape Element */}
                                <div style={{
                                  width: '100%', height: '100%',
                                  backgroundColor: layer.color,
                                  borderRadius: (layer.type === 'rectangle' || layer.type === 'circle') ? `${layer.borderRadius}%` : '0',
                                  clipPath: layer.type === 'triangle' ? 'polygon(50% 13.4%, 0% 100%, 100% 100%)' : layer.type === 'hex' ? 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)' : 'none'
                                }} />

                                {isSel && (layer.type === 'triangle' || layer.type === 'hex') && (
                                  <div style={{ position: 'absolute', inset: -2, border: '2px dashed rgba(124,58,237,0.8)', pointerEvents: 'none', zIndex: -1 }} />
                                )}

                                {isSel && (
                                  <>
                                    {(['nw', 'ne', 'sw', 'se'] as const).map(h => (
                                      <div key={h} onMouseDown={e => startShapeResize(layer.id, h, e)} style={{ position: 'absolute', width: 12, height: 12, background: '#7c3aed', borderRadius: '50%', top: h.includes('n') ? -6 : undefined, bottom: h.includes('s') ? -6 : undefined, left: h.includes('w') ? -6 : undefined, right: h.includes('e') ? -6 : undefined, cursor: `${h}-resize`, zIndex: 13, boxShadow: '0 0 2px rgba(0,0,0,0.5)', border: '1.5px solid white' }} />
                                    ))}
                                  </>
                                )}
                              </div>

                              {isSel && (
                                <div onClick={e => { e.stopPropagation(); deleteShapeLayer(layer.id); }} style={{ position: 'absolute', top: '-12px', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.4)', zIndex: 20 }}>
                                  <X size={13} color="white" />
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* ── Text layers on canvas ── */}
                        {!isCropping && textLayers.map(layer => {
                          const isSel = selectedTextId === layer.id;
                          const cw = imageContainerRef.current?.getBoundingClientRect().width ?? 500;
                          const sfs = (layer.fontSize / 500) * cw;
                          return (
                            <div
                              key={layer.id}
                              onMouseDown={e => { e.stopPropagation(); setSelectedTextId(layer.id); startTextDrag(layer.id, e); }}
                              onClick={e => { e.stopPropagation(); setSelectedTextId(layer.id); if (activeTool !== 'text') setActiveTool('text'); }}
                              onDoubleClick={e => { e.stopPropagation(); setEditingTextId(layer.id); }}
                              style={{ position: 'absolute', left: `${layer.x}%`, top: `${layer.y}%`, cursor: 'grab', zIndex: 15, userSelect: 'none' }}
                            >
                              <div style={{ transform: `rotate(${layer.rotation || 0}deg)`, outline: isSel ? '1.5px dashed rgba(167,139,250,0.75)' : 'none', outlineOffset: '5px', borderRadius: '3px', padding: '2px 5px', background: isSel ? 'rgba(124,58,237,0.06)' : 'transparent', width: 'max-content' }}>
                                {editingTextId === layer.id ? (
                                  <textarea
                                    autoFocus
                                    value={layer.text}
                                    onChange={e => updateLayer(layer.id, { text: e.target.value })}
                                    onBlur={() => setEditingTextId(null)}
                                    onKeyDown={e => { if (e.key === 'Escape') setEditingTextId(null); e.stopPropagation(); }}
                                    onMouseDown={e => e.stopPropagation()} // Prevent dragging while typing
                                    style={{
                                      fontFamily: getBrandFontCss(layer.fontFamily), fontSize: `${sfs}px`, fontWeight: layer.fontWeight, color: layer.color,
                                      background: 'transparent', border: 'none', outline: 'none', resize: 'none', overflow: 'hidden', whiteSpace: 'pre-wrap', lineHeight: 1.2, textShadow: '0 2px 10px rgba(0,0,0,0.6)', maxWidth: `${cw * 0.85}px`, textAlign: layer.textAlign || 'left', minWidth: '100px', height: `${sfs * 1.5 * (layer.text.split('\\n').length || 1)}px`
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontFamily: getBrandFontCss(layer.fontFamily), fontSize: `${sfs}px`, fontWeight: layer.fontWeight, color: layer.color, whiteSpace: 'pre-wrap', lineHeight: 1.2, textShadow: '0 2px 10px rgba(0,0,0,0.6)', display: 'block', maxWidth: `${cw * 0.85}px`, wordBreak: 'break-word', textAlign: layer.textAlign || 'left' }}>
                                    {layer.text}
                                  </span>
                                )}
                              </div>
                              {/* small delete on selected */}
                              {isSel && (
                                <div onClick={e => { e.stopPropagation(); deleteLayer(layer.id); }} style={{ position: 'absolute', top: '-10px', right: '-10px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                                  <X size={11} color="white" />
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* ── Logo overlay ── */}
                        {companyLogo && showLogo && !isCropping && (
                          <div ref={logoRef} style={{ position: 'absolute', left: logoPos ? `${logoPos.x}%` : undefined, right: logoPos ? undefined : '20px', top: logoPos ? `${logoPos.y}%` : '20px', width: logoScale ? `${logoScale}%` : '50px', zIndex: 10, border: '1px solid transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.border = '1px dashed rgba(124,58,237,0.5)'; const btn = e.currentTarget.querySelector('.logo-del-btn'); if (btn) (btn as HTMLElement).style.opacity = '1'; }}
                            onMouseLeave={e => { e.currentTarget.style.border = '1px solid transparent'; const btn = e.currentTarget.querySelector('.logo-del-btn'); if (btn) (btn as HTMLElement).style.opacity = '0'; }}>

                            <div className="logo-del-btn" onClick={e => { e.stopPropagation(); setLogoHiddenMap(prev => ({ ...prev, [activeImageIdx]: true })); }} style={{ position: 'absolute', top: '-10px', right: '-10px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.4)', zIndex: 20, opacity: 0, transition: 'opacity 0.2s' }}>
                              <X size={11} color="white" />
                            </div>

                            <img src={companyLogo} alt="logo" onLoad={e => setLogoAspectRatio((e.target as HTMLImageElement).naturalWidth / (e.target as HTMLImageElement).naturalHeight)} onMouseDown={startLogoDrag} style={{ width: '100%', height: 'auto', display: 'block', cursor: 'grab', userSelect: 'none' }} draggable={false} />
                            {(['nw', 'ne', 'sw', 'se'] as const).map(h => (
                              <div key={h} onMouseDown={e => startLogoResize(h, e)} style={{ position: 'absolute', width: 10, height: 10, background: '#7c3aed', borderRadius: '50%', top: h.includes('n') ? -5 : undefined, bottom: h.includes('s') ? -5 : undefined, left: h.includes('w') ? -5 : undefined, right: h.includes('e') ? -5 : undefined, cursor: `${h}-resize`, zIndex: 11, boxShadow: '0 0 2px rgba(0,0,0,0.5)' }} />
                            ))}
                          </div>
                        )}

                        {/* ── Crop overlay ── */}
                        {isCropping && (
                          <>
                            {[{ top: 0, left: 0, width: `${cropRect.x}%`, height: '100%' }, { top: 0, right: 0, width: `${100 - cropRect.x - cropRect.w}%`, height: '100%' }, { top: 0, left: `${cropRect.x}%`, width: `${cropRect.w}%`, height: `${cropRect.y}%` }, { bottom: 0, left: `${cropRect.x}%`, width: `${cropRect.w}%`, height: `${100 - cropRect.y - cropRect.h}%` }].map((s, i) => (
                              <div key={i} style={{ position: 'absolute', background: 'rgba(0,0,0,0.55)', ...s, zIndex: 5 }} />
                            ))}
                            <div onMouseDown={e => startCropDrag('move', e)} style={{ position: 'absolute', left: `${cropRect.x}%`, top: `${cropRect.y}%`, width: `${cropRect.w}%`, height: `${cropRect.h}%`, border: '2px solid #7c3aed', boxShadow: '0 0 0 1px rgba(124,58,237,0.3)', cursor: 'move', zIndex: 6 }}>
                              {[33, 66].map(p => <div key={`v${p}`} style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.15)' }} />)}
                              {[33, 66].map(p => <div key={`h${p}`} style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.15)' }} />)}
                              {(['nw', 'ne', 'sw', 'se'] as const).map(h => <div key={h} onMouseDown={e => startCropDrag(h, e)} style={{ position: 'absolute', width: 12, height: 12, background: '#7c3aed', borderRadius: '2px', top: h.includes('n') ? -6 : undefined, bottom: h.includes('s') ? -6 : undefined, left: h.includes('w') ? -6 : undefined, right: h.includes('e') ? -6 : undefined, cursor: `${h}-resize`, zIndex: 7 }} />)}
                            </div>
                            {/* Crop controls floating inside canvas */}
                            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', zIndex: 8, background: 'rgba(0,0,0,0.65)', padding: '5px 6px', borderRadius: '10px', backdropFilter: 'blur(8px)' }}>
                              {[['Free', null], ['1:1', 1], ['16:9', 16 / 9], ['1.91:1', 1.91]].map(([lbl, val]) => (
                                <button key={String(lbl)} onClick={() => setActiveCropRatio(val as number | null)} style={{ padding: '4px 9px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer', background: activeCropRatio === val ? '#7c3aed' : 'rgba(255,255,255,0.1)', color: 'white' }}>{lbl as string}</button>
                              ))}
                            </div>
                            <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 8 }}>
                              <button onClick={applyCrop} style={{ padding: '8px 20px', fontSize: '12px', borderRadius: '10px', background: '#7c3aed', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(124,58,237,0.5)' }}><Check size={13} /> Apply</button>
                              <button onClick={() => setActiveTool('select')} style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}><X size={12} /></button>
                            </div>
                          </>
                        )}

                        {/* ── Text layer chips (bottom of canvas when text tool active) ── */}
                        {activeTool === 'text' && textLayers.length > 0 && !isCropping && (
                          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: '90%' }}>
                            {textLayers.map((layer, idx) => (
                              <motion.button
                                key={layer.id}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={e => { e.stopPropagation(); setSelectedTextId(selectedTextId === layer.id ? null : layer.id); }}
                                style={{
                                  padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', border: 'none',
                                  background: selectedTextId === layer.id ? 'rgba(124,58,237,0.9)' : 'rgba(0,0,0,0.65)',
                                  color: 'white', backdropFilter: 'blur(8px)',
                                  boxShadow: selectedTextId === layer.id ? '0 0 0 2px rgba(167,139,250,0.6)' : 'none',
                                  display: 'flex', alignItems: 'center', gap: '5px',
                                  transition: 'all 0.15s',
                                }}
                              >
                                <Type size={10} />
                                T{idx + 1}
                                <span style={{ opacity: 0.7, maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layer.text}</span>
                                <span onClick={e => { e.stopPropagation(); deleteLayer(layer.id); }} style={{ marginLeft: '2px', opacity: 0.6, cursor: 'pointer', display: 'flex' }}>×</span>
                              </motion.button>
                            ))}
                            <motion.button
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={e => { e.stopPropagation(); addTextLayer(); }}
                              style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', border: '1.5px dashed rgba(167,139,250,0.5)', background: 'rgba(124,58,237,0.15)', color: '#a78bfa', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Plus size={10} /> Add
                            </motion.button>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Empty state */
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={28} color="#7c3aed" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>No image selected</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Upload an image or generate one in the AI Studio.</div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <label className="btn-secondary" style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Upload size={13} /> Upload
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                          </label>
                          <Link href="/studio" style={{ textDecoration: 'none' }}>
                            <button className="btn-primary" style={{ padding: '10px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Sparkles size={13} /> AI Studio
                            </button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Format bar — slides in below canvas image when text selected ── */}
                  <AnimatePresence>
                    {selectedLayer && activeTool === 'text' && (
                      <motion.div
                        key="fmt-bar"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', borderTop: '1px solid var(--glass-border)' }}
                      >
                        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: 'rgba(124,58,237,0.04)' }}>
                          {/* Font family */}
                          <div style={{ position: 'relative' }}>
                            <select value={selectedLayer.fontFamily} onChange={e => updateLayer(selectedLayer.id, { fontFamily: e.target.value })}
                              style={{ appearance: 'none', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600, padding: '5px 26px 5px 10px', cursor: 'pointer', minWidth: '118px' }}>
                              {BRAND_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                            </select>
                            <ChevronDown size={11} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                          </div>
                          {/* Divider */}
                          <div style={{ width: '1px', height: '22px', background: 'var(--glass-border)' }} />
                          {/* Font size stepper */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button onClick={() => updateLayer(selectedLayer.id, { fontSize: Math.max(12, selectedLayer.fontSize - 4) })} style={{ width: '22px', height: '22px', borderRadius: '5px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}>−</button>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '30px', textAlign: 'center' }}>{selectedLayer.fontSize}</span>
                            <button onClick={() => updateLayer(selectedLayer.id, { fontSize: Math.min(160, selectedLayer.fontSize + 4) })} style={{ width: '22px', height: '22px', borderRadius: '5px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}>+</button>
                          </div>
                          {/* Divider */}
                          <div style={{ width: '1px', height: '22px', background: 'var(--glass-border)' }} />
                          {/* Weight */}
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {([['400', 'N', 'Normal'], ['700', 'B', 'Bold'], ['900', 'Bl', 'Black']] as const).map(([w, lbl, title]) => (
                              <button key={w} title={title} onClick={() => updateLayer(selectedLayer.id, { fontWeight: w as '400' | '700' | '900' })}
                                style={{ padding: '4px 8px', fontSize: '11px', fontWeight: w, borderRadius: '6px', border: selectedLayer.fontWeight === w ? '1.5px solid #7c3aed' : '1px solid var(--input-border)', background: selectedLayer.fontWeight === w ? 'rgba(124,58,237,0.15)' : 'var(--input-bg)', color: selectedLayer.fontWeight === w ? '#a78bfa' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.12s' }}>
                                {lbl}
                              </button>
                            ))}
                          </div>
                          {/* Divider */}
                          <div style={{ width: '1px', height: '22px', background: 'var(--glass-border)' }} />
                          {/* Alignment controls */}
                          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                            <button title="Align Left" onClick={() => updateLayer(selectedLayer.id, { textAlign: 'left' })} style={{ padding: '4px', borderRadius: '4px', border: selectedLayer.textAlign === 'left' || !selectedLayer.textAlign ? '1.5px solid #7c3aed' : '1px solid var(--input-border)', background: selectedLayer.textAlign === 'left' || !selectedLayer.textAlign ? 'rgba(124,58,237,0.15)' : 'var(--input-bg)', color: selectedLayer.textAlign === 'left' || !selectedLayer.textAlign ? '#a78bfa' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlignHorizontalJustifyStart size={14} /></button>
                            <button title="Align Center X" onClick={() => updateLayer(selectedLayer.id, { textAlign: 'center' })} style={{ padding: '4px', borderRadius: '4px', border: selectedLayer.textAlign === 'center' ? '1.5px solid #7c3aed' : '1px solid var(--input-border)', background: selectedLayer.textAlign === 'center' ? 'rgba(124,58,237,0.15)' : 'var(--input-bg)', color: selectedLayer.textAlign === 'center' ? '#a78bfa' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlignHorizontalJustifyCenter size={14} /></button>
                            <button title="Align Right" onClick={() => updateLayer(selectedLayer.id, { textAlign: 'right' })} style={{ padding: '4px', borderRadius: '4px', border: selectedLayer.textAlign === 'right' ? '1.5px solid #7c3aed' : '1px solid var(--input-border)', background: selectedLayer.textAlign === 'right' ? 'rgba(124,58,237,0.15)' : 'var(--input-bg)', color: selectedLayer.textAlign === 'right' ? '#a78bfa' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlignHorizontalJustifyEnd size={14} /></button>
                          </div>
                          {/* Divider */}
                          <div style={{ width: '1px', height: '22px', background: 'var(--glass-border)' }} />
                          {/* Color picker */}
                          <div style={{ position: 'relative', width: '28px', height: '28px', flexShrink: 0 }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: selectedLayer.color, border: '2px solid var(--input-border)' }} />
                            <input type="color" value={selectedLayer.color} onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                          </div>
                          {/* Divider */}
                          <div style={{ width: '1px', height: '22px', background: 'var(--glass-border)' }} />
                          {/* Rotation slider */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rot:</span>
                            <input type="range" min="0" max="360" value={selectedLayer.rotation || 0} onChange={e => updateLayer(selectedLayer.id, { rotation: Number(e.target.value) })} style={{ width: '50px', cursor: 'pointer' }} />
                          </div>
                          {/* Divider */}
                          <div style={{ width: '1px', height: '22px', background: 'var(--glass-border)' }} />
                          {/* Text input */}
                          <input value={selectedLayer.text} onChange={e => updateLayer(selectedLayer.id, { text: e.target.value })}
                            style={{ flex: 1, minWidth: '80px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '7px', color: 'var(--text-primary)', fontSize: '12px', padding: '5px 10px' }}
                            placeholder="Edit text…" />
                          {/* Delete */}
                          <button onClick={() => deleteLayer(selectedLayer.id)} title="Delete layer"
                            style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Shape format bar — slides in below canvas image when shape selected ── */}
                  <AnimatePresence>
                    {activeTool === 'shape' && (
                      <motion.div
                        key="shape-fmt-bar"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', borderTop: '1px solid var(--glass-border)' }}
                      >
                        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: 'rgba(124,58,237,0.04)' }}>

                          {!selectedShapeLayer ? (
                            <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button onClick={() => addShapeLayer('rectangle')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Square size={14} /> Add Rectangle
                              </button>
                              <button onClick={() => addShapeLayer('circle')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Circle size={14} /> Add Circle
                              </button>
                              <button onClick={() => addShapeLayer('triangle')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Triangle size={14} /> Add Triangle
                              </button>
                              <button onClick={() => addShapeLayer('hex')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Hexagon size={14} /> Add Hexagon
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Color picker */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Color:</span>
                                <div style={{ position: 'relative', width: '28px', height: '28px', flexShrink: 0 }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: selectedShapeLayer.color, border: '2px solid var(--input-border)' }} />
                                  <input type="color" value={selectedShapeLayer.color} onChange={e => updateShapeLayer(selectedShapeLayer.id, { color: e.target.value })} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                </div>
                              </div>

                              {/* Divider */}
                              <div style={{ width: '1px', height: '22px', background: 'var(--glass-border)' }} />

                              {/* Border Radius (only for rect/circle) */}
                              {(selectedShapeLayer.type === 'rectangle' || selectedShapeLayer.type === 'circle') && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Curve:</span>
                                  <input type="range" min="0" max="50" value={selectedShapeLayer.borderRadius} onChange={e => updateShapeLayer(selectedShapeLayer.id, { borderRadius: Number(e.target.value) })} style={{ flex: 1, cursor: 'pointer', maxWidth: '80px' }} />
                                </div>
                              )}

                              {/* Divider */}
                              <div style={{ width: '1px', height: '22px', background: 'var(--glass-border)' }} />

                              {/* Alignment controls */}
                              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '4px' }}>Align:</span>
                                <button title="Align Left" onClick={() => updateShapeLayer(selectedShapeLayer.id, { x: 0 })} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlignHorizontalJustifyStart size={14} /></button>
                                <button title="Align Center X" onClick={() => updateShapeLayer(selectedShapeLayer.id, { x: 50 - selectedShapeLayer.w / 2 })} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlignHorizontalJustifyCenter size={14} /></button>
                                <button title="Align Right" onClick={() => updateShapeLayer(selectedShapeLayer.id, { x: 100 - selectedShapeLayer.w })} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlignHorizontalJustifyEnd size={14} /></button>
                                <div style={{ width: '1px', height: '14px', background: 'var(--glass-border)', margin: '0 2px' }} />
                                <button title="Align Top" onClick={() => updateShapeLayer(selectedShapeLayer.id, { y: 0 })} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlignVerticalJustifyStart size={14} /></button>
                                <button title="Align Center Y" onClick={() => updateShapeLayer(selectedShapeLayer.id, { y: 50 - selectedShapeLayer.h / 2 })} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlignVerticalJustifyCenter size={14} /></button>
                                <button title="Align Bottom" onClick={() => updateShapeLayer(selectedShapeLayer.id, { y: 100 - selectedShapeLayer.h })} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlignVerticalJustifyEnd size={14} /></button>
                              </div>

                              {/* Divider */}
                              <div style={{ width: '1px', height: '22px', background: 'var(--glass-border)' }} />

                              {/* Rotation slider */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rot:</span>
                                <input type="range" min="0" max="360" value={selectedShapeLayer.rotation || 0} onChange={e => updateShapeLayer(selectedShapeLayer.id, { rotation: Number(e.target.value) })} style={{ width: '60px', cursor: 'pointer' }} />
                              </div>

                              {/* Delete */}
                              <button onClick={() => deleteShapeLayer(selectedShapeLayer.id)} title="Delete shape"
                                style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 'auto' }}>
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Active tool label strip ── */}
                  {activeImage && (
                    <div style={{ padding: '8px 16px', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--topbar-bg)', borderRadius: '0 0 inherit inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeTool === 'crop' ? '#f59e0b' : activeTool === 'text' ? '#a78bfa' : activeTool === 'shape' ? '#3b82f6' : '#10b981' }} />
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {activeTool === 'crop' ? 'Crop mode — drag corners or edges' : activeTool === 'text' ? `Text mode — click on canvas to deselect${textLayers.length ? ` · ${textLayers.length} layer${textLayers.length > 1 ? 's' : ''}` : ''}` : activeTool === 'shape' ? `Shape mode — click on canvas to deselect${shapeLayers.length ? ` · ${shapeLayers.length} shape${shapeLayers.length > 1 ? 's' : ''}` : ''}` : 'Select mode — drag elements to move or click to select'}
                        </span>
                      </div>
                      {activeTool !== 'select' && (
                        <button onClick={() => setActiveTool('select')} style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <X size={11} /> Exit
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Image carousel strip ── */}
                {images.length > 1 && (
                  <div className="glass-card" style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Carousel · {images.length} images</span>
                      <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 600 }}>Per-image layers</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                      {images.map((img, i) => (
                        <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                          <div onClick={() => setActiveImageIdx(i)} style={{ width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden', border: `2px solid ${i === activeImageIdx ? '#7c3aed' : 'rgba(124,58,237,0.15)'}`, cursor: 'pointer', transition: 'border-color 0.2s', boxShadow: i === activeImageIdx ? '0 0 0 3px rgba(124,58,237,0.25)' : 'none' }}>
                            <img src={img} alt={`img${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          {/* badges */}
                          {(textLayersMap[i] ?? []).length > 0 && <div style={{ position: 'absolute', top: -4, left: -4, width: 16, height: 16, borderRadius: '50%', background: '#06b6d4', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: 'white', fontWeight: 700 }}>T</div>}
                          {(logoScaleMap[i] !== undefined || logoPosMap[i] !== undefined) && <div style={{ position: 'absolute', bottom: 18, left: -4, width: 16, height: 16, borderRadius: '50%', background: '#7c3aed', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: 'white', fontWeight: 700 }}>L</div>}
                          <div style={{ position: 'absolute', bottom: 3, right: -4, width: 16, height: 16, borderRadius: '50%', background: i === activeImageIdx ? '#7c3aed' : 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white', fontWeight: 700 }}>{i + 1}</div>
                          <button onClick={() => handleRemoveImage(i)} style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}><X size={9} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>

              {/* ══════════════ RIGHT — Caption Editor ══════════════ */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Platform tabs */}
                <div className="glass-card" style={{ padding: '6px', display: 'flex', gap: '4px' }}>
                  {platforms.map(p => {
                    const Icon = p.icon; const s = platformStatuses[p.id]; const isActive = activePlatform === p.id;
                    return (
                      <button key={p.id} id={`tab-${p.id}`} onClick={() => setActivePlatform(p.id)} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: isActive ? `rgba(${p.id === 'facebook' ? '24,119,242' : p.id === 'instagram' ? '225,48,108' : p.id === 'x' ? '255,255,255' : '10,102,194'},0.12)` : 'transparent', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', position: 'relative', boxShadow: isActive ? `inset 0 -2px 0 ${p.color}` : 'none', fontFamily: "'Inter', sans-serif" }}>
                        <Icon size={16} color={isActive ? p.color : 'var(--text-secondary)'} style={{ opacity: enabledPlatforms[p.id] ? 1 : 0.35 }} />
                        <span style={{ fontSize: '10px', fontWeight: 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', opacity: enabledPlatforms[p.id] ? 1 : 0.35 }}>{p.label.split(' ')[0]}</span>
                        <span style={{ fontSize: '9px', fontWeight: 500, color: isActive ? p.color : 'var(--text-muted)', opacity: enabledPlatforms[p.id] ? 0.85 : 0.35 }}>({p.aspectRatio})</span>
                        {!enabledPlatforms[p.id] && <span style={{ position: 'absolute', top: 4, right: 4, fontSize: '7px', color: 'var(--text-muted)', fontWeight: 700, background: 'var(--bg-secondary)', padding: '1px 3px', borderRadius: '3px' }}>SKIP</span>}
                        {s.status !== 'idle' && <span style={{ position: 'absolute', top: 4, left: 4 }}>{statusIcon(s.status)}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Caption editor */}
                <AnimatePresence mode="wait">
                  <motion.div key={activePlatform} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          {(() => { const Icon = platform.icon; return <Icon size={16} color={platform.color} />; })()}
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{platform.label}</span>
                          {platformStatuses[activePlatform].status !== 'idle' && statusIcon(platformStatuses[activePlatform].status)}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: 1.5 }}>{platform.tip}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', background: 'var(--input-bg)', padding: '6px 12px', borderRadius: '9px', border: '1px solid var(--input-border)' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: enabledPlatforms[activePlatform] ? '#a78bfa' : 'var(--text-secondary)' }}>{enabledPlatforms[activePlatform] ? 'Post' : 'Skip'}</span>
                          <div style={{ width: '34px', height: '18px', background: enabledPlatforms[activePlatform] ? '#7c3aed' : 'var(--bg-secondary)', borderRadius: '9px', position: 'relative', transition: '0.25s', cursor: 'pointer', flexShrink: 0 }} onClick={e => { e.preventDefault(); setEnabledPlatforms(prev => ({ ...prev, [activePlatform]: !prev[activePlatform] })); }}>
                            <div style={{ width: '14px', height: '14px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: enabledPlatforms[activePlatform] ? '18px' : '2px', transition: '0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
                          </div>
                        </label>
                        <button className="btn-ghost" style={{ padding: '7px 12px', fontSize: '11px' }} onClick={() => handleCopy(activePlatform, caption)} id={`copy-${activePlatform}`} disabled={!caption}>
                          {copied === activePlatform ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
                        </button>
                        <button className="btn-secondary" style={{ padding: '7px 12px', fontSize: '11px' }} onClick={() => handleRegenerate(activePlatform)} id={`regen-${activePlatform}`} disabled={isRegenerating === activePlatform}>
                          {isRegenerating === activePlatform ? <><Loader2 size={11} className="spin-slow" /> Generating…</> : <><Sparkles size={11} /> Regenerate</>}
                        </button>
                      </div>
                    </div>
                    <textarea id={`caption-${activePlatform}`} className="input-field" value={caption} onChange={e => setCaptions(prev => ({ ...prev, [activePlatform]: e.target.value }))} placeholder={`Write your ${platform.label} caption…`} style={{ minHeight: '200px', fontSize: '13px', lineHeight: '1.75', resize: 'vertical' }} />
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Hash size={10} /> {(caption.match(/#\w+/g) || []).length} / {platform.maxHashtags} hashtags</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><AtSign size={10} /> {(caption.match(/@\w+/g) || []).length} mentions</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '90px', height: '4px', background: 'rgba(124,58,237,0.12)', borderRadius: '2px' }}>
                          <div style={{ width: `${charPct}%`, height: '100%', background: charPct > 90 ? '#ef4444' : 'linear-gradient(to right,#7c3aed,#06b6d4)', borderRadius: '2px', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: charPct > 90 ? '#f87171' : 'var(--text-muted)', fontWeight: 600 }}>{caption.length.toLocaleString()} / {platform.charLimit.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Schedule */}
                <div className="glass-card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={16} color="#7c3aed" /></div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Schedule for Later</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>Best times: 9 AM, 12 PM, 6 PM IST</div>
                      </div>
                    </div>
                    <input type="datetime-local" className="input-field" style={{ width: '200px', fontSize: '12px', padding: '8px 12px' }} />
                  </div>
                </div>

                {/* Publish */}
                <motion.button id="publish-everywhere-btn" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '15px', fontWeight: 700, borderRadius: '14px' }} onClick={handlePublishAll} disabled={isPublishingAll} whileTap={{ scale: 0.98 }} whileHover={{ boxShadow: '0 8px 40px rgba(124,58,237,0.5)' }}>
                  {isPublishingAll ? <><div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>{[0, 1, 2, 3, 4].map(i => <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s`, height: '14px' }} />)}</div>Publishing…</> : publishDone ? <><RefreshCw size={16} /> Publish Again</> : <><Send size={16} /> <Zap size={14} /> Publish Everywhere</>}
                </motion.button>

                {/* Publish status */}
                <AnimatePresence>
                  {(isPublishingAll || publishDone) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-card" style={{ overflow: 'hidden', padding: '16px 20px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={12} color="#7c3aed" /> Publish Summary</div>
                      {platforms.map(p => {
                        if (!enabledPlatforms[p.id]) return null;
                        const Icon = p.icon; const s = platformStatuses[p.id];
                        return (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icon size={14} color={p.color} /><span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{p.label}</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{statusIcon(s.status)}<span style={{ fontSize: '11px', color: s.status === 'success' ? '#34d399' : s.status === 'error' ? '#f87171' : s.status === 'publishing' ? '#fbbf24' : '#475569' }}>{s.status === 'idle' ? 'Queued' : s.status === 'publishing' ? 'Publishing…' : s.message}</span></div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Add image dropdown — rendered via portal so it always appears above canvas */}
      {showAddMenu && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <>
            <div onClick={() => setShowAddMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
            <motion.div
              initial={{ opacity: 0, x: 6, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: addMenuPos.top,
                left: addMenuPos.left,
                zIndex: 9999,
                minWidth: '155px',
                background: 'var(--bg-card)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 16px 48px rgba(0,0,0,0.65)',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Upload size={13} color="#7c3aed" /> Local File
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { handleImageUpload(e); setShowAddMenu(false); }} />
              </label>
              <div style={{ height: '1px', background: 'var(--glass-border)' }} />
              <button onClick={openStudioPicker}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Sparkles size={13} color="#7c3aed" /> From Studio
              </button>
            </motion.div>
          </>
        </AnimatePresence>,
        document.body
      )}

      {/* Studio picker modal */}
      <AnimatePresence>
        {showStudioPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setShowStudioPicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.95 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }} onClick={e => e.stopPropagation()} style={{ width: '720px', maxWidth: '95vw', maxHeight: '80vh', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={16} color="#7c3aed" /> Studio Gallery</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Click an image to toggle it in your editor ({images.length}/5 selected)</div>
                </div>
                <button onClick={() => setShowStudioPicker(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={14} /></button>
              </div>
              <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
                {studioImages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}><ImageIcon size={32} style={{ marginBottom: '12px', opacity: 0.4 }} /><div style={{ fontSize: '14px' }}>No images in your Studio yet.</div><div style={{ fontSize: '12px', marginTop: '4px' }}>Generate images in the AI Studio first.</div></div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {studioImages.map(si => {
                      const added = images.includes(si.url);
                      return (
                        <motion.div key={si.id} whileHover={{ scale: 1.03 }} onClick={() => { if (added) { const i = images.indexOf(si.url); if (i !== -1) handleRemoveImage(i); } else { if (images.length >= 5) return; setImages(prev => [...prev, si.url]); } }} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1/1', cursor: 'pointer', border: added ? '2px solid #7c3aed' : '2px solid transparent', opacity: added ? 0.6 : 1 }}>
                          <img src={si.url} alt="studio" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          {added && <div style={{ position: 'absolute', inset: 0, background: 'rgba(124,58,237,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={20} color="white" strokeWidth={3} /></div>}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-card)' }}>
                <button onClick={() => setShowStudioPicker(false)} className="btn-primary" style={{ padding: '8px 24px', fontSize: '13px', fontWeight: 600, borderRadius: '8px' }}>Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
