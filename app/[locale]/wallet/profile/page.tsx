'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Phone, LogOut, ShieldCheck, Wallet } from 'lucide-react';

interface WalletInfo {
  wallet_id: string;
  phone: string;
  full_name: string | null;
  balance_cdf: number;
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletProfilePage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [info, setInfo]         = useState<WalletInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/wallet/balance')
      .then((r) => {
        if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; }
        return r.json();
      })
      .then((d) => { if (d) setInfo(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/wallet/auth/logout', { method: 'POST' });
    router.replace(`/${locale}/wallet/login`);
  }

  const phone = typeof window !== 'undefined' ? localStorage.getItem('wallet_phone') ?? info?.phone : info?.phone;

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Mon profil</h1>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-4 px-4 pt-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 pb-4">
            <div className="w-20 h-20 rounded-full bg-[#00A651]/10 flex items-center justify-center">
              <User size={36} className="text-[#00A651]" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">
                {info?.full_name ?? 'Utilisateur'}
              </p>
              <p className="text-sm text-gray-400">{phone ?? '—'}</p>
            </div>
          </div>

          {/* Info card */}
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Phone size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Numéro de téléphone</p>
                <p className="text-sm font-semibold text-gray-800">{phone ?? '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <Wallet size={16} className="text-[#00A651]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Solde</p>
                <p className="text-sm font-semibold text-gray-800">
                  {info ? new Intl.NumberFormat('fr-FR').format(info.balance_cdf) + ' CDF' : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} className="text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">ID Wallet</p>
                <p className="text-xs font-mono text-gray-600 break-all">{info?.wallet_id ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center justify-center gap-2 w-full mt-2 px-4 py-3.5 rounded-2xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition disabled:opacity-50"
          >
            {loggingOut ? <Spinner /> : <LogOut size={18} />}
            {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      )}
    </div>
  );
}
