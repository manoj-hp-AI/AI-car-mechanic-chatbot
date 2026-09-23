'use client';

import React, { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import { CallRequest, Diagnosis } from '@/lib/types';
import { X, Phone, Clock, CheckCircle2, ArrowRight, Dices, Calendar } from 'lucide-react';

interface RequestCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosis?: Diagnosis | null;
  sessionId?: string | null;
  onCallRequested?: (callReq: CallRequest) => void;
}

const generateRandomIndianNumber = () => {
  const prefixes = ['98450', '98860', '99001', '97412', '96112', '98201', '99870', '98102'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(1000 + Math.random() * 9000); // 4 digits (total 9 digits, reduced by one)
  return `+91 ${prefix} ${suffix}`;
};

export const RequestCallModal: React.FC<RequestCallModalProps> = ({
  isOpen,
  onClose,
  diagnosis,
  sessionId,
  onCallRequested,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timeMode, setTimeMode] = useState<'immediate' | '1hour' | 'evening' | 'tomorrow' | 'custom'>('immediate');
  const [customDateTime, setCustomDateTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedCall, setConfirmedCall] = useState<CallRequest | null>(null);

  // Set default random Indian phone number when modal opens
  useEffect(() => {
    if (isOpen && !phoneNumber) {
      setPhoneNumber(generateRandomIndianNumber());
    }
    // Set default custom date-time to 2 hours from now
    const now = new Date();
    now.setHours(now.getHours() + 2);
    now.setMinutes(0);
    const isoString = now.toISOString().slice(0, 16);
    setCustomDateTime(isoString);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUseRandomNumber = () => {
    setPhoneNumber(generateRandomIndianNumber());
  };

  const getComputedPreferredTime = (): string => {
    if (timeMode === 'immediate') {
      return 'Immediate (within 15 minutes)';
    }
    if (timeMode === '1hour') {
      return 'Within 1 hour';
    }
    if (timeMode === 'evening') {
      return 'Today Evening (5:00 PM - 8:00 PM)';
    }
    if (timeMode === 'tomorrow') {
      return 'Tomorrow Morning (9:00 AM - 12:00 PM)';
    }
    if (timeMode === 'custom' && customDateTime) {
      try {
        const d = new Date(customDateTime);
        return `Scheduled: ${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
      } catch {
        return `Scheduled for ${customDateTime}`;
      }
    }
    return 'Immediate (within 15 minutes)';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formattedTime = getComputedPreferredTime();

    try {
      const res = await api.createCallRequest({
        session_id: sessionId || undefined,
        phone_number: phoneNumber.trim(),
        preferred_time: formattedTime,
      });

      setConfirmedCall(res);
      if (onCallRequested) {
        onCallRequested(res);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err?.message || 'Failed to submit call request.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setConfirmedCall(null);
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleResetAndClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        {/* Header */}
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
              {confirmedCall ? 'Call Request Scheduled' : 'Book a Mechanic Call'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {confirmedCall
                ? 'Your callback is confirmed with a certified technician.'
                : 'Choose when you want to receive the call and enter your number.'}
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

        {confirmedCall ? (
          <div style={{ padding: '28px' }}>
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <CheckCircle2 size={32} color="#38BDF8" />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '8px' }}>
                Callback Confirmed!
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Target Number:{' '}
                <strong style={{ color: 'var(--accent-cyan)' }}>{confirmedCall.phone_number}</strong>
              </p>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Scheduled Time:{' '}
                <strong style={{ color: '#10B981' }}>{confirmedCall.preferred_time}</strong>
              </p>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Phone Number Field */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Your Phone Number (+91 India)
                  </label>
                  <button
                    type="button"
                    onClick={handleUseRandomNumber}
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Dices size={12} />
                    <span>Generate +91 Number</span>
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    required
                    className="input-field"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98450 2472"
                    style={{ paddingLeft: '44px', fontFamily: 'var(--font-mono)' }}
                  />
                  <Phone
                    size={16}
                    color="var(--accent-cyan)"
                    style={{ position: 'absolute', left: '14px', top: '15px' }}
                  />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Technicians will dial this number directly with your diagnostic case notes.
                </div>
              </div>

              {/* Call Time Scheduling Option */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                  }}
                >
                  When do you want to receive the call?
                </label>

                {/* Quick Selection Buttons */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setTimeMode('immediate')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: timeMode === 'immediate' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${timeMode === 'immediate' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                      color: timeMode === 'immediate' ? '#FFFFFF' : 'var(--text-secondary)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    ⚡ Immediate (15 mins)
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimeMode('1hour')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: timeMode === '1hour' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${timeMode === '1hour' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                      color: timeMode === '1hour' ? '#FFFFFF' : 'var(--text-secondary)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    🕒 Within 1 Hour
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimeMode('evening')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: timeMode === 'evening' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${timeMode === 'evening' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                      color: timeMode === 'evening' ? '#FFFFFF' : 'var(--text-secondary)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    🌅 Today Evening (5-8 PM)
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimeMode('tomorrow')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: timeMode === 'tomorrow' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${timeMode === 'tomorrow' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                      color: timeMode === 'tomorrow' ? '#FFFFFF' : 'var(--text-secondary)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    ☀️ Tomorrow (9-12 AM)
                  </button>
                </div>

                {/* Custom Date & Time Option */}
                <button
                  type="button"
                  onClick={() => setTimeMode('custom')}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: timeMode === 'custom' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${timeMode === 'custom' ? '#10B981' : 'var(--border-subtle)'}`,
                    color: timeMode === 'custom' ? '#FFFFFF' : 'var(--text-secondary)',
                    marginBottom: timeMode === 'custom' ? '10px' : '0',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={15} color={timeMode === 'custom' ? '#10B981' : 'var(--text-muted)'} />
                    <span>Choose Specific Date & Time for Call</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: timeMode === 'custom' ? '#10B981' : 'var(--text-muted)' }}>
                    {timeMode === 'custom' ? 'Selected' : 'Pick time'}
                  </span>
                </button>

                {/* Custom Date Time Picker */}
                {timeMode === 'custom' && (
                  <div style={{ marginTop: '8px', position: 'relative' }}>
                    <input
                      type="datetime-local"
                      required
                      className="input-field"
                      value={customDateTime}
                      onChange={(e) => setCustomDateTime(e.target.value)}
                      style={{ paddingLeft: '40px', colorScheme: 'dark' }}
                    />
                    <Clock
                      size={16}
                      color="#10B981"
                      style={{ position: 'absolute', left: '14px', top: '15px' }}
                    />
                  </div>
                )}
              </div>

              {/* Summary / Diagnostic link */}
              {diagnosis && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Linked Issue:{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {diagnosis.recommended_service} ({diagnosis.severity.toLowerCase()} severity)
                  </strong>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '13px',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  'Scheduling Callback...'
                ) : (
                  <>
                    <span>Confirm Call at {timeMode === 'immediate' ? 'Once' : timeMode === '1hour' ? 'in 1 Hour' : 'Selected Time'}</span>
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
