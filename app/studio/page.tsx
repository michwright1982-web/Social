'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  Upload, Wand2, Sparkles, Zap, RefreshCw,
  Check, RotateCcw, Image as ImageIcon, X,
  Sliders, Loader2, AlertCircle, Trash2, Send
} from 'lucide-react';
import { saveToImageDB, loadFromImageDB } from '@/lib/image-db';

// Dynamic models will be fetched from the backend.

interface StyleOption {
  id: string;
  name: string;
  description: string;
  sampleImage: string;
  rules: string;
}

const STYLES: StyleOption[] = [
  {
    id: 'glassmorphism',
    name: 'Glassmorphism & Cyber-Premium',
    description: 'Layered frosted glass panels over vibrant neon gradients. Futuristic & highly polished, perfect for tech or premium brands.',
    sampleImage: '/styles/glassmorphism.png',
    rules: `* Visual Elements: Layered, translucent frosted glass cards or panels. Ensure a visible background blur (bokeh) behind the glass elements. Include glowing UI elements, subtle glowing data lines, or abstract geometric shapes floating in the background.
* Color Palette: Dark mode aesthetic (deep charcoal, obsidian, or midnight blue) heavily contrasted with vivid neon gradients (cyan to purple, or electric pink to orange) in the blurred background.
* Lighting & Texture: Apply a subtle white inner border (1px) to the glass panels to catch the light. Lighting must be sleek, cinematic, and originate from the glowing background elements.
* Composition & Layout: Center the primary glass panel. Maintain extreme structural alignment. Leave the top 20% and bottom 20% of the glass panel empty for text insertion.`
  },
  {
    id: 'isometric',
    name: '3D Isometric Ecosystem',
    description: 'Fixed 45-degree top-down perspective diorama. Ideal for complex workflows, business solutions, and process maps.',
    sampleImage: '/styles/isometric.png',
    rules: `* Visual Elements: Render the scene strictly in a 3D isometric projection (orthographic camera, no converging perspective lines). Build the scene as a floating "island" or a diorama containing miniature buildings, devices, or abstract system blocks.
* Color Palette: Use an analogous color scheme (colors next to each other on the wheel) with one bright complementary accent color to highlight the most important object.
* Lighting & Texture: Soft ambient occlusion. Use smooth, matte textures (like matte plastic or vinyl) with clean, diffused studio lighting. Eliminate harsh, jagged shadows.
* Composition & Layout: Place the primary isometric structure dead center, floating in a void of negative space. The background must be a solid, soft color.`
  },
  {
    id: 'chaos_maximalism',
    name: 'Chaos Maximalism & Collage',
    description: 'Loud, energetic mixed-media scrapbook style. Great for food & beverage, events, and bold promotions.',
    sampleImage: '/styles/chaos_maximalism.png',
    rules: `* Visual Elements: Combine mixed-media elements: halftone dot patterns, torn paper edges, masking tape strips, doodle overlays, and pop-art cutouts. Subjects should have thick, irregular white sticker borders around them.
* Color Palette: Hyper-saturated, clashing primary and secondary colors (bright yellow, magenta, electric blue). Flat, punchy colors only.
* Lighting & Texture: Mimic physical textures like crumpled paper, grainy film, and risograph print misalignments. Lighting should feel like a direct, harsh camera flash.
* Composition & Layout: Asymmetrical and dynamic. Overlap elements heavily. Angle objects and text diagonally. Controlled clutter around the edges, leaving the center clear for the subject.`
  },
  {
    id: 'neo_minimalist',
    name: 'Neo-Minimalist Editorial',
    description: 'High-end luxury magazine layout with vast empty spaces and stark shadows. Perfect for corporate and premium items.',
    sampleImage: '/styles/neo_minimalist.png',
    rules: `* Visual Elements: A single, isolated, high-definition subject (a product, an executive, or a stark geometric shape). Zero background clutter. No decorative icons, arrows, or flourishes.
* Color Palette: Monochromatic or strictly limited to two neutral colors (cream, slate, espresso, or stark black/white) paired with exactly one rich accent color (forest green, terracotta).
* Lighting & Texture: Cinematic, moody, highly controlled lighting. Use deep, dramatic shadows on the subject. Add a very subtle, sophisticated 35mm film grain over the entire image.
* Composition & Layout: Apply the rule of thirds aggressively. Push the subject entirely to the far right or bottom corner. Force 70-80% of the canvas to be pure negative space.`
  },
  {
    id: 'claymorphism',
    name: 'Tactile Claymorphism',
    description: 'Approachable 3D pillowy clay aesthetic. Bouncy, friendly, and highly engaging for modern app marketing and B2C campaigns.',
    sampleImage: '/styles/claymorphism.png',
    rules: `* Visual Elements: All objects, characters, and UI elements must be 3D with extremely rounded corners. Zero sharp edges. Elements should look inflated, pillowy, and soft.
* Color Palette: Bright pastel palettes (mint green, baby blue, soft peach, lilac) with low contrast between foreground and background colors.
* Lighting & Texture: Smooth, non-reflective plasticine or clay textures. Dual-lighting: warm soft primary light from top left, cool rim light from bottom right to give bubbly volume.
* Composition & Layout: Floating or bouncing elements in mid-air. Soft, blurry drop shadows beneath objects to establish depth against a solid pastel background.`
  }
];

