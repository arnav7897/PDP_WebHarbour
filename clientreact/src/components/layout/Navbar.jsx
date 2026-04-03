import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { Anchor, Search, Bell, ChevronDown, User, Settings, LogOut, Package, Shield, Heart, Code2, X, Menu } from 'lucide-react';

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="dropdown">
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 10px 5px 6px', borderRadius: 100,
          background: open ? 'var(--bg-secondary)' : 'transparent',
          border: '1px solid var(--border)',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 11, fontWeight: 700,
        }}>
          {initials}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.name?.split(' ')[0]}
        </span>
        <ChevronDown size={13} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="dropdown-menu"
            style={{ minWidth: 220 }}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {/* User info header */}
            <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{user?.email}</div>
              <div style={{ marginTop: 6 }}>
                <span className={`badge badge-${user?.role === 'ADMIN' ? 'danger' : user?.role === 'DEVELOPER' ? 'blue' : 'muted'}`} style={{ fontSize: 10 }}>
                  {user?.role}
                </span>
              </div>
            </div>
            <Link to="/profile" className="dropdown-item" onClick={() => setOpen(false)}>
              <User size={14} /> Profile
            </Link>
            <Link to="/favorites" className="dropdown-item" onClick={() => setOpen(false)}>
              <Heart size={14} /> Favorites
            </Link>
            {(user?.role === 'DEVELOPER' || user?.role === 'ADMIN') && (
              <Link to="/developer" className="dropdown-item" onClick={() => setOpen(false)}>
                <Code2 size={14} /> Developer Dashboard
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="dropdown-item" onClick={() => setOpen(false)}>
                <Shield size={14} /> Admin Panel
              </Link>
            )}
            <div className="dropdown-separator" />
            <button className="dropdown-item danger" onClick={() => { onLogout(); setOpen(false); }}>
              <LogOut size={14} /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileMenu({ open, onClose, user, onLogout }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 150 }}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 280,
              background: 'var(--bg-card)', zIndex: 200, padding: 24,
              borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 17 }}>Navigation</span>
              <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={18} /></button>
            </div>
            {[
              { to: '/home', label: 'Home' },
              { to: '/marketplace', label: 'Marketplace' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} onClick={onClose} style={{
                display: 'block', padding: '11px 14px', borderRadius: 10,
                fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}>
                {label}
              </Link>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {user ? (
                <>
                  <Link to="/profile" onClick={onClose} className="btn btn-secondary">Profile</Link>
                  <button onClick={() => { onLogout(); onClose(); }} className="btn btn-ghost">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={onClose} className="btn btn-secondary">Log In</Link>
                  <Link to="/register" onClick={onClose} className="btn btn-primary">Sign Up</Link>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const handleLogout = () => { logout(); navigate('/home'); };
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/marketplace?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          {/* Logo */}
          <Link to="/home" className="navbar-logo">
            <div className="navbar-logo-icon">
              <Anchor size={15} color="white" />
            </div>
            WebHarbour
          </Link>

          {/* Desktop Nav */}
          <ul className="navbar-nav" style={{ flex: 1, justifyContent: 'center' }}>
            <li>
              <NavLink to="/home" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/marketplace" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                Marketplace
              </NavLink>
            </li>
            {(user?.role === 'DEVELOPER' || user?.role === 'ADMIN') && (
              <li>
                <NavLink to="/developer" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                  Dev Dashboard
                </NavLink>
              </li>
            )}
          </ul>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className="navbar-search"
              style={{
                borderColor: searchFocused ? 'var(--accent)' : 'var(--border)',
                boxShadow: searchFocused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search apps…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: 13, color: 'var(--text-primary)' }}
              />
            </div>
          </form>

          {/* Actions */}
          <div className="navbar-actions">
            {isAuthenticated && user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
                <Link to="/register" className="btn btn-primary btn-sm" style={{ borderRadius: '9999px' }}>
                  Sign Up
                </Link>
              </>
            )}
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setMobileOpen(true)}
              style={{ display: 'none' }}
              id="mobile-menu-btn"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
