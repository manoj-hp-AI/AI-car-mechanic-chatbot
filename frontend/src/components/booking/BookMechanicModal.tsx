'use client';

import React, { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Booking, Diagnosis } from '@/lib/types';
import { X, Calendar, Clock, Wrench, CheckCircle2, ArrowRight } from 'lucide-react';

interface BookMechanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosis?: Diagnosis | null;
  sessionId?: string | null;
  onBookingSuccess?: (booking: Booking) => void;
}

export const BookMechanicModal: React.FC<BookMechanicModalProps> = ({
  isOpen,
  onClose,
  diagnosis,
  sessionId,
  onBookingSuccess,
}) => {
  const [serviceRequested, setServiceRequested] = useState(
    diagnosis?.recommended_service || 'Comprehensive Vehicle Diagnostic Inspection'
  );
  const [preferredDatetime, setPreferredDatetime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.createBooking({
        session_id: sessionId || undefined,
        diagnosis_id: diagnosis?.id || undefined,
        service_requested: serviceRequested,
        preferred_datetime: preferredDatetime ? new Date(preferredDatetime).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });

      // Verify GET /api/booking/{id}/ per API contract
      const verified = await api.getBooking(res.id);
      setConfirmedBooking(verified);
      if (onBookingSuccess) {
        onBookingSuccess(verified);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err?.message || 'Failed to create booking.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setConfirmedBooking(null);
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleResetAndClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            padding: '24px 28px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.3rem', color: '#FFFFFF', marginBottom: '4px' }}>
              {confirmedBooking ? 'Booking Confirmed!' : 'Book a Certified Mechanic'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {confirmedBooking
                ? 'Your service dispatch request has been recorded.'
                : 'Schedule a certified mechanic visit or shop appointment.'}
            </p>
          </div>
          <button
            onClick={handleResetAndClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Confirmation Screen */}
        {confirmedBooking ? (
          <div style={{ padding: '28px' }}>
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <CheckCircle2 size={32} color="#10B981" />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: '#FFFFFF', marginBottom: '6px' }}>
                Service Booked Successfully
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Reference ID:{' '}
                <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {confirmedBooking.id}
                </strong>
              </p>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '24px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.88rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service Requested:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {confirmedBooking.service_requested}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                >
                  {confirmedBooking.status}
                </span>
              </div>
              {confirmedBooking.preferred_datetime && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Preferred Time:</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {new Date(confirmedBooking.preferred_datetime).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleResetAndClose}
              className="btn-primary"
              style={{ width: '100%', padding: '13px', justifyContent: 'center' }}
            >
              Done & Return to Chat
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
            {error && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FECACA',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Service Required
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={serviceRequested}
                    onChange={(e) => setServiceRequested(e.target.value)}
                    placeholder="e.g. Brake Pad & Rotor Replacement"
                    style={{ paddingLeft: '40px' }}
                  />
                  <Wrench
                    size={16}
                    color="var(--accent-cyan)"
                    style={{ position: 'absolute', left: '14px', top: '15px' }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Preferred Date & Time
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={preferredDatetime}
                    onChange={(e) => setPreferredDatetime(e.target.value)}
                    style={{ paddingLeft: '40px', colorScheme: 'dark' }}
                  />
                  <Calendar
                    size={16}
                    color="var(--accent-cyan)"
                    style={{ position: 'absolute', left: '14px', top: '15px' }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Vehicle Information & Special Notes
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 2019 Honda Civic. Car is parked in driveway, wheels turn but loud grinding on right side."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-success"
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '13px',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  'Scheduling Service...'
                ) : (
                  <>
                    <span>Confirm & Book Appointment</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
