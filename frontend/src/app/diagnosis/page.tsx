'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { BookMechanicModal } from '@/components/booking/BookMechanicModal';
import { RequestCallModal } from '@/components/booking/RequestCallModal';
import { DiagnosisCard } from '@/components/chat/DiagnosisCard';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Diagnosis } from '@/lib/types';
import {
  Wrench,
  Activity,
  AlertTriangle,
  CalendarCheck,
  PhoneCall,
  Phone,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function DiagnosisPage() {
  const { user, role, openAuthModal } = useAuth();
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const fetchDiagnoses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyDiagnoses();
      setDiagnoses(data);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Please log in to view your saved diagnostic reports.');
      } else {
        setError(err?.message || 'Failed to load diagnostic records.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDiagnoses();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleBook = (diag: Diagnosis) => {
    setSelectedDiagnosis(diag);
    setSelectedSessionId(diag.session ? String(diag.session) : null);
    setBookingModalOpen(true);
  };

  const handleCall = (diag: Diagnosis) => {
    setSelectedDiagnosis(diag);
    setSelectedSessionId(diag.session ? String(diag.session) : null);
    setCallModalOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Header Title & Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '26px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                }}
              >
                <Activity size={20} />
              </div>
              <h1 style={{ fontSize: '1.8rem', color: '#FFFFFF' }}>Vehicle Diagnostics Center</h1>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Comprehensive reports, root cause probabilities, and certified service recommendations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={fetchDiagnoses}
              disabled={loading || !user}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            <Link
              href="/"
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <MessageSquare size={15} />
              <span>New Diagnostic Chat</span>
            </Link>
          </div>
        </div>

        {/* 24/7 Roadside Hotline Strip */}
        <div
          style={{
            padding: '14px 20px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(99, 102, 241, 0.06) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PhoneCall size={18} color="#38BDF8" />
            <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Need urgent roadside assistance or quick fix triage?
            </span>
            <a
              href="tel:+91984502472"
              className="btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Click to Call Hotline"
            >
              <Phone size={13} color="#38BDF8" />
              <span>Call Helpline</span>
            </a>
          </div>

          <button
            onClick={() => {
              setSelectedDiagnosis(null);
              setSelectedSessionId(null);
              setCallModalOpen(true);
            }}
            className="btn-outline-cyan"
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          >
            <Zap size={13} />
            <span>Schedule Callback</span>
          </button>
        </div>

        {/* Top Numbers Row for Diagnostics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '28px',
          }}
        >
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Reports Generated</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {diagnoses.length}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.78rem', color: '#EF4444', fontWeight: 600 }}>Critical Severities</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {diagnoses.filter((d) => d.severity === 'CRITICAL').length}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.78rem', color: '#F59E0B', fontWeight: 600 }}>High & Medium Alerts</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {diagnoses.filter((d) => d.severity === 'HIGH' || d.severity === 'MEDIUM').length}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>Low / Advisory</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {diagnoses.filter((d) => d.severity === 'LOW').length}
            </div>
          </div>
        </div>

        {/* Main Diagnostic Reports Content */}
        {!user ? (
          <div
            className="glass-panel"
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <Wrench size={44} color="var(--accent-cyan)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.4rem', color: '#FFFFFF', marginBottom: '8px' }}>
              Sign In to View Your Diagnostic History
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
              Customer accounts automatically save all diagnosis reports, probability cause breakdowns, and scheduled mechanic appointments.
            </p>
            <button
              onClick={() => openAuthModal('customer-login')}
              className="btn-primary"
              style={{ padding: '10px 24px', margin: '0 auto' }}
            >
              <span>Sign In to Access Reports</span>
            </button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Loading diagnostic records...
          </div>
        ) : error ? (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-md)',
              color: '#FECACA',
            }}
          >
            {error}
          </div>
        ) : diagnoses.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <Activity size={44} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.3rem', color: '#FFFFFF', marginBottom: '8px' }}>
              No Diagnostic Reports Yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 24px', fontSize: '0.9rem' }}>
              Start an automotive chat or pick one of the 5 starter questions to run precision root-cause analysis on your vehicle.
            </p>
            <Link
              href="/"
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', textDecoration: 'none' }}
            >
              <span>Start Your First Diagnosis</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {diagnoses.map((diag, idx) => (
              <div key={diag.id || idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Report #{diag.id} • Category: <strong style={{ color: '#FFFFFF' }}>{diag.category}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {diag.created_at ? new Date(diag.created_at).toLocaleString('en-IN') : 'Recent'}
                  </div>
                </div>

                <DiagnosisCard
                  diagnosis={diag}
                  onBookMechanic={() => handleBook(diag)}
                  onRequestCall={() => handleCall(diag)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <AuthModal />

      <BookMechanicModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        diagnosis={selectedDiagnosis}
        sessionId={selectedSessionId}
      />

      <RequestCallModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        diagnosis={selectedDiagnosis}
        sessionId={selectedSessionId}
      />
    </div>
  );
}
