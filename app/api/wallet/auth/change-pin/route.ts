import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';
import { guardSensitiveSession } from '@/lib/guardSensitiveSession';

export async function POST(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ── Sensitive session guard (server-side enforcement) ──
  // change-pin is particularly sensitive (alters auth credentials). The backend
  // also requires the current PIN as a second factor, so a fail-open on network
  // error does not let an attacker change the PIN without knowing it — but the
  // guard still blocks session-invalidated JWTs from even attempting, which
  // closes a brute-force vector on the PIN verification.
  const guardResult = await guardSensitiveSession(request);
  if (guardResult) return guardResult;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const result = await upstreamFetch(`${API_URL}/v1/wallet/auth/change-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${walletToken}` },
    body: JSON.stringify(body),
  });
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  if (!res.ok) return NextResponse.json({ error: (data as { error?: string }).error ?? 'Failed' }, { status: res.status });
  return NextResponse.json(data);
}
