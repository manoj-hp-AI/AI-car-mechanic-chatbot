'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Booking } from '@/lib/types';
import {
  Zap,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Wrench,
  ShieldCheck,
  MapPin,
  RefreshCw,
} from 'lucide-react';

function BookingContent() {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service');
  const sessionParam = searchParams.get('session_id');

  const { user, openAuthModal } = useAuth();

  // Quick booking form state
  const [serviceRequested, setServiceRequested] = useState(
    serviceParam || 'Mobile Diagnostic & Quick Fix'
  );
  const [preferredDatetime, setPreferredDatetime] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);

  useEffect(() => {
    // Default custom date-time to tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setPreferredDatetime(tomorrow.toISOString().slice(0, 16));

    if (serviceParam) {
      setServiceRequested(serviceParam);
    }
  }, [serviceParam]);

  const handleCreateQuickBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('customer-login');
      return;
    }
    setBookingLoading(true);
    try {
      const res = await api.createBooking({
        session_id: sessionParam || undefined,
        service_requested: serviceRequested,
        preferred_datetime: preferredDatetime ? new Date(preferredDatetime).toISOString() : undefined,
        notes: notes.trim(),
      });
      setBookingSuccess(res);
      setNotes('');
    } catch (err: any) {
      alert(err?.message || 'Failed to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: '960px', width: '100%', margin: '0 auto', padding: '36px 24px 80px' }}>
        {/* Header Title & Back Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.16)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                  boxShadow: '0 0 16px rgba(56, 189, 248, 0.2)',
                }}
              >
                <Zap size={22} />
              </div>
              <h1 style={{ fontSize: '1.9rem', color: '#FFFFFF', fontWeight: 800 }}>
                Schedule a Quick Fix Mechanic
              </h1>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Book certified on-site mobile mechanics for prompt vehicle jumpstarts, emergency fixes, and diagnostics.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/"
              className="btn-secondary"
              style={{
                padding: '9px 18px',
                fontSize: '0.86rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <MessageSquare size={15} color="#38BDF8" />
              <span>Diagnostic Chat</span>
            </Link>

            <Link
              href="/diagnosis"
              className="btn-outline-cyan"
              style={{
                padding: '9px 18px',
                fontSize: '0.86rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Wrench size={15} />
              <span>View Reports</span>
            </Link>
          </div>
        </div>

        {/* Sole Feature: Schedule a Quick Fix Mechanic */}
        <div
          className="glass-panel"
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            padding: '36px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.12)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top highlight bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #0284C7 0%, #38BDF8 50%, #10B981 100%)',
            }}
          />

          {bookingSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.16)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  margin: '0 auto 20px',
                  boxShadow: '0 0 24px rgba(16, 185, 129, 0.25)',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h2 style={{ fontSize: '1.6rem', color: '#FFFFFF', fontWeight: 800, marginBottom: '8px' }}>
                Quick Fix Dispatch Confirmed!
              </h2>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 24px' }}>
                A certified mobile mechanic has been assigned to your appointment. Our team will contact you to coordinate arrival.
              </p>

              {/* Confirmation Details Card */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 24px',
                  textAlign: 'left',
                  maxWidth: '520px',
                  margin: '0 auto 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Booking Reference</span>
                  <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.94rem' }}>
                    #{bookingSuccess.id.slice(0, 8)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Service Requested</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.92rem' }}>
                    {bookingSuccess.service_requested}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Scheduled Time</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                    {bookingSuccess.preferred_datetime
                      ? new Date(bookingSuccess.preferred_datetime).toLocaleString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Immediate Dispatch'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Status</span>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '2px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(16, 185, 129, 0.18)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    {bookingSuccess.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setBookingSuccess(null)}
                  className="btn-secondary"
                  style={{ padding: '10px 22px', fontSize: '0.88rem' }}
                >
                  Schedule Another Quick Fix
                </button>

                <Link
                  href="/"
                  className="btn-primary"
                  style={{
                    padding: '10px 24px',
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Return to Diagnostic Chat</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Zap size={22} color="var(--accent-cyan)" />
                <h2 style={{ fontSize: '1.4rem', color: '#FFFFFF', fontWeight: 800 }}>
                  Book a Mobile Quick Fix Technician
                </h2>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Need roadside assistance, battery jumpstart, brake replacement, or quick collision/scratch repair?
                Enter your details to dispatch a verified mechanic.
              </p>

              <form onSubmit={handleCreateQuickBooking} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Service Selection */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}
                  >
                    Select Required Service
                  </label>
                  <select
                    className="input-field"
                    value={serviceRequested}
                    onChange={(e) => setServiceRequested(e.target.value)}
                    style={{ colorScheme: 'dark', fontSize: '0.94rem', padding: '12px 14px' }}
                  >
                    <option value="Mobile Diagnostic & Quick Fix">Mobile Diagnostic & Quick Fix</option>
                    <option value="Auto Body, Dent & Bumper Quick Repair">Auto Body, Dent & Bumper Quick Repair</option>
                    <option value="Battery Jumpstart & Starting System Test">Battery Jumpstart & Starting System Test</option>
                    <option value="Brake Pad & Rotor Inspection / Replacement">Brake Pad & Rotor Inspection / Replacement</option>
                    <option value="Cooling System Pressure Test & Hose Repair">Cooling System Pressure Test & Hose Repair</option>
                    <option value="AC Refrigerant Recharge & Leak Test">AC Refrigerant Recharge & Leak Test</option>
                    <option value="Engine Misfire & Sensor Diagnostics">Engine Misfire & Sensor Diagnostics</option>
                    <option value="Flat Tyre / Wheel Change">Flat Tyre / Wheel Change</option>
                    <option value="Oil & Fluid Level Top-Up">Oil & Fluid Level Top-Up</option>
                    <option value="General Multi-Point Inspection">General Multi-Point Inspection</option>
                  </select>
                </div>

                {/* Preferred Date & Time */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}
                  >
                    Preferred Appointment Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="input-field"
                    value={preferredDatetime}
                    onChange={(e) => setPreferredDatetime(e.target.value)}
                    style={{ colorScheme: 'dark', fontSize: '0.94rem', padding: '12px 14px' }}
                  />
                </div>

                {/* Notes and Location */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}
                  >
                    Vehicle Details & Landmark / Location Address
                  </label>
                  <textarea
                    className="input-field"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. 2021 Hyundai Creta, parked at HSR Layout Sector 2, near BDA complex. Front bumper has scratches and car won't start."
                    style={{ fontSize: '0.92rem', padding: '12px 14px', lineHeight: 1.5 }}
                  />
                </div>

                {/* Submit Dispatch Button */}
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1.02rem',
                    fontWeight: 700,
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '8px',
                    boxShadow: '0 0 24px rgba(56, 189, 248, 0.35)',
                  }}
                >
                  {bookingLoading ? (
                    <span>Scheduling Quick Fix Dispatch...</span>
                  ) : (
                    <>
                      <span>Confirm Quick Fix Dispatch</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <AuthModal />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            background: 'var(--bg-primary)',
          }}
        >
          Loading Quick Fix Scheduler...
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
