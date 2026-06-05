'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, Shield, PlayCircle } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      const { saveToImageDB } = await import('@/lib/image-db');
      await saveToImageDB('ai_marketing_companies', [{
        id: 'default',
        name: `${name.split(' ')[0]}'s Company`,
      }]);
      localStorage.setItem('ai_marketing_active_company_id', 'default');

      window.location.href = '/setup-guide';
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      fontFamily: "system-ui, -apple-system, sans-serif",
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
    }}>
      {/* Top Navbar */}
      <header style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)' }}>
          <Sparkles size={20} color="#a78bfa" />
          AI Marketing Hub
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer' }}>Quick Dashboard Demo</span>
          <button style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s' }}>
            Launch Console
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px' }}>
        <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', alignItems: 'center', gap: '80px', flexWrap: 'wrap' }}>
          
          {/* Left Column */}
          <div style={{ flex: '1 1 500px', maxWidth: '600px' }}>
            <div style={{ display: 'inline-block', border: '1px solid var(--glass-border)', borderRadius: '9999px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '24px', background: 'var(--bg-card)' }}>
              Focus on AI-Driven Marketing Automation
            </div>
            <h1 style={{ fontSize: '56px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '24px', fontFamily: "'Saira', sans-serif" }}>
              Multi-Channel AI Marketing & Creative Studio
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '48px', maxWidth: '90%' }}>
              Connect your brand, generate stunning variations using AI, craft platform-specific captions, and publish everywhere without leaving your dashboard.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '48px' }}>
              {[
                'Visual AI Style Generator',
                'Unified Content Editor',
                'Automated Brand Context',
                'Robust Analytics & Logs'
              ].map((feat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(167, 139, 250, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>{feat}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', background: 'var(--gradient-brand)', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, color: '#ffffff', cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.3)', transition: 'all 0.2s' }}>
                Start Free Trial <ArrowRight size={16} />
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', background: 'transparent', border: '1px solid transparent', fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <PlayCircle size={18} /> Watch Demo
              </button>
            </div>
          </div>

          {/* Right Column: Auth Card */}
          <div style={{ flex: '1 1 400px', maxWidth: '480px', marginLeft: 'auto' }}>
            <div style={{ 
              background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', 
              padding: '40px', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', position: 'relative',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', letterSpacing: '0.05em' }}>
                v1.0.0
              </div>
              
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Create account</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '32px' }}>Enter your details to initialize your SaaS workspace</p>

              {errorMsg && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '24px' }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSignup}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Doe"
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Business Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }}
                  />
                </div>
                
                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', background: 'var(--bg-secondary)', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ width: '100%', padding: '14px', background: 'var(--gradient-brand)', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Sign Up'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>OR QUICK ACCESS</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
              </div>

              <Link href="/login" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                  <Shield size={16} color="var(--text-muted)" /> Sign in instead
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '24px 48px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>© 2026 AI Marketing Hub Inc. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Terms of Service</a>
            <a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