type GenerationState = 'idle' | 'generating' | 'done';

export type GeneratedImage = {
  id: string;
  url: string;
  timestamp: number;
  prompt?: string;
};

export interface AiModel {
  id: string;
  provider: string;
  label: string;
  badge: string;
}



export default function StudioPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('OpenAI');
  const [selectedModel, setSelectedModel] = useState('gpt-image-1');
  const [selectedStyle, setSelectedStyle] = useState('glassmorphism');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [numVariations, setNumVariations] = useState(1);
  const [state, setState] = useState<GenerationState>('idle');
  const [progress, setProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<string[]>([]);
  const [persistedSelectedUrls, setPersistedSelectedUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [aiModels, setAiModels] = useState<AiModel[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [animateHistoryEntrance, setAnimateHistoryEntrance] = useState(false);
  const [openAiSize, setOpenAiSize] = useState('auto');
  const [openAiQuality, setOpenAiQuality] = useState('auto');

  const loadHistory = useCallback(async () => {
    const activeId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
    
    // Check if we need to migrate existing localStorage data to IndexedDB
    let dbHistory = await loadFromImageDB(`creative_studio_history_${activeId}`);
    if (!dbHistory) {
      const oldHistory = localStorage.getItem(`creative_studio_history_${activeId}`) || localStorage.getItem('creative_studio_history');
      if (oldHistory) {
        try {
          dbHistory = JSON.parse(oldHistory);
          await saveToImageDB(`creative_studio_history_${activeId}`, dbHistory);
          localStorage.removeItem(`creative_studio_history_${activeId}`);
          localStorage.removeItem('creative_studio_history');
        } catch {
          dbHistory = [];
        }
      } else {
        dbHistory = [];
      }
    }
    
    // Sanitize and deduplicate history items to ensure unique IDs and valid object format
    const sanitizedHistory: GeneratedImage[] = [];
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();

    if (Array.isArray(dbHistory)) {
      dbHistory.forEach((img: unknown, index: number) => {
        let sanitized: GeneratedImage | null = null;
        if (typeof img === 'string') {
          sanitized = {
            id: `img-legacy-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
            url: img,
            timestamp: Date.now() - index * 1000,
          };
        } else if (img && typeof img === 'object') {
          const imgObj = img as { id?: string; url?: string; timestamp?: number; prompt?: string };
          if (imgObj.url) {
            sanitized = {
              id: imgObj.id || `img-legacy-${imgObj.timestamp || Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
              url: imgObj.url,
              timestamp: imgObj.timestamp || (Date.now() - index * 1000),
              prompt: imgObj.prompt,
            };
          }
        }

        if (sanitized && !seenIds.has(sanitized.id) && !seenUrls.has(sanitized.url)) {
          seenIds.add(sanitized.id);
          seenUrls.add(sanitized.url);
          sanitizedHistory.push(sanitized);
        }
      });
    }
    
    setGeneratedImages(sanitizedHistory);

    // Save sanitized history back to DB if it has been updated
    if (dbHistory && dbHistory.length !== sanitizedHistory.length) {
      saveToImageDB(`creative_studio_history_${activeId}`, sanitizedHistory).catch(e => console.warn(e));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
    window.addEventListener('brand-updated', loadHistory);
    return () => window.removeEventListener('brand-updated', loadHistory);
  }, [loadHistory]);

  const restoreSelection = async () => {
    const activeId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
    const savedUrls = await loadFromImageDB(`creative_studio_selected_images_${activeId}`);
    if (Array.isArray(savedUrls) && savedUrls.length > 0) {
      setPersistedSelectedUrls(savedUrls);
    } else {
      setPersistedSelectedUrls([]);
    }
  };

  const loadModels = () => {
    const companyId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
    setIsLoadingKeys(true);
    fetch(`/api/models?companyId=${companyId}`)
      .then(res => res.json())
      .then(data => {
        const { providers, models } = data;
        setAvailableProviders(providers || []);
        setAiModels(models || []);
        
        if (providers && providers.length > 0) {
          setSelectedProvider(providers[0]);
          const firstModel = models?.find((m: { provider: string; id: string }) => m.provider === providers[0]);
          if (firstModel) setSelectedModel(firstModel.id);
        } else {
          setSelectedProvider('none');
        }
        setIsLoadingKeys(false);
      })
      .catch(() => setIsLoadingKeys(false));
  };

  // Run on mount and when brand updates
  useEffect(() => {
    restoreSelection();
    loadModels();
    const handleUpdate = () => { restoreSelection(); loadModels(); };
    window.addEventListener('brand-updated', handleUpdate);
    return () => window.removeEventListener('brand-updated', handleUpdate);
  }, []);

  // Close AI rules modal on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveTooltip(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
    // Do NOT clear selectedVariations so existing selections survive new generations
    setErrorMsg(null);
    setAnimateHistoryEntrance(false);
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
      const selectedStyleObj = STYLES.find(s => s.id === selectedStyle);
      const currentCompanyId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          provider,
          model: selectedModel,
          style: selectedStyleObj?.name || selectedStyle,
          styleRules: selectedStyleObj?.rules || '',
          ratio: aspectRatio,
          variations: numVariations,
          openAiSize,
          openAiQuality,
          companyId: currentCompanyId
        })
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
          prompt: prompt, // save the prompt used for generation
        }));

        const updatedHistory = [...newHistoryItems, ...generatedImages].slice(0, 30); // 30 items max in history
        setGeneratedImages(updatedHistory);
        
        try {
          const currentCompanyId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
          saveToImageDB(`creative_studio_history_${currentCompanyId}`, updatedHistory).catch(e => console.warn('DB save failed', e));
        } catch (e) {
          console.warn('Failed to save to image DB', e);
        }
        
        setTimeout(() => {
          galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      
      setState('done');
      setAnimateHistoryEntrance(true);
      setTimeout(() => {
        setAnimateHistoryEntrance(false);
      }, 2000);
    } catch (err: unknown) {
      clearInterval(interval);
      setState('idle');
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };


  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratedImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      const currentCompanyId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
      saveToImageDB(`creative_studio_history_${currentCompanyId}`, updated).catch(e => console.warn('DB delete save failed', e));
      return updated;
    });
    setSelectedVariations(prev => prev.filter(vid => vid !== id));
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Creative Studio" subtitle="AI-powered image generation & variation" />
        <div className="page-content" style={{ paddingBottom: '160px', position: 'relative' }}>
          
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
            
            {/* Art Style Studio Section */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Outfit', sans-serif" }}>
                  <Sparkles size={18} color="#7c3aed" /> Art Style Studio
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Select a premium, high-converting visual style to instantly inject optimized AI rendering rules into your poster.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                {STYLES.map(style => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      style={{
                        background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'var(--input-bg)',
                        border: isSelected ? '2px solid #7c3aed' : '1px solid var(--input-border)',
                        borderRadius: '16px',
                        padding: '12px',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: isSelected ? '0 10px 25px -5px rgba(124, 58, 237, 0.25)' : 'none',
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.border = '1px solid rgba(124, 58, 237, 0.4)';
                          e.currentTarget.style.background = 'var(--input-bg)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.border = '1px solid var(--input-border)';
                          e.currentTarget.style.background = 'var(--input-bg)';
                        }
                      }}
                    >
                      {/* Preview Thumbnail */}
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-primary)' }}>
                        <img
                          src={style.sampleImage}
                          alt={style.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: isSelected ? 'scale(1.05)' : 'scale(1)' }}
                        />
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', width: '22px', height: '22px', borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', zIndex: 2 }}>
                            <Check size={12} color="white" strokeWidth={3} />
                          </div>
                        )}
                        
                        {/* Rules Info Trigger (Tooltip style) */}
                        <div 
                          title="View strict AI rules"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltip(activeTooltip === style.id ? null : style.id);
                          }}
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--glass-border)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 3,
                            color: 'var(--text-muted)',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--input-bg)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--input-bg)'; }}
                        >
                          <Sliders size={11} />
                        </div>
                      </div>

                      {/* Style Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <h3 style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#a78bfa' : 'var(--text-primary)', transition: 'color 0.2s' }}>{style.name}</h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{style.description}</p>
                      </div>
                      
                      {/* Rules modal is rendered at the top level below */}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── AI Style Rules Modal ─────────────────────────────────────────── */}
            <AnimatePresence>
              {activeTooltip && (() => {
                const activeStyle = STYLES.find(s => s.id === activeTooltip);
                if (!activeStyle) return null;
                return (
                  <motion.div
                    key="rules-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setActiveTooltip(null)}
                    style={{
                      position: 'fixed', inset: 0, zIndex: 200,
                      background: 'rgba(4, 6, 15, 0.75)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '24px',
                    }}
                  >
                    <motion.div
                      key="rules-modal"
                      initial={{ opacity: 0, scale: 0.92, y: 24 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 24 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      onClick={e => e.stopPropagation()}
                      style={{
                        width: '100%', maxWidth: '560px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--glass-border)',
                        backdropFilter: 'blur(24px)',
                        borderRadius: '20px',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Modal Header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '20px 24px 16px',
                        borderBottom: '1px solid var(--glass-border)',
                        background: 'rgba(124, 58, 237, 0.05)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sliders size={15} color="#a78bfa" />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{activeStyle.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '1px' }}>AI Style Rules</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTooltip(null)}
                          style={{
                            width: '32px', height: '32px', borderRadius: '10px',
                            background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Modal Body */}
                      <div style={{ padding: '20px 24px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
                        <div style={{
                          fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.75',
                          whiteSpace: 'pre-wrap', fontFamily: "'Inter', sans-serif",
                        }}>
                          {activeStyle.rules}
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div style={{
                        padding: '14px 24px',
                        borderTop: '1px solid var(--glass-border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click outside or press Esc to close</span>
                        <button
                          onClick={() => setActiveTooltip(null)}
                          className="btn-secondary"
                          style={{ padding: '8px 20px', fontSize: '12px' }}
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

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
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>Ready to Create</h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '340px', lineHeight: 1.6 }}>
                    Upload a reference design, craft your prompt, and let AI generate stunning variations tailored to your campaign.
                  </p>
                </div>
              )}

              {(generatedImages.length > 0 || state !== 'idle') && (
                <div ref={galleryRef} style={{ scrollMarginTop: '100px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
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
                      <button className="btn-ghost" onClick={() => {
                          setGeneratedImages([]);
                          const currentCompanyId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
                          saveToImageDB(`creative_studio_history_${currentCompanyId}`, []).catch(e => console.warn(e));
                        }} style={{ fontSize: '12px', padding: '8px 14px' }}>
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

                    {generatedImages.map((img, i) => {
                      // An image is "selected" if its ID is in selectedVariations,
                      // OR its URL was part of the previously persisted selection from the Editor.
                      const isSelectedById = selectedVariations.includes(img.id);
                      const isSelectedByUrl = persistedSelectedUrls.includes(img.url);
                      const isSelected = isSelectedById || isSelectedByUrl;
                      return (
                      <motion.div
                        key={img.id}
                        className="masonry-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i < numVariations && animateHistoryEntrance ? i * 0.1 : 0, duration: 0.4 }}
                      >
                        <div
                          id={`variation-${img.id}`}
                          onClick={() => {
                            if (isSelectedByUrl && !isSelectedById) {
                              // Image was persisted-selected by URL; clicking deselects it from persisted set
                              setPersistedSelectedUrls(prev => prev.filter(u => u !== img.url));
                              return;
                            }
                            setSelectedVariations(prev => {
                              if (prev.includes(img.id)) {
                                return prev.filter(id => id !== img.id);
                              }
                              const totalSelected = prev.length + persistedSelectedUrls.filter(u =>
                                !generatedImages.some(gi => gi.id === img.id && gi.url === u)
                              ).length;
                              if (totalSelected >= 5) return prev;
                              return [...prev, img.id];
                            });
                          }}
                          style={{
                            position: 'relative', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                            border: isSelected ? '2px solid #7c3aed' : '2px solid rgba(124,58,237,0.15)',
                            transition: 'all 0.3s',
                            boxShadow: isSelected ? '0 0 0 4px rgba(124,58,237,0.2)' : 'none',
                            height: 'auto',
                            background: 'rgba(124,58,237,0.05)',
                          }}
                        >
                          <img src={img.url} alt={`Generated item`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(124,58,237,0.2)', opacity: isSelected ? 1 : 0, transition: '0.3s', pointerEvents: 'none' }} />
                          
                          <button 
                            onClick={(e) => handleDelete(img.id, e)}
                            className="hover-action-btn"
                            style={{ position: 'absolute', top: '10px', right: '10px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>

                          {img.prompt && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrompt(img.prompt!);
                              }}
                              className="hover-action-btn"
                              style={{ position: 'absolute', top: '10px', right: '46px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                              title="Reuse this prompt"
                            >
                              <RotateCcw size={13} />
                            </button>
                          )}

                          {isSelected && (
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
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {(() => {
                      // Merge ID-based and URL-based selections for total count
                      const idSelectedUrls = selectedVariations
                        .map(id => generatedImages.find(img => img.id === id)?.url)
                        .filter(Boolean) as string[];
                      const mergedUrls = Array.from(new Set([...persistedSelectedUrls, ...idSelectedUrls]));
                      const totalCount = mergedUrls.length;
                      return totalCount > 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          style={{ position: 'fixed', bottom: '210px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}
                        >
                          <div className="glass-card" style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ImageIcon size={16} color="#7c3aed" />
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{totalCount} image{totalCount > 1 ? 's' : ''} selected</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{totalCount > 1 ? 'Will be published as a carousel post' : 'Ready to generate captions & publish'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="btn-ghost"
                                onClick={() => {
                                  setSelectedVariations([]);
                                  setPersistedSelectedUrls([]);
                                }}
                                style={{ padding: '10px 14px', fontSize: '13px' }}
                              >
                                <X size={14} /> Clear
                              </button>
                              <button
                                className="btn-primary"
                                onClick={async () => {
                                  if (mergedUrls.length > 0) {
                                    try {
                                      const currentCompanyId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
                                      await saveToImageDB(`creative_studio_selected_images_${currentCompanyId}`, mergedUrls);
                                      sessionStorage.setItem(`creative_studio_selected_images_${currentCompanyId}`, JSON.stringify(mergedUrls));
                                    } catch (e) {
                                      console.warn('Failed to save selected images to DB, falling back to sessionStorage', e);
                                      try {
                                        const currentCompanyId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
                                        sessionStorage.setItem(`creative_studio_selected_images_${currentCompanyId}`, JSON.stringify(mergedUrls));
                                      } catch {}
                                    }
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
                      ) : null;
                    })()}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>

          {/* BOTTOM DOCK */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 'var(--sidebar-width)',
            right: 0,
            zIndex: 100,
            background: 'var(--bottom-dock-bg)',
            backdropFilter: 'blur(24px)',
            borderTop: '1px solid var(--glass-border)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
            padding: '12px 24px 16px',
          }}>
            {/* Single row: label above + control below, all same height */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>

              {/* ── 1. Reference ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, width: '148px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', lineHeight: 1 }}>Reference</span>
                <div
                  className={`drag-zone ${isDragging ? 'active' : ''}`}
                  style={{ width: '148px', height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '7px', cursor: 'pointer', position: 'relative', overflow: 'hidden', border: '1px dashed var(--input-border)', borderRadius: '12px', background: 'var(--input-bg)', flexShrink: 0, transition: 'all 0.2s' }}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input id="file-input" type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setUploadedImage(ev.target?.result as string); r.readAsDataURL(f); } }}
                  />
                  {uploadedImage ? (
                    <>
                      <img src={uploadedImage} alt="ref" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '11px', position: 'absolute', inset: 0 }} />
                      <button onClick={e => { e.stopPropagation(); setUploadedImage(null); }} style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.75)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}><X size={11} /></button>
                    </>
                  ) : (
                    <>
                      <Upload size={20} color="#7c3aed" />
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Upload Reference</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Drag & drop or click</span>
                    </>
                  )}
                </div>
              </div>

              {/* ── Divider ── */}
              <div style={{ width: '1px', height: '110px', background: 'var(--glass-border)', flexShrink: 0, alignSelf: 'flex-end' }} />

              {/* ── 2. Prompt ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', lineHeight: 1 }}>Prompt</span>
                  {/* Style chips inline */}
                  <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
                    {STYLES.map(s => (
                      <button key={s.id} onClick={() => setSelectedStyle(s.id)} style={{
                        padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap', flexShrink: 0,
                        background: selectedStyle === s.id ? 'rgba(124,58,237,0.2)' : 'var(--bg-secondary)',
                        border: selectedStyle === s.id ? '1px solid rgba(124,58,237,0.4)' : '1px solid var(--input-border)',
                        color: selectedStyle === s.id ? '#a78bfa' : 'var(--text-secondary)', transition: 'all 0.2s',
                      }}>{s.name.split(' & ')[0].split(' / ')[0]}</button>
                    ))}
                  </div>
                </div>
                <textarea
                  className="input-field"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe your campaign vision... e.g. 'Luxury watch on marble surface, cinematic lighting...'"
                  style={{ height: '110px', resize: 'none', padding: '10px 13px', fontSize: '13px', borderRadius: '10px', width: '100%', lineHeight: 1.5 }}
                  id="prompt-input"
                />
              </div>

              {/* ── Divider ── */}
              <div style={{ width: '1px', height: '110px', background: 'var(--glass-border)', flexShrink: 0, alignSelf: 'flex-end' }} />

              {/* ── 3. Provider & Model ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, width: '186px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', lineHeight: 1 }}>Provider & Model</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', height: '110px' }}>
                  {isLoadingKeys ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', background: 'var(--input-bg)', borderRadius: '9px', fontSize: '12px', color: 'var(--text-secondary)', border: '1px solid var(--input-border)' }}>
                      <Loader2 size={12} className="spin-slow" /> Loading...
                    </div>
                  ) : availableProviders.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '9px', fontSize: '11px', color: '#f87171' }}>
                      No provider — add key in Vault
                    </div>
                  ) : (
                    <select className="input-field" value={selectedProvider} onChange={e => handleProviderChange(e.target.value)}
                      style={{ flex: 1, padding: '0 10px', fontSize: '12px', borderRadius: '9px', minHeight: 0, cursor: 'pointer' }}>
                      {availableProviders.map(p => <option key={p} value={p} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{p}</option>)}
                    </select>
                  )}
                  <select className="input-field" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                    style={{ flex: 1, padding: '0 10px', fontSize: '12px', borderRadius: '9px', minHeight: 0, cursor: 'pointer' }}
                    disabled={filteredModels.length === 0}>
                    {filteredModels.length === 0
                      ? <option style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>No Model Available</option>
                      : filteredModels.map(m => <option key={m.id} value={m.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{m.label} ({m.badge})</option>)
                    }
                  </select>
                </div>
              </div>

              {/* ── Divider ── */}
              <div style={{ width: '1px', height: '110px', background: 'var(--glass-border)', flexShrink: 0, alignSelf: 'flex-end' }} />

              {/* ── 4. Settings ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, width: '174px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', lineHeight: 1 }}>Settings</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', height: '110px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 12px', background: 'var(--input-bg)', borderRadius: '9px', border: '1px solid var(--input-border)' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span>Variations</span>
                      <span style={{ color: '#7c3aed', fontWeight: 800 }}>{numVariations}</span>
                    </label>
                    <input type="range" min={1} max={8} value={numVariations} onChange={e => setNumVariations(Number(e.target.value))}
                      style={{ width: '100%', height: '4px', accentColor: '#7c3aed', cursor: 'pointer' }} />
                  </div>
                  {selectedProvider === 'OpenAI' ? (
                    <div style={{ display: 'flex', gap: '6px', flex: 1, width: '100%' }}>
                      <select value={openAiSize} onChange={e => setOpenAiSize(e.target.value)} className="input-field"
                        style={{ flex: 1, padding: '0 8px', fontSize: '11px', borderRadius: '9px', minHeight: 0, cursor: 'pointer', minWidth: 0 }}>
                        <option value="auto" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Size: Auto</option>
                        <option value="1024x1024" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Square (1024×1024)</option>
                        <option value="1024x1536" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Portrait (1024×1536)</option>
                        <option value="1536x1024" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Landscape (1536×1024)</option>
                      </select>
                      <select value={openAiQuality} onChange={e => setOpenAiQuality(e.target.value)} className="input-field"
                        style={{ flex: 1, padding: '0 8px', fontSize: '11px', borderRadius: '9px', minHeight: 0, cursor: 'pointer', minWidth: 0 }}>
                        <option value="auto" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Quality: Auto</option>
                        <option value="high" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>High</option>
                        <option value="medium" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Medium</option>
                        <option value="low" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Low</option>
                      </select>
                    </div>
                  ) : (
                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="input-field"
                      style={{ flex: 1, padding: '0 10px', fontSize: '12px', borderRadius: '9px', minHeight: 0, cursor: 'pointer' }}>
                      {[
                        { val: '1:1',  label: '1:1 — Square' },
                        { val: '9:16', label: '9:16 — Stories / Reels' },
                        { val: '16:9', label: '16:9 — Landscape' },
                        { val: '4:5',  label: '4:5 — IG Portrait' },
                        { val: '3:4',  label: '3:4 — Portrait' },
                      ].map(r => <option key={r.val} value={r.val} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{r.label}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* ── Divider ── */}
              <div style={{ width: '1px', height: '110px', background: 'var(--glass-border)', flexShrink: 0, alignSelf: 'flex-end' }} />

              {/* ── 5. Generate ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, width: '120px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'transparent', textTransform: 'uppercase', letterSpacing: '0.8px', lineHeight: 1, userSelect: 'none' }}>·</span>
                <motion.button
                  className="btn-primary"
                  id="generate-btn"
                  style={{ width: '120px', height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '7px', fontSize: '14px', fontWeight: 700, borderRadius: '12px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}
                  onClick={handleGenerate}
                  disabled={state === 'generating' || !prompt.trim() || availableProviders.length === 0}
                  whileTap={{ scale: 0.96 }}
                >
                  {state === 'generating' ? (
                    <>
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        {[0,1,2,3].map(i => <div key={i} className="wave-bar" style={{ animationDelay: `${i*0.1}s`, height: '10px', width: '3px' }} />)}
                      </div>
                      <span style={{ fontSize: '12px' }}>{Math.round(Math.min(progress, 100))}%</span>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(0,0,0,0.25)' }}>
                        <motion.div style={{ height: '100%', background: 'rgba(255,255,255,0.85)' }} animate={{ width: `${Math.min(progress,100)}%` }} transition={{ duration: 0.3 }} />
                      </div>
                    </>
                  ) : state === 'done' ? (
                    <><RefreshCw size={20} /><span>Refresh</span></>
                  ) : (
                    <><Wand2 size={20} /><span>Generate</span></>
                  )}
                </motion.button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

