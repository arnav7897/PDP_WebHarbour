import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { EmptyState, LoadingGrid, StatusBadge } from '../../components/ui';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  Download,
  ExternalLink,
  FileArchive,
  Globe,
  Layers,
  Package,
  PencilLine,
  Plus,
  Save,
  Search,
  Send,
  Star,
  Tag,
} from 'lucide-react';

const CONTENT_TYPES = ['SOFTWARE', 'PDF', 'EBOOK', 'TEMPLATE', 'PLUGIN', 'EXTENSION', 'ASSET', 'OTHER'];
const PLATFORM_OPTIONS = ['WINDOWS', 'MACOS', 'LINUX', 'WEB', 'MOBILE_IOS', 'MOBILE_ANDROID', 'CROSS_PLATFORM'];

const surfaceStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 24,
  boxShadow: 'var(--shadow-sm)',
};

const getErrorMessage = (error, fallback = 'Something went wrong.') =>
  error?.response?.data?.error?.message || error?.message || fallback;

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const normalizeCollection = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const createEditState = (app) => ({
  name: app?.name || '',
  shortDescription: app?.shortDescription || '',
  description: app?.description || '',
  categoryId: app?.category?.id ? String(app.category.id) : '',
  contentType: app?.contentType || 'SOFTWARE',
  licenseType: app?.licenseType || '',
  ageRating: app?.ageRating || '',
  fileSize: app?.fileSize || '',
  systemRequirements: app?.systemRequirements || '',
  isFree: app?.isFree ?? true,
  price: app?.price ?? '',
  iconUrl: app?.iconUrl || '',
  bannerUrl: app?.bannerUrl || '',
  screenshotsText: Array.isArray(app?.screenshots) ? app.screenshots.join('\n') : '',
  platforms: Array.isArray(app?.platforms) ? app.platforms : ['WEB'],
  tags: Array.isArray(app?.tags) ? app.tags.map((tag) => tag.id) : [],
});

const createVersionState = (app) => ({
  version: '',
  changelog: '',
  downloadUrl: '',
  fileSize: '',
  downloadFilename: '',
  mirrorUrl: '',
  supportedOs: Array.isArray(app?.platforms) && app.platforms.length ? app.platforms : ['WEB'],
});

