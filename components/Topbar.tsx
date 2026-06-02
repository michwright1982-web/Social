'use client';

import { Bell, Search, Plus, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <div className="topbar">
      <div style={{ flex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', fontFamily: "'Outfit', sans-serif" }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{subtitle}</p>}
        </motion.div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', color: '#475569' }} />
        <input
          type="text"
          placeholder="Search campaigns..."
          style={{
            background: 'rgba(15,22,36,0.8)',
            border: '1px solid rgba(124,58,237,0.15)',
            borderRadius: '10px',
            padding: '8px 12px 8px 34px',
            color: '#94a3b8',
            fontSize: '13px',
            fontFamily: "'Inter', sans-serif",
            outline: 'none',
            width: '220px',
            transition: 'all 0.3s ease',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(124,58,237,0.5)';
            e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(124,58,237,0.15)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Credits badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px', borderRadius: '10px',
        background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
        fontSize: '12px', color: '#a78bfa', fontWeight: 600,
        cursor: 'pointer',
      }}>
        <Zap size={12} />
        340 Credits
      </div>

      {/* Notification */}
      <button style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: 'rgba(15,22,36,0.8)', border: '1px solid rgba(124,58,237,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative', color: '#64748b',
        transition: 'all 0.2s ease',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
      >
        <Bell size={15} />
        <span style={{
          position: 'absolute', top: '6px', right: '6px',
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#7c3aed',
        }} />
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
