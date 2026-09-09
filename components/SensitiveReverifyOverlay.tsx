'use client';

import { useState, useRef, useEffect } from 'react';

interface SensitiveReverifyOverlayProps {
  action: 'withdraw' | 'deposit' | 'send';
  onReactivate: (pin: string) => Promise<boolean>;
  onCancel: () => void;
}

/**
 * Full-screen overlay shown when a sensitive session is invalidated.
 * Forces the user to enter their wallet PIN before they can continue
 * with the sensitive action (withdraw/deposit/send).
 *
 * The PIN is verified against wallet_users.pin_hash (bcrypt) on the
 * backend — same pattern as /wallet/auth/change-pin. This replaces
 * the previous cognitive re-verification (Stroop/Reflex/Digit Span)
 * which was never validated server-side.
 */
export function SensitiveReverifyOverlay({
  action,
  onReactivate,
  onCancel,
}: SensitiveReverifyOverlayProps) {
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const actionLabel = action === 'withdraw' ? 'retrait'
    : action === 'deposit' ? 'dépôt'
    : 'transfert';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 4 || submitting) return;
    setSubmitting(true);
    setError('');
    const success = await onReactivate(pin);
    setSubmitting(false);
    if (!success) {
      setError('PIN incorrect. Réessayez.');
      setPin('');
      inputRef.current?.focus();
    }
    // If success, the parent component will unmount this overlay
  }

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
              Vous avez quitté l'application pendant le {actionLabel}. Saisissez votre PIN pour continuer.
            </p>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="reactivate-pin" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              PIN du portefeuille
            </label>
            <input
              ref={inputRef}
              id="reactivate-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]*"
              minLength={4}
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              disabled={submitting}
              placeholder="••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg tracking-[0.3em] text-gray-900 dark:text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00A651]/40 focus:border-[#00A651] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={pin.length < 4 || submitting}
            className="w-full h-[48px] bg-[#00A651] hover:bg-[#009148] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {submitting ? 'Vérification...' : 'Confirmer'}
          </button>
        </form>

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
