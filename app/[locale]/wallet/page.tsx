'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ArrowDownUp, QrCode, TrendingUp, Wallet, Repeat2, Gamepad2 } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { wT, type WalletDict } from '@/lib/i18n-wallet';

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
const HERO_BG =
  'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(0,200,150,0.10) 0%, transparent 50%), #0f1117';

// Subtle fractal-noise texture (data-URI SVG) layered over the gradient.
const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white/60 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

  const [balance, setBalance] = useState<number | null>(null);
  const [usdBalance, setUsdBalance] = useState(0);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [cgltBalance, setCgltBalance] = useState(0);
  const [txList, setTxList] = useState<Tx[]>([]);
  const [loadingBal, setLoadingBal] = useState(true);

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
  }, []);

  return (
    <div
      className="relative flex flex-col flex-1 min-h-screen text-white overflow-hidden"
      style={{ background: HERO_BG }}
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

      {/* Balance hero — glassmorphism */}
      <div className="relative z-10 px-4 pt-4">
        <div
          className="w-full rounded-[24px] p-6"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.20), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          <p className="text-sm text-white/60 tracking-wide">{T.balance_avail}</p>
          {loadingBal ? (
            <div className="h-14 mt-2"><Spinner /></div>
          ) : (
            <p className="mt-1 leading-none break-all" style={{ fontSize: 'clamp(28px, 10.5vw, 52px)', fontWeight: 800, letterSpacing: '-1px' }}>
              {balance !== null ? fmt(balance) : '—'}
              <span className="text-xl font-normal text-white/50 ml-1">CDF</span>
            </p>
          )}
          {!loadingBal && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs opacity-60">{T.home_usd_lbl}</span>
              <span className="text-base font-bold" style={{ color: '#6ee7b7' }}>
                {usdBalance.toFixed(2)} USD
              </span>
            </div>
          )}
          <p className="text-xs text-white/50 mt-3">{T.app_name} · RDC</p>

          {/* Subtle separator */}
          <div className="my-5 h-px w-full" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* CGLT row */}
          {cgltBalance > 0 && (
            <div className="mb-4">
              <p className="text-xs text-white/50">{T.home_cglt_lbl}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: '#a78bfa' }}>
                {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cgltBalance)}
                <span className="text-base font-semibold ml-1">CGLT</span>
              </p>
            </div>
          )}

          {/* USDT row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50">{T.home_usdt_lbl}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: '#00C896' }}>
                {usdtBalance.toFixed(2)}
                <span className="text-base font-semibold ml-1">USDT</span>
              </p>
            </div>
            <Link
              href={`${base}/send-usdt`}
              className="px-4 py-2 rounded-full text-sm font-semibold text-white transition active:scale-95 hover:bg-white/[0.16]"
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {T.home_send}
            </Link>
          </div>
        </div>
      </div>

      {/* Action grid — 3 + 2 centered, glass tiles */}
      <div className="relative z-10 flex flex-wrap justify-center gap-3 px-4 py-6">
        {([
          { href: `${base}/deposit`,  icon: <ArrowDownCircle className="text-emerald-400" size={24} />, label: T.home_deposit },
          { href: `${base}/withdraw`, icon: <ArrowUpCircle   className="text-orange-400"  size={24} />, label: T.home_withdraw },
          { href: `${base}/send`,     icon: <ArrowLeftRight  className="text-sky-400"     size={24} />, label: T.home_send },
          { href: `${base}/swap`,     icon: <ArrowDownUp     className="text-indigo-400"  size={24} />, label: T.home_convert },
          { href: `${base}/scan`,     icon: <QrCode          className="text-fuchsia-400" size={24} />, label: T.home_scan },
          { href: `${base}/receive`,  icon: <Wallet          className="text-teal-400"    size={24} />, label: T.home_receive },
          { href: `${base}/exchange`, icon: <Repeat2         className="text-amber-400"   size={24} />, label: T.home_exchange },
          { href: `${base}/crypto`,   icon: <TrendingUp      className="text-purple-400"  size={24} />, label: T.home_crypto },
        ] as const).map(({ href, icon, label }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-2.5 rounded-2xl p-4 basis-[calc(33.333%-0.5rem)] active:scale-95 hover:scale-[1.03] transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {icon}
            </div>
            <span className="text-[11px] font-semibold text-white/80 text-center leading-tight break-words">{label}</span>
          </Link>
        ))}
        <a
          href="https://congogaming.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2.5 rounded-2xl p-4 basis-[calc(33.333%-0.5rem)] active:scale-95 hover:scale-[1.03] transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Gamepad2 className="text-violet-400" size={24} />
          </div>
          <span className="text-[11px] font-semibold text-white/80 text-center leading-tight break-words">{T.home_gaming}</span>
        </a>
      </div>

      {/* Recent transactions */}
      <div className="relative z-10 px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">{T.home_recent}</h2>
          <Link href={`${base}/transactions`} className="text-xs font-semibold" style={{ color: '#00C896' }}>{T.home_see_all}</Link>
        </div>

        {txList.length === 0 && !loadingBal && (
          <p className="text-sm text-white/40 text-center py-8">{T.home_no_tx}</p>
        )}

        <div className="flex flex-col gap-2">
          {txList.map((tx) => {
            const isCredit = tx.direction === 'collect';
            const isP2P    = tx.direction === 'p2p';
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  {isCredit && <ArrowDownCircle className="text-emerald-400" size={20} />}
                  {tx.direction === 'payout' && <ArrowUpCircle className="text-orange-400" size={20} />}
                  {isP2P && <ArrowLeftRight className="text-sky-400" size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 capitalize">{tx.operator}</p>
                  <p className="text-xs text-white/40">{relativeDate(tx.created_at, T)}</p>
                </div>
                <p className={`text-sm font-bold shrink-0 ${isCredit ? 'text-emerald-400' : isP2P ? 'text-sky-400' : 'text-orange-400'}`}>
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
