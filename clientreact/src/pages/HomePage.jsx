import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
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
function Reveal({ children, delay = 0, direction = 'up' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const initial = direction === 'up' ? { opacity: 0, y: 28 }
    : direction === 'left' ? { opacity: 0, x: -28 }
    : direction === 'right' ? { opacity: 0, x: 28 }
    : { opacity: 0, scale: 0.95 };

  return (
    <motion.div ref={ref} initial={initial}
      animate={inView ? { opacity: 1, y: 0, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: Rocket, title: 'One-Click Publishing',
    desc: 'Ship to thousands of users instantly. CDN-backed delivery worldwide.',
    color: '#2563EB', bg: 'rgba(37,99,235,0.06)',
  },
  {
    icon: Shield, title: 'Curated & Verified',
    desc: 'Every app passes human + automated review. Zero malware, zero surprises.',
    color: '#16A34A', bg: 'rgba(22,163,74,0.06)',
  },
  {
    icon: BarChart3, title: 'Real-Time Analytics',
    desc: 'Track downloads, ratings, version adoption, and geographic reach.',
    color: '#0284C7', bg: 'rgba(2,132,199,0.06)',
  },
  {
    icon: Layers, title: 'Version Management',
    desc: 'Full history with changelogs, rollback support, and semantic versioning.',
    color: '#D97706', bg: 'rgba(217,119,6,0.06)',
  },
  {
    icon: Lock, title: 'Enterprise Auth',
    desc: 'JWT tokens, refresh rotation, multi-session logout, and role-based access.',
    color: '#7C3AED', bg: 'rgba(124,58,237,0.06)',
  },
  {
    icon: Globe, title: 'Multi-Platform',
    desc: 'Software, PDFs, eBooks, templates, plugins — for Windows, macOS, Linux & Web.',
    color: '#F97316', bg: 'rgba(249,115,22,0.06)',
  },
];

const STATS = [
  { value: '500+', label: 'Apps Published', icon: Package },
  { value: '10K+', label: 'Active Users', icon: Users },
  { value: '20+', label: 'Categories', icon: Layers },
  { value: '100K+', label: 'Downloads', icon: Download },
];

const CATEGORIES = ['Developer Tools', 'Design', 'Productivity', 'Security', 'Templates', 'Plugins'];

export default function HomePage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: featuredData, isLoading } = useQuery({
    queryKey: ['apps', 'featured'],
    queryFn: () => api.get('/apps?limit=6&status=PUBLISHED').then(r => r.data),
  });

  const apps = featuredData?.items || [];
  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/marketplace?q=${encodeURIComponent(search)}`);
  };

  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      {/* ═══════════ HERO ═══════════ */}
      <section style={{
        background: 'linear-gradient(180deg, #EFF6FF 0%, #F8FAFC 100%)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden', position: 'relative',
        padding: '80px 0 70px',
      }}>
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.4, pointerEvents: 'none',
        }} />
        {/* Glow */}
        <div style={{
          position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 400,
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-header-pill" style={{ margin: '0 auto 20px' }}>
              <Sparkles size={11} /> The marketplace for builders
            </div>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Discover Apps That<br />
            <span className="hero-title-gradient">Ship Work Faster</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Browse, download, and manage the best digital products — from tools and templates to plugins and beyond.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <form onSubmit={handleSearch} className="hero-search">
              <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                id="hero-search-input"
                type="text"
                className="hero-search-input"
                placeholder="Search for apps, tools, templates…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Search <ArrowRight size={13} />
              </button>
            </form>
          </motion.div>

          {/* Category pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 20 }}
          >
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => navigate(`/marketplace?category=${encodeURIComponent(c)}`)}
                style={{
                  padding: '5px 14px', borderRadius: 100,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: 'var(--shadow-xs)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                {c}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section style={{ padding: '40px 0', background: 'var(--bg-primary)' }}>
        <div className="container">
          <Reveal>
            <div className="stats-bar">
              {STATS.map(({ value, label, icon: Icon }) => (
                <div key={label} className="stats-bar-item">
                  <div className="stats-bar-value">{value}</div>
                  <div className="stats-bar-label">{label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ FEATURED APPS ═══════════ */}
      <section style={{ padding: '60px 0', background: 'var(--bg-primary)' }}>
        <div className="container">
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="section-header-pill"><Star size={11} /> Featured</div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Top Apps This Week</h2>
              </div>
              <Link to="/marketplace" className="btn btn-secondary btn-sm">
                Browse All <ChevronRight size={14} />
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
              variants={{ visible: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
            >
              {apps.map(app => (
                <motion.div key={app.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <AppCard app={app} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══════════ FEATURES BENTO ═══════════ */}
      <section style={{ padding: '80px 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <Reveal>
            <div className="text-center" style={{ marginBottom: 56 }}>
              <div className="section-header-pill" style={{ margin: '0 auto 14px' }}><Zap size={11} /> Why WebHarbour</div>
              <h2 className="section-title">Built for quality. Designed for scale.</h2>
              <p className="section-subtitle" style={{ margin: '0 auto' }}>
                Every decision we make is in service of developers who ship and users who demand the best.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <Reveal key={title} delay={i * 0.07}>
                <motion.div className="bento-card" whileHover={{ y: -4 }}>
                  <div className="bento-icon" style={{ background: bg }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <Reveal direction="left">
              <div>
                <div className="section-header-pill" style={{ marginBottom: 14 }}><Code2 size={11} /> For Developers</div>
                <h2 className="section-title">From idea to marketplace in 4 steps</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
                  WebHarbour makes distribution effortless. Focus on building — we handle the rest.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Link to="/register" className="btn btn-primary">Get Started Free <ArrowRight size={14} /></Link>
                  <Link to="/developer" className="btn btn-secondary">Learn More</Link>
                </div>
              </div>
            </Reveal>

            <Reveal direction="right">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { step: '01', title: 'Create an Account', desc: 'Sign up in seconds. No credit card required.', color: 'var(--accent)' },
                  { step: '02', title: 'Request Developer Access', desc: 'Submit a quick profile. Reviewed within 24 hours.', color: '#7C3AED' },
                  { step: '03', title: 'Publish Your App', desc: 'Upload builds, write a description, set pricing.', color: 'var(--orange)' },
                  { step: '04', title: 'Grow & Earn', desc: 'Track analytics, collect reviews, ship updates.', color: 'var(--success)' },
                ].map(({ step, title, desc, color }, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.45 }}
                    style={{
                      display: 'flex', gap: 16, padding: 18,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 14, boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${color}14`, border: `1px solid ${color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: 13, color,
                    }}>
                      {step}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA BANNER ═══════════ */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="container">
          <Reveal direction="scale">
            <div style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #7C3AED 100%)',
              borderRadius: 24, padding: '64px 40px',
              textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
              {/* Decorations */}
              <div style={{
                position: 'absolute', top: -60, right: -60, width: 220, height: 220,
                background: 'rgba(255,255,255,0.08)', borderRadius: '50%',
              }} />
              <div style={{
                position: 'absolute', bottom: -40, left: -40, width: 160, height: 160,
                background: 'rgba(249,115,22,0.15)', borderRadius: '50%',
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{
                  fontFamily: "'Space Grotesk'", fontSize: 'clamp(28px, 4vw, 42px)',
                  fontWeight: 800, color: 'white', marginBottom: 14, letterSpacing: '-0.03em',
                }}>
                  Ready to publish your app?
                </h2>
                <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.72)', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
                  Join developers already distributing through WebHarbour. Free to get started.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/register" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 28px', borderRadius: 100,
                    background: 'white', color: 'var(--accent)',
                    fontWeight: 700, fontSize: 15, transition: 'all 0.2s',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}
                  >
                    <Rocket size={16} /> Get Started Free
                  </Link>
                  <Link to="/marketplace" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 28px', borderRadius: 100,
                    background: 'rgba(255,255,255,0.1)', color: 'white',
                    fontWeight: 600, fontSize: 15, border: '1px solid rgba(255,255,255,0.25)',
                  }}>
                    Browse Apps <ChevronRight size={15} />
                  </Link>
                </div>
                <div style={{ marginTop: 24, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['No credit card', 'Free to browse', 'Instant access'].map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                      <CheckCircle size={13} style={{ color: '#4ADE80' }} /> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)', padding: '28px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            <div style={{ width: 26, height: 26, background: 'var(--gradient-brand)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Anchor size={13} color="white" />
            </div>
            WebHarbour
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>© 2025 WebHarbour — Built with React & Express</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[['Browse', '/marketplace'], ['Developers', '/developer'], ['Sign Up', '/register']].map(([label, to]) => (
              <Link key={label} to={to} style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
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
