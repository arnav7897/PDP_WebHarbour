import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import AppCard from '../components/apps/AppCard';
import { LoadingGrid, EmptyState } from '../components/ui';
import {
  Search, SlidersHorizontal, X, ChevronDown, Grid, List,
  Package, Star, TrendingUp, Sparkles,
} from 'lucide-react';

const APP_TYPES = ['WEB_APP', 'DESKTOP_APP', 'MOBILE_APP', 'CLI_TOOL', 'LIBRARY', 'PLUGIN', 'TEMPLATE', 'OTHER'];
const SORT_OPTIONS = [
  { value: '', label: 'Most Relevant' },
  { value: 'newest', label: 'Newest First' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'downloads', label: 'Most Downloaded' },
];
const PRICE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
];

function FilterBadge({ label, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', borderRadius: 100,
        background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
        fontSize: 12, fontWeight: 600, color: 'var(--accent)',
      }}
    >
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', padding: 0 }}>
        <X size={11} />
      </button>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [localSearch, setLocalSearch] = useState(searchParams.get('q') || '');

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';
  const sort = searchParams.get('sort') || '';
  const price = searchParams.get('price') || '';
  const page = Number(searchParams.get('page') || 1);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data) });
  const categories = useMemo(() => categoriesData?.items || categoriesData || [], [categoriesData]);

  const queryKey = ['apps', q, category, type, sort, price, page];
  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      if (type) params.set('type', type);
      if (sort) params.set('sort', sort);
      if (price) params.set('price', price);
      params.set('page', page);
      params.set('limit', '12');
      return api.get(`/apps?${params}`).then(r => r.data);
    },
  });

  const apps = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleSearch = (e) => { e.preventDefault(); setParam('q', localSearch.trim()); };

  const activeFilters = [
    q && { key: 'q', label: `"${q}"`, onRemove: () => { setParam('q', ''); setLocalSearch(''); } },
    category && { key: 'category', label: category, onRemove: () => setParam('category', '') },
    type && { key: 'type', label: type.replace(/_/g, ' '), onRemove: () => setParam('type', '') },
    price && { key: 'price', label: price === 'free' ? 'Free' : 'Paid', onRemove: () => setParam('price', '') },
  ].filter(Boolean);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* — Header Bar — */}
      <div style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '24px 0', position: 'sticky', top: 60, zIndex: 40,
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border)', borderRadius: 10,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text" placeholder="Search apps, tools, templates…"
                  value={localSearch} onChange={e => setLocalSearch(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)' }}
                />
                {localSearch && <button type="button" onClick={() => { setLocalSearch(''); setParam('q', ''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>}
              </div>
              <button type="submit" className="btn btn-primary btn-sm">Search</button>
            </form>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setParam('sort', e.target.value)}
              className="form-input form-select"
              style={{ width: 160, padding: '8px 36px 8px 12px', fontSize: 13 }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <button
              className={`btn btn-sm ${sidebarOpen ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <SlidersHorizontal size={14} /> Filters
              {activeFilters.length > 0 && (
                <span style={{ background: sidebarOpen ? 'rgba(255,255,255,0.3)' : 'var(--accent)', color: 'white', borderRadius: 100, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter badges */}
          {activeFilters.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <AnimatePresence>
                {activeFilters.map(f => (
                  <FilterBadge key={f.key} label={f.label} onRemove={f.onRemove} />
                ))}
              </AnimatePresence>
              <button
                onClick={() => { setSearchParams({}); setLocalSearch(''); }}
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 8px' }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* — Sidebar — */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                className="sidebar"
                initial={{ opacity: 0, x: -20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 220 }}
                exit={{ opacity: 0, x: -20, width: 0 }}
                transition={{ duration: 0.2 }}
                style={{ flexShrink: 0, overflow: 'hidden' }}
              >
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, boxShadow: 'var(--shadow-sm)' }}>
                  {/* Categories */}
                  <div className="sidebar-section">
                    <div className="sidebar-title">Category</div>
                    <button className={`sidebar-item ${!category ? 'active' : ''}`} onClick={() => setParam('category', '')}>
                      <Sparkles size={13} /> All Categories
                    </button>
                    {categories.slice(0, 12).map(c => (
                      <button key={c.id || c.name} className={`sidebar-item ${category === (c.name || c) ? 'active' : ''}`} onClick={() => setParam('category', c.name || c)}>
                        <span>{c.name || c}</span>
                        {c.appCount !== undefined && <span className="sidebar-item-count">{c.appCount}</span>}
                      </button>
                    ))}
                  </div>

                  {/* App Type */}
                  <div className="sidebar-section">
                    <div className="sidebar-title">App Type</div>
                    <button className={`sidebar-item ${!type ? 'active' : ''}`} onClick={() => setParam('type', '')}>All Types</button>
                    {APP_TYPES.map(t => (
                      <button key={t} className={`sidebar-item ${type === t ? 'active' : ''}`} onClick={() => setParam('type', t)}>
                        {t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </div>

                  {/* Price */}
                  <div className="sidebar-section">
                    <div className="sidebar-title">Pricing</div>
                    {PRICE_FILTERS.map(p => (
                      <button key={p.value} className={`sidebar-item ${price === p.value ? 'active' : ''}`} onClick={() => setParam('price', p.value)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* — App Grid — */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Results header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {isLoading ? 'Loading…' : <><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{total}</span> results</>}
              </div>
              {isFetching && !isLoading && <div className="spinner" />}
            </div>

            {isLoading ? (
              <LoadingGrid count={9} />
            ) : apps.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No apps found"
                description="Try different keywords or clear some filters."
                action={<button className="btn btn-secondary" onClick={() => { setSearchParams({}); setLocalSearch(''); }}>Clear Filters</button>}
              />
            ) : (
              <>
                <motion.div
                  className="app-grid"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } }, hidden: {} }}
                >
                  {apps.map(app => (
                    <motion.div key={app.id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
                      <AppCard app={app} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination" style={{ marginTop: 40 }}>
                    <button className="page-btn" onClick={() => setParam('page', page - 1)} disabled={page <= 1}>‹</button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setParam('page', p)}>{p}</button>
                    ))}
                    <button className="page-btn" onClick={() => setParam('page', page + 1)} disabled={page >= totalPages}>›</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
