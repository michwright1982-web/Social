'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  KeyRound, Eye, EyeOff, Plus, Trash2, CheckCircle2,
  AlertCircle, Lock, Shield,
  Zap, ExternalLink, RefreshCw, Copy, Check,
  Server, Brain, Image as ImageIcon, Loader2, Sparkles, Settings,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, XSocialIcon } from '@/components/SocialIcons';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  provider: string;
  label: string;
  key: string;
  status: 'active' | 'invalid' | 'untested';
  lastUsed?: string;
}

interface PlatformStatus {
  connected: boolean;
  handle?: string;
  connected_at?: number;
}

type SocialStatuses = Record<string, PlatformStatus>;

// ─── Platform definitions ─────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  { id: 'facebook', label: 'Facebook', color: '#1877F2', icon: <FacebookIcon size={18} /> },
  { id: 'x',        label: 'X (Twitter)', color: '#ffffff', icon: <XSocialIcon  size={18} /> },
  { id: 'linkedin', label: 'LinkedIn',  color: '#0A66C2', icon: <LinkedinIcon  size={18} /> },
];

// ─── AI Provider config ───────────────────────────────────────────────────────

const PROVIDER_CONFIG: Record<string, { color: string; icon: React.ReactNode; hint: string }> = {
  'Google AI Studio': { color: '#4285F4', icon: <Sparkles size={16} />, hint: 'AIza...' },
  'OpenAI':           { color: '#10b981', icon: <Brain     size={16} />, hint: 'sk-proj-...' },
  'Anthropic':        { color: '#f59e0b', icon: <Brain     size={16} />, hint: 'sk-ant-...' },
  'Stability AI':     { color: '#8b5cf6', icon: <ImageIcon size={16} />, hint: 'sk-...' },
  'Midjourney':       { color: '#ec4899', icon: <ImageIcon size={16} />, hint: 'Paste your key' },
  'Replicate':        { color: '#06b6d4', icon: <Server    size={16} />, hint: 'r8_...' },
  'Custom':           { color: '#7c3aed', icon: <Server    size={16} />, hint: 'Paste your key' },
};

// ─── Component ────────────────────────────────────────────────────────────────

