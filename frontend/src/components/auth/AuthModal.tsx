'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';
import { X, Lock, Mail, User, Phone, ShieldCheck, KeyRound, ArrowRight, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalTab, closeAuthModal, openAuthModal, loginCustomer, loginAdmin, register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (authModalTab === 'customer-login') {
        await loginCustomer(username, password);
      } else if (authModalTab === 'admin-login') {
        await loginAdmin(username, password);
      } else {
        await register({
          username,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
        });
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err?.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemoDriver = () => {
    setUsername('driver1');
    setPassword('Driver@12345');
    setErrorMessage(null);
  };

  const fillDemoAdmin = () => {
    setUsername('Manoj');
    setPassword('ManojHP21');
    setErrorMessage(null);
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', marginBottom: '4px' }}>
              {authModalTab === 'customer-login' && 'Welcome Back'}
              {authModalTab === 'customer-register' && 'Create Customer Account'}
              {authModalTab === 'admin-login' && 'Admin Staff Portal'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {authModalTab === 'customer-login' && 'Sign in to access your vehicle diagnostic chat history'}
              {authModalTab === 'customer-register' && 'Register to diagnose car problems and book mechanics'}
              {authModalTab === 'admin-login' && 'Internal access for dispatchers & service managers'}
            </p>
          </div>
          <button
            onClick={closeAuthModal}
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

        {/* Tab Selector */}
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
            type="button"
            onClick={() => {
              setErrorMessage(null);
              openAuthModal('customer-login');
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background:
                authModalTab === 'customer-login' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: authModalTab === 'customer-login' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              transition: 'all var(--transition-fast)',
            }}
          >
            Customer Login
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              openAuthModal('customer-register');
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background:
                authModalTab === 'customer-register' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: authModalTab === 'customer-register' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              transition: 'all var(--transition-fast)',
            }}
          >
            Register
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              openAuthModal('admin-login');
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background:
                authModalTab === 'admin-login' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: authModalTab === 'admin-login' ? '#FBBF24' : 'var(--text-muted)',
              transition: 'all var(--transition-fast)',
            }}
          >
            Admin Portal
          </button>
        </div>

        {/* Demo Credentials Quick-Fill Banner */}
        <div
          style={{
            margin: '16px 28px 4px',
            padding: '10px 14px',
            background: 'rgba(56, 189, 248, 0.06)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <Sparkles size={16} color="#38BDF8" />
            <span>Fast Testing Autofill:</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={fillDemoDriver}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={() => {
                openAuthModal('admin-login');
                fillDemoAdmin();
              }}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#FBBF24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Demo Admin
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              margin: '12px 28px 0',
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-md)',
              color: '#FECACA',
              fontSize: '0.85rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '16px 28px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {authModalTab === 'customer-register' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Alex"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Driver"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="driver@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+1 555-019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Username
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder={authModalTab === 'admin-login' ? 'admin' : 'driver1'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {authModalTab === 'admin-login' && (
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <ShieldCheck size={14} color="#FBBF24" />
                <span>Admin accounts can only be provisioned by Superadmins or via CLI.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={authModalTab === 'admin-login' ? 'btn-outline-amber' : 'btn-primary'}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '13px',
                justifyContent: 'center',
              }}
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <span>
                    {authModalTab === 'customer-login' && 'Sign In as Customer'}
                    {authModalTab === 'customer-register' && 'Register Customer Account'}
                    {authModalTab === 'admin-login' && 'Access Admin Portal'}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
