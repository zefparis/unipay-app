'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function WalletRegisterPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const T = wT(locale);

  const [fullName, setFullName]     = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('+243');
  const [pin, setPin]               = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validatePhone(phone)) { setError(T.err_phone_inv);  return; }
    if (pin.length !== 6)      { setError(T.err_pin_length); return; }
    if (pin !== pinConfirm)    { setError(T.err_pin_match);  return; }

    setLoading(true);

    try {
      const res = await fetch('/api/wallet/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, full_name: fullName || undefined, pin, email: email.trim() || undefined, lang: locale === 'en' ? 'en' : 'fr' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? T.err_reg_failed);
        return;
      }

      localStorage.setItem('wallet_phone', phone);
      router.push(`/${locale}/wallet/login`);
    } catch {
      setError(T.err_network);
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-[#f1f5f9]">{T.reg_title}</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{T.reg_subtitle}</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-lg p-6 flex flex-col gap-4 border border-gray-100 dark:border-[#334155]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                  {T.reg_name_lbl} <span className="text-gray-500 dark:text-slate-500 font-normal">{T.optional}</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jean Dupont"
                  maxLength={100}
                  className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3.5 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A651] transition-all duration-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                  {T.reg_email_lbl} <span className="text-gray-500 dark:text-slate-500 font-normal">{T.optional}</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean@email.com"
                  maxLength={254}
                  autoComplete="email"
                  className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3.5 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A651] transition-all duration-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{T.reg_phone_lbl}</label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                  {T.reg_pin_lbl} <span className="text-gray-500 dark:text-slate-500 font-normal">{pin.length}/6</span>
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

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                  {T.reg_pin_confirm} <span className="text-gray-500 dark:text-slate-500 font-normal">{pinConfirm.length}/6</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  required
                  className={`border rounded-xl px-4 py-3.5 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 tracking-widest text-center text-lg transition-all duration-200 ${
                    pinConfirm.length === 6 && pinConfirm !== pin
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-gray-200 dark:border-slate-600 focus:ring-[#00A651]'
                  }`}
                />
                {pinConfirm.length === 6 && pinConfirm !== pin && (
                  <p className="text-xs text-red-500">{T.reg_pin_mismatch}</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>
              )}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: '#00A651' }}
                />
                <label htmlFor="accept-terms" className="text-sm leading-snug text-gray-500 dark:text-slate-400 cursor-pointer select-none">
                  {locale === 'en' ? (
                    <>I have read and accept the{' '}
                      <a href={`/${locale}/terms`} target="_blank" className="font-semibold underline" style={{ color: '#00A651' }}>Terms of Service</a>
                    </>
                  ) : (
                    <>J&apos;ai lu et j&apos;accepte les{' '}
                      <a href={`/${locale}/terms`} target="_blank" className="font-semibold underline" style={{ color: '#00A651' }}>Conditions Générales d&apos;Utilisation</a>
                    </>
                  )}
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !acceptedTerms}
                title={!acceptedTerms ? (locale === 'en' ? 'You must accept the Terms of Service to continue' : 'Vous devez accepter les CGU pour continuer') : undefined}
                className="w-full h-[52px] bg-[#00A651] hover:bg-[#008f45] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {loading && <Spinner />}
                {loading ? T.reg_loading : T.reg_cta}
              </button>
            </form>
          </div>

          <p className="text-sm text-center text-gray-500 dark:text-slate-400 mt-6">
            {T.reg_have_acct}{' '}
            <Link href={`/${locale}/wallet/login`} className="text-[#00A651] font-semibold hover:underline">
              {T.reg_sign_in}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
