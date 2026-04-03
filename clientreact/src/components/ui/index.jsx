import React from 'react';
import { motion } from 'framer-motion';

export function LoadingGrid({ count = 6 }) {
  return (
    <div className="app-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="skeleton" style={{ height: 128, borderRadius: 0 }} />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 7 }} />
                <div className="skeleton" style={{ height: 11, width: '40%' }} />
              </div>
            </div>
            <div className="skeleton" style={{ height: 11, width: '100%', marginBottom: 5 }} />
            <div className="skeleton" style={{ height: 11, width: '75%', marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 100 }} />
              <div className="skeleton" style={{ height: 20, width: 48, borderRadius: 100 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );
}

export function EmptyState({ icon = '📦', title = 'Nothing here yet', description = '', action = null }) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {description && <p className="empty-state-desc">{description}</p>}
      {action}
    </motion.div>
  );
}

const STATUS_CONFIG = {
  PUBLISHED:    { cls: 'badge-success', label: 'Published' },
  PENDING:      { cls: 'badge-warning', label: 'Pending Review' },
  REJECTED:     { cls: 'badge-danger',  label: 'Rejected' },
  DRAFT:        { cls: 'badge-muted',   label: 'Draft' },
  APPROVED:     { cls: 'badge-blue',    label: 'Approved' },
  UNDER_REVIEW: { cls: 'badge-info',    label: 'Under Review' },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { cls: 'badge-muted', label: status };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

export function StarRating({ rating, count, size = 14 }) {
  const n = Number(rating) || 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <span
            key={s}
            style={{
              color: s <= Math.round(n) ? 'var(--orange)' : 'var(--border-hover)',
              fontSize: size, lineHeight: 1,
            }}
          >
            ★
          </span>
        ))}
      </div>
      {count !== undefined && (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1}>‹</button>
      {start > 1 && (
        <>
          <button className="page-btn" onClick={() => onPageChange(1)}>1</button>
          {start > 2 && <span style={{ color: 'var(--text-muted)', padding: '0 4px', fontSize: 14 }}>…</span>}
        </>
      )}
      {pages.map((p) => (
        <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: 'var(--text-muted)', padding: '0 4px', fontSize: 14 }}>…</span>}
          <button className="page-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}
      <button className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>›</button>
    </div>
  );
}
