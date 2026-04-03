import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, Anchor, Mail, Lock, ArrowRight, CheckCircle, Package, Users, Star } from 'lucide-react';

const PROOF_POINTS = [
  { icon: Package, text: '500+ apps in the marketplace' },
  { icon: Users, text: '10,000+ active users' },
  { icon: Star, text: '4.8 average app rating' },
  { icon: CheckCircle, text: 'Every app reviewed for safety' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="auth-layout" style={{ minHeight: '100vh' }}>
      {/* ── Visual Panel ── */}
      <div className="auth-visual-panel">
        <div style={{ position: 'relative', zIndex: 2, color: 'white', maxWidth: 380 }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
              <div style={{
                width: 40, height: 40, background: 'rgba(255,255,255,0.2)',
                borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(10px)',
              }}>
                <Anchor size={20} color="white" />
              </div>
              <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: 20 }}>WebHarbour</span>
            </div>

            <h2 style={{
              fontFamily: "'Space Grotesk'", fontSize: 32, fontWeight: 800,
              lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.03em',
            }}>
              The marketplace<br />built for builders.
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 36 }}>
              Discover, download, and distribute premium digital products trusted by thousands of developers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PROOF_POINTS.map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color="white" />
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Form Panel ── */}
      <div className="auth-form-panel">
        <motion.div
          className="auth-form-box"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          {/* Mobile logo */}
          <div style={{ display: 'none', alignItems: 'center', gap: 8, marginBottom: 32, fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18 }}>
            <div style={{ width: 30, height: 30, background: 'var(--gradient-brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Anchor size={14} color="white" />
            </div>
            WebHarbour
          </div>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '12px 16px', borderRadius: 10,
                background: 'var(--danger-subtle)', border: '1px solid rgba(220,38,38,0.2)',
                color: 'var(--danger)', fontSize: 13, fontWeight: 500, marginBottom: 20,
              }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="email" type="email"
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password">Password</label>
                <a href="#" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: 38, paddingRight: 40 }}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4,
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', borderRadius: 10, height: 44, marginTop: 4 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </motion.button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one free →</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
