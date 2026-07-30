'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { wT } from '@/lib/i18n-wallet';

const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.unipaycongo.com';
const MIN_FIAT = 10;

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

interface TransakOrder {
  id: string;
  status: string;
  fiat_amount: number;
  fiat_currency: string;
  crypto_amount: number | null;
  is_custody: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * TransakDepositTab
 * Flow:
 *  1. User fills amount + currency (+ optional BSC wallet address)
 *  2. POST /api/wallet/transak/init → { transakUrl, orderId }
 *  3. Redirect to Transak hosted page (no Stripe.js / SDK needed)
 *  4. Transak redirects back to /wallet/deposit?transak_done=<orderId>
 *  5. Component polls /api/wallet/transak/orders/<orderId> every 3 s
 *  6. On COMPLETED + is_custody: usd_balance already credited by webhook
 * ───────────────────────────────────────────────────────────────────────────── */
export default function TransakDepositTab({ usdBalance }: { usdBalance: number }) {
  const router         = useRouter();
  const { locale }     = useParams<{ locale: string }>();
  const searchParams   = useSearchParams();
  const T = wT(locale ?? 'fr');

  // Returned from Transak redirect
  const returnedOrderId = searchParams.get('transak_done');

  const [amount,   setAmount]   = useState('');
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
  const [walletAddr, setWalletAddr] = useState('');
  const [showWallet, setShowWallet] = useState(false);

  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [success, setSuccess]   = useState('');
  const [polling, setPolling]   = useState(false);
  const [order,   setOrder]     = useState<TransakOrder | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const amountNum  = Number(amount);

  /* ── USDT/CDF live rate ─────────────────────────────────────────────── */
  const [rate, setRate] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/wallet/rates/usdt-cdf')
      .then((r) => r.ok ? r.json() : null)
      .then((d: { rate?: number } | null) => { if (d?.rate) setRate(d.rate); })
      .catch(() => {});
  }, []);

  /* ── Poll order after returning from Transak ────────────────────────── */
  const startPolling = useCallback((orderId: string) => {
    setPolling(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const r = await fetch(`/api/wallet/transak/orders/${orderId}`);
        if (!r.ok) return;
        const data: TransakOrder = await r.json();
        setOrder(data);
        if (data.status === 'COMPLETED') {
          clearInterval(pollRef.current!);
          setPolling(false);
          const credited = data.is_custody && data.crypto_amount
            ? T.transak_custody_credited.replace('{amount}', data.crypto_amount.toFixed(4))
            : T.transak_external_sent;
          setSuccess(T.transak_success.replace('{detail}', credited));
          setTimeout(() => router.push(`/${locale}/wallet`), 4000);
          return;
        }
        if (data.status === 'FAILED' || data.status === 'CANCELLED') {
          clearInterval(pollRef.current!);
          setPolling(false);
          setError(data.status === 'FAILED' ? T.transak_failed : T.transak_cancelled);
        }
      } catch { /* ignore */ }
      if (attempts >= 40) { // 2 min max
        clearInterval(pollRef.current!);
        setPolling(false);
        setSuccess(T.transak_processing);
        setTimeout(() => router.push(`/${locale}/wallet`), 5000);
      }
    }, 3000);
  }, [router, locale, T]);

  /* ── Auto-start polling when returning from Transak redirect ────────── */
  useEffect(() => {
    if (returnedOrderId && !pollRef.current) {
      startPolling(returnedOrderId);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [returnedOrderId, startPolling]);

  /* ── Form submit ────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (amountNum < MIN_FIAT) { setError(T.transak_err_min.replace('{min}', String(MIN_FIAT))); return; }
    if (showWallet && walletAddr && !/^0x[0-9a-fA-F]{40}$/.test(walletAddr)) {
      setError(T.transak_err_addr);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/transak/init', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_fiat:    amountNum,
          currency,
          wallet_address: showWallet && walletAddr ? walletAddr : undefined,
          redirect_url:   `${APP_URL}/${locale}/wallet/deposit?transak_done=ORDERID`,
        }),
      });
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) {
        const d = await res.json() as { error?: string; message?: string };
        setError(d.message ?? d.error ?? T.transak_err_generic);
        return;
      }
      const { transakUrl } = await res.json() as { transakUrl: string; orderId: string };
      // Full-page redirect — Transak hosted page handles the card form
      window.location.href = transakUrl;
    } catch {
      setError(T.transak_err_network);
    } finally {
      setLoading(false);
    }
  };

  /* ── Show polling / post-redirect state ─────────────────────────────── */
  if (returnedOrderId || polling || success.length > 0) {
    return (
      <div className="flex flex-col gap-4 px-4 py-5">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-4 flex flex-col gap-3">
          <p className="font-semibold text-slate-100 text-sm">
            {success ? T.transak_confirmed : T.transak_checking}
          </p>
          {order && (
            <div className="text-xs text-slate-400 flex flex-col gap-1">
              <span>{T.transak_status} <span className="text-slate-200 font-medium">{order.status}</span></span>
              {order.crypto_amount && (
                <span>{T.transak_usdt_received} <span className="text-green-400 font-bold">{order.crypto_amount.toFixed(4)}</span></span>
              )}
            </div>
          )}
          {success && <p className="text-sm text-green-400 font-medium">{success}</p>}
          {error   && <p className="text-sm text-red-400">{error}</p>}
          {polling && !success && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Spinner /> {T.transak_auto_refresh}
            </div>
          )}
        </div>

        {(error || success) && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/wallet`)}
            className="w-full h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-sm"
          >
            {T.transak_back_wallet}
          </button>
        )}
      </div>
    );
  }

  /* ── Form ─────────────────────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">

      {usdBalance > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-2 flex justify-between text-xs">
          <span className="text-blue-700 dark:text-blue-400">{T.transak_usd_balance}</span>
          <span className="font-bold text-blue-700 dark:text-blue-400">{usdBalance.toFixed(2)} USD</span>
        </div>
      )}

      {/* Currency selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{T.transak_fiat_currency}</label>
        <div className="flex gap-2">
          {(['USD', 'EUR'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition
                ${currency === c
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
          {T.transak_amount.replace('{currency}', currency)} <span className="text-gray-500 font-normal">{T.transak_amount_hint.replace('{min}', String(MIN_FIAT)).replace('{currency}', currency)}</span>
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="50.00"
          min={MIN_FIAT}
          step="0.01"
          required
          className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        {amountNum >= MIN_FIAT && rate && (
          <p className="text-xs text-slate-400 pl-1">
            {T.transak_rate_hint.replace('{usdt}', (amountNum / 1).toFixed(4)).replace('{cdf}', (amountNum * rate).toLocaleString('fr-FR', { maximumFractionDigits: 0 }))}
          </p>
        )}
      </div>

      {/* Optional BSC wallet address */}
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setShowWallet(!showWallet)}
          className="text-xs text-blue-500 dark:text-blue-400 text-left underline underline-offset-2"
        >
          {showWallet ? T.transak_custody_back : T.transak_custody_toggle}
        </button>
        {showWallet && (
          <input
            type="text"
            value={walletAddr}
            onChange={(e) => setWalletAddr(e.target.value)}
            placeholder="0xABCD…"
            className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        )}
        {!showWallet && (
          <p className="text-xs text-slate-500">
            {T.transak_custody_hint}
          </p>
        )}
      </div>

      {/* Info block */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-xs text-slate-300 flex flex-col gap-1">
        <p className="font-semibold text-slate-100">{T.transak_info_title}</p>
        <p className="opacity-75">{T.transak_info_redirect}</p>
        <p className="opacity-60 mt-0.5">{T.transak_info_fees}</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-[52px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2"
      >
        {loading ? <><Spinner /> {T.transak_preparing}</> : `${T.transak_buy} ${amountNum >= MIN_FIAT ? amountNum.toFixed(2) + ' ' + currency + ' → USDT' : 'USDT'} →`}
      </button>

      <p className="text-center text-xs text-slate-500">{T.transak_secured}</p>
    </form>
  );
}
