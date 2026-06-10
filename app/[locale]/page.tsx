'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { validatePhone } from '@/lib/phone';
import PhoneInput from '@/components/PhoneInput';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// ─── Translations (FR / EN / LN / SW) ────────────────────────────────────────
const T = {
  fr: {
    tagline:    "Le wallet financier de l'Afrique Centrale et de sa diaspora",
    subtitle:   'Envoyez, recevez et échangez — Mobile Money · Carte · Crypto',
    cta_create: 'Créer mon wallet',
    cta_login:  'Se connecter',
    feat_title: 'Tout ce dont vous avez besoin',
    f1t: 'Envoyez de l\'argent',      f1d: 'Par numéro de téléphone ou QR code, instantané',
    f2t: 'Changez vos devises',       f2d: 'CDF, USD, USDT et CGLT au meilleur taux',
    f3t: 'KYC Cognitif',              f3d: 'Vérification d\'identité par IA, résultat en 2 minutes',
    f4t: 'Blockchain Congolaise',     f4d: 'Vos CGLT sécurisés sur la première blockchain privée de RDC',
    qr_title:   'Payez et recevez avec votre QR code personnel',
    qr_sub:     'Montrez votre QR, encaissez instantanément',
    login_h:    'Connexion',
    login_sub:  'Accédez à votre portefeuille UniPay',
    phone_lbl:  'Numéro de téléphone',
    pin_lbl:    'Code PIN',
    login_btn:  'Se connecter',
    logging:    'Connexion…',
    no_acct:    'Pas encore de compte ?',
    reg_link:   'Créer mon wallet',
    footer:     'UniPay Congo — Propulsé par IA-Solution & CGL',
    cgu: 'CGU', priv: 'Confidentialité', support: 'Support',
    err_phone:  'Numéro invalide. Format : 09XXXXXXXX ou +243 9X XXX XXXX',
    err_pin:    'Le PIN doit contenir 6 chiffres.',
    err_net:    'Erreur réseau, réessayez.',
    err_def:    'Numéro ou PIN incorrect',
  },
  en: {
    tagline:    'The financial wallet of Central Africa and its diaspora',
    subtitle:   'Send, receive and exchange — Mobile Money · Card · Crypto',
    cta_create: 'Create my wallet',
    cta_login:  'Sign in',
    feat_title: 'Everything you need',
    f1t: 'Send money',                f1d: 'By phone number or QR code, instantly',
    f2t: 'Exchange currencies',       f2d: 'CDF, USD, USDT and CGLT at the best rate',
    f3t: 'Cognitive KYC',             f3d: 'AI-powered identity verification, result in 2 minutes',
    f4t: 'Congolese Blockchain',      f4d: 'Your CGLT secured on the first private blockchain in DRC',
    qr_title:   'Pay and receive with your personal QR code',
    qr_sub:     'Show your QR, collect instantly',
    login_h:    'Sign in',
    login_sub:  'Access your UniPay wallet',
    phone_lbl:  'Phone number',
    pin_lbl:    'PIN code',
    login_btn:  'Sign in',
    logging:    'Signing in…',
    no_acct:    'No account yet?',
    reg_link:   'Create my wallet',
    footer:     'UniPay Congo — Powered by IA-Solution & CGL',
    cgu: 'ToS', priv: 'Privacy', support: 'Support',
    err_phone:  'Invalid number. Format: 09XXXXXXXX or +243 9X XXX XXXX',
    err_pin:    'PIN must be 6 digits.',
    err_net:    'Network error, please retry.',
    err_def:    'Incorrect number or PIN',
  },
  ln: {
    tagline:    'Portefeuille ya mbongo ya Afrique Centrale na diaspora na yango',
    subtitle:   'Tumela, kangela mpe sángola — Mobile Money · Carte · Crypto',
    cta_create: 'Sálá wallet na ngai',
    cta_login:  'Kótá',
    feat_title: 'Nyonso ozali na yango',
    f1t: 'Tumela mbongo',             f1d: 'Na nombolo ya telefone to QR, mbala moko',
    f2t: 'Sángola mbongo',            f2d: 'CDF, USD, USDT na CGLT na prix ya malamu',
    f3t: 'KYC ya mayele',             f3d: 'Vérification ya identité na IA, résultat na miniti 2',
    f4t: 'Blockchain ya Congo',       f4d: 'CGLT na yo babateli na blockchain ya liboso ya RDC',
    qr_title:   'Lipa mpe kangá mbongo na QR code na yo',
    qr_sub:     'Monisá QR na yo, kangá mbongo mbala moko',
    login_h:    'Kótá',
    login_sub:  'Kóta na portefeuille na yo ya UniPay',
    phone_lbl:  'Nombolo ya telefone',
    pin_lbl:    'Code PIN',
    login_btn:  'Kótá',
    logging:    'Kokóta…',
    no_acct:    'Ozali na compte te?',
    reg_link:   'Sálá wallet na ngai',
    footer:     'UniPay Congo — Propulsé na IA-Solution & CGL',
    cgu: 'CGU', priv: 'Confidentiel', support: 'Lisungi',
    err_phone:  'Nombolo ekoki te. Format: 09XXXXXXXX',
    err_pin:    'PIN esengeli ezala na nombolo 6.',
    err_net:    'Lisaleli ya réseau, kozonga lisusu.',
    err_def:    'Nombolo to PIN ya bozoba',
  },
  sw: {
    tagline:    'Pochi ya fedha ya Afrika ya Kati na diaspora yake',
    subtitle:   'Tuma, pokea na badilisha — Mobile Money · Kadi · Crypto',
    cta_create: 'Fungua pochi yangu',
    cta_login:  'Ingia',
    feat_title: 'Kila unachohitaji',
    f1t: 'Tuma pesa',                 f1d: 'Kwa nambari ya simu au QR code, mara moja',
    f2t: 'Badilisha sarafu',          f2d: 'CDF, USD, USDT na CGLT kwa kiwango bora',
    f3t: 'KYC ya Akili Bandia',       f3d: 'Uthibitisho wa utambulisho kwa AI, matokeo kwa dakika 2',
    f4t: 'Blockchain ya Kongo',       f4d: 'CGLT yako salama kwenye blockchain ya kwanza ya DRC',
    qr_title:   'Lipa na upokee na QR code yako ya kibinafsi',
    qr_sub:     'Onyesha QR yako, pokea mara moja',
    login_h:    'Ingia',
    login_sub:  'Fikia pochi yako ya UniPay',
    phone_lbl:  'Nambari ya simu',
    pin_lbl:    'Nambari ya siri (PIN)',
    login_btn:  'Ingia',
    logging:    'Inaingia…',
    no_acct:    'Bado huna akaunti?',
    reg_link:   'Fungua pochi yangu',
    footer:     'UniPay Congo — Inayoundwa na IA-Solution & CGL',
    cgu: 'Masharti', priv: 'Faragha', support: 'Msaada',
    err_phone:  'Nambari si sahihi. Muundo: 09XXXXXXXX',
    err_pin:    'PIN lazima iwe na nambari 6.',
    err_net:    'Hitilafu ya mtandao, jaribu tena.',
    err_def:    'Nambari au PIN si sahihi',
  },
} as const;
type LK = keyof typeof T;
function t(locale: string, key: keyof (typeof T)['fr']): string {
  const lang = (locale in T ? locale : 'fr') as LK;
  return (T[lang] as any)[key] ?? (T.fr as any)[key];
}

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
  { icon: '💸', tk: 'f1t', dk: 'f1d' },
  { icon: '🔄', tk: 'f2t', dk: 'f2d' },
  { icon: '🛡️', tk: 'f3t', dk: 'f3d' },
  { icon: '⛓️', tk: 'f4t', dk: 'f4d' },
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
    if (!validatePhone(phone)) { setError(t(locale, 'err_phone')); return; }
    if (pin.length !== 6)        { setError(t(locale, 'err_pin'));   return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/wallet/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t(locale, 'err_def')); return; }
      localStorage.setItem('wallet_phone', phone);
      router.refresh();
      router.push(`/${locale}/wallet`);
    } catch {
      setError(t(locale, 'err_net'));
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
            {t(locale, 'tagline')}
          </h1>
          <p className="text-sm text-white/55 mb-8 tracking-wide">
            {t(locale, 'subtitle')}
          </p>

          <div className="flex flex-col gap-3 w-full max-w-[280px]">
            <Link href={`/${locale}/wallet/register`}
              className="h-[52px] flex items-center justify-center rounded-xl font-bold text-[#070f1a] text-base shadow-lg"
              style={{ background: 'linear-gradient(135deg,#00C896,#00f5b8)', boxShadow: '0 4px 24px rgba(0,200,150,0.45)' }}>
              {t(locale, 'cta_create')}
            </Link>
            <button type="button" onClick={scrollToLogin}
              className="h-[52px] flex items-center justify-center rounded-xl font-bold text-white text-base border transition-all"
              style={{ borderColor: 'rgba(0,200,150,0.5)', background: 'rgba(0,200,150,0.08)', backdropFilter: 'blur(8px)' }}>
              {t(locale, 'cta_login')}
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
          <h2 className="text-base font-bold text-white/70 uppercase tracking-widest">{t(locale, 'feat_title')}</h2>
        </FadeIn>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ icon, tk, dk }, i) => (
            <FadeIn key={tk} delay={i * 80}>
              <div className="rounded-2xl p-4 h-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-sm font-bold text-white/90 leading-snug mb-1">{t(locale, tk)}</p>
                <p className="text-xs text-white/45 leading-relaxed">{t(locale, dk)}</p>
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
            <h3 className="text-base font-bold text-white/90 mb-2">{t(locale, 'qr_title')}</h3>
            <p className="text-sm text-white/50">{t(locale, 'qr_sub')}</p>
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
              <h2 className="text-lg font-extrabold text-white">{t(locale, 'login_h')}</h2>
              <p className="text-xs text-white/45 mt-1">{t(locale, 'login_sub')}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-widest">{t(locale, 'phone_lbl')}</label>
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
                  {t(locale, 'pin_lbl')} <span className="text-white/30 normal-case font-normal">{pin.length}/6</span>
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
                {loading ? t(locale, 'logging') : t(locale, 'login_btn')}
              </button>
            </form>

            <p className="text-sm text-center text-white/40 mt-5">
              {t(locale, 'no_acct')}{' '}
              <Link href={`/${locale}/wallet/register`} className="font-bold" style={{ color: '#00C896' }}>
                {t(locale, 'reg_link')}
              </Link>
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer className="relative z-10 px-4 pb-8 pt-2 flex flex-col items-center gap-3">
        <p className="text-[11px] text-white/25 text-center">{t(locale, 'footer')}</p>
        <div className="flex gap-4">
          <Link href={`/${locale}/terms`} className="text-[11px] text-white/30 hover:text-white/60 transition">{t(locale, 'cgu')}</Link>
          <Link href={`/${locale}/privacy`} className="text-[11px] text-white/30 hover:text-white/60 transition">{t(locale, 'priv')}</Link>
          <a href="mailto:support@unipaycongo.com" className="text-[11px] text-white/30 hover:text-white/60 transition">{t(locale, 'support')}</a>
        </div>
      </footer>

    </div>
  );
}
