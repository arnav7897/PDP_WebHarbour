import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge, LoadingGrid, EmptyState } from '../../components/ui';
import AppCard from '../../components/apps/AppCard';
import toast from 'react-hot-toast';
import {
  Plus, LayoutDashboard, Package, TrendingUp, Clock, CheckCircle2,
  XCircle, ArrowRight, Download, Star, Heart, Send, RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('apps');

  const { data: myApps, isLoading } = useQuery({
    queryKey: ['myApps'],
    queryFn: () => api.get('/apps?mine=true&status=ALL&limit=50').then(r => r.data),
  });

  const { data: devStatus } = useQuery({
    queryKey: ['devStatus'],
    queryFn: () => api.get('/auth/developer-status').then(r => r.data),
    enabled: user?.role === 'USER',
  });

  const becomeDeveloperMutation = useMutation({
    mutationFn: () => api.post('/auth/become-developer'),
    onSuccess: () => {
      toast.success('Request submitted! Awaiting admin approval.');
      queryClient.invalidateQueries(['devStatus']);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Request failed'),
  });

  const submitAppMutation = useMutation({
    mutationFn: (appId) => api.post(`/apps/${appId}/submit`),
    onSuccess: () => {
      toast.success('App submitted for review!');
      queryClient.invalidateQueries(['myApps']);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Submit failed'),
  });

  const apps = myApps?.items || [];

  const totalDownloads = apps.reduce((sum, a) => sum + (a.downloadCount || 0), 0);
  const avgRating = apps.filter(a => a.averageRating > 0).reduce((sum, a, _, arr) => sum + a.averageRating / arr.length, 0);
  const publishedCount = apps.filter(a => a.status === 'PUBLISHED').length;
  const pendingCount = apps.filter(a => a.status === 'UNDER_REVIEW').length;

  // Not a developer yet
  if (user?.role === 'USER') {
    return (
      <div className="container section">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            maxWidth: 520, margin: '0 auto', textAlign: 'center',
            padding: 48, background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 24,
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Become a Developer</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.7 }}>
            Request developer access to publish and manage apps on WebHarbour.
            Your request will be reviewed by our admin team.
          </p>
          {devStatus?.status === 'PENDING' ? (
            <div style={{
              padding: 16, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 12, color: 'var(--warning)', fontSize: 14,
            }}>
              <Clock size={16} style={{ display: 'inline', marginRight: 6 }} />
              Request pending — An admin will review your application soon.
            </div>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              onClick={() => becomeDeveloperMutation.mutate()}
              disabled={becomeDeveloperMutation.isLoading}
            >
              {becomeDeveloperMutation.isLoading ? 'Submitting…' : 'Request Developer Access'}
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="section" style={{ paddingTop: 40 }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Developer Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Welcome back, {user?.name?.split(' ')[0]}!</p>
          </div>
          <Link to="/developer/create" className="btn btn-primary">
            <Plus size={16} /> New App
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Apps', value: apps.length, icon: Package, color: 'var(--accent-hover)' },
            { label: 'Published', value: publishedCount, icon: CheckCircle2, color: 'var(--success)' },
            { label: 'Under Review', value: pendingCount, icon: Clock, color: 'var(--warning)' },
            { label: 'Total Downloads', value: totalDownloads.toLocaleString(), icon: Download, color: 'var(--info)' },
            { label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '—', icon: Star, color: '#f59e0b' },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              className="card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'apps' ? 'active' : ''}`} onClick={() => setActiveTab('apps')}>My Apps</button>
        </div>

        {/* Apps List */}
        {isLoading ? (
          <LoadingGrid count={4} />
        ) : apps.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No apps yet"
            description="Create your first app listing to get started."
            action={
              <Link to="/developer/create" className="btn btn-primary">
                <Plus size={16} /> Create App
              </Link>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {apps.map((app) => (
              <motion.div
                key={app.id}
                className="card"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                  background: app.iconUrl ? undefined : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, overflow: 'hidden',
                  border: '1px solid var(--border)',
                }}>
                  {app.iconUrl
                    ? <img src={app.iconUrl} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '📦'
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{app.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <StatusBadge status={app.status} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Download size={11} /> {app.downloadCount || 0}
                    </span>
                    {app.averageRating > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        ★ {app.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {app.status === 'DRAFT' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => submitAppMutation.mutate(app.id)}
                      disabled={submitAppMutation.isLoading}
                    >
                      <Send size={12} /> Submit
                    </button>
                  )}
                  <Link to={`/apps/${app.id}`} className="btn btn-ghost btn-sm">
                    View <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
