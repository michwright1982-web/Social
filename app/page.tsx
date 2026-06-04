'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  TrendingUp, Image, Send, Users,
  Wand2, ChevronRight, Inbox,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, XSocialIcon } from '@/components/SocialIcons';
import Link from 'next/link';
import { loadFromImageDB } from '@/lib/image-db';

const statCardsTemplate = [
  { label: 'Total Campaigns', icon: TrendingUp, color: '#7c3aed', key: 'campaigns' },
  { label: 'Images Generated', icon: Image, color: '#06b6d4', key: 'images' },
  { label: 'Posts Published', icon: Send, color: '#10b981', key: 'posts' },
  { label: 'Audience Reach', icon: Users, color: '#ec4899', key: 'reach' },
];

const platformsConfig = [
  { id: 'facebook', name: 'Facebook', icon: <FacebookIcon size={14} /> },
  { id: 'instagram', name: 'Instagram', icon: <InstagramIcon size={14} /> },
  { id: 'x', name: 'X (Twitter)', icon: <XSocialIcon size={14} /> },
  { id: 'linkedin', name: 'LinkedIn', icon: <LinkedinIcon size={14} /> },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const [stats, setStats] = useState({ campaigns: 0, images: 0, posts: 0, reach: 0 });
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, { status: string }>>({});

  const loadDashboardData = async () => {
    const activeId = localStorage.getItem('ai_marketing_active_company_id') || 'default';
    
    // Load images count
    try {
      const history = await loadFromImageDB(`creative_studio_history_${activeId}`);
      let imageCount = 0;
      if (Array.isArray(history)) {
        imageCount = history.reduce((acc, run) => acc + (run.images?.length || 0), 0);
      }
      setStats(s => ({ ...s, images: imageCount, campaigns: Array.isArray(history) ? history.length : 0 }));
    } catch {}

    // Load auth status
    try {
      const res = await fetch(`/api/auth/status?companyId=${activeId}`);
      if (res.ok) {
        const data = await res.json();
        setPlatformStatuses(data);
      } else {
        setPlatformStatuses({});
      }
    } catch {
      setPlatformStatuses({});
    }
  };

  useEffect(() => {
    loadDashboardData();
    window.addEventListener('brand-updated', loadDashboardData);
    return () => window.removeEventListener('brand-updated', loadDashboardData);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Dashboard" subtitle="Welcome — start by creating your first campaign" />
        <div className="page-content">
          <motion.div variants={container} initial="hidden" animate="show">

            {/* Stats Row */}
            <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {statCardsTemplate.map((stat) => {
                const Icon = stat.icon;
                const value = stats[stat.key as keyof typeof stats] || 0;
                return (
                  <div key={stat.label} className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={stat.color} />
                      </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", letterSpacing: '-1px' }}>
                      {value > 0 ? value : '—'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
                  </div>
                );
              })}
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

              {/* Campaigns Empty State */}
              <motion.div variants={item} className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Campaigns</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Your latest marketing efforts</p>
                  </div>
                  <Link href="/studio" style={{ textDecoration: 'none' }}>
                    <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                      View All <ChevronRight size={12} />
                    </button>
                  </Link>
                </div>

                <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Inbox size={22} color="var(--accent-violet)" />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>No campaigns yet</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '280px', lineHeight: 1.6 }}>
                    Create your first campaign in the Creative Studio to see it appear here.
                  </div>
                  <Link href="/studio" style={{ textDecoration: 'none' }}>
                    <button className="btn-primary" style={{ fontSize: '13px', padding: '10px 20px' }}>
                      <Wand2 size={14} /> Create Campaign
                    </button>
                  </Link>
                </div>
              </motion.div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Quick Actions */}
                <motion.div variants={item} className="glass-card" style={{ padding: '20px' }}>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Quick Actions</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Link href="/studio" style={{ textDecoration: 'none' }}>
                      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        <Wand2 size={15} /> Generate New Content
                      </button>
                    </Link>
                    <Link href="/editor" style={{ textDecoration: 'none' }}>
                      <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                        <Send size={15} /> Publish Campaign
                      </button>
                    </Link>
                    <Link href="/vault" style={{ textDecoration: 'none' }}>
                      <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                        Connect Social Account
                      </button>
                    </Link>
                  </div>
                </motion.div>

                {/* Platform Health */}
                <motion.div variants={item} className="glass-card" style={{ padding: '20px' }}>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Platform Health</h2>
                  {platformsConfig.map(p => {
                    const isConnected = platformStatuses[p.id]?.status === 'valid';
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {p.icon}
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{p.name}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: isConnected ? '#10b981' : 'var(--text-muted)', fontWeight: 500 }}>
                          {isConnected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                    );
                  })}
                  <Link href="/vault" style={{ textDecoration: 'none' }}>
                    <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '8px', fontSize: '12px', padding: '8px' }}>
                      Manage Connections
                    </button>
                  </Link>
                </motion.div>

              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
