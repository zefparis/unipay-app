import { NextResponse } from 'next/server';

export const API_URL =
  process.env.API_URL ?? 'https://unipay-api.onrender.com';

const TIMEOUT_MS = 10_000;

type FetchSuccess = { ok: true; res: Response; data: unknown };
type FetchFailure = { ok: false; errorResponse: NextResponse };

export async function upstreamFetch(
  url: string,
  init: RequestInit = {}
): Promise<FetchSuccess | FetchFailure> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const data: unknown = await res.json().catch(() => ({}));
    return { ok: true, res, data };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: isTimeout ? 'Service temporairement indisponible' : 'Erreur réseau' },
        { status: isTimeout ? 503 : 502 }
      ),
    };
  } finally {
    clearTimeout(timer);
  }
}
