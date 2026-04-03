import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { ArrowUpRight, Star, Download, Heart } from 'lucide-react';

void motion;

const GRADIENTS = [
  'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
  'linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)',
  'linear-gradient(135deg, #1A1A2E 0%, #7C3AED 100%)',
  'linear-gradient(135deg, #134E4A 0%, #0D9488 100%)',
  'linear-gradient(135deg, #1E3A5F 0%, #0284C7 100%)',
  'linear-gradient(135deg, #450A0A 0%, #DC2626 100%)',
  'linear-gradient(135deg, #1C1917 0%, #F97316 100%)',
  'linear-gradient(135deg, #14532D 0%, #16A34A 100%)',
];

const EMOJIS = ['⚡', '🎨', '📊', '🔐', '🚀', '🛠️', '📱', '🌐', '🔧', '💎', '🎯', '🧩'];

function getGradient(id) {
  const idx = typeof id === 'string' ? id.charCodeAt(0) % GRADIENTS.length : id % GRADIENTS.length;
  return GRADIENTS[idx];
}
function getEmoji(id) {
  const idx = typeof id === 'string' ? id.charCodeAt(1) % EMOJIS.length : id % EMOJIS.length;
  return EMOJIS[idx];
}

export default function AppCard({ app }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(app.isFavorited || false);

  const likeMutation = useMutation({
    mutationFn: () => liked
      ? api.delete(`/apps/${app.id}/favorite`)
      : api.post(`/apps/${app.id}/favorite`),
    onSuccess: () => {
      setLiked(!liked);
      queryClient.invalidateQueries(['favorites']);
    },
  });

  const gradient = getGradient(app.id);
  const emoji = getEmoji(app.id);
  const isFree = !app.price || app.price <= 0;
  const rating = app.avgRating ? Number(app.avgRating).toFixed(1) : null;
  const tags = app.tags?.slice(0, 2) || [];

  return (
    <motion.div
      className="app-card-premium"
      style={{ height: '100%' }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Link
        to={`/apps/${app.id}`}
        className="app-card-link"
        style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {/* Banner */}
        <div className="app-card-banner-area" style={{ background: gradient }}>
          <motion.div
            className="app-card-banner-emoji"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {app.iconUrl ? null : emoji}
          </motion.div>

          {/* Status badge */}
          {app.status && app.status !== 'PUBLISHED' && (
            <div className="app-card-status-badge">{app.status}</div>
          )}

          {/* Price chip */}
          <div className={`app-card-price-chip ${isFree ? 'free' : 'paid'}`}>
            {isFree ? 'Free' : `$${Number(app.price).toFixed(2)}`}
          </div>
        </div>

        {/* Card body */}
        <div className="app-card-body-premium" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="app-card-top-row">
            {/* Icon or fallback */}
            <div className="app-card-icon-wrap">
              {app.iconUrl ? (
                <img src={app.iconUrl} alt={app.name} className="app-card-icon-img" />
              ) : (
                <div className="app-card-icon-fallback" style={{ background: `${gradient.match(/#[\w]+/)?.[1] || '#2563EB'}18` }}>
                  {emoji}
                </div>
              )}
            </div>
            <div className="app-card-title-block">
              <h3 className="app-card-name">{app.name}</h3>
              <div className="app-card-category-label">{app.category?.name || app.type?.replace(/_/g, ' ')}</div>
            </div>
          </div>

          <p className="app-card-desc" style={{ minHeight: 'calc(1.6em * 2)' }}>
            {app.description || 'No description provided.'}
          </p>

          <div className="app-card-stats-row">
            {rating && (
              <div className="app-card-stat-pill">
                <Star size={10} className="stat-icon-star" style={{ color: 'var(--orange)', fill: 'var(--orange)' }} />
                {rating}
              </div>
            )}
            {app.downloadCount > 0 && (
              <div className="app-card-stat-pill">
                <Download size={10} />
                {app.downloadCount >= 1000 ? `${(app.downloadCount / 1000).toFixed(1)}k` : app.downloadCount}
              </div>
            )}
            {app.type && (
              <div className="app-card-type-chip">
                {app.type.replace(/_/g, ' ')}
              </div>
            )}
          </div>

          {tags.length > 0 && (
            <div className="app-card-tags" style={{ minHeight: 28, alignContent: 'flex-start' }}>
              {tags.map(t => (
                <span key={t.id || t} className="app-card-tag">#{t.name || t}</span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Hover arrow */}
      <div className="app-card-hover-arrow">
        <ArrowUpRight size={13} />
      </div>

      {/* Love button */}
      {isAuthenticated && (
        <button
          className={`app-card-like-btn ${liked ? 'liked' : ''}`}
          onClick={e => { e.preventDefault(); e.stopPropagation(); likeMutation.mutate(); }}
          title={liked ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={13} style={{ fill: liked ? 'var(--orange)' : 'none' }} />
        </button>
      )}
    </motion.div>
  );
}