function VaultContent() {
  const searchParams = useSearchParams();

  // ── API Keys state ─────────────────────────────────────────────────────────
  const [apiKeys, setApiKeys]         = useState<ApiKey[]>([]);
  const [showKeys, setShowKeys]       = useState<Record<string, boolean>>({});
  const [showAddKey, setShowAddKey]   = useState(false);
  const [newProvider, setNewProvider] = useState('');
  const [newKey, setNewKey]           = useState('');
  const [newLabel, setNewLabel]       = useState('');
  const [copiedId, setCopiedId]       = useState<string | null>(null);
  const [testingId, setTestingId]     = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; message: string }>>({});

  // ── Social OAuth state ─────────────────────────────────────────────────────
  const [socialStatuses, setSocialStatuses] = useState<SocialStatuses>({});
  const [statusLoading, setStatusLoading]   = useState(true);
  const [disconnecting, setDisconnecting]   = useState<string | null>(null);

  // ── Developer App Creds state ──────────────────────────────────────────────
  const [oauthCreds, setOauthCreds] = useState<Record<string, { clientId: string; isSecretSet: boolean }>>({});
  const [editingCredsPlatform, setEditingCredsPlatform] = useState<string | null>(null);
  const [credsForm, setCredsForm] = useState({ clientId: '', clientSecret: '' });
  const [savingCreds, setSavingCreds] = useState(false);

  // ── Toast notification ─────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load real OAuth status & configs on mount ─────────────────────────────
  const loadInitialData = useCallback(async () => {
    setStatusLoading(true);
    try {
      const [statusRes, keysRes, credsRes] = await Promise.all([
        fetch('/api/auth/status'),
        fetch('/api/keys'),
        fetch('/api/auth/credentials')
      ]);
      
      if (statusRes.ok) setSocialStatuses(await statusRes.json());
      if (keysRes.ok) setApiKeys(await keysRes.json());
      if (credsRes.ok) setOauthCreds(await credsRes.json());

    } catch {
      showToast('Failed to load connection status', 'error');
    } finally {
      setStatusLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ── Handle ?connected= or ?error= redirects from callbacks ────────────────
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error     = searchParams.get('error');

    if (connected) {
      const label = SOCIAL_PLATFORMS.find(p => p.id === connected)?.label ?? connected;
      showToast(`✓ ${label} connected successfully!`, 'success');
      loadInitialData();
      // Clean URL without re-render
      window.history.replaceState({}, '', '/vault');
    }

    if (error) {
      const messages: Record<string, string> = {
        facebook_denied:        'Facebook connection was cancelled.',
        facebook_state_mismatch:'Facebook: security check failed. Please try again.',
        facebook_token_failed:  'Facebook token exchange failed. Check your App credentials.',
        x_denied:               'X connection was cancelled.',
        x_state_mismatch:       'X: security check failed. Please try again.',
        x_token_failed:         'X token exchange failed. Check your App credentials.',
        linkedin_denied:        'LinkedIn connection was cancelled.',
        linkedin_state_mismatch:'LinkedIn: security check failed. Please try again.',
        linkedin_token_failed:  'LinkedIn token exchange failed. Check your App credentials.',
      };
      showToast(messages[error] ?? `Connection error: ${error}`, 'error');
      window.history.replaceState({}, '', '/vault');
    }
  }, [searchParams, showToast, loadInitialData]);

  // ── Disconnect a platform ──────────────────────────────────────────────────
  const handleDisconnect = async (platformId: string) => {
    setDisconnecting(platformId);
    try {
      const res = await fetch('/api/auth/disconnect', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ platform: platformId }),
      });
      if (res.ok) {
        setSocialStatuses(prev => ({ ...prev, [platformId]: { connected: false } }));
        const label = SOCIAL_PLATFORMS.find(p => p.id === platformId)?.label ?? platformId;
        showToast(`${label} disconnected.`, 'success');
      } else {
        showToast('Disconnect failed. Please try again.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setDisconnecting(null);
    }
  };

  // ── API Key helpers ────────────────────────────────────────────────────────
  const toggleVisibility = (id: string) =>
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCopy = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTest = async (keyEntry: ApiKey) => {
    setTestingId(keyEntry.id);
    setTestResults(prev => ({ ...prev, [keyEntry.id]: { valid: false, message: '' } }));
    try {
      const res  = await fetch('/api/keys/test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ provider: keyEntry.provider, key: keyEntry.key }),
      });
      const data = (await res.json()) as { valid: boolean; message: string };
      setTestResults(prev => ({ ...prev, [keyEntry.id]: data }));
      // Update the key's status based on test result
      const newStatus = data.valid ? 'active' : 'invalid';
      const updatedKeys = apiKeys.map(k =>
        k.id === keyEntry.id ? { ...k, status: newStatus as any } : k
      );
      setApiKeys(updatedKeys);
      await saveKeysToApi(updatedKeys);
      showToast(data.valid ? 'Key is correct' : 'Incorrect key', data.valid ? 'success' : 'error');
    } catch {
      showToast('Network error during key test', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const saveKeysToApi = async (newKeys: ApiKey[]) => {
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKeys)
      });
      if (!res.ok) {
        throw new Error('Failed to save to server');
      }
      return true;
    } catch (err) {
      console.error('Failed to save keys', err);
      showToast('Failed to save keys securely', 'error');
      return false;
    }
  };

  const handleDeleteKey = async (id: string) => {
    const previousKeys = [...apiKeys];
    const newKeys = apiKeys.filter(k => k.id !== id);
    setApiKeys(newKeys);
    const success = await saveKeysToApi(newKeys);
    if (!success) {
      setApiKeys(previousKeys); // revert on failure
    }
  };

  const handleAddKey = async () => {
    if (!newProvider || !newKey) return;
    const key: ApiKey = {
      id:       Date.now().toString(),
      provider: newProvider,
      label:    newLabel || newProvider,
      key:      newKey,
      status:   'untested',
    };
    const previousKeys = [...apiKeys];
    const newKeys = [...apiKeys, key];
    setApiKeys(newKeys);
    
    const success = await saveKeysToApi(newKeys);
    if (success) {
      setNewProvider(''); setNewKey(''); setNewLabel('');
      setShowAddKey(false);
      showToast(`${newProvider} key saved.`, 'success');
    } else {
      setApiKeys(previousKeys);
    }
  };

  // ── Developer App Creds Save ───────────────────────────────────────────────
  const handleSaveCreds = async () => {
    if (!editingCredsPlatform) return;
    setSavingCreds(true);
    try {
      const res = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [editingCredsPlatform]: credsForm
        })
      });
      if (res.ok) {
        showToast('App credentials saved securely', 'success');
        await loadInitialData();
        setEditingCredsPlatform(null);
      } else {
        showToast('Failed to save app credentials', 'error');
      }
    } catch {
      showToast('Network error while saving credentials', 'error');
    } finally {
      setSavingCreds(false);
    }
  };

  const handleClearCreds = async (platformId: string) => {
    try {
      await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [platformId]: { clientId: '', clientSecret: '' } })
      });
      await loadInitialData();
      showToast('Credentials cleared', 'success');
    } catch {
      showToast('Failed to clear credentials', 'error');
    }
  };

  // ── Badge helpers ──────────────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':       return <span className="badge badge-green"><CheckCircle2 size={9} /> Active</span>;
      case 'invalid':      return <span className="badge badge-red"><AlertCircle size={9} /> Incorrect Key</span>;
      case 'connected':    return <span className="badge badge-green"><CheckCircle2 size={9} /> Connected</span>;
      case 'expired':      return <span className="badge badge-amber"><AlertCircle size={9} /> Expired</span>;
      case 'disconnected': return <span className="badge" style={{ background: 'rgba(71,85,105,0.2)', color: '#64748b', border: '1px solid rgba(71,85,105,0.3)' }}>Disconnected</span>;
      default:             return <span className="badge badge-violet">Untested</span>;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Secure Vault" subtitle="Manage API keys and social account connections" />
        <div className="page-content">

          {/* ── Toast ──────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                style={{
                  position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
                  zIndex: 200, padding: '12px 22px', borderRadius: '12px',
                  background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  backdropFilter: 'blur(12px)',
                  fontSize: '13px', fontWeight: 600,
                  color: toast.type === 'success' ? '#34d399' : '#f87171',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  whiteSpace: 'nowrap',
                }}
              >
                {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Security Banner ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(79,70,229,0.05) 100%)' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={20} color="#7c3aed" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>AES-256 Encrypted Storage</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                All API keys and OAuth tokens are encrypted before storage. Keys are only decrypted in-memory during active API requests. They are never exposed to the browser.
              </div>
            </div>
            <span className="badge badge-green" style={{ flexShrink: 0 }}>
              <Lock size={9} /> Encrypted
            </span>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

            {/* ── AI API Keys ─────────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <KeyRound size={15} color="#7c3aed" /> AI Provider Keys
                  </h2>
                  <p style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>For image generation and caption AI</p>
                </div>
                <button className="btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => setShowAddKey(!showAddKey)} id="add-key-btn">
                  <Plus size={13} /> Add Key
                </button>
              </div>

              {/* Add Key Form */}
              <AnimatePresence>
                {showAddKey && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card"
                    style={{ padding: '20px', marginBottom: '14px', overflow: 'hidden' }}
                  >
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={13} /> Add New API Key
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <select className="input-field" style={{ fontSize: '13px' }} value={newProvider} onChange={e => setNewProvider(e.target.value)} id="new-provider-select">
                        <option value="" style={{ background: '#0d1120' }}>Select Provider</option>
                        {['Google AI Studio', 'OpenAI', 'Anthropic', 'Stability AI', 'Midjourney', 'Replicate', 'Custom'].map(p => (
                          <option key={p} value={p} style={{ background: '#0d1120' }}>{p}</option>
                        ))}
                      </select>
                      <input className="input-field" placeholder="Label (e.g. GPT-4o Production)" value={newLabel} onChange={e => setNewLabel(e.target.value)} style={{ fontSize: '13px' }} id="new-key-label" />
                      <input className="input-field" type="password" placeholder={newProvider ? `API Key (e.g. ${PROVIDER_CONFIG[newProvider]?.hint ?? 'Paste your key'})` : 'API Key'} value={newKey} onChange={e => setNewKey(e.target.value)} style={{ fontSize: '13px', fontFamily: 'monospace' }} id="new-key-input" />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px' }} onClick={handleAddKey} id="save-key-btn">
                          <Lock size={13} /> Save Encrypted
                        </button>
                        <button className="btn-ghost" onClick={() => setShowAddKey(false)} style={{ padding: '10px 16px' }}>Cancel</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keys list / empty state */}
              {apiKeys.length === 0 && !showAddKey ? (
                <div className="glass-card" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <KeyRound size={20} color="#7c3aed" />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>No API keys added</div>
                  <div style={{ fontSize: '12px', color: '#475569', maxWidth: '220px', lineHeight: 1.6 }}>
                    Add your OpenAI, Anthropic, or Stability AI key to enable image generation and AI captions.
                  </div>
                  <button className="btn-primary" style={{ fontSize: '12px', padding: '9px 18px', marginTop: '4px' }} onClick={() => setShowAddKey(true)}>
                    <Plus size={13} /> Add First Key
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {apiKeys.map((key, i) => {
                    const config = PROVIDER_CONFIG[key.provider] ?? PROVIDER_CONFIG['Custom'];
                    return (
                    <motion.div
                      key={key.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="glass-card"
                      style={{ padding: '16px 20px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${config.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.color }}>
                            {config.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>{key.provider}</div>
                            <div style={{ fontSize: '11px', color: '#475569' }}>{key.label}</div>
                          </div>
                        </div>
                        {statusBadge(key.status)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15,22,36,0.8)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', border: '1px solid rgba(124,58,237,0.1)' }}>
                        <code style={{ flex: 1, fontSize: '12px', fontFamily: 'monospace', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {showKeys[key.id] ? key.key : '••••••••••••••••••••••••••••••'}
                        </code>
                        <button onClick={() => toggleVisibility(key.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '2px' }}>
                          {showKeys[key.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button onClick={() => handleCopy(key.id, key.key)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '2px' }}>
                          {copiedId === key.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Zap size={9} color="#7c3aed" /> Last used: {key.lastUsed || 'Never'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: '11px' }} onClick={() => handleTest(key)} disabled={testingId === key.id} id={`test-key-${key.id}`}>
                            {testingId === key.id ? <><RefreshCw size={10} className="spin-slow" /> Testing...</> : <><Zap size={10} /> Test</>}
                          </button>
                          <button onClick={() => handleDeleteKey(key.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} id={`delete-key-${key.id}`}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )})}
                </div>
              )}
            </motion.div>

            {/* ── Social Accounts ─────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div style={{ marginBottom: '14px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExternalLink size={15} color="#06b6d4" /> Social Accounts
                </h2>
                <p style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Connect your social profiles via OAuth 2.0</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {SOCIAL_PLATFORMS.map((platform, i) => {
                  const status     = socialStatuses[platform.id] ?? { connected: false };
                  const isLoading  = statusLoading;
                  const isDisconnecting = disconnecting === platform.id;
                  const creds      = oauthCreds[platform.id];
                  const hasCreds   = !!creds?.clientId;

                  return (
                    <motion.div
                      key={platform.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card"
                      style={{ padding: '18px 20px', overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${platform.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: platform.color }}>
                            {platform.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {platform.label}
                              {hasCreds && <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', color: '#34d399', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>App Configured</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                              {isLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Loader2 size={10} className="spin-slow" /> Checking...
                                </span>
                              ) : status.connected ? (
                                <span style={{ color: '#64748b' }}>
                                  {status.handle}
                                  {status.connected_at && (
                                    <span style={{ marginLeft: '6px', color: '#334155' }}>
                                      · Connected {new Date(status.connected_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                hasCreds ? 'Ready to connect' : 'Requires Developer App credentials'
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status badge & Settings icon */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {isLoading ? (
                            <span className="badge" style={{ background: 'rgba(71,85,105,0.15)', color: '#475569', border: '1px solid rgba(71,85,105,0.2)' }}>
                              <Loader2 size={9} className="spin-slow" /> Loading
                            </span>
                          ) : status.connected ? (
                            <span className="badge badge-green"><CheckCircle2 size={9} /> Connected</span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(71,85,105,0.2)', color: '#64748b', border: '1px solid rgba(71,85,105,0.3)' }}>Not Connected</span>
                          )}
                          {hasCreds && (
                            <button 
                              className="btn-ghost" 
                              style={{ padding: '6px' }}
                              onClick={() => {
                                if (editingCredsPlatform === platform.id) {
                                  setEditingCredsPlatform(null);
                                } else {
                                  setEditingCredsPlatform(platform.id);
                                  setCredsForm({ clientId: creds?.clientId || '', clientSecret: '' });
                                }
                              }}
                            >
                              <Settings size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Developer App Config Panel */}
                      <AnimatePresence>
                        {editingCredsPlatform === platform.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(124,58,237,0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                Configure {platform.label} App
                                <Link href={`/setup-guide?platform=${platform.id}`} style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: 500 }}>Setup Guide ↗</Link>
                              </div>
                              <input 
                                className="input-field" 
                                placeholder="Client ID (App ID)" 
                                value={credsForm.clientId}
                                onChange={e => setCredsForm(prev => ({ ...prev, clientId: e.target.value }))}
                                style={{ fontSize: '13px', fontFamily: 'monospace' }} 
                              />
                              <input 
                                className="input-field" 
                                type="password" 
                                placeholder={creds?.isSecretSet ? "Client Secret (•••••••• saved)" : "Client Secret"} 
                                value={credsForm.clientSecret}
                                onChange={e => setCredsForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                                style={{ fontSize: '13px', fontFamily: 'monospace' }} 
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '12px', justifyContent: 'center' }} onClick={handleSaveCreds} disabled={savingCreds}>
                                  {savingCreds ? <Loader2 size={12} className="spin-slow" /> : <Lock size={12} />} Save Credentials
                                </button>
                                {hasCreds && (
                                  <button className="btn-ghost" style={{ padding: '8px 12px', fontSize: '12px', color: '#f87171' }} onClick={() => { setEditingCredsPlatform(null); handleClearCreds(platform.id); }}>
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action buttons */}
                      <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                        {!hasCreds ? (
                          <button 
                            className="btn-primary" 
                            style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px' }}
                            onClick={() => {
                              if (editingCredsPlatform === platform.id) {
                                setEditingCredsPlatform(null);
                              } else {
                                setEditingCredsPlatform(platform.id);
                                setCredsForm({ clientId: '', clientSecret: '' });
                              }
                            }}
                          >
                            <Settings size={11} /> Configure App
                          </button>
                        ) : status.connected ? (
                          <button
                            onClick={() => handleDisconnect(platform.id)}
                            disabled={isDisconnecting}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                            id={`disconnect-${platform.id}`}
                          >
                            {isDisconnecting ? <Loader2 size={11} className="spin-slow" /> : <Trash2 size={11} />}
                            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                          </button>
                        ) : (
                          /* Full-page redirect — no JS fetch needed */
                          <a
                            href={`/api/auth/${platform.id}/connect`}
                            style={{ flex: 1, textDecoration: 'none' }}
                            id={`connect-${platform.id}`}
                          >
                            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px' }}>
                              <ExternalLink size={11} /> Connect via OAuth
                            </button>
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* OAuth info banner */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="glass-card"
                style={{ padding: '16px 20px', marginTop: '12px', background: 'rgba(6,182,212,0.04)', borderColor: 'rgba(6,182,212,0.15)' }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Shield size={14} color="#06b6d4" style={{ marginTop: '1px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#22d3ee', marginBottom: '4px' }}>OAuth 2.0 Security</div>
                    <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.6 }}>
                      Connecting your accounts uses the official OAuth 2.0 flow. We only request the minimum required permissions (publish posts). Your password is never shared with us.
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Suspense wrapper required by Next.js when using useSearchParams()
export default function VaultPage() {
  return (
    <Suspense fallback={null}>
      <VaultContent />
    </Suspense>
  );
}
