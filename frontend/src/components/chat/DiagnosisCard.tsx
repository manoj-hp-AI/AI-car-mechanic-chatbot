'use client';

import React from 'react';
import { Diagnosis } from '@/lib/types';
import {
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  PhoneCall,
  Activity,
  Cpu,
  ShieldAlert,
} from 'lucide-react';

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
  onBookMechanic: (diagnosis: Diagnosis) => void;
  onRequestCall: (diagnosis: Diagnosis) => void;
}

export const DiagnosisCard: React.FC<DiagnosisCardProps> = ({
  diagnosis,
  onBookMechanic,
  onRequestCall,
}) => {
  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'badge badge-critical';
      case 'HIGH':
        return 'badge badge-high';
      case 'MEDIUM':
        return 'badge badge-medium';
      case 'LOW':
      default:
        return 'badge badge-low';
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 85) return '#10B981';
    if (conf >= 65) return '#38BDF8';
    if (conf >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '24px',
        background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 24px rgba(56, 189, 248, 0.12)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top ambient highlight */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'var(--accent-gradient)',
        }}
      />

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
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
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF' }}>Vehicle Diagnostic Report</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                System Category: <strong>{diagnosis.category}</strong>
              </span>
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--accent-cyan)',
                }}
              >
                <Cpu size={12} />
                {diagnosis.source === 'RULE_ENGINE' ? 'Rule Engine Verified' : 'AI-Assisted Engine'}
              </span>
            </div>
          </div>
        </div>

        {/* Severity Badge */}
        <div className={getSeverityBadgeClass(diagnosis.severity)}>
          <ShieldAlert size={14} />
          <span>{diagnosis.severity} SEVERITY</span>
        </div>
      </div>

      {/* Overall Confidence Bar */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: '20px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Overall Diagnostic Confidence
          </span>
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: getConfidenceColor(diagnosis.overall_confidence),
            }}
          >
            {diagnosis.overall_confidence}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${diagnosis.overall_confidence}%`,
              background: `linear-gradient(90deg, #38BDF8 0%, ${getConfidenceColor(
                diagnosis.overall_confidence
              )} 100%)`,
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.8s ease-out',
            }}
          />
        </div>
      </div>

      {/* Recommended Service Banner */}
      <div
        style={{
          padding: '14px 18px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--accent-cyan)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px',
          }}
        >
          Recommended Mechanical Service
        </div>
        <div
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} color="#38BDF8" />
          <span>{diagnosis.recommended_service}</span>
        </div>
        {diagnosis.summary && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {diagnosis.summary}
          </p>
        )}
      </div>

      {/* Possible Causes List */}
      <div style={{ marginBottom: '22px' }}>
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '10px',
          }}
        >
          Likely Contributing Causes
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {diagnosis.possible_causes.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    width: '18px',
                  }}
                >
                  #{idx + 1}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.cause}</span>
              </div>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: getConfidenceColor(item.confidence),
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {item.confidence}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => onBookMechanic(diagnosis)}
          className="btn-success"
          style={{ padding: '13px', justifyContent: 'center' }}
        >
          <CalendarCheck size={18} />
          <span>Book Mechanic</span>
        </button>

        <button
          onClick={() => onRequestCall(diagnosis)}
          className="btn-secondary"
          style={{ padding: '13px', justifyContent: 'center' }}
        >
          <PhoneCall size={18} color="#38BDF8" />
          <span>Request a Call</span>
        </button>
      </div>
    </div>
  );
};
