import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { StarRating, StatusBadge, PageLoader, EmptyState } from '../components/ui';
import toast from 'react-hot-toast';
import {
  Download,
  Heart,
  Star,
  Tag,
  ChevronLeft,
  Shield,
  ArrowDownToLine,
  Calendar,
  Globe,
  Package,
  Sparkles,
  CheckCircle2,
  MonitorSmartphone,
  FileArchive,
  BadgeCheck,
  Clock3,
} from 'lucide-react';

const APP_EMOJIS = ['🚀', '⚡', '🎯', '💡', '🔧', '🎮', '📱', '🌐', '🔑', '📊'];
const APP_GRADIENTS = [
  'linear-gradient(135deg, #0f172a 0%, #1d4ed8 45%, #38bdf8 100%)',
  'linear-gradient(135deg, #172554 0%, #4f46e5 50%, #818cf8 100%)',
  'linear-gradient(135deg, #052e16 0%, #16a34a 50%, #4ade80 100%)',
  'linear-gradient(135deg, #431407 0%, #ea580c 45%, #fdba74 100%)',
  'linear-gradient(135deg, #3f0d12 0%, #b91c1c 50%, #fb7185 100%)',
];

const formatCount = (value = 0) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
};

const formatDate = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getVisualSeed = (id) => {
  const numericId = Number(id) || 0;
  return {
    emoji: APP_EMOJIS[numericId % APP_EMOJIS.length],
    gradient: APP_GRADIENTS[numericId % APP_GRADIENTS.length],
  };
};

const appSurfaceStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 24,
  boxShadow: 'var(--shadow-sm)',
};

