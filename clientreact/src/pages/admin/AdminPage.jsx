import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { EmptyState, PageLoader, StatusBadge } from '../../components/ui';
import toast from 'react-hot-toast';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Ban,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  FileArchive,
  Flag,
  Globe,
  Layers,
  Package,
  PencilLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shield,
  Tag,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';

const CONTENT_TYPES = ['SOFTWARE', 'PDF', 'EBOOK', 'TEMPLATE', 'PLUGIN', 'EXTENSION', 'ASSET', 'OTHER'];
const PLATFORM_OPTIONS = ['WINDOWS', 'MACOS', 'LINUX', 'WEB', 'MOBILE_IOS', 'MOBILE_ANDROID', 'CROSS_PLATFORM'];
const ADMIN_VIEWS = [
  { key: 'dashboard', label: 'Dashboard', icon: Activity },
  { key: 'apps', label: 'Apps Management', icon: Package },
  { key: 'versions', label: 'Version Control', icon: Layers },
  { key: 'developers', label: 'Developers', icon: Users },
  { key: 'reports', label: 'Reports', icon: Flag },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const surfaceStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 24,
  boxShadow: 'var(--shadow-sm)',
};

const normalizeCollection = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  return [];
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

const formatCount = (value = 0) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
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

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div style={{ ...surfaceStyle, padding: 20 }}>
      <div style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        {React.createElement(Icon, { size: 18 })}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {hint && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{hint}</div>}
    </div>
  );
}

function ViewButton({ view, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 999,
        border: '1px solid',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        background: active ? 'var(--accent-subtle)' : 'var(--bg-card)',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        padding: '12px 16px',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {React.createElement(view.icon, { size: 15 })}
      {view.label}
      {count > 0 && (
        <span className="badge badge-warning" style={{ fontSize: 10, padding: '2px 7px' }}>
          {count}
        </span>
      )}
    </button>
  );
}

function AppManagementPanel({ app, categories, tags, latestVersion, onSave, savePending, onAppAction, actionPending }) {
  const [form, setForm] = useState(() => createEditState(app));
  const [moderationNote, setModerationNote] = useState('');
  const [editError, setEditError] = useState('');
  const [statusError, setStatusError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setEditError('');

    if (!form.name.trim()) {
      setEditError('App name is required.');
      return;
    }
    if (!form.description.trim()) {
      setEditError('Description is required.');
      return;
    }
    if (!form.categoryId) {
      setEditError('Please choose a category.');
      return;
    }
    if (!form.isFree && (form.price === '' || Number(form.price) < 0)) {
      setEditError('Paid apps need a valid non-negative price.');
      return;
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
    } catch (error) {
      setEditError(getErrorMessage(error, 'Failed to update app.'));
    }
  };

  const handleAction = async (type) => {
    const note = moderationNote.trim();
    setStatusError('');

    if (type === 'reject' && !note) {
      setStatusError('Rejection reason is required.');
      return;
    }
    if (type === 'suspend' && !note) {
      setStatusError('Suspension reason is required.');
      return;
    }

    try {
      await onAppAction(type, app.id, note);
      setModerationNote('');
    } catch (error) {
      setStatusError(getErrorMessage(error, 'Status update failed.'));
    }
  };

  return (
    <>
      <SectionCard title="Edit App" subtitle="Admin can update listing content, pricing, metadata, and discovery details without leaving this panel.">
        {editError && <ToneMessage tone="error">{editError}</ToneMessage>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <Field label="App Name">
              <input className="form-input" placeholder="Marketplace app name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
            </Field>
            <Field label="Category">
              <select className="form-input form-select" value={form.categoryId} onChange={(event) => setForm((state) => ({ ...state, categoryId: event.target.value }))}>
                <option value="">Select category…</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Short Description" hint="Shown in cards and quick previews.">
              <input className="form-input" placeholder="Short one-line summary" value={form.shortDescription} onChange={(event) => setForm((state) => ({ ...state, shortDescription: event.target.value }))} />
            </Field>
            <Field label="Content Type">
              <select className="form-input form-select" value={form.contentType} onChange={(event) => setForm((state) => ({ ...state, contentType: event.target.value }))}>
                {CONTENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Full Description">
            <textarea className="form-input form-textarea" placeholder="Describe the app, key value, and why it matters." style={{ minHeight: 140 }} value={form.description} onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))} />
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
            <textarea className="form-input form-textarea" placeholder="https://example.com/shot-1.png" style={{ minHeight: 120 }} value={form.screenshotsText} onChange={(event) => setForm((state) => ({ ...state, screenshotsText: event.target.value }))} />
          </Field>

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
                          platforms: selected
                            ? state.platforms.filter((item) => item !== platform)
                            : [...state.platforms, platform],
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

          <SectionCard title="Pricing" subtitle="Keep free and paid states explicit for admins reviewing monetization.">
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
          </SectionCard>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" style={{ borderRadius: 12 }} onClick={() => setForm(createEditState(app))}>
              Reset Changes
            </button>
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 12 }} disabled={savePending}>
              {savePending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Save size={15} /> Save App</>}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Status Controls" subtitle="Approve, reject, suspend, or restore listings with clear moderation notes.">
        {statusError && <ToneMessage tone="error">{statusError}</ToneMessage>}
        {latestVersion?.version && (
          <div style={{ marginBottom: 16 }}>
            <ToneMessage tone="info">Current live release is v{latestVersion.version}. Any suspend or restore action will apply to the listing immediately.</ToneMessage>
          </div>
        )}

        <Field
          label={app.status === 'PUBLISHED' ? 'Suspension Reason' : app.status === 'UNDER_REVIEW' ? 'Moderation Note' : 'Optional Note'}
          hint={app.status === 'PUBLISHED' ? 'Required before suspending an app.' : app.status === 'UNDER_REVIEW' ? 'Required when rejecting, optional when approving.' : 'Optional note when restoring a suspended app.'}
        >
          <textarea className="form-input form-textarea" style={{ minHeight: 110 }} placeholder="Write the note, reason, or moderation guidance…" value={moderationNote} onChange={(event) => setModerationNote(event.target.value)} />
        </Field>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {app.status === 'UNDER_REVIEW' && (
            <>
              <button className="btn btn-primary" style={{ borderRadius: 12 }} disabled={actionPending} onClick={() => handleAction('approve')}>
                <CheckCircle size={15} /> Approve
              </button>
              <button className="btn btn-danger" style={{ borderRadius: 12 }} disabled={actionPending} onClick={() => handleAction('reject')}>
                <XCircle size={15} /> Reject
              </button>
            </>
          )}
          {app.status === 'PUBLISHED' && (
            <button className="btn btn-danger" style={{ borderRadius: 12 }} disabled={actionPending} onClick={() => handleAction('suspend')}>
              <Ban size={15} /> Suspend App
            </button>
          )}
          {app.status === 'SUSPENDED' && (
            <button className="btn btn-primary" style={{ borderRadius: 12 }} disabled={actionPending} onClick={() => handleAction('unsuspend')}>
              <RotateCcw size={15} /> Unsuspend App
            </button>
          )}
        </div>
      </SectionCard>
    </>
  );
}

