import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor } from 'lucide-react';

/* ================================================================
   WH SPLASH — Full-screen brand loader (used on first app boot)
   ================================================================ */
export function WHSplash({ visible = true }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="wh-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}
        >
          {/* Anchor + Rings */}
          <div className="wh-anchor-wrap">
            <div className="wh-ring wh-ring-1" />
            <div className="wh-ring wh-ring-2" />
            <motion.div
              className="wh-anchor-icon"
              animate={{ y: [0, -6, 4, 0], rotate: [0, -8, 6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Anchor size={22} color="white" />
            </motion.div>
          </div>

          {/* Brand name */}
          <motion.div
            className="wh-brand-text"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            WebHarbour
          </motion.div>

          {/* Wave progress bar */}
          <div className="wh-progress-track">
            <div className="wh-progress-wave" />
          </div>

          <motion.div
            className="wh-loading-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading marketplace…
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================
   WH PAGE LOADER — Centered in page (e.g. lazy route loading)
   ================================================================ */
export function WHPageLoader({ label = 'Loading…' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '50vh', gap: 20,
    }}>
      <div className="wh-anchor-wrap">
        <div className="wh-ring wh-ring-1" />
        <motion.div
          className="wh-anchor-icon"
          animate={{ y: [0, -6, 4, 0], rotate: [0, -8, 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 40, height: 40, borderRadius: 11 }}
        >
          <Anchor size={18} color="white" />
        </motion.div>
      </div>
      <div className="wh-progress-track" style={{ width: 140 }}>
        <div className="wh-progress-wave" />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{label}</span>
    </div>
  );
}

/* ================================================================
   WH MINI SPINNER — Inline tiny loader (button states, etc.)
   ================================================================ */
export function WHSpinner({ size = 18, color }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid var(--border)`,
      borderTopColor: color || 'var(--accent)',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}

/* ================================================================
   PAGE TRANSITION WRAPPER — Wrap route contents for smooth enter
   ================================================================ */
export function PageTransition({ children, keyProp }) {
  return (
    <motion.div
      key={keyProp}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

/* ================================================================
   ROUTE SKELETON — Shown while ProtectedRoute checks auth
   ================================================================ */
export function AuthCheckLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: 16,
      background: 'var(--bg-primary)',
    }}>
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, -10, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 52, height: 52, background: 'var(--gradient-brand)',
          borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-blue-lg)',
        }}
      >
        <Anchor size={24} color="white" />
      </motion.div>
      <div className="wh-progress-track" style={{ width: 120 }}>
        <div className="wh-progress-wave" />
      </div>
    </div>
  );
}
