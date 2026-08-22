import { NextRequest, NextResponse } from 'next/server';
import { HYBRID_VECTOR_API_URL, getWorkerAuthHeaders, isWorkerSecretConfigured } from '@/lib/sensitive-session';

/**
 * POST /api/wallet/sensitive/session-visibility
 *
 * Proxies to hybrid-vector-api's /api/pulseguard/session-visibility
 * with server-side X-Worker-Auth header (never exposed to client).
 *
 * The client sends { sessionId, event: 'blur'|'focus' }.
 * We inject the wallet_id as userId for audit logging.
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

  const { sessionId, event } = body as { sessionId?: string; event?: string };
  if (!sessionId || !event || (event !== 'blur' && event !== 'focus')) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
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
    const res = await fetch(`${HYBRID_VECTOR_API_URL}/api/pulseguard/session-visibility`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId,
        event,
        tenantId: 'unipay',
      }),
      signal: controller.signal,
    });
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
