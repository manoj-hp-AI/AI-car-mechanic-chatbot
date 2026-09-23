'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Wrench,
  Shield,
  CalendarCheck,
  LogOut,
  LogIn,
  UserPlus,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Phone,
} from 'lucide-react';

interface NavbarProps {
  onOpenBookings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBookings }) => {
  const { user, role, logout, openAuthModal } = useAuth();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(7, 9, 14, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        {/* Brand Logo */}
        <Link
          href={role === 'ADMIN' ? '/admin' : '/'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
            }}
          >
            <Wrench size={22} color="#FFFFFF" />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>AutoFix</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                AI
              </span>
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {role === 'ADMIN' ? 'Operations Control' : 'Automotive Diagnostics'}
            </div>
          </div>
        </Link>

        {/* Navigation Links & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Customer / Public Routes */}
          {role !== 'ADMIN' && (
            <>
              <Link
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '7px 11px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <MessageSquare size={15} />
                <span>Chatbot</span>
              </Link>

              <Link
                href="/diagnosis"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '7px 11px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Wrench size={15} color="#10B981" />
                <span>Diagnosis</span>
              </Link>

              <Link
                href="/booking"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '7px 11px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <CalendarCheck size={15} color="#38BDF8" />
                <span>Bookings & Quick Fix</span>
              </Link>

              {/* Quick Dial Hotline Hyperlink Button */}
              <a
                href="tel:+91984502472"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#38BDF8',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-full)',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                }}
                title="Click to Call 24/7 Roadside Assistance"
              >
                <Phone size={14} color="#38BDF8" />
                <span>Call Helpline</span>
              </a>
            </>
          )}

          {/* Admin Navigation Routes */}
          {role === 'ADMIN' ? (
            <>
              <Link
                href="/admin"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#FBBF24',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  textDecoration: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <LayoutDashboard size={14} />
                <span>Overview</span>
              </Link>

              <Link
                href="/admin/diagnoses"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span>Diagnoses</span>
              </Link>

              <Link
                href="/admin/bookings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span>Bookings</span>
              </Link>
            </>
          ) : (
            <button
              onClick={() => openAuthModal('admin-login')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-muted)',
                background: 'transparent',
                border: '1px solid transparent',
                fontSize: '0.86rem',
                fontWeight: 600,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
              title="Admin Portal (Staff only)"
            >
              <Shield size={15} />
              <span>Admin</span>
            </button>
          )}

          {/* User Logged In State */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {role === 'CUSTOMER' && onOpenBookings && (
                <button
                  onClick={onOpenBookings}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-primary)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <CalendarCheck size={16} color="#38BDF8" />
                  <span>My Bookings</span>
                </button>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: role === 'ADMIN' ? '#F59E0B' : '#10B981',
                  }}
                />
                <span style={{ fontWeight: 600 }}>{user.username}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {role}
                </span>
              </div>

              <button
                onClick={logout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color var(--transition-fast)',
                }}
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => openAuthModal('customer-login')}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
              >
                <LogIn size={15} />
                <span>Log In</span>
              </button>

              <button
                onClick={() => openAuthModal('customer-register')}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.88rem' }}
              >
                <UserPlus size={15} />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
