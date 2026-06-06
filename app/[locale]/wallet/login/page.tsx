'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { normalizePhone } from '@/lib/phone';

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
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-12">

        <div className="w-full max-w-sm flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-[#00A651] flex items-center justify-center mb-1">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="16" stroke="white" strokeWidth="3" />
                <path d="M13 20 L20 27 L27 13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
            <p className="text-sm text-gray-500 text-center">Accédez à votre portefeuille UniPay</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-600">Numéro de téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+243 XXX XXX XXX"
                required
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-600">
                Code PIN
                <span className="text-gray-400 font-normal ml-1">{pin.length}/6</span>
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                maxLength={6}
                required
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651] tracking-widest text-center text-lg"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00A651] hover:bg-[#008f45] text-white font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Spinner />}
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500">
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
