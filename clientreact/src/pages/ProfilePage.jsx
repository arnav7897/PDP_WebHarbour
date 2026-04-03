import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import AppCard from '../components/apps/AppCard';
import { LoadingGrid, EmptyState } from '../components/ui';
import {
  User, Mail, Calendar, Shield, Edit2, Save, X as Close,
  Package, Download, Star, Heart, Camera, Check,
} from 'lucide-react';

function useReveal(ref, { once = true, margin = '-60px' } = {}) {
  return useInView(ref, { once, margin });
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [saved, setSaved] = useState(false);

  const { data: myApps, isLoading } = useQuery({
    queryKey: ['my-apps'],
    queryFn: () => api.get('/apps?myApps=true').then(r => r.data),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch('/users/me', data).then(r => r.data),
    onSuccess: (data) => {
      updateUser?.(data);
      queryClient.invalidateQueries(['user']);
      setEditMode(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleSave = () => updateMutation.mutate({ name: form.name, bio: form.bio });

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Recently';
  const apps = myApps?.items || [];
  const roleColor = { ADMIN: 'var(--danger)', DEVELOPER: 'var(--accent)', USER: 'var(--text-muted)' }[user?.role] || 'var(--text-muted)';
  const roleBg = { ADMIN: 'badge-danger', DEVELOPER: 'badge-blue', USER: 'badge-muted' }[user?.role] || 'badge-muted';

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: 900 }}>

        {/* — Profile Header Card — */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 20, overflow: 'hidden', marginBottom: 24,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Cover gradient */}
          <div style={{
            height: 120,
            background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 180, height: 180,
              background: 'rgba(255,255,255,0.08)', borderRadius: '50%',
            }} />
            <div style={{
              position: 'absolute', bottom: -30, left: 80,
              width: 100, height: 100,
              background: 'rgba(249,115,22,0.15)', borderRadius: '50%',
            }} />
          </div>

          <div style={{ padding: '0 28px 28px', position: 'relative' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div style={{ position: 'relative', marginTop: -40 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 800, color: 'white',
                  border: '4px solid var(--bg-card)', boxShadow: 'var(--shadow-md)',
                  fontFamily: "'Space Grotesk'",
                }}>
                  {initials}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--success)', fontSize: 13, fontWeight: 600 }}
                  >
                    <Check size={14} /> Saved
                  </motion.div>
                )}
                {!editMode ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => { setForm({ name: user?.name || '', bio: user?.bio || '' }); setEditMode(true); }}>
                    <Edit2 size={13} /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}><Close size={13} /> Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <><div className="spinner" style={{ width: 13, height: 13 }} /> Saving…</> : <><Save size={13} /> Save</>}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Name & info */}
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea className="form-input form-textarea" style={{ minHeight: 80 }} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell people about yourself…" />
                </div>
              </div>
            ) : (
              <>
                <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                  {user?.name || 'User'}
                </h1>
                {user?.bio && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{user.bio}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                    <Mail size={13} /> {user?.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                    <Calendar size={13} /> Joined {joinDate}
                  </div>
                  <span className={`badge ${roleBg}`}><Shield size={10} /> {user?.role}</span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* — Stats Row — */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}
        >
          {[
            { icon: Package, label: 'Apps Published', value: apps.length, color: 'var(--accent)', class: 'blue' },
            { icon: Download, label: 'Total Downloads', value: apps.reduce((a, b) => a + (b.downloadCount || 0), 0).toLocaleString(), color: 'var(--orange)', class: 'orange' },
            { icon: Star, label: 'Avg Rating', value: apps.length ? (apps.reduce((a, b) => a + (b.avgRating || 0), 0) / apps.length).toFixed(1) : '—', color: '#16A34A', class: 'green' },
          ].map(({ icon: Icon, label, value, color, class: cls }) => (
            <div key={label} className={`dash-stat-card ${cls}`}>
              <div className="dash-stat-icon" style={{ background: `${color}14` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="dash-stat-value">{value}</div>
              <div className="dash-stat-label">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* — Published Apps — */}
        {(user?.role === 'DEVELOPER' || user?.role === 'ADMIN') && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Space Grotesk'", fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Your Apps</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Apps you've published to the marketplace</p>
              </div>
              <Link to="/developer" className="btn btn-secondary btn-sm">View Dashboard</Link>
            </div>
            {isLoading ? <LoadingGrid count={3} /> : apps.length === 0 ? (
              <EmptyState icon="📦" title="No apps yet" description="Start your journey by publishing your first app." action={<Link to="/developer/create" className="btn btn-primary">Publish App</Link>} />
            ) : (
              <div className="app-grid">
                {apps.map(app => <AppCard key={app.id} app={app} />)}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
