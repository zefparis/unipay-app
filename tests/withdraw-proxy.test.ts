/**
 * /api/wallet/withdraw proxy — relays the upstream HTTP status verbatim
 * (201, 202, 409, 422) and forwards the Idempotency-Key header.
 * Upstream fetch is mocked; the sensitive-session guard is mocked to pass.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/guardSensitiveSession', () => ({ guardSensitiveSession: async () => null }));

import { POST, maxDuration } from '@/app/api/wallet/withdraw/route';

type Captured = { url: string; init: RequestInit };
let captured: Captured | null = null;
let upstream: () => Response;

beforeEach(() => {
  captured = null;
  upstream = () => new Response(JSON.stringify({ transaction_id: 't1', status: 'processing' }), { status: 201, headers: { 'content-type': 'application/json' } });
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => { captured = { url, init }; return upstream(); }));
});
afterEach(() => { vi.unstubAllGlobals(); });

function req(headers: Record<string, string> = {}, body: unknown = { operator: 'airtel', phone_mm: '+243997174834', amount: 100 }) {
  return new NextRequest('http://localhost/api/wallet/withdraw', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: 'wallet_token=tok', ...headers },
    body: JSON.stringify(body),
  });
}
const sentHeaders = () => captured!.init.headers as Record<string, string>;

describe('proxy /api/wallet/withdraw', () => {
  it('declares maxDuration 45 s', () => { expect(maxDuration).toBe(45); });

  it('forwards Idempotency-Key to the API', async () => {
    await POST(req({ 'idempotency-key': 'wd-abcdef123456' }));
    expect(captured!.url).toMatch(/\/v1\/wallet\/withdraw$/);
    expect(sentHeaders()['Idempotency-Key']).toBe('wd-abcdef123456');
    expect(sentHeaders()['Authorization']).toBe('Bearer tok');
  });

  it('drops a malformed Idempotency-Key instead of forwarding it', async () => {
    await POST(req({ 'idempotency-key': 'short' }));
    expect(sentHeaders()['Idempotency-Key']).toBeUndefined();
    await POST(req({ 'idempotency-key': 'has spaces and $ymbols!' }));
    expect(sentHeaders()['Idempotency-Key']).toBeUndefined();
  });

  it('no header → nothing forwarded (API generates a server key)', async () => {
    await POST(req());
    expect(sentHeaders()['Idempotency-Key']).toBeUndefined();
  });

  it('relays 201 with the upstream body', async () => {
    const res = await POST(req());
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ transaction_id: 't1', status: 'processing' });
  });

  it('relays 202 (was forced to 201 before) with status/message/transaction_id', async () => {
    upstream = () => new Response(JSON.stringify({ transaction_id: 't2', status: 'pending', message: 'Withdrawal is being verified.', idempotent: false }), { status: 202 });
    const res = await POST(req());
    expect(res.status).toBe(202);
    expect(await res.json()).toMatchObject({ transaction_id: 't2', status: 'pending', message: 'Withdrawal is being verified.' });
  });

  it('relays 409 with error, transaction_id, status, idempotent', async () => {
    upstream = () => new Response(JSON.stringify({ error: 'WITHDRAWAL_ALREADY_FAILED', transaction_id: 't3', status: 'failed', idempotent: true, statusCode: 409 }), { status: 409 });
    const res = await POST(req());
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'WITHDRAWAL_ALREADY_FAILED', transaction_id: 't3', status: 'failed', idempotent: true });
  });

  it('relays 422 IDEMPOTENCY_KEY_REUSED', async () => {
    upstream = () => new Response(JSON.stringify({ error: 'IDEMPOTENCY_KEY_REUSED', statusCode: 422 }), { status: 422 });
    const res = await POST(req());
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'IDEMPOTENCY_KEY_REUSED' });
  });

  it('relays 502 without leaking anything but error', async () => {
    upstream = () => new Response(JSON.stringify({ error: 'Provider service unavailable', statusCode: 502 }), { status: 502 });
    const res = await POST(req());
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Provider service unavailable' });
  });

  it('401 without wallet cookie, before any upstream call', async () => {
    const r = new NextRequest('http://localhost/api/wallet/withdraw', { method: 'POST', body: '{}' });
    const res = await POST(r);
    expect(res.status).toBe(401);
    expect(captured).toBeNull();
  });

  it('upstream timeout → 503 "Service temporairement indisponible" (not a fake 201)', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => new Promise((_res, rej) => {
      init.signal!.addEventListener('abort', () => { const e = new Error('aborted'); e.name = 'AbortError'; rej(e); });
      (init.signal as AbortSignal).dispatchEvent(new Event('abort')); // simulate immediate abort
    })));
    const res = await POST(req());
    expect(res.status).toBe(503);
  });
});
