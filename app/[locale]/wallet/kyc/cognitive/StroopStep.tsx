'use client';

import { useEffect, useState } from 'react';

const STROOP_ROUNDS = 6;

type ColorName = 'RED' | 'GREEN' | 'BLUE' | 'YELLOW';
const COLORS: ColorName[] = ['RED', 'GREEN', 'BLUE', 'YELLOW'];
const HEX: Record<ColorName, string> = {
  RED: '#ff453a', GREEN: '#34c759', BLUE: '#0a84ff', YELLOW: '#ffd60a',
};

type Props = { onComplete: (accuracy: number, hits: number, rounds: number) => void };

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function StroopStep({ onComplete }: Props) {
  const [round, setRound] = useState(0);
  const [word, setWord] = useState<ColorName>('RED');
  const [color, setColor] = useState<ColorName>('GREEN');
  const [correct, setCorrect] = useState(0);

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
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Couleur</h2>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
        Appuyez sur la couleur. Tour {round + 1} sur {STROOP_ROUNDS}.
      </p>
      <div
        className="font-extrabold my-12 select-none"
        style={{ fontSize: 64, color: HEX[color] }}
      >
        {word}
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
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
