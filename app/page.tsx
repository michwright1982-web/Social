'use client';

import { Sparkles, ArrowRight, Wand2, PenLine, Target, KeyRound, PlayCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Navbar */}
      <header style={{ 
        padding: '24px 48px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        width: '100%', 
        maxWidth: '1400px', 
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '20px', color: 'var(--text-primary)' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={16} color="white" />
          </div>
          AI Marketing Hub
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          <a href="#features" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}>Features</a>
          <a href="#pricing" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}>Pricing</a>
          <div style={{ width: '1px', height: '16px', background: 'var(--glass-border)' }} />
          <Link href="/login" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
            Log in
          </Link>
          <Link href="/signup" style={{ textDecoration: 'none' }}>
            <button style={{ 
              padding: '8px 16px', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--glass-border)', 
              borderRadius: '8px', 
              fontSize: '14px', 
              fontWeight: 600, 
              color: 'var(--text-primary)', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
            >
              Sign up free
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '120px 24px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: '800px' }}
        >
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            border: '1px solid var(--glass-border)', borderRadius: '9999px', 
            padding: '6px 16px', fontSize: '13px', fontWeight: 600, 
            color: 'var(--accent-cyan)', marginBottom: '32px', 
            background: 'var(--bg-card)', backdropFilter: 'blur(10px)'
          }}>
            <Sparkles size={14} /> Introducing v2.0 AI Generation
          </div>
          
          <h1 style={{ 
            fontSize: '64px', fontWeight: 800, color: 'var(--text-primary)', 
            lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '24px', 
            fontFamily: "'Outfit', sans-serif" 
          }}>
            Scale your brand with <br />
            <span style={{ 
              background: 'var(--gradient-brand)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>
              Intelligent Marketing
            </span>
          </h1>
          
          <p style={{ 
            fontSize: '20px', color: 'var(--text-secondary)', lineHeight: 1.6, 
            marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' 
          }}>
            The all-in-one workspace to generate stunning visuals, craft platform-specific copy, and manage your entire brand identity effortlessly.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <button style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '16px 32px', background: 'var(--gradient-brand)', 
                border: 'none', borderRadius: '12px', fontSize: '16px', 
                fontWeight: 600, color: '#ffffff', cursor: 'pointer', 
                boxShadow: '0 8px 32px rgba(124,58,237,0.4)', transition: 'transform 0.2s' 
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Start Free Trial <ArrowRight size={18} />
              </button>
            </Link>
            <button style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '16px 32px', background: 'transparent', 
              border: '1px solid var(--glass-border)', borderRadius: '12px', 
              fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', 
              cursor: 'pointer', transition: 'background 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <PlayCircle size={20} /> Watch Demo
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '80px 24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--glass-border)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', fontFamily: "'Outfit', sans-serif" }}>Everything you need</h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Powerful tools designed for modern marketing teams.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { icon: Wand2, title: 'Creative Studio', desc: 'Generate and iterate on visuals matching your brand style instantly.', color: '#a78bfa' },
              { icon: PenLine, title: 'Unified Editor', desc: 'Craft captions optimized for LinkedIn, Twitter, and Instagram.', color: '#38bdf8' },
              { icon: Target, title: 'Brand Context', desc: 'Teach the AI your exact brand voice, fonts, and hex codes.', color: '#f472b6' },
              { icon: KeyRound, title: 'Secure Vault', desc: 'Store API keys and credentials locally and securely.', color: '#34d399' }
            ].map((feature, idx) => (
              <div key={idx} style={{ 
                background: 'var(--bg-card)', border: '1px solid var(--glass-border)', 
                borderRadius: '16px', padding: '32px', backdropFilter: 'blur(10px)' 
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `rgba(255,255,255,0.05)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
                  <feature.icon size={24} color={feature.color} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>{feature.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '120px 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', fontFamily: "'Outfit', sans-serif" }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Start for free, scale when you need to.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
            
            {/* Pro Plan */}
            <div style={{ 
              background: 'var(--bg-card)', border: '1px solid var(--glass-border)', 
              borderRadius: '24px', padding: '48px', backdropFilter: 'blur(10px)' 
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Pro</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Perfect for solo creators and small teams.</p>
              <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '32px' }}>$49<span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>/mo</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['Up to 2 Workspaces', 'Connect your preferred AI provider', 'Post to multiple social media', 'Full Creative Studio Access'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={18} color="#a78bfa" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Get Started
                </button>
              </Link>
            </div>

            {/* Agency Plan */}
            <div style={{ 
              background: 'var(--bg-card)', border: '1px solid var(--glass-border)', 
              borderRadius: '24px', padding: '48px', backdropFilter: 'blur(20px)',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--gradient-brand)' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Agency</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>For scaling marketing teams.</p>
              <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '32px' }}>$59<span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>/mo</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['Unlimited Workspaces', 'Connect your preferred AI provider', 'Post to multiple social media', 'Priority Support'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                    <CheckCircle2 size={18} color="#06b6d4" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '14px', background: 'var(--gradient-brand)', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, color: '#ffffff', cursor: 'pointer' }}>
                  Start 14-Day Free Trial
                </button>
              </Link>
            </div>
            
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '48px 24px', background: 'rgba(0,0,0,0.4)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
            <Sparkles size={16} color="#a78bfa" />
            AI Marketing Hub
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            © 2026 AI Marketing Hub Inc. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Twitter</a>
            <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>LinkedIn</a>
            <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
