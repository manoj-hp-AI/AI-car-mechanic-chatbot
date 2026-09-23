'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AdminDashboardData } from '@/lib/types';
import {
  CalendarCheck,
  PhoneCall,
  CheckCircle2,
  RefreshCw,
  Lock,
  TrendingUp,
  Clock,
  Layers,
} from 'lucide-react';

export default function AdminBookingsPage() {
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
            Dispatch metrics are restricted to verified staff administrators.
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
              fontWeight: 700,
              textDecoration: 'none',
              color: '#38BDF8',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
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
            <h1 style={{ fontSize: '1.85rem', color: '#FFFFFF' }}>Admin Dispatch & Booking Operations</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Fulfillment pipeline, callback queues, and mechanic dispatch conversion.
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '9px 18px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh Dispatch</span>
          </button>
        </div>

        {data && (
          <>
            {/* Top Numbers Row for Bookings */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '14px',
                marginBottom: '26px',
              }}
            >
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Bookings</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {data.bookings.total}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Appointments created</div>
              </div>

              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10B981' }}>Confirmed Dispatches</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {data.bookings.by_status.find((b) => b.status === 'CONFIRMED')?.count || 0}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Ready for technician</div>
              </div>

              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FBBF24' }}>Total Call Requests</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {data.call_requests.total}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Customer callbacks</div>
              </div>

              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>Diagnosis ➔ Booking %</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38BDF8', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {data.conversion.diagnosis_to_booking_rate}%
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Service close rate</div>
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
              {/* Booking Status Distribution */}
              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarCheck size={18} color="#10B981" />
                    <span>Booking Status Distribution Graph</span>
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {data.bookings.total} total
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.bookings.by_status.map((b) => {
                    const totalB = data.bookings.total || 1;
                    const pct = Math.round((b.count / totalB) * 100);
                    return (
                      <div key={b.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{b.status}</span>
                          <span style={{ color: '#10B981', fontWeight: 700 }}>
                            {b.count} bookings ({pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-full)' }}>
                          <div
                            style={{
                              width: `${Math.max(5, pct)}%`,
                              height: '100%',
                              background: '#10B981',
                              borderRadius: 'var(--radius-full)',
                              boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Call Requests Status Distribution */}
              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PhoneCall size={18} color="#FBBF24" />
                    <span>Call Request Status Distribution Graph</span>
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {data.call_requests.total} calls
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.call_requests.by_status.map((c) => {
                    const totalC = data.call_requests.total || 1;
                    const pct = Math.round((c.count / totalC) * 100);
                    return (
                      <div key={c.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.status}</span>
                          <span style={{ color: '#FBBF24', fontWeight: 700 }}>
                            {c.count} calls ({pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-full)' }}>
                          <div
                            style={{
                              width: `${Math.max(5, pct)}%`,
                              height: '100%',
                              background: '#F59E0B',
                              borderRadius: 'var(--radius-full)',
                              boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conversion Funnel Graph */}
              <div className="glass-panel" style={{ padding: '22px', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} color="#38BDF8" />
                    <span>Fulfillment Conversion Funnel Graph</span>
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Raw Inquiry ➔ Scheduled Service</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>1. Total Initiated Sessions</span>
                      <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{data.total_sessions} (100%)</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-full)' }}>
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #0284C7, #38BDF8)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>2. Diagnoses Generated</span>
                      <span style={{ fontWeight: 700, color: '#38BDF8' }}>
                        {data.total_diagnoses} ({data.conversion.sessions_to_diagnosis_rate}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-full)' }}>
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
                      <span style={{ color: 'var(--text-secondary)' }}>3. Confirmed Mechanic Bookings</span>
                      <span style={{ fontWeight: 700, color: '#10B981' }}>
                        {data.bookings.total} ({data.conversion.sessions_to_booking_rate}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-full)' }}>
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
            </div>
          </>
        )}
      </main>

      <AuthModal />
    </div>
  );
}
