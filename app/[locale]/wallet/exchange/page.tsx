'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRightLeft, ExternalLink } from 'lucide-react';

const CGLT_PER_WCGLT  = 500;
const WCGLT_PRICE_USD = 0.109;

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

export default function ExchangePage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();

  const [cgltBalance, setCgltBalance] = useState<number | null>(null);
  const [amount, setAmount]           = useState('');
  const [bscAddress, setBscAddress]   = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [txHash, setTxHash]           = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    fetch('/api/wallet/cglt/balance')
      .then((r) => r.json())
      .then((d: { cglt_balance?: number }) => setCgltBalance(Number(d.cglt_balance ?? 0)))
      .catch(() => {});
  }, []);

  const amountNum   = Number(amount);
  const wCGLTAmount = amountNum >= CGLT_PER_WCGLT ? amountNum / CGLT_PER_WCGLT : 0;
  const usdValue    = wCGLTAmount * WCGLT_PRICE_USD;
  const overBudget  = cgltBalance !== null && amountNum > cgltBalance;
  const canSubmit   = amountNum >= CGLT_PER_WCGLT && !overBudget && /^0x[0-9a-fA-F]{40}$/.test(bscAddress);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTxHash('');

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
      const res = await fetch('/api/wallet/cglt/withdraw-bsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountNum, bsc_address: bscAddress }),
      });
      const data = await res.json() as { error?: string; bsc_tx_hash?: string; wcglt_amount?: number };
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Échange échoué'); return; }
      const hash = data.bsc_tx_hash ?? '';
      setTxHash(hash);
      setSuccess(`${(data.wcglt_amount ?? wCGLTAmount).toFixed(4)} wCGLT reçus sur BSC !`);
      setCgltBalance((b) => b !== null ? b - amountNum : b);
      setAmount('');
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
        <Link href={`/${locale}/wallet/swap`}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition">
          <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-slate-100">
          <ArrowRightLeft className="text-purple-500" size={20} />
          Échanger CGLT → wCGLT
        </h1>
      </div>

      <div className="flex flex-col gap-4 px-4 py-5">

        {/* Info card */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-5 text-white">
          <p className="text-purple-200 text-xs font-semibold uppercase tracking-wide mb-2">Taux de conversion</p>
          <p className="text-2xl font-bold">{CGLT_PER_WCGLT} CGLT = 1 wCGLT</p>
          <p className="text-purple-200 text-sm mt-1">Valeur marchée ~${WCGLT_PRICE_USD} / wCGLT</p>
          <div className="mt-3 pt-3 border-t border-purple-500/40 flex items-center justify-between">
            <p className="text-xs text-purple-300">🔗 Livré sur BNB Chain (BSC)</p>
            <p className="text-xs text-purple-300">Frais bridge : 0</p>
          </div>
        </div>

        {/* Solde CGLT */}
        <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-purple-700 dark:text-purple-300">Solde CGLT disponible</span>
          <span className="text-sm font-bold text-purple-800 dark:text-purple-200">
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
              className={`border rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${overBudget ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-slate-600 focus:ring-purple-400'}`}
            />
            {overBudget && <p className="text-xs text-red-500">Solde insuffisant.</p>}
          </div>

          {/* Adresse BSC */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              Adresse BSC (MetaMask)
            </label>
            <input
              type="text"
              value={bscAddress}
              onChange={(e) => setBscAddress(e.target.value)}
              placeholder="0x..."
              required
              className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base font-mono bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
            />
          </div>

          {/* Résumé */}
          {amountNum >= CGLT_PER_WCGLT && (
            <div className="rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-slate-400">
                <span>Vous dépensez</span>
                <span>{fmt(amountNum)} CGLT</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-slate-400">
                <span>Frais bridge</span>
                <span className="text-emerald-600 font-medium">Gratuit</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 dark:text-slate-100 pt-2 border-t border-gray-200 dark:border-slate-600 mt-1">
                <span>Vous recevez</span>
                <span className="text-purple-600">
                  {wCGLTAmount.toFixed(4)} wCGLT
                  <span className="text-gray-400 dark:text-slate-500 font-normal text-xs ml-1">(~${usdValue.toFixed(3)})</span>
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-4 flex flex-col gap-2">
              <p className="text-sm text-green-800 dark:text-green-300 font-bold">✓ {success}</p>
              {txHash && (
                <a
                  href={`https://bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline"
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
            className="w-full h-[52px] bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-1"
          >
            {loading && <Spinner />}
            {loading ? 'Échange en cours…' : 'Échanger'}
          </button>
        </form>
      </div>
    </div>
  );
}
