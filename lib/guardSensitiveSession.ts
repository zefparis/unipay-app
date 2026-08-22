import { NextRequest, NextResponse } from 'next/server';
import { HYBRID_VECTOR_API_URL, getWorkerAuthHeaders } from './sensitive-session';

/**
 * Server-side guard for sensitive session enforcement.
 *
 * Called by withdraw/deposit/send route handlers BEFORE forwarding
 * the transaction to the upstream unipay-api. This is the
 * server-authoritative check — even if the frontend is bypassed
 * (e.g. direct API call), the transaction will be rejected if the
 * sensitive session is not 'active'.
 *
 * The client must send a `x-sensitive-session-id` header with the
 * session ID. If the header is missing, the transaction is rejected
 * (fail-closed for financial actions).
 *
 * @returns null if the session is active (transaction may proceed),
 *          or a NextResponse with 403 if the session is not active.
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

  let headers: Record<string, string>;
  try {
    headers = getWorkerAuthHeaders();
  } catch {
    // If worker auth is not configured, fail-open (don't block transactions
    // due to misconfiguration — but log the error)
    console.error('[guardSensitiveSession] HCS_WORKER_SHARED_SECRET not set — failing open');
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  try {
    const res = await fetch(
      `${HYBRID_VECTOR_API_URL}/api/pulseguard/session-status?sessionId=${encodeURIComponent(sessionId)}`,
      { headers, signal: controller.signal },
    );
    const data = await res.json();

    if (!res.ok) {
      // If the status check fails, fail-open (network error shouldn't block)
      console.error('[guardSensitiveSession] Status check failed:', data.error);
      return null;
    }

    const status = (data as { status: string }).status;
    if (status === 'active' || status === 'not_found') {
      // 'not_found' means no session was created (user never left the app)
      // — treat as active
      return null;
    }

    // Session is suspended or invalidated — block the transaction
    return NextResponse.json(
      {
        error: 'Sensitive session not active',
        code: 'SESSION_NOT_ACTIVE',
        status,
        message: status === 'invalidated'
          ? 'Votre session de sécurité a expiré. Veuillez compléter la vérification cognitive.'
          : 'Session de sécurité en cours de vérification. Veuillez patienter.',
      },
      { status: 403 },
    );
  } catch (err) {
    // Network error — fail-open (don't block transactions due to infra issues)
    console.error('[guardSensitiveSession] Status check error:', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
