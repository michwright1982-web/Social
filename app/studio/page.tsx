'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  Upload, Wand2, Sparkles, ChevronDown, Zap, RefreshCw,
  Check, Maximize2, RotateCcw, Image as ImageIcon, X,
  Sliders, Globe, Languages, ArrowRight, Loader2, AlertCircle, Trash2, Send
} from 'lucide-react';
import Link from 'next/link';

// Dynamic models will be fetched from the backend.

const STYLES = ['Photorealistic', 'Cinematic', 'Editorial', 'Minimalist', 'Bold & Vibrant', 'Luxury'];

type GenerationState = 'idle' | 'generating' | 'done';

export type GeneratedImage = {
  id: string;
  url: string;
  timestamp: number;
};

// Placeholder generated images — replace with real AI output in production
const GENERATED_IMAGES: string[] = [];

export default function StudioPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('OpenAI');
  const [selectedModel, setSelectedModel] = useState('gpt-image-1');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [numVariations, setNumVariations] = useState(2);
  const [state, setState] = useState<GenerationState>('idle');
  const [progress, setProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);

  useEffect(() => {
    // Load history on mount
    const historyData = localStorage.getItem('creative_studio_history');
    if (historyData) {
      try {
        setGeneratedImages(JSON.parse(historyData));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        const { providers, models } = data;
        setAvailableProviders(providers || []);
        setAiModels(models || []);
        
        if (providers && providers.length > 0) {
          setSelectedProvider(providers[0]);
          const firstModel = models?.find((m: any) => m.provider === providers[0]);
          if (firstModel) setSelectedModel(firstModel.id);
        }
        setIsLoadingKeys(false);
      })
      .catch(() => setIsLoadingKeys(false));
  }, []);

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    const firstModel = aiModels.find(m => m.provider === provider);
    if (firstModel) setSelectedModel(firstModel.id);
  };

  const filteredModels = aiModels.filter(m => m.provider === selectedProvider);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setUploadedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setState('generating');
    setProgress(0);
    setSelectedVariations([]);
    setErrorMsg(null);
    // Remove setGeneratedImages([]) so we retain history

    // Start a fake progress bar while the request runs
    const interval = setInterval(() => {
      setProgress(p => (p >= 90 ? 90 : p + Math.random() * 8));
    }, 400);

    try {
      const selectedModelObj = aiModels.find(m => m.id === selectedModel);
      const provider = selectedModelObj?.provider || selectedProvider;

      // We ask for multiple variations visually, but some APIs (like DALL-E) cost a lot per image.
      // For now, we will generate 1 real image and duplicate it for the demo variations 
      // if the API only returns 1, to match the UI behavior without breaking the bank.
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider, model: selectedModel, style: selectedStyle, ratio: aspectRatio, variations: numVariations })
      });

      const data = await res.json();
      clearInterval(interval);
      setProgress(100);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate');
      }

      // If we got images, populate the array
      if (data.images && data.images.length > 0) {
        // Pad the array to match numVariations for UI purposes
        const rawImages = Array.from({ length: numVariations }).map((_, i) => data.images[i % data.images.length]);
        
        // Convert to history objects
        const timestamp = Date.now();
        const newHistoryItems: GeneratedImage[] = rawImages.map((url: string, index: number) => ({
          id: `img-${timestamp}-${index}`,
          url,
          timestamp: timestamp + index, // slightly offset to keep unique
        }));

        setGeneratedImages(prev => {
          const updated = [...newHistoryItems, ...prev].slice(0, 20);
          localStorage.setItem('creative_studio_history', JSON.stringify(updated));
          return updated;
        });
        
        setTimeout(() => {
          galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      
      setState('done');
    } catch (err: any) {
      clearInterval(interval);
      setState('idle');
      setErrorMsg(err.message);
    }
  };

  const handleReset = () => {
    setState('idle');
    setProgress(0);
    setSelectedVariations([]);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratedImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      localStorage.setItem('creative_studio_history', JSON.stringify(updated));
      return updated;
    });
    setSelectedVariations(prev => prev.filter(vid => vid !== id));
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Creative Studio" subtitle="AI-powered image generation & variation" />
        <div className="page-content" style={{ paddingBottom: '290px', position: 'relative' }}>
          
          {/* Floating Error Message */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                style={{
                  position: 'fixed',
                  bottom: '215px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 110,
                  width: '420px',
                }}
              >
                <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.95)', border: '1px solid rgba(239, 68, 68, 0.3)', backdropFilter: 'blur(20px)', borderRadius: '14px', color: '#fef2f2', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '10px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)' }}>
                  <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1, lineHeight: '1.4' }}>{errorMsg}</div>
                  <button onClick={() => setErrorMsg(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Gallery Area — Takes full width now */}
          <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {state === 'idle' && generatedImages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '480px', textAlign: 'center' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'conic-gradient(from 0deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3), rgba(124,58,237,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}
                  >
                    <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={28} color="#7c3aed" />
                    </div>
                  </motion.div>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0', fontFamily: "'Outfit', sans-serif" }}>Ready to Create</h2>
                  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px', maxWidth: '340px', lineHeight: 1.6 }}>
                    Upload a reference design, craft your prompt, and let AI generate stunning variations tailored to your campaign.
                  </p>
                </div>
              )}

              {(generatedImages.length > 0 || state !== 'idle') && (
                <div ref={galleryRef} style={{ scrollMarginTop: '100px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>
                        Creative History
                        {state === 'done' && (
                          <span className="badge badge-green" style={{ marginLeft: '10px', fontSize: '10px', verticalAlign: 'middle' }}>
                            <Check size={9} /> Generated
                          </span>
                        )}
                      </h2>
                    </div>
                    {state === 'generating' ? (
                      <span className="badge badge-amber"><Zap size={10} /> Processing...</span>
                    ) : generatedImages.length > 0 ? (
                      <button className="btn-ghost" onClick={() => setGeneratedImages([])} style={{ fontSize: '12px', padding: '8px 14px' }}>
                        <RotateCcw size={12} /> Clear All
                      </button>
                    ) : null}
                  </div>

                  <div className="masonry-grid">
                    {state === 'generating' && Array.from({ length: numVariations }).map((_, i) => (
                      <div key={`skel-${i}`} className="masonry-item">
                        <div className="skeleton" style={{ borderRadius: '16px', height: `${220 + (i % 3) * 60}px` }} />
                      </div>
                    ))}

                    {generatedImages.map((img, i) => (
                      <motion.div
                        key={img.id}
                        className="masonry-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i < numVariations && state === 'done' ? i * 0.1 : 0, duration: 0.4 }}
                      >
                        <div
                          id={`variation-${img.id}`}
                          onClick={() => {
                            setSelectedVariations(prev => {
                              if (prev.includes(img.id)) {
                                return prev.filter(id => id !== img.id);
                              }
                              if (prev.length >= 5) {
                                return prev;
                              }
                              return [...prev, img.id];
                            });
                          }}
                          style={{
                            position: 'relative', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                            border: selectedVariations.includes(img.id) ? '2px solid #7c3aed' : '2px solid rgba(124,58,237,0.15)',
                            transition: 'all 0.3s',
                            boxShadow: selectedVariations.includes(img.id) ? '0 0 0 4px rgba(124,58,237,0.2)' : 'none',
                            height: 'auto',
                            background: 'rgba(124,58,237,0.05)',
                          }}
                        >
                          <img src={img.url} alt={`Generated item`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(124,58,237,0.2)', opacity: selectedVariations.includes(img.id) ? 1 : 0, transition: '0.3s', pointerEvents: 'none' }} />
                          
                          <button 
                            onClick={(e) => handleDelete(img.id, e)}
                            className="hover-action-btn"
                            style={{ position: 'absolute', top: '10px', right: '10px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>

                          {selectedVariations.includes(img.id) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              style={{
                                position: 'absolute', top: '10px', left: '10px',
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <Check size={14} color="white" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {selectedVariations.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        style={{ position: 'fixed', bottom: '210px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}
                      >
                        <div className="glass-card" style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', background: 'rgba(15,22,36,0.95)', border: '1px solid rgba(124,58,237,0.3)', backdropFilter: 'blur(20px)' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={16} color="#7c3aed" />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{selectedVariations.length} image{selectedVariations.length > 1 ? 's' : ''} selected</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Ready to generate captions & publish</div>
                          </div>
                          <div>
                            <button
                              className="btn-primary"
                              disabled={selectedVariations.length === 0}
                              onClick={() => {
                                const selectedUrls = selectedVariations
                                  .map(id => generatedImages.find(img => img.id === id)?.url)
                                  .filter(Boolean) as string[];
                                if (selectedUrls.length > 0) {
                                  localStorage.setItem('creative_studio_selected_images', JSON.stringify(selectedUrls));
                                }
                                router.push('/editor');
                              }}
                              style={{ padding: '14px 24px', fontSize: '14px' }}
                            >
                              Generate Captions <Send size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>

          {/* STICKY BOTTOM DOCK CONTROL BAR — EVEN TALLER & SPACIOUS */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 'var(--sidebar-width)',
            right: 0,
            background: 'linear-gradient(to top, rgba(8, 10, 20, 0.98) 0%, rgba(13, 17, 30, 0.95) 100%)',
            backdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(124, 58, 237, 0.25)',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6)',
            padding: '38px 32px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
            justifyContent: 'space-between'
          }}>
            
            {/* 1. REFERENCE DESIGN (Left) — 1:1 RATIO */}
            <div style={{ width: '120px', height: '120px', flexShrink: 0 }}>
              <div
                className={`drag-zone ${isDragging ? 'active' : ''}`}
                style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', border: '1px dashed rgba(124,58,237,0.3)', borderRadius: '12px', background: 'rgba(15,22,36,0.4)' }}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input id="file-input" type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { const r = new FileReader(); r.onload = ev => setUploadedImage(ev.target?.result as string); r.readAsDataURL(file); }
                  }}
                />
                {uploadedImage ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img src={uploadedImage} alt="Reference" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                    <button
                      onClick={e => { e.stopPropagation(); setUploadedImage(null); }}
                      style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.8)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                    ><X size={12} /></button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Upload size={20} color="#7c3aed" />
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Reference</span>
                    <span style={{ fontSize: '10px', color: '#475569' }}>Drag & Drop</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. CREATIVE PROMPT (Center - Flexible) — EXACT 120px */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '120px', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <textarea
                  className="input-field"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe your campaign vision... e.g. 'Luxury watch on marble surface, cinematic lighting...'"
                  style={{ height: '80px', minHeight: '80px', resize: 'none', padding: '12px 16px', fontSize: '13px', borderRadius: '10px', width: '100%' }}
                  id="prompt-input"
                />
              </div>

              {/* Minimal horizontal scrolling style chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', height: '28px', flexShrink: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Style:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {STYLES.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedStyle(s)}
                      style={{
                        padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
                        background: selectedStyle === s ? 'rgba(124,58,237,0.2)' : 'rgba(30,41,59,0.4)',
                        border: selectedStyle === s ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(71,85,105,0.2)',
                        color: selectedStyle === s ? '#a78bfa' : '#64748b',
                        transition: 'all 0.2s',
                      }}
                    >{s}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. AI PROVIDER & MODEL (Right) — EXACT 120px */}
            <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '120px', gap: '12px' }}>
              {isLoadingKeys ? (
                <div style={{ height: '54px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', background: 'rgba(15,22,36,0.4)', borderRadius: '10px', fontSize: '13px', color: '#64748b', border: '1px solid rgba(71,85,105,0.2)' }}>
                  <Loader2 size={14} className="spin-slow" /> Loading...
                </div>
              ) : availableProviders.length === 0 ? (
                <div style={{ height: '54px', display: 'flex', alignItems: 'center', padding: '0 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', fontSize: '13px', color: '#f87171' }}>
                  No provider configured
                </div>
              ) : (
                <select 
                  className="input-field" 
                  value={selectedProvider} 
                  onChange={(e) => handleProviderChange(e.target.value)}
                  style={{ width: '100%', padding: '0 14px', fontSize: '13px', height: '54px', borderRadius: '10px' }}
                >
                  {availableProviders.map(p => (
                    <option key={p} value={p} style={{ background: '#0d1120' }}>{p}</option>
                  ))}
                </select>
              )}

              <select
                className="input-field"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ width: '100%', padding: '0 14px', fontSize: '13px', height: '54px', borderRadius: '10px' }}
                disabled={filteredModels.length === 0}
              >
                {filteredModels.length === 0 ? (
                  <option style={{ background: '#0d1120' }}>No Model Available</option>
                ) : (
                  filteredModels.map(model => (
                    <option key={model.id} value={model.id} style={{ background: '#0d1120' }}>
                      {model.label} ({model.badge})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 4. ADVANCED SETTINGS (Center Right) — EXACT 120px */}
            <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '120px', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0 14px', background: 'rgba(15,22,36,0.3)', borderRadius: '10px', border: '1px solid rgba(71,85,105,0.15)', height: '54px', justifyContent: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Variations</span>
                  <span style={{ color: '#7c3aed', fontWeight: 700 }}>{numVariations}</span>
                </label>
                <input type="range" min={2} max={8} value={numVariations} onChange={e => setNumVariations(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '6px', height: '6px', accentColor: '#7c3aed', cursor: 'pointer' }} />
              </div>

              <select
                value={aspectRatio}
                onChange={e => setAspectRatio(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '0 14px', fontSize: '13px', height: '54px', borderRadius: '10px' }}
              >
                {[
                  { val: '1:1', label: '1:1 (Square)' },
                  { val: '9:16', label: '9:16 (Stories/Reels)' },
                  { val: '16:9', label: '16:9 (Landscape)' },
                  { val: '4:5', label: '4:5 (IG Portrait)' },
                  { val: '3:4', label: '3:4 (Portrait)' }
                ].map(r => (
                  <option key={r.val} value={r.val} style={{ background: '#0d1120' }}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* 5. GENERATE BUTTON TILE (Far Right) — EXACT 120px */}
            <div style={{ width: '160px', flexShrink: 0, height: '120px', position: 'relative' }}>
              <motion.button
                className="btn-primary"
                style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', overflow: 'hidden', position: 'relative' }}
                onClick={handleGenerate}
                disabled={state === 'generating' || !prompt.trim() || availableProviders.length === 0}
                whileTap={{ scale: 0.98 }}
                id="generate-btn"
              >
                {state === 'generating' ? (
                  <>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s`, height: '12px', width: '3px' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '12px', marginTop: '4px' }}>{Math.round(Math.min(progress, 100))}%</span>
                    
                    {/* Progress overlay background fill */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(0,0,0,0.2)' }}>
                      <motion.div
                        style={{ height: '100%', background: '#fff' }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </>
                ) : state === 'done' ? (
                  <>
                    <RefreshCw size={24} />
                    <span>Refresh</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={24} />
                    <span>Generate</span>
                  </>
                )}
              </motion.button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
