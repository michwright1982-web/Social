'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Wand2,
  PenLine,
  KeyRound,
  BarChart2,
  Settings,
  Zap,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/studio', label: 'Creative Studio', icon: Wand2 },
  { href: '/editor', label: 'Unified Editor', icon: PenLine },
  { href: '/vault', label: 'Secure Vault', icon: KeyRound },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(124,58,237,0.12)' }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} className="glow-violet">
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '15px', color: '#f1f5f9' }}>
              AI Marketing
            </div>
            <div style={{ fontSize: '10px', color: '#7c3aed', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Hub
            </div>
          </div>
        </motion.div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 8px 12px' }}>
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
                  color: isActive ? '#a78bfa' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '14px', fontWeight: isActive ? 600 : 500,
                }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(124,58,237,0.08)';
                      (e.currentTarget as HTMLDivElement).style.color = '#94a3b8';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                      (e.currentTarget as HTMLDivElement).style.color = '#64748b';
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
                color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(124,58,237,0.08)'; (e.currentTarget as HTMLDivElement).style.color = '#94a3b8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = '#64748b'; }}
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
          background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>V</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Vinith</div>
            <div style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={9} color="#7c3aed" />
              Pro Plan
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
