/**
 * CDF withdrawal submission — idempotency key lifecycle and response
 * interpretation. Pure (no React, no fetch) so it is unit-testable.
 *
 * Key rule: the SAME Idempotency-Key must be reused while the outcome is
 * AMBIGUOUS (network error, non-JSON body, 202 "being verified"), so a
 * retry cannot create a second withdrawal. A DEFINITIVE answer (201
 * initiated, 4xx rejected, 409 already failed, 5xx) rotates the key.
 */

export function newIdempotencyKey(): string {
  const uuid = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `wd-${uuid}`;
}

export type WithdrawOutcome =
  | { kind: 'initiated'; transactionId?: string; message: string; keepKey: false }
  | { kind: 'pending';   transactionId?: string; message: string; keepKey: true  }
  | { kind: 'already_failed'; transactionId?: string; message: string; keepKey: false }
  | { kind: 'rejected';  message: string; keepKey: false }
  | { kind: 'unauthorized'; keepKey: true }
  | { kind: 'ambiguous'; message: string; keepKey: true };

export interface WithdrawCopy {
  amountLabel: string;   // e.g. "100 CDF"
  totalLabel: string;    // e.g. "105 CDF"
  operatorLabel: string; // e.g. "airtel"
}

export const MSG_MAYBE_IN_PROGRESS =
  'Le retrait est peut-être en cours. Vérifie ton historique avant de réessayer.';

/** Interpret an HTTP response (status + parsed body, or null body if non-JSON). */
export function interpretWithdrawResponse(
  status: number,
  data: Record<string, unknown> | null,
  copy: WithdrawCopy,
): WithdrawOutcome {
  if (status === 401) return { kind: 'unauthorized', keepKey: true };

  if (data === null) {
    // Non-JSON body: we cannot tell what happened server-side.
    return { kind: 'ambiguous', keepKey: true, message: `Réponse illisible du serveur. ${MSG_MAYBE_IN_PROGRESS}` };
  }

  const txId = typeof data.transaction_id === 'string' ? data.transaction_id : undefined;

  if (status === 202 || (status >= 200 && status < 300 && data.status === 'pending')) {
    // Provider outcome unknown — no amount promised, same key kept.
    const msg = typeof data.message === 'string' && data.message.length > 0
      ? data.message
      : 'Retrait en cours de vérification. Ton solde sera mis à jour dès confirmation de l’opérateur.';
    return { kind: 'pending', transactionId: txId, message: msg, keepKey: true };
  }

  if (status >= 200 && status < 300) {
    return {
      kind: 'initiated', transactionId: txId, keepKey: false,
      message: `Retrait de ${copy.amountLabel} initié. ${copy.totalLabel} débités, vous recevrez ${copy.amountLabel} sur votre compte ${copy.operatorLabel}.`,
    };
  }

  if (status === 409) {
    return {
      kind: 'already_failed', transactionId: txId, keepKey: false,
      message: 'Ce retrait a déjà échoué et a été remboursé. Tu peux soumettre une nouvelle demande.',
    };
  }

  if (status === 422 && data.error === 'IDEMPOTENCY_KEY_REUSED') {
    return { kind: 'rejected', keepKey: false, message: 'Cette demande a déjà été soumise avec un autre montant ou numéro. Recommence avec une nouvelle demande.' };
  }

  if (status >= 500) {
    // Server error: the API refused or crashed; nothing definitive known
    // about the provider, but the API's own refund path handles 502.
    return { kind: 'rejected', keepKey: false, message: typeof data.error === 'string' ? data.error : 'Service temporairement indisponible, réessaie plus tard.' };
  }

  return { kind: 'rejected', keepKey: false, message: typeof data.error === 'string' ? data.error : 'Retrait échoué' };
}

/** Interpret a thrown error from fetch()/res.json() — always ambiguous. */
export function interpretWithdrawError(err: unknown, online: boolean): WithdrawOutcome {
  if (!online) {
    return { kind: 'ambiguous', keepKey: true, message: `Tu es hors ligne. ${MSG_MAYBE_IN_PROGRESS}` };
  }
  if (err instanceof SyntaxError) {
    return { kind: 'ambiguous', keepKey: true, message: `Réponse illisible du serveur. ${MSG_MAYBE_IN_PROGRESS}` };
  }
  return { kind: 'ambiguous', keepKey: true, message: `Erreur réseau. ${MSG_MAYBE_IN_PROGRESS}` };
}
