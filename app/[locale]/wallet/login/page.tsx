'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { validatePhone } from '@/lib/phone';
import PhoneInput from '@/components/PhoneInput';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { wT } from '@/lib/i18n-wallet';

// Anti-cache: session-dependent page, must never be served statically/from cache
export const dynamic = 'force-dynamic';

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function LoginForm() {
  const router       = useRouter();
  const { locale }   = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const rawNext      = searchParams.get('next') ?? `/${locale}/wallet`;
  const next         = (rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('://'))
    ? rawNext
    : `/${locale}/wallet`;
  const tt           = wT(locale);

  const [phone,   setPhone]   = useState('+243');
  const [pin,     setPin]     = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('wallet_phone') : null;
    if (saved) setPhone(saved);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validatePhone(phone)) { setError(tt.err_phone_inv); return; }
    if (pin.length !== 6)      { setError(tt.err_pin_length);   return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/wallet/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? tt.login_err_def); return; }
      // PII: phone number stored in clear text for form pre-fill. Cleared on logout (see profile/page.tsx doLogout).
      localStorage.setItem('wallet_phone', phone);
      router.refresh();
      router.replace(next);
    } catch {
      setError(tt.err_network);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-200">
      <div className="flex justify-start px-4 pt-4">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-col items-center justify-center flex-1 px-6 py-8">
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{tt.login_title}</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{tt.login_sub}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">{tt.reg_phone_lbl}</label>
              <PhoneInput value={phone} onChange={setPhone} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">{tt.login_pin}</label>
              <input
                id="unipay-pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm outline-none focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/20 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] flex items-center justify-center gap-2 rounded-xl bg-[#00A651] text-white font-bold text-base shadow-md hover:bg-[#008f46] transition disabled:opacity-60"
            >
              {loading ? <><Spinner /> {tt.login_loading}</> : tt.reg_sign_in}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
            {tt.login_no_acct}{' '}
            <Link href={`/${locale}/wallet/register`} className="text-[#00A651] font-semibold hover:underline">
              {tt.reg_title}
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default function WalletLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
