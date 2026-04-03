import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { StatusBadge, PageLoader, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';
import {
  Shield, Users, Package, Flag, CheckCircle, XCircle, Clock,
  RefreshCw, AlertTriangle
} from 'lucide-react';

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  );
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('apps');

  const { data: pendingApps, isLoading: appsLoading } = useQuery({
    queryKey: ['admin', 'apps'],
    queryFn: () => api.get('/apps?status=UNDER_REVIEW&limit=50').then(r => r.data),
  });

  const { data: devRequests, isLoading: devLoading } = useQuery({
    queryKey: ['admin', 'devRequests'],
    queryFn: () => api.get('/admin/developers/requests?status=PENDING').then(r => r.data),
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => api.get('/admin/reports?status=PENDING').then(r => r.data),
  });

  const approveAppMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/apps/${id}/approve`),
    onSuccess: () => { toast.success('App approved!'); queryClient.invalidateQueries(['admin', 'apps']); },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const rejectAppMutation = useMutation({
    mutationFn: ({ id, note }) => api.patch(`/admin/apps/${id}/reject`, { moderationNote: note }),
    onSuccess: () => { toast.success('App rejected'); queryClient.invalidateQueries(['admin', 'apps']); },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const approveDevMutation = useMutation({
    mutationFn: (userId) => api.patch(`/admin/developers/${userId}/approve`),
    onSuccess: () => { toast.success('Developer approved!'); queryClient.invalidateQueries(['admin', 'devRequests']); },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const rejectDevMutation = useMutation({
    mutationFn: (userId) => api.patch(`/admin/developers/${userId}/reject`),
    onSuccess: () => { toast.success('Developer request rejected'); queryClient.invalidateQueries(['admin', 'devRequests']); },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ id, decision }) => api.patch(`/admin/reports/${id}/resolve`, { decision }),
    onSuccess: () => { toast.success('Report resolved'); queryClient.invalidateQueries(['admin', 'reports']); },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const handleRejectApp = (id) => {
    const note = prompt('Rejection reason (required):');
    if (!note) return;
    rejectAppMutation.mutate({ id, note });
  };

  const tabs = [
    { key: 'apps', label: 'App Reviews', icon: Package, count: pendingApps?.items?.length },
    { key: 'devs', label: 'Developer Requests', icon: Users, count: devRequests?.items?.length || devRequests?.length },
    { key: 'reports', label: 'Reports', icon: Flag, count: reports?.items?.length },
  ];

  return (
    <div className="section" style={{ paddingTop: 40 }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Shield size={22} style={{ color: 'var(--accent-hover)' }} />
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Admin Panel</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage apps, developers, and reports</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              className={`tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={13} />
              {label}
              {count > 0 && (
                <span className="badge badge-warning" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 4 }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* App Reviews */}
        {activeTab === 'apps' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {appsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : !pendingApps?.items?.length ? (
              <EmptyState icon="✅" title="No pending apps" description="All apps have been reviewed." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingApps.items.map((app) => (
                  <div key={app.id} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 10, flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      overflow: 'hidden',
                    }}>
                      {app.iconUrl
                        ? <img src={app.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '📦'
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{app.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        {app.category?.name} · {app.contentType} · {app.isFree ? 'Free' : `$${app.price}`}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {app.shortDescription || app.description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
                        onClick={() => approveAppMutation.mutate(app.id)}
                        disabled={approveAppMutation.isLoading}
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRejectApp(app.id)}
                        disabled={rejectAppMutation.isLoading}
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Developer Requests */}
        {activeTab === 'devs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {devLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : !(devRequests?.items || devRequests)?.length ? (
              <EmptyState icon="✅" title="No pending requests" description="No developer access requests." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(devRequests?.items || devRequests || []).map((req) => (
                  <div key={req.userId || req.id} className="card"
                    style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="avatar-placeholder" style={{ width: 44, height: 44, fontSize: 16 }}>
                      {(req.user?.name || req.name || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{req.user?.name || req.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{req.user?.email || req.email}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Requested: {new Date(req.createdAt || req.verificationRequestedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
                        onClick={() => approveDevMutation.mutate(req.userId || req.id)}
                        disabled={approveDevMutation.isLoading}
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => rejectDevMutation.mutate(req.userId || req.id)}
                        disabled={rejectDevMutation.isLoading}
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {reportsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : !reports?.items?.length ? (
              <EmptyState icon="✅" title="No pending reports" description="All reports have been resolved." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reports.items.map((report) => (
                  <div key={report.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
                          <span style={{ fontWeight: 600, fontSize: 14 }}>
                            {report.type} Report #{report.id}
                          </span>
                          <span className="badge badge-muted" style={{ fontSize: 11 }}>{report.reason}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {report.description || 'No additional description.'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                          Reported on {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
                          onClick={() => resolveReportMutation.mutate({ id: report.id, decision: 'APPROVED' })}
                          disabled={resolveReportMutation.isLoading}
                        >
                          Resolve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => resolveReportMutation.mutate({ id: report.id, decision: 'REJECTED' })}
                          disabled={resolveReportMutation.isLoading}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
