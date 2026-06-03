'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  Send, Check, Copy, RefreshCw, Sparkles, AlertCircle, CheckCircle2,
  Loader2, Hash, AtSign, Clock, Zap, Globe, ImageIcon, Upload, X,
  Crop, Eye, EyeOff,
} from 'lucide-react';
import { loadFromImageDB, saveToImageDB } from '@/lib/image-db';
import { FacebookIcon, InstagramIcon, LinkedinIcon, XSocialIcon } from '@/components/SocialIcons';
import Link from 'next/link';

// ─── Platform definitions ─────────────────────────────────────────────────────

const platforms = [
  { id: 'facebook',  label: 'Facebook',   icon: FacebookIcon,   color: '#1877F2', charLimit: 63206, tip: 'Longer posts with storytelling work best. Use emojis & strong CTAs.', maxHashtags: 10,  aspectRatio: '1.91:1' },
  { id: 'instagram', label: 'Instagram',  icon: InstagramIcon,  color: '#E1306C', charLimit: 2200,  tip: 'Punchy first line, heavy hashtags (up to 30), emojis encouraged.',    maxHashtags: 30,  aspectRatio: '1:1'    },
  { id: 'x',         label: 'X (Twitter)',icon: XSocialIcon,    color: 'currentColor', charLimit: 280,   tip: 'Short & punchy. Max 280 chars. 1-2 hashtags is ideal.',               maxHashtags: 2,   aspectRatio: '16:9'   },
  { id: 'linkedin',  label: 'LinkedIn',   icon: LinkedinIcon,   color: '#0A66C2', charLimit: 3000,  tip: 'Professional tone. Thought leadership stories convert best.',          maxHashtags: 5,   aspectRatio: '1.91:1' },
];

type PublishStatus = 'idle' | 'publishing' | 'success' | 'error';
interface PlatformStatus { status: PublishStatus; message?: string; }

// ─── Crop overlay type ────────────────────────────────────────────────────────

