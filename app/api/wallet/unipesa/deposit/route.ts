import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

export async function POST(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const result = await upstreamFetch(`${API_URL}/v1/wallet/unipesa/deposit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${walletToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  if (!res.ok) return NextResponse.json({ error: (data as { error?: string }).error ?? 'Failed' }, { status: res.status });
  return NextResponse.json(data);
}
