import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../_proxy';

const TIMEOUT_MS = 15_000;

export async function POST(request: NextRequest) {
  const t = request.cookies.get('wallet_token')?.value;
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (process.env.NODE_ENV === 'production' && !process.env.API_URL) {
    return NextResponse.json({ error: 'Server misconfiguration: API_URL not set' }, { status: 503 });
  }

  const body = await request.text();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(`${API_URL}/v1/wallet/kyc/upgrade-cognitive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t}`,
      },
      body,
      signal: ctrl.signal,
    });
    const data = await upstream.json();
    if (!upstream.ok) return NextResponse.json({ error: (data as { error?: string }).error ?? 'Failed' }, { status: upstream.status });
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? 'Service temporairement indisponible' : 'Erreur réseau' },
      { status: isTimeout ? 503 : 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
