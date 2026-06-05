'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  ExternalLink,
  ChevronRight,
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, XSocialIcon } from '@/components/SocialIcons';
import Link from 'next/link';
import Image from 'next/image';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook / Instagram', icon: <FacebookIcon size={16} />, color: '#1877F2' },
  { id: 'x', label: 'X (Twitter)', icon: <XSocialIcon size={16} />, color: 'currentColor' },
  { id: 'linkedin', label: 'LinkedIn', icon: <LinkedinIcon size={16} />, color: '#0A66C2' },
];

const GUIDES: Record<string, { title: string; desc: string; steps: { title: string; content: React.ReactNode }[]; img: string }> = {
  facebook: {
    title: 'Configure Facebook & Instagram App',
    desc: 'Create an app in the Meta Developer portal to enable cross-posting to Facebook Pages and Instagram Business accounts.',
    img: '/guides/fb.png',
    steps: [
      { title: 'Create a Meta Developer Account', content: 'Go to developers.facebook.com and log in with your Facebook account. Click "My Apps" and create a new app.' },
      { title: 'Select App Type', content: 'Choose "Business" as your app type to get access to the Graph API and Instagram Graph API.' },
      { title: 'Find your Credentials', content: 'Navigate to App Settings > Basic. Here you will find your App ID and App Secret. You will need to reveal the App Secret.' },
      { title: 'Configure OAuth Settings', content: 'Add Facebook Login to your products. Set the Valid OAuth Redirect URIs to exactly: http://localhost:3000/api/auth/facebook/callback' }
    ]
  },
  x: {
    title: 'Configure X (Twitter) App',
    desc: 'Create an app in the X Developer portal to enable automated posting using OAuth 2.0 with PKCE.',
    img: '/guides/x.png',
    steps: [
      { title: 'Create a Developer Account', content: 'Go to developer.x.com and apply for a developer account. A free (Free/Basic) tier is sufficient for posting.' },
      { title: 'Create a Project & App', content: 'Create a new project and add an App inside it. Give it a unique name.' },
      { title: 'Set up User Authentication', content: 'Under User authentication settings, enable OAuth 2.0. Set the App permissions to "Read and Write". Set the Callback URI to: http://localhost:3000/api/auth/x/callback' },
      { title: 'Get Client ID and Secret', content: 'Under the "Keys and Tokens" tab, locate the OAuth 2.0 Client ID and Client Secret. Regenerate them if necessary and copy them.' }
    ]
  },
  linkedin: {
    title: 'Configure LinkedIn App',
    desc: 'Create a LinkedIn developer app to post to personal profiles or company pages.',
    img: '/guides/li.png',
    steps: [
      { title: 'Access Developer Portal', content: 'Go to developer.linkedin.com and click "Create app".' },
      { title: 'Link a Company Page', content: 'You must link the app to an existing LinkedIn Company Page. If you don\'t have one, create a placeholder page first.' },
      { title: 'Request Products', content: 'Under the Products tab, request access to "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect".' },
      { title: 'Get Credentials', content: 'Go to the Auth tab. Here you will see your Client ID and Client Secret. Add the redirect URL: http://localhost:3000/api/auth/linkedin/callback' }
    ]
  }
};

function GuideContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Default to facebook if no param
  const initialPlatform = searchParams.get('platform') || 'facebook';
  const [activeTab, setActiveTab] = useState(initialPlatform);

  // Sync state to URL if it changes
  useEffect(() => {
    if (searchParams.get('platform') !== activeTab) {
      router.replace(`/setup-guide?platform=${activeTab}`);
    }
  }, [activeTab, searchParams, router]);

  const guide = GUIDES[activeTab];
  const activeColor = PLATFORMS.find(p => p.id === activeTab)?.color || '#7c3aed';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Social Media Setup Guide" subtitle="Learn how to obtain Developer API keys for your accounts" />
        
        <div className="page-content">
          <div className="glass-card" style={{ padding: '8px', marginBottom: '24px', display: 'flex', gap: '8px' }}>
            {PLATFORMS.map(p => {
              const isActive = activeTab === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveTab(p.id)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '12px',
                    border: 'none', cursor: 'pointer',
                    background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                    color: isActive ? p.color : '#64748b',
                    fontFamily: "'Saira', sans-serif", fontSize: '13px', fontWeight: 600,
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {p.icon} {p.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'start' }}>
            
            {/* Left: Images and Overview */}
            <motion.div
              key={activeTab + '-left'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div className="glass-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>{guide.title}</h2>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>{guide.desc}</p>
                
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative', aspectRatio: '1/1' }}>
                  <Image 
                    src={guide.img} 
                    alt={`${activeTab} developer portal screenshot`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>

              <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(6,182,212,0.05) 100%)', borderColor: 'rgba(16,185,129,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Shield size={20} color="#10b981" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>Ready to connect?</h3>
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.6 }}>
                  Once you have your Client ID and Client Secret, return to the Secure Vault to save them and authenticate your account.
                </p>
                <Link href="/vault" style={{ textDecoration: 'none' }}>
                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '14px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <Lock size={16} /> Go to Vault to Connect <ArrowRight size={16} />
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Right: Step by step instructions */}
            <motion.div
              key={activeTab + '-right'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-card"
              style={{ padding: '24px' }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color={activeColor} /> Step-by-Step Instructions
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {guide.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', background: `rgba(255,255,255,0.05)`, border: `1px solid ${activeColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: activeColor }}>
                      {i + 1}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>{step.title}</h4>
                      <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>{step.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <a href={
                  activeTab === 'facebook' ? 'https://developers.facebook.com/' :
                  activeTab === 'x' ? 'https://developer.x.com/' :
                  'https://developer.linkedin.com/'
                } target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                    Open Developer Portal <ExternalLink size={14} />
                  </button>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetupGuidePage() {
  return (
    <Suspense fallback={<div className="app-layout"><Sidebar /><div className="main-content"><Topbar title="Loading..." /></div></div>}>
      <GuideContent />
    </Suspense>
  );
}
