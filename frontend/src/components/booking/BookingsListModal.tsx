'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Booking, CallRequest } from '@/lib/types';
import { X, CalendarCheck, PhoneCall, Clock, CheckCircle2 } from 'lucide-react';

interface BookingsListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingsListModal: React.FC<BookingsListModalProps> = ({ isOpen, onClose }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [callRequests, setCallRequests] = useState<CallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'bookings' | 'calls'>('bookings');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([api.getMyBookings(), api.getMyCallRequests()])
        .then(([bList, cList]) => {
          setBookings(bList);
          setCallRequests(cList);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
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
              My Appointments & Requests
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Track scheduled mechanic appointments and technician callback requests.
            </p>
          </div>
          <button
            onClick={onClose}
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

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            padding: '12px 28px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid var(--border-subtle)',
            gap: '8px',
          }}
        >
          <button
            onClick={() => setTab('bookings')}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: '0.88rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: tab === 'bookings' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: tab === 'bookings' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <CalendarCheck size={16} />
            <span>Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setTab('calls')}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: '0.88rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: tab === 'calls' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: tab === 'calls' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <PhoneCall size={16} />
            <span>Call Requests ({callRequests.length})</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              Loading records...
            </div>
          ) : tab === 'bookings' ? (
            bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                No bookings scheduled yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {b.service_requested}
                      </div>
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {b.status}
                      </span>
                    </div>
                    {b.preferred_datetime && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <Clock size={14} color="#38BDF8" />
                        <span>{new Date(b.preferred_datetime).toLocaleString()}</span>
                      </div>
                    )}
                    {b.notes && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Notes: {b.notes}
                      </p>
                    )}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                      ID: {b.id}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : callRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              No call requests placed yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {callRequests.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {c.phone_number}
                    </div>
                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38BDF8',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                  {c.preferred_time && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Window: {c.preferred_time}
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                    Requested on: {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
