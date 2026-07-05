'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';
import { normalizePhone, validateDRCPhone } from '@/lib/phone';
import { wT } from '@/lib/i18n-wallet';

type Tab = 'cdf' | 'usdt';

function fmtCdf(n: number)  { return new Intl.NumberFormat('fr-FR').format(n); }
function fmtUsdt(n: number) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n); }

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletSendPage() {
  const router       = useRouter();
  const { locale }   = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const T            = wT(locale ?? 'fr');

  const [tab, setTab]                       = useState<Tab>('cdf');
  const [cdfBalance, setCdfBalance]         = useState<number | null>(null);
  const [usdtBalance, setUsdtBalance]       = useState<number | null>(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName]   = useState('');
  const [amount, setAmount]                 = useState('');
  const [note, setNote]                     = useState('');
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');
  const [loading, setLoading]               = useState(false);
  const [showModal, setShowModal]           = useState(false);

  /* ── Init tab from ?tab=usdt query param ────────────────────────────── */
  useEffect(() => {
    if (searchParams.get('tab') === 'usdt') setTab('usdt');
    const qPhone = searchParams.get('phone');
    const qName  = searchParams.get('name');
    if (qPhone) setRecipientPhone(qPhone);
    if (qName)  setRecipientName(qName);
  }, [searchParams]);

  /* ── Fetch both balances once ───────────────────────────────────────── */
  useEffect(() => {
    fetch('/api/wallet/balance')
      .then((r) => { if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; } return r.json(); })
      .then((d) => {
        if (d) {
          setCdfBalance(Number(d.balance_cdf  ?? 0));
          setUsdtBalance(Number(d.usdt_balance ?? 0));
        }
      })
      .catch(() => {});
  }, []);

  /* ── Reset form when switching tabs ────────────────────────────────── */
  function switchTab(t: Tab) {
    setTab(t);
    setAmount('');
    setNote('');
    setError('');
    setSuccess('');
    setShowModal(false);
  }

  const isCdf      = tab === 'cdf';
  const amountNum  = Number(amount) || 0;
  const activeBal  = isCdf ? cdfBalance : usdtBalance;
  const overBudget = activeBal !== null && amountNum > 0 && amountNum > activeBal;
  const minAmount  = isCdf ? 1 : 0.01;

  /* ── Validation + open modal ────────────────────────────────────────── */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validateDRCPhone(recipientPhone)) {
      setError(T.err_send_phone);
      return;
    }
    if (amountNum < minAmount) {
      setError(isCdf ? T.err_send_amount : T.err_usdt_min);
      return;
    }
    if (overBudget) {
      setError(
        isCdf
          ? T.err_send_budget.replace('{balance}', fmtCdf(cdfBalance!))
          : T.err_usdt_insuf.replace('{bal}', fmtUsdt(usdtBalance!)),
      );
      return;
    }
    setShowModal(true);
  }

  /* ── Confirm and call API ────────────────────────────────────────────── */
  async function confirmSend() {
    setShowModal(false);
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isCdf) {
        const res  = await fetch('/api/wallet/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient_phone: normalizePhone(recipientPhone), amount: amountNum, note: note || undefined }),
        });
        const data = await res.json();
        if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
        if (!res.ok) { setError(data.error ?? T.err_send_failed); return; }
        const name = data.recipient_name ?? recipientPhone;
        setSuccess(`${fmtCdf(amountNum)} ${T.send_success.replace('{name}', name)}`);
      } else {
        const res  = await fetch('/api/wallet/send-usdt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: normalizePhone(recipientPhone), amount: amountNum, note: note || undefined }),
        });
        const data = await res.json();
        if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
        if (!res.ok) {
          const map: Record<string, string> = {
            INSUFFICIENT_USDT:  T.err_usdt_insuf.replace('{bal}', fmtUsdt(usdtBalance ?? 0)),
            RECEIVER_NOT_FOUND: T.err_usdt_404,
          };
          setError(map[data.error] ?? data.error ?? T.err_usdt_failed);
          return;
        }
        const name = data.receiver_name ?? recipientPhone;
        setSuccess(`${fmtUsdt(data.amount_usdt ?? amountNum)} USDT ${T.send_success.replace('{name}', name)}`);
        if (typeof data.new_balance === 'number') setUsdtBalance(data.new_balance);
      }
      setAmount('');
      setNote('');
      setTimeout(() => router.push(`/${locale}/wallet`), 3500);
    } catch {
      setError(T.err_network);
    } finally {
      setLoading(false);
    }
  }

  /* ── Accent colours by tab ──────────────────────────────────────────── */
  const accent = isCdf ? 'blue' : 'emerald';
  const btnBg  = isCdf ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700';

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-200">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50 dark:border-[#334155]">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200">
          <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-[#f1f5f9]">
          <ArrowLeftRight className={`text-${accent}-500`} size={20} />
          {T.send_title}
        </h1>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-2 px-4 pt-4">
        <button type="button" onClick={() => switchTab('cdf')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${
            tab === 'cdf'
              ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
          CDF
        </button>
        <button type="button" onClick={() => switchTab('usdt')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${
            tab === 'usdt'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
          USDT
        </button>
      </div>

      {/* ── Balance card ───────────────────────────────────────────────── */}
      {activeBal !== null && (
        <div className={`mx-4 mt-4 border rounded-xl px-4 py-3 flex items-center justify-between ${
          isCdf
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'
        }`}>
          <span className={`text-sm ${isCdf ? 'text-blue-700 dark:text-blue-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {T.balance_avail}
          </span>
          <span className={`text-sm font-bold ${isCdf ? 'text-blue-700 dark:text-blue-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {isCdf ? fmtCdf(activeBal) : fmtUsdt(activeBal)} {isCdf ? 'CDF' : 'USDT'}
          </span>
        </div>
      )}

      {/* ── Form ───────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">

        {/* Recipient */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{T.send_recipient}</label>
          {recipientName && (
            <p className="text-xs font-medium text-[#00A651] -mb-1">{recipientName}</p>
          )}
          <input type="tel" value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="+243 XXX XXX XXX" required
            className={`border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-${accent}-400 transition-all duration-200`}
          />
          <p className="text-xs text-gray-500 dark:text-slate-500">{T.send_rec_hint}</p>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
            {isCdf ? T.send_amount : T.usdt_amount}
          </label>
          <input type="number" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={isCdf ? '1 000' : '0.00'}
            min={minAmount} step={isCdf ? '1' : '0.01'} required
            className={`border rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all duration-200 ${
              overBudget ? 'border-red-400 focus:ring-red-300' : `border-gray-200 dark:border-slate-600 focus:ring-${accent}-400`
            }`}
          />
          {overBudget && <p className="text-xs text-red-500">Solde insuffisant.</p>}
        </div>

        {/* USDT fee indicator */}
        {!isCdf && amountNum > 0 && (
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-500 dark:text-slate-400">{T.usdt_you_send}</span>
            <span className="font-semibold text-gray-800 dark:text-slate-200">
              {fmtUsdt(amountNum)} USDT — <span className="text-emerald-500">{T.usdt_free}</span>
            </span>
          </div>
        )}

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
            {T.send_note} <span className="font-normal text-gray-500 dark:text-slate-500">{T.optional}</span>
          </label>
          <input type="text" value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Remboursement, loyer…" maxLength={255}
            className={`border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-${accent}-400 transition-all duration-200`}
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3">
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">✓ {success}</p>
          </div>
        )}

        <button type="submit"
          disabled={loading || !!success || overBudget}
          className={`w-full h-[52px] ${btnBg} text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2`}
        >
          {loading && <Spinner />}
          {loading ? T.send_loading : T.send_cta}
        </button>
      </form>

      {/* ── Confirmation modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setShowModal(false)}>
          <div className="w-full sm:max-w-sm max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1e293b] rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-[#334155]"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-center">
                <h2 className="text-lg font-bold text-gray-900 dark:text-[#f1f5f9]">{T.send_modal_title}</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">{T.send_modal_sub}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">{T.send_lbl_to}</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{recipientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">{T.send_lbl_amount}</span>
                  <span className={`font-bold text-${accent}-600`}>
                    {isCdf ? fmtCdf(amountNum) : fmtUsdt(amountNum)} {isCdf ? 'CDF' : 'USDT'}
                  </span>
                </div>
                {!isCdf && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">{T.usdt_fee_lbl}</span>
                    <span className="font-medium text-emerald-500">{T.usdt_free}</span>
                  </div>
                )}
                {note && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">{T.send_lbl_note}</span>
                    <span className="text-gray-700 dark:text-slate-300 truncate min-w-0 flex-1 text-right">{note}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 grid grid-cols-2 gap-3 px-6 pt-3 bg-white dark:bg-[#1e293b] border-t border-gray-100 dark:border-[#334155] rounded-b-2xl"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
              <button onClick={() => setShowModal(false)}
                className="py-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200">
                {T.cancel}
              </button>
              <button onClick={confirmSend}
                className={`py-3 rounded-xl ${btnBg} text-white font-semibold text-sm transition`}>
                {T.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
