'use client';

import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  TrendingUp, Users, Eye, Heart, Share2, MessageCircle,
  ArrowUpRight, ArrowDownRight,
  BarChart2, Calendar,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, XSocialIcon } from '@/components/SocialIcons';

const overallStats = [
  { label: 'Total Impressions', value: '2.4M', change: '+18.3%', up: true, icon: Eye, color: '#7c3aed' },
  { label: 'Total Reach', value: '142K', change: '+12.5%', up: true, icon: Users, color: '#06b6d4' },
  { label: 'Engagement Rate', value: '4.8%', change: '+0.6%', up: true, icon: Heart, color: '#ec4899' },
  { label: 'Click-Through Rate', value: '2.1%', change: '-0.3%', up: false, icon: TrendingUp, color: '#f59e0b' },
];

const platformStats = [
  { platform: 'Facebook', icon: FacebookIcon, color: '#1877F2', reach: '54K', engagement: '3.2%', impressions: '820K', posts: 18, growth: '+8%' },
  { platform: 'Instagram', icon: InstagramIcon, color: '#E1306C', reach: '62K', engagement: '6.8%', impressions: '1.1M', posts: 24, growth: '+22%' },
  { platform: 'X (Twitter)', icon: XSocialIcon, color: '#ffffff', reach: '18K', engagement: '2.1%', impressions: '280K', posts: 31, growth: '+4%' },
  { platform: 'LinkedIn', icon: LinkedinIcon, color: '#0A66C2', reach: '8K', engagement: '5.4%', impressions: '210K', posts: 12, growth: '+15%' },
];

const topCampaigns = [
  { name: 'New Feature Reveal', platform: 'All', reach: '52K', engagement: '7.2%', status: 'top' },
  { name: 'Summer Product Launch', platform: 'Instagram', reach: '24.5K', engagement: '5.9%', status: 'top' },
  { name: 'Brand Awareness Q2', platform: 'Facebook', reach: '18.2K', engagement: '4.1%', status: 'normal' },
  { name: 'Customer Stories', platform: 'LinkedIn', reach: '6.1K', engagement: '8.3%', status: 'top' },
];

// Fake bar data for weekly chart
const weeklyData = [
  { day: 'Mon', impressions: 62, reach: 38 },
  { day: 'Tue', impressions: 45, reach: 28 },
  { day: 'Wed', impressions: 78, reach: 52 },
  { day: 'Thu', impressions: 91, reach: 64 },
  { day: 'Fri', impressions: 55, reach: 40 },
  { day: 'Sat', impressions: 38, reach: 22 },
  { day: 'Sun', impressions: 29, reach: 18 },
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
                    background: i === 1 ? 'rgba(124,58,237,0.2)' : 'rgba(15,22,36,0.6)',
                    border: i === 1 ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(71,85,105,0.2)',
                    color: i === 1 ? '#a78bfa' : '#64748b',
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
                      <span className={stat.up ? 'badge badge-green' : 'badge badge-red'} style={{ fontSize: '10px', padding: '3px 8px' }}>
                        {stat.up ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />} {stat.change}
                      </span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#f1f5f9', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.5px' }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontWeight: 500 }}>{stat.label}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Weekly Chart + Platform Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', marginBottom: '24px' }}>

              {/* Bar Chart */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card"
                style={{ padding: '24px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0' }}>Weekly Performance</h2>
                    <p style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Impressions vs. Reach (in thousands)</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#7c3aed' }} /> Impressions
                    </span>
                    <span style={{ fontSize: '11px', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#06b6d4' }} /> Reach
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px' }}>
                  {weeklyData.map((day, i) => (
                    <motion.div
                      key={day.day}
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}
                    >
                      <div style={{ width: '100%', display: 'flex', gap: '3px', alignItems: 'flex-end', flex: 1, justifyContent: 'center' }}>
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: i * 0.08 + 0.2, duration: 0.5 }}
                          style={{ width: '12px', height: `${day.impressions}%`, background: 'linear-gradient(to top, #7c3aed, rgba(124,58,237,0.4))', borderRadius: '4px 4px 0 0', transformOrigin: 'bottom', minHeight: '4px' }}
                        />
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: i * 0.08 + 0.3, duration: 0.5 }}
                          style={{ width: '12px', height: `${day.reach}%`, background: 'linear-gradient(to top, #06b6d4, rgba(6,182,212,0.4))', borderRadius: '4px 4px 0 0', transformOrigin: 'bottom', minHeight: '4px' }}
                        />
                      </div>
                      <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>{day.day}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Top Campaigns */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card"
                style={{ padding: '20px' }}
              >
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={14} color="#7c3aed" /> Top Campaigns
                </h2>
                {topCampaigns.map((c, i) => (
                  <motion.div
                    key={c.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.4 }}
                    style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: i < topCampaigns.length - 1 ? '1px solid rgba(124,58,237,0.07)' : 'none' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{c.name}</div>
                        <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{c.platform}</div>
                      </div>
                      {c.status === 'top' && <span className="badge badge-violet" style={{ fontSize: '9px' }}>🏆 Top</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa' }}>{c.reach}</div>
                        <div style={{ fontSize: '9px', color: '#475569' }}>Reach</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>{c.engagement}</div>
                        <div style={{ fontSize: '9px', color: '#475569' }}>Engagement</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0' }}>Platform Breakdown</h2>
                <p style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Performance by social network</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
                      {['Platform', 'Posts', 'Impressions', 'Reach', 'Engagement', 'Growth'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {platformStats.map((p, i) => {
                      const Icon = p.icon;
                      return (
                        <motion.tr
                          key={p.platform}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1 + 0.5 }}
                          style={{ borderBottom: i < platformStats.length - 1 ? '1px solid rgba(124,58,237,0.06)' : 'none', cursor: 'pointer' }}
                          whileHover={{ backgroundColor: 'rgba(124,58,237,0.04)' }}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${p.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={15} color={p.color} />
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{p.platform}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>{p.posts}</td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>{p.impressions}</td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#a78bfa', fontWeight: 700 }}>{p.reach}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="badge badge-green" style={{ fontSize: '10px' }}>{p.engagement}</span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="badge badge-cyan" style={{ fontSize: '10px' }}><ArrowUpRight size={8} /> {p.growth}</span>
                          </td>
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
