'use client';

import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  TrendingUp, Users, Eye, Heart,
  ArrowUpRight, BarChart2, Calendar, LineChart,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, XSocialIcon } from '@/components/SocialIcons';

const overallStats = [
  { label: 'Total Impressions', icon: Eye, color: '#7c3aed' },
  { label: 'Total Reach', icon: Users, color: '#06b6d4' },
  { label: 'Engagement Rate', icon: Heart, color: '#ec4899' },
  { label: 'Click-Through Rate', icon: TrendingUp, color: '#f59e0b' },
];

const platforms = [
  { platform: 'Facebook', icon: FacebookIcon, color: '#1877F2' },
  { platform: 'Instagram', icon: InstagramIcon, color: '#E1306C' },
  { platform: 'X (Twitter)', icon: XSocialIcon, color: '#ffffff' },
  { platform: 'LinkedIn', icon: LinkedinIcon, color: '#0A66C2' },
];

export default function AnalyticsPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Analytics" subtitle="Track performance across all platforms" />
        <div className="page-content">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >

            {/* Date Range */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '8px' }}>
              {['7 Days', '30 Days', '90 Days', 'All Time'].map((range, i) => (
                <button
                  key={range}
                  style={{
                    padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    background: i === 1 ? 'rgba(124,58,237,0.2)' : 'var(--input-bg)',
                    border: i === 1 ? '1px solid rgba(124,58,237,0.4)' : '1px solid var(--input-border)',
                    color: i === 1 ? '#a78bfa' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                  id={`range-${range.replace(' ', '-')}`}
                >
                  {range}
                </button>
              ))}
              <button className="btn-ghost" style={{ padding: '7px 12px', fontSize: '12px' }}>
                <Calendar size={12} /> Custom
              </button>
            </div>

            {/* Overview Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
              {overallStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card"
                    style={{ padding: '18px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color={stat.color} />
                      </div>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.5px' }}>—</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', fontWeight: 500 }}>{stat.label}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Chart Area + Top Campaigns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', marginBottom: '24px' }}>

              {/* Chart placeholder */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card"
                style={{ padding: '24px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Weekly Performance</h2>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Impressions vs. Reach over time</p>
                  </div>
                </div>
                <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', borderRadius: '12px', border: '1px dashed var(--input-border)', background: 'rgba(124,58,237,0.03)' }}>
                  <LineChart size={28} color="rgba(124,58,237,0.3)" />
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '220px', lineHeight: 1.6 }}>
                    Chart will appear once you publish campaigns and connect your social accounts.
                  </p>
                </div>
              </motion.div>

              {/* Top Campaigns placeholder */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card"
                style={{ padding: '20px' }}
              >
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={14} color="#7c3aed" /> Top Campaigns
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0', gap: '10px' }}>
                  <BarChart2 size={24} color="rgba(124,58,237,0.25)" />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                    Top performing campaigns will appear here after publishing.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Platform Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card"
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Platform Breakdown</h2>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Performance by social network</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      {['Platform', 'Posts', 'Impressions', 'Reach', 'Engagement', 'Growth'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {platforms.map((p, i) => {
                      const Icon = p.icon;
                      return (
                        <motion.tr
                          key={p.platform}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1 + 0.5 }}
                          style={{ borderBottom: i < platforms.length - 1 ? '1px solid var(--glass-border)' : 'none' }}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${p.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={15} color={p.color} />
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.platform}</span>
                            </div>
                          </td>
                          {['—', '—', '—', '—', '—'].map((val, vi) => (
                            <td key={vi} style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{val}</td>
                          ))}
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
