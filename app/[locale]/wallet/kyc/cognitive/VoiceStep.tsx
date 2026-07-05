'use client';

import { useState } from 'react';
import { useAudio, type AudioError } from './useAudio';
import { computeVocalEmbedding, computeVocalQuality } from './audio';

const VOICE_DURATION_MS = 4000;

type Props = { onComplete: (embedding: number[], quality: number) => void };

export function VoiceStep({ onComplete }: Props) {
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
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Accès micro requis</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            Vous devez autoriser le microphone pour continuer. Réessayez et acceptez la demande d'autorisation.
          </p>
          <button
            onClick={clearError}
            className="rounded-xl bg-[#00A651] px-6 py-3 text-sm font-semibold text-white"
          >
            Réessayer
          </button>
        </div>
      );
    }
    if (err.kind === 'unavailable') {
      return (
        <div className="text-center px-8 py-12">
          <div className="text-4xl mb-4">🔇</div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Aucun micro détecté</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            Aucun microphone n'a été trouvé sur cet appareil. Vérifiez qu'un micro est connecté.
          </p>
          <button
            onClick={clearError}
            className="rounded-xl bg-[#00A651] px-6 py-3 text-sm font-semibold text-white"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return (
      <div className="text-center px-8 py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Micro indisponible</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
          Une erreur est survenue avec le microphone. Réessayez.
        </p>
        <button
          onClick={clearError}
          className="rounded-xl bg-[#00A651] px-6 py-3 text-sm font-semibold text-white"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="text-center px-6 py-6">
      <div className="text-5xl mb-6">🎤</div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
        Test vocal
      </h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 max-w-xs mx-auto leading-relaxed">
        Nous allons vous demander d'autoriser le microphone pour un test vocal
        de quelques secondes — cela nous aide à confirmer votre identité de façon
        sécurisée.
      </p>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
        Lisez cette phrase :<br />
        <strong className="text-gray-900 dark:text-white">"Ma voix confirme mon identité."</strong>
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
        {recording ? 'Enregistrement...' : computing ? 'Traitement...' : 'Continuer'}
      </button>
    </div>
  );
}
