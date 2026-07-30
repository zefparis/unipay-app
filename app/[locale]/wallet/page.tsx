'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ArrowDownUp, QrCode, TrendingUp, Wallet, Repeat2, Gamepad2, ChevronDown } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { wT, type WalletDict } from '@/lib/i18n-wallet';
import { useNotifications } from '@/hooks/useNotifications';

interface Tx {
  id: string;
  direction: 'collect' | 'payout' | 'p2p';
  operator: string;
  amount: number;
  net_amount: number;
  currency?: string;
  created_at: string;
  status: string;
}

function relativeDate(iso: string, T: WalletDict) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return T.home_just_now;
  if (s < 3600) return T.home_min_ago.replace('{n}', String(Math.floor(s / 60)));
  if (s < 86400) return T.home_h_ago.replace('{n}', String(Math.floor(s / 3600)));
  return T.home_d_ago.replace('{n}', String(Math.floor(s / 86400)));
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

// Discreet mesh-gradient backdrop for the glassmorphism hero.
const HERO_BG_DARK =
  'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(0,200,150,0.10) 0%, transparent 50%), #0f1117';
const HERO_BG_LIGHT =
  'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(0,200,150,0.06) 0%, transparent 50%), #f8fafc';

// Subtle fractal-noise texture (data-URI SVG) layered over the gradient.
const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-gray-400 dark:text-white/60 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletHomePage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const T = wT(locale ?? 'fr');
  const base = `/${locale}/wallet`;
  const { permission, requestPermission } = useNotifications();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const showBanner =
    !bannerDismissed &&
    typeof window !== 'undefined' &&
    localStorage.getItem('notif_prompted') !== '1' &&
    permission === 'default';

  const [balance, setBalance] = useState<number | null>(null);
  const [usdBalance, setUsdBalance] = useState(0);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [cgltBalance, setCgltBalance] = useState(0);
  const [txList, setTxList] = useState<Tx[]>([]);
  const [loadingBal, setLoadingBal] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch('/api/wallet/balance')
      .then((r) => {
        if (r.status === 401) { router.replace(`${base}/login`); return null; }
        return r.json();
      })
      .then((d) => { if (d) { setBalance(Number(d.balance_cdf ?? 0)); setUsdBalance(Number(d.usd_balance ?? 0)); setUsdtBalance(Number(d.usdt_balance ?? 0)); setCgltBalance(Number(d.cglt_balance ?? 0)); } })
      .catch(() => {})
      .finally(() => setLoadingBal(false));

    fetch('/api/wallet/transactions?limit=3')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.data) setTxList(d.data); })
      .catch(() => {});
  }, [base, router]);

  const heroBg = isDark ? HERO_BG_DARK : HERO_BG_LIGHT;
  const glassBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)';
  const glassBgSubtle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const glassBorderSubtle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const glassIconBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const glassShadow = isDark
    ? '0 8px 32px rgba(99,102,241,0.20), 0 0 0 1px rgba(255,255,255,0.05)'
    : '0 8px 32px rgba(99,102,241,0.10), 0 0 0 1px rgba(0,0,0,0.04)';
  const separatorBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const txCardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const txCardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const sendBtnBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const sendBtnBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
  const advancedBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';

  return (
    <div
      className="relative flex flex-col flex-1 min-h-screen text-gray-900 dark:text-white overflow-hidden"
      style={{ background: heroBg }}
    >
      {/* Subtle noise texture over the gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.04] mix-blend-soft-light"
        style={{ backgroundImage: NOISE_BG, backgroundSize: '256px 256px' }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-6">
        <LanguageSwitcher />
      </div>

      {/* Push notification activation banner */}
      {showBanner && (
        <div className="relative z-10 mx-4 mt-3 rounded-xl bg-black/5 dark:bg-white/10 backdrop-blur-sm border border-black/10 dark:border-white/20 px-4 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0">🔔</span>
          <p className="flex-1 text-xs text-gray-700 dark:text-white/90 leading-snug">
            {locale === 'en'
              ? 'Enable notifications to track your transactions'
              : 'Activez les notifications pour suivre vos transactions'}
          </p>
          <button
            onClick={async () => {
              localStorage.setItem('notif_prompted', '1');
              setBannerDismissed(true);
              await requestPermission();
            }}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#00A651] text-white hover:bg-[#00A651]/90 transition"
          >
            {locale === 'en' ? 'Enable' : 'Activer'}
          </button>
          <button
            onClick={() => { localStorage.setItem('notif_prompted', '1'); setBannerDismissed(true); }}
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:text-white/50 dark:hover:text-white transition text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Balance hero — glassmorphism */}
      <div className="relative z-10 px-4 pt-4">
        <div
          className="w-full rounded-[24px] p-6"
          style={{
            position: 'relative',
            background: glassBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${glassBorder}`,
            boxShadow: glassShadow,
          }}
        >
          <p className="text-sm text-gray-600 dark:text-white/60 tracking-wide">{T.balance_avail}</p>
          {loadingBal ? (
            <div className="h-14 mt-2"><Spinner /></div>
          ) : (
            <p className="mt-1 leading-none break-all" style={{ fontSize: 'clamp(28px, 10.5vw, 52px)', fontWeight: 800, letterSpacing: '-1px' }}>
              {balance !== null ? fmt(balance) : '—'}
              <span className="text-xl font-normal text-gray-500 dark:text-white/50 ml-1">CDF</span>
            </p>
          )}
          {!loadingBal && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500 dark:text-white/60">{T.home_usd_lbl}</span>
              <span className="text-base font-bold" style={{ color: isDark ? '#6ee7b7' : '#059669' }}>
                {usdBalance.toFixed(2)} USD
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-white/50 mt-3">{T.app_name} · RDC</p>

          {/* Subtle separator */}
          <div className="my-5 h-px w-full" style={{ background: separatorBg }} />

          {/* CGLT row */}
          {cgltBalance > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-white/50">{T.home_cglt_lbl}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: isDark ? '#a78bfa' : '#7c3aed' }}>
                {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cgltBalance)}
                <span className="text-base font-semibold ml-1">CGLT</span>
              </p>
            </div>
          )}

          {/* USDT row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-white/50">{T.home_usdt_lbl}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: '#00C896' }}>
                {usdtBalance.toFixed(2)}
                <span className="text-base font-semibold ml-1">USDT</span>
              </p>
            </div>
            <Link
              href={`${base}/send?tab=usdt`}
              className="px-4 py-2 rounded-full text-sm font-semibold text-gray-900 dark:text-white transition active:scale-95 hover:bg-black/[0.08] dark:hover:bg-white/[0.16]"
              style={{
                background: sendBtnBg,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${sendBtnBorder}`,
              }}
            >
              {T.home_send}
            </Link>
          </div>
        </div>
      </div>

      {/* Action grid — 6 main tiles */}
      <div className="relative z-10 px-4 pt-6">
        <div className="flex flex-wrap justify-center gap-3">
          {([
            { href: `${base}/deposit`,  icon: <ArrowDownCircle className="text-emerald-600 dark:text-emerald-400" size={24} />, label: T.home_deposit },
            { href: `${base}/withdraw`, icon: <ArrowUpCircle   className="text-orange-600 dark:text-orange-400"  size={24} />, label: T.home_withdraw },
            { href: `${base}/send`,     icon: <ArrowLeftRight  className="text-sky-600 dark:text-sky-400"     size={24} />, label: T.home_send },
            { href: `${base}/swap`,     icon: <ArrowDownUp     className="text-indigo-600 dark:text-indigo-400"  size={24} />, label: T.home_convert },
            { href: `${base}/scan`,     icon: <QrCode          className="text-fuchsia-600 dark:text-fuchsia-400" size={24} />, label: T.home_scan },
          ] as const).map(({ href, icon, label }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2.5 rounded-2xl p-4 basis-[calc(33.333%-0.5rem)] active:scale-95 hover:scale-[1.03] transition-all duration-200"
              style={{
                background: glassBg,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${glassBorder}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: glassIconBg, border: `1px solid ${glassBorder}` }}
              >
                {icon}
              </div>
              <span className="text-[11px] font-semibold text-gray-700 dark:text-white/80 text-center leading-tight break-words">{label}</span>
            </Link>
          ))}
          <a
            href="https://congogaming.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2.5 rounded-2xl p-4 basis-[calc(33.333%-0.5rem)] active:scale-95 hover:scale-[1.03] transition-all duration-200"
            style={{
              background: glassBg,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${glassBorder}`,
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: glassIconBg, border: `1px solid ${glassBorder}` }}
            >
              <Gamepad2 className="text-violet-600 dark:text-violet-400" size={24} />
            </div>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-white/80 text-center leading-tight break-words">{T.home_gaming}</span>
          </a>
        </div>

        {/* Advanced Crypto — toggle button */}
        <div className="flex justify-center mt-4 mb-2">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-white/50 dark:hover:text-white/80 transition-all duration-200"
            style={{ border: `1px solid ${advancedBorder}` }}
          >
            <span>{T.home_advanced}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-300 ${showAdvanced ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>
        </div>

        {/* Advanced tiles — collapsible */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            showAdvanced ? 'max-h-[300px] opacity-100 pb-6' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {([
              { href: `${base}/receive`,  icon: <Wallet     className="text-teal-600 dark:text-teal-400"   size={24} />, label: T.home_receive },
              { href: `${base}/exchange`, icon: <Repeat2    className="text-amber-600 dark:text-amber-400"  size={24} />, label: T.home_exchange },
              { href: `${base}/crypto`,   icon: <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />, label: T.home_crypto },
            ] as const).map(({ href, icon, label }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2.5 rounded-2xl p-4 basis-[calc(33.333%-0.5rem)] active:scale-95 hover:scale-[1.03] transition-all duration-200"
                style={{
                  background: glassBgSubtle,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${glassBorderSubtle}`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: glassIconBg, border: `1px solid ${glassBorderSubtle}` }}
                >
                  {icon}
                </div>
                <span className="text-[11px] font-semibold text-gray-600 dark:text-white/60 text-center leading-tight break-words">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="relative z-10 px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-widest">{T.home_recent}</h2>
          <Link href={`${base}/transactions`} className="text-xs font-semibold" style={{ color: '#00C896' }}>{T.home_see_all}</Link>
        </div>

        {txList.length === 0 && !loadingBal && (
          <p className="text-sm text-gray-500 dark:text-white/40 text-center py-8">{T.home_no_tx}</p>
        )}

        <div className="flex flex-col gap-2">
          {txList.map((tx) => {
            const isCredit = tx.direction === 'collect';
            const isP2P    = tx.direction === 'p2p';
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: txCardBg, border: `1px solid ${txCardBorder}` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: glassIconBg }}
                >
                  {isCredit && <ArrowDownCircle className="text-emerald-600 dark:text-emerald-400" size={20} />}
                  {tx.direction === 'payout' && <ArrowUpCircle className="text-orange-600 dark:text-orange-400" size={20} />}
                  {isP2P && <ArrowLeftRight className="text-sky-600 dark:text-sky-400" size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white/90 capitalize">{tx.operator}</p>
                  <p className="text-xs text-gray-500 dark:text-white/40">{relativeDate(tx.created_at, T)}</p>
                </div>
                <p className={`text-sm font-bold shrink-0 ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : isP2P ? 'text-sky-600 dark:text-sky-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {(() => {
                    const cur = (tx.currency ?? 'CDF').toUpperCase();
                    const val = isCredit ? tx.net_amount : tx.amount;
                    const display = cur === 'USD' ? val.toFixed(2) : fmt(val);
                    return `${isCredit ? '+' : '−'}${display} ${cur}`;
                  })()}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