interface CropRect { x: number; y: number; w: number; h: number; }

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditorPage() {

  // ── Caption state ───────────────────────────────────────────────────────────
  const [captions, setCaptions] = useState<Record<string, string>>(
    Object.fromEntries(platforms.map(p => [p.id, '']))
  );
  const [activePlatform, setActivePlatform] = useState('facebook');
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, PlatformStatus>>(
    Object.fromEntries(platforms.map(p => [p.id, { status: 'idle' }]))
  );
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [isPublishingAll, setIsPublishingAll] = useState(false);
  const [publishDone, setPublishDone] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [enabledPlatforms, setEnabledPlatforms] = useState<Record<string, boolean>>(
    Object.fromEntries(platforms.map(p => [p.id, true]))
  );

  // ── Images ──────────────────────────────────────────────────────────────
  const [images, setImages] = useState<string[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // ── Add-Image dropdown & Studio picker modal ───────────────────────────────────
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showStudioPicker, setShowStudioPicker] = useState(false);
  const [studioImages, setStudioImages] = useState<{ id: string; url: string }[]>([]);

  // ── Crop state ──────────────────────────────────────────────────────────────
  const [isCropping, setIsCropping]   = useState(false);
  const [cropRect, setCropRect]       = useState<CropRect>({ x: 10, y: 10, w: 80, h: 80 }); // percent
  const [activeCropRatio, setActiveCropRatio] = useState<number | null>(null);
  const cropDragRef = useRef<{ handle: string; startX: number; startY: number; startRect: CropRect } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // ── Logo state ──────────────────────────────────────────────────────────────
  const [companyLogo, setCompanyLogo]   = useState<string | null>(null);
  const [showLogo, setShowLogo]         = useState(true);
  // Per-image logo placement maps
  const [logoScaleMap, setLogoScaleMap] = useState<Record<number, number>>({});
  const [logoPosMap, setLogoPosMap]     = useState<Record<number, { x: number; y: number }>>({});
  const [logoAspectRatio, setLogoAspectRatio] = useState(1);
  // Getters for the active image's logo settings
  const logoScale = logoScaleMap[activeImageIdx] ?? 25;
  const logoPos   = logoPosMap[activeImageIdx]   ?? { x: 10, y: 10 };
  // Setters that write into the per-image maps
  const setLogoScale = (val: number | ((prev: number) => number)) =>
    setLogoScaleMap(prev => ({ ...prev, [activeImageIdx]: typeof val === 'function' ? val(prev[activeImageIdx] ?? 25) : val }));
  const setLogoPos = (val: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) =>
    setLogoPosMap(prev => ({ ...prev, [activeImageIdx]: typeof val === 'function' ? val(prev[activeImageIdx] ?? { x: 10, y: 10 }) : val }));
  const logoDragRef = useRef<{ startX: number; startY: number; startPos: { x: number; y: number } } | null>(null);
  const logoResizeRef = useRef<{ handle: string; startX: number; startY: number; startScale: number; startPos: {x: number; y: number} } | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // ── Load images & logo from localStorage ────────────────────────────────────
  useEffect(() => {
    const loadSelectedImages = async () => {
      const activeId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
      let dbImages = await loadFromImageDB(`creative_studio_selected_images_${activeId}`);
      
      if (!dbImages || dbImages.length === 0) {
        let raw = localStorage.getItem(`creative_studio_selected_images_${activeId}`);
        if (!raw) raw = sessionStorage.getItem(`creative_studio_selected_images_${activeId}`);
        if (raw) {
          try {
            dbImages = JSON.parse(raw);
          } catch { dbImages = [raw]; }
        }
      }
      
      if (Array.isArray(dbImages)) setImages(dbImages);
      else setImages([]);
    };

    loadSelectedImages();
    window.addEventListener('brand-updated', loadSelectedImages);
    return () => window.removeEventListener('brand-updated', loadSelectedImages);
  }, []);

  useEffect(() => {
    const loadActiveCompanyLogo = () => {
      const activeId = localStorage.getItem('ai_marketing_active_company_id');
      const companiesStr = localStorage.getItem('ai_marketing_companies');
      if (activeId && companiesStr) {
        const companies = JSON.parse(companiesStr) as { id: string; logo?: string | null }[];
        const active = companies.find((c) => c.id === activeId);
        if (active && active.logo) {
          setCompanyLogo(active.logo);
          setShowLogo(true);
          return;
        }
      }
      // Fallback or empty
      setCompanyLogo(null);
      setShowLogo(false);
    };

    loadActiveCompanyLogo();
    window.addEventListener('brand-updated', loadActiveCompanyLogo);
    return () => window.removeEventListener('brand-updated', loadActiveCompanyLogo);
  }, []);

  // ── Image upload ─────────────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      if (result) setImages(prev => prev.length < 5 ? [...prev, result] : prev);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Studio picker ─────────────────────────────────────────────────────────────
  const openStudioPicker = async () => {
    const activeId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
    const history = await loadFromImageDB(`creative_studio_history_${activeId}`);
    if (Array.isArray(history)) {
      setStudioImages(history.filter((h: { url?: string }) => h?.url).map((h: { id: string; url: string }) => ({ id: h.id, url: h.url })));
    } else {
      setStudioImages([]);
    }
    setShowAddMenu(false);
    setShowStudioPicker(true);
  };

  // Sync a removed image URL back to the studio's selected-images IndexedDB
  const syncRemoveToStudio = async (removedUrl: string) => {
    try {
      const activeId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
      const key = `creative_studio_selected_images_${activeId}`;
      const saved = await loadFromImageDB(key);
      if (Array.isArray(saved)) {
        const updated = saved.filter((u: string) => u !== removedUrl);
        await saveToImageDB(key, updated);
        sessionStorage.setItem(key, JSON.stringify(updated));
      }
    } catch { /* best-effort */ }
  };

  // Remove image from editor strip + deselect in studio
  const handleRemoveImage = (idx: number) => {
    const removedUrl = images[idx];
    setImages(prev => prev.filter((_, i) => i !== idx));
    setLogoScaleMap(prev => {
      const next: Record<number, number> = {};
      Object.entries(prev).forEach(([k, v]) => { const ki = Number(k); if (ki < idx) next[ki] = v; else if (ki > idx) next[ki - 1] = v; });
      return next;
    });
    setLogoPosMap(prev => {
      const next: Record<number, { x: number; y: number }> = {};
      Object.entries(prev).forEach(([k, v]) => { const ki = Number(k); if (ki < idx) next[ki] = v; else if (ki > idx) next[ki - 1] = v; });
      return next;
    });
    if (activeImageIdx >= idx && activeImageIdx > 0) setActiveImageIdx(v => v - 1);
    syncRemoveToStudio(removedUrl);
  };

  // ── Caption generation ───────────────────────────────────────────────────────
  const handleGenerateCaptions = async () => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/captions/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: images[activeImageIdx] || images[0] }),
      });
      const data = await res.json();
      if (data.captions) setCaptions(data.captions);
    } catch (err) { console.error(err); }
    finally { setIsAnalyzing(false); }
  };

  // ── Crop tool ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeCropRatio && isCropping) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCropRect(prev => {
        const expectedH = prev.w / activeCropRatio;
        if (prev.y + expectedH <= 100) return { ...prev, h: expectedH };
        const expectedW = prev.h * activeCropRatio;
        return { ...prev, w: expectedW };
      });
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
        if (handle === 'move') {
          x = Math.max(0, Math.min(100 - w, x + dx)); 
          y = Math.max(0, Math.min(100 - h, y + dy)); 
        } else {
          if (handle === 'nw')    { const nx = Math.min(x + w - 5, x + dx); const ny = Math.min(y + h - 5, y + dy); w = w - (nx - x); h = h - (ny - y); x = nx; y = ny; }
          if (handle === 'ne')    { w = Math.max(5, w + dx); const ny = Math.min(y + h - 5, y + dy); h = h - (ny - y); y = ny; }
          if (handle === 'sw')    { const nx = Math.min(x + w - 5, x + dx); w = w - (nx - x); x = nx; h = Math.max(5, h + dy); }
          if (handle === 'se')    { w = Math.max(5, w + dx); h = Math.max(5, h + dy); }
          
          if (activeCropRatio) {
             let newW = w;
             let newH = w / activeCropRatio;
             let newX = x;
             let newY = y;
             if (handle === 'nw' || handle === 'ne') newY = startRect.y + startRect.h - newH;
             if (newX < 0) { newW += newX; newX = 0; newH = newW / activeCropRatio; if (handle === 'nw' || handle === 'ne') newY = startRect.y + startRect.h - newH; }
             if (newY < 0) { newH += newY; newY = 0; newW = newH * activeCropRatio; if (handle === 'nw' || handle === 'sw') newX = startRect.x + startRect.w - newW; }
             if (newX + newW > 100) { newW = 100 - newX; newX = 100 - newW; newH = newW / activeCropRatio; if (handle === 'nw' || handle === 'ne') newY = startRect.y + startRect.h - newH; }
             if (newY + newH > 100) { newH = 100 - newY; newY = 100 - newH; newW = newH * activeCropRatio; if (handle === 'nw' || handle === 'sw') newX = startRect.x + startRect.w - newW; }
             w = newW; h = newH; x = newX; y = newY;
          }
        }
        return { x: Math.max(0, x), y: Math.max(0, y), w: Math.min(100 - x, w), h: Math.min(100 - y, h) };
      });
    };
    const onUp = () => { cropDragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [cropRect, activeCropRatio]);

  const applyCrop = useCallback(() => {
    const img = new Image();
    img.src = images[activeImageIdx];
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const cx = (cropRect.x / 100) * img.naturalWidth;
      const cy = (cropRect.y / 100) * img.naturalHeight;
      const cw = (cropRect.w / 100) * img.naturalWidth;
      const ch = (cropRect.h / 100) * img.naturalHeight;
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
      const cropped = canvas.toDataURL('image/jpeg', 0.9);
      setImages(prev => prev.map((im, i) => i === activeImageIdx ? cropped : im));
      setIsCropping(false);
      setCropRect({ x: 10, y: 10, w: 80, h: 80 });
    };
  }, [images, activeImageIdx, cropRect]);

  // ── Logo drag ────────────────────────────────────────────────────────────────
  const startLogoDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!imageContainerRef.current) return;
    logoDragRef.current = { startX: e.clientX, startY: e.clientY, startPos: { ...logoPos } };
    const onMove = (ev: MouseEvent) => {
      if (!logoDragRef.current || !imageContainerRef.current) return;
      const { startX, startY, startPos } = logoDragRef.current;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      setLogoPos({
        x: Math.max(0, Math.min(100 - logoScale, startPos.x + dx)),
        y: Math.max(0, Math.min(100 - (logoScale / logoAspectRatio), startPos.y + dy)),
      });
    };
    const onUp = () => { logoDragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [logoPos, logoScale, logoAspectRatio]);

  const startLogoResize = useCallback((handle: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!imageContainerRef.current) return;
    logoResizeRef.current = { handle, startX: e.clientX, startY: e.clientY, startScale: logoScale, startPos: { ...logoPos } };
    const onMove = (ev: MouseEvent) => {
      if (!logoResizeRef.current || !imageContainerRef.current) return;
      const { handle, startX, startScale, startPos } = logoResizeRef.current;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      
      let newScale = startScale;
      let newX = startPos.x;
      let newY = startPos.y;

      if (handle === 'se') {
        newScale = Math.max(5, startScale + dx);
      } else if (handle === 'sw') {
        newScale = Math.max(5, startScale - dx);
        newX = startPos.x + startScale - newScale;
      } else if (handle === 'ne') {
        newScale = Math.max(5, startScale + dx);
        newY = startPos.y - (newScale - startScale) / logoAspectRatio;
      } else if (handle === 'nw') {
        newScale = Math.max(5, startScale - dx);
        newX = startPos.x + startScale - newScale;
        newY = startPos.y - (newScale - startScale) / logoAspectRatio;
      }
      
      if (newScale > 100) newScale = 100;
      
      setLogoScale(newScale);
      setLogoPos({ x: newX, y: newY });
    };
    const onUp = () => { logoResizeRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [logoPos, logoScale, logoAspectRatio]);

  // ── Compose image + logo on canvas ───────────────────────────────────────────
  // Compose a single image with a specific logo pos/scale
  const composeImageWithSettings = useCallback((base64: string, scale: number, pos: { x: number; y: number }): Promise<string> => {
    return new Promise(resolve => {
      if (!companyLogo || !showLogo) { resolve(base64); return; }
      const img = new Image(); img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const logo = new Image(); logo.src = companyLogo;
        logo.onload = () => {
          const lw = (scale / 100) * canvas.width;
          const lh = (logo.naturalHeight / logo.naturalWidth) * lw;
          const lx = (pos.x / 100) * canvas.width;
          const ly = (pos.y / 100) * canvas.height;
          ctx.drawImage(logo, lx, ly, lw, lh);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        logo.onerror = () => resolve(base64);
      };
      img.onerror = () => resolve(base64);
    });
  }, [companyLogo, showLogo]);

  const composeImage = useCallback((base64: string): Promise<string> => {
    return composeImageWithSettings(base64, logoScale, logoPos);
  }, [composeImageWithSettings, logoScale, logoPos]);

  // ── Publish ──────────────────────────────────────────────────────────────────
  const handlePublishAll = async () => {
    setIsPublishingAll(true); setPublishDone(false);
    
    if (images.length === 0) {
      alert('No image available to publish');
      setIsPublishingAll(false);
      return;
    }

    // 1. Compose ALL images with their individual logo placements
    const composedImages = await Promise.all(
      images.map((img, idx) => {
        const scale = logoScaleMap[idx] ?? 25;
        const pos   = logoPosMap[idx]   ?? { x: 10, y: 10 };
        return composeImageWithSettings(img, scale, pos);
      })
    );

    // 2. Publish to each enabled platform as a single carousel post
    for (const p of platforms) {
      if (!enabledPlatforms[p.id]) continue;
      
      setPlatformStatuses(prev => ({ ...prev, [p.id]: { status: 'publishing' } }));
      
      try {
        const res = await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: p.id,
            // Send all composed images; API will create a carousel if more than 1
            images: composedImages,
            caption: captions[p.id] || ''
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("API Error:", res.status, errText);
          let msg = errText.substring(0, 50);
          try { msg = JSON.parse(errText).error || msg; } catch {}
          setPlatformStatuses(prev => ({ ...prev, [p.id]: { status: 'error', message: `Error ${res.status}: ${msg}` } }));
          continue;
        }

        const data = await res.json();
        
        if (data.success) {
          setPlatformStatuses(prev => ({ ...prev, [p.id]: { status: 'success' } }));
        } else {
          setPlatformStatuses(prev => ({ ...prev, [p.id]: { status: 'error', message: data.error || 'Failed to publish' } }));
        }
      } catch (err) {
        console.error("Network Error:", err);
        const msg = err instanceof Error ? err.message : 'Network error occurred';
        setPlatformStatuses(prev => ({ ...prev, [p.id]: { status: 'error', message: msg } }));
      }
    }
    
    setIsPublishingAll(false); setPublishDone(true);
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const handleCopy = (platformId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(platformId);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRegenerate = (platformId: string) => {
    setIsRegenerating(platformId);
    setTimeout(() => setIsRegenerating(null), 2000);
  };

  const statusIcon = (status: PublishStatus) => {
    switch (status) {
      case 'publishing': return <Loader2 size={13} className="spin-slow" color="#f59e0b" />;
      case 'success':    return <CheckCircle2 size={13} color="#10b981" />;
      case 'error':      return <AlertCircle  size={13} color="#ef4444" />;
      default:           return null;
    }
  };

  const platform   = platforms.find(p => p.id === activePlatform)!;
  const caption    = captions[activePlatform] || '';
  const charCount  = caption.length;
  const charPct    = Math.min((charCount / platform.charLimit) * 100, 100);
  const activeImage = images[activeImageIdx] || null;

  // ─── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
        <Topbar title="Unified Editor" subtitle="Compose, brand & publish to all platforms" />
        <div className="page-content" style={{ paddingBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '540px 1fr', gap: '24px', alignItems: 'start', maxWidth: '1300px' }}>

            {/* ══════════════════════ LEFT — Image Canvas ══════════════════════ */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.4,0,0.2,1] }}
              style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Image canvas */}
              <div className="glass-card" style={{ position: 'relative', zIndex: 10 }}>
                {/* Canvas area */}
                <div
                  ref={imageContainerRef}
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1/1',
                    background: activeImage ? 'var(--bg-primary)' : 'var(--gradient-card)',
                    overflow: 'hidden',
                    cursor: isCropping ? 'crosshair' : 'default',
                  }}
                >
                  {activeImage ? (
                    <>
                      <img
                        src={activeImage}
                        alt="canvas"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', userSelect: 'none' }}
                        draggable={false}
                      />

                      {/* Logo overlay */}
                      {companyLogo && showLogo && !isCropping && (
                        <div
                          ref={logoRef}
                          style={{
                            position: 'absolute',
                            left: `${logoPos.x}%`, top: `${logoPos.y}%`,
                            width: `${logoScale}%`,
                            zIndex: 10,
                            border: '1px solid transparent',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.border = '1px dashed rgba(124,58,237,0.5)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.border = '1px solid transparent' }}
                        >
                          <img 
                            src={companyLogo} 
                            alt="logo" 
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              setLogoAspectRatio(img.naturalWidth / img.naturalHeight);
                            }}
                            onMouseDown={startLogoDrag}
                            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'grab', userSelect: 'none', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} 
                            draggable={false} 
                          />
                          {/* Corner handles */}
                          {(['nw','ne','sw','se'] as const).map(h => (
                            <div
                              key={h}
                              onMouseDown={e => startLogoResize(h, e)}
                              style={{
                                position: 'absolute', width: 10, height: 10,
                                background: '#7c3aed', borderRadius: '50%',
                                top:    h.includes('n') ? -5 : undefined,
                                bottom: h.includes('s') ? -5 : undefined,
                                left:   h.includes('w') ? -5 : undefined,
                                right:  h.includes('e') ? -5 : undefined,
                                cursor: `${h}-resize`, zIndex: 11,
                                boxShadow: '0 0 2px rgba(0,0,0,0.5)'
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Crop overlay */}
                      {isCropping && (
                        <>
                          {/* Dimmed outside area (4 rects) */}
                          {[
                            { top: 0, left: 0, width: `${cropRect.x}%`, height: '100%' },
                            { top: 0, right: 0, width: `${100 - cropRect.x - cropRect.w}%`, height: '100%' },
                            { top: 0, left: `${cropRect.x}%`, width: `${cropRect.w}%`, height: `${cropRect.y}%` },
                            { bottom: 0, left: `${cropRect.x}%`, width: `${cropRect.w}%`, height: `${100 - cropRect.y - cropRect.h}%` },
                          ].map((s, i) => (
                            <div key={i} style={{ position: 'absolute', background: 'rgba(0,0,0,0.55)', ...s, zIndex: 5 }} />
                          ))}

                          {/* Crop rect */}
                          <div
                            onMouseDown={e => startCropDrag('move', e)}
                            style={{
                              position: 'absolute',
                              left: `${cropRect.x}%`, top: `${cropRect.y}%`,
                              width: `${cropRect.w}%`, height: `${cropRect.h}%`,
                              border: '2px solid #7c3aed',
                              boxShadow: '0 0 0 1px rgba(124,58,237,0.3)',
                              cursor: 'move', zIndex: 6,
                            }}
                          >
                            {/* Rule-of-thirds grid */}
                            {[33, 66].map(p => (
                              <div key={`v${p}`} style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.15)' }} />
                            ))}
                            {[33, 66].map(p => (
                              <div key={`h${p}`} style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.15)' }} />
                            ))}

                            {/* Corner handles */}
                            {(['nw','ne','sw','se'] as const).map(h => (
                              <div
                                key={h}
                                onMouseDown={e => startCropDrag(h, e)}
                                style={{
                                  position: 'absolute', width: 12, height: 12,
                                  background: '#7c3aed', borderRadius: '2px',
                                  top:    h.includes('n') ? -6 : undefined,
                                  bottom: h.includes('s') ? -6 : undefined,
                                  left:   h.includes('w') ? -6 : undefined,
                                  right:  h.includes('e') ? -6 : undefined,
                                  cursor: `${h}-resize`, zIndex: 7,
                                }}
                              />
                            ))}
                          </div>

                          {/* Crop Ratio Presets */}
                          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', zIndex: 8, background: 'rgba(0,0,0,0.6)', padding: '4px', borderRadius: '8px', backdropFilter: 'blur(4px)' }}>
                            <button onClick={() => setActiveCropRatio(null)} className={!activeCropRatio ? 'btn-primary' : 'btn-ghost'} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '6px' }}>Free</button>
                            <button onClick={() => setActiveCropRatio(1)} className={activeCropRatio === 1 ? 'btn-primary' : 'btn-ghost'} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '6px' }}>1:1</button>
                            <button onClick={() => setActiveCropRatio(16/9)} className={activeCropRatio === 16/9 ? 'btn-primary' : 'btn-ghost'} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '6px' }}>16:9</button>
                            <button onClick={() => setActiveCropRatio(1.91/1)} className={activeCropRatio === 1.91/1 ? 'btn-primary' : 'btn-ghost'} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '6px' }}>1.91:1</button>
                          </div>

                          {/* Crop action buttons */}
                          <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 8 }}>
                            <button onClick={applyCrop} className="btn-primary" style={{ padding: '8px 18px', fontSize: '12px', borderRadius: '10px' }}>
                              <Check size={12} /> Apply Crop
                            </button>
                            <button onClick={() => setIsCropping(false)} className="btn-ghost" style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.6)' }}>
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        </>
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

                {/* Toolbar */}
                {activeImage && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--topbar-bg)', flexWrap: 'wrap' }}>

                    {/* ── Add Image dropdown ── */}
                    <div style={{ position: 'relative' }}>
                      <button
                        title="Add image"
                        onClick={() => setShowAddMenu(v => !v)}
                        className="btn-ghost"
                        style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Upload size={12} /> Add Image
                      </button>
                      <AnimatePresence>
                        {showAddMenu && (
                          <>
                            {/* backdrop */}
                            <div onClick={() => setShowAddMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.96 }}
                              transition={{ duration: 0.15 }}
                              style={{
                                position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
                                zIndex: 100, minWidth: '150px',
                                background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                                borderRadius: '10px', overflow: 'hidden',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                              }}
                            >
                              <label
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <Upload size={13} color="#7c3aed" /> Local File
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { handleImageUpload(e); setShowAddMenu(false); }} />
                              </label>
                              <div style={{ height: '1px', background: 'var(--glass-border)' }} />
                              <button
                                onClick={openStudioPicker}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <Sparkles size={13} color="#7c3aed" /> From Studio
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Crop */}
                    <button
                      title="Crop image"
                      onClick={() => setIsCropping(v => !v)}
                      className={isCropping ? 'btn-secondary' : 'btn-ghost'}
                      style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Crop size={12} /> {isCropping ? 'Cropping…' : 'Crop'}
                    </button>

                    {/* AI Captions */}
                    <button
                      onClick={handleGenerateCaptions}
                      disabled={isAnalyzing}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      {isAnalyzing ? <><Loader2 size={11} className="spin-slow" /> Analyzing…</> : <><Sparkles size={11} /> Write Captions</>}
                    </button>


                    {companyLogo && (
                      <button
                        title={showLogo ? 'Hide logo' : 'Show logo'}
                        onClick={() => setShowLogo(v => !v)}
                        className="btn-ghost"
                        style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', color: showLogo ? '#a78bfa' : 'var(--text-muted)' }}
                      >
                        {showLogo ? <Eye size={12} /> : <EyeOff size={12} />} Logo
                      </button>
                    )}

                    {/* Clear image */}
                    <button
                      onClick={async () => {
                        setImages([]); setActiveImageIdx(0); setLogoScaleMap({}); setLogoPosMap({});
                        try {
                          const activeId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
                          const key = `creative_studio_selected_images_${activeId}`;
                          await saveToImageDB(key, []);
                          sessionStorage.setItem(key, JSON.stringify([]));
                        } catch { /* best effort */ }
                      }}
                      className="btn-ghost"
                      style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', color: '#f87171' }}
                    >
                      <X size={12} /> Clear
                    </button>
                  </div>
                )}
              </div>


              {/* Image strip — multi image thumbnails */}
              {images.length > 1 && (
                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      Carousel ({images.length} images)
                    </div>
                    <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 600 }}>
                      Logo positioned per-image
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                    {images.map((img, i) => {
                      const hasCustomLogo = logoScaleMap[i] !== undefined || logoPosMap[i] !== undefined;
                      return (
                      <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                          onClick={() => setActiveImageIdx(i)}
                          style={{ width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden', border: `2px solid ${i === activeImageIdx ? '#7c3aed' : 'rgba(124,58,237,0.15)'}`, cursor: 'pointer', transition: 'border-color 0.2s', boxShadow: i === activeImageIdx ? '0 0 0 3px rgba(124,58,237,0.25)' : 'none' }}
                        >
                          <img src={img} alt={`img${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        {/* Logo customized indicator */}
                        {companyLogo && showLogo && (
                          <div style={{
                            position: 'absolute', bottom: 3, left: 3,
                            width: 16, height: 16, borderRadius: '4px',
                            background: hasCustomLogo ? 'rgba(124,58,237,0.9)' : 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '8px', color: 'white', fontWeight: 700,
                          }} title={hasCustomLogo ? 'Custom logo position set' : 'Default logo position'}>
                            L
                          </div>
                        )}
                        {/* Image index badge */}
                        <div style={{
                          position: 'absolute', bottom: 3, right: -4,
                          width: 16, height: 16, borderRadius: '50%',
                          background: i === activeImageIdx ? '#7c3aed' : 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '9px', color: 'white', fontWeight: 700,
                        }}>
                          {i + 1}
                        </div>
                        <button
                          onClick={() => handleRemoveImage(i)}
                          style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                        >
                          <X size={9} />
                        </button>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Aspect ratio pills */}
              {activeImage && (
                <div className="glass-card" style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Platform Fit</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {platforms.map(p => {
                      const Icon = p.icon;
                      return (
                        <div key={p.id} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
                          <Icon size={13} color={p.color} style={{ marginBottom: '3px' }} />
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>{p.aspectRatio}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>

            {/* ══════════════════════ RIGHT — Caption Editor ════════════════════ */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Platform tabs */}
              <div className="glass-card" style={{ padding: '6px', display: 'flex', gap: '4px' }}>
                {platforms.map(p => {
                  const Icon = p.icon;
                  const s = platformStatuses[p.id];
                  const isActive = activePlatform === p.id;
                  return (
                    <button
                      key={p.id}
                      id={`tab-${p.id}`}
                      onClick={() => setActivePlatform(p.id)}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: isActive ? `rgba(${p.id === 'facebook' ? '24,119,242' : p.id === 'instagram' ? '225,48,108' : p.id === 'x' ? '255,255,255' : '10,102,194'},0.12)` : 'transparent',
                        transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', position: 'relative',
                        boxShadow: isActive ? `inset 0 -2px 0 ${p.color}` : 'none',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      <Icon size={16} color={isActive ? p.color : 'var(--text-secondary)'} style={{ opacity: enabledPlatforms[p.id] ? 1 : 0.35 }} />
                      <span style={{ fontSize: '10px', fontWeight: 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', opacity: enabledPlatforms[p.id] ? 1 : 0.35 }}>
                        {p.label.split(' ')[0]}
                      </span>
                      {!enabledPlatforms[p.id] && (
                        <span style={{ position: 'absolute', top: 5, right: 5, fontSize: '8px', color: 'var(--text-muted)', fontWeight: 700, background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: '4px' }}>SKIP</span>
                      )}
                      {s.status !== 'idle' && (
                        <span style={{ position: 'absolute', top: 5, left: 5 }}>{statusIcon(s.status)}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Caption editor card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePlatform}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="glass-card"
                  style={{ padding: '20px' }}
                >
                  {/* Card header */}
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
                      {/* Skip toggle */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', background: 'var(--input-bg)', padding: '6px 12px', borderRadius: '9px', border: '1px solid var(--input-border)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: enabledPlatforms[activePlatform] ? '#a78bfa' : 'var(--text-secondary)' }}>
                          {enabledPlatforms[activePlatform] ? 'Post' : 'Skip'}
                        </span>
                        <div
                          style={{ width: '34px', height: '18px', background: enabledPlatforms[activePlatform] ? '#7c3aed' : 'var(--bg-secondary)', borderRadius: '9px', position: 'relative', transition: '0.25s', cursor: 'pointer', flexShrink: 0 }}
                          onClick={e => { e.preventDefault(); setEnabledPlatforms(prev => ({ ...prev, [activePlatform]: !prev[activePlatform] })); }}
                        >
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

                  {/* Textarea */}
                  <textarea
                    id={`caption-${activePlatform}`}
                    className="input-field"
                    value={caption}
                    onChange={e => setCaptions(prev => ({ ...prev, [activePlatform]: e.target.value }))}
                    placeholder={`Write your ${platform.label} caption here, or click Regenerate to let AI draft one for you…`}
                    style={{ minHeight: '200px', fontSize: '13px', lineHeight: '1.75', resize: 'vertical' }}
                  />

                  {/* Footer stats */}
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Hash size={10} /> {(caption.match(/#\w+/g) || []).length} / {platform.maxHashtags} hashtags
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AtSign size={10} /> {(caption.match(/@\w+/g) || []).length} mentions
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '90px', height: '4px', background: 'rgba(124,58,237,0.12)', borderRadius: '2px' }}>
                        <div style={{ width: `${charPct}%`, height: '100%', background: charPct > 90 ? '#ef4444' : 'linear-gradient(to right,#7c3aed,#06b6d4)', borderRadius: '2px', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: charPct > 90 ? '#f87171' : 'var(--text-muted)', fontWeight: 600 }}>
                        {charCount.toLocaleString()} / {platform.charLimit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Schedule */}
              <div className="glass-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={16} color="#7c3aed" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Schedule for Later</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>Best times: 9 AM, 12 PM, 6 PM IST</div>
                    </div>
                  </div>
                  <input type="datetime-local" className="input-field" style={{ width: '200px', fontSize: '12px', padding: '8px 12px' }} />
                </div>
              </div>

              {/* Publish button */}
              <motion.button
                id="publish-everywhere-btn"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '15px', fontWeight: 700, borderRadius: '14px' }}
                onClick={handlePublishAll}
                disabled={isPublishingAll}
                whileTap={{ scale: 0.98 }}
                whileHover={{ boxShadow: '0 8px 40px rgba(124,58,237,0.5)' }}
              >
                {isPublishingAll ? (
                  <>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      {[0,1,2,3,4].map(i => <div key={i} className="wave-bar" style={{ animationDelay: `${i*0.1}s`, height: '14px' }} />)}
                    </div>
                    Publishing to all platforms…
                  </>
                ) : publishDone ? (
                  <><RefreshCw size={16} /> Publish Again</>
                ) : (
                  <><Send size={16} /> <Zap size={14} /> Publish Everywhere</>
                )}
              </motion.button>

              {/* Publish status */}
              <AnimatePresence>
                {(isPublishingAll || publishDone) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card"
                    style={{ overflow: 'hidden', padding: '16px 20px' }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Globe size={12} color="#7c3aed" /> Publish Summary
                    </div>
                    {platforms.map(p => {
                      if (!enabledPlatforms[p.id]) return null;
                      const Icon = p.icon;
                      const s = platformStatuses[p.id];
                      return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon size={14} color={p.color} />
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{p.label}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {statusIcon(s.status)}
                            <span style={{ fontSize: '11px', color: s.status === 'success' ? '#34d399' : s.status === 'error' ? '#f87171' : s.status === 'publishing' ? '#fbbf24' : '#475569' }}>
                              {s.status === 'idle' ? 'Queued' : s.status === 'publishing' ? 'Publishing…' : s.message}
                            </span>
                          </div>
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

    {/* ══════════════════ STUDIO PICKER MODAL ══════════════════ */}
    <AnimatePresence>
      {showStudioPicker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setShowStudioPicker(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4,0,0.2,1] }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '720px', maxWidth: '95vw', maxHeight: '80vh',
              background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
              borderRadius: '20px', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#7c3aed" /> Studio Gallery
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Click an image to toggle it in your editor ({images.length}/5 selected)
                </div>
              </div>
              <button
                onClick={() => setShowStudioPicker(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal body — image grid */}
            <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
              {studioImages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <ImageIcon size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <div style={{ fontSize: '14px' }}>No images in your Studio yet.</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Generate images in the AI Studio first.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {studioImages.map(si => {
                    const alreadyAdded = images.includes(si.url);
                    return (
                      <motion.div
                        key={si.id}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => {
                          if (alreadyAdded) {
                            const idx = images.indexOf(si.url);
                            if (idx !== -1) handleRemoveImage(idx);
                          } else {
                            if (images.length >= 5) return;
                            setImages(prev => [...prev, si.url]);
                          }
                        }}
                        style={{
                          position: 'relative', borderRadius: '12px', overflow: 'hidden',
                          aspectRatio: '1/1', cursor: 'pointer',
                          border: alreadyAdded ? '2px solid #7c3aed' : '2px solid transparent',
                          opacity: alreadyAdded ? 0.6 : 1,
                        }}
                      >
                        <img src={si.url} alt="studio" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {alreadyAdded && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(124,58,237,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={20} color="white" strokeWidth={3} />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
