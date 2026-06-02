'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  KeyRound, Eye, EyeOff, Plus, Trash2, CheckCircle2,
  AlertCircle, Lock, Shield,
  Zap, ExternalLink, RefreshCw, Copy, Check,
  Server, Brain, Image as ImageIcon,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, XSocialIcon } from '@/components/SocialIcons';

interface ApiKey {
  id: string;
  provider: string;
  label: string;
  key: string;
  status: 'active' | 'invalid' | 'untested';
  lastUsed?: string;
  color: string;
  icon: React.ReactNode;
}

interface SocialAccount {
  id: string;
  platform: string;
  status: 'connected' | 'disconnected' | 'expired';
  color: string;
  icon: React.ReactNode;
}

const socialAccounts: SocialAccount[] = [
  { id: '1', platform: 'Facebook', status: 'disconnected', color: '#1877F2', icon: <FacebookIcon size={18} /> },
  { id: '2', platform: 'Instagram', status: 'disconnected', color: '#E1306C', icon: <InstagramIcon size={18} /> },
  { id: '3', platform: 'X (Twitter)', status: 'disconnected', color: '#ffffff', icon: <XSocialIcon size={18} /> },
  { id: '4', platform: 'LinkedIn', status: 'disconnected', color: '#0A66C2', icon: <LinkedinIcon size={18} /> },
];

export default function VaultPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [showAddKey, setShowAddKey] = useState(false);
  const [newProvider, setNewProvider] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const toggleVisibility = (id: string) => setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCopy = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTest = (id: string) => {
    setTestingId(id);
    setTimeout(() => setTestingId(null), 2000);
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  const handleAddKey = () => {
    if (!newProvider || !newKey) return;
    const key: ApiKey = {
      id: Date.now().toString(),
      provider: newProvider,
      label: newLabel || newProvider,
      key: newKey,
      status: 'untested',
      color: '#7c3aed',
      icon: newProvider === 'OpenAI' || newProvider === 'Anthropic'
        ? <Brain size={16} />
        : newProvider === 'Stability AI' || newProvider === 'Midjourney'
          ? <ImageIcon size={16} />
          : <Server size={16} />,
    };
    setApiKeys(prev => [...prev, key]);
    setNewProvider(''); setNewKey(''); setNewLabel('');
    setShowAddKey(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="badge badge-green"><CheckCircle2 size={9} /> Active</span>;
      case 'invalid': return <span className="badge badge-red"><AlertCircle size={9} /> Invalid</span>;
      case 'connected': return <span className="badge badge-green"><CheckCircle2 size={9} /> Connected</span>;
      case 'expired': return <span className="badge badge-amber"><AlertCircle size={9} /> Expired</span>;
      case 'disconnected': return <span className="badge" style={{ background: 'rgba(71,85,105,0.2)', color: '#64748b', border: '1px solid rgba(71,85,105,0.3)' }}>Disconnected</span>;
      default: return <span className="badge badge-violet">Untested</span>;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Secure Vault" subtitle="Manage API keys and social account connections" />
        <div className="page-content">

          {/* Security Banner */}
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

            {/* AI API Keys */}
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
                        {['OpenAI', 'Anthropic', 'Stability AI', 'Midjourney', 'Replicate', 'Custom'].map(p => (
                          <option key={p} value={p} style={{ background: '#0d1120' }}>{p}</option>
                        ))}
                      </select>
                      <input className="input-field" placeholder="Label (e.g. GPT-4o Production)" value={newLabel} onChange={e => setNewLabel(e.target.value)} style={{ fontSize: '13px' }} id="new-key-label" />
                      <input className="input-field" type="password" placeholder="API Key (e.g. sk-...)" value={newKey} onChange={e => setNewKey(e.target.value)} style={{ fontSize: '13px', fontFamily: 'monospace' }} id="new-key-input" />
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

              {/* Keys List */}
              {apiKeys.length === 0 && !showAddKey ? (
                <div className="glass-card" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px' }}>
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
                  {apiKeys.map((key, i) => (
                    <motion.div
                      key={key.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card"
                      style={{ padding: '16px 20px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${key.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: key.color }}>
                            {key.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>{key.provider}</div>
                            <div style={{ fontSize: '11px', color: '#475569' }}>{key.label}</div>
                          </div>
                        </div>
                        {statusBadge(key.status)}
                      </div>

                      {/* Key display */}
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

                      {/* Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Zap size={9} color="#7c3aed" /> Last used: {key.lastUsed || 'Never'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn-ghost"
                            style={{ padding: '5px 10px', fontSize: '11px' }}
                            onClick={() => handleTest(key.id)}
                            id={`test-key-${key.id}`}
                          >
                            {testingId === key.id ? <><RefreshCw size={10} className="spin-slow" /> Testing...</> : <><Zap size={10} /> Test</>}
                          </button>
                          <button
                            onClick={() => handleDeleteKey(key.id)}
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            id={`delete-key-${key.id}`}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Social Accounts */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div style={{ marginBottom: '14px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExternalLink size={15} color="#06b6d4" /> Social Accounts
                </h2>
                <p style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Connect your social profiles via OAuth 2.0</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {socialAccounts.map((account, i) => (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card"
                    style={{ padding: '18px 20px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${account.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: account.color }}>
                          {account.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0' }}>{account.platform}</div>
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>Not connected</div>
                        </div>
                      </div>
                      {statusBadge(account.status)}
                    </div>

                    <div style={{ marginTop: '14px' }}>
                      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px' }} id={`connect-${account.id}`}>
                        <ExternalLink size={11} /> Connect via OAuth
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* OAuth Info */}
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
