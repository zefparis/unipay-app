import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../_proxy';
import { guardSensitiveSession } from '@/lib/guardSensitiveSession';

// The upstream API waits up to 15 s on the mobile-money provider before
// answering 201/202/502. Our upstream timeout must be LONGER than that
// (25 s) so we relay the API's verdict instead of aborting first with a
// misleading "network error", and the function must be allowed to live
// long enough for it (45 s). Requires a Vercel plan whose function max
// duration is >= 45 s (see PR notes).
export const maxDuration = 45;
const UPSTREAM_TIMEOUT_MS = 25_000;

const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9:_-]{8,128}$/;

export async function POST(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Sensitive session guard (server-side enforcement) ──
  const guardResult = await guardSensitiveSession(request);
  if (guardResult) return guardResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${walletToken}`,
  };
  // Forward the client's idempotency key so a retry after an ambiguous
  // outcome is recognised by the API as the same withdrawal.
  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey && IDEMPOTENCY_KEY_RE.test(idempotencyKey)) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const result = await upstreamFetch(`${API_URL}/v1/wallet/withdraw`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }, UPSTREAM_TIMEOUT_MS);

  if (!result.ok) return result.errorResponse;
  const { res, data } = result;

  // Relay the upstream status verbatim: 201 initiated, 202 being verified,
  // 409 already failed, 422 key reused, 4xx validation... The body is the
  // API's own (already free of provider internals).
  if (!res.ok) {
    const d = (data ?? {}) as Record<string, unknown>;
    return NextResponse.json(
      {
        error: typeof d.error === 'string' ? d.error : 'Withdrawal failed',
        ...(typeof d.transaction_id === 'string' ? { transaction_id: d.transaction_id } : {}),
        ...(typeof d.status === 'string' ? { status: d.status } : {}),
        ...(typeof d.idempotent === 'boolean' ? { idempotent: d.idempotent } : {}),
      },
      { status: res.status },
    );
  }

  return NextResponse.json(data, { status: res.status });
}
