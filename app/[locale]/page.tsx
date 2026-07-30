'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { validatePhone } from '@/lib/phone';
import PhoneInput from '@/components/PhoneInput';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { wT } from '@/lib/i18n-wallet';

// ─── FadeIn on scroll ─────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(22px)', transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

// ─── Decorative QR SVG ────────────────────────────────────────────────────────
function QRIllustration() {
  const G = '#00C896';
  const dots: [number, number][] = [
    [72,72],[80,72],[88,72],[72,80],[88,80],[72,88],[80,88],[88,88],
    [72,96],[80,104],[88,96],[96,72],[104,72],[112,80],[96,88],[104,96],[112,96],
    [96,104],[104,104],[80,112],[88,112],[96,112],[104,112],
  ];
  return (
    <svg width="164" height="164" viewBox="0 0 164 164" fill="none" aria-hidden>
      {/* TL finder */}
      <rect x="8" y="8" width="44" height="44" rx="6" stroke={G} strokeWidth="3.5" fill="none"/>
      <rect x="18" y="18" width="24" height="24" rx="3" fill={G} fillOpacity="0.7"/>
      {/* TR finder */}
      <rect x="112" y="8" width="44" height="44" rx="6" stroke={G} strokeWidth="3.5" fill="none"/>
      <rect x="122" y="18" width="24" height="24" rx="3" fill={G} fillOpacity="0.7"/>
      {/* BL finder */}
      <rect x="8" y="112" width="44" height="44" rx="6" stroke={G} strokeWidth="3.5" fill="none"/>
      <rect x="18" y="122" width="24" height="24" rx="3" fill={G} fillOpacity="0.7"/>
      {/* Data dots */}
      {dots.map(([x, y], i) => <rect key={i} x={x} y={y} width="6" height="6" rx="1.5" fill={G} fillOpacity={0.45 + (i % 3) * 0.18}/>)}
      {/* Logo center */}
      <rect x="68" y="68" width="28" height="28" rx="5" fill="rgba(0,200,150,0.12)" stroke={G} strokeWidth="1.5"/>
      <path d="M76 82 L82 88 L90 75" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '💸', tk: 'landing_f1t', dk: 'landing_f1d' },
  { icon: '🔄', tk: 'landing_f2t', dk: 'landing_f2d' },
  { icon: '🛡️', tk: 'landing_f3t', dk: 'landing_f3d' },
  { icon: '⛓️', tk: 'landing_f4t', dk: 'landing_f4d' },
] as const;

