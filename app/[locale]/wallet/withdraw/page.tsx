'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpCircle } from 'lucide-react';
import { normalizePhone, validateDRCPhone } from '@/lib/phone';
import type { WalletBalance } from '@/lib/wallet-types';
import { wT, type WalletDict } from '@/lib/i18n-wallet';

const CDF_OPERATORS = [
  { key: 'orange',     label: 'Orange Money', color: 'bg-orange-500', active: 'ring-orange-500' },
  { key: 'airtel',    label: 'Airtel Money',  color: 'bg-red-500',    active: 'ring-red-500'    },
  { key: 'afrimoney', label: 'Afrimoney',     color: 'bg-blue-600',   active: 'ring-blue-600'   },
] as const;

const USD_OPERATORS = [
  { key: 'airtel',   label: 'Airtel USD',   color: 'bg-red-500',    active: 'ring-red-500'    },
  { key: 'africell', label: 'Africell USD', color: 'bg-yellow-500', active: 'ring-yellow-500' },
  { key: 'orange',   label: 'Orange USD',   color: 'bg-orange-500', active: 'ring-orange-500' },
] as const;

const FEE_RATE       = 0.03;
const MIN_CDF_AMOUNT = 100;
const MIN_USD_AMOUNT = 1;
const MIN_CGLT_AMOUNT  = 500;
const CGLT_PER_WCGLT   = 500;
const WCGLT_PRICE_USD  = 0.109;

type Tab = 'cdf' | 'usd' | 'cglt' | 'usdt';
type Network = 'BSC' | 'TRC20' | 'ERC20';

const NETWORK_FEE: Record<Network, number> = { BSC: 0.5, TRC20: 1, ERC20: 5 };
const NETWORK_ENABLED: Record<Network, boolean> = { BSC: true, TRC20: false, ERC20: false };
const MIN_NET_USDT = 5;

