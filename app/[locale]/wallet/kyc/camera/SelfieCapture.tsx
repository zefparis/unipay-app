'use client';

import { useState } from 'react';
import { useCamera } from './useCamera';
import type { WalletDict } from '@/lib/i18n-wallet';

function b64ToFile(b64: string, filename: string): File {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: 'image/jpeg' });
}

interface Props {
  T: WalletDict;
  onChange: (file: File) => void;
}

export function SelfieCapture({ T, onChange }: Props) {
  const { videoRef, ready, error, capture } = useCamera();
  const [preview, setPreview] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  async function handleCapture() {
    setCapturing(true);
    try {
      const b64 = await capture();
      if (!b64) return;
      const dataUrl = `data:image/jpeg;base64,${b64}`;
      setPreview(dataUrl);
      const file = b64ToFile(b64, 'selfie.jpg');
      onChange(file);
    } finally {
      setCapturing(false);
    }
  }

  function handleRetake() {
    setPreview(null);
  }

  if (error) {
    if (error.kind === 'permission-denied') {
      return (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{T.kyc_selfie}</p>
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-red-200 bg-red-50 p-6 text-center dark:border-red-800/40 dark:bg-red-900/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-9 w-9 text-red-400">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Accès caméra requis</p>
            <p className="text-xs text-red-500 dark:text-red-400">Autorisez la caméra dans les paramètres de votre navigateur pour continuer.</p>
          </div>
        </div>
      );
    }
    if (error.kind === 'unavailable') {
      return (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{T.kyc_selfie}</p>
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800/40 dark:bg-amber-900/20">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Aucune caméra détectée</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Aucune caméra disponible sur cet appareil.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{T.kyc_selfie}</p>
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">Caméra indisponible</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Une erreur est survenue. Rechargez la page et réessayez.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{T.kyc_selfie}</p>
        <p className="text-xs text-gray-500 dark:text-slate-500">{T.kyc_selfie_hint}</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: '4/3' }}>
        {preview ? (
          <img
            src={preview}
            alt="Selfie capturé"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {/* Oval face guide overlay */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <mask id="oval-mask">
                  <rect width="100" height="100" fill="white" />
                  <ellipse cx="50" cy="47" rx="28" ry="36" fill="black" />
                </mask>
              </defs>
              {/* Dark overlay outside the oval */}
              <rect width="100" height="100" fill="rgba(0,0,0,0.45)" mask="url(#oval-mask)" />
              {/* Oval border */}
              <ellipse cx="50" cy="47" rx="28" ry="36" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.6" />
            </svg>
            {/* Loading indicator */}
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <svg className="h-8 w-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </>
        )}
      </div>

      {preview ? (
        <button
          type="button"
          onClick={handleRetake}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Reprendre
        </button>
      ) : (
        <button
          type="button"
          onClick={handleCapture}
          disabled={!ready || capturing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00A651] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#00A651]/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {capturing ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          )}
          {ready ? T.kyc_take_photo : 'Démarrage caméra…'}
        </button>
      )}
    </div>
  );
}