const BG = [
  'radial-gradient(ellipse at 30% 20%, rgba(0,200,150,0.08) 0%, transparent 50%)',
  'linear-gradient(160deg, #0a0f1e 0%, #051a14 50%, #001a0e 100%)',
].join(',');

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router   = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const loginRef = useRef<HTMLDivElement>(null);
  const T = wT(locale);

  const [phone,   setPhone]   = useState('+243');
  const [pin,     setPin]     = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function scrollToLogin() {
    loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { document.getElementById('unipay-phone')?.focus(); }, 500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validatePhone(phone)) { setError(T.err_phone_inv); return; }
    if (pin.length !== 6)        { setError(T.err_pin_length);   return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/wallet/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? T.login_err_def); return; }
      localStorage.setItem('wallet_phone', phone);
      router.refresh();
      router.push(`/${locale}/wallet`);
    } catch {
      setError(T.err_network);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden" style={{ background: BG }}>

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section className="relative z-10 flex flex-col text-center pt-10 pb-16">
        {/* Language switcher — absolute top-right */}
        <div className="absolute top-4 right-4 z-20">
          <div style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Logo — full viewport width, no container, no padding */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logodark.png"
          alt="UniPay Congo"
          style={{ width: '100%', display: 'block', objectFit: 'cover' }}
        />

        {/* Hero text + CTAs — padded & centred */}
        <div className="flex flex-col items-center px-6 pt-8">
          <h1 className="text-[26px] font-extrabold text-white leading-tight mb-3" style={{ textShadow: '0 2px 20px rgba(0,200,150,0.3)' }}>
            {T.landing_tagline}
          </h1>
          <p className="text-sm text-white/55 mb-8 tracking-wide">
            {T.landing_subtitle}
          </p>

          <div className="flex flex-col gap-3 w-full max-w-[280px]">
            <Link href={`/${locale}/wallet/register`}
              className="h-[52px] flex items-center justify-center rounded-xl font-bold text-[#070f1a] text-base shadow-lg"
              style={{ background: 'linear-gradient(135deg,#00C896,#00f5b8)', boxShadow: '0 4px 24px rgba(0,200,150,0.45)' }}>
              {T.reg_title}
            </Link>
            <button type="button" onClick={scrollToLogin}
              className="h-[52px] flex items-center justify-center rounded-xl font-bold text-white text-base border transition-all"
              style={{ borderColor: 'rgba(0,200,150,0.5)', background: 'rgba(0,200,150,0.08)', backdropFilter: 'blur(8px)' }}>
              {T.reg_sign_in}
            </button>
          </div>

          {/* Currency badge row */}
          <div className="flex gap-2 mt-8 flex-wrap justify-center">
            {['CDF','USD','USDT','CGLT'].map((c) => (
              <span key={c} className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: c === 'CGLT' ? 'rgba(212,175,55,0.15)' : 'rgba(0,200,150,0.12)', color: c === 'CGLT' ? '#d4af37' : '#00C896', border: `1px solid ${c === 'CGLT' ? 'rgba(212,175,55,0.3)' : 'rgba(0,200,150,0.25)'}` }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURES  2×2
      ════════════════════════════════════════════ */}
      <section className="relative z-10 px-4 pb-12">
        <FadeIn className="text-center mb-5">
          <h2 className="text-base font-bold text-white/70 uppercase tracking-widest">{T.landing_feat_title}</h2>
        </FadeIn>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ icon, tk, dk }, i) => (
            <FadeIn key={tk} delay={i * 80}>
              <div className="rounded-2xl p-4 h-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-sm font-bold text-white/90 leading-snug mb-1">{T[tk as keyof typeof T]}</p>
                <p className="text-xs text-white/45 leading-relaxed">{T[dk as keyof typeof T]}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          QR SECTION
      ════════════════════════════════════════════ */}
      <section className="relative z-10 px-4 pb-14">
        <FadeIn>
          <div className="rounded-2xl p-6 flex flex-col items-center text-center" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.18)', backdropFilter: 'blur(12px)' }}>
            <div className="mb-4 p-3 rounded-2xl" style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)' }}>
              <QRIllustration />
            </div>
            <h3 className="text-base font-bold text-white/90 mb-2">{T.landing_qr_title}</h3>
            <p className="text-sm text-white/50">{T.landing_qr_sub}</p>
          </div>
        </FadeIn>
      </section>

      {/* ════════════════════════════════════════════
          LOGIN FORM
      ════════════════════════════════════════════ */}
      <section ref={loginRef} className="relative z-10 px-4 pb-10">
        <FadeIn>
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
            <div className="flex flex-col items-center mb-5">
              <h2 className="text-lg font-extrabold text-white">{T.login_title}</h2>
              <p className="text-xs text-white/45 mt-1">{T.login_sub}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-widest">{T.reg_phone_lbl}</label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  inputClassName="text-white placeholder:text-white/25"
                  selectClassName="text-white"
                  inputStyle={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)' }}
                  selectStyle={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)' }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                  {T.landing_pin_lbl} <span className="text-white/30 normal-case font-normal">{pin.length}/6</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  required
                  className="rounded-xl px-4 py-3.5 text-base text-white tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#00C896] transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-900/20 rounded-xl px-4 py-3 border border-red-800/30">{error}</p>
              )}

              <button type="submit" disabled={loading}
                className="h-[52px] flex items-center justify-center gap-2 rounded-xl font-bold text-[#070f1a] text-base disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg,#00C896,#00f5b8)', boxShadow: '0 4px 20px rgba(0,200,150,0.35)' }}>
                {loading && <Spinner />}
                {loading ? T.login_loading : T.reg_sign_in}
              </button>
            </form>

            <p className="text-sm text-center text-white/40 mt-5">
              {T.login_no_acct}{' '}
              <Link href={`/${locale}/wallet/register`} className="font-bold" style={{ color: '#00C896' }}>
                {T.reg_title}
              </Link>
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer className="relative z-10 px-4 pb-8 pt-2 flex flex-col items-center gap-3">
        <p className="text-[11px] text-white/25 text-center">{T.landing_footer}</p>
        <div className="flex gap-4">
          <Link href={`/${locale}/terms`} className="text-[11px] text-white/30 hover:text-white/60 transition">{T.landing_cgu}</Link>
          <Link href={`/${locale}/privacy`} className="text-[11px] text-white/30 hover:text-white/60 transition">{T.landing_priv}</Link>
          <a href="mailto:support@unipaycongo.com" className="text-[11px] text-white/30 hover:text-white/60 transition">{T.landing_support}</a>
        </div>
      </footer>

    </div>
  );
}
