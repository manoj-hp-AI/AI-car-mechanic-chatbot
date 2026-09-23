'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AdminDashboardData } from '@/lib/types';
import {
  ShieldCheck,
  Activity,
  BarChart3,
  AlertTriangle,
  Wrench,
  RefreshCw,
  Lock,
  Layers,
  ArrowRight,
  Sliders,
} from 'lucide-react';

export default function AdminDiagnosesPage() {
  const { role, openAuthModal } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        setError('Forbidden: This dashboard is strictly restricted to verified ADMIN accounts.');
      } else {
        setError(err?.message || 'Failed to fetch operational dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'ADMIN') {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [role]);

  if (role !== 'ADMIN') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div
          style={{
            maxWidth: '680px',
            margin: '80px auto',
            padding: '40px 32px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: '#FBBF24',
            }}
          >
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#FFFFFF', marginBottom: '10px' }}>
            Admin Authentication Required
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
            Diagnosis operational metrics are restricted to verified staff administrators.
          </p>
          <button
            onClick={() => openAuthModal('admin-login')}
            className="btn-outline-amber"
            style={{ padding: '12px 28px', fontSize: '1rem', margin: '0 auto' }}
          >
            <span>Open Admin Portal Login</span>
          </button>
        </div>
        <AuthModal />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: '1320px', width: '100%', margin: '24px auto 60px', padding: '0 24px' }}>
        {/* Admin Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '12px',
          }}
        >
          <Link
            href="/admin"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              background: 'transparent',
            }}
          >
            Overview Metrics
          </Link>

          <Link
            href="/admin/diagnoses"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              fontWeight: 700,
              textDecoration: 'none',
              color: '#38BDF8',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            Diagnosis Analytics
          </Link>

          <Link
            href="/admin/bookings"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              background: 'transparent',
            }}
          >
            Bookings & Dispatch
          </Link>
        </div>

        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.85rem', color: '#FFFFFF' }}>Admin Diagnosis Analytics</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Numerical counts, root cause distributions, and severity breakdown graphs. No individual chat transcripts.
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '9px 18px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh Diagnostics</span>
          </button>
        </div>

        {data && (
          <>
            {/* Top Numbers Row for Diagnostics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '14px',
                marginBottom: '26px',
              }}
            >
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Diagnoses</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38BDF8', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {data.total_diagnoses}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Completed reports</div>
              </div>

              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EF4444' }}>Critical Severity</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {data.severity_breakdown.find((s) => s.severity === 'CRITICAL')?.count || 0}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Immediate attention needed</div>
              </div>

              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F59E0B' }}>High & Medium</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {(data.severity_breakdown.find((s) => s.severity === 'HIGH')?.count || 0) +
                    (data.severity_breakdown.find((s) => s.severity === 'MEDIUM')?.count || 0)}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Moderate repair urgency</div>
              </div>

              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>Session ➔ Diagnosis %</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {data.conversion.sessions_to_diagnosis_rate}%
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Triage completion rate</div>
              </div>
            </div>

            {/* Graphs Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: '20px',
              }}
            >
              {/* Severity Distribution Graph */}
              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="#FBBF24" />
                    <span>Severity Distribution Breakdown</span>
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {data.total_diagnoses} total
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.severity_breakdown.map((s) => {
                    const color =
                      s.severity === 'CRITICAL'
                        ? '#EF4444'
                        : s.severity === 'HIGH'
                        ? '#F97316'
                        : s.severity === 'MEDIUM'
                        ? '#F59E0B'
                        : '#10B981';
                    const pct = data.total_diagnoses ? Math.round((s.count / data.total_diagnoses) * 100) : 0;
                    return (
                      <div key={s.severity}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                          <span style={{ color, fontWeight: 700 }}>{s.severity}</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                            {s.count} diagnoses ({pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-full)' }}>
                          <div
                            style={{
                              width: `${Math.max(5, pct)}%`,
                              height: '100%',
                              background: color,
                              borderRadius: 'var(--radius-full)',
                              boxShadow: `0 0 10px ${color}66`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Issue Categories Graph */}
              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={18} color="#38BDF8" />
                    <span>Issue Categories Classification</span>
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {data.issue_categories.length} categories
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.issue_categories.map((c) => {
                    const pct = data.total_sessions ? Math.round((c.count / data.total_sessions) * 100) : 0;
                    return (
                      <div key={c.category}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.category}</span>
                          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                            {c.count} sessions ({pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-full)' }}>
                          <div
                            style={{
                              width: `${Math.max(5, pct)}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)',
                              borderRadius: 'var(--radius-full)',
                              boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Service Recommendations Demand */}
              <div className="glass-panel" style={{ padding: '22px', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wrench size={18} color="#10B981" />
                    <span>Prescribed Service Recommendations Frequency</span>
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ranked by customer demand</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.service_recommendations.map((sr) => {
                    const maxCount = Math.max(...data.service_recommendations.map((r) => r.count), 1);
                    const barWidth = Math.round((sr.count / maxCount) * 100);
                    return (
                      <div key={sr.recommended_service}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{sr.recommended_service}</span>
                          <span style={{ color: '#10B981', fontWeight: 700 }}>{sr.count} requests</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-full)' }}>
                          <div
                            style={{
                              width: `${Math.max(5, barWidth)}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #10B981, #34D399)',
                              borderRadius: 'var(--radius-full)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <AuthModal />
    </div>
  );
}
