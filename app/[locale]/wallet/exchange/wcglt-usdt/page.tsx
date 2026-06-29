'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingDown, ExternalLink } from 'lucide-react';

const CGLT_PER_WCGLT   = 500;
const WCGLT_PRICE_USD  = 0.109;
const PANCAKE_FEE_RATE = 0.0025; // 0.25%

const BLOCKED_ADDRESSES = new Set([
  '0x7851e44d4a8b0939cf10ede3922a762722437ea5',
]);

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

export default function WcgltToUsdtPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();

  const [cgltBalance, setCgltBalance]   = useState<number | null>(null);
  const [amount, setAmount]             = useState('');
  const [bscAddress, setBscAddress]     = useState('');
  const [addrHistory, setAddrHistory]   = useState<string[]>([]);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [txHash, setTxHash]             = useState('');
  const [usdtActual, setUsdtActual]     = useState<number | null>(null);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    fetch('/api/wallet/cglt/balance')
      .then((r) => r.json())
      .then((d: { cglt_balance?: number }) => setCgltBalance(Number(d.cglt_balance ?? 0)))
      .catch(() => {});
    const saved = localStorage.getItem('bsc_address');
    if (saved && !BLOCKED_ADDRESSES.has(saved.toLowerCase())) {
      setBscAddress(saved);
    } else if (saved) {
      localStorage.removeItem('bsc_address');
    }
    try {
      const hist = JSON.parse(localStorage.getItem('bsc_addresses_history') ?? '[]') as string[];
      const clean = hist.filter((a) => !BLOCKED_ADDRESSES.has(a.toLowerCase()));
      if (clean.length !== hist.length) localStorage.setItem('bsc_addresses_history', JSON.stringify(clean));
      setAddrHistory(clean);
    } catch { /* ignore */ }
  }, []);

  const amountNum    = Number(amount);
  const wcgltAmount  = amountNum >= CGLT_PER_WCGLT ? amountNum / CGLT_PER_WCGLT : 0;
  const grossUsdt    = wcgltAmount * WCGLT_PRICE_USD;
  const feeUsdt      = grossUsdt * PANCAKE_FEE_RATE;
  const netUsdt      = grossUsdt - feeUsdt;
  const overBudget   = cgltBalance !== null && amountNum > cgltBalance;
  const canSubmit    = amountNum >= CGLT_PER_WCGLT
    && amountNum % CGLT_PER_WCGLT === 0
    && !overBudget
    && /^0x[0-9a-fA-F]{40}$/.test(bscAddress);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTxHash('');
    setUsdtActual(null);

    if (amountNum < CGLT_PER_WCGLT) {
      setError(`Minimum ${CGLT_PER_WCGLT} CGLT (= 1 wCGLT).`);
      return;
    }
    if (amountNum % CGLT_PER_WCGLT !== 0) {
      setError(`Le montant doit être un multiple de ${CGLT_PER_WCGLT} CGLT.`);
      return;
    }
    if (overBudget) {
      setError(`Solde insuffisant. Disponible : ${cgltBalance} CGLT.`);
      return;
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(bscAddress)) {
      setError('Adresse BSC invalide (format 0x...).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/wcglt-to-usdt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cglt_amount: amountNum, bsc_recipient: bscAddress }),
      });
      const data = await res.json() as {
        error?: string;
        bsc_tx_hash?: string;
        usdt_received?: number;
        wcglt_swapped?: number;
      };
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Échange échoué'); return; }

      const hash = data.bsc_tx_hash ?? '';
      setTxHash(hash);
      setUsdtActual(data.usdt_received ?? netUsdt);
      setSuccess(`${(data.wcglt_swapped ?? wcgltAmount).toFixed(4)} wCGLT vendus sur BSC !`);
      setCgltBalance((b) => b !== null ? b - amountNum : b);
      setAmount('');

      setAddrHistory((prev) => {
        const next = [bscAddress, ...prev.filter((a) => a !== bscAddress)].slice(0, 3);
        localStorage.setItem('bsc_addresses_history', JSON.stringify(next));
        return next;
      });
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f172a]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-100 dark:border-slate-700">
        <Link href={`/${locale}/wallet/exchange`}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition">
          <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-slate-100">
          <TrendingDown className="text-emerald-500" size={20} />
          Vendre wCGLT → USDT
        </h1>
      </div>

      <div className="flex flex-col gap-4 px-4 py-5">

        {/* Info card */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white">
          <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wide mb-2">Taux estimé</p>
          <p className="text-2xl font-bold">1 wCGLT ≈ ${WCGLT_PRICE_USD}</p>
          <p className="text-emerald-200 text-sm mt-1">Swap via PancakeSwap BSC · frais 0.25%</p>
          <div className="mt-3 pt-3 border-t border-emerald-500/40 flex items-center justify-between">
            <p className="text-xs text-emerald-300">🔗 USDT livré sur BNB Chain (BSC)</p>
            <p className="text-xs text-emerald-300">{CGLT_PER_WCGLT} CGLT = 1 wCGLT</p>
          </div>
        </div>

        {/* Solde CGLT */}
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-emerald-700 dark:text-emerald-300">Solde CGLT disponible</span>
          <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
            {cgltBalance !== null ? fmt(cgltBalance) : '—'} CGLT
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Montant CGLT */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              Montant CGLT <span className="text-gray-400 font-normal">— min {CGLT_PER_WCGLT}, multiple de {CGLT_PER_WCGLT}</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              min={CGLT_PER_WCGLT}
              step={CGLT_PER_WCGLT}
              required
              className={`border rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${overBudget ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-slate-600 focus:ring-emerald-400'}`}
            />
            {overBudget && <p className="text-xs text-red-500">Solde insuffisant.</p>}
          </div>

          {/* Adresse BSC destinataire */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              Adresse BSC destinataire (MetaMask)
            </label>
            <input
              type="text"
              value={bscAddress}
              onChange={(e) => { setBscAddress(e.target.value); localStorage.setItem('bsc_address', e.target.value); }}
              placeholder="0x..."
              required
              className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base font-mono bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
            />
            {addrHistory.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                <p className="text-xs text-gray-400 dark:text-slate-500">Adresses récentes</p>
                <div className="flex flex-wrap gap-2">
                  {addrHistory.map((addr) => (
                    <button
                      key={addr}
                      type="button"
                      onClick={() => { setBscAddress(addr); localStorage.setItem('bsc_address', addr); }}
                      className="text-xs font-mono px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition truncate max-w-[160px]"
                      title={addr}
                    >
                      {addr.slice(0, 6)}…{addr.slice(-4)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Résumé */}
          {amountNum >= CGLT_PER_WCGLT && (
            <div className="rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-slate-400">
                <span>CGLT dépensés</span>
                <span>{fmt(amountNum)} CGLT</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-slate-400">
                <span>wCGLT swappés</span>
                <span>{wcgltAmount.toFixed(4)} wCGLT</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-slate-400">
                <span>Frais PancakeSwap (0.25%)</span>
                <span className="text-orange-500">-${feeUsdt.toFixed(4)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 dark:text-slate-100 pt-2 border-t border-gray-200 dark:border-slate-600 mt-1">
                <span>USDT estimés reçus</span>
                <span className="text-emerald-600">
                  ~${netUsdt.toFixed(4)} USDT
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-4 flex flex-col gap-2">
              <p className="text-sm text-green-800 dark:text-green-300 font-bold">✓ {success}</p>
              {usdtActual !== null && (
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  USDT reçus : <strong>${usdtActual.toFixed(4)}</strong>
                </p>
              )}
              {txHash && (
                <a
                  href={`https://bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <ExternalLink size={12} />
                  Voir sur BscScan : {txHash.slice(0, 20)}...
                </a>
              )}
              <Link href={`/${locale}/wallet`}
                className="text-xs text-gray-500 dark:text-slate-400 underline mt-1">
                Retour au wallet
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit || !!success}
            className="w-full h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-1"
          >
            {loading && <Spinner />}
            {loading ? 'Swap en cours…' : 'Vendre'}
          </button>
        </form>
      </div>
    </div>
  );
}