function fmt(n: number, max = 0) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: max }).format(n); }

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletWithdrawPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const T = wT(locale ?? 'fr');

  const [tab, setTab]                 = useState<Tab>('cdf');
  const [balance, setBalance]         = useState<number | null>(null);
  const [usdBalance, setUsdBalance]   = useState<number | null>(null);
  const [cgltBalance, setCgltBalance] = useState<number | null>(null);
  const [operator, setOperator]       = useState<string>('orange');
  const [phone, setPhone]             = useState('');
  const [amount, setAmount]           = useState('');
  const [bscAddress, setBscAddress]   = useState('');
  const [usdtBalance, setUsdtBalance] = useState<number | null>(null);
  const [network, setNetwork]         = useState<Network>('BSC');
  const [destAddress, setDestAddress] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [withdrawalId, setWithdrawalId] = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('wallet_phone');
    if (saved) setPhone(saved);

    fetch('/api/wallet/balance')
      .then((r) => { if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; } return r.json(); })
      .then((d: WalletBalance | null) => { if (d) { setBalance(Number(d.balance_cdf ?? 0)); setUsdBalance(Number(d.usd_balance ?? 0)); setUsdtBalance(Number(d.usdt_balance ?? 0)); } })
      .catch(() => {});

    fetch('/api/wallet/cglt/balance')
      .then((r) => r.json())
      .then((d: { cglt_balance?: number }) => setCgltBalance(Number(d.cglt_balance ?? 0)))
      .catch(() => {});
  }, []);

  const isCdf  = tab === 'cdf';
  const isUsd  = tab === 'usd';
  const isCglt = tab === 'cglt';
  const isUsdt = tab === 'usdt';

  const operators  = isCdf ? CDF_OPERATORS : USD_OPERATORS;
  const minAmt     = isCdf ? MIN_CDF_AMOUNT : isUsd ? MIN_USD_AMOUNT : MIN_CGLT_AMOUNT;
  const amountNum  = Number(amount);
  const fee        = isCglt ? 0 : amountNum > 0 ? Math.round(amountNum * FEE_RATE * 100) / 100 : 0;
  const totalCost  = amountNum > 0 ? Math.round((amountNum + fee) * 100) / 100 : 0;
  const activeBal  = isCdf ? balance : isUsd ? usdBalance : isCglt ? cgltBalance : usdtBalance;
  const overBudget = activeBal !== null && amountNum > 0 && amountNum > activeBal;

  const netFee        = NETWORK_FEE[network];
  const usdtGross     = Number(amount) || 0;
  const usdtNet       = Math.max(usdtGross - netFee, 0);
  const usdtCanSubmit = usdtNet >= MIN_NET_USDT && usdtGross > 0
    && (usdtBalance !== null ? usdtGross <= usdtBalance : true)
    && (/^0x[a-fA-F0-9]{40}$/.test(destAddress) || /^T[a-zA-Z0-9]{33}$/.test(destAddress));
  const usdtAddrValid = destAddress === ''
    || (network === 'TRC20' ? /^T[a-zA-Z0-9]{33}$/.test(destAddress) : /^0x[a-fA-F0-9]{40}$/.test(destAddress));

  function switchTab(t: Tab) {
    setTab(t);
    setAmount('');
    setError('');
    setSuccess('');
    setWithdrawalId('');
    setShowConfirm(false);
    setOperator(t === 'cdf' ? 'orange' : 'airtel');
  }

  async function handleUsdtWithdraw() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/crypto-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: usdtGross, network, destination_address: destAddress }),
      });
      const data = await res.json() as { error?: string; withdrawal_id?: string; net_amount?: number; fee?: number };
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Retrait USDT échoué'); return; }
      setWithdrawalId(data.withdrawal_id ?? '');
      setSuccess(`Retrait de ${usdtGross} USDT initié. Vous recevrez ~${(data.net_amount ?? usdtNet).toFixed(4)} USDT sur ${network}.`);
      setUsdtBalance((b) => b !== null ? Math.max(b - usdtGross, 0) : b);
      setAmount('');
      setDestAddress('');
      setTimeout(() => router.push(`/${locale}/wallet`), 6000);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isUsdt) {
      if (!usdtAddrValid || destAddress === '') { setError(`Adresse ${network} invalide.`); return; }
      if (usdtNet < MIN_NET_USDT) { setError(`Montant insuffisant. Minimum ${MIN_NET_USDT} USDT net (après frais ${netFee} USDT).`); return; }
      if (usdtBalance !== null && usdtGross > usdtBalance) { setError(`Solde USDT insuffisant. Disponible : ${usdtBalance.toFixed(4)} USDT.`); return; }
      setShowConfirm(true);
      return;
    }

    if (isCglt) {
      if (amountNum < 500) { setError(T.err_wd_cglt_min); return; }
      if (overBudget) { setError(`Solde CGLT insuffisant. Disponible : ${cgltBalance} CGLT.`); return; }
      if (!/^0x[0-9a-fA-F]{40}$/.test(bscAddress)) { setError(T.err_wd_bsc); return; }
      setLoading(true);
      try {
        const res = await fetch('/api/wallet/cglt/withdraw-bsc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amountNum, bsc_address: bscAddress }),
        });
        const data = await res.json();
        if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
        if (!res.ok) { setError(data.error ?? T.err_wd_cglt_failed); return; }
        setSuccess(`${amountNum} wCGLT envoyés sur BSC. Tx: ${String(data.bsc_tx_hash ?? '').slice(0, 14)}...`);
        setTimeout(() => router.push(`/${locale}/wallet`), 5000);
      } catch {
        setError('Erreur réseau, réessayez.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!operator) { setError(T.err_wd_op); return; }
    if (!validateDRCPhone(phone)) {
      setError('Numéro invalide. Format : 09XXXXXXXX ou +243 9X XXX XXXX');
      return;
    }
    if (amountNum < minAmt) { setError(`Montant minimum : ${isCdf ? fmt(minAmt) : minAmt} ${isCdf ? 'CDF' : 'USD'}.`); return; }
    if (overBudget) { setError(`Solde insuffisant. Coût total (montant + frais) : ${isCdf ? fmt(totalCost) : totalCost.toFixed(2)} ${isCdf ? 'CDF' : 'USD'}.`); return; }
    setLoading(true);

    try {
      let res: Response;
      if (isCdf) {
        res = await fetch('/api/wallet/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operator, phone_mm: normalizePhone(phone), amount: amountNum }),
        });
        const data = await res.json();
        if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
        if (!res.ok) { setError(data.error ?? 'Retrait échoué'); return; }
        setSuccess(`Retrait de ${fmt(amountNum)} CDF initié. Vous recevrez ${fmt(amountNum - fee)} CDF sur votre compte ${operator}.`);
        setTimeout(() => router.push(`/${locale}/wallet`), 5000);
      } else {
        res = await fetch('/api/wallet/unipesa/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: normalizePhone(phone), operator, amount: amountNum }),
        });
        const data = await res.json();
        if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
        if (!res.ok) { setError(data.error ?? 'Retrait USD échoué'); return; }
        setSuccess(`Retrait de ${amountNum.toFixed(2)} USD initié. ${totalCost.toFixed(2)} USD débités, vous recevrez ${amountNum.toFixed(2)} USD sur votre compte ${operator}.`);
        setTimeout(() => router.push(`/${locale}/wallet`), 5000);
      }
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-white dark:bg-[#0f172a] transition-colors duration-200">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50 dark:border-[#334155]">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200">
          <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-[#f1f5f9]">
          <ArrowUpCircle className="text-orange-500" size={20} />
          {T.wd_title}
        </h1>
      </div>

      {/* Currency tabs */}
      <div className="flex gap-1.5 px-4 pt-4 flex-wrap">
        <button type="button" onClick={() => switchTab('cdf')}
          className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'cdf' ? 'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          CDF
        </button>
        <button type="button" onClick={() => switchTab('usd')}
          className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'usd' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          USD
        </button>
        <button type="button" onClick={() => switchTab('cglt')}
          className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'cglt' ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          CGLT
        </button>
        <button type="button" onClick={() => switchTab('usdt')}
          className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'usdt' ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          USDT
        </button>
      </div>

      {activeBal !== null && (
        <div className={`mx-4 mt-4 border rounded-xl px-4 py-3 flex items-center justify-between ${isUsdt ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800'}`}>
          <span className={`text-sm ${isUsdt ? 'text-cyan-700 dark:text-cyan-400' : 'text-orange-700 dark:text-orange-400'}`}>
            {T.wd_avail.replace('{cur}', isCdf ? 'CDF' : isUsd ? 'USD' : isCglt ? 'CGLT' : 'USDT')}
          </span>
          <span className={`text-sm font-bold ${isUsdt ? 'text-cyan-700 dark:text-cyan-400' : 'text-orange-700 dark:text-orange-400'}`}>
            {isCdf ? fmt(activeBal) : isUsd ? activeBal.toFixed(2) : isCglt ? fmt(activeBal) : activeBal.toFixed(4)} {isCdf ? 'CDF' : isUsd ? 'USD' : isCglt ? 'CGLT' : 'USDT'}
          </span>
        </div>
      )}

      {isCglt && (
        <div className="mx-4 mt-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl px-4 py-3 flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-purple-700 dark:text-purple-300">{T.wd_cglt_rate}</span>
            <span className="font-bold text-purple-800 dark:text-purple-200">{CGLT_PER_WCGLT} CGLT = 1 wCGLT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-purple-700 dark:text-purple-300">{T.wd_cglt_value}</span>
            <span className="font-bold text-purple-800 dark:text-purple-200">~${WCGLT_PRICE_USD}</span>
          </div>
          {amountNum >= 500 && (
            <div className="border-t border-purple-200 dark:border-purple-700 pt-2 flex justify-between text-sm">
              <span className="text-purple-700 dark:text-purple-300">{T.wd_cglt_receive}</span>
              <span className="font-bold text-purple-800 dark:text-purple-200">
                {(amountNum / CGLT_PER_WCGLT).toFixed(4)} wCGLT (~${((amountNum / CGLT_PER_WCGLT) * WCGLT_PRICE_USD).toFixed(3)})
              </span>
            </div>
          )}
          <p className="text-xs text-purple-500 dark:text-purple-400">{T.wd_cglt_bsc}</p>
        </div>
      )}

      {/* USDT Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 sm:p-4" onClick={() => setShowConfirm(false)}>
          <div
            className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1e293b] rounded-t-2xl sm:rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-[#f1f5f9] mb-4">Confirmer le retrait</h2>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Montant envoyé</span>
                  <span className="font-bold text-gray-900 dark:text-slate-100">{usdtGross.toFixed(4)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Frais réseau ({network})</span>
                  <span className="text-orange-500 font-medium">−{netFee} USDT</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 dark:border-slate-700 pt-2 mt-1">
                  <span className="font-bold text-gray-800 dark:text-slate-200">Vous recevez</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">{usdtNet.toFixed(4)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Réseau</span>
                  <span className="font-mono text-xs text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{network}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-500 dark:text-slate-400 flex-shrink-0">Adresse</span>
                  <span className="font-mono text-xs text-gray-700 dark:text-slate-300 break-all text-right">{destAddress.slice(0, 10)}…{destAddress.slice(-8)}</span>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Pour une nouvelle adresse, le premier retrait peut prendre 24–48h (vérification sécurité Binance).
              </div>
            </div>
            <div
              className="sticky bottom-0 flex gap-3 px-6 pt-3 bg-white dark:bg-[#1e293b] border-t border-gray-100 dark:border-[#334155] rounded-b-2xl"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
            >
              <button type="button" onClick={() => setShowConfirm(false)}
                className="flex-1 h-[48px] rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-semibold">
                Annuler
              </button>
              <button type="button" onClick={handleUsdtWithdraw} disabled={loading}
                className="flex-1 h-[48px] rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <Spinner />}
                {loading ? 'Envoi…' : 'Confirmer le retrait'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">

        {isUsdt && (
          <div className="flex flex-col gap-4">
            {/* Network selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Réseau de destination</label>
              <div className="flex gap-2">
                {(['BSC', 'TRC20', 'ERC20'] as Network[]).map((net) => {
                  const enabled = NETWORK_ENABLED[net];
                  return (
                    <button key={net} type="button"
                      disabled={!enabled}
                      onClick={() => { if (enabled) { setNetwork(net); setDestAddress(''); setError(''); } }}
                      className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border-2 text-xs font-bold transition ${
                        !enabled
                          ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-gray-300 dark:text-slate-600 cursor-not-allowed'
                          : network === net
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'
                            : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                      }`}>
                      {net}
                      <span className="text-[10px] font-normal mt-0.5">
                        {enabled ? `Frais ${NETWORK_FEE[net]} USDT` : 'Bientôt dispo'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Destination address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                Adresse BSC <span className="text-gray-400 font-normal">(commence par 0x)</span>
              </label>
              <input type="text" value={destAddress}
                onChange={(e) => setDestAddress(e.target.value)}
                placeholder="0x..."
                required
                className={`w-full border rounded-xl px-4 py-3 text-sm font-mono bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all break-all ${
                  !usdtAddrValid ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-slate-600 focus:ring-cyan-400'
                }`} />
              {!usdtAddrValid && destAddress !== '' && (
                <p className="text-xs text-red-500">Adresse BSC invalide (doit commencer par 0x, 42 caractères).</p>
              )}
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                Montant USDT <span className="text-gray-400 font-normal">— min {MIN_NET_USDT + netFee} USDT brut</span>
              </label>
              <input type="number" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={(MIN_NET_USDT + netFee).toFixed(1)}
                min={MIN_NET_USDT + netFee} step="0.01" required
                className={`w-full border rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${
                  (usdtBalance !== null && usdtGross > usdtBalance) ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-slate-600 focus:ring-cyan-400'
                }`} />
              {usdtBalance !== null && usdtGross > usdtBalance && (
                <p className="text-xs text-red-500">Solde insuffisant.</p>
              )}
            </div>

            {/* Summary */}
            {usdtGross > 0 && (
              <div className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-600 rounded-xl px-4 py-3 flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-slate-400">
                  <span>Montant brut</span><span>{usdtGross.toFixed(4)} USDT</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-slate-400">
                  <span>Frais réseau {network}</span><span className="text-orange-500">−{netFee} USDT</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 dark:text-slate-200 pt-1 border-t border-gray-200 dark:border-slate-600 mt-1">
                  <span>Vous recevez</span>
                  <span className={usdtNet < MIN_NET_USDT ? 'text-red-500' : 'text-cyan-600 dark:text-cyan-400'}>
                    {usdtNet.toFixed(4)} USDT
                    {usdtNet < MIN_NET_USDT && <span className="text-xs font-normal ml-1">(min {MIN_NET_USDT})</span>}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {!isCglt && !isUsdt && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{T.wd_operator}</label>
            <div className="flex flex-wrap gap-2">
              {operators.map((op) => (
                <button key={op.key} type="button" onClick={() => setOperator(op.key)}
                  className={`flex-1 min-w-[90px] py-3 rounded-xl border-2 text-white text-xs font-bold transition ${op.color} ${operator === op.key ? `ring-2 ring-offset-2 ${op.active} opacity-100` : 'opacity-60 hover:opacity-80'}`}>
                  {op.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isCglt && !isUsdt && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{T.wd_phone}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+243 XXX XXX XXX" required
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200" />
          </div>
        )}

        {isCglt && !isUsdt && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{T.wd_bsc}</label>
            <input type="text" value={bscAddress} onChange={(e) => setBscAddress(e.target.value)}
              placeholder="0x..." required
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base font-mono bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all break-all" />
          </div>
        )}

        {!isUsdt && <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
            Montant ({isCdf ? 'CDF' : isUsd ? 'USD' : 'CGLT'}) <span className="text-gray-400 font-normal">— min {isCdf ? fmt(minAmt) : minAmt} {isCdf ? 'CDF' : isUsd ? 'USD' : 'CGLT'}</span>
          </label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder={isCdf ? '100' : isUsd ? '10.00' : '10'} min={minAmt} step={isCdf ? '1' : isUsd ? '0.01' : '1'} required
            className={`w-full border rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all duration-200 ${overBudget ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-slate-600 focus:ring-orange-400'}`} />
          {overBudget && <p className="text-xs text-red-500">Solde insuffisant.</p>}
        </div>}

        {amountNum >= minAmt && !isCglt && !isUsdt && (
          <div className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-600 rounded-xl px-4 py-3 flex flex-col gap-1.5 text-sm">
            {isCdf ? (
              <>
                <div className="flex justify-between text-gray-500 dark:text-slate-400"><span>{T.fee_pct}</span><span>−{fmt(fee)} CDF</span></div>
                <div className="flex justify-between text-gray-500 dark:text-slate-400"><span>{T.wd_total}</span><span>{fmt(totalCost)} CDF</span></div>
                <div className="flex justify-between font-bold text-gray-800 dark:text-slate-200 pt-1 border-t border-gray-200 dark:border-slate-600 mt-1"><span>{T.you_receive}</span><span className="text-orange-500">{fmt(amountNum - fee)} CDF</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-gray-500 dark:text-slate-400"><span>{T.wd_you_send}</span><span>{amountNum.toFixed(2)} USD</span></div>
                <div className="flex justify-between text-gray-500 dark:text-slate-400"><span>{T.fee_pct}</span><span>+{fee.toFixed(2)} USD</span></div>
                <div className="flex justify-between font-bold text-gray-800 dark:text-slate-200 pt-1 border-t border-gray-200 dark:border-slate-600 mt-1"><span>{T.wd_total}</span><span className="text-orange-500">{totalCost.toFixed(2)} USD</span></div>
              </>
            )}
          </div>
        )}


        {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3 flex flex-col gap-1">
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">✓ {success}</p>
            {withdrawalId && (
              <p className="text-xs text-green-600 dark:text-green-400 font-mono">ID : {withdrawalId}</p>
            )}
          </div>
        )}

        <button type="submit"
          disabled={loading || !!success || (isUsdt ? !usdtCanSubmit : overBudget)}
          className={`w-full h-[52px] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2 ${
            isUsdt ? 'bg-cyan-600 hover:bg-cyan-700' : isCglt ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-500 hover:bg-orange-600'
          }`}>
          {loading && <Spinner />}
          {loading ? T.wd_processing : isUsdt ? 'Retirer USDT' : isCglt ? T.wd_cta_cglt : T.wd_cta}
        </button>
      </form>
    </div>
  );
}