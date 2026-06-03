'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Wand2,
  PenLine,
  KeyRound,
  BarChart2,
  Settings,
  Zap,
  Sparkles,
  Target,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/studio', label: 'Creative Studio', icon: Wand2 },
  { href: '/editor', label: 'Unified Editor', icon: PenLine },
  { href: '/brand', label: 'Brand Identity', icon: Target },
  { href: '/vault', label: 'Secure Vault', icon: KeyRound },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

import { ChevronDown, Plus } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  context: string;
  font: string;
  colors: string[];
  logo: string | null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const loadCompanies = () => {
    const stored = localStorage.getItem('ai_marketing_companies');
    const storedActive = localStorage.getItem('ai_marketing_active_company_id');
    
    if (stored) {
      setCompanies(JSON.parse(stored));
      if (storedActive) setActiveCompanyId(storedActive);
    } else {
      // Data Migration from V1 (Single Company)
      fetch('/api/brand')
        .then(r => r.json())
        .then(data => {
          const storedLogo = localStorage.getItem('company_logo_png');
          if (data.context || data.name || storedLogo) {
            const defaultCompany: Company = {
              id: Date.now().toString(),
              name: data.name || 'Default Company',
              context: data.context || '',
              font: data.font || 'Inter',
              colors: Array.isArray(data.color) ? data.color : (data.color ? [data.color] : ['#7c3aed']),
              logo: storedLogo || null
            };
            localStorage.setItem('ai_marketing_companies', JSON.stringify([defaultCompany]));
            localStorage.setItem('ai_marketing_active_company_id', defaultCompany.id);
            setCompanies([defaultCompany]);
            setActiveCompanyId(defaultCompany.id);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCompanies();
    window.addEventListener('brand-updated', loadCompanies);
    return () => window.removeEventListener('brand-updated', loadCompanies);
  }, []);

  const handleSwitchCompany = async (id: string) => {
    localStorage.setItem('ai_marketing_active_company_id', id);
    setActiveCompanyId(id);
    setShowDropdown(false);
    
    const company = companies.find(c => c.id === id);
    if (company) {
      await fetch('/api/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: company.context,
          font: company.font,
          color: company.colors,
          name: company.name
        })
      });
      window.dispatchEvent(new Event('brand-updated'));
    }
  };

  const activeCompany = companies.find(c => c.id === activeCompanyId) || null;
  const displayLogo = activeCompany?.logo || null;
  const displayName = activeCompany?.name || null;

  return (
    <aside className="sidebar">
      {/* Workspace Switcher */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--glass-border)', position: 'relative' }}>
        <motion.div
          onClick={() => setShowDropdown(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}
          whileTap={{ scale: 0.98 }}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
            background: displayLogo ? 'transparent' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden'
          }} className={displayLogo ? '' : 'glow-violet'}>
            {displayLogo ? (
              <img src={displayLogo} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Sparkles size={20} color="white" />
            )}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
              {displayName ? displayName : 'AI Marketing'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--accent-violet)', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
              {displayName ? 'Marketing Hub' : 'Hub'}
            </div>
          </div>
          <ChevronDown size={16} color="var(--text-secondary)" style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </motion.div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute', top: '75px', left: '16px', right: '16px', zIndex: 100,
              background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)', overflow: 'hidden', padding: '8px'
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', padding: '8px 12px 4px' }}>Workspaces</div>
            {companies.map(c => (
              <div
                key={c.id}
                onClick={() => handleSwitchCompany(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px',
                  background: activeCompanyId === c.id ? 'rgba(124,58,237,0.12)' : 'transparent',
                  color: activeCompanyId === c.id ? 'var(--accent-violet)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '13px', fontWeight: activeCompanyId === c.id ? 600 : 500,
                }}
                onMouseEnter={e => { if (activeCompanyId !== c.id) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                onMouseLeave={e => { if (activeCompanyId !== c.id) e.currentTarget.style.background = 'transparent'; }}
              >
                {c.logo ? (
                  <img src={c.logo} alt={c.name} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Target size={12} /></div>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || 'Unnamed Company'}</span>
              </div>
            ))}
            
            <div style={{ margin: '8px 0', borderTop: '1px solid var(--glass-border)' }} />
            
            <Link href="/brand" style={{ textDecoration: 'none' }} onClick={() => {
              setShowDropdown(false);
              const newCompany = {
                id: Date.now().toString(),
                name: '',
                context: '',
                font: 'Inter',
                colors: ['#7c3aed'],
                logo: null
              };
              const updated = [...companies, newCompany];
              localStorage.setItem('ai_marketing_companies', JSON.stringify(updated));
              localStorage.setItem('ai_marketing_active_company_id', newCompany.id);
              
              fetch('/api/brand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  context: newCompany.context,
                  font: newCompany.font,
                  color: newCompany.colors,
                  name: newCompany.name
                })
              });
              
              window.dispatchEvent(new Event('brand-updated'));
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px',
                color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Plus size={14} /> Add New Company
              </div>
            </Link>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 8px 12px' }}>
          Main
        </div>
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '12px', marginBottom: '4px',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(79,70,229,0.15) 100%)'
                    : 'transparent',
                  border: isActive ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                  color: isActive ? 'var(--accent-violet)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '14px', fontWeight: isActive ? 600 : 500,
                }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary)';
                      (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                      (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      style={{
                        position: 'absolute', left: '12px', width: '3px', height: '20px',
                        background: 'linear-gradient(to bottom, #7c3aed, #06b6d4)',
                        borderRadius: '2px',
                      }}
                    />
                  )}
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.href === '/studio' && (
                    <span className="badge badge-violet" style={{ marginLeft: 'auto', fontSize: '9px' }}>AI</span>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px' }}>
        {bottomItems.map(item => {
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '12px',
                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary)'; (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)'; }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}

        {/* User avatar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 12px', borderRadius: '12px', marginTop: '8px',
          background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>V</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Vinith</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={9} color="#7c3aed" />
              Pro Plan
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
