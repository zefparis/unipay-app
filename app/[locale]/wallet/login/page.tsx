'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { normalizePhone } from '@/lib/phone';
import LanguageSwitcher from '@/components/LanguageSwitcher';

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletLoginPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [phone, setPhone] = useState('');
  const [pin, setPin]     = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (pin.length !== 6) { setError('Le PIN doit contenir 6 chiffres.'); return; }
    setLoading(true);

    const cleanPhone = normalizePhone(phone);

    try {
      const res = await fetch('/api/wallet/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Numéro ou PIN incorrect');
        return;
      }

      localStorage.setItem('wallet_phone', phone);
      router.refresh();
      router.push(`/${locale}/wallet`);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-200">
      <div className="flex justify-start px-4 pt-4">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 pb-safe">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#00A651] flex items-center justify-center shadow-lg">
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="16" stroke="white" strokeWidth="3" />
                <path d="M13 20 L20 27 L27 13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-[#f1f5f9]">Connexion</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Accédez à votre portefeuille UniPay</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-lg p-6 flex flex-col gap-5 border border-gray-100 dark:border-[#334155]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+243 XXX XXX XXX"
                  required
                  className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3.5 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A651] transition-all duration-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                  Code PIN <span className="text-gray-400 dark:text-slate-500 font-normal">{pin.length}/6</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  required
                  className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3.5 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00A651] tracking-widest text-center text-lg transition-all duration-200"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] bg-[#00A651] hover:bg-[#008f45] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading && <Spinner />}
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          </div>

          <p className="text-sm text-center text-gray-500 dark:text-slate-400 mt-6">
            Pas encore de compte ?{' '}
            <Link href={`/${locale}/wallet/register`} className="text-[#00A651] font-semibold hover:underline">
              Créer mon wallet
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
