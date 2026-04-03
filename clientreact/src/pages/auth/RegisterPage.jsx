import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, Anchor, Mail, Lock, User, ArrowRight, CheckCircle, Shield, Star, Package, Zap } from 'lucide-react';

const PERKS = [
  { icon: Zap, title: 'Instant Downloads', desc: 'Get apps in seconds from our global CDN.' },
  { icon: Shield, title: 'Verified & Safe', desc: 'Every app reviewed by our security team.' },
  { icon: Star, title: 'Ratings & Reviews', desc: 'Community-powered quality ratings.' },
];

function StrengthMeter({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const colors = ['', '#DC2626', '#D97706', '#2563EB', '#16A34A'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return password.length > 0 ? (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            height: 3, flex: 1, borderRadius: 3,
            background: i <= strength ? colors[strength] : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: colors[strength], fontWeight: 600 }}>{labels[strength]}</div>
    </div>
  ) : null;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    try {
      await register(form.name, form.email, form.password);
      setSuccess(true);
      setTimeout(() => navigate('/home'), 1500);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed. Try again.');
    }
  };

  return (
    <div className="auth-layout" style={{ minHeight: '100vh' }}>
      {/* ── Visual Panel ── */}
      <div className="auth-visual-panel">
        <div style={{ position: 'relative', zIndex: 2, color: 'white', maxWidth: 380 }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Anchor size={20} color="white" />
              </div>
              <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: 20 }}>WebHarbour</span>
            </div>

            <h2 style={{ fontFamily: "'Space Grotesk'", fontSize: 30, fontWeight: 800, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.03em' }}>
              Join thousands of<br />developers & creators
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 36 }}>
              Create a free account and start discovering premium apps today. No credit card required.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {PERKS.map(({ icon: Icon, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 40, padding: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 12, borderLeft: '3px solid rgba(249,115,22,0.8)' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                🚀 Want to publish apps? After creating an account, apply for developer access and reach thousands of users.
              </div>
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
          {success ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 64, height: 64, background: 'var(--success-subtle)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={30} style={{ color: 'var(--success)' }} />
              </div>
              <h2 style={{ fontFamily: "'Space Grotesk'", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Account Created!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Redirecting you to the marketplace…</p>
            </motion.div>
          ) : (
            <>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
                  Create your account
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Free forever. No credit card needed.</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--danger-subtle)', border: '1px solid rgba(220,38,38,0.2)', color: 'var(--danger)', fontSize: 13, fontWeight: 500, marginBottom: 20 }}>
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="form-input" style={{ paddingLeft: 38 }} placeholder="Your full name"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoComplete="name" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" className="form-input" style={{ paddingLeft: 38 }} placeholder="you@company.com"
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoComplete="email" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type={showPw ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 38, paddingRight: 40 }}
                      placeholder="Min 8 characters" value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <StrengthMeter password={form.password} />
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  By creating an account you agree to our <a href="#" style={{ color: 'var(--accent)', fontWeight: 600 }}>Terms of Service</a> and{' '}
                  <a href="#" style={{ color: 'var(--accent)', fontWeight: 600 }}>Privacy Policy</a>.
                </p>

                <motion.button
                  type="submit" className="btn btn-primary"
                  style={{ width: '100%', borderRadius: 10, height: 44, marginTop: 4 }}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  disabled={loading}
                >
                  {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating account…</> : <>Create Account <ArrowRight size={15} /></>}
                </motion.button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in →</Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
