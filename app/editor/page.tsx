'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  Send, Check,
  Copy, RefreshCw, Sparkles, AlertCircle, CheckCircle2,
  Loader2, Hash, AtSign,
  Clock, Zap, Globe, ImageIcon,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, XSocialIcon } from '@/components/SocialIcons';

const platforms = [
  {
    id: 'facebook', label: 'Facebook', icon: FacebookIcon, color: '#1877F2',
    charLimit: 63206, tip: 'Longer posts with storytelling work well. Use emojis & clear CTAs.',
    maxHashtags: 10, aspectRatio: '1.91:1',
  },
  {
    id: 'instagram', label: 'Instagram', icon: InstagramIcon, color: '#E1306C',
    charLimit: 2200, tip: 'Hashtag-heavy. Punchy first line, emojis, up to 30 hashtags.',
    maxHashtags: 30, aspectRatio: '1:1',
  },
  {
    id: 'x', label: 'X (Twitter)', icon: XSocialIcon, color: '#ffffff',
    charLimit: 280, tip: 'Short & punchy. Max 280 characters. 1-2 hashtags max.',
    maxHashtags: 2, aspectRatio: '16:9',
  },
  {
    id: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon, color: '#0A66C2',
    charLimit: 3000, tip: 'Professional tone. Thought leadership style. Stories convert well.',
    maxHashtags: 5, aspectRatio: '1.91:1',
  },
];

type PublishStatus = 'idle' | 'publishing' | 'success' | 'error';

interface PlatformStatus {
  status: PublishStatus;
  message?: string;
}

