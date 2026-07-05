'use client';

import { useEffect, useState } from 'react';
import type { WalletDict } from '@/lib/i18n-wallet';

const STROOP_ROUNDS = 6;

type ColorName = 'RED' | 'GREEN' | 'BLUE' | 'YELLOW';
const COLORS: ColorName[] = ['RED', 'GREEN', 'BLUE', 'YELLOW'];
const HEX: Record<ColorName, string> = {
  RED: '#ff453a', GREEN: '#34c759', BLUE: '#0a84ff', YELLOW: '#ffd60a',
};

type Props = { T: WalletDict; onComplete: (accuracy: number, hits: number, rounds: number) => void };

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function StroopStep({ T, onComplete }: Props) {
  const [round, setRound] = useState(0);
  const [word, setWord] = useState<ColorName>('RED');
  const [color, setColor] = useState<ColorName>('GREEN');
  const [correct, setCorrect] = useState(0);

  const colorLabels: Record<ColorName, string> = {
    RED:    T.kyc_cog_color_red,
    GREEN:  T.kyc_cog_color_green,
    BLUE:   T.kyc_cog_color_blue,
    YELLOW: T.kyc_cog_color_yellow,
  };

  useEffect(() => {
    setWord(pick(COLORS));
    setColor(pick(COLORS));
  }, [round]);

  const choose = (chosen: ColorName) => {
    const ok = chosen === color;
    const nextCorrect = correct + (ok ? 1 : 0);
    if (round + 1 >= STROOP_ROUNDS) {
      onComplete(nextCorrect / STROOP_ROUNDS, nextCorrect, STROOP_ROUNDS);
    } else {
      setCorrect(nextCorrect);
      setRound(r => r + 1);
    }
  };

  return (
    <div className="text-center px-6 py-6">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">{T.kyc_cog_stroop_title}</h2>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
        {T.kyc_cog_stroop_round.replace('{n}', String(round + 1)).replace('{total}', String(STROOP_ROUNDS))}
      </p>
      <div
        className="font-extrabold my-12 select-none"
        style={{ fontSize: 64, color: HEX[color] }}
      >
        {colorLabels[word]}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => choose(c)}
            className="rounded-xl text-white font-semibold"
            style={{
              height: 54,
              border: 'none',
              background: HEX[c],
              fontSize: 17,
              cursor: 'pointer',
            }}
          >
            {colorLabels[c]}
          </button>
        ))}
      </div>
    </div>
  );
}
