'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  Upload, Wand2, Sparkles, ChevronDown, Zap, RefreshCw,
  Check, Maximize2, RotateCcw, Image as ImageIcon, X,
  Sliders, Globe, Languages, ArrowRight, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

// Dynamic models will be fetched from the backend.

const STYLES = ['Photorealistic', 'Cinematic', 'Editorial', 'Minimalist', 'Bold & Vibrant', 'Luxury'];

type GenerationState = 'idle' | 'generating' | 'done';

// Placeholder generated images — replace with real AI output in production
const GENERATED_IMAGES: string[] = [];

export default function StudioPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('OpenAI');
  const [selectedModel, setSelectedModel] = useState('dalle3');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [numVariations, setNumVariations] = useState(6);
  const [state, setState] = useState<GenerationState>('idle');
  const [progress, setProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [language, setLanguage] = useState('English');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);

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
    setSelectedVariation(null);
    setErrorMsg(null);
    setGeneratedImages([]);

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
        body: JSON.stringify({ prompt, provider, model: selectedModel, style: selectedStyle })
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
        const images = Array.from({ length: numVariations }).map((_, i) => data.images[i % data.images.length]);
        setGeneratedImages(images);
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
    setSelectedVariation(null);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Creative Studio" subtitle="AI-powered image generation & variation" />
        <div className="page-content">
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>

            {/* Left Panel — Controls */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >

              {/* Upload Zone */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Reference Design
                </label>
                <div
                  className={`drag-zone ${isDragging ? 'active' : ''}`}
                  style={{ padding: '28px', textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
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
                    <div style={{ position: 'relative' }}>
                      <img src={uploadedImage} alt="Reference" style={{ width: '100%', borderRadius: '10px', maxHeight: '160px', objectFit: 'cover' }} />
                      <button
                        onClick={e => { e.stopPropagation(); setUploadedImage(null); }}
                        style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      ><X size={12} /></button>
                      <p style={{ fontSize: '11px', color: '#7c3aed', marginTop: '8px', fontWeight: 600 }}>✓ Reference image loaded</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <Upload size={20} color="#7c3aed" />
                      </div>
                      <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>Drop your sample design here</p>
                      <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>PNG, JPG, WebP • Max 10MB</p>
                      <span className="badge badge-violet" style={{ marginTop: '10px', display: 'inline-flex' }}>
                        <ImageIcon size={9} /> Image-to-Image
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Prompt */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Creative Prompt
                </label>
                <textarea
                  className="input-field"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe your campaign vision... e.g. 'Luxury watch on marble surface, cinematic lighting, dark moody tones'"
                  style={{ minHeight: '100px' }}
                  id="prompt-input"
                />

                {/* Style chips */}
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visual Style</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {STYLES.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedStyle(s)}
                        style={{
                          padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                          cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                          background: selectedStyle === s ? 'rgba(124,58,237,0.2)' : 'rgba(30,41,59,0.6)',
                          border: selectedStyle === s ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(71,85,105,0.3)',
                          color: selectedStyle === s ? '#a78bfa' : '#64748b',
                          transition: 'all 0.2s',
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Provider & Model */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  AI Provider
                </label>
                {isLoadingKeys ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(15,22,36,0.5)', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
                    <Loader2 size={14} className="spin-slow" /> Loading providers...
                  </div>
                ) : availableProviders.length === 0 ? (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', fontSize: '12px', color: '#f87171', marginBottom: '8px' }}>
                      No AI providers configured.
                    </div>
                    <Link href="/vault" style={{ textDecoration: 'none' }}>
                      <button className="btn-secondary" style={{ width: '100%', fontSize: '12px', padding: '8px' }}>
                        Go to Vault to configure
                      </button>
                    </Link>
                  </div>
                ) : (
                  <select 
                    className="input-field" 
                    value={selectedProvider} 
                    onChange={(e) => handleProviderChange(e.target.value)}
                    style={{ width: '100%', marginBottom: '16px', padding: '10px 14px', fontSize: '13px' }}
                  >
                    {availableProviders.map(p => (
                      <option key={p} value={p} style={{ background: '#0d1120' }}>{p}</option>
                    ))}
                  </select>
                )}

                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  AI Model
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredModels.map(model => (
                    <div
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      style={{
                        padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                        background: selectedModel === model.id ? 'rgba(124,58,237,0.12)' : 'rgba(15,22,36,0.5)',
                        border: selectedModel === model.id ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(71,85,105,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: selectedModel === model.id ? '#a78bfa' : '#94a3b8' }}>{model.label}</div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>{model.provider}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-violet" style={{ fontSize: '9px' }}>{model.badge}</span>
                        {selectedModel === model.id && <Check size={14} color="#7c3aed" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{ width: '100%', padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sliders size={14} /> Advanced Settings</div>
                  <ChevronDown size={14} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                </button>
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(124,58,237,0.1)' }}>
                        <div style={{ marginTop: '16px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span><Globe size={10} style={{ display: 'inline', marginRight: '4px' }} /> Variations</span>
                            <span style={{ color: '#7c3aed', fontWeight: 700 }}>{numVariations}</span>
                          </label>
                          <input type="range" min={2} max={8} value={numVariations} onChange={e => setNumVariations(Number(e.target.value))}
                            style={{ width: '100%', marginTop: '8px', accentColor: '#7c3aed' }} />
                        </div>
                        <div style={{ marginTop: '14px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Languages size={10} /> Caption Language
                          </label>
                          <select
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            className="input-field"
                            style={{ padding: '9px 12px', fontSize: '12px' }}
                          >
                            {['English', 'English + Hindi', 'English + Tamil', 'English + Arabic', 'Bilingual Auto'].map(l => (
                              <option key={l} value={l} style={{ background: '#0d1120' }}>{l}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#f87171', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <X size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>{errorMsg}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate Button */}
              <motion.button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
                onClick={handleGenerate}
                disabled={state === 'generating' || !prompt.trim() || availableProviders.length === 0}
                whileTap={{ scale: 0.98 }}
                id="generate-btn"
              >
                {state === 'generating' ? (
                  <>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                    Generating... {Math.round(Math.min(progress, 100))}%
                  </>
                ) : state === 'done' ? (
                  <><RefreshCw size={16} /> Generate More</>
                ) : (
                  <><Wand2 size={16} /> Generate {numVariations} Variations</>
                )}
              </motion.button>

              {/* Progress bar */}
              {state === 'generating' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '-8px' }}>
                  <div style={{ height: '3px', background: 'rgba(124,58,237,0.15)', borderRadius: '2px' }}>
                    <motion.div
                      style={{ height: '100%', background: 'linear-gradient(to right, #7c3aed, #06b6d4)', borderRadius: '2px' }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p style={{ fontSize: '11px', color: '#7c3aed', textAlign: 'center', marginTop: '6px' }}>
                    <Zap size={9} style={{ display: 'inline', marginRight: '3px' }} />
                    AI is crafting your variations...
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Right Panel — Gallery */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {state === 'idle' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px', textAlign: 'center' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'conic-gradient(from 0deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3), rgba(124,58,237,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}
                  >
                    <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={28} color="#7c3aed" />
                    </div>
                  </motion.div>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0', fontFamily: "'Outfit', sans-serif" }}>Ready to Create</h2>
                  <p style={{ fontSize: '14px', color: '#475569', marginTop: '8px', maxWidth: '320px', lineHeight: 1.6 }}>
                    Upload a reference design, craft your prompt, and let AI generate stunning variations tailored to your campaign.
                  </p>
                </div>
              )}

              {state === 'generating' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>Generating Variations</h2>
                    <span className="badge badge-amber"><Zap size={10} /> Processing</span>
                  </div>
                  <div className="masonry-grid">
                    {Array.from({ length: numVariations }).map((_, i) => (
                      <div key={i} className="masonry-item">
                        <div className="skeleton" style={{ borderRadius: '16px', height: `${220 + (i % 3) * 60}px` }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {state === 'done' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>
                        {numVariations} Variations Generated
                        <span className="badge badge-green" style={{ marginLeft: '10px', fontSize: '10px', verticalAlign: 'middle' }}>
                          <Check size={9} /> Done
                        </span>
                      </h2>
                    </div>
                    <button className="btn-ghost" onClick={handleReset} style={{ fontSize: '12px', padding: '8px 14px' }}>
                      <RotateCcw size={12} /> Regenerate
                    </button>
                  </div>

                  {/* Empty variation slots */}
                  <div className="masonry-grid">
                    {Array.from({ length: numVariations }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="masonry-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                      >
                        <div
                          id={`variation-${i}`}
                          onClick={() => setSelectedVariation(i === selectedVariation ? null : i)}
                          style={{
                            position: 'relative', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                            border: selectedVariation === i ? '2px solid #7c3aed' : '2px solid rgba(124,58,237,0.15)',
                            transition: 'all 0.3s',
                            boxShadow: selectedVariation === i ? '0 0 0 4px rgba(124,58,237,0.2)' : 'none',
                            height: `${220 + (i % 3) * 60}px`,
                            background: 'rgba(124,58,237,0.05)',
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={generatedImages[i]} alt={`Variation ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)', opacity: selectedVariation === i ? 1 : 0.6, transition: '0.3s' }} />
                          <span className="badge badge-violet" style={{ fontSize: '9px', position: 'absolute', bottom: '10px', left: '10px' }}>V{i + 1}</span>

                          {selectedVariation === i && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              style={{
                                position: 'absolute', top: '10px', right: '10px',
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

                  {/* CTA */}
                  <AnimatePresence>
                    {selectedVariation !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}
                      >
                        <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={16} color="#7c3aed" />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>Variation {selectedVariation + 1} selected</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Ready to generate captions & publish</div>
                          </div>
                          <Link href="/editor" style={{ textDecoration: 'none' }}>
                            <button className="btn-primary" style={{ fontSize: '13px', padding: '10px 18px' }} id="proceed-to-editor">
                              <Sparkles size={14} /> Generate Captions <ArrowRight size={14} />
                            </button>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
