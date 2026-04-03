import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Package } from 'lucide-react';

export default function CreateAppPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    isFree: true,
    price: '',
    contentType: 'SOFTWARE',
    licenseType: '',
    ageRating: '',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then(r => r.data),
  });

  const handleTagToggle = (tagId) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tagId) ? f.tags.filter(t => t !== tagId) : [...f.tags, tagId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('App name is required.'); return; }
    if (!form.description.trim()) { setError('Description is required.'); return; }
    if (!form.categoryId) { setError('Please select a category.'); return; }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim() || undefined,
        categoryId: parseInt(form.categoryId),
        isFree: form.isFree,
        price: !form.isFree ? parseFloat(form.price) || 0 : undefined,
        contentType: form.contentType,
        licenseType: form.licenseType || undefined,
        ageRating: form.ageRating || undefined,
        tags: form.tags,
      };
      const { data } = await api.post('/apps', payload);
      toast.success('App created successfully!');
      navigate('/developer');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create app.');
    } finally {
      setLoading(false);
    }
  };

  const CONTENT_TYPES = ['SOFTWARE', 'PDF', 'EBOOK', 'TEMPLATE', 'PLUGIN', 'EXTENSION', 'ASSET', 'OTHER'];

  return (
    <div className="section" style={{ paddingTop: 40 }}>
      <div className="container" style={{ maxWidth: 680 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
            <ArrowLeft size={15} /> Back
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Create New App</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Fill in the details below. Your app will be created as a Draft — submit it for review when ready.
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <form id="create-app-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {error && (
              <div style={{
                padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, fontSize: 14, color: 'var(--danger)',
              }}>
                {error}
              </div>
            )}

            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Basic Info</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="app-name">App Name *</label>
                  <input
                    id="app-name"
                    type="text"
                    className="form-input"
                    placeholder="My Awesome App"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="app-short-desc">Short Description</label>
                  <input
                    id="app-short-desc"
                    type="text"
                    className="form-input"
                    placeholder="One-line summary shown in cards"
                    value={form.shortDescription}
                    onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))}
                    maxLength={200}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="app-desc">Full Description *</label>
                  <textarea
                    id="app-desc"
                    className="form-input form-textarea"
                    style={{ minHeight: 140 }}
                    placeholder="Describe your app in detail — features, use cases, system requirements…"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Classification</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="app-category">Category *</label>
                  <select
                    id="app-category"
                    className="form-input form-select"
                    value={form.categoryId}
                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    required
                  >
                    <option value="">Select category…</option>
                    {(categories || []).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="app-content-type">Content Type</label>
                  <select
                    id="app-content-type"
                    className="form-input form-select"
                    value={form.contentType}
                    onChange={e => setForm(f => ({ ...f, contentType: e.target.value }))}
                  >
                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="app-license">License Type</label>
                  <input
                    id="app-license"
                    type="text"
                    className="form-input"
                    placeholder="e.g. MIT, Commercial, Freeware"
                    value={form.licenseType}
                    onChange={e => setForm(f => ({ ...f, licenseType: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="app-age-rating">Age Rating</label>
                  <input
                    id="app-age-rating"
                    type="text"
                    className="form-input"
                    placeholder="e.g. E, 12+, 18+"
                    value={form.ageRating}
                    onChange={e => setForm(f => ({ ...f, ageRating: e.target.value }))}
                  />
                </div>
              </div>

              {/* Tags */}
              {(tags || []).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div className="form-label" style={{ marginBottom: 10 }}>Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className={form.tags.includes(tag.id) ? 'badge badge-accent' : 'badge badge-muted'}
                        style={{ cursor: 'pointer', border: 'none', fontSize: 12, padding: '4px 10px' }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Pricing</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { label: 'Free', value: true },
                    { label: 'Paid', value: false },
                  ].map(({ label, value }) => (
                    <button
                      key={label}
                      type="button"
                      className={form.isFree === value ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                      onClick={() => setForm(f => ({ ...f, isFree: value }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {!form.isFree && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="app-price">Price (USD)</label>
                    <input
                      id="app-price"
                      type="number"
                      className="form-input"
                      placeholder="9.99"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button
                id="create-app-btn"
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating…</>
                ) : (
                  <><Package size={15} /> Create App Draft</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
