import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, Anchor } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
        style={{ textAlign: 'center', maxWidth: 480 }}
      >
        {/* Animated 404 number */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(90px, 15vw, 140px)',
            fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 1,
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 60%, #F97316 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: 8,
          }}
        >
          404
        </motion.div>

        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <Anchor size={26} style={{ color: 'var(--accent)' }} />
        </div>

        <h1 style={{
          fontFamily: "'Space Grotesk'", fontSize: 24, fontWeight: 800,
          letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 12,
        }}>
          Lost in the harbour
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36 }}>
          The page you're looking for doesn't exist or has been moved. Let's get you back on course.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/home" className="btn btn-primary">
            <Home size={15} /> Back to Home
          </Link>
          <Link to="/marketplace" className="btn btn-secondary">
            <Search size={15} /> Browse Apps
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
