'use client';

import { useState } from 'react';
import { ReflexStep } from './ReflexStep';
import { StroopStep } from './StroopStep';
import { DigitSpanStep } from './DigitSpanStep';
import { VoiceStep } from './VoiceStep';

export interface CognitiveData {
  reflex_ms: number;
  stroop_accuracy: number;
  stroop_hits: number;
  stroop_rounds: number;
  digit_span_score: number;
  vocal_embedding: number[];
  vocal_quality: number;
}

type Props = { onComplete: (data: CognitiveData) => void };

type Stage = 'reflex' | 'stroop' | 'digit_span' | 'mic_intro' | 'voice';

export function CognitiveTestFlow({ onComplete }: Props) {
  const [stage, setStage] = useState<Stage>('reflex');
  const [data, setData] = useState<Partial<CognitiveData>>({});

  const progress: Record<Stage, number> = {
    reflex: 1,
    stroop: 2,
    digit_span: 3,
    mic_intro: 4,
    voice: 4,
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {['reflex', 'stroop', 'digit_span', 'voice'].map((s, i) => (
          <div
            key={s}
            className="flex items-center gap-2"
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i < progress[stage] - 1
                  ? 'bg-[#00A651] text-white'
                  : i === progress[stage] - 1
                  ? 'bg-[#00A651] text-white'
                  : 'bg-gray-100 text-gray-400 dark:bg-slate-700'
              }`}
            >
              {i < progress[stage] - 1 ? '✓' : i + 1}
            </div>
            {i < 3 && (
              <div className={`h-0.5 w-6 ${i < progress[stage] - 1 ? 'bg-[#00A651]' : 'bg-gray-100 dark:bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>

      {stage === 'reflex' && (
        <ReflexStep
          onComplete={(avgMs) => {
            setData(d => ({ ...d, reflex_ms: Math.round(avgMs) }));
            setStage('stroop');
          }}
        />
      )}

      {stage === 'stroop' && (
        <StroopStep
          onComplete={(accuracy, hits, rounds) => {
            setData(d => ({ ...d, stroop_accuracy: accuracy, stroop_hits: hits, stroop_rounds: rounds }));
            setStage('digit_span');
          }}
        />
      )}

      {stage === 'digit_span' && (
        <DigitSpanStep
          onComplete={(score) => {
            setData(d => ({ ...d, digit_span_score: score }));
            setStage('mic_intro');
          }}
        />
      )}

      {stage === 'mic_intro' && (
        <div className="text-center px-6 py-12">
          <div className="text-5xl mb-6">🎤</div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Test vocal
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">
            Nous allons vous demander d'autoriser le microphone pour un test vocal
            de quelques secondes — cela nous aide à confirmer votre identité de façon
            sécurisée.
          </p>
          <button
            onClick={() => setStage('voice')}
            className="w-full rounded-xl bg-[#00A651] py-3 text-sm font-semibold text-white transition"
          >
            Continuer
          </button>
        </div>
      )}

      {stage === 'voice' && (
        <VoiceStep
          onComplete={(embedding, quality) => {
            const finalData: CognitiveData = {
              ...data,
              vocal_embedding: embedding,
              vocal_quality: quality,
            } as CognitiveData;
            onComplete(finalData);
          }}
        />
      )}
    </div>
  );
}
