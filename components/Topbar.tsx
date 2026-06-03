'use client';

import { Search, Plus, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('ai_marketing_theme') as 'dark' | 'light';
    if (savedTheme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('ai_marketing_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    window.dispatchEvent(new Event('theme-updated'));
  };

  return (
    <div className="topbar">
      <div style={{ flex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>{subtitle}</p>}
        </motion.div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search campaigns..."
          style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            borderRadius: '10px',
            padding: '8px 12px 8px 34px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontFamily: "'Inter', sans-serif",
            outline: 'none',
            width: '220px',
            transition: 'all 0.3s ease',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(124,58,237,0.5)';
            e.target.style.boxShadow = '0 0 0 3px var(--input-focus-shadow)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--input-border)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Theme Toggle */}
      <button 
        onClick={toggleTheme}
        style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'var(--input-bg)', border: '1px solid var(--input-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)',
          overflow: 'hidden', position: 'relative',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.color = 'var(--accent-violet)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0,   scale: 1,   opacity: 1 }}
            exit={{    rotate:  90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className="no-theme-transition"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </motion.span>
        </AnimatePresence>
      </button>


      {/* New Campaign CTA */}
      <Link href="/studio" style={{ textDecoration: 'none' }}>
        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
          <Plus size={14} />
          New Campaign
        </button>
      </Link>
    </div>
  );
}
