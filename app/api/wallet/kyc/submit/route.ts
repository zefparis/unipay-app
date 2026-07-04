import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../_proxy';

const TIMEOUT_MS = 10_000;

export async function POST(request: NextRequest) {
  const t = request.cookies.get('wallet_token')?.value;
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Forward raw multipart body with original content-type (preserves boundary)
  const contentType = request.headers.get('content-type') ?? '';
  const body = await request.arrayBuffer();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(`${API_URL}/v1/wallet/kyc/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Authorization: `Bearer ${t}`,
      },
      body,
      signal: ctrl.signal,
    });
    const data = await upstream.json();
    if (!upstream.ok) return NextResponse.json({ error: (data as { error?: string }).error ?? 'Failed' }, { status: upstream.status });
    return NextResponse.json(data, { status: 201 });
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
