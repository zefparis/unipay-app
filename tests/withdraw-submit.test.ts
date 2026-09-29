/**
 * CDF withdrawal submission logic (lib/withdraw-submit.ts) — the page's
 * decisions for 201 / 202 / 409 / 422 / network error, and the
 * Idempotency-Key lifecycle (kept while ambiguous, rotated when definitive).
 */
import { describe, it, expect } from 'vitest';
import {
  interpretWithdrawResponse,
  interpretWithdrawError,
  newIdempotencyKey,
  MSG_MAYBE_IN_PROGRESS,
} from '@/lib/withdraw-submit';

const copy = { amountLabel: '100 CDF', totalLabel: '105 CDF', operatorLabel: 'airtel' };

describe('newIdempotencyKey', () => {
  it('produces distinct keys accepted by the proxy/API pattern', () => {
    const a = newIdempotencyKey(); const b = newIdempotencyKey();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9:_-]{8,128}$/);
  });
});

describe('interpretWithdrawResponse', () => {
  it('201 initiated → success message with amounts, key rotated', () => {
    const o = interpretWithdrawResponse(201, { transaction_id: 't1', status: 'processing', idempotent: false }, copy);
    expect(o.kind).toBe('initiated');
    expect(o.keepKey).toBe(false);
    expect(o).toMatchObject({ transactionId: 't1' });
    expect((o as { message: string }).message).toContain('100 CDF initié');
    expect((o as { message: string }).message).toContain('105 CDF débités');
  });

  it('201 idempotent replay of a processing tx → still "initiated" (same shape)', () => {
    const o = interpretWithdrawResponse(201, { transaction_id: 't1', status: 'processing', idempotent: true }, copy);
    expect(o.kind).toBe('initiated');
  });

  it('202 pending → NOT "initié", shows data.message, promises no amount, key KEPT', () => {
    const o = interpretWithdrawResponse(202, { transaction_id: 't2', status: 'pending', message: 'Withdrawal is being verified.' }, copy);
    expect(o.kind).toBe('pending');
    expect(o.keepKey).toBe(true);
    expect(o).toMatchObject({ transactionId: 't2', message: 'Withdrawal is being verified.' });
    expect((o as { message: string }).message).not.toMatch(/initié|recevrez|105/);
  });

  it('2xx with status pending (proxy that still forces 201) is treated as pending', () => {
    const o = interpretWithdrawResponse(201, { transaction_id: 't2', status: 'pending' }, copy);
    expect(o.kind).toBe('pending');
    expect(o.keepKey).toBe(true);
  });

  it('202 without message → default verification message', () => {
    const o = interpretWithdrawResponse(202, { transaction_id: 't2', status: 'pending' }, copy);
    expect((o as { message: string }).message).toMatch(/vérification/i);
  });

  it('409 already failed → clear message, key rotated', () => {
    const o = interpretWithdrawResponse(409, { error: 'WITHDRAWAL_ALREADY_FAILED', transaction_id: 't3', status: 'failed', idempotent: true }, copy);
    expect(o.kind).toBe('already_failed');
    expect(o.keepKey).toBe(false);
    expect((o as { message: string }).message).toMatch(/déjà échoué/);
  });

  it('422 IDEMPOTENCY_KEY_REUSED → rejected, key rotated', () => {
    const o = interpretWithdrawResponse(422, { error: 'IDEMPOTENCY_KEY_REUSED' }, copy);
    expect(o.kind).toBe('rejected');
    expect(o.keepKey).toBe(false);
  });

  it('402 → rejected with the API error text', () => {
    const o = interpretWithdrawResponse(402, { error: 'Insufficient balance' }, copy);
    expect(o).toMatchObject({ kind: 'rejected', message: 'Insufficient balance', keepKey: false });
  });

  it('502 provider unavailable → rejected (API refunded), key rotated', () => {
    const o = interpretWithdrawResponse(502, { error: 'Provider service unavailable' }, copy);
    expect(o).toMatchObject({ kind: 'rejected', keepKey: false });
  });

  it('401 → unauthorized', () => {
    expect(interpretWithdrawResponse(401, { error: 'Unauthorized' }, copy).kind).toBe('unauthorized');
  });

  it('non-JSON body → ambiguous, key kept, "maybe in progress" message', () => {
    const o = interpretWithdrawResponse(200, null, copy);
    expect(o.kind).toBe('ambiguous');
    expect(o.keepKey).toBe(true);
    expect((o as { message: string }).message).toContain(MSG_MAYBE_IN_PROGRESS);
  });
});

describe('interpretWithdrawError', () => {
  it('offline → ambiguous, offline wording, key kept', () => {
    const o = interpretWithdrawError(new TypeError('Failed to fetch'), false);
    expect(o).toMatchObject({ kind: 'ambiguous', keepKey: true });
    expect((o as { message: string }).message).toMatch(/hors ligne/);
    expect((o as { message: string }).message).toContain(MSG_MAYBE_IN_PROGRESS);
  });
  it('SyntaxError (unparseable body) → ambiguous, "illisible"', () => {
    const o = interpretWithdrawError(new SyntaxError('Unexpected token <'), true);
    expect((o as { message: string }).message).toMatch(/illisible/);
    expect(o.keepKey).toBe(true);
  });
  it('generic network error → ambiguous, "Erreur réseau" + history hint', () => {
    const o = interpretWithdrawError(new TypeError('Failed to fetch'), true);
    expect((o as { message: string }).message).toMatch(/^Erreur réseau/);
    expect((o as { message: string }).message).toContain(MSG_MAYBE_IN_PROGRESS);
    expect(o.keepKey).toBe(true);
  });
});

describe('key lifecycle (as wired in the page)', () => {
  it('ambiguous → same key on retry; definitive → new key', () => {
    let key = newIdempotencyKey();
    const rotate = (keep: boolean) => { if (!keep) key = newIdempotencyKey(); };
    const k0 = key;
    rotate(interpretWithdrawError(new TypeError('x'), true).keepKey);           expect(key).toBe(k0);
    rotate(interpretWithdrawResponse(202, { status: 'pending' }, copy).keepKey); expect(key).toBe(k0);
    rotate(interpretWithdrawResponse(200, null, copy).keepKey);                  expect(key).toBe(k0);
    rotate(interpretWithdrawResponse(201, { status: 'processing' }, copy).keepKey); expect(key).not.toBe(k0);
    const k1 = key;
    rotate(interpretWithdrawResponse(409, { status: 'failed' }, copy).keepKey);  expect(key).not.toBe(k1);
  });
});
