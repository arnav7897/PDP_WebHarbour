import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { StarRating, StatusBadge, PageLoader, EmptyState } from '../components/ui';
import toast from 'react-hot-toast';
import {
  Download, Heart, Flag, Star, Tag, Package, Globe, Calendar,
  ChevronLeft, ExternalLink, Shield, ArrowDownToLine, User
} from 'lucide-react';

const APP_EMOJIS = ['🚀', '⚡', '🎯', '💡', '🔧', '🎮', '📱', '🌐', '🔑', '📊'];

export default function AppDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');

  const { data: app, isLoading, error } = useQuery({
    queryKey: ['app', id],
    queryFn: () => api.get(`/apps/${id}`).then(r => r.data),
  });

  const { data: versions } = useQuery({
    queryKey: ['app', id, 'versions'],
    queryFn: () => api.get(`/apps/${id}/versions`).then(r => r.data),
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['app', id, 'reviews'],
    queryFn: () => api.get(`/apps/${id}/reviews`).then(r => r.data),
    enabled: !!id,
  });

  const downloadMutation = useMutation({
    mutationFn: () => api.post(`/apps/${id}/download`),
    onSuccess: () => {
      toast.success('Download started!');
      queryClient.invalidateQueries(['app', id]);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Download failed'),
  });

  const favoriteMutation = useMutation({
    mutationFn: (action) =>
      action === 'add'
        ? api.post(`/apps/${id}/favorite`)
        : api.delete(`/apps/${id}/favorite`),
    onSuccess: () => {
      toast.success('Updated favorites!');
      queryClient.invalidateQueries(['app', id]);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Action failed'),
  });

  const reviewMutation = useMutation({
    mutationFn: (data) => api.post(`/apps/${id}/reviews`, data),
    onSuccess: () => {
      toast.success('Review submitted!');
      setReviewComment('');
      setReviewTitle('');
      setReviewRating(5);
      queryClient.invalidateQueries(['app', id, 'reviews']);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Review failed'),
  });

  const handleDownload = () => {
    if (!isAuthenticated) { toast.error('Please log in to download'); return; }
    window.open(`/apps/${id}/download/redirect`, '_blank');
    downloadMutation.mutate();
  };

  const handleReview = (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please log in to review'); return; }
    reviewMutation.mutate({ rating: reviewRating, title: reviewTitle, comment: reviewComment });
  };

  if (isLoading) return <PageLoader />;

  if (error) return (
    <div className="container section">
      <EmptyState icon="❌" title="App not found" description="The app you're looking for doesn't exist." />
    </div>
  );

  const emoji = APP_EMOJIS[(parseInt(id) || 0) % APP_EMOJIS.length];

  return (
    <div>
      {/* Banner */}
      <div style={{
        height: 260,
        background: app?.bannerUrl
          ? `url(${app.bannerUrl}) center/cover`
          : 'linear-gradient(135deg, #1e1e2e, #2d2d44, #1e2e3e)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(9,9,11,0.9))' }} />
        <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: 24, position: 'relative' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
            style={{ position: 'absolute', top: 16, left: 24 }}
          >
            <ChevronLeft size={16} /> Back
          </button>
        </div>
      </div>

      <div className="container">
        {/* App Header */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginTop: -32, marginBottom: 32, flexWrap: 'wrap' }}>
          {/* Icon */}
          <div style={{
            width: 80, height: 80, borderRadius: 16, flexShrink: 0,
            background: app?.iconUrl ? undefined : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: '3px solid var(--bg-primary)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, zIndex: 10,
          }}>
            {app?.iconUrl
              ? <img src={app.iconUrl} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : emoji
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>{app?.name}</h1>
              {app?.status && <StatusBadge status={app.status} />}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
              {app?.category?.name} · {app?.contentType}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {app?.averageRating > 0 && (
                <StarRating rating={app.averageRating} count={app.reviewCount} />
              )}
              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowDownToLine size={13} /> {app?.downloadCount?.toLocaleString() || 0} downloads
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleDownload}
              disabled={downloadMutation.isLoading}
            >
              <Download size={18} />
              {app?.isFree ? 'Download Free' : `Download $${app?.price?.toFixed(2)}`}
            </button>
            {isAuthenticated && (
              <button
                className="btn btn-secondary"
                onClick={() => favoriteMutation.mutate('add')}
                disabled={favoriteMutation.isLoading}
                title="Add to favorites"
              >
                <Heart size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        {app?.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
            {app.tags.map((t) => (
              <span key={t.id} className="badge badge-muted">
                <Tag size={10} /> {t.name}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          {['overview', 'versions', 'reviews'].map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, flexWrap: 'wrap' }}>
          {/* Main */}
          <div>
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>About This App</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 24 }}>
                  {app?.description}
                </p>

                {/* Screenshots */}
                {app?.screenshots?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Screenshots</h3>
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                      {app.screenshots.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Screenshot ${i + 1}`}
                          style={{ width: 220, height: 140, objectFit: 'cover', borderRadius: 10, flexShrink: 0, border: '1px solid var(--border)' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'versions' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Version History</h2>
                {!versions?.length ? (
                  <EmptyState icon="📦" title="No versions yet" description="The developer hasn't uploaded a version yet." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {versions.map((v, i) => (
                      <div key={v.id} className="card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                              v{v.version}
                              {i === 0 && <span className="badge badge-success" style={{ fontSize: 11 }}>Latest</span>}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                              {new Date(v.releaseDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{v.fileSize}</div>
                        </div>
                        {v.changelog && (
                          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6 }}>
                            {v.changelog}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Reviews</h2>

                {/* Write Review */}
                {isAuthenticated && (
                  <div className="card" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Write a Review</h3>
                    <form onSubmit={handleReview} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Rating</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[1,2,3,4,5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setReviewRating(s)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: 24, color: s <= reviewRating ? 'var(--warning)' : 'var(--text-muted)',
                                transition: 'color 0.15s',
                              }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Review title (optional)"
                        value={reviewTitle}
                        onChange={e => setReviewTitle(e.target.value)}
                      />
                      <textarea
                        className="form-input form-textarea"
                        placeholder="Share your experience…"
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        required
                      />
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={reviewMutation.isLoading}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        {reviewMutation.isLoading ? 'Submitting…' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Reviews List */}
                {!reviews?.items?.length ? (
                  <EmptyState icon="⭐" title="No reviews yet" description="Be the first to review this app!" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {reviews.items.map((r) => (
                      <div key={r.id} className="card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{r.title || 'Review'}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                              by {r.user?.name || 'Anonymous'} · {new Date(r.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <StarRating rating={r.rating} size={14} />
                        </div>
                        {r.comment && (
                          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <aside>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>App Details</h3>
              {[
                { label: 'Category', value: app?.category?.name },
                { label: 'Type', value: app?.contentType },
                { label: 'Platforms', value: app?.platforms?.join(', ') },
                { label: 'File Size', value: app?.fileSize },
                { label: 'License', value: app?.licenseType },
                { label: 'Last Updated', value: app?.lastUpdatedAt && new Date(app.lastUpdatedAt).toLocaleDateString() },
                { label: 'Published', value: app?.publishedAt && new Date(app.publishedAt).toLocaleDateString() },
              ].filter(d => d.value).map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)', textAlign: 'right', maxWidth: 160 }}>{value}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>Stats</h3>
              {[
                { label: 'Downloads', value: app?.downloadCount?.toLocaleString() || '0' },
                { label: 'Reviews', value: app?.reviewCount?.toLocaleString() || '0' },
                { label: 'Avg Rating', value: app?.averageRating ? `${app.averageRating.toFixed(1)} / 5.0` : 'N/A' },
                { label: 'Favorites', value: app?.favoriteCount?.toLocaleString() || '0' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
