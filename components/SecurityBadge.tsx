'use client';
import { useEffect, useState } from 'react';

type HCSDecision = 'allow' | 'soft' | 'challenge' | 'bunker' | 'block';

export function SecurityBadge() {
  const [decision, setDecision] = useState<HCSDecision>('allow');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => {
      const status = (window as any).HCS_STATUS;
      if (status?.ready) {
        setReady(true);
        setDecision(status.lastDecision || 'allow');
      }
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  const config = {
    allow:     { label: 'Protégé',      color: '#5DCAA5', bg: 'rgba(29,158,117,0.12)',  border: 'rgba(29,158,117,0.3)'  },
    soft:      { label: 'Surveillé',    color: '#EF9F27', bg: 'rgba(239,159,39,0.12)',  border: 'rgba(239,159,39,0.3)'  },
    challenge: { label: 'Vérification', color: '#EF9F27', bg: 'rgba(239,159,39,0.12)',  border: 'rgba(239,159,39,0.3)'  },
    bunker:    { label: 'Sécurisé',     color: '#378ADD', bg: 'rgba(55,138,221,0.12)',  border: 'rgba(55,138,221,0.3)'  },
    block:     { label: 'Bloqué',       color: '#E24B4A', bg: 'rgba(226,75,74,0.12)',   border: 'rgba(226,75,74,0.3)'   },
  }[decision];

  if (!ready) return null;

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16,
      display: 'flex', alignItems: 'center', gap: 6,
      background: config.bg, border: `0.5px solid ${config.border}`,
      borderRadius: 999, padding: '5px 12px 5px 9px',
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l8 4v5c0 4.5-3 7-8 9-5-2-8-4.5-8-9V7z" />
      </svg>
      <span style={{ fontSize: 11, fontWeight: 500, color: config.color, letterSpacing: '0.02em' }}>{config.label}</span>
    </div>
  );
}
