'use client';

import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  TrendingUp, Image, Send, Users,
  Wand2, ChevronRight, Inbox,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, XSocialIcon } from '@/components/SocialIcons';
import Link from 'next/link';

const statCards = [
  { label: 'Total Campaigns', icon: TrendingUp, color: '#7c3aed' },
  { label: 'Images Generated', icon: Image, color: '#06b6d4' },
  { label: 'Posts Published', icon: Send, color: '#10b981' },
  { label: 'Audience Reach', icon: Users, color: '#ec4899' },
];

const platformHealth = [
  { name: 'Facebook', icon: <FacebookIcon size={14} /> },
  { name: 'Instagram', icon: <InstagramIcon size={14} /> },
  { name: 'X (Twitter)', icon: <XSocialIcon size={14} /> },
  { name: 'LinkedIn', icon: <LinkedinIcon size={14} /> },
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
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Dashboard" subtitle="Welcome — start by creating your first campaign" />
        <div className="page-content">
          <motion.div variants={container} initial="hidden" animate="show">

            {/* Stats Row */}
            <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={stat.color} />
                      </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#475569', fontFamily: "'Outfit', sans-serif", letterSpacing: '-1px' }}>
                      —
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
                  </div>
                );
              })}
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

              {/* Campaigns Empty State */}
              <motion.div variants={item} className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(124,58,237,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>Recent Campaigns</h2>
                    <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>Your latest marketing efforts</p>
                  </div>
                  <Link href="/studio" style={{ textDecoration: 'none' }}>
                    <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                      View All <ChevronRight size={12} />
                    </button>
                  </Link>
                </div>

                <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Inbox size={22} color="#7c3aed" />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>No campaigns yet</div>
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '20px', maxWidth: '280px', lineHeight: 1.6 }}>
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
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '14px' }}>Quick Actions</h2>
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
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '14px' }}>Platform Health</h2>
                  {platformHealth.map(p => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.icon}
                        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{p.name}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>Not connected</span>
                    </div>
                  ))}
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
