'use client';

import { useEffect, useState } from 'react';
import type { WalletDict } from '@/lib/i18n-wallet';

const DIGIT_SPAN_ROUNDS = 3;

type Phase = 'show' | 'input' | 'done';

type Props = { T: WalletDict; onComplete: (score: number) => void };

function generateSequence(length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

export function DigitSpanStep({ T, onComplete }: Props) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>('show');
  const [sequence, setSequence] = useState(() => generateSequence(4));
  const [input, setInput] = useState('');
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    if (phase !== 'show') return;
    const t = setTimeout(() => setPhase('input'), 2000);
    return () => clearTimeout(t);
  }, [phase, round]);

  const submit = () => {
    const ok = input === sequence;
    const nextCorrect = correct + (ok ? 1 : 0);
    if (round + 1 >= DIGIT_SPAN_ROUNDS) {
      setPhase('done');
      onComplete(nextCorrect / DIGIT_SPAN_ROUNDS);
    } else {
      setCorrect(nextCorrect);
      setRound(r => r + 1);
      setSequence(generateSequence(4 + Math.floor((round + 1) / 2)));
      setInput('');
      setPhase('show');
    }
  };

  return (
    <div className="text-center px-6 py-6">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">{T.kyc_cog_digit_title}</h2>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
        {T.kyc_cog_round.replace('{n}', String(round + 1)).replace('{total}', String(DIGIT_SPAN_ROUNDS))}
      </p>
      {phase === 'show' && (
        <div className="font-bold my-10" style={{ fontSize: 56, letterSpacing: 8 }}>
          {sequence}
        </div>
      )}
      {phase === 'input' && (
        <>
          <input
            type="tel"
            value={input}
            onChange={e => setInput(e.target.value.replace(/\D/g, ''))}
            placeholder={T.kyc_cog_digit_placeholder}
            inputMode="numeric"
            autoFocus
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-center text-2xl tracking-widest text-gray-900 outline-none focus:border-[#00A651] dark:border-slate-600 dark:bg-slate-900 dark:text-white mb-4"
          />
          <button
            onClick={submit}
            disabled={input.length === 0}
            className="w-full rounded-xl bg-[#00A651] py-3 text-sm font-semibold text-white transition disabled:opacity-50"
          >
            {T.kyc_cog_digit_submit}
          </button>
        </>
      )}
    </div>
  );
}
