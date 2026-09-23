'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { BookMechanicModal } from '@/components/booking/BookMechanicModal';
import { RequestCallModal } from '@/components/booking/RequestCallModal';
import { BookingsListModal } from '@/components/booking/BookingsListModal';
import { useAuth } from '@/lib/auth-context';
import { Diagnosis } from '@/lib/types';
import {
  Wrench,
  ShieldCheck,
  Zap,
  Cpu,
  FileCheck,
  Headphones,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const { role } = useAuth();
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [bookingsListOpen, setBookingsListOpen] = useState(false);

  const handleBookMechanic = (diagnosis: Diagnosis, sessionId: string) => {
    setSelectedDiagnosis(diagnosis);
    setActiveSessionId(sessionId);
    setBookingModalOpen(true);
  };

  const handleRequestCall = (diagnosis: Diagnosis, sessionId: string) => {
    setSelectedDiagnosis(diagnosis);
    setActiveSessionId(sessionId);
    setCallModalOpen(true);
  };

  // If user is logged in as ADMIN, NEVER show the AI chatbot screen.
  // Show strictly the Admin Metrics & Operations Dashboard.
  if (role === 'ADMIN') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <AdminDashboard />
        </main>
        <AuthModal />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background ambient lighting */}
      <div className="ambient-glow glow-top-left" />
      <div className="ambient-glow glow-top-right" />
      <div className="ambient-glow glow-bottom-center" />

      {/* Navigation */}
      <Navbar onOpenBookings={() => setBookingsListOpen(true)} />

      {/* Main Content Area */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* Subtle Hero Header */}
        <section
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '36px 24px 10px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '14px',
            }}
          >
            <Zap size={14} />
            <span>Hybrid AI Mechanical Pipeline</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              lineHeight: 1.15,
              color: '#FFFFFF',
              maxWidth: '840px',
              margin: '0 auto 12px',
            }}
          >
            Precision Car Problem Diagnosis & Certified Mechanic Dispatch
          </h1>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              maxWidth: '680px',
              margin: '0 auto 24px',
              lineHeight: 1.5,
            }}
          >
            Guided automotive diagnostic chat backed by deterministic rule engines and Gemini AI.
            Upload noise recordings, dashboard alerts, or inspect issues with 5-second triage.
          </p>

          {/* Quick Feature Badges */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '16px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#38BDF8" />
              <span>Automotive Scope Guard</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Photo, Audio & Video Analysis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#F59E0B" />
              <span>Clamped AI Severity Validation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#818CF8" />
              <span>Direct Mechanic Booking</span>
            </div>
          </div>
        </section>

        {/* Diagnostic Chat Interface */}
        <ChatInterface
          onBookMechanic={handleBookMechanic}
          onRequestCall={handleRequestCall}
        />
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(7, 9, 14, 0.95)',
          padding: '24px 20px',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={16} color="var(--accent-cyan)" />
            <strong style={{ color: 'var(--text-primary)' }}>AutoFix AI Mechanic</strong>
          </div>
          <div>
            &copy; {new Date().getFullYear()} AutoFix AI. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal />

      <BookMechanicModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        diagnosis={selectedDiagnosis}
        sessionId={activeSessionId}
      />

      <RequestCallModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        diagnosis={selectedDiagnosis}
        sessionId={activeSessionId}
      />

      <BookingsListModal
        isOpen={bookingsListOpen}
        onClose={() => setBookingsListOpen(false)}
      />
    </div>
  );
}
