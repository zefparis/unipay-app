'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function LandingPage() {
  const { locale } = useParams<{ locale: string }>();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 bg-white">
      <div className="flex flex-col items-center gap-10 max-w-sm w-full">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-[#00A651] flex items-center justify-center shadow-lg">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="16" stroke="white" strokeWidth="3" />
              <path d="M13 20 L20 27 L27 13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">UniPay Congo</h1>
            <p className="text-xs font-semibold text-[#00A651] tracking-widest uppercase mt-0.5">Wallet B2C</p>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-center text-gray-500 text-lg leading-relaxed">
          Envoyez et recevez de l&apos;argent facilement
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 w-full">
          <Link
            href={`/${locale}/wallet/register`}
            className="w-full bg-[#00A651] hover:bg-[#008f45] active:scale-95 text-white font-semibold py-4 rounded-xl text-center transition text-base shadow-sm"
          >
            Créer mon wallet
          </Link>
          <Link
            href={`/${locale}/wallet/login`}
            className="w-full border-2 border-gray-200 hover:bg-gray-50 active:scale-95 text-gray-700 font-semibold py-4 rounded-xl text-center transition text-base"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-300 text-center">
          © 2026 UniPay Congo · Congo Gaming Limited S.a.r.l
        </p>
      </div>
    </main>
  );
}
