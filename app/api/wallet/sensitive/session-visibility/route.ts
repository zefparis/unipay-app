import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

/**
 * POST /api/wallet/sensitive/session-visibility
 *
 * Proxies to unipay-api's /v1/wallet/session/visibility.
 * The backend owns the session state (wallet_sensitive_sessions table)
 * and authenticates the caller via the wallet JWT.
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

  const result = await upstreamFetch(`${API_URL}/v1/wallet/session/visibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${walletToken}` },
    body: JSON.stringify({ sessionId, event }),
  });
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  if (!res.ok) return NextResponse.json({ error: (data as { error?: string }).error ?? 'Failed' }, { status: res.status });
  return NextResponse.json(data);
}
