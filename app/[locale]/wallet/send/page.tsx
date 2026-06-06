'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';

function fmt(n: number) { return new Intl.NumberFormat('fr-FR').format(n); }

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletSendPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [balance, setBalance]               = useState<number | null>(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount]                 = useState('');
  const [note, setNote]                     = useState('');
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');
  const [loading, setLoading]               = useState(false);
  const [showModal, setShowModal]           = useState(false);

  useEffect(() => {
    fetch('/api/wallet/balance')
      .then((r) => { if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; } return r.json(); })
      .then((d) => { if (d) setBalance(Number(d.balance_cdf ?? 0)); })
      .catch(() => {});
  }, []);

  const amountNum  = Number(amount);
  const overBudget = balance !== null && amountNum > 0 && amountNum > balance;

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (amountNum < 1) { setError('Montant invalide.'); return; }
    if (overBudget) { setError(`Solde insuffisant (${fmt(balance!)} CDF disponibles).`); return; }
    setShowModal(true);
  }

  async function confirmSend() {
    setShowModal(false);
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_phone: recipientPhone, amount: amountNum, note: note || undefined }),
      });
      const data = await res.json();
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Envoi échoué'); return; }

      const name = data.recipient_name ?? recipientPhone;
      setSuccess(`${fmt(amountNum)} CDF envoyés à ${name} avec succès.`);
      setTimeout(() => router.push(`/${locale}/wallet`), 3500);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-200">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50 dark:border-[#334155]">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200">
          <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-[#f1f5f9]">
          <ArrowLeftRight className="text-blue-500" size={20} />
          Envoyer de l&apos;argent
        </h1>
      </div>

      {balance !== null && (
        <div className="mx-4 mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-blue-700 dark:text-blue-400">Solde disponible</span>
          <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{fmt(balance)} CDF</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="flex flex-col gap-5 px-4 py-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Téléphone du destinataire</label>
          <input
            type="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="+243 XXX XXX XXX"
            required
            className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
          />
          <p className="text-xs text-gray-400 dark:text-slate-500">Le destinataire doit avoir un compte UniPay Wallet</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Montant (CDF)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1 000"
            min={1}
            required
            className={`border rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all duration-200 ${
              overBudget ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-slate-600 focus:ring-blue-400'
            }`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
            Note <span className="font-normal text-gray-400 dark:text-slate-500">(optionnel)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Remboursement, loyer…"
            maxLength={255}
            className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3">
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">✓ {success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !!success || overBudget}
          className="w-full h-[52px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2"
        >
          {loading && <Spinner />}
          {loading ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#1e293b] rounded-2xl p-6 flex flex-col gap-5 shadow-xl border border-gray-100 dark:border-[#334155]">
            <div className="flex flex-col gap-1 text-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-[#f1f5f9]">Confirmer l&apos;envoi</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Vérifiez les détails avant de confirmer</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Destinataire</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">{recipientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Montant</span>
                <span className="font-bold text-blue-600">{fmt(amountNum)} CDF</span>
              </div>
              {note && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Note</span>
                  <span className="text-gray-700 dark:text-slate-300 truncate max-w-[180px]">{note}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="py-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200"
              >
                Annuler
              </button>
              <button
                onClick={confirmSend}
                className="py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
