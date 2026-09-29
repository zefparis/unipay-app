import { describe, it, expect } from 'vitest';
import { FEE_RATE } from '@/lib/fees';
import { wT } from '@/lib/i18n-wallet';

/**
 * Parity test — the formula and expectations below mirror
 * unipay-api/src/lib/wallet-fees.ts (walletFee) and its test
 * src/lib/__tests__/wallet-fee-rate.test.ts. If one side changes,
 * the other must change too.
 */

// Withdraw model: fee is ADDED on top — user is debited amount+fee,
// receives the full amount. Same formula as the backend.
const withdrawFee   = (amount: number) => Math.round(amount * FEE_RATE * 100) / 100;
const withdrawTotal = (amount: number) => Math.round((amount + withdrawFee(amount)) * 100) / 100;
// Deposit model: fee is DEDUCTED — user pays amount, is credited amount−fee.
const depositNet    = (amount: number) => Math.round((amount - withdrawFee(amount)) * 100) / 100;

describe('wallet fee rate (front)', () => {
  it('fallback rate is 5%', () => {
    expect(FEE_RATE).toBe(0.05);
  });

  it.each([
    // [amount, fee, withdraw total debited, withdraw received, deposit net credited]
    [100, 5,    105,   100, 95],
    [250, 12.5, 262.5, 250, 237.5],
    [500, 25,   525,   500, 475],
    [1,   0.05, 1.05,  1,   0.95],
    [10,  0.5,  10.5,  10,  9.5],
  ])(
    'amount %i → fee %f | debited %f | received %f | deposit net %f',
    (amount, expectedFee, expectedTotal, expectedReceived, expectedNet) => {
      expect(withdrawFee(amount)).toBe(expectedFee);
      expect(withdrawTotal(amount)).toBe(expectedTotal);
      expect(amount).toBe(expectedReceived);
      expect(depositNet(amount)).toBe(expectedNet);
    },
  );

  it('fee never rounds to zero within allowed minimums', () => {
    expect(withdrawFee(100)).toBeGreaterThan(0); // CDF min withdraw
    expect(withdrawFee(1)).toBeGreaterThan(0);   // USD min
  });

  it('fee label interpolates the live rate', () => {
    expect(wT('fr').fee_pct.replace('{pct}', String(FEE_RATE * 100))).toBe('Frais (5%)');
    expect(wT('en').fee_pct.replace('{pct}', String(FEE_RATE * 100))).toBe('Fee (5%)');
  });
});