function VersionManagementPanel({ app, versions, versionsLoading, onCreateVersion, onUpdateVersion, createPending, updatePending }) {
  const [form, setForm] = useState(() => createVersionState(app));
  const [versionError, setVersionError] = useState('');
  const [editingVersionId, setEditingVersionId] = useState(null);

  const resetForm = () => {
    setForm(createVersionState(app));
    setEditingVersionId(null);
    setVersionError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setVersionError('');

    if (!form.version.trim()) {
      setVersionError('Version number is required.');
      return;
    }
    if (!form.downloadUrl.trim()) {
      setVersionError('Download URL is required.');
      return;
    }

    const payload = {
      version: form.version.trim(),
      changelog: form.changelog.trim() || null,
      downloadUrl: form.downloadUrl.trim(),
      fileSize: form.fileSize.trim() || '0 MB',
      downloadFilename: form.downloadFilename.trim() || null,
      supportedOs: form.supportedOs,
    };

    try {
      if (editingVersionId) {
        await onUpdateVersion(app.id, editingVersionId, payload);
      } else {
        await onCreateVersion(app.id, payload);
      }
      resetForm();
    } catch (error) {
      setVersionError(getErrorMessage(error, editingVersionId ? 'Failed to update version.' : 'Failed to add version.'));
    }
  };

  return (
    <>
      <SectionCard title={editingVersionId ? 'Edit Version' : 'Add New Version'} subtitle={editingVersionId ? 'Update the selected release metadata, package URL, and changelog.' : 'Publish a new build, keep release history visible, and control the current version from one place.'}>
        {versionError && <ToneMessage tone="error">{versionError}</ToneMessage>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <Field label="Version Number">
              <input className="form-input" placeholder="1.4.0" value={form.version} onChange={(event) => setForm((state) => ({ ...state, version: event.target.value }))} />
            </Field>
            <Field label="File Size">
              <input className="form-input" placeholder="128 MB" value={form.fileSize} onChange={(event) => setForm((state) => ({ ...state, fileSize: event.target.value }))} />
            </Field>
            <Field label="Download File Name">
              <input className="form-input" placeholder="webharbour-app-v1.4.0.zip" value={form.downloadFilename} onChange={(event) => setForm((state) => ({ ...state, downloadFilename: event.target.value }))} />
            </Field>
            <Field label="Download URL">
              <input className="form-input" placeholder="https://cdn.example.com/app-v1.4.0.zip" value={form.downloadUrl} onChange={(event) => setForm((state) => ({ ...state, downloadUrl: event.target.value }))} />
            </Field>
          </div>

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
                        supportedOs: selected
                          ? state.supportedOs.filter((item) => item !== platform)
                          : [...state.supportedOs, platform],
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
            <textarea className="form-input form-textarea" style={{ minHeight: 140 }} placeholder="Describe what changed in this release, fixes, improvements, and important notes." value={form.changelog} onChange={(event) => setForm((state) => ({ ...state, changelog: event.target.value }))} />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" style={{ borderRadius: 12 }} onClick={resetForm}>
              {editingVersionId ? 'Cancel Edit' : 'Clear Form'}
            </button>
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 12 }} disabled={createPending || updatePending}>
              {editingVersionId
                ? (updatePending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Save size={15} /> Save Version</>)
                : (createPending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Publishing…</> : <><Plus size={15} /> Add Version</>)}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Version History" subtitle="Current version, version history, and downloadable package links are grouped here for admin review.">
        {versionsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : !versions.length ? (
          <EmptyState icon="📦" title="No versions yet" description="Create the first version for this app from the form above." />
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
                  {version.downloadUrl && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ borderRadius: 12 }}
                        onClick={() => {
                          setEditingVersionId(version.id);
                          setVersionError('');
                          setForm({
                            version: version.version || '',
                            changelog: version.changelog || '',
                            downloadUrl: version.downloadUrl || '',
                            fileSize: version.fileSize || '',
                            downloadFilename: version.downloadFilename || '',
                            supportedOs: Array.isArray(version.supportedOs) && version.supportedOs.length ? version.supportedOs : (Array.isArray(app.platforms) ? app.platforms : ['WEB']),
                          });
                        }}
                      >
                        <PencilLine size={14} /> Edit
                      </button>
                      <a href={version.downloadUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ borderRadius: 12 }}>
                        <Download size={14} /> Package
                      </a>
                    </div>
                  )}
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