function SectionCard({ title, subtitle, action, children }) {
  return (
    <section style={{ ...surfaceStyle, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk'", fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
            {title}
          </h2>
          {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 0 }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {hint && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function ToneMessage({ tone = 'info', children }) {
  const palette = {
    info: { bg: 'var(--info-subtle)', border: 'rgba(2,132,199,0.2)', color: 'var(--info)' },
    error: { bg: 'var(--danger-subtle)', border: 'rgba(220,38,38,0.2)', color: 'var(--danger)' },
    success: { bg: 'var(--success-subtle)', border: 'rgba(22,163,74,0.2)', color: 'var(--success)' },
  }[tone];

  return (
    <div style={{ padding: '12px 14px', borderRadius: 14, background: palette.bg, border: `1px solid ${palette.border}`, color: palette.color, fontSize: 13 }}>
      {children}
    </div>
  );
}

function DeveloperEditPanel({ app, categories, tags, onSave, savePending, onSubmitForReview, submitPending, onUploadMedia, uploadPending }) {
  const [form, setForm] = useState(() => createEditState(app));
  const [error, setError] = useState('');
  const [mediaState, setMediaState] = useState(() => ({
    iconFile: null,
    bannerFile: null,
    screenshotFiles: [],
    screenshotMode: 'append',
  }));
  const [mediaError, setMediaError] = useState('');

  const hasMediaFiles = Boolean(mediaState.iconFile || mediaState.bannerFile || (mediaState.screenshotFiles && mediaState.screenshotFiles.length));
  const currentScreenshots = Array.isArray(app?.screenshots) ? app.screenshots : [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('App name is required.');
    if (!form.description.trim()) return setError('Description is required.');
    if (!form.categoryId) return setError('Please choose a category.');
    if (!form.isFree && (form.price === '' || Number(form.price) < 0)) {
      return setError('Paid apps need a valid non-negative price.');
    }

    const payload = {
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim() || null,
      description: form.description.trim(),
      categoryId: Number(form.categoryId),
      contentType: form.contentType,
      licenseType: form.licenseType.trim() || null,
      ageRating: form.ageRating.trim() || null,
      fileSize: form.fileSize.trim() || null,
      systemRequirements: form.systemRequirements.trim() || null,
      isFree: form.isFree,
      price: form.isFree ? 0 : Number(form.price || 0),
      iconUrl: form.iconUrl.trim() || null,
      bannerUrl: form.bannerUrl.trim() || null,
      screenshots: form.screenshotsText.split('\n').map((line) => line.trim()).filter(Boolean),
      platforms: form.platforms,
      tags: form.tags,
    };

    try {
      await onSave(app.id, payload);
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Failed to save app.'));
    }
  };

  const handleMediaUpload = async () => {
    setMediaError('');
    if (!hasMediaFiles) {
      setMediaError('Select at least one image to upload.');
      return;
    }

    try {
      await onUploadMedia(app.id, {
        iconFile: mediaState.iconFile,
        bannerFile: mediaState.bannerFile,
        screenshotFiles: mediaState.screenshotFiles,
        screenshotMode: mediaState.screenshotMode,
      });
      setMediaState({
        iconFile: null,
        bannerFile: null,
        screenshotFiles: [],
        screenshotMode: 'append',
      });
    } catch (uploadError) {
      setMediaError(getErrorMessage(uploadError, 'Failed to upload media.'));
    }
  };

  return (
    <SectionCard
      title="Edit App"
      subtitle="Update your app listing, metadata, discovery settings, and pricing from here."
      action={
        app.status === 'DRAFT' ? (
          <button className="btn btn-secondary btn-sm" style={{ borderRadius: 12 }} disabled={submitPending} onClick={() => onSubmitForReview(app.id)}>
            {submitPending ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Submitting…</> : <><Send size={14} /> Submit For Review</>}
          </button>
        ) : null
      }
    >
      {error && <ToneMessage tone="error">{error}</ToneMessage>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <Field label="App Name">
            <input className="form-input" placeholder="Marketplace app name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
          </Field>
          <Field label="Category">
            <select className="form-input form-select" value={form.categoryId} onChange={(event) => setForm((state) => ({ ...state, categoryId: event.target.value }))}>
              <option value="">Select category…</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </Field>
          <Field label="Short Description">
            <input className="form-input" placeholder="One-line summary" value={form.shortDescription} onChange={(event) => setForm((state) => ({ ...state, shortDescription: event.target.value }))} />
          </Field>
          <Field label="Content Type">
            <select className="form-input form-select" value={form.contentType} onChange={(event) => setForm((state) => ({ ...state, contentType: event.target.value }))}>
              {CONTENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea className="form-input form-textarea" style={{ minHeight: 140 }} placeholder="Describe your app in detail." value={form.description} onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <Field label="License Type">
            <input className="form-input" placeholder="MIT, Commercial, Freeware…" value={form.licenseType} onChange={(event) => setForm((state) => ({ ...state, licenseType: event.target.value }))} />
          </Field>
          <Field label="Age Rating">
            <input className="form-input" placeholder="E, 12+, 18+" value={form.ageRating} onChange={(event) => setForm((state) => ({ ...state, ageRating: event.target.value }))} />
          </Field>
          <Field label="File Size">
            <input className="form-input" placeholder="120 MB" value={form.fileSize} onChange={(event) => setForm((state) => ({ ...state, fileSize: event.target.value }))} />
          </Field>
          <Field label="System Requirements">
            <input className="form-input" placeholder="Optional minimum requirements" value={form.systemRequirements} onChange={(event) => setForm((state) => ({ ...state, systemRequirements: event.target.value }))} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <Field label="Icon URL">
            <input className="form-input" placeholder="https://…" value={form.iconUrl} onChange={(event) => setForm((state) => ({ ...state, iconUrl: event.target.value }))} />
          </Field>
          <Field label="Banner URL">
            <input className="form-input" placeholder="https://…" value={form.bannerUrl} onChange={(event) => setForm((state) => ({ ...state, bannerUrl: event.target.value }))} />
          </Field>
        </div>

        <Field label="Screenshots" hint="One screenshot URL per line.">
          <textarea className="form-input form-textarea" style={{ minHeight: 110 }} placeholder="https://example.com/shot-1.png" value={form.screenshotsText} onChange={(event) => setForm((state) => ({ ...state, screenshotsText: event.target.value }))} />
        </Field>

        <div style={{ padding: 16, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Upload Media</div>
          {mediaError && <ToneMessage tone="error">{mediaError}</ToneMessage>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 12 }}>
            <Field label="Upload Icon">
              <input
                className="form-input"
                type="file"
                accept="image/*"
                onChange={(event) => setMediaState((state) => ({ ...state, iconFile: event.target.files?.[0] || null }))}
              />
            </Field>
            <Field label="Upload Banner">
              <input
                className="form-input"
                type="file"
                accept="image/*"
                onChange={(event) => setMediaState((state) => ({ ...state, bannerFile: event.target.files?.[0] || null }))}
              />
            </Field>
            <Field label="Upload Screenshots" hint="You can select multiple images.">
              <input
                className="form-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setMediaState((state) => ({ ...state, screenshotFiles: Array.from(event.target.files || []) }))}
              />
            </Field>
            <Field label="Screenshot Mode">
              <select
                className="form-input form-select"
                value={mediaState.screenshotMode}
                onChange={(event) => setMediaState((state) => ({ ...state, screenshotMode: event.target.value }))}
              >
                <option value="append">Append to existing</option>
                <option value="replace">Replace existing</option>
              </select>
            </Field>
          </div>

          {(app?.iconUrl || app?.bannerUrl || currentScreenshots.length) && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Current Media Preview</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {app?.iconUrl && (
                  <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={app.iconUrl} alt="App icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                {app?.bannerUrl && (
                  <div style={{ width: 140, height: 56, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={app.bannerUrl} alt="App banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                {currentScreenshots.slice(0, 4).map((url) => (
                  <div key={url} style={{ width: 72, height: 56, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={url} alt="Screenshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ borderRadius: 12 }}
              disabled={uploadPending || !hasMediaFiles}
              onClick={handleMediaUpload}
            >
              {uploadPending ? 'Uploading…' : 'Upload Media'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <Field label="Platforms">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PLATFORM_OPTIONS.map((platform) => {
                const selected = form.platforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    className={selected ? 'badge badge-accent' : 'badge badge-muted'}
                    style={{ border: 'none', cursor: 'pointer', padding: '6px 10px' }}
                    onClick={() =>
                      setForm((state) => ({
                        ...state,
                        platforms: selected ? state.platforms.filter((item) => item !== platform) : [...state.platforms, platform],
                      }))
                    }
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Tags">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map((tag) => {
                const selected = form.tags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={selected ? 'badge badge-accent' : 'badge badge-muted'}
                    style={{ border: 'none', cursor: 'pointer', padding: '6px 10px' }}
                    onClick={() =>
                      setForm((state) => ({
                        ...state,
                        tags: selected ? state.tags.filter((id) => id !== tag.id) : [...state.tags, tag.id],
                      }))
                    }
                  >
                    <Tag size={10} /> {tag.name}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) minmax(220px, 280px)', gap: 16 }}>
          <Field label="Access Type">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className={form.isFree ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'} style={{ borderRadius: 12 }} onClick={() => setForm((state) => ({ ...state, isFree: true, price: 0 }))}>
                Free
              </button>
              <button type="button" className={!form.isFree ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'} style={{ borderRadius: 12 }} onClick={() => setForm((state) => ({ ...state, isFree: false }))}>
                Paid
              </button>
            </div>
          </Field>
          <Field label="Price">
            <input className="form-input" type="number" min="0" step="0.01" placeholder="9.99" value={form.isFree ? 0 : form.price} disabled={form.isFree} onChange={(event) => setForm((state) => ({ ...state, price: event.target.value }))} />
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" style={{ borderRadius: 12 }} onClick={() => setForm(createEditState(app))}>
            Reset
          </button>
          <button type="submit" className="btn btn-primary" style={{ borderRadius: 12 }} disabled={savePending}>
            {savePending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Save size={15} /> Save App</>}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function DeveloperVersionPanel({ app, versions, versionsLoading, onCreateVersion, onUploadVersion, onUpdateVersion, createPending, uploadPending, updatePending }) {
  const [form, setForm] = useState(() => createVersionState(app));
  const [error, setError] = useState('');
  const [editingVersionId, setEditingVersionId] = useState(null);
  const [uploadMode, setUploadMode] = useState('upload');
  const [uploadFile, setUploadFile] = useState(null);

  const resetForm = () => {
    setForm(createVersionState(app));
    setEditingVersionId(null);
    setError('');
    setUploadMode('upload');
    setUploadFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.version.trim()) return setError('Version number is required.');

    const isEditing = Boolean(editingVersionId);
    const useUpload = uploadMode === 'upload' && !isEditing;

    if (useUpload) {
      if (!uploadFile) return setError('ZIP file is required.');
    } else if (!form.downloadUrl.trim()) {
      return setError('Download URL is required.');
    }

    try {
      if (useUpload) {
        const payload = {
          version: form.version.trim(),
          changelog: form.changelog.trim() || null,
          fileSize: form.fileSize.trim() || null,
          supportedOs: form.supportedOs,
          mirrorUrl: form.mirrorUrl.trim() || null,
          file: uploadFile,
        };
        await onUploadVersion(app.id, payload);
      } else {
        const payload = {
          version: form.version.trim(),
          changelog: form.changelog.trim() || null,
          downloadUrl: form.downloadUrl.trim(),
          fileSize: form.fileSize.trim() || '0 MB',
          downloadFilename: form.downloadFilename.trim() || null,
          mirrorUrl: form.mirrorUrl.trim() || null,
          supportedOs: form.supportedOs,
        };

        if (isEditing) {
          await onUpdateVersion(app.id, editingVersionId, payload);
        } else {
          await onCreateVersion(app.id, payload);
        }
      }
      resetForm();
    } catch (submitError) {
      setError(getErrorMessage(submitError, editingVersionId ? 'Failed to update version.' : useUpload ? 'Failed to upload version.' : 'Failed to add version.'));
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setUploadFile(file);
    if (file && !form.fileSize.trim()) {
      const mb = Math.max(1, Math.round(file.size / (1024 * 1024)));
      setForm((state) => ({ ...state, fileSize: `${mb} MB` }));
    }
  };

  const showUploadFields = uploadMode === 'upload' && !editingVersionId;
  const showUrlFields = !showUploadFields;

  return (
    <>
      <SectionCard title={editingVersionId ? 'Edit Version' : 'Add Version'} subtitle={editingVersionId ? 'Update an existing release for your app.' : 'Publish a new release and keep the version history updated.'}>
        {error && <ToneMessage tone="error">{error}</ToneMessage>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {!editingVersionId ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={showUploadFields ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                style={{ borderRadius: 12 }}
                onClick={() => {
                  setUploadMode('upload');
                  setError('');
                }}
              >
                Upload ZIP
              </button>
              <button
                type="button"
                className={showUrlFields ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                style={{ borderRadius: 12 }}
                onClick={() => {
                  setUploadMode('url');
                  setUploadFile(null);
                  setError('');
                }}
              >
                Use Download URL
              </button>
            </div>
          ) : (
            <ToneMessage tone="info">
              Editing an existing version uses the download URL. Upload a new ZIP to publish a new version.
            </ToneMessage>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <Field label="Version Number">
              <input className="form-input" placeholder="1.0.0" value={form.version} onChange={(event) => setForm((state) => ({ ...state, version: event.target.value }))} />
            </Field>
            <Field label="File Size">
              <input className="form-input" placeholder="128 MB" value={form.fileSize} onChange={(event) => setForm((state) => ({ ...state, fileSize: event.target.value }))} />
            </Field>
            <Field label="Mirror URL" hint="Optional developer-provided mirror link.">
              <input className="form-input" placeholder="https://downloads.example.com/my-app.zip" value={form.mirrorUrl} onChange={(event) => setForm((state) => ({ ...state, mirrorUrl: event.target.value }))} />
            </Field>
            {showUrlFields && (
              <Field label="Download File Name">
                <input className="form-input" placeholder="my-app-v1.0.0.zip" value={form.downloadFilename} onChange={(event) => setForm((state) => ({ ...state, downloadFilename: event.target.value }))} />
              </Field>
            )}
          </div>

          {showUrlFields && (
            <Field label="Download URL">
              <input className="form-input" placeholder="https://cdn.example.com/my-app-v1.0.0.zip" value={form.downloadUrl} onChange={(event) => setForm((state) => ({ ...state, downloadUrl: event.target.value }))} />
            </Field>
          )}

          {showUploadFields && (
            <Field label="ZIP File" hint="Upload the .zip release package for this version.">
              <input className="form-input" type="file" accept=".zip,application/zip" onChange={handleFileChange} />
              {uploadFile && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  Selected: {uploadFile.name}
                </div>
              )}
            </Field>
          )}

          <Field label="Supported OS">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PLATFORM_OPTIONS.map((platform) => {
                const selected = form.supportedOs.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    className={selected ? 'badge badge-accent' : 'badge badge-muted'}
                    style={{ border: 'none', cursor: 'pointer', padding: '6px 10px' }}
                    onClick={() =>
                      setForm((state) => ({
                        ...state,
                        supportedOs: selected ? state.supportedOs.filter((item) => item !== platform) : [...state.supportedOs, platform],
                      }))
                    }
                  >
                    <Globe size={10} /> {platform}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Changelog">
            <textarea className="form-input form-textarea" style={{ minHeight: 140 }} placeholder="Describe fixes, improvements, or breaking changes in this release." value={form.changelog} onChange={(event) => setForm((state) => ({ ...state, changelog: event.target.value }))} />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" style={{ borderRadius: 12 }} onClick={resetForm}>
              {editingVersionId ? 'Cancel Edit' : 'Clear'}
            </button>
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 12 }} disabled={createPending || uploadPending || updatePending}>
              {editingVersionId
                ? (updatePending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Save size={15} /> Save Version</>)
                : showUploadFields
                  ? (uploadPending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Uploading…</> : <><Plus size={15} /> Upload & Publish</>)
                  : (createPending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Publishing…</> : <><Plus size={15} /> Add Version</>)}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Version History" subtitle="Edit existing releases or review package links and supported platforms.">
        {versionsLoading ? (
          <LoadingGrid count={2} />
        ) : !versions.length ? (
          <EmptyState icon="📦" title="No versions yet" description="Add the first release for this app using the form above." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {versions.map((version, index) => (
              <div key={version.id} style={{ padding: 18, borderRadius: 20, border: '1px solid var(--border)', background: index === 0 ? 'linear-gradient(180deg, rgba(37,99,235,0.08), rgba(37,99,235,0.02))' : 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>v{version.version}</div>
                      {index === 0 && <span className="badge badge-success">Current</span>}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      Released {formatDate(version.releaseDate || version.createdAt)} • {version.fileSize || 'Unknown size'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ borderRadius: 12 }}
                      onClick={() => {
                        setEditingVersionId(version.id);
                        setError('');
                        setForm({
                          version: version.version || '',
                          changelog: version.changelog || '',
                          downloadUrl: version.downloadUrl || '',
                          fileSize: version.fileSize || '',
                          downloadFilename: version.downloadFilename || '',
                          mirrorUrl: version.mirrorUrl || '',
                          supportedOs: Array.isArray(version.supportedOs) && version.supportedOs.length ? version.supportedOs : (Array.isArray(app.platforms) ? app.platforms : ['WEB']),
                        });
                        setUploadMode('url');
                        setUploadFile(null);
                      }}
                    >
                      <PencilLine size={14} /> Edit
                    </button>
                    {version.downloadUrl && (
                      <a href={version.downloadUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ borderRadius: 12 }}>
                        <Download size={14} /> Package
                      </a>
                    )}
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 12 }}>
                  {version.changelog || 'No changelog was provided for this release.'}
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(version.supportedOs || []).map((platform) => (
                    <span key={platform} className="badge badge-muted">
                      <Globe size={10} /> {platform}
                    </span>
                  ))}
                  {version.downloadFilename && (
                    <span className="badge badge-muted">
                      <FileArchive size={10} /> {version.downloadFilename}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedAppId, setSelectedAppId] = useState(null);

  const { data: myApps, isLoading } = useQuery({
    queryKey: ['myApps'],
    queryFn: () => api.get('/apps?mine=true&status=ALL&limit=50').then((r) => r.data),
  });

  const { data: devStatus } = useQuery({
    queryKey: ['devStatus'],
    queryFn: () => api.get('/auth/developer-status').then((r) => r.data),
    enabled: user?.role === 'USER',
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
    enabled: user?.role === 'DEVELOPER' || user?.role === 'ADMIN',
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then((r) => r.data),
    enabled: user?.role === 'DEVELOPER' || user?.role === 'ADMIN',
  });

  const apps = Array.isArray(myApps?.items) ? myApps.items : [];
  const effectiveSelectedAppId = apps.some((app) => app.id === selectedAppId) ? selectedAppId : apps[0]?.id || null;

  const selectedAppQuery = useQuery({
    queryKey: ['developer', 'app', effectiveSelectedAppId],
    queryFn: () => api.get(`/apps/${effectiveSelectedAppId}`).then((r) => r.data),
    enabled: !!effectiveSelectedAppId,
  });

  const versionsQuery = useQuery({
    queryKey: ['developer', 'app', effectiveSelectedAppId, 'versions'],
    queryFn: () => api.get(`/apps/${effectiveSelectedAppId}/versions`).then((r) => r.data),
    enabled: !!effectiveSelectedAppId,
  });

  const categories = normalizeCollection(categoriesData);
  const tags = normalizeCollection(tagsData);
  const selectedApp = selectedAppQuery.data || apps.find((app) => app.id === effectiveSelectedAppId) || null;
  const versions = normalizeCollection(versionsQuery.data);
  const latestVersion = versions[0] || null;

  const totalDownloads = apps.reduce((sum, app) => sum + (app.downloadCount || 0), 0);
  const avgRating = apps.filter((app) => app.averageRating > 0).reduce((sum, app, _, arr) => sum + app.averageRating / arr.length, 0);
  const publishedCount = apps.filter((app) => app.status === 'PUBLISHED').length;
  const pendingCount = apps.filter((app) => app.status === 'UNDER_REVIEW').length;

  const filteredApps = !search.trim()
    ? apps
    : apps.filter((app) =>
        [app.name, app.description, app.shortDescription, app.category?.name, app.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search.toLowerCase())),
      );

  const invalidateDeveloperAppData = async (appId = effectiveSelectedAppId) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['myApps'] }),
      queryClient.invalidateQueries({ queryKey: ['developer', 'app', appId] }),
      queryClient.invalidateQueries({ queryKey: ['developer', 'app', appId, 'versions'] }),
    ]);
  };

  const becomeDeveloperMutation = useMutation({
    mutationFn: () => api.post('/auth/become-developer'),
    onSuccess: () => {
      toast.success('Request submitted! Awaiting admin approval.');
      queryClient.invalidateQueries({ queryKey: ['devStatus'] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Request failed')),
  });

  const submitAppMutation = useMutation({
    mutationFn: (appId) => api.post(`/apps/${appId}/submit`),
    onSuccess: async () => {
      toast.success('App submitted for review!');
      await invalidateDeveloperAppData();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Submit failed')),
  });

  const saveAppMutation = useMutation({
    mutationFn: ({ appId, payload }) => api.patch(`/apps/${appId}`, payload).then((r) => r.data),
    onSuccess: async (_, variables) => {
      toast.success('App updated successfully.');
      await invalidateDeveloperAppData(variables.appId);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to update app.')),
  });

  const uploadMediaMutation = useMutation({
    mutationFn: ({ appId, payload }) => {
      const formData = new FormData();
      if (payload.iconFile) formData.append('icon', payload.iconFile);
      if (payload.bannerFile) formData.append('banner', payload.bannerFile);
      if (payload.screenshotFiles?.length) {
        payload.screenshotFiles.forEach((file) => formData.append('screenshots', file));
      }
      if (payload.screenshotMode) formData.append('mode', payload.screenshotMode);
      return api.post(`/apps/${appId}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: async (_, variables) => {
      toast.success('Media uploaded successfully.');
      await invalidateDeveloperAppData(variables.appId);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to upload media.')),
  });

  const createVersionMutation = useMutation({
    mutationFn: ({ appId, payload }) => api.post(`/apps/${appId}/versions`, payload).then((r) => r.data),
    onSuccess: async (_, variables) => {
      toast.success('Version added successfully.');
      await invalidateDeveloperAppData(variables.appId);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to add version.')),
  });

  const uploadVersionMutation = useMutation({
    mutationFn: ({ appId, payload }) => {
      const formData = new FormData();
      formData.append('zip', payload.file);
      formData.append('version', payload.version);
      if (payload.changelog) formData.append('changelog', payload.changelog);
      if (payload.fileSize) formData.append('fileSize', payload.fileSize);
      if (payload.supportedOs?.length) formData.append('supportedOs', payload.supportedOs.join(','));
      if (payload.mirrorUrl) formData.append('mirrorUrl', payload.mirrorUrl);
      return api.post(`/apps/${appId}/versions/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: async (_, variables) => {
      toast.success('Version uploaded successfully.');
      await invalidateDeveloperAppData(variables.appId);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to upload version.')),
  });

  const updateVersionMutation = useMutation({
    mutationFn: ({ appId, versionId, payload }) => api.patch(`/apps/${appId}/versions/${versionId}`, payload).then((r) => r.data),
    onSuccess: async (_, variables) => {
      toast.success('Version updated successfully.');
      await invalidateDeveloperAppData(variables.appId);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to update version.')),
  });

  const handleSaveApp = (appId, payload) => saveAppMutation.mutateAsync({ appId, payload });
  const handleUploadMedia = (appId, payload) => uploadMediaMutation.mutateAsync({ appId, payload });
  const handleCreateVersion = (appId, payload) => createVersionMutation.mutateAsync({ appId, payload });
  const handleUploadVersion = (appId, payload) => uploadVersionMutation.mutateAsync({ appId, payload });
  const handleUpdateVersion = (appId, versionId, payload) => updateVersionMutation.mutateAsync({ appId, versionId, payload });
  const handleSubmitForReview = (appId) => submitAppMutation.mutate(appId);

  if (user?.role === 'USER') {
    return (
      <div className="container section">
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: 48, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Become a Developer</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.7 }}>
            Request developer access to publish and manage apps on WebHarbour. Your request will be reviewed by the admin team.
          </p>
          {devStatus?.status === 'PENDING' ? (
            <ToneMessage tone="info">
              <Clock size={16} style={{ display: 'inline', marginRight: 6 }} />
              Request pending — an admin will review your application soon.
            </ToneMessage>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={() => becomeDeveloperMutation.mutate()} disabled={becomeDeveloperMutation.isPending}>
              {becomeDeveloperMutation.isPending ? 'Submitting…' : 'Request Developer Access'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '40px 0 80px' }}>
      <div className="container">
        <div style={{ ...surfaceStyle, padding: 28, marginBottom: 24, background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(37,99,235,0.92))', borderColor: 'rgba(255,255,255,0.08)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '8px 12px', background: 'rgba(255,255,255,0.1)', marginBottom: 14 }}>
                <Code2 size={14} /> Developer Dashboard
              </div>
              <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.02, marginBottom: 10 }}>
                Manage your apps, releases, and listing quality from one workspace.
              </h1>
              <p style={{ maxWidth: 720, color: 'rgba(255,255,255,0.76)', fontSize: 15, lineHeight: 1.75, marginBottom: 0 }}>
                You can now edit your app details, add new versions, and update existing app versions directly from the developer dashboard.
              </p>
            </div>
            <Link to="/developer/create" className="btn btn-primary" style={{ borderRadius: 14 }}>
              <Plus size={16} /> New App
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Apps', value: apps.length, icon: Package },
            { label: 'Published', value: publishedCount, icon: CheckCircle2 },
            { label: 'Under Review', value: pendingCount, icon: Clock },
            { label: 'Downloads', value: totalDownloads.toLocaleString(), icon: Download },
            { label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '—', icon: Star },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ ...surfaceStyle, padding: 20 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                {React.createElement(icon, { size: 18 })}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>{value}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <LoadingGrid count={4} />
        ) : apps.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No apps yet"
            description="Create your first app listing to get started."
            action={<Link to="/developer/create" className="btn btn-primary"><Plus size={16} /> Create App</Link>}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)', gap: 24 }}>
            <SectionCard title="My Apps" subtitle="Choose an app to edit its listing and version history.">
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" placeholder="Search your apps…" value={search} onChange={(event) => setSearch(event.target.value)} style={{ paddingLeft: 36 }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '72vh', overflow: 'auto', paddingRight: 4 }}>
                {filteredApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedAppId(app.id)}
                    style={{ ...surfaceStyle, textAlign: 'left', padding: 16, cursor: 'pointer', borderColor: effectiveSelectedAppId === app.id ? 'var(--accent)' : 'var(--border)' }}
                  >
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, #1d4ed8, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 22 }}>
                        {app.iconUrl ? <img src={app.iconUrl} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{app.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{app.category?.name || 'Uncategorized'} • {app.contentType}</div>
                          </div>
                          <StatusBadge status={app.status} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span className="badge badge-muted">{app.isFree ? 'Free' : `$${Number(app.price || 0).toFixed(2)}`}</span>
                          <span className="badge badge-muted">{app.downloadCount || 0} downloads</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </SectionCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {!selectedApp ? (
                <EmptyState icon="📦" title="Select an app" description="Pick one of your apps from the left to edit it and manage its versions." />
              ) : (
                <>
                  <SectionCard
                    title={selectedApp.name}
                    subtitle={`${selectedApp.category?.name || 'Uncategorized'} • ${selectedApp.contentType || 'SOFTWARE'} • ${selectedApp.isFree ? 'Free' : `$${Number(selectedApp.price || 0).toFixed(2)}`}`}
                    action={<Link to={`/apps/${selectedApp.id}`} className="btn btn-secondary btn-sm" style={{ borderRadius: 12 }}><ExternalLink size={14} /> View Listing</Link>}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                      <div style={{ padding: 16, borderRadius: 18, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Status</div>
                        <StatusBadge status={selectedApp.status} />
                      </div>
                      <div style={{ padding: 16, borderRadius: 18, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Current Version</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{latestVersion?.version ? `v${latestVersion.version}` : 'No versions yet'}</div>
                      </div>
                      <div style={{ padding: 16, borderRadius: 18, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Downloads</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{selectedApp.downloadCount || 0}</div>
                      </div>
                      <div style={{ padding: 16, borderRadius: 18, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Updated</div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{formatDate(selectedApp.lastUpdatedAt || selectedApp.updatedAt)}</div>
                      </div>
                    </div>
                  </SectionCard>

                  <DeveloperEditPanel
                    key={`developer-edit-${selectedApp.id}-${selectedApp.updatedAt || ''}`}
                    app={selectedApp}
                    categories={categories}
                    tags={tags}
                    onSave={handleSaveApp}
                    savePending={saveAppMutation.isPending}
                    onSubmitForReview={handleSubmitForReview}
                    submitPending={submitAppMutation.isPending}
                    onUploadMedia={handleUploadMedia}
                    uploadPending={uploadMediaMutation.isPending}
                  />

                  <DeveloperVersionPanel
                    key={`developer-version-${selectedApp.id}`}
                    app={selectedApp}
                    versions={versions}
                    versionsLoading={versionsQuery.isLoading}
                    onCreateVersion={handleCreateVersion}
                    onUploadVersion={handleUploadVersion}
                    onUpdateVersion={handleUpdateVersion}
                    createPending={createVersionMutation.isPending}
                    uploadPending={uploadVersionMutation.isPending}
                    updatePending={updateVersionMutation.isPending}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
