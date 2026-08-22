import { NextRequest, NextResponse } from 'next/server';
import { HYBRID_VECTOR_API_URL, getWorkerAuthHeaders, isWorkerSecretConfigured } from './sensitive-session';

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
 * ─── Fail modes (IMPORTANT distinction) ───────────────────────────
 *
 * 1. HCS_WORKER_SHARED_SECRET missing/empty → FAIL-CLOSED (503)
 *    A deployment misconfiguration must NEVER silently disable the
 *    sensitive session protection. This is a critical error that
 *    must be detected and surfaced, not hidden as a transient
 *    network issue. The boot-time check in sensitive-session.ts
 *    also logs a CRITICAL error at startup.
 *
 * 2. Network error / timeout / 5xx from hybrid-vector-api → FAIL-OPEN
 *    A transient infrastructure outage should not block financial
 *    transactions (the upstream unipay-api still has its own KYC
 *    limits and authentication). The error is logged for monitoring
 *    but the transaction proceeds.
 *
 * @returns null if the session is active (transaction may proceed),
 *          or a NextResponse with 403/503 if the session is not active
 *          or the guard is misconfigured.
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

  // ── Case 1: HCS_WORKER_SHARED_SECRET not configured → FAIL-CLOSED ──
  // This is a deployment misconfiguration, not a transient error.
  // Block the transaction and surface a clear error so the operator
  // fixes the config. Never silently disable security.
  if (!isWorkerSecretConfigured()) {
    console.error(
      '[guardSensitiveSession] CRITICAL: HCS_WORKER_SHARED_SECRET is not set — ' +
      'blocking transaction (fail-closed). Configure it in Vercel project settings.',
    );
    return NextResponse.json(
      {
        error: 'Server misconfigured',
        code: 'WORKER_SECRET_MISSING',
        message: 'La protection de session sensible est mal configurée. Contactez l\'administrateur.',
      },
      { status: 503 },
    );
  }

  let headers: Record<string, string>;
  try {
    headers = getWorkerAuthHeaders();
  } catch {
    // Defensive: isWorkerSecretConfigured() should have caught this,
    // but if getWorkerAuthHeaders throws for another reason, fail-closed.
    console.error(
      '[guardSensitiveSession] CRITICAL: getWorkerAuthHeaders() threw — ' +
      'blocking transaction (fail-closed).',
    );
    return NextResponse.json(
      {
        error: 'Server misconfigured',
        code: 'WORKER_AUTH_ERROR',
        message: 'La protection de session sensible est mal configurée. Contactez l\'administrateur.',
      },
      { status: 503 },
    );
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
      // ── Case 2: hybrid-vector-api returned non-200 → FAIL-OPEN ──
      // This could be a 500 from HV-API or a transient issue.
      // Log for monitoring but don't block the financial transaction.
      console.error(
        '[guardSensitiveSession] Status check returned non-200 (fail-open):',
        res.status, data.error,
      );
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
    // ── Case 2: network error / timeout → FAIL-OPEN ──
    // Transient infrastructure issue — don't block financial transactions.
    // The upstream unipay-api still has its own KYC limits and auth.
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    console.error(
      '[guardSensitiveSession] Status check network error (fail-open):',
      isTimeout ? 'TIMEOUT' : err instanceof Error ? err.message : String(err),
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}
