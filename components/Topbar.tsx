'use client';

import { Search, Plus } from 'lucide-react';
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
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Saira', sans-serif" }}>{title}</h1>
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
            fontFamily: "'Saira', sans-serif",
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
