import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

/**
 * GET /api/wallet/sensitive/session-status?sessionId=...
 *
 * Proxies to unipay-api's /v1/wallet/session/status.
 * Returns { ok: true, status: 'active'|'suspended'|'invalidated' }
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

  const result = await upstreamFetch(
    `${API_URL}/v1/wallet/session/status?sessionId=${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${walletToken}` } },
  );
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  if (!res.ok) return NextResponse.json({ error: (data as { error?: string }).error ?? 'Failed' }, { status: res.status });
  return NextResponse.json(data);
}