export default function EditorPage() {
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

  const platform = platforms.find(p => p.id === activePlatform)!;
  const caption = captions[activePlatform] || '';
  const charCount = caption.length;
  const charPct = Math.min((charCount / platform.charLimit) * 100, 100);

  const handleRegenerate = (platformId: string) => {
    setIsRegenerating(platformId);
    // Wire to real AI caption API — clears after timeout for now
    setTimeout(() => {
      setIsRegenerating(null);
    }, 2000);
  };

  const handleCopy = (platformId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(platformId);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePublishAll = async () => {
    setIsPublishingAll(true);
    setPublishDone(false);

    for (const p of platforms) {
      setPlatformStatuses(prev => ({ ...prev, [p.id]: { status: 'publishing' } }));
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
      // Wire to real social API per platform
      setPlatformStatuses(prev => ({
        ...prev,
        [p.id]: {
          status: 'error',
          message: 'Connect account in Vault to publish',
        },
      }));
    }

    setIsPublishingAll(false);
    setPublishDone(true);
  };

  const statusIcon = (status: PublishStatus) => {
    switch (status) {
      case 'publishing': return <Loader2 size={14} className="spin-slow" color="#f59e0b" />;
      case 'success': return <CheckCircle2 size={14} color="#10b981" />;
      case 'error': return <AlertCircle size={14} color="#ef4444" />;
      default: return null;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Unified Editor" subtitle="Edit captions and publish to all platforms" />
        <div className="page-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

            {/* LEFT — Campaign Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              style={{ position: 'sticky', top: '80px' }}
            >
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                {/* Image placeholder */}
                <div style={{ position: 'relative', background: 'rgba(124,58,237,0.05)', minHeight: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '40px 24px', borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={24} color="#7c3aed" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>No image selected</div>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, maxWidth: '240px' }}>
                      Generate and select a variation in the Creative Studio first, then proceed here.
                    </div>
                  </div>
                </div>

                {/* Aspect ratio indicators */}
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aspect Ratio Fit</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {platforms.map(p => {
                      const Icon = p.icon;
                      return (
                        <div key={p.id} style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '10px', background: 'rgba(15,22,36,0.6)', border: '1px solid rgba(124,58,237,0.1)' }}>
                          <Icon size={13} color={p.color} style={{ marginBottom: '4px' }} />
                          <div style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>{p.aspectRatio}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Publish Status Summary */}
              <AnimatePresence>
                {publishDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{ padding: '16px 20px', marginTop: '16px' }}
                  >
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Globe size={14} color="#7c3aed" /> Publish Summary
                    </h3>
                    {platforms.map(p => {
                      const Icon = p.icon;
                      const s = platformStatuses[p.id];
                      return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon size={14} color={p.color} />
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{p.label}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {statusIcon(s.status)}
                            <span style={{ fontSize: '11px', color: s.status === 'success' ? '#34d399' : s.status === 'error' ? '#f87171' : '#94a3b8' }}>
                              {s.message || '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* RIGHT — Caption Editor */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* Platform Tabs */}
              <div className="glass-card" style={{ padding: '6px', marginBottom: '16px', display: 'flex', gap: '4px' }}>
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
                        flex: 1, padding: '10px 8px', borderRadius: '10px',
                        border: 'none', cursor: 'pointer',
                        background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                        color: isActive ? '#a78bfa' : '#64748b',
                        fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600,
                        transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative',
                      }}
                    >
                      <Icon size={16} color={isActive ? p.color : '#64748b'} />
                      <span style={{ fontSize: '10px' }}>{p.label.split(' ')[0]}</span>
                      {s.status !== 'idle' && (
                        <span style={{ position: 'absolute', top: '6px', right: '6px' }}>
                          {statusIcon(s.status)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Caption Editor Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePlatform}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="glass-card"
                  style={{ padding: '20px', marginBottom: '16px' }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(() => { const Icon = platform.icon; return <Icon size={16} color={platform.color} />; })()}
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0' }}>{platform.label}</span>
                        {platformStatuses[activePlatform].status !== 'idle' && statusIcon(platformStatuses[activePlatform].status)}
                      </div>
                      <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px', maxWidth: '300px', lineHeight: 1.5 }}>{platform.tip}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-ghost"
                        style={{ padding: '7px 12px', fontSize: '11px' }}
                        onClick={() => handleCopy(activePlatform, caption)}
                        id={`copy-${activePlatform}`}
                        disabled={!caption}
                      >
                        {copied === activePlatform ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '7px 12px', fontSize: '11px' }}
                        onClick={() => handleRegenerate(activePlatform)}
                        id={`regen-${activePlatform}`}
                        disabled={isRegenerating === activePlatform}
                      >
                        {isRegenerating === activePlatform
                          ? <><Loader2 size={11} className="spin-slow" /> Generating...</>
                          : <><Sparkles size={11} /> Regenerate</>}
                      </button>
                    </div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    id={`caption-${activePlatform}`}
                    className="input-field"
                    value={caption}
                    onChange={e => setCaptions(prev => ({ ...prev, [activePlatform]: e.target.value }))}
                    placeholder={`Write your ${platform.label} caption here, or use Regenerate to let AI draft one...`}
                    style={{ minHeight: '220px', fontSize: '13px', lineHeight: '1.7' }}
                  />

                  {/* Footer info */}
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Hash size={10} /> {(caption.match(/#\w+/g) || []).length} hashtags
                      </span>
                      <span style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AtSign size={10} /> {(caption.match(/@\w+/g) || []).length} mentions
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '3px', background: 'rgba(124,58,237,0.15)', borderRadius: '2px' }}>
                        <div style={{ width: `${charPct}%`, height: '100%', background: charPct > 90 ? '#ef4444' : 'linear-gradient(to right, #7c3aed, #06b6d4)', borderRadius: '2px', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: charPct > 90 ? '#f87171' : '#475569', fontWeight: 600 }}>
                        {charCount.toLocaleString()} / {platform.charLimit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Schedule Option */}
              <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={15} color="#7c3aed" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>Schedule for Later</div>
                      <div style={{ fontSize: '11px', color: '#475569' }}>Optimal posting times: 9AM, 12PM, 6PM IST</div>
                    </div>
                  </div>
                  <input type="datetime-local" className="input-field" style={{ width: '200px', fontSize: '12px', padding: '8px 12px' }} />
                </div>
              </div>

              {/* Publish Button */}
              <motion.button
                id="publish-everywhere-btn"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '15px' }}
                onClick={handlePublishAll}
                disabled={isPublishingAll}
                whileTap={{ scale: 0.98 }}
                whileHover={{ boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}
              >
                {isPublishingAll ? (
                  <>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s`, height: '14px' }} />
                      ))}
                    </div>
                    Publishing to all platforms...
                  </>
                ) : publishDone ? (
                  <><Globe size={16} /> Publish Again</>
                ) : (
                  <><Send size={16} /> <Zap size={14} /> Publish Everywhere</>
                )}
              </motion.button>

              {/* Platform publish indicators */}
              <AnimatePresence>
                {isPublishingAll && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card"
                    style={{ marginTop: '12px', padding: '14px 20px', overflow: 'hidden' }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                      Publishing Status
                    </div>
                    {platforms.map(p => {
                      const Icon = p.icon;
                      const s = platformStatuses[p.id];
                      return (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon size={13} color={p.color} />
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{p.label}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {statusIcon(s.status)}
                            <span style={{ fontSize: '11px', color: s.status === 'success' ? '#34d399' : s.status === 'error' ? '#f87171' : s.status === 'publishing' ? '#fbbf24' : '#475569' }}>
                              {s.status === 'idle' ? 'Queued' : s.status === 'publishing' ? 'Publishing...' : s.message}
                            </span>
                          </div>
                        </motion.div>
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
  );
}