function Field({ label, hint, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {hint && !error && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{error}</div>}
    </div>
  );
}

function ToneMessage({ tone = 'info', children }) {
  const palette = {
    info: {
      bg: 'var(--info-subtle)',
      border: 'rgba(2,132,199,0.2)',
      color: 'var(--info)',
    },
    error: {
      bg: 'var(--danger-subtle)',
      border: 'rgba(220,38,38,0.2)',
      color: 'var(--danger)',
    },
    success: {
      bg: 'var(--success-subtle)',
      border: 'rgba(22,163,74,0.2)',
      color: 'var(--success)',
    },
  }[tone];

  return (
    <div style={{ padding: '12px 14px', borderRadius: 14, background: palette.bg, border: `1px solid ${palette.border}`, color: palette.color, fontSize: 13 }}>
      {children}
    </div>
  );
}

function LeaderboardRow({ leader, featured = false }) {
  return (
    <div
      style={{
        padding: featured ? 20 : 16,
        borderRadius: featured ? 20 : 18,
        border: '1px solid',
        borderColor: featured ? 'rgba(37,99,235,0.18)' : 'var(--border)',
        background: featured ? 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(14,165,233,0.04))' : 'var(--bg-secondary)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: featured ? 52 : 44,
              height: featured ? 52 : 44,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #1d4ed8, #38bdf8)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: featured ? 20 : 16,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {leader.avatarUrl ? (
              <img src={leader.avatarUrl} alt={leader.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (leader.name || '?').slice(0, 1).toUpperCase()
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <div style={{ fontSize: featured ? 18 : 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {leader.name}
              </div>
              {leader.isVerified && <span className="badge badge-accent">Verified</span>}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {leader.companyName || leader.username || 'Independent developer'}
            </div>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: featured ? 'rgba(37,99,235,0.12)' : 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 800 }}>
          <Trophy size={13} />
          Rank #{leader.rank}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 12 }}>
        <div style={{ padding: '10px 12px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>Score</div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{leader.score}</div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>Rating</div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{leader.averageRating.toFixed(1)}</div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>Downloads</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{formatCount(leader.totalDownloads)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: leader.topApp ? 12 : 0 }}>
        <span className="badge badge-muted">{leader.publishedApps} apps</span>
        <span className="badge badge-muted">{formatCount(leader.totalReviews)} reviews</span>
        <span className="badge badge-muted">{formatCount(leader.totalFavorites)} favorites</span>
        <span className="badge badge-muted">{leader.totalVersions} versions</span>
      </div>

      {leader.topApp && (
        <div style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>Top app</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800, marginBottom: 2 }}>{leader.topApp.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {formatCount(leader.topApp.totalDownloads)} downloads • {leader.topApp.averageRating.toFixed(1)} rating
              </div>
            </div>
            <Link to={`/apps/${leader.topApp.id}`} className="btn btn-secondary btn-sm" style={{ borderRadius: 12 }}>
              <ExternalLink size={14} /> View
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminAppRow({ app, selected, onSelect, onQuickAction, actionPending, latestLabel }) {
  const canToggle = app.status === 'PUBLISHED' || app.status === 'SUSPENDED';

  return (
    <button
      type="button"
      onClick={() => onSelect(app.id)}
      style={{
        ...surfaceStyle,
        width: '100%',
        textAlign: 'left',
        padding: 18,
        cursor: 'pointer',
        borderColor: selected ? 'var(--accent)' : 'var(--border)',
        boxShadow: selected ? '0 0 0 1px rgba(37,99,235,0.16)' : surfaceStyle.boxShadow,
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, #1d4ed8, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 22 }}>
          {app.iconUrl ? <img src={app.iconUrl} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{app.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {app.category?.name || 'Uncategorized'} • {app.contentType || 'SOFTWARE'}
              </div>
            </div>
            <StatusBadge status={app.status} />
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {app.shortDescription || app.description}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-muted">{app.isFree ? 'Free' : `$${Number(app.price || 0).toFixed(2)}`}</span>
              <span className="badge badge-muted">{formatCount(app.downloadCount || 0)} downloads</span>
              {latestLabel && <span className="badge badge-accent">{latestLabel}</span>}
            </div>

            {canToggle && (
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  onQuickAction(app);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: app.status === 'SUSPENDED' ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                  color: app.status === 'SUSPENDED' ? 'var(--success)' : 'var(--danger)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: actionPending ? 'progress' : 'pointer',
                }}
              >
                {app.status === 'SUSPENDED' ? <RotateCcw size={12} /> : <Ban size={12} />}
                {actionPending ? 'Updating…' : app.status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = ADMIN_VIEWS.some((view) => view.key === searchParams.get('view')) ? searchParams.get('view') : 'dashboard';
  const [search, setSearch] = useState('');
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [leaderboardWindow, setLeaderboardWindow] = useState('30');
  const [leaderboardSort, setLeaderboardSort] = useState('overall');

  const setView = (view) => {
    const next = new URLSearchParams(searchParams);
    next.set('view', view);
    setSearchParams(next);
  };

  const adminAppsQuery = useQuery({
    queryKey: ['admin', 'apps', 'catalog'],
    queryFn: async () => {
      const [published, suspended, underReview, rejected] = await Promise.all([
        api.get('/apps?status=PUBLISHED&limit=50').then((r) => r.data),
        api.get('/apps?status=SUSPENDED&limit=50').then((r) => r.data),
        api.get('/apps?status=UNDER_REVIEW&limit=50').then((r) => r.data),
        api.get('/apps?status=REJECTED&limit=50').then((r) => r.data),
      ]);

      return {
        published: normalizeCollection(published),
        suspended: normalizeCollection(suspended),
        underReview: normalizeCollection(underReview),
        rejected: normalizeCollection(rejected),
      };
    },
  });

  const devRequestsQuery = useQuery({
    queryKey: ['admin', 'devRequests'],
    queryFn: () => api.get('/admin/developers/requests?status=PENDING').then((r) => r.data),
  });

  const reportsQuery = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => api.get('/admin/reports?status=PENDING').then((r) => r.data),
  });

  const topDevelopersQuery = useQuery({
    queryKey: ['admin', 'analytics', 'top-developers', leaderboardWindow, leaderboardSort],
    queryFn: () =>
      api
        .get(`/developer/analytics/top-developers?window=${leaderboardWindow}&sort=${leaderboardSort}&limit=6`)
        .then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then((r) => r.data),
  });

  const adminAppGroups = useMemo(
    () => adminAppsQuery.data || { published: [], suspended: [], underReview: [], rejected: [] },
    [adminAppsQuery.data],
  );
  const managedApps = useMemo(() => {
    const merged = [
      ...adminAppGroups.underReview,
      ...adminAppGroups.published,
      ...adminAppGroups.suspended,
      ...adminAppGroups.rejected,
    ];
    return Array.from(new Map(merged.map((app) => [app.id, app])).values());
  }, [adminAppGroups]);
  const effectiveSelectedAppId = managedApps.some((app) => app.id === selectedAppId)
    ? selectedAppId
    : managedApps[0]?.id || null;

  const selectedAppQuery = useQuery({
    queryKey: ['admin', 'app', effectiveSelectedAppId],
    queryFn: () => api.get(`/apps/${effectiveSelectedAppId}`).then((r) => r.data),
    enabled: !!effectiveSelectedAppId,
  });

  const selectedApp = selectedAppQuery.data || managedApps.find((app) => app.id === effectiveSelectedAppId) || null;

  const appVersionsQuery = useQuery({
    queryKey: ['admin', 'app', effectiveSelectedAppId, 'versions'],
    queryFn: () => api.get(`/apps/${effectiveSelectedAppId}/versions`).then((r) => r.data),
    enabled: !!effectiveSelectedAppId,
  });

  const categories = normalizeCollection(categoriesQuery.data);
  const tags = normalizeCollection(tagsQuery.data);
  const versions = normalizeCollection(appVersionsQuery.data);
  const latestVersion = versions[0] || null;

  const filteredApps = useMemo(() => {
    if (!search.trim()) return managedApps;
    const term = search.toLowerCase();
    return managedApps.filter((app) =>
      [app.name, app.description, app.shortDescription, app.category?.name, app.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [managedApps, search]);

  const invalidateAdminAppData = async (appId = effectiveSelectedAppId) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'apps', 'catalog'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'app', appId] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'app', appId, 'versions'] }),
    ]);
  };

  const saveAppMutation = useMutation({
    mutationFn: ({ appId, payload }) => api.patch(`/apps/${appId}`, payload).then((r) => r.data),
    onSuccess: async (_, variables) => {
      toast.success('App updated successfully.');
      await invalidateAdminAppData(variables.appId);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to update app.')),
  });

  const createVersionMutation = useMutation({
    mutationFn: ({ appId, payload }) => api.post(`/apps/${appId}/versions`, payload).then((r) => r.data),
    onSuccess: async (_, variables) => {
      toast.success('Version added successfully.');
      await invalidateAdminAppData(variables.appId);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to add version.')),
  });

  const updateVersionMutation = useMutation({
    mutationFn: ({ appId, versionId, payload }) => api.patch(`/apps/${appId}/versions/${versionId}`, payload).then((r) => r.data),
    onSuccess: async (_, variables) => {
      toast.success('Version updated successfully.');
      await invalidateAdminAppData(variables.appId);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to update version.')),
  });

  const appActionMutation = useMutation({
    mutationFn: async ({ type, appId, note }) => {
      if (type === 'approve') return api.patch(`/admin/apps/${appId}/approve`, note ? { note } : {});
      if (type === 'reject') return api.patch(`/admin/apps/${appId}/reject`, { moderationNote: note });
      if (type === 'suspend') return api.patch(`/admin/apps/${appId}/suspend`, { reason: note });
      if (type === 'unsuspend') return api.patch(`/admin/apps/${appId}/unsuspend`, note ? { note } : {});
      throw new Error('Unsupported action');
    },
    onSuccess: async (_, variables) => {
      const messages = {
        approve: 'App approved successfully.',
        reject: 'App rejected successfully.',
        suspend: 'App suspended successfully.',
        unsuspend: 'App restored successfully.',
      };
      toast.success(messages[variables.type]);
      await invalidateAdminAppData(variables.appId);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'App action failed.'));
    },
  });

  const approveDevMutation = useMutation({
    mutationFn: (userId) => api.patch(`/admin/developers/${userId}/approve`),
    onSuccess: async () => {
      toast.success('Developer approved.');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'devRequests'] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to approve developer.')),
  });

  const rejectDevMutation = useMutation({
    mutationFn: (userId) => api.patch(`/admin/developers/${userId}/reject`),
    onSuccess: async () => {
      toast.success('Developer request rejected.');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'devRequests'] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to reject developer request.')),
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ id, decision }) => api.patch(`/admin/reports/${id}/resolve`, { decision }),
    onSuccess: async (_, variables) => {
      toast.success(variables.decision === 'APPROVED' ? 'Report resolved.' : 'Report dismissed.');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to update report.')),
  });

  const handleSaveApp = (appId, payload) => saveAppMutation.mutateAsync({ appId, payload });
  const handleCreateVersion = (appId, payload) => createVersionMutation.mutateAsync({ appId, payload });
  const handleUpdateVersion = (appId, versionId, payload) => updateVersionMutation.mutateAsync({ appId, versionId, payload });
  const handleAppAction = (type, appId, note) => appActionMutation.mutateAsync({ type, appId, note });

  const loadingCatalog = adminAppsQuery.isLoading && !adminAppsQuery.data;
  const devRequests = normalizeCollection(devRequestsQuery.data);
  const reports = normalizeCollection(reportsQuery.data);
  const topDevelopers = topDevelopersQuery.data?.leaders || [];

  if (loadingCatalog) return <PageLoader />;

  const totalPublished = adminAppGroups.published.length;
  const totalSuspended = adminAppGroups.suspended.length;
  const totalUnderReview = adminAppGroups.underReview.length;
  const totalRejected = adminAppGroups.rejected.length;

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '40px 0 80px' }}>
      <div className="container">
        <div
          style={{
            ...surfaceStyle,
            padding: 28,
            marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(29,78,216,0.94))',
            borderColor: 'rgba(255,255,255,0.08)',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '8px 12px', background: 'rgba(255,255,255,0.1)', marginBottom: 14 }}>
                <Shield size={14} /> Admin Dashboard
              </div>
              <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.02, marginBottom: 10 }}>
                Moderate apps, manage releases, and keep the marketplace healthy.
              </h1>
              <p style={{ maxWidth: 760, color: 'rgba(255,255,255,0.76)', fontSize: 15, lineHeight: 1.75, marginBottom: 0 }}>
                This workspace now combines app editing, version control, developer approvals, and report handling in one cleaner admin surface.
              </p>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => {
                adminAppsQuery.refetch();
                devRequestsQuery.refetch();
                reportsQuery.refetch();
                topDevelopersQuery.refetch();
                if (effectiveSelectedAppId) {
                  selectedAppQuery.refetch();
                  appVersionsQuery.refetch();
                }
              }}
              style={{ borderRadius: 14, background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.14)' }}
            >
              <RefreshCw size={15} /> Refresh Data
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard icon={Package} label="Published Apps" value={formatCount(totalPublished)} hint="Currently live in the marketplace" />
          <StatCard icon={Clock} label="Under Review" value={formatCount(totalUnderReview)} hint="Needs approval or rejection" />
          <StatCard icon={Ban} label="Suspended Apps" value={formatCount(totalSuspended)} hint="Temporarily disabled listings" />
          <StatCard icon={Users} label="Dev Requests" value={formatCount(devRequests.length)} hint="Pending developer approvals" />
        </div>

        <div style={{ ...surfaceStyle, padding: 18, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
            {ADMIN_VIEWS.map((view) => {
              const countMap = {
                dashboard: totalPublished + totalUnderReview + totalSuspended + totalRejected,
                apps: managedApps.length,
                versions: managedApps.length,
                developers: devRequests.length,
                reports: reports.length,
                settings: 0,
              };
              return (
                <ViewButton
                  key={view.key}
                  view={view}
                  count={countMap[view.key]}
                  active={activeView === view.key}
                  onClick={() => setView(view.key)}
                />
              );
            })}
          </div>
        </div>

        {activeView === 'dashboard' && (
          <div style={{ display: 'grid', gap: 24 }}>
            <SectionCard
              title="Top Developers"
              subtitle="Leaderboard combines rating quality, downloads, favorites, reviews, publishing volume, and release cadence."
              action={
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { value: '30', label: '30d' },
                    { value: '90', label: '90d' },
                    { value: 'all', label: 'All time' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={leaderboardWindow === option.value ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                      style={{ borderRadius: 999 }}
                      onClick={() => setLeaderboardWindow(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                  <select
                    className="form-input form-select"
                    value={leaderboardSort}
                    onChange={(event) => setLeaderboardSort(event.target.value)}
                    style={{ minWidth: 150, borderRadius: 999, height: 38 }}
                  >
                    <option value="overall">Overall score</option>
                    <option value="downloads">Downloads</option>
                    <option value="rating">Rating</option>
                    <option value="reviews">Reviews</option>
                    <option value="apps">Published apps</option>
                    <option value="versions">Versions</option>
                  </select>
                </div>
              }
            >
              {topDevelopersQuery.isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
                  <div className="spinner spinner-lg" />
                </div>
              ) : topDevelopersQuery.isError ? (
                <ToneMessage tone="error">{getErrorMessage(topDevelopersQuery.error, 'Failed to load developer leaderboard.')}</ToneMessage>
              ) : !topDevelopers.length ? (
                <EmptyState icon="🏆" title="No leaderboard data yet" description="Published apps need some engagement before rankings can be calculated." />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                  <LeaderboardRow leader={topDevelopers[0]} featured />
                  <div style={{ display: 'grid', gap: 12 }}>
                    {topDevelopers.slice(1).map((leader) => (
                      <LeaderboardRow key={leader.userId || leader.developerId} leader={leader} />
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              <SectionCard title="Review Queue" subtitle="Apps waiting for moderation or operational attention.">
                {!totalUnderReview && !totalSuspended ? (
                  <EmptyState icon="✅" title="Queue is clear" description="No urgent app moderation items right now." />
                ) : (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {adminAppGroups.underReview.slice(0, 3).map((app) => (
                      <div key={app.id} style={{ padding: 16, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{app.name}</div>
                          <StatusBadge status={app.status} />
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>{app.category?.name || 'Uncategorized'}</div>
                        <button className="btn btn-primary btn-sm" style={{ borderRadius: 12 }} onClick={() => { setSelectedAppId(app.id); setView('apps'); }}>
                          <ArrowUpRight size={14} /> Review App
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Version Activity" subtitle="Track which apps have active release history.">
                {!managedApps.length ? (
                  <EmptyState icon="📦" title="No managed apps yet" description="Once apps exist, release history will appear here." />
                ) : (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {managedApps.slice(0, 4).map((app) => (
                      <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--bg-secondary)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{app.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Status: {app.status}</div>
                        </div>
                        <button className="btn btn-secondary btn-sm" style={{ borderRadius: 12 }} onClick={() => { setSelectedAppId(app.id); setView('versions'); }}>
                          <Layers size={14} /> Manage Versions
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Marketplace Health" subtitle="Quick visibility into the state of moderation and trust signals.">
                <div style={{ display: 'grid', gap: 12 }}>
                  <ToneMessage tone={reports.length ? 'error' : 'success'}>
                    {reports.length ? `${reports.length} unresolved report${reports.length === 1 ? '' : 's'} need attention.` : 'No unresolved abuse or safety reports at the moment.'}
                  </ToneMessage>
                  <ToneMessage tone={devRequests.length ? 'info' : 'success'}>
                    {devRequests.length ? `${devRequests.length} developer access request${devRequests.length === 1 ? '' : 's'} are waiting for review.` : 'Developer access queue is currently empty.'}
                  </ToneMessage>
                  <ToneMessage tone={totalRejected ? 'info' : 'success'}>
                    {totalRejected ? `${totalRejected} app${totalRejected === 1 ? '' : 's'} are in rejected state and may need follow-up edits.` : 'No rejected apps currently need re-checking.'}
                  </ToneMessage>
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {(activeView === 'apps' || activeView === 'versions') && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <SectionCard
                title={activeView === 'apps' ? 'Apps Management' : 'Version Control'}
                subtitle={activeView === 'apps' ? 'Select an app to edit details, review status, and moderate visibility.' : 'Select an app to inspect current release history and publish a new version.'}
              >
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search apps by name, status, or category…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    style={{ paddingLeft: 36 }}
                  />
                </div>

                {adminAppsQuery.isError && (
                  <ToneMessage tone="error">{getErrorMessage(adminAppsQuery.error, 'Failed to load app catalog.')}</ToneMessage>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '72vh', overflow: 'auto', paddingRight: 4 }}>
                  {!filteredApps.length ? (
                    <EmptyState icon="🔎" title="No matching apps" description="Try a different search term or clear the filter." />
                  ) : (
                    filteredApps.map((app) => (
                      <AdminAppRow
                        key={app.id}
                        app={app}
                        selected={selectedAppId === app.id}
                        onSelect={setSelectedAppId}
                        onQuickAction={(targetApp) => {
                          setSelectedAppId(targetApp.id);
                          if (targetApp.status === 'SUSPENDED') {
                            handleAppAction('unsuspend', targetApp.id, '').catch(() => {});
                            return;
                          }
                          const reason = window.prompt(`Why are you suspending "${targetApp.name}"?`);
                          if (!reason) return;
                          handleAppAction('suspend', targetApp.id, reason).catch(() => {});
                        }}
                        actionPending={appActionMutation.isPending && appActionMutation.variables?.appId === app.id}
                        latestLabel={effectiveSelectedAppId === app.id && latestVersion?.version ? `Current v${latestVersion.version}` : null}
                      />
                    ))
                  )}
                </div>
              </SectionCard>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {!selectedApp ? (
                <EmptyState icon="📦" title="Select an app" description="Choose an app from the left to start managing it." />
              ) : (
                <>
                  <SectionCard
                    title={selectedApp.name}
                    subtitle={`${selectedApp.category?.name || 'Uncategorized'} • ${selectedApp.contentType || 'SOFTWARE'} • ${selectedApp.isFree ? 'Free' : `$${Number(selectedApp.price || 0).toFixed(2)}`}`}
                    action={
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Link to={`/apps/${selectedApp.id}`} className="btn btn-secondary btn-sm" style={{ borderRadius: 12 }}>
                          <ExternalLink size={14} /> Open Listing
                        </Link>
                        {activeView === 'versions' && latestVersion?.downloadUrl && (
                          <a href={latestVersion.downloadUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ borderRadius: 12 }}>
                            <Download size={14} /> Latest Package
                          </a>
                        )}
                      </div>
                    }
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
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{formatCount(selectedApp.downloadCount || 0)}</div>
                      </div>
                      <div style={{ padding: 16, borderRadius: 18, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Updated</div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{formatDate(selectedApp.lastUpdatedAt || selectedApp.updatedAt)}</div>
                      </div>
                    </div>
                  </SectionCard>

                  {activeView === 'apps' && (
                    <AppManagementPanel
                      key={`app-panel-${selectedApp.id}-${selectedApp.updatedAt || ''}`}
                      app={selectedApp}
                      categories={categories}
                      tags={tags}
                      latestVersion={latestVersion}
                      onSave={handleSaveApp}
                      savePending={saveAppMutation.isPending}
                      onAppAction={handleAppAction}
                      actionPending={appActionMutation.isPending}
                    />
                  )}

                  {activeView === 'versions' && (
                    <VersionManagementPanel
                      key={`version-panel-${selectedApp.id}`}
                      app={selectedApp}
                      versions={versions}
                      versionsLoading={appVersionsQuery.isLoading}
                      onCreateVersion={handleCreateVersion}
                      onUpdateVersion={handleUpdateVersion}
                      createPending={createVersionMutation.isPending}
                      updatePending={updateVersionMutation.isPending}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeView === 'developers' && (
          <SectionCard title="Developer Requests" subtitle="Approve or reject marketplace publisher access with clearer status feedback.">
            {devRequestsQuery.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : !devRequests.length ? (
              <EmptyState icon="✅" title="No pending requests" description="Developer access queue is empty right now." />
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {devRequests.map((request) => (
                  <div key={request.userId || request.id} style={{ ...surfaceStyle, padding: 18, background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{request.user?.name || request.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>{request.user?.email || request.email}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Requested on {formatDate(request.createdAt || request.verificationRequestedAt)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary btn-sm" style={{ borderRadius: 12 }} disabled={approveDevMutation.isPending} onClick={() => approveDevMutation.mutate(request.userId || request.id)}>
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" style={{ borderRadius: 12 }} disabled={rejectDevMutation.isPending} onClick={() => rejectDevMutation.mutate(request.userId || request.id)}>
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {activeView === 'reports' && (
          <SectionCard title="Reports Queue" subtitle="Review user reports, take action quickly, and keep moderation response visible.">
            {reportsQuery.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : !reports.length ? (
              <EmptyState icon="✅" title="No pending reports" description="All marketplace reports have been handled." />
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {reports.map((report) => (
                  <div key={report.id} style={{ ...surfaceStyle, padding: 20, background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          <AlertTriangle size={15} style={{ color: 'var(--warning)' }} />
                          <div style={{ fontSize: 15, fontWeight: 800 }}>{report.type} Report #{report.id}</div>
                          <span className="badge badge-warning">{report.reason}</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 10 }}>
                          {report.description || 'No additional description provided.'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Reported on {formatDate(report.createdAt)}</div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary btn-sm" style={{ borderRadius: 12 }} disabled={resolveReportMutation.isPending} onClick={() => resolveReportMutation.mutate({ id: report.id, decision: 'APPROVED' })}>
                          Resolve
                        </button>
                        <button className="btn btn-danger btn-sm" style={{ borderRadius: 12 }} disabled={resolveReportMutation.isPending} onClick={() => resolveReportMutation.mutate({ id: report.id, decision: 'REJECTED' })}>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {activeView === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <SectionCard title="Admin Workspace" subtitle="Operational notes for how this panel is wired today.">
              <div style={{ display: 'grid', gap: 12 }}>
                <ToneMessage tone="info">App management supports live editing, version creation, and suspend or restore actions directly from this admin view.</ToneMessage>
                <ToneMessage tone="info">Admin navigation is now organized around Dashboard, Apps Management, Version Control, Developers, Reports, and Settings.</ToneMessage>
                <ToneMessage tone="success">All admin mutations surface toast feedback and targeted cache refreshes so the UI stays in sync without full-page reloads.</ToneMessage>
              </div>
            </SectionCard>

            <SectionCard title="API Coverage" subtitle="Connected backend routes currently used by this admin panel.">
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  'GET /apps?status=PUBLISHED|SUSPENDED|UNDER_REVIEW|REJECTED',
                  'GET /apps/:id',
                  'PATCH /apps/:id',
                  'GET /apps/:id/versions',
                  'POST /apps/:id/versions',
                  'PATCH /apps/:id/versions/:versionId',
                  'GET /developer/analytics/top-developers',
                  'PATCH /admin/apps/:id/approve',
                  'PATCH /admin/apps/:id/reject',
                  'PATCH /admin/apps/:id/suspend',
                  'PATCH /admin/apps/:id/unsuspend',
                  'GET /admin/developers/requests',
                  'PATCH /admin/developers/:userId/approve',
                  'PATCH /admin/developers/:userId/reject',
                  'GET /admin/reports',
                  'PATCH /admin/reports/:id/resolve',
                ].map((endpoint) => (
                  <div key={endpoint} style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: 13, fontFamily: 'monospace' }}>
                    {endpoint}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
