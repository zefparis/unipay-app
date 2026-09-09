import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../app/api/wallet/_proxy';

/**
 * Server-side guard for sensitive session enforcement.
 *
 * Called by the 11 sensitive route handlers (withdraw, deposit, send,
 * send-usdt, swap, crypto-withdraw, cglt/withdraw-bsc, unipesa/withdraw,
 * unipesa/deposit, wcglt-to-usdt, auth/change-pin) BEFORE forwarding the
 * transaction to the upstream unipay-api.
 *
 * The client must send a `x-sensitive-session-id` header with the session
 * ID. If the header is missing, the transaction is rejected (fail-closed).
 *
 * The session state is owned by unipay-api (wallet_sensitive_sessions table).
 * This guard queries it via GET /v1/wallet/session/status with the wallet
 * JWT. If the status is 'invalidated' or 'suspended', the transaction is
 * blocked with 403. If 'active' (or no session record), it proceeds.
 *
 * ─── Fail modes ───────────────────────────────────────────────────
 *
 * 1. Missing x-sensitive-session-id header → FAIL-CLOSED (403)
 * 2. Network error / timeout / 5xx from unipay-api → FAIL-OPEN
 *    A transient infrastructure outage should not block financial
 *    transactions (the upstream unipay-api still has its own KYC limits
 *    and authentication). The error is logged for monitoring but the
 *    transaction proceeds.
 *
 * @returns null if the session is active (transaction may proceed),
 *          or a NextResponse with 403/503 if the session is not active.
 */
export async function guardSensitiveSession(
  request: NextRequest,
): Promise<NextResponse | null> {
  const sessionId = request.headers.get('x-sensitive-session-id');
  if (!sessionId) {
    return NextResponse.json(
      {
        error: 'Sensitive session required',
        code: 'SESSION_ID_MISSING',
        message: 'Cette action nécessite une session de sécurité active.',
      },
      { status: 403 },
    );
  }

  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) {
    // No wallet token — the route handler will return 401 anyway, but
    // return null here to let the handler produce the canonical 401.
    return null;
  }

  const result = await upstreamFetch(
    `${API_URL}/v1/wallet/session/status?sessionId=${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${walletToken}` } },
  );

  if (!result.ok) {
    // Network error / timeout from unipay-api → FAIL-OPEN
    // The upstream unipay-api still has its own auth and KYC limits.
    console.error(
      '[guardSensitiveSession] Status check network error (fail-open):',
      result.errorResponse.status,
    );
    return null;
  }

  const { res, data } = result;
  if (!res.ok) {
    // unipay-api returned non-200 → FAIL-OPEN (transient issue)
    console.error(
      '[guardSensitiveSession] Status check returned non-200 (fail-open):',
      res.status, (data as { error?: string }).error,
    );
    return null;
  }

  const status = (data as { status: string }).status;
  if (status === 'active') {
    return null;
  }

  // Session is suspended or invalidated — block the transaction
  return NextResponse.json(
    {
      error: 'Sensitive session not active',
      code: 'SESSION_NOT_ACTIVE',
      status,
      message: status === 'invalidated'
        ? 'Votre session de sécurité a expiré. Veuillez saisir votre PIN pour continuer.'
        : 'Session de sécurité en cours de vérification. Veuillez patienter.',
    },
    { status: 403 },
  );
}
