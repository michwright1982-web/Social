'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  Target, Image as ImageIcon, Check, Loader2, Upload, X, Type, Palette, Sparkles, CheckCircle2, AlertCircle, Save
} from 'lucide-react';

const FONTS = [
  { id: 'Inter', label: 'Inter (Sans-serif)', type: 'sans-serif' },
  { id: 'Playfair Display', label: 'Playfair Display (Serif)', type: 'serif' },
  { id: 'Roboto', label: 'Roboto (Sans-serif)', type: 'sans-serif' },
  { id: 'Montserrat', label: 'Montserrat (Sans-serif)', type: 'sans-serif' },
  { id: 'Space Mono', label: 'Space Mono (Monospace)', type: 'monospace' },
];

export default function BrandIdentityPage() {
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoDragging, setLogoDragging] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [brandContext, setBrandContext] = useState('');
  const [brandFont, setBrandFont] = useState('Inter');
  const [brandColors, setBrandColors] = useState<string[]>(['#7c3aed']);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const [companies, setCompanies] = useState<any[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const loadBrandData = useCallback(() => {
    const stored = localStorage.getItem('ai_marketing_companies');
    const storedActive = localStorage.getItem('ai_marketing_active_company_id');
    
    if (stored && storedActive) {
      const parsed = JSON.parse(stored);
      setCompanies(parsed);
      setActiveCompanyId(storedActive);
      
      const active = parsed.find((c: any) => c.id === storedActive);
      if (active) {
        setCompanyName(active.name || '');
        setBrandContext(active.context || '');
        setBrandFont(active.font || 'Inter');
        setBrandColors(active.colors || ['#7c3aed']);
        setCompanyLogo(active.logo || null);
      }
    }
  }, []);

  useEffect(() => {
    loadBrandData();
    window.addEventListener('brand-updated', loadBrandData);
    return () => window.removeEventListener('brand-updated', loadBrandData);
  }, [loadBrandData]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes('png')) {
        showToast('PNG files only', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        const data = ev.target?.result as string;
        setCompanyLogo(data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoRemove = () => {
    setCompanyLogo(null);
  };

  const handleSaveBrandProfile = async () => {
    setSaving(true);
    
    const updatedCompany = {
      id: activeCompanyId || Date.now().toString(),
      name: companyName,
      context: brandContext,
      font: brandFont,
      colors: brandColors,
      logo: companyLogo
    };

    let newCompanies = [...companies];
    const idx = newCompanies.findIndex(c => c.id === updatedCompany.id);
    if (idx >= 0) newCompanies[idx] = updatedCompany;
    else newCompanies.push(updatedCompany);

    localStorage.setItem('ai_marketing_companies', JSON.stringify(newCompanies));
    localStorage.setItem('ai_marketing_active_company_id', updatedCompany.id);

    try {
      const res = await fetch('/api/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: brandContext, font: brandFont, color: brandColors, name: companyName }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event('brand-updated'));
        showToast('Brand Profile saved securely', 'success');
      } else {
        showToast('Failed to save Brand Profile', 'error');
      }
    } catch (error) {
      showToast('Failed to save Brand Profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!activeCompanyId) return;
    
    const newCompanies = companies.filter(c => c.id !== activeCompanyId);
    if (newCompanies.length === 0) {
      showToast('Cannot delete the last company', 'error');
      return;
    }
    
    const newActiveId = newCompanies[0].id;
    localStorage.setItem('ai_marketing_companies', JSON.stringify(newCompanies));
    localStorage.setItem('ai_marketing_active_company_id', newActiveId);
    
    const newActive = newCompanies[0];
    await fetch('/api/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: newActive.context, font: newActive.font, color: newActive.colors, name: newActive.name }),
    });
    
    window.dispatchEvent(new Event('brand-updated'));
    showToast('Company deleted', 'success');
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Brand Identity" subtitle="Configure your brand guidelines for AI generation" />
        <div className="page-content" style={{ paddingBottom: '160px' }}>

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

          <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* ── Page Header & Save Action ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '12px', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0', fontFamily: "'Outfit', sans-serif" }}>Brand Profile</h1>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>These settings instruct the AI on how to render your visual identity.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {companies.length > 1 && (
                  <button 
                    onClick={handleDeleteCompany}
                    className="btn-ghost" 
                    style={{ padding: '10px 20px', fontSize: '13px', color: '#f87171' }}
                  >
                    Delete Workspace
                  </button>
                )}
                <button 
                  onClick={handleSaveBrandProfile}
                  disabled={saving}
                  className="btn-primary" 
                  style={{ padding: '10px 20px', fontSize: '13px' }}
                >
                  {saving ? <><Loader2 size={14} className="spin-slow" style={{ marginRight: '6px' }} /> Saving...</> : <><Save size={14} style={{ marginRight: '6px' }} /> Save Profile</>}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* ── Company Logo ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="glass-card"
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ImageIcon size={16} color="#a78bfa" /> Company Brand Asset
                    </h2>
                    <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>Name and transparent PNG for watermarking.</p>
                  </div>
                  {companyLogo && (
                    <button
                      onClick={handleLogoRemove}
                      className="btn-ghost"
                      style={{ fontSize: '11px', padding: '6px 14px', color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' }}
                    >
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>

                <input 
                  type="text"
                  placeholder="Company Name"
                  className="input-field"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  style={{ width: '100%', fontSize: '14px', marginBottom: '16px' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '10px 0' }}>
                  <label
                    onDragOver={e => { e.preventDefault(); setLogoDragging(true); }}
                    onDragLeave={() => setLogoDragging(false)}
                    onDrop={e => {
                      e.preventDefault(); setLogoDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        if (!file.type.includes('png')) { showToast('PNG files only', 'error'); return; }
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const data = ev.target?.result as string;
                          setCompanyLogo(data);
                          localStorage.setItem('company_logo_png', data);
                          showToast('Logo saved!', 'success');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{
                      width: '180px', height: '180px', flexShrink: 0,
                      border: `2px dashed ${logoDragging ? 'rgba(124,58,237,0.7)' : 'rgba(124,58,237,0.3)'}`,
                      borderRadius: '16px',
                      background: companyLogo ? 'rgba(15,22,36,0.8)' : logoDragging ? 'rgba(124,58,237,0.08)' : 'rgba(15,22,36,0.5)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '8px', cursor: 'pointer', transition: 'all 0.2s', padding: companyLogo ? '16px' : '0', overflow: 'hidden'
                    }}
                  >
                    <input type="file" accept=".png,image/png" style={{ display: 'none' }} onChange={handleLogoUpload} />
                    {companyLogo ? (
                       <img src={companyLogo} alt="Company Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <>
                        <Upload size={24} color="#7c3aed" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textAlign: 'center' }}>Upload Logo</span>
                        <span style={{ fontSize: '11px', color: '#475569' }}>PNG format only</span>
                      </>
                    )}
                  </label>
                </div>
              </motion.div>

              {/* ── Brand Typography & Colors ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card"
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}
              >
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Type size={16} color="#06b6d4" /> Brand Typography
                  </h2>
                  <p style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>Select the primary font family for AI generations.</p>
                  <select 
                    className="input-field" 
                    value={brandFont} 
                    onChange={e => setBrandFont(e.target.value)}
                    style={{ width: '100%', fontSize: '14px', padding: '12px' }}
                  >
                    {FONTS.map(font => (
                      <option key={font.id} value={font.id} style={{ background: '#0d1120', fontFamily: font.type }}>{font.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Palette size={16} color="#f59e0b" /> Brand Colors
                  </h2>
                  <p style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>Choose your brand's core accent colors.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {brandColors.map((color, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input 
                          type="color" 
                          value={color} 
                          onChange={e => {
                            const newColors = [...brandColors];
                            newColors[idx] = e.target.value;
                            setBrandColors(newColors);
                          }}
                          style={{ 
                            width: '40px', height: '40px', padding: '0', 
                            border: '2px solid rgba(124,58,237,0.3)', borderRadius: '10px', 
                            cursor: 'pointer', background: 'transparent', flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <input 
                            type="text" 
                            value={color} 
                            onChange={e => {
                              const newColors = [...brandColors];
                              newColors[idx] = e.target.value;
                              setBrandColors(newColors);
                            }}
                            className="input-field"
                            style={{ width: '100%', fontSize: '13px', fontFamily: 'monospace', padding: '10px' }}
                          />
                        </div>
                        {brandColors.length > 1 && (
                          <button 
                            className="btn-ghost" 
                            onClick={() => setBrandColors(brandColors.filter((_, i) => i !== idx))}
                            style={{ padding: '8px', color: '#f87171' }}
                            title="Remove color"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {brandColors.length < 5 && (
                      <button 
                        className="btn-secondary" 
                        onClick={() => setBrandColors([...brandColors, '#ffffff'])}
                        style={{ padding: '8px 14px', fontSize: '12px', alignSelf: 'flex-start', marginTop: '4px' }}
                      >
                        + Add Color
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ── Brand & Product Context ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card"
                style={{ padding: '24px', gridColumn: '1 / -1' }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="#ec4899" /> Brand & Product Context
                  </h2>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px', maxWidth: '800px', lineHeight: 1.5 }}>
                    Describe your brand voice, product details, target audience, or campaign goals. AI will use this exactly to generate highly tailored visual concepts and captions.
                  </p>
                </div>
                <textarea
                  className="input-field"
                  placeholder="e.g. 'We are a luxury sustainable coffee brand targeting young professionals in London. Our tone is witty, elegant, and energetic...'"
                  value={brandContext}
                  onChange={e => setBrandContext(e.target.value)}
                  style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontSize: '14px', lineHeight: 1.6 }}
                />
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
