import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Anchor, ArrowRight, Zap, Shield, Package, Star,
  CheckCircle, Code2, Globe, Sparkles, ChevronDown, Play, TrendingUp,
  Layers, Lock, Rocket, BarChart3, Users,
} from 'lucide-react';

/* =========================================================
   PARTICLE CANVAS BACKGROUND
   ========================================================= */
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animFrame;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.5 ? '99,102,241' : '139,92,246',
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x, dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animFrame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.8 }}
    />
  );
}

/* =========================================================
   ANIMATED GRADIENT ORBS
   ========================================================= */
function GradientOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: 700, height: 700,
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <motion.div
        animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 0.9, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{
          position: 'absolute', top: '30%', right: '-15%',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, 40, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
        style={{
          position: 'absolute', bottom: '-10%', left: '30%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
    </div>
  );
}

/* =========================================================
   ANIMATED COUNTER (pure hook, no external library)
   ========================================================= */
function useCountUp(end, duration = 2000, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);
  return value;
}

function AnimatedCounter({ end, suffix = '', label, duration = 2500 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp(end, duration, inView);
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 'clamp(36px, 5vw, 56px)',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #c7d2fe 0%, #a78bfa 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        lineHeight: 1,
      }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* =========================================================
   FEATURE CARD
   ========================================================= */
function FeatureCard({ icon: Icon, title, description, gradient, delay = 0, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -8, scale: 1.02 }}
      style={{
        position: 'relative', padding: 28, borderRadius: 24,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        cursor: 'default',
        overflow: 'hidden',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(99,102,241,0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160,
        background: gradient,
        borderRadius: '50%', filter: 'blur(40px)', opacity: 0.15,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18, boxShadow: `0 8px 24px ${gradient.includes('6366f1') ? 'rgba(99,102,241,0.35)' : 'rgba(139,92,246,0.35)'}`,
      }}>
        <Icon size={22} color="white" strokeWidth={1.8} />
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: 'white' }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{description}</p>
    </motion.div>
  );
}

/* =========================================================
   MOCK APP CARD (Showcase)
   ========================================================= */
function MockAppCard({ name, category, rating, downloads, emoji, gradient, price, featured = false, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'backOut' }}
      whileHover={{ y: -6, scale: 1.03 }}
      style={{
        background: 'rgba(20,20,30,0.8)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        cursor: 'pointer',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        boxShadow: featured ? '0 0 40px rgba(99,102,241,0.25)' : 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
        e.currentTarget.style.boxShadow = '0 20px 50px rgba(99,102,241,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.boxShadow = featured ? '0 0 40px rgba(99,102,241,0.25)' : 'none';
      }}
    >
      {/* Banner */}
      <div style={{
        height: 110, background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <motion.div
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 44 }}
        >
          {emoji}
        </motion.div>
        {featured && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            color: 'white', fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 20,
          }}>
            ✦ FEATURED
          </div>
        )}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 3 }}>{name}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>{category}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            <span>★ {rating}</span>
            <span>↓ {downloads}</span>
          </div>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: price === 'Free' ? '#4ade80' : '#c7d2fe',
          }}>{price}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   TESTIMONIAL
   ========================================================= */
function Testimonial({ quote, author, role, avatar, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      style={{
        padding: 28, borderRadius: 20,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ fontSize: 36, color: '#6366f1', marginBottom: 12, lineHeight: 1, fontFamily: 'serif' }}>"</div>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 20 }}>{quote}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: 'white',
        }}>
          {avatar}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{author}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{role}</div>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   TYPEWRITER EFFECT
   ========================================================= */
