'use client';

import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  TrendingUp, Image, Send, Users, ArrowUpRight, Clock,
  CheckCircle2, AlertCircle, Loader2, Sparkles, Wand2, ChevronRight,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, XSocialIcon } from '@/components/SocialIcons';
import Link from 'next/link';

const stats = [
  { label: 'Total Campaigns', value: '24', change: '+12%', trend: 'up', icon: TrendingUp, color: '#7c3aed' },
  { label: 'Images Generated', value: '312', change: '+28%', trend: 'up', icon: Image, color: '#06b6d4' },
  { label: 'Posts Published', value: '89', change: '+5%', trend: 'up', icon: Send, color: '#10b981' },
  { label: 'Audience Reach', value: '142K', change: '+19%', trend: 'up', icon: Users, color: '#ec4899' },
];

const recentCampaigns = [
  {
    id: 1, name: 'Summer Product Launch', status: 'published',
    platforms: ['facebook', 'instagram', 'linkedin'], date: '2h ago',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=60&h=60&fit=crop',
    reach: '24.5K',
  },
  {
    id: 2, name: 'Brand Awareness Q2', status: 'scheduled',
    platforms: ['instagram', 'x'], date: 'In 3h',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=60&h=60&fit=crop',
    reach: '18.2K',
  },
  {
    id: 3, name: 'Flash Sale Weekend', status: 'generating',
    platforms: ['facebook', 'instagram', 'x', 'linkedin'], date: 'Just now',
    image: null,
    reach: '—',
  },
  {
    id: 4, name: 'Customer Stories', status: 'error',
    platforms: ['linkedin'], date: '1d ago',
    image: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=60&h=60&fit=crop',
    reach: '6.1K',
  },
  {
    id: 5, name: 'New Feature Reveal', status: 'published',
    platforms: ['facebook', 'instagram', 'x', 'linkedin'], date: '3d ago',
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=60&h=60&fit=crop',
    reach: '52K',
  },
];

const statusConfig: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  published: { label: 'Published', badgeClass: 'badge badge-green', icon: <CheckCircle2 size={10} /> },
  scheduled: { label: 'Scheduled', badgeClass: 'badge badge-violet', icon: <Clock size={10} /> },
  generating: { label: 'Generating', badgeClass: 'badge badge-amber', icon: <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> },
  error: { label: 'Error', badgeClass: 'badge badge-red', icon: <AlertCircle size={10} /> },
};

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <FacebookIcon size={12} />,
  instagram: <InstagramIcon size={12} />,
  x: <XSocialIcon size={12} />,
  linkedin: <LinkedinIcon size={12} />,
};

const aiActivity = [
  { action: 'Generated 6 variations', campaign: 'Summer Product Launch', time: '5m ago', icon: Wand2, color: '#7c3aed' },
  { action: 'Captions created (4 platforms)', campaign: 'Brand Awareness Q2', time: '1h ago', icon: Sparkles, color: '#06b6d4' },
  { action: 'Published to 4 platforms', campaign: 'New Feature Reveal', time: '3d ago', icon: Send, color: '#10b981' },
  { action: 'Generated 4 variations', campaign: 'Flash Sale Weekend', time: 'Just now', icon: Wand2, color: '#ec4899' },
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
        <Topbar title="Dashboard" subtitle="Welcome back, Vinith — your hub is active" />
        <div className="page-content">
          <motion.div variants={container} initial="hidden" animate="show">

            {/* Stats Row */}
            <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={stat.color} />
                      </div>
                      <span className="badge badge-green" style={{ fontSize: '10px', padding: '3px 8px' }}>
                        <ArrowUpRight size={9} /> {stat.change}
                      </span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', fontFamily: "'Outfit', sans-serif", letterSpacing: '-1px' }} className="count-up">
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
                  </div>
                );
              })}
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

              {/* Campaigns Table */}
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

                <div style={{ padding: '8px 0' }}>
                  {recentCampaigns.map((campaign, i) => {
                    const { label, badgeClass, icon } = statusConfig[campaign.status];
                    return (
                      <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '16px',
                          padding: '14px 24px',
                          borderBottom: i < recentCampaigns.length - 1 ? '1px solid rgba(124,58,237,0.06)' : 'none',
                          cursor: 'pointer', transition: 'background 0.2s',
                        }}
                        whileHover={{ backgroundColor: 'rgba(124,58,237,0.04)' }}
                      >
                        {/* Thumbnail */}
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: campaign.image ? 'transparent' : 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {campaign.image
                            ? <img src={campaign.image} alt={campaign.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                          }
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{campaign.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            {campaign.platforms.map(p => (
                              <span key={p}>{platformIcons[p]}</span>
                            ))}
                            <span style={{ fontSize: '11px', color: '#475569' }}>·</span>
                            <span style={{ fontSize: '11px', color: '#475569' }}>{campaign.date}</span>
                          </div>
                        </div>

                        {/* Reach */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#a78bfa' }}>{campaign.reach}</div>
                          <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>reach</div>
                        </div>

                        {/* Status */}
                        <div style={{ flexShrink: 0 }}>
                          <span className={badgeClass} style={{ fontSize: '10px', gap: '4px' }}>
                            {icon} {label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
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

                {/* AI Activity */}
                <motion.div variants={item} className="glass-card" style={{ padding: '20px' }}>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '14px' }}>AI Activity</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {aiActivity.map((activity, i) => {
                      const Icon = activity.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                        >
                          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${activity.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                            <Icon size={13} color={activity.color} />
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>{activity.action}</div>
                            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{activity.campaign} · {activity.time}</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Platform Health */}
                <motion.div variants={item} className="glass-card" style={{ padding: '20px' }}>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '14px' }}>Platform Health</h2>
                  {[
                    { name: 'Facebook', icon: <FacebookIcon size={14} />, status: 'connected' },
                    { name: 'Instagram', icon: <InstagramIcon size={14} />, status: 'connected' },
                    { name: 'X (Twitter)', icon: <XSocialIcon size={14} />, status: 'pending' },
                    { name: 'LinkedIn', icon: <LinkedinIcon size={14} />, status: 'disconnected' },
                  ].map(p => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.icon}
                        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{p.name}</span>
                      </div>
                      <span className={`status-dot ${p.status}`} />
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
