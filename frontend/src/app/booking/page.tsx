'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { RequestCallModal } from '@/components/booking/RequestCallModal';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Booking, CallRequest } from '@/lib/types';
import {
  CalendarCheck,
  Calendar,
  Clock,
  PhoneCall,
  Phone,
  Wrench,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  FileText,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function BookingPage() {
  const { user, openAuthModal } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [callRequests, setCallRequests] = useState<CallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick booking form state
  const [serviceRequested, setServiceRequested] = useState('Mobile Diagnostic & Quick Fix');
  const [preferredDatetime, setPreferredDatetime] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);

  const [callModalOpen, setCallModalOpen] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bData, cData] = await Promise.all([
        api.getMyBookings(),
        api.getMyCallRequests(),
      ]);
      setBookings(bData);
      setCallRequests(cData);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Please log in to review your scheduled bookings and callbacks.');
      } else {
        setError(err?.message || 'Failed to retrieve booking data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecords();
    } else {
      setLoading(false);
    }

    // Default custom date-time to tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setPreferredDatetime(tomorrow.toISOString().slice(0, 16));
  }, [user]);

  const handleCreateQuickBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('customer-login');
      return;
    }
    setBookingLoading(true);
    try {
      const res = await api.createBooking({
        service_requested: serviceRequested,
        preferred_datetime: preferredDatetime ? new Date(preferredDatetime).toISOString() : undefined,
        notes: notes.trim(),
      });
      setBookingSuccess(res);
      setNotes('');
      fetchRecords();
    } catch (err: any) {
      alert(err?.message || 'Failed to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.35)' };
      case 'COMPLETED':
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.35)' };
      case 'CANCELLED':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.35)' };
      default:
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.35)' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Header Title */}
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
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                }}
              >
                <CalendarCheck size={20} />
              </div>
              <h1 style={{ fontSize: '1.8rem', color: '#FFFFFF' }}>Service Bookings & Quick Fix</h1>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Schedule certified mobile mechanic dispatches and manage callback inquiries.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={fetchRecords}
              disabled={loading || !user}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh Records</span>
            </button>

            <button
              onClick={() => setCallModalOpen(true)}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              <PhoneCall size={14} />
              <span>Request Mechanic Call</span>
            </button>
          </div>
        </div>

        {/* 24/7 Roadside Hotline Strip with +91 number */}
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
              24/7 Roadside Assistance & Quick Fix
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/"
              style={{ color: 'var(--accent-cyan)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
            >
              ← Back to Diagnostic Chat
            </Link>
          </div>
        </div>

        {/* Top Numbers Row for Bookings */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '28px',
          }}
        >
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Bookings</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {bookings.length}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>Confirmed Visits</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {bookings.filter((b) => b.status === 'CONFIRMED').length}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.78rem', color: '#FBBF24', fontWeight: 600 }}>Pending Review</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {bookings.filter((b) => b.status === 'PENDING').length}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 600 }}>Callback Requests</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38BDF8', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {callRequests.length}
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Quick Fix Booking Form + Bookings List */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Column 1: Book a Quick Fix Mechanic Directly */}
          <div className="glass-panel" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={20} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.25rem', color: '#FFFFFF' }}>Schedule a Quick Fix Mechanic</h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Need on-site battery jumpstart, brake service, alternator fix, or general inspection? Book a technician directly.
            </p>

            {bookingSuccess && (
              <div
                style={{
                  padding: '14px 18px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 700, fontSize: '0.9rem' }}>
                  <CheckCircle2 size={18} />
                  <span>Appointment Confirmed!</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Ref: <strong style={{ color: '#FFFFFF' }}>#{bookingSuccess.id.slice(0, 8)}</strong> • Service: {bookingSuccess.service_requested}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateQuickBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Service Needed
                </label>
                <select
                  className="input-field"
                  value={serviceRequested}
                  onChange={(e) => setServiceRequested(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="Mobile Diagnostic & Quick Fix">Mobile Diagnostic & Quick Fix</option>
                  <option value="Battery Jumpstart & Starting System Test">Battery Jumpstart & Starting System Test</option>
                  <option value="Brake Pad & Rotor Inspection / Replacement">Brake Pad & Rotor Inspection / Replacement</option>
                  <option value="Cooling System Pressure Test & Hose Repair">Cooling System Pressure Test & Hose Repair</option>
                  <option value="AC Refrigerant Recharge & Leak Test">AC Refrigerant Recharge & Leak Test</option>
                  <option value="Engine Misfire & Sensor Diagnostics">Engine Misfire & Sensor Diagnostics</option>
                  <option value="Flat Tyre / Wheel Change">Flat Tyre / Wheel Change</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Preferred Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  className="input-field"
                  value={preferredDatetime}
                  onChange={(e) => setPreferredDatetime(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Vehicle Notes / Landmark Location
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 2021 Hyundai Creta, parked near HSR Layout Sector 2. Clicking noise from starter."
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
              >
                {bookingLoading ? (
                  'Scheduling Dispatch...'
                ) : (
                  <>
                    <span>Confirm Quick Fix Dispatch</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Column 2: Scheduled Bookings & Callbacks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Bookings Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wrench size={18} color="#38BDF8" />
                  <span>Scheduled Mechanic Visits</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {bookings.length} active
                </span>
              </div>

              {!user ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Sign in to see your appointment records.
                </div>
              ) : bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No mechanic bookings scheduled yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bookings.map((b) => {
                    const badge = getStatusBadge(b.status);
                    return (
                      <div
                        key={b.id}
                        style={{
                          padding: '14px 16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                            {b.service_requested}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                            }}
                          >
                            {b.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <Calendar size={13} color="var(--accent-cyan)" />
                          <span>
                            {b.preferred_datetime
                              ? new Date(b.preferred_datetime).toLocaleString('en-IN', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'TBD by technician'}
                          </span>
                        </div>

                        {b.notes && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                            "{b.notes}"
                          </div>
                        )}

                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                          Ref #{b.id.slice(0, 8)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Call Requests Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PhoneCall size={18} color="#FBBF24" />
                  <span>Requested Callbacks</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {callRequests.length} calls
                </span>
              </div>

              {!user ? (
                <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Sign in to see your callback queue.
                </div>
              ) : callRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No callback requests currently queued.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {callRequests.map((c) => {
                    const badge = getStatusBadge(c.status);
                    return (
                      <div
                        key={c.id}
                        style={{
                          padding: '12px 14px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.88rem' }}>
                            {c.phone_number}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            Window: {c.preferred_time || 'ASAP'}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {c.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AuthModal />

      <RequestCallModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        onCallRequested={() => fetchRecords()}
      />
    </div>
  );
}
