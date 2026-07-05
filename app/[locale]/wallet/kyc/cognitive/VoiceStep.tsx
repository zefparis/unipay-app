'use client';

import { useState } from 'react';
import type { WalletDict } from '@/lib/i18n-wallet';
import { useAudio, type AudioError } from './useAudio';
import { computeVocalEmbedding, computeVocalQuality } from './audio';

const VOICE_DURATION_MS = 4000;

type Props = { T: WalletDict; onComplete: (embedding: number[], quality: number) => void };

export function VoiceStep({ T, onComplete }: Props) {
  const { recordFor, recording, error, clearError } = useAudio();
  const [computing, setComputing] = useState(false);

  const start = async () => {
    try {
      const samples = await recordFor(VOICE_DURATION_MS);
      setComputing(true);
      const embedding = computeVocalEmbedding(samples);
      const quality = computeVocalQuality(samples);
      setComputing(false);
      onComplete(embedding, quality);
    } catch {
      setComputing(false);
    }
  };

  if (error) {
    const err = error as AudioError;
    if (err.kind === 'permission-denied') {
      return (
        <div className="text-center px-8 py-12">
          <div className="text-4xl mb-4">🎤</div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">{T.kyc_mic_required}</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{T.kyc_mic_required_hint}</p>
          <button
            onClick={clearError}
            className="rounded-xl bg-[#00A651] px-6 py-3 text-sm font-semibold text-white"
          >
            {T.kyc_mic_retry}
          </button>
        </div>
      );
    }
    if (err.kind === 'unavailable') {
      return (
        <div className="text-center px-8 py-12">
          <div className="text-4xl mb-4">🔇</div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">{T.kyc_mic_none}</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{T.kyc_mic_none_hint}</p>
          <button
            onClick={clearError}
            className="rounded-xl bg-[#00A651] px-6 py-3 text-sm font-semibold text-white"
          >
            {T.kyc_mic_retry}
          </button>
        </div>
      );
    }
    return (
      <div className="text-center px-8 py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">{T.kyc_mic_error}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{T.kyc_mic_error_hint}</p>
        <button
          onClick={clearError}
          className="rounded-xl bg-[#00A651] px-6 py-3 text-sm font-semibold text-white"
        >
          {T.kyc_mic_retry}
        </button>
      </div>
    );
  }

  return (
    <div className="text-center px-6 py-6">
      <div className="text-5xl mb-6">🎤</div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
        {T.kyc_cog_voice_title}
      </h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 max-w-xs mx-auto leading-relaxed">
        {T.kyc_cog_voice_intro}
      </p>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
        {T.kyc_cog_voice_prompt_label}<br />
        <strong className="text-gray-900 dark:text-white">{T.kyc_cog_voice_phrase}</strong>
      </p>
      {(recording || computing) && (
        <div className="mb-6 flex justify-center">
          <svg className="animate-spin h-6 w-6 text-[#00A651]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
      <button
        onClick={start}
        disabled={recording || computing}
        className="w-full rounded-xl bg-[#00A651] py-3 text-sm font-semibold text-white transition disabled:opacity-50"
      >
        {recording ? T.kyc_cog_voice_recording : computing ? T.kyc_cog_voice_computing : T.kyc_cog_voice_cta}
      </button>
    </div>
  );
}
