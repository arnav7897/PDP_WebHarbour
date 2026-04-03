import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, useAnimation } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import AppCard from '../components/apps/AppCard';
import { LoadingGrid, EmptyState } from '../components/ui';
import {
  Search, ArrowRight, Zap, Shield, Package, Star, TrendingUp,
  Users, Download, CheckCircle, Anchor, Code2, Globe, BarChart3,
  Layers, Lock, Rocket, ChevronRight, Sparkles
} from 'lucide-react';

/* ── Scroll-in animation wrapper ── */
function Reveal({ children, delay = 0, direction = 'up', width = "100%" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const initial = direction === 'up' ? { opacity: 0, y: 40 }
    : direction === 'left' ? { opacity: 0, x: -40 }
    : direction === 'right' ? { opacity: 0, x: 40 }
    : { opacity: 0, scale: 0.9 };

  return (
    <motion.div ref={ref} initial={initial}
      style={{ width }}
      animate={inView ? { opacity: 1, y: 0, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: Rocket, title: 'One-Click Publishing',
    desc: 'Ship to thousands of users instantly. CDN-backed delivery worldwide deployed on edge nodes.',
    color: '#2563EB', bg: 'linear-gradient(135deg, #1E3A5F, #2563EB)',
  },
  {
    icon: Shield, title: 'Curated & Verified',
    desc: 'Every app passes human + automated review. Zero malware, zero surprises, 100% trust.',
    color: '#16A34A', bg: 'linear-gradient(135deg, #14532D, #16A34A)',
  },
  {
    icon: BarChart3, title: 'Real-Time Analytics',
    desc: 'Track downloads, ratings, version adoption, and geographic reach with interactive dashboards.',
    color: '#0EA5E9', bg: 'linear-gradient(135deg, #082F49, #0EA5E9)',
  },
  {
    icon: Layers, title: 'Version Management',
    desc: 'Full history with changelogs, instant rollback support, and semantic versioning built-in.',
    color: '#F59E0B', bg: 'linear-gradient(135deg, #78350F, #F59E0B)',
  },
  {
    icon: Lock, title: 'Enterprise Auth',
    desc: 'JWT tokens, refresh rotation, multi-session logout, and complex role-based access control.',
    color: '#8B5CF6', bg: 'linear-gradient(135deg, #2E1065, #8B5CF6)',
  },
  {
    icon: Globe, title: 'Multi-Platform Native',
    desc: 'Software, PDFs, eBooks, templates, plugins — beautifully responsive for all operating systems.',
    color: '#F97316', bg: 'linear-gradient(135deg, #431407, #F97316)',
  },
];

const COMPANIES = [
  "Acme Corp", "Vercel", "Stripe", "Linear", "Supabase", "Retool",
  "Acme Corp", "Vercel", "Stripe", "Linear", "Supabase", "Retool" // Duplicated for marquee
];

const CATEGORIES = ['Developer Tools', 'Design', 'Productivity', 'Security', 'Templates', 'Plugins'];

const STATS = [
  { value: '500+', label: 'Apps Published', icon: Package },
  { value: '10K+', label: 'Active Users', icon: Users },
  { value: '20+', label: 'Categories', icon: Layers },
  { value: '100K+', label: 'Downloads', icon: Download },
];

export default function HomePage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Mouse tracking logic for Hero Glow
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringHero, setIsHoveringHero] = useState(false);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const { data: featuredData, isLoading } = useQuery({
    queryKey: ['apps', 'featured'],
    queryFn: () => api.get('/apps?limit=6&status=PUBLISHED').then(r => r.data),
  });

  const apps = featuredData?.items || [];
  const handleSearch = (e) => {
    e.preventDefault();
    if(search.trim()) navigate(`/marketplace?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div style={{ background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* ═══════════ ULTRA HERO ═══════════ */}
      <section 
        className="hero" 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHoveringHero(true)}
        onMouseLeave={() => setIsHoveringHero(false)}
        style={{ 
          borderBottom: '1px solid var(--border)', 
          padding: '140px 0 100px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="hero-grid-bg" />
        
        {/* Dynamic Interactive Spotlight */}
        <div 
          className="hero-glow-tracker"
          style={{ 
            left: mousePos.x, 
            top: mousePos.y,
            opacity: isHoveringHero ? 1 : 0,
          }}
        />

        {/* Static Base Glow */}
        <div style={{
          position: 'absolute', top: '-10%', left: '10%',
          width: '60vw', height: '600px',
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-split">
            
            {/* Left Column: Copy & Search */}
            <div className="hero-content">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
                <div className="section-header-pill" style={{ marginBottom: '24px', background: 'rgba(37,99,235,0.1)', borderColor: 'rgba(37,99,235,0.2)', color: 'var(--accent)' }}>
                  <Sparkles size={12} /> The ultimate marketplace for builders
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                style={{
                  fontFamily: "'Space Grotesk'",
                  fontSize: 'clamp(46px, 7vw, 84px)',
                  fontWeight: 900,
                  lineHeight: 1.05,
                  letterSpacing: '-0.04em',
                  color: 'var(--text-primary)',
                  marginBottom: '28px'
                }}
              >
                Discover Apps That<br />
                <span className="hero-title-gradient">Ship Work Faster.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                style={{
                  fontSize: 'clamp(17px, 2.5vw, 21px)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '48px',
                  maxWidth: '580px',
                  fontWeight: 400
                }}
              >
                Browse, download, and seamlessly manage the world's best digital products — from high-performance tools and templates to powerful integrated plugins.
              </motion.p>

              {/* Advanced Search Bar */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
                <form 
                  onSubmit={handleSearch} 
                  className="hero-search" 
                  style={{ 
                    margin: '0', maxWidth: '580px', 
                    padding: '8px 8px 8px 24px', 
                    height: '64px',
                    borderRadius: '100px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.06)'
                  }}
                >
                  <Search size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input
                    id="hero-search-input"
                    type="text"
                    className="hero-search-input"
                    placeholder="Search apps, tools, plugins…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ fontSize: '16px', marginLeft: '8px' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ height: '48px', padding: '0 24px', borderRadius: '100px', fontSize: '15px', fontWeight: 600 }}>
                    Search
                  </button>
                </form>
              </motion.div>

              {/* Category pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: '32px' }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: '8px', fontWeight: 500 }}>Popular:</span>
                {CATEGORIES.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    onClick={() => navigate(`/marketplace?category=${encodeURIComponent(c)}`)}
                    style={{
                      padding: '6px 14px', borderRadius: 100,
                      background: 'rgba(128,128,128,0.08)', border: '1px solid transparent',
                      fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(128,128,128,0.08)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {c}
                  </button>
                ))}
              </motion.div>
            </div>

            {/* Right Column: Parallax/Floating Cards */}
            <div style={{ position: 'relative', height: '100%', minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotateX: 10, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: -8 }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', gap: '32px', transformStyle: 'preserve-3d', perspective: '1200px' }}
              >
                {/* Column 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', transform: 'translateZ(40px) translateY(20px)' }}>
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="card" style={{ width: '300px', padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--borderStrong)', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.12)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ height: '140px', background: 'linear-gradient(135deg, #1E3A5F, #2563EB)', borderRadius: '14px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1h18v18H1V1zm1 1v16h16V2H2z\' fill=\'rgba(255,255,255,0.05)\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")', opacity: 0.5 }} />
                    </div>
                    <div style={{ width: '65%', height: '14px', background: 'var(--bg-secondary)', borderRadius: '7px', marginBottom: '12px' }} />
                    <div style={{ width: '45%', height: '10px', background: 'var(--bg-tertiary)', borderRadius: '5px' }} />
                  </motion.div>
                  <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className="card" style={{ width: '300px', padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--borderStrong)', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.12)' }}>
                    <div style={{ height: '140px', background: 'linear-gradient(135deg, #450A0A, #DC2626)', borderRadius: '14px', marginBottom: '20px' }} />
                    <div style={{ width: '75%', height: '14px', background: 'var(--bg-secondary)', borderRadius: '7px', marginBottom: '12px' }} />
                    <div style={{ width: '55%', height: '10px', background: 'var(--bg-tertiary)', borderRadius: '5px' }} />
                  </motion.div>
                </div>
                {/* Column 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', transform: 'translateZ(-20px) translateY(-30px)' }}>
                  <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} className="card" style={{ width: '300px', padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--borderStrong)', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.12)' }}>
                    <div style={{ height: '140px', background: 'linear-gradient(135deg, #134E4A, #0D9488)', borderRadius: '14px', marginBottom: '20px' }} />
                    <div style={{ width: '60%', height: '14px', background: 'var(--bg-secondary)', borderRadius: '7px', marginBottom: '12px' }} />
                    <div style={{ width: '40%', height: '10px', background: 'var(--bg-tertiary)', borderRadius: '5px' }} />
                  </motion.div>
                  <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }} className="card" style={{ width: '300px', padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--borderStrong)', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.12)' }}>
                    <div style={{ height: '140px', background: 'linear-gradient(135deg, #2E1065, #8B5CF6)', borderRadius: '14px', marginBottom: '20px' }} />
                    <div style={{ width: '85%', height: '14px', background: 'var(--bg-secondary)', borderRadius: '7px', marginBottom: '12px' }} />
                    <div style={{ width: '50%', height: '10px', background: 'var(--bg-tertiary)', borderRadius: '5px' }} />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUSTED MARQUEE ═══════════ */}
      <section style={{ padding: '32px 0 40px', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
        <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: '24px',textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Trusted by developers at innovative companies
        </p>
        <div className="marquee-container">
          <div className="marquee-content">
            {COMPANIES.map((company, index) => (
              <div key={index} style={{ 
                fontFamily: "'Space Grotesk'", 
                fontWeight: 800, 
                fontSize: 24, 
                color: 'var(--text-muted)',
                opacity: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <Code2 size={24} style={{ opacity: 0.4 }}/>
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STAGGERED FEATURED APPS ═══════════ */}
      <section style={{ padding: '100px 0', background: 'var(--bg-primary)' }}>
        <div className="container">
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 64, flexWrap: 'wrap', gap: 24 }}>
              <div style={{ maxWidth: 640 }}>
                <div className="section-header-pill" style={{ marginBottom: 16 }}><Star size={11} /> Featured Collection</div>
                <h2 className="section-title" style={{ marginBottom: 16, fontSize: 'clamp(32px, 4vw, 48px)' }}>Essential Tools for Modern Stacks</h2>
                <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Hand-picked utilities and applications designed to accelerate your workflow and supercharge your environment.</p>
              </div>
              <Link to="/marketplace" className="btn btn-secondary" style={{ borderRadius: 100, padding: '12px 28px' }}>
                Explore Marketplace <ArrowRight size={16} style={{ marginLeft: 8 }}/>
              </Link>
            </div>
          </Reveal>

          {isLoading ? <LoadingGrid count={6} /> : apps.length === 0 ? (
            <EmptyState
              icon="🚀"
              title="No apps yet — be first!"
              description="The marketplace is waiting for its first app."
              action={<Link to="/developer" className="btn btn-primary">Become a Developer</Link>}
            />
          ) : (
            <motion.div
              className="app-grid"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } }, hidden: {} }}
            >
              {apps.map((app, i) => (
                <motion.div 
                  key={app.id} 
                  variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.8 }}
                >
                  <AppCard app={app} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══════════ ADVANCED BENTO FEATURES ═══════════ */}
      <section style={{ padding: '120px 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        {/* Abstract Background Elements */}
        <div style={{ position: 'absolute', top: -200, right: -200, width: 800, height: 800, background: 'radial-gradient(circle, rgba(37,99,235,0.05), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -200, left: -200, width: 600, height: 600, background: 'radial-gradient(circle, rgba(249,115,22,0.05), transparent 70%)', pointerEvents: 'none' }} />

        <div className="container">
          <Reveal>
            <div className="text-center" style={{ marginBottom: 80, position: 'relative', zIndex: 10 }}>
              <div className="section-header-pill" style={{ margin: '0 auto 16px' }}><Zap size={11} /> Enterprise Architecture</div>
              <h2 className="section-title" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>Engineered for infinite scale.</h2>
              <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: 640 }}>
                Every component is crafted perfectly in service of developers who ship fast and end-users who demand absolute reliability.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, position: 'relative', zIndex: 10 }}>
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <div className="bento-card-advanced">
                  {/* Glowing dynamic border layer */}
                  <div className="bento-card-advanced-glow" />
                  
                  {/* Inner card content */}
                  <div className="bento-card-advanced-inner">
                    <div className="bento-icon-glass" style={{
                      /* Fallback explicit style just in case CSS misses */
                      background: 'var(--bg-secondary)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                    }}>
                      <Icon size={24} style={{ color }} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{title}</h3>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 400 }}>{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ METRICS & CTA CASCADE ═══════════ */}
      <section style={{ padding: '120px 0 80px', position: 'relative' }}>
        <div className="container">
          
          <Reveal direction="scale">
            <div style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E3A8A 100%)',
              borderRadius: 32, padding: '80px 48px',
              textAlign: 'center', position: 'relative', overflow: 'hidden',
              boxShadow: '0 32px 64px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {/* Complex inner glows */}
              <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
              <div style={{ position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(56,189,248,0.3), transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{
                  fontFamily: "'Space Grotesk'", fontSize: 'clamp(32px, 5vw, 64px)',
                  fontWeight: 900, color: 'white', marginBottom: 20, letterSpacing: '-0.03em', lineHeight: 1.1
                }}>
                  Stop configuring.<br/>Start publishing today.
                </h2>
                <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', marginBottom: 48, maxWidth: 540, margin: '0 auto 48px' }}>
                  Join thousands of developers distributing powerful software through the WebHarbour platform.
                </p>
                
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/register" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '16px 36px', borderRadius: 100,
                    background: 'white', color: '#1E1B4B',
                    fontWeight: 700, fontSize: 16, transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'; }}
                  >
                    <Rocket size={18} /> Deploy Your First App
                  </Link>
                </div>

                <div style={{ marginTop: 40, display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 40 }}>
                  {STATS.map(({ value, label }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color: 'white', fontFamily: "'Space Grotesk'" }}>{value}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)', padding: '32px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
            <div style={{ width: 32, height: 32, background: 'var(--gradient-brand)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
              <Anchor size={16} color="white" />
            </div>
            WebHarbour
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>© 2026 WebHarbour Inc. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['Terms', '#'], ['Privacy', '#'], ['API', '/developer']].map(([label, to]) => (
              <Link key={label} to={to} style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
