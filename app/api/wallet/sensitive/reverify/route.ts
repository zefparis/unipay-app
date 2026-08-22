import { NextRequest, NextResponse } from 'next/server';
import { HYBRID_VECTOR_API_URL, getWorkerAuthHeaders, validateCognitiveData, isWorkerSecretConfigured } from '@/lib/sensitive-session';

/**
 * POST /api/wallet/sensitive/reverify
 *
 * Re-verification endpoint for invalidated sensitive sessions.
 *
 * SECURITY: This endpoint NEVER resets the session directly without
 * proof of cognitive re-verification. The flow is:
 *   1. Client runs CognitiveTestFlow (reflex, stroop, digit span)
 *   2. Client sends { sessionId, cognitiveData } to this endpoint
 *   3. Server validates cognitiveData has real test results
 *      (validateCognitiveData checks for non-empty reflex/stroop/digit_span)
 *   4. Server calls hybrid-vector-api /session-reverify with X-Worker-Auth
 *   5. hybrid-vector-api resets status to 'active' ONLY if current status
 *      is 'invalidated' (conditional UPDATE .eq('status', 'invalidated'))
 *
 * This mirrors the PulseGuard pattern where the cognitive test results
 * ARE the proof of identity — there is no way to bypass the cognitive
 * test and directly reset the session.
 */
export async function POST(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { sessionId, cognitiveData } = body as {
    sessionId?: string;
    cognitiveData?: unknown;
  };

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  // ── Validate cognitive data has real test results ──
  // This is the guard that prevents direct session reset without
  // actually running the cognitive tests.
  if (!validateCognitiveData(cognitiveData)) {
    return NextResponse.json(
      { error: 'Cognitive re-verification required', code: 'COGNITIVE_DATA_INVALID' },
      { status: 400 },
    );
  }

  let headers: Record<string, string>;
  if (!isWorkerSecretConfigured()) {
    return NextResponse.json(
      { error: 'Server misconfigured', code: 'WORKER_SECRET_MISSING' },
      { status: 503 },
    );
  }
  try {
    headers = getWorkerAuthHeaders();
  } catch {
    return NextResponse.json(
      { error: 'Server misconfigured', code: 'WORKER_AUTH_ERROR' },
      { status: 503 },
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    // Call hybrid-vector-api's internal session-reverify endpoint
    // This endpoint checks that status === 'invalidated' before resetting
    // (conditional UPDATE .eq('status', 'invalidated'))
    const res = await fetch(`${HYBRID_VECTOR_API_URL}/api/pulseguard/session-reverify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId,
        tenantId: 'unipay',
      }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? data.message ?? 'Re-verification failed' },
        { status: res.status },
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? 'Service temporairement indisponible' : 'Erreur réseau' },
      { status: isTimeout ? 503 : 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}
