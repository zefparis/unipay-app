'use client';

import { useEffect, useRef, useState } from 'react';
import type { WalletDict } from '@/lib/i18n-wallet';

const REFLEX_ROUNDS = 2;

type Phase = 'ready' | 'wait' | 'go' | 'too_early' | 'done';

type Props = { T: WalletDict; onComplete: (avgMs: number) => void };

export function ReflexStep({ T, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const goAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase !== 'wait') return;
    const delay = 1500 + Math.random() * 2500;
    timerRef.current = setTimeout(() => {
      goAtRef.current = performance.now();
      setPhase('go');
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'too_early') return;
    const t = setTimeout(() => setPhase('ready'), 1200);
    return () => clearTimeout(t);
  }, [phase]);

  const handleTap = () => {
    if (phase === 'ready') {
      setLastMs(null);
      setPhase('wait');
      return;
    }
    if (phase === 'wait') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase('too_early');
      return;
    }
    if (phase === 'go') {
      const ms = performance.now() - goAtRef.current;
      setLastMs(Math.round(ms));
      const next = [...results, ms];
      setResults(next);
      if (next.length >= REFLEX_ROUNDS) {
        const avg = next.reduce((a, b) => a + b, 0) / next.length;
        setPhase('done');
        onComplete(avg);
      } else {
        setRound(r => r + 1);
        setPhase('ready');
      }
    }
  };

  const bg =
    phase === 'go' ? '#34c759' :
    phase === 'wait' ? '#b91c1c' :
    phase === 'too_early' ? '#ff9f0a' :
    '#2563eb';

  const label =
    phase === 'ready' ? T.kyc_cog_reflex_start :
    phase === 'wait' ? T.kyc_cog_reflex_wait :
    phase === 'go' ? T.kyc_cog_reflex_go :
    phase === 'too_early' ? T.kyc_cog_reflex_too_early :
    T.kyc_cog_reflex_done;

  const hint =
    phase === 'ready' ? T.kyc_cog_reflex_hint_ready :
    phase === 'wait' ? T.kyc_cog_reflex_hint_wait :
    phase === 'go' ? T.kyc_cog_reflex_hint_go :
    phase === 'too_early' ? T.kyc_cog_reflex_hint_early :
    T.kyc_cog_reflex_hint_done;

  return (
    <div className="text-center px-6 py-6">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">{T.kyc_cog_reflex_title}</h2>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
        {T.kyc_cog_round.replace('{n}', String(round + 1)).replace('{total}', String(REFLEX_ROUNDS))}
      </p>

      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: REFLEX_ROUNDS }).map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full" style={{
            background: i < results.length ? '#34c759' : i === round ? '#2563eb' : '#e5e7eb',
          }} />
        ))}
      </div>

      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 min-h-[40px]">
        {hint}
      </p>

      <button
        onClick={handleTap}
        className="w-full rounded-2xl text-white font-extrabold tracking-wide transition-colors"
        style={{
          height: 260,
          fontSize: 28,
          border: 'none',
          background: bg,
          cursor: 'pointer',
          touchAction: 'manipulation',
        }}
      >
        {label}
      </button>

      {lastMs !== null && phase === 'ready' && (
        <p className="mt-3 text-sm text-green-600 dark:text-green-400">
          {T.kyc_cog_reflex_last.replace('{ms}', String(lastMs))}
        </p>
      )}
    </div>
  );
}