function Typewriter({ words }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const speed = isDeleting ? 40 : 80;

  useEffect(() => {
    const current = words[index % words.length];
    const timer = setTimeout(() => {
      if (!isDeleting && text === current) {
        setTimeout(() => setIsDeleting(true), 1800);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setIndex((i) => (i + 1) % words.length);
      } else {
        setText(isDeleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1));
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, index, words, speed]);

  return (
    <span style={{ color: 'transparent',
      background: 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6)',
      WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
      {text}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        style={{ color: '#818cf8' }}
      >|</motion.span>
    </span>
  );
}

/* =========================================================
   SCROLL INDICATOR
   ========================================================= */
function ScrollIndicator() {
  return (
    <motion.div
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
      }}
      onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
    >
      <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Scroll</span>
      <ChevronDown size={18} />
    </motion.div>
  );
}

/* =========================================================
   NAV BAR (Landing-only)
   ========================================================= */
function LandingNav({ onEnter }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        background: scrolled ? 'rgba(9,9,11,0.85)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'background 0.4s, backdrop-filter 0.4s',
        maxWidth: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 20, color: 'white' }}>
        <div style={{
          width: 34, height: 34, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Anchor size={17} color="white" />
        </div>
        WebHarbour
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onEnter}
          style={{
            padding: '9px 22px', borderRadius: 100, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          Enter Marketplace <ArrowRight size={14} />
        </button>
      </div>
    </motion.nav>
  );
}

/* =========================================================
   MAIN LANDING PAGE
   ========================================================= */

const FEATURES = [
  {
    icon: Rocket, title: 'One-Click Deploy Publishing',
    description: 'Ship your app to thousands of users instantly. Our CDN-backed delivery ensures lightning-fast downloads worldwide.',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  },
  {
    icon: Shield, title: 'Curated, Safe & Verified',
    description: 'Every app undergoes a rigorous human + automated review pipeline before reaching users. Zero malware, zero surprises.',
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
  },
  {
    icon: BarChart3, title: 'Real-Time Analytics',
    description: 'Track downloads, ratings, version adoption, and geographic reach from a beautiful developer dashboard.',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  },
  {
    icon: Layers, title: 'Version Management',
    description: 'Full version history with changelogs, rollback support, file integrity checksums, and semantic versioning.',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  {
    icon: Lock, title: 'Enterprise-Grade Auth',
    description: 'JWT access tokens, refresh token rotation, multi-session logout, password reset, and role-based access control.',
    gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
  },
  {
    icon: Globe, title: 'Multi-Platform Support',
    description: 'Distribute software, PDFs, eBooks, templates, plugins, and extensions for Windows, macOS, Linux, and Web.',
    gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
  },
];

const MOCK_APPS = [
  {
    name: 'CodeFlow Pro', category: 'Developer Tools', rating: '4.9', downloads: '12.4k',
    emoji: '⚡', gradient: 'linear-gradient(135deg, #1e1b4b, #312e81)', price: '$19.99', featured: true,
  },
  {
    name: 'DesignKit Ultra', category: 'Design', rating: '4.8', downloads: '8.2k',
    emoji: '🎨', gradient: 'linear-gradient(135deg, #4c1d95, #7c3aed)', price: 'Free',
  },
  {
    name: 'DataVault', category: 'Productivity', rating: '4.7', downloads: '5.6k',
    emoji: '📊', gradient: 'linear-gradient(135deg, #134e4a, #0d9488)', price: '$9.99',
  },
  {
    name: 'SecurePass', category: 'Security', rating: '4.9', downloads: '20.1k',
    emoji: '🔐', gradient: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)', price: 'Free',
  },
];

const TESTIMONIALS = [
  {
    quote: "WebHarbour transformed how we distribute our internal tools. The analytics dashboard alone saved us hours of manual tracking every week.",
    author: "Priya Sharma", role: "Engineering Lead @ TechCorp", avatar: "P",
  },
  {
    quote: "Published our first app and hit 1,000 downloads in 3 days. The review process is painless and the UX is absolutely gorgeous.",
    author: "Arjun Mehta", role: "Indie Developer", avatar: "A",
  },
  {
    quote: "The version management and rollback features are exactly what we needed. Proper semantic versioning with changelogs out of the box.",
    author: "Sanya Kapoor", role: "Product Manager @ DevStudio", avatar: "S",
  },
];

const TIMELINE = [
  { icon: Users, title: 'Create an Account', desc: 'Sign up in seconds. No credit card required.', color: '#6366f1' },
  { icon: Code2, title: 'Request Developer Access', desc: 'Submit a quick developer profile. Approved within 24 hours.', color: '#8b5cf6' },
  { icon: Package, title: 'Publish Your App', desc: 'Upload your build, write a description, set a price or go free.', color: '#a78bfa' },
  { icon: TrendingUp, title: 'Grow & Earn', desc: 'Track downloads, collect reviews, and keep your users updated.', color: '#c084fc' },
];

function CinematicBlurText({ text }) {
  const words = text.split(" ");
  return (
    <span style={{ display: 'inline-block' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: 'blur(16px)', opacity: 0, scale: 1.15 }}
          animate={{ filter: 'blur(0px)', opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: i * 0.15 + 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="blur-word"
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </span>
  );
}

function AdvancedTextRoller({ words }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500); // changes every 2.5s
    return () => clearInterval(interval);
  }, [words]);

  return (
    <span style={{ 
      display: 'inline-flex', 
      flexDirection: 'column',
      position: 'relative', 
      overflow: 'hidden', 
      height: '1.1em',
      verticalAlign: 'bottom',
      paddingBottom: '0.1em'
    }}>
      <AnimatePresence mode="popLayout">
        <motion.span
           key={index}
           initial={{ y: 80, opacity: 0, rotateX: -90 }}
           animate={{ y: 0, opacity: 1, rotateX: 0 }}
           exit={{ y: -80, opacity: 0, rotateX: 90 }}
           transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
           style={{ 
             display: 'block',
             paddingRight: '8px'
           }}
           className="liquid-gradient-text"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const handleEnter = () => navigate('/home');

  return (
    <div className="landing-page-root">
      <ParticleCanvas />
      <GradientOrbs />
      <LandingNav onEnter={handleEnter} />

      {/* ============ HERO ============ */}
      <section className="landing-hero">
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '120px 24px 80px',
          position: 'relative', zIndex: 1,
        }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 100,
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              fontSize: 13, color: '#a5b4fc', fontWeight: 500, marginBottom: 28,
            }}
          >
            <Sparkles size={13} />
            Introducing WebHarbour 1.0
            <span style={{
              padding: '2px 8px', borderRadius: 20,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: 'white', fontSize: 10, fontWeight: 700,
            }}>NEW</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(42px, 8vw, 88px)',
              fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em',
              marginBottom: 12, maxWidth: 900,
            }}
          >
            <CinematicBlurText text="The Marketplace for" />
            <br />
            <AdvancedTextRoller words={['Developers', 'Creators', 'Builders', 'Innovators']} />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              color: 'rgba(255,255,255,0.55)', lineHeight: 1.7,
              maxWidth: 600, marginBottom: 44,
            }}
          >
            Publish, discover, and download premium apps, templates, plugins and digital tools.
            A curated hub where quality meets reach.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <motion.button
              id="landing-enter-btn"
              whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(99,102,241,0.6)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleEnter}
              style={{
                padding: '16px 36px', borderRadius: 100, border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 30px rgba(99,102,241,0.45)',
                fontFamily: 'inherit',
              }}
            >
              <Rocket size={18} /> Enter the Marketplace
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '16px 32px', borderRadius: 100,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'inherit', backdropFilter: 'blur(10px)',
              }}
              onClick={() => document.getElementById('features-section').scrollIntoView({ behavior: 'smooth' })}
            >
              <Play size={16} /> See how it works
            </motion.button>
          </motion.div>

          {/* Trusted by */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ marginTop: 56, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}
          >
            Trusted by developers from India, US, UK, Germany and 40+ countries
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)' }}
          >
            <ScrollIndicator />
          </motion.div>
        </div>
      </section>

      {/* ============ APP SHOWCASE ============ */}
      <section style={{ padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              padding: '4px 14px', borderRadius: 100, fontSize: 12, color: '#a5b4fc', marginBottom: 16, fontWeight: 500,
            }}>
              <Star size={11} /> Featured Apps
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 14,
            }}>
              Discover What's Inside
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
              A taste of what awaits — software, templates, plugins and more.
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
          }}>
            {MOCK_APPS.map((app, i) => (
              <MockAppCard key={app.name} {...app} delay={i * 0.12} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            style={{ textAlign: 'center', marginTop: 36 }}
          >
            <button
              onClick={handleEnter}
              style={{
                padding: '12px 28px', borderRadius: 100,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            >
              Browse All Apps <ArrowRight size={14} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 40,
        }}>
          <AnimatedCounter end={500} suffix="+" label="Apps Published" />
          <AnimatedCounter end={10} suffix="K+" label="Active Users" />
          <AnimatedCounter end={100} suffix="K+" label="Downloads" duration={2} />
          <AnimatedCounter end={4.8} suffix="" label="Avg App Rating" duration={2} />
          <AnimatedCounter end={40} suffix="+" label="Countries Reached" />
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features-section" style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
              padding: '4px 14px', borderRadius: 100, fontSize: 12, color: '#c4b5fd', marginBottom: 16, fontWeight: 500,
            }}>
              <Zap size={11} /> Platform Features
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, marginBottom: 14,
            }}>
              Everything you need.<br />Nothing you don't.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
              Built from the ground up for developers who care about quality and users who demand the best.
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 0.08} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section style={{
        padding: '100px 24px',
        background: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 14,
            }}>
              From idea to marketplace<br />in 4 simple steps
            </h2>
          </motion.div>

          <div style={{ position: 'relative' }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute', left: 20, top: 28, bottom: 28, width: 2,
              background: 'linear-gradient(to bottom, #6366f1, #8b5cf6, #a78bfa, #c084fc)',
              borderRadius: 2,
            }} />

            {TIMELINE.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                style={{
                  display: 'flex', gap: 24, marginBottom: i < TIMELINE.length - 1 ? 40 : 0,
                  position: 'relative',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${color}, ${color}99)`,
                  border: '3px solid #07070a',
                  boxShadow: `0 0 20px ${color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, zIndex: 1,
                }}>
                  <Icon size={18} color="white" />
                </div>
                <div style={{ paddingTop: 8 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, marginBottom: 14,
            }}>
              Loved by developers
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>
              Don't just take our word for it.
            </p>
          </motion.div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {TESTIMONIALS.map((t, i) => (
              <Testimonial key={t.author} {...t} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              padding: '72px 40px',
              borderRadius: 32,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(236,72,153,0.05) 100%)',
              border: '1px solid rgba(99,102,241,0.25)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Background decoration */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', top: -100, right: -100, width: 300, height: 300,
                background: 'conic-gradient(from 0deg, transparent 0deg, rgba(99,102,241,0.1) 60deg, transparent 120deg)',
                borderRadius: '50%',
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 900,
                marginBottom: 16, lineHeight: 1.1,
              }}>
                Ready to set sail?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, marginBottom: 40, lineHeight: 1.7, maxWidth: 500, margin: '0 auto 40px' }}>
                Join thousands of developers and users already on the WebHarbour platform.
                It's free to get started.
              </p>

              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button
                  id="landing-cta-enter"
                  whileHover={{ scale: 1.06, boxShadow: '0 0 60px rgba(99,102,241,0.7)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleEnter}
                  style={{
                    padding: '16px 40px', borderRadius: 100, border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                    backgroundSize: '200%',
                    color: 'white', fontWeight: 800, fontSize: 17, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 40px rgba(99,102,241,0.45)',
                    fontFamily: 'inherit',
                    transition: 'background-position 0.3s',
                  }}
                >
                  <Anchor size={18} /> Enter WebHarbour
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  onClick={() => navigate('/register')}
                  style={{
                    padding: '16px 32px', borderRadius: 100,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: 16,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  Create Free Account
                </motion.button>
              </div>

              <div style={{ marginTop: 28, display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['No credit card', 'Free to browse', 'Instant access'].map((t) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                    <CheckCircle size={13} style={{ color: '#4ade80' }} />
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '32px 24px',
        position: 'relative', zIndex: 1,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'white',
        }}>
          <Anchor size={16} style={{ color: '#6366f1' }} /> WebHarbour
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          © 2025 WebHarbour. Built with ❤️ using React & Express.
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={handleEnter} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Browse</button>
          <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Sign Up</button>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Login</button>
        </div>
      </footer>
    </div>
  );
}
