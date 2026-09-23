'use client';

import React, { useEffect, useRef, useState } from 'react';
import { api, ApiError, getFullMediaUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ChatSession,
  Diagnosis,
  Message,
  StarterCategory,
} from '@/lib/types';
import {
  Wrench,
  Send,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Video,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  PlusCircle,
  ChevronRight,
  RefreshCw,
  FileText,
  Volume2,
  PlayCircle,
  Flame,
  Gauge,
  Snowflake,
  ShieldAlert,
  PhoneCall,
  Phone,
  CalendarDays,
  Zap,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ChatInterfaceProps {
  onBookMechanic: (diagnosis: Diagnosis, sessionId: string) => void;
  onRequestCall: (diagnosis: Diagnosis, sessionId: string) => void;
}

const STARTER_QUESTIONS: Array<{
  category: StarterCategory;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}> = [
  {
    category: 'WONT_START',
    title: "Car won't start",
    subtitle: 'Clicking, no crank, or silent ignition',
    icon: <Gauge size={20} />,
  },
  {
    category: 'ENGINE_NOISE',
    title: 'Strange engine noise',
    subtitle: 'Knocking, squealing, ticking, or grinding',
    icon: <Volume2 size={20} />,
  },
  {
    category: 'OVERHEATING',
    title: 'Car overheating',
    subtitle: 'Steam, high temperature gauge, or coolant smell',
    icon: <Flame size={20} />,
  },
  {
    category: 'BRAKE_PROBLEM',
    title: 'Brake problem',
    subtitle: 'Squeaking, soft pedal, vibration, or warning light',
    icon: <ShieldAlert size={20} />,
  },
  {
    category: 'AC_NOT_COOLING',
    title: 'AC not cooling',
    subtitle: 'Blowing warm air or weak fan airflow',
    icon: <Snowflake size={20} />,
  },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onBookMechanic,
  onRequestCall,
}) => {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessionList, setSessionList] = useState<ChatSession[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isSending, isUploading]);

  // Load user's recent sessions if authenticated
  useEffect(() => {
    if (user) {
      api
        .getMySessions()
        .then((sessions) => {
          setSessionList(sessions);
          if (sessions.length > 0 && !currentSession) {
            setCurrentSession(sessions[0]);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleStartNewSession = () => {
    setCurrentSession(null);
    setErrorBanner(null);
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      const sess = await api.getSession(sessionId);
      setCurrentSession(sess);
      setErrorBanner(null);
      setSidebarOpen(false);
    } catch (err: any) {
      setErrorBanner('Failed to load session history.');
    }
  };

  // Click on a Starter Question
  const handleStarterClick = async (cat: StarterCategory) => {
    if (!user) {
      openAuthModal('customer-login');
      return;
    }

    setIsSending(true);
    setErrorBanner(null);
    try {
      const session = await api.sendChat({
        starter_category: cat,
      });
      setCurrentSession(session);
      setSessionList((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to initialize diagnostic session.');
    } finally {
      setIsSending(false);
    }
  };

  // Send a text message (or option chip answer)
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : inputText).trim();
    if (!textToSend && !currentSession) return;

    if (!user) {
      openAuthModal('customer-login');
      return;
    }

    if (!textToSend) return;

    setIsSending(true);
    setErrorBanner(null);
    setInputText('');

    try {
      const updatedSession = await api.sendChat({
        session_id: currentSession?.id,
        message: textToSend,
      });
      setCurrentSession(updatedSession);
      setSessionList((prev) => [
        updatedSession,
        ...prev.filter((s) => s.id !== updatedSession.id),
      ]);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  // Upload Media
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      openAuthModal('customer-login');
      return;
    }

    // If no active session yet, start one first with a default message
    let activeSessionId = currentSession?.id;
    setIsUploading(true);
    setErrorBanner(null);

    try {
      if (!activeSessionId) {
        const init = await api.sendChat({
          message: 'I have attached media regarding my car problem.',
        });
        setCurrentSession(init);
        activeSessionId = init.id;
      }

      await api.uploadMedia(activeSessionId, file);

      // Refresh session to get updated messages and state
      const refreshed = await api.getSession(activeSessionId);
      setCurrentSession(refreshed);
      setSessionList((prev) => [refreshed, ...prev.filter((s) => s.id !== refreshed.id)]);
    } catch (err: any) {
      setErrorBanner(err?.message || 'File upload failed. Ensure image/audio/video is under 25MB.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Trigger Diagnosis and redirect to diagnosis page
  const handleGetDiagnosisAndRedirect = async () => {
    if (!currentSession) return;
    setDiagnosing(true);
    setErrorBanner(null);

    try {
      await api.getDiagnosis(currentSession.id);
      router.push(`/diagnosis?session_id=${currentSession.id}`);
    } catch (err: any) {
      router.push(`/diagnosis?session_id=${currentSession.id}`);
    } finally {
      setDiagnosing(false);
    }
  };

  // Trigger Diagnosis
  const handleGetDiagnosis = async () => {
    if (!currentSession) return;
    setDiagnosing(true);
    setErrorBanner(null);

    try {
      await api.getDiagnosis(currentSession.id);
      const refreshed = await api.getSession(currentSession.id);
      setCurrentSession(refreshed);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Could not generate diagnosis. Please answer remaining questions.');
    } finally {
      setDiagnosing(false);
    }
  };

  // Extract pending options from pending_question or parse from bot message
  const getPendingOptions = (): string[] => {
    if (currentSession?.pending_question?.options) {
      return currentSession.pending_question.options;
    }
    // Fallback: check if the latest bot message ends in (A / B / C)
    const msgs = currentSession?.messages || [];
    const lastBotMsg = [...msgs].reverse().find((m) => m.sender === 'BOT');
    if (lastBotMsg && lastBotMsg.text.includes('(') && lastBotMsg.text.includes(')')) {
      const match = lastBotMsg.text.match(/\(([^)]+)\)\s*$/);
      if (match && match[1]) {
        return match[1].split('/').map((s) => s.trim());
      }
    }
    return [];
  };

  const pendingOptions = getPendingOptions();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: sidebarOpen ? '280px 1fr' : '1fr',
        maxWidth: '1280px',
        margin: '20px auto 40px',
        padding: '0 20px',
        gap: '20px',
        minHeight: '80vh',
      }}
    >
      {/* Session History Drawer (Desktop / Toggleable) */}
      {sidebarOpen && (
        <aside
          className="glass-panel"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '80vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', color: '#FFFFFF' }}>Diagnostic History</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>

          <button
            onClick={handleStartNewSession}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '9px' }}
          >
            <PlusCircle size={16} color="var(--accent-cyan)" />
            <span>New Diagnostic Session</span>
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {sessionList.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background:
                    currentSession?.id === s.id
                      ? 'rgba(56, 189, 248, 0.12)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${
                    currentSession?.id === s.id
                      ? 'rgba(56, 189, 248, 0.4)'
                      : 'var(--border-subtle)'
                  }`,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color:
                        currentSession?.id === s.id ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    }}
                  >
                    {s.category || 'General Issue'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {s.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {new Date(s.created_at).toLocaleDateString()} • {s.messages.length} messages
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Main Chat Container */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '82vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Chat Header Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
              title="Toggle previous sessions"
            >
              Sessions ({sessionList.length})
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="pulse-dot" />
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {currentSession?.category
                    ? `Diagnosing: ${currentSession.category}`
                    : 'AI Mechanical Assistant'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {currentSession
                    ? `Session Status: ${currentSession.status}`
                    : 'Select a starter issue or describe your car symptoms below'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentSession && (
              <button
                onClick={handleStartNewSession}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <PlusCircle size={14} />
                <span>New Query</span>
              </button>
            )}

            {currentSession?.status === 'READY' && !currentSession.diagnosis && (
              <button
                onClick={handleGetDiagnosis}
                disabled={diagnosing}
                className="btn-primary"
                style={{ padding: '7px 16px', fontSize: '0.85rem' }}
              >
                <Sparkles size={15} />
                <span>{diagnosing ? 'Analyzing...' : 'Generate Diagnosis'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorBanner && (
          <div
            style={{
              padding: '10px 20px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FECACA',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{errorBanner}</span>
            </div>
            <button
              onClick={() => setErrorBanner(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FECACA',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Welcome Screen / Starter Questions (when session is new or active without messages) */}
          {(!currentSession || currentSession.messages.length === 0) && (
            <div style={{ margin: 'auto', maxWidth: '680px', width: '100%', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(2, 132, 199, 0.3) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: 'var(--accent-glow)',
                }}
              >
                <Wrench size={32} color="#38BDF8" />
              </div>
              <h2 style={{ fontSize: '1.6rem', color: '#FFFFFF', marginBottom: '8px' }}>
                How can we assist your vehicle today?
              </h2>
              <p
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '28px',
                  lineHeight: 1.5,
                }}
              >
                Select one of the 5 common mechanical issues below for an instant guided walkthrough,
                or type any free-form automotive symptom with optional photos, audio, or video.
              </p>

              {/* 5 Clickable Starter Questions */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '12px',
                  textAlign: 'left',
                }}
              >
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q.category}
                    onClick={() => handleStarterClick(q.category)}
                    className="starter-card"
                    style={{ width: '100%' }}
                  >
                    <div className="starter-card-icon">{q.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{q.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {q.subtitle}
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Active Session Messages */}
          {currentSession?.messages.map((msg: Message) => {
            const isBot = msg.sender === 'BOT';
            const isRejected = currentSession.status === 'REJECTED' && isBot;

            return (
              <div
                key={msg.id}
                className={
                  isRejected
                    ? 'message-rejected'
                    : isBot
                    ? 'message-bot'
                    : 'message-customer'
                }
              >
                {/* Sender Tag */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: isBot ? 'var(--accent-cyan)' : '#E0F2FE',
                  }}
                >
                  {isBot ? (
                    <>
                      <Sparkles size={12} />
                      <span>Mechanic Assistant</span>
                    </>
                  ) : (
                    <span>You</span>
                  )}
                  <span
                    style={{
                      color: isBot ? 'var(--text-dim)' : 'rgba(255, 255, 255, 0.5)',
                      fontWeight: 400,
                    }}
                  >
                    • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Body */}
                <div style={{ fontSize: '0.94rem', lineHeight: 1.55 }}>{msg.text}</div>

                {/* Render Uploaded Media Attachments */}
                {msg.media && (
                  <div
                    style={{
                      marginTop: '10px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {msg.media.media_type === 'IMAGE' && (
                      <div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getFullMediaUrl(msg.media.file)}
                          alt="Uploaded symptom"
                          style={{
                            width: '100%',
                            maxHeight: '320px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </div>
                    )}

                    {msg.media.media_type === 'AUDIO' && (
                      <div style={{ padding: '12px' }}>
                        <audio
                          controls
                          src={getFullMediaUrl(msg.media.file)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    )}

                    {msg.media.media_type === 'VIDEO' && (
                      <div>
                        <video
                          controls
                          src={getFullMediaUrl(msg.media.file)}
                          style={{ width: '100%', maxHeight: '340px', display: 'block' }}
                        />
                      </div>
                    )}

                    {/* AI Analysis Summary Tag */}
                    {msg.media.ai_analysis_summary && (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderTop: '1px solid var(--border-subtle)',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                        }}
                      >
                        <Sparkles size={14} color="#38BDF8" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>
                          <strong>AI Visual/Audio Note:</strong> {msg.media.ai_analysis_summary}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Interactive Option Chips for Quick-Answering Follow-Up Questions */}
          {currentSession?.status === 'COLLECTING' && pendingOptions.length > 0 && !isSending && (
            <div
              style={{
                alignSelf: 'flex-start',
                maxWidth: '82%',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px 18px',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Suggested Quick Answers (Tap to respond):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {pendingOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(opt)}
                    className="option-chip"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ready for Diagnosis CTA - Redirect to Diagnosis Page */}
          {currentSession?.status === 'READY' && !currentSession.diagnosis && (
            <div
              style={{
                alignSelf: 'center',
                maxWidth: '680px',
                width: '100%',
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.16) 0%, rgba(16, 185, 129, 0.16) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                borderRadius: 'var(--radius-lg)',
                padding: '22px 24px',
                boxShadow: 'var(--shadow-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
                  <CheckCircle size={20} />
                  <span>All Diagnostic Information Collected</span>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Ready to review your complete vehicle diagnostic report, root cause breakdown, and repair recommendations on the Diagnosis page.
                </p>
              </div>

              <button
                onClick={handleGetDiagnosisAndRedirect}
                disabled={diagnosing}
                className="btn-success"
                style={{
                  padding: '12px 24px',
                  fontSize: '0.92rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                <Sparkles size={16} />
                <span>{diagnosing ? 'Calculating...' : 'View Diagnosis & Issues'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Diagnosis Ready Redirect Banner with Arrow Mark */}
          {currentSession?.diagnosis && (
            <div
              style={{
                alignSelf: 'center',
                maxWidth: '680px',
                width: '100%',
                marginTop: '12px',
                marginBottom: '12px',
                padding: '20px 24px',
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.14) 0%, rgba(99, 102, 241, 0.1) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38BDF8',
                    flexShrink: 0,
                  }}
                >
                  <Wrench size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '1.02rem', color: '#FFFFFF', fontWeight: 700 }}>
                      Vehicle Diagnostic Report Ready
                    </h4>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background:
                          currentSession.diagnosis.severity === 'CRITICAL'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : currentSession.diagnosis.severity === 'HIGH'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : currentSession.diagnosis.severity === 'MEDIUM'
                            ? 'rgba(56, 189, 248, 0.2)'
                            : 'rgba(16, 185, 129, 0.2)',
                        color:
                          currentSession.diagnosis.severity === 'CRITICAL'
                            ? '#EF4444'
                            : currentSession.diagnosis.severity === 'HIGH'
                            ? '#F59E0B'
                            : currentSession.diagnosis.severity === 'MEDIUM'
                            ? '#38BDF8'
                            : '#10B981',
                        border: '1px solid currentColor',
                      }}
                    >
                      {currentSession.diagnosis.severity} SEVERITY
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {currentSession.diagnosis.recommended_service} • Tap arrow to view full cause breakdown & repair options
                  </p>
                </div>
              </div>

              <Link
                href={`/diagnosis?session_id=${currentSession.id}`}
                className="btn-primary"
                style={{
                  padding: '11px 22px',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  boxShadow: '0 0 18px rgba(56, 189, 248, 0.35)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>View Report & Issues</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {/* Typing Indicator */}
          {isSending && (
            <div className="message-bot" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <div className="pulse-dot" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Processing diagnostic logic...
              </span>
            </div>
          )}

          {/* Uploading Indicator */}
          {isUploading && (
            <div className="message-bot" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={14} className="spin" color="#38BDF8" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Uploading and analyzing media...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Media Upload Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(11, 15, 25, 0.95)',
          }}
        >
          {/* Out of scope notice if session rejected */}
          {currentSession?.status === 'REJECTED' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#FECACA' }}>
                This query was outside automotive scope. Please click <strong>New Query</strong> to ask a vehicle question.
              </span>
              <button
                onClick={handleStartNewSession}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Restart
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,audio/*,video/*"
                onChange={handleFileUpload}
              />

              {/* Media Upload Trigger Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isSending}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all var(--transition-fast)',
                }}
                title="Upload Photo, Audio recording, or Video clip"
              >
                <Paperclip size={18} />
              </button>

              {/* Text Input Field */}
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    currentSession
                      ? 'Type your symptom or follow-up response...'
                      : 'Describe your car problem (e.g. Engine makes whistling noise at 40mph)...'
                  }
                  disabled={isSending || isUploading}
                  style={{ paddingRight: '40px' }}
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isSending || isUploading}
                className="btn-primary"
                style={{
                  width: '46px',
                  height: '44px',
                  padding: 0,
                  borderRadius: 'var(--radius-md)',
                  flexShrink: 0,
                }}
              >
                <Send size={18} />
              </button>
            </form>
          )}

          {/* Quick upload format indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginTop: '8px',
              paddingLeft: '4px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ImageIcon size={12} color="#38BDF8" /> Photos (JPG, PNG, WebP)
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mic size={12} color="#10B981" /> Sound clips (MP3, WAV, M4A)
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Video size={12} color="#F59E0B" /> Video clips (MP4, MOV, WebM)
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QUICK FIX & CALL HOTLINE REDIRECT BANNER (BELOW THE CHAT) */}
      {/* ========================================================================= */}
      <div
        style={{
          marginTop: '18px',
          padding: '18px 22px',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
              flexShrink: 0,
            }}
          >
            <PhoneCall size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
                Quick Fix 24/7 Roadside Assistance
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                Immediate
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Quick Call Direct Dial */}
          <a
            href="tel:+91984502472"
            className="btn-secondary"
            style={{
              padding: '9px 16px',
              fontSize: '0.86rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Click to call 24/7 Roadside Assistance"
          >
            <Phone size={15} color="#38BDF8" />
            <span>Call Hotline</span>
          </a>

          {/* Book a Quick Fix Call */}
          <button
            onClick={() => {
              if (currentSession) {
                onRequestCall(currentSession.diagnosis || null as any, currentSession.id);
              } else {
                onRequestCall(null as any, '');
              }
            }}
            className="btn-primary"
            style={{ padding: '9px 18px', fontSize: '0.86rem' }}
          >
            <Zap size={15} />
            <span>Book a Quick Fix Call</span>
          </button>

          {/* Redirect to /booking Route */}
          <Link
            href="/booking"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <CalendarDays size={14} color="#818CF8" />
            <span>Bookings Route</span>
          </Link>

          {/* Redirect to /diagnosis Route */}
          <Link
            href="/diagnosis"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Wrench size={14} color="#10B981" />
            <span>Diagnosis Route</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