const sectionTitleStyle = {
  fontFamily: "'Space Grotesk'",
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.03em',
  marginBottom: 10,
};

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
    queryFn: () => api.get(`/apps/${id}`).then((r) => r.data),
  });

  const { data: versionsResponse } = useQuery({
    queryKey: ['app', id, 'versions'],
    queryFn: () => api.get(`/apps/${id}/versions`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: reviewsResponse } = useQuery({
    queryKey: ['app', id, 'reviews'],
    queryFn: () => api.get(`/apps/${id}/reviews`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: favoritesResponse } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get('/users/me/favorites').then((r) => r.data),
    enabled: isAuthenticated,
  });

  const downloadMutation = useMutation({
    mutationFn: (versionId) => api.post(`/apps/${id}/download`, versionId ? { versionId } : {}),
    onSuccess: () => {
      toast.success('Download started!');
      queryClient.invalidateQueries({ queryKey: ['app', id] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Download failed'),
  });

  const favoriteMutation = useMutation({
    mutationFn: (action) =>
      action === 'add'
        ? api.post(`/apps/${id}/favorite`)
        : api.delete(`/apps/${id}/favorite`),
    onSuccess: (_, action) => {
      toast.success(action === 'add' ? 'Added to favorites!' : 'Removed from favorites.');
      queryClient.invalidateQueries({ queryKey: ['app', id] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
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
      queryClient.invalidateQueries({ queryKey: ['app', id, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['app', id] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Review failed'),
  });

  const handleDownload = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to download');
      return;
    }
    window.open(`/apps/${id}/download/redirect`, '_blank');
    downloadMutation.mutate();
  };

  const handleVersionDownload = (version) => {
    if (!isAuthenticated) {
      toast.error('Please log in to download');
      return;
    }
    window.open(`/apps/${id}/download/redirect?versionId=${version.id}`, '_blank');
    downloadMutation.mutate(version.id);
  };

  const handleMirrorDownload = (url, versionId) => {
    if (!url) return;
    if (!isAuthenticated) {
      toast.error('Please log in to download');
      return;
    }
    window.open(url, '_blank');
    downloadMutation.mutate(versionId);
  };

  const handleReview = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to review');
      return;
    }
    reviewMutation.mutate({ rating: reviewRating, title: reviewTitle, comment: reviewComment });
  };

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <div className="container section">
        <EmptyState icon="❌" title="App not found" description="The app you're looking for doesn't exist." />
      </div>
    );
  }

  const visualSeed = getVisualSeed(id);
  const screenshots = Array.isArray(app?.screenshots) ? app.screenshots : [];
  const versions = Array.isArray(versionsResponse) ? versionsResponse : versionsResponse?.items || [];
  const reviews = reviewsResponse?.items || reviewsResponse || [];
  const favoriteEntries = Array.isArray(favoritesResponse) ? favoritesResponse : favoritesResponse?.items || [];
  const isFavorited = favoriteEntries.some((entry) => Number(entry?.app?.id) === Number(id));
  const latestVersion = versions[0] || null;
  const heroStats = [
    {
      label: 'Rating',
      value: app?.averageRating ? Number(app.averageRating).toFixed(1) : 'New',
      helper: app?.reviewCount ? `${formatCount(app.reviewCount)} reviews` : 'No reviews yet',
      icon: <Star size={14} />,
    },
    {
      label: 'Downloads',
      value: formatCount(app?.downloadCount || 0),
      helper: 'Total installs',
      icon: <ArrowDownToLine size={14} />,
    },
    {
      label: 'Category',
      value: app?.category?.name || 'Marketplace',
      helper: app?.contentType || 'Digital app',
      icon: <Package size={14} />,
    },
  ];
  const keyFacts = [
    { icon: <MonitorSmartphone size={14} />, label: 'Platforms', value: app?.platforms?.join(', ') || 'Web' },
    { icon: <FileArchive size={14} />, label: 'Size', value: app?.fileSize || 'Varies by file' },
    { icon: <Calendar size={14} />, label: 'Updated', value: formatDate(app?.lastUpdatedAt || app?.updatedAt) || 'Recently' },
    { icon: <BadgeCheck size={14} />, label: 'License', value: app?.licenseType || 'Standard' },
  ];
  const detailRows = [
    { label: 'Category', value: app?.category?.name },
    { label: 'Content Type', value: app?.contentType },
    { label: 'Platforms', value: app?.platforms?.join(', ') },
    { label: 'Published', value: formatDate(app?.publishedAt) },
    { label: 'Last Updated', value: formatDate(app?.lastUpdatedAt || app?.updatedAt) },
    { label: 'File Size', value: app?.fileSize },
    { label: 'License', value: app?.licenseType },
  ].filter((row) => row.value);
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'versions', label: 'Versions' },
    { id: 'reviews', label: 'Ratings & Reviews' },
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }}>
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: app?.bannerUrl
            ? `linear-gradient(180deg, rgba(9,9,11,0.16), rgba(9,9,11,0.75)), url(${app.bannerUrl}) center/cover`
            : visualSeed.gradient,
          minHeight: 360,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 28%), radial-gradient(circle at left center, rgba(255,255,255,0.12), transparent 32%)',
          }}
        />
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 28, paddingBottom: 54 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
            style={{
              borderRadius: 999,
              background: 'rgba(255,255,255,0.12)',
              color: 'white',
              borderColor: 'rgba(255,255,255,0.16)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 28,
              alignItems: 'end',
              marginTop: 42,
            }}
          >
            <div>
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 18 }}>
                <div
                  style={{
                    width: 108,
                    height: 108,
                    borderRadius: 28,
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow: '0 24px 50px rgba(0,0,0,0.22)',
                    background: 'rgba(255,255,255,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 42,
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {app?.iconUrl ? (
                    <img src={app.iconUrl} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    visualSeed.emoji
                  )}
                </div>

                <div style={{ minWidth: 0, paddingTop: 6 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    {app?.status && <StatusBadge status={app.status} />}
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(255,255,255,0.12)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.18)',
                      }}
                    >
                      <Shield size={10} /> Verified listing
                    </span>
                  </div>

                  <h1
                    style={{
                      fontFamily: "'Space Grotesk'",
                      fontSize: 'clamp(32px, 5vw, 48px)',
                      fontWeight: 900,
                      lineHeight: 1.02,
                      letterSpacing: '-0.05em',
                      color: 'white',
                      marginBottom: 10,
                    }}
                  >
                    {app?.name}
                  </h1>

                  <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
                    {app?.category?.name || 'Marketplace app'} {app?.contentType ? `• ${app.contentType}` : ''}
                  </div>

                  <p style={{ maxWidth: 720, color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 1.7, marginBottom: 0 }}>
                    {app?.shortDescription || app?.description || 'A polished digital product built for fast installs and everyday use.'}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12,
                }}
              >
                {heroStats.map(({ label, value, helper, icon }) => (
                  <div
                    key={label}
                    style={{
                      padding: '16px 18px',
                      borderRadius: 22,
                      background: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.76)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      {icon}
                      {label}
                    </div>
                    <div style={{ color: 'white', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
                      {value}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 13 }}>{helper}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 28,
                padding: 24,
                backdropFilter: 'blur(18px)',
                color: 'white',
                boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', marginBottom: 8 }}>
                Install
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.05em', marginBottom: 4 }}>
                {app?.isFree ? 'Free' : `$${Number(app?.price || 0).toFixed(2)}`}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.74)', lineHeight: 1.7, fontSize: 14, marginBottom: 20 }}>
                Fast download, verified files, and quick access to the latest release from the marketplace.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleDownload}
                  disabled={downloadMutation.isPending}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    borderRadius: 18,
                    height: 52,
                    fontWeight: 700,
                    boxShadow: '0 18px 38px rgba(37,99,235,0.28)',
                  }}
                >
                  <Download size={18} />
                  {downloadMutation.isPending ? 'Preparing download…' : app?.isFree ? 'Install' : 'Buy & Download'}
                </button>

                {latestVersion?.mirrorUrl && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleMirrorDownload(latestVersion.mirrorUrl, latestVersion.id)}
                    disabled={downloadMutation.isPending}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      borderRadius: 18,
                      height: 48,
                      background: 'rgba(64, 233, 8, 0.58)',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.14)',
                    }}
                  >
                    <Download size={16} /> Alternate Download
                  </button>
                )}

                {isAuthenticated && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => favoriteMutation.mutate(isFavorited ? 'remove' : 'add')}
                    disabled={favoriteMutation.isPending}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      borderRadius: 18,
                      height: 48,
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.14)',
                    }}
                  >
                    <Heart size={16} /> {isFavorited ? 'Saved' : 'Save to favorites'}
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                {keyFacts.map(({ label, value, icon }) => (
                  <div
                    key={label}
                    style={{
                      padding: 12,
                      borderRadius: 18,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.74)', fontSize: 12, marginBottom: 8 }}>
                      {icon}
                      {label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: -26, position: 'relative', zIndex: 2 }}>
        <div style={{ ...appSurfaceStyle, padding: 18, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: '1px solid',
                  borderColor: activeTab === tab.id ? 'var(--accent)' : 'var(--border)',
                  background: activeTab === tab.id ? 'var(--accent-subtle)' : 'var(--bg-card)',
                  color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                  borderRadius: 999,
                  padding: '11px 18px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 26,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {screenshots.length > 0 && (
                  <section style={{ ...appSurfaceStyle, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ ...sectionTitleStyle, marginBottom: 6 }}>Preview</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                          A quick visual walkthrough, inspired by the app galleries you see in the Play Store.
                        </p>
                      </div>
                      <span className="badge badge-accent">
                        <Sparkles size={10} /> {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
                      {screenshots.map((url, index) => (
                        <div
                          key={url}
                          style={{
                            minWidth: 240,
                            width: 240,
                            borderRadius: 26,
                            overflow: 'hidden',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          <img
                            src={url}
                            alt={`Screenshot ${index + 1}`}
                            style={{ width: '100%', height: 500, objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section style={{ ...appSurfaceStyle, padding: 28 }}>
                  <div style={{ ...sectionTitleStyle }}>About This App</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.9, whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                    {app?.description}
                  </p>
                </section>

                <section style={{ ...appSurfaceStyle, padding: 28 }}>
                  <div style={{ ...sectionTitleStyle }}>Why Users Install It</div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 14,
                    }}
                  >
                    {[
                      { title: 'Safe delivery', desc: 'Verified marketplace listing and downloadable release flow.', icon: <Shield size={18} /> },
                      { title: 'Fresh updates', desc: latestVersion?.version ? `Latest release is v${latestVersion.version}.` : 'Developers can ship versioned updates here.', icon: <CheckCircle2 size={18} /> },
                      { title: 'Cross-platform ready', desc: app?.platforms?.length ? app.platforms.join(', ') : 'Works in common environments.', icon: <Globe size={18} /> },
                    ].map(({ title, desc, icon }) => (
                      <div
                        key={title}
                        style={{
                          padding: 18,
                          borderRadius: 20,
                          background: 'linear-gradient(180deg, var(--bg-card), var(--bg-secondary))',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                          {icon}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{title}</div>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 0 }}>{desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {app?.tags?.length > 0 && (
                  <section style={{ ...appSurfaceStyle, padding: 24 }}>
                    <div style={{ ...sectionTitleStyle, marginBottom: 14 }}>Tags</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {app.tags.map((tag) => (
                        <span key={tag.id} className="badge badge-muted" style={{ paddingInline: 12, paddingBlock: 8 }}>
                          <Tag size={10} /> {tag.name}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'versions' && (
              <div>
                <section style={{ ...appSurfaceStyle, padding: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ ...sectionTitleStyle, marginBottom: 6 }}>Versions</div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                        Browse release history and download any available version of this app.
                      </p>
                    </div>
                    <span className="badge badge-accent">
                      <Clock3 size={10} /> {versions.length} release{versions.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {!versions.length ? (
                    <EmptyState icon="📦" title="No versions yet" description="The developer hasn't uploaded a version yet." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {versions.map((version, index) => (
                        <div
                          key={version.id}
                          style={{
                            padding: 20,
                            borderRadius: 22,
                            background: index === 0 ? 'linear-gradient(180deg, rgba(37,99,235,0.08), rgba(37,99,235,0.02))' : 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <div style={{ fontSize: 18, fontWeight: 800 }}>Version {version.version}</div>
                                {index === 0 && <span className="badge badge-success">Latest</span>}
                              </div>
                              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                                {formatDate(version.releaseDate || version.createdAt) || 'Recently added'}
                              </div>
                            </div>
                            {version.fileSize && (
                              <span className="badge badge-muted">
                                <FileArchive size={10} /> {version.fileSize}
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 0 }}>
                            {version.changelog || 'No changelog was included for this release.'}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                              {version.supportedOs?.length ? `Supported: ${version.supportedOs.join(', ')}` : 'Standard release package'}
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleVersionDownload(version)}
                                disabled={downloadMutation.isPending}
                                style={{ borderRadius: 12 }}
                              >
                                <Download size={14} /> Download v{version.version}
                              </button>
                              {version.mirrorUrl && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleMirrorDownload(version.mirrorUrl, version.id)}
                                  disabled={downloadMutation.isPending}
                                  style={{ borderRadius: 12 }}
                                >
                                  <Download size={14} /> Alternate
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <section style={{ ...appSurfaceStyle, padding: 28 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, alignItems: 'start' }}>
                    <div>
                      <div style={{ ...sectionTitleStyle, marginBottom: 6 }}>Ratings & Reviews</div>
                      <div style={{ fontSize: 54, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 10 }}>
                        {app?.averageRating ? Number(app.averageRating).toFixed(1) : '0.0'}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <StarRating rating={app?.averageRating || 0} count={app?.reviewCount || 0} />
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        Based on {app?.reviewCount?.toLocaleString() || 0} review{app?.reviewCount === 1 ? '' : 's'}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 10 }}>
                      {[5, 4, 3, 2, 1].map((score) => {
                        const totalReviews = app?.reviewCount || 0;
                        const matchingCount = reviews.filter((review) => Number(review.rating) === score).length;
                        const fill = totalReviews ? `${(matchingCount / totalReviews) * 100}%` : '0%';

                        return (
                          <div key={score} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 44px', gap: 12, alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}>
                              {score} <Star size={12} style={{ fill: 'var(--warning)', color: 'var(--warning)' }} />
                            </div>
                            <div style={{ height: 9, borderRadius: 999, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                              <div style={{ width: fill, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{matchingCount}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {isAuthenticated && (
                  <section style={{ ...appSurfaceStyle, padding: 28 }}>
                    <div style={{ ...sectionTitleStyle, marginBottom: 16 }}>Write A Review</div>
                    <form onSubmit={handleReview} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>Your rating</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => setReviewRating(score)}
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 14,
                                border: '1px solid',
                                borderColor: score <= reviewRating ? 'rgba(245,158,11,0.32)' : 'var(--border)',
                                background: score <= reviewRating ? 'rgba(245,158,11,0.12)' : 'var(--bg-secondary)',
                                color: score <= reviewRating ? 'var(--warning)' : 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Star size={18} style={{ fill: score <= reviewRating ? 'currentColor' : 'none' }} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="text"
                        className="form-input"
                        placeholder="Title your review"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                      />

                      <textarea
                        className="form-input form-textarea"
                        placeholder="Tell other users what stands out, what works well, and what could improve."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        required
                        style={{ minHeight: 130 }}
                      />

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={reviewMutation.isPending}
                        style={{ alignSelf: 'flex-start', borderRadius: 14, minWidth: 170 }}
                      >
                        {reviewMutation.isPending ? 'Submitting…' : 'Post Review'}
                      </button>
                    </form>
                  </section>
                )}

                <section style={{ ...appSurfaceStyle, padding: 28 }}>
                  {!reviews.length ? (
                    <EmptyState icon="⭐" title="No reviews yet" description="Be the first to review this app!" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          style={{
                            padding: 20,
                            borderRadius: 22,
                            border: '1px solid var(--border)',
                            background: 'linear-gradient(180deg, var(--bg-card), var(--bg-secondary))',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>{review.title || 'Review'}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: 13 }}>
                                <span>{review.user?.name || user?.name || 'Anonymous'}</span>
                                <span>•</span>
                                <span>{formatDate(review.createdAt)}</span>
                              </div>
                            </div>
                            <StarRating rating={review.rating} size={14} />
                          </div>
                          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 0 }}>
                            {review.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <section style={{ ...appSurfaceStyle, padding: 24 }}>
              <div style={{ ...sectionTitleStyle, fontSize: 20, marginBottom: 16 }}>App Info</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {detailRows.map((row) => (
                  <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'start' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{row.label}</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, lineHeight: 1.6 }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...appSurfaceStyle, padding: 24 }}>
              <div style={{ ...sectionTitleStyle, fontSize: 20, marginBottom: 16 }}>Marketplace Signals</div>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { label: 'Favorites', value: app?.favoriteCount?.toLocaleString() || '0' },
                  { label: 'Reviews', value: app?.reviewCount?.toLocaleString() || '0' },
                  { label: 'Average rating', value: app?.averageRating ? `${Number(app.averageRating).toFixed(1)} / 5` : 'Not rated yet' },
                  { label: 'Latest version', value: latestVersion?.version ? `v${latestVersion.version}` : 'Coming soon' },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 18,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                    }}
                  >
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>{row.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section
              style={{
                ...appSurfaceStyle,
                padding: 24,
                background: 'linear-gradient(180deg, rgba(37,99,235,0.06), rgba(37,99,235,0.02))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Safety & Quality</div>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: 14, marginBottom: 0 }}>
                This listing follows the same polished storefront structure users expect from major app marketplaces: clear metadata, visible ratings, version history, and download-focused actions.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
