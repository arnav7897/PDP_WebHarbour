import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import AppCard from '../components/apps/AppCard';
import { LoadingGrid, EmptyState } from '../components/ui';
import { Heart, ArrowRight, Sparkles } from 'lucide-react';

export default function FavoritesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get('/apps/favorites').then(r => r.data),
  });

  const apps = data?.items || data || [];

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '48px 0 80px' }}>
      <div className="container">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{ marginBottom: 40 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'var(--orange-subtle)', border: '1px solid var(--orange-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={18} style={{ color: 'var(--orange)', fill: 'var(--orange)' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Your Favorites
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>
                Apps you've saved for later
              </p>
            </div>
          </div>

          {!isLoading && apps.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <span className="badge badge-orange">{apps.length} saved app{apps.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <LoadingGrid count={6} />
        ) : apps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <EmptyState
              icon="❤️"
              title="No favorites yet"
              description="Browse the marketplace and heart apps you want to keep track of."
              action={
                <Link to="/marketplace" className="btn btn-primary">
                  <Sparkles size={15} /> Explore Marketplace <ArrowRight size={15} />
                </Link>
              }
            />
          </motion.div>
        ) : (
          <motion.div
            className="app-grid"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } }, hidden: {} }}
          >
            {apps.map(app => (
              <motion.div
                key={app.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                <AppCard app={{ ...app, isFavorited: true }} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
