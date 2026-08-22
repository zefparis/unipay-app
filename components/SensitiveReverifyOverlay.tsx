'use client';

import { useState } from 'react';
import { CognitiveTestFlow, type CognitiveData } from '@/app/[locale]/wallet/kyc/cognitive/CognitiveTestFlow';
import type { WalletDict } from '@/lib/i18n-wallet';

interface SensitiveReverifyOverlayProps {
  T: WalletDict;
  action: 'withdraw' | 'deposit' | 'send';
  onReverify: (cognitiveData: unknown) => Promise<boolean>;
  onCancel: () => void;
}

/**
 * Full-screen overlay shown when a sensitive session is invalidated.
 * Forces the user to complete cognitive tests before they can
 * continue with the sensitive action (withdraw/deposit/send).
 *
 * This reuses the same CognitiveTestFlow component as the KYC level 2
 * upgrade, but in a different context (trigger_reason: sensitive_reverify).
 */
export function SensitiveReverifyOverlay({
  T,
  action,
  onReverify,
  onCancel,
}: SensitiveReverifyOverlayProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const actionLabel = action === 'withdraw' ? 'retrait'
    : action === 'deposit' ? 'dépôt'
    : 'transfert';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-amber-600 dark:text-amber-400">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Vérification de sécurité requise
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Vous avez quitté l&apos;application pendant le {actionLabel}. Confirmez votre identité pour continuer.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {submitting ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <svg className="animate-spin h-6 w-6 text-[#00A651]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Analyse de sécurité en cours...
              </p>
            </div>
          ) : (
            <CognitiveTestFlow
              T={T}
              onComplete={async (data: CognitiveData) => {
                setSubmitting(true);
                setError('');
                const success = await onReverify(data);
                setSubmitting(false);
                if (!success) {
                  setError('Échec de la vérification. Réessayez.');
                }
                // If success, the parent component will unmount this overlay
              }}
            />
          )}
        </div>

        {/* Footer */}
        {!submitting && (
          <div className="border-t border-gray-100 dark:border-slate-800 px-5 py-3">
            <button
              onClick={onCancel}
              className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition"
            >
              Annuler et retourner au portefeuille
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
