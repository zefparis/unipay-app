import { NextRequest, NextResponse } from 'next/server';
import { HYBRID_VECTOR_API_URL, getWorkerAuthHeaders, isWorkerSecretConfigured } from '@/lib/sensitive-session';

/**
 * GET /api/wallet/sensitive/session-status?sessionId=...
 *
 * Proxies to hybrid-vector-api's /api/pulseguard/session-status
 * with server-side X-Worker-Auth header.
 *
 * Returns { ok: true, status: 'active'|'suspended'|'invalidated'|'not_found' }
 */
export async function GET(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
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
    const res = await fetch(
      `${HYBRID_VECTOR_API_URL}/api/pulseguard/session-status?sessionId=${encodeURIComponent(sessionId)}`,
      { headers, signal: controller.signal },
    );
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error ?? 'Failed' }, { status: res.status });
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
