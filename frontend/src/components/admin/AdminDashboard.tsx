'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AdminDashboardData } from '@/lib/types';
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  CalendarCheck,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Layers,
  Wrench,
  Percent,
  Sliders,
  BarChart3,
  Flame,
  ShieldAlert,
  Snowflake,
  Gauge,
  HelpCircle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
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
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
          The operations dashboard displays strictly aggregated metrics and charts. Please sign in with an
          authorized Admin account.
        </p>
        <button
          onClick={() => openAuthModal('admin-login')}
          className="btn-outline-amber"
          style={{ padding: '12px 28px', fontSize: '1rem', margin: '0 auto' }}
        >
          <span>Open Admin Portal Login</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1320px', margin: '24px auto 60px', padding: '0 24px' }}>
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
            fontWeight: 700,
            textDecoration: 'none',
            color: '#FBBF24',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
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
            fontWeight: 600,
            textDecoration: 'none',
            color: 'var(--text-secondary)',
            background: 'transparent',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.85rem', color: '#FFFFFF' }}>Operations & Metrics Dashboard</h1>
            <span
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#FBBF24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Live Analytics
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Aggregated operational numbers and graph distributions. No conversation transcripts or customer media are queried.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="btn-secondary"
          style={{ padding: '9px 18px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Privacy-Safe Operational Guarantee Banner */}
      <div
        style={{
          padding: '14px 20px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.28)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '26px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <ShieldCheck size={24} color="#10B981" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#FFFFFF' }}>Privacy-Safe Mode Verified:</strong> Individual chat transcripts, customer media files, and personal conversation messages are structurally omitted from database queries. Only numerical counts and category aggregations are presented.
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '14px 20px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: '#FECACA',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading operational metrics and charts...
        </div>
      ) : data ? (
        <>
          {/* ========================================================================= */}
          {/* TOP NUMBERS ROW: Core KPI cards for each mentioned metric */}
          {/* ========================================================================= */}
          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
              }}
            >
              Key Operational Numbers
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '14px',
              }}
            >
              {/* 1. Total Sessions */}
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Sessions</span>
                  <div style={{ padding: '6px', background: 'rgba(56, 189, 248, 0.12)', borderRadius: '6px', color: '#38BDF8' }}>
                    <Layers size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
                  {data.total_sessions}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Diagnostic inquiries initiated
                </div>
              </div>

              {/* 2. Total Diagnoses */}
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Diagnoses</span>
                  <div style={{ padding: '6px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '6px', color: '#818CF8' }}>
                    <Activity size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
                  {data.total_diagnoses}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Completed diagnostic reports
                </div>
              </div>

              {/* 3. Total Bookings */}
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Bookings</span>
                  <div style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '6px', color: '#10B981' }}>
                    <CalendarCheck size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
                  {data.bookings.total}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Scheduled mechanic visits
                </div>
              </div>

              {/* 4. Total Call Requests */}
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Call Requests</span>
                  <div style={{ padding: '6px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '6px', color: '#FBBF24' }}>
                    <PhoneCall size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
                  {data.call_requests.total}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Technician callbacks requested
                </div>
              </div>

              {/* 5. Issue Categories Active */}
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Categories Tracked</span>
                  <div style={{ padding: '6px', background: 'rgba(236, 72, 153, 0.12)', borderRadius: '6px', color: '#F472B6' }}>
                    <Sliders size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
                  {data.issue_categories.length}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Distinct automotive buckets
                </div>
              </div>

              {/* 6. Service Recommendations Active */}
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Services Advised</span>
                  <div style={{ padding: '6px', background: 'rgba(14, 165, 233, 0.12)', borderRadius: '6px', color: '#38BDF8' }}>
                    <Wrench size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
                  {data.service_recommendations.length}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Prescribed repair categories
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONVERSION NUMBERS & GRAPH */}
          {/* ========================================================================= */}
          <div className="glass-panel" style={{ padding: '22px 24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="#38BDF8" />
                <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF' }}>Conversion Funnel Graph & Statistics</h3>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Flow from raw inquiry to confirmed repair</span>
            </div>

            {/* Numbers on top of the graph */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Session ➔ Diagnosis Rate</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38BDF8', fontFamily: 'var(--font-display)' }}>
                  {data.conversion.sessions_to_diagnosis_rate}%
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Diagnosis ➔ Booking Rate</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-display)' }}>
                  {data.conversion.diagnosis_to_booking_rate}%
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overall Session ➔ Booking</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818CF8', fontFamily: 'var(--font-display)' }}>
                  {data.conversion.sessions_to_booking_rate}%
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Out-of-Scope Filtered</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F87171', fontFamily: 'var(--font-display)' }}>
                  {data.conversion.sessions_rejected_rate}%
                </div>
              </div>
            </div>

            {/* Visual Funnel Bar Graph */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>1. Total Initiated Sessions</span>
                  <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{data.total_sessions} (100%)</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-full)' }}>
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #0284C7, #38BDF8)', borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>2. Answered Follow-Ups & Generated Diagnosis</span>
                  <span style={{ fontWeight: 700, color: '#38BDF8' }}>
                    {data.total_diagnoses} ({data.conversion.sessions_to_diagnosis_rate}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-full)' }}>
                  <div
                    style={{
                      width: `${Math.min(100, data.conversion.sessions_to_diagnosis_rate)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #38BDF8, #818CF8)',
                      borderRadius: 'var(--radius-full)',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>3. Booked Mechanic Services</span>
                  <span style={{ fontWeight: 700, color: '#10B981' }}>
                    {data.bookings.total} ({data.conversion.sessions_to_booking_rate}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-full)' }}>
                  <div
                    style={{
                      width: `${Math.min(100, data.conversion.sessions_to_booking_rate)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10B981, #059669)',
                      borderRadius: 'var(--radius-full)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* GRAPHS GRID: Categories, Severity, Services, Statuses */}
          {/* ========================================================================= */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '20px',
            }}
          >
            {/* GRAPH 1: Issue Categories Distribution Graph */}
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} color="#38BDF8" />
                  <span>Issue Categories Metric</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Total: {data.issue_categories.reduce((acc, c) => acc + c.count, 0)} classified
                </span>
              </div>

              {/* Numbers on top for each category */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                {data.issue_categories.map((c) => {
                  const pct = data.total_sessions ? Math.round((c.count / data.total_sessions) * 100) : 0;
                  return (
                    <div
                      key={`metric-top-${c.category}`}
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {c.category}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38BDF8', fontFamily: 'var(--font-display)' }}>
                        {c.count}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{pct}%</div>
                    </div>
                  );
                })}
              </div>

              {/* Graph representation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.issue_categories.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No categorized sessions yet.</div>
                ) : (
                  data.issue_categories.map((c) => {
                    const pct = data.total_sessions ? Math.round((c.count / data.total_sessions) * 100) : 0;
                    return (
                      <div key={c.category}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.category}</span>
                          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                            {c.count} ({pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '9px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-full)' }}>
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
                  })
                )}
              </div>
            </div>

            {/* GRAPH 2: Severity Distribution Graph */}
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color="#FBBF24" />
                  <span>Severity Distribution Metric</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Total: {data.total_diagnoses} diagnoses
                </span>
              </div>

              {/* Numbers on top for each severity level */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => {
                  const s = data.severity_breakdown.find((item) => item.severity === lvl) || { count: 0 };
                  const color =
                    lvl === 'CRITICAL'
                      ? '#EF4444'
                      : lvl === 'HIGH'
                      ? '#F97316'
                      : lvl === 'MEDIUM'
                      ? '#F59E0B'
                      : '#10B981';
                  const pct = data.total_diagnoses ? Math.round((s.count / data.total_diagnoses) * 100) : 0;
                  return (
                    <div
                      key={`sev-top-${lvl}`}
                      style={{
                        padding: '8px 6px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${color}44`,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '0.68rem', color, fontWeight: 700 }}>{lvl}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>
                        {s.count}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{pct}%</div>
                    </div>
                  );
                })}
              </div>

              {/* Graph representation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.severity_breakdown.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No diagnoses generated yet.</div>
                ) : (
                  data.severity_breakdown.map((s) => {
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
                        <div style={{ width: '100%', height: '9px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-full)' }}>
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
                  })
                )}
              </div>
            </div>

            {/* GRAPH 3: Service Recommendations Demand Graph */}
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wrench size={18} color="#10B981" />
                  <span>Service Recommendations Metric</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ranked by frequency</span>
              </div>

              {/* Numbers on top for top services */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                {data.service_recommendations.slice(0, 4).map((sr) => (
                  <div
                    key={`srv-top-${sr.recommended_service}`}
                    style={{
                      padding: '8px 10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sr.recommended_service}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-display)' }}>
                      {sr.count}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>orders</div>
                  </div>
                ))}
              </div>

              {/* Graph representation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.service_recommendations.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No services recommended yet.</div>
                ) : (
                  data.service_recommendations.map((sr) => {
                    const maxCount = Math.max(...data.service_recommendations.map((r) => r.count), 1);
                    const barWidth = Math.round((sr.count / maxCount) * 100);
                    return (
                      <div key={sr.recommended_service}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '3px' }}>
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
                  })
                )}
              </div>
            </div>

            {/* GRAPH 4: Booking & Call Request Statuses Graph */}
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#818CF8" />
                  <span>Fulfillment & Dispatch Metrics</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status Breakdown</span>
              </div>

              {/* Numbers on top for Bookings & Calls */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ padding: '8px 6px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(56, 189, 248, 0.25)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#38BDF8' }}>Total Bookings</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38BDF8', fontFamily: 'var(--font-display)' }}>
                    {data.bookings.total}
                  </div>
                </div>
                <div style={{ padding: '8px 6px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#10B981' }}>Confirmed</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-display)' }}>
                    {data.bookings.by_status.find((b) => b.status === 'CONFIRMED')?.count || 0}
                  </div>
                </div>
                <div style={{ padding: '8px 6px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.25)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#FBBF24' }}>Call Requests</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-display)' }}>
                    {data.call_requests.total}
                  </div>
                </div>
                <div style={{ padding: '8px 6px', background: 'rgba(129, 140, 248, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(129, 140, 248, 0.25)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#818CF8' }}>Resolved</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#818CF8', fontFamily: 'var(--font-display)' }}>
                    {data.call_requests.by_status.find((c) => c.status === 'RESOLVED')?.count || 0}
                  </div>
                </div>
              </div>

              {/* Bookings Status Graph */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Booking Status Distribution
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.bookings.by_status.map((b) => {
                    const totalB = data.bookings.total || 1;
                    const pct = Math.round((b.count / totalB) * 100);
                    return (
                      <div key={b.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{b.status}</span>
                          <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{b.count} ({pct}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '7px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-full)' }}>
                          <div style={{ width: `${Math.max(4, pct)}%`, height: '100%', background: '#38BDF8', borderRadius: 'var(--radius-full)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Call Requests Status Graph */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Call Request Status Distribution
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.call_requests.by_status.map((c) => {
                    const totalC = data.call_requests.total || 1;
                    const pct = Math.round((c.count / totalC) * 100);
                    return (
                      <div key={c.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{c.status}</span>
                          <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{c.count} ({pct}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '7px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-full)' }}>
                          <div style={{ width: `${Math.max(4, pct)}%`, height: '100%', background: '#F59E0B', borderRadius: 'var(--radius-full)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
