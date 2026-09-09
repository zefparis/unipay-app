import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

/**
 * POST /api/wallet/sensitive/reactivate
 *
 * Re-activates an invalidated sensitive session by verifying the wallet PIN
 * against pin_hash (bcrypt) on the backend. Replaces the previous cognitive
 * re-verification flow which never validated the cognitive data server-side.
 *
 * Flow:
 *   1. Client shows a PIN input (SensitiveReverifyOverlay)
 *   2. Client sends { sessionId, pin } to this endpoint
 *   3. Server (unipay-api) verifies pin against wallet_users.pin_hash
 *   4. If valid AND session status === 'invalidated', resets to 'active'
 *   5. Rate-limited to 5 attempts/minute/wallet_id on the backend
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

  const { sessionId, pin } = body as { sessionId?: string; pin?: string };

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }
  if (!pin || !/^[0-9]{4,8}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN invalide' }, { status: 400 });
  }

  const result = await upstreamFetch(`${API_URL}/v1/wallet/session/reactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${walletToken}` },
    body: JSON.stringify({ sessionId, pin }),
  });
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  if (!res.ok) return NextResponse.json({ error: (data as { error?: string }).error ?? 'Re-activation failed' }, { status: res.status });
  return NextResponse.json(data);
}
