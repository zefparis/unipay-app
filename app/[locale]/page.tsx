'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const operators = ['Orange Money', 'Airtel Money', 'M-Pesa', 'Africell Money'];

const steps = [
  { icon: '📱', title: 'Inscrivez-vous', text: 'Créez votre wallet avec votre numéro de téléphone.' },
  { icon: '💳', title: 'Déposez', text: 'Alimentez votre solde via Mobile Money.' },
  { icon: '✈️', title: 'Envoyez', text: 'Transférez à n’importe qui en RDC.' },
];

const features = [
  { icon: '🔒', title: 'Sécurisé', text: 'Vérification biométrique PayGuard pour protéger votre argent.' },
  { icon: '⚡', title: 'Rapide', text: 'Transfert instantané, disponible à tout moment.' },
  { icon: '📶', title: 'Bas débit', text: 'Fonctionne même avec peu de réseau grâce à la PWA.' },
  { icon: '🌍', title: 'Multi-opérateurs', text: 'Orange, Airtel, M-Pesa et Africell réunis dans une seule app.' },
];

const transactions = [
  { name: 'Marie K.', type: 'Reçu', amount: '+4 500 CDF', color: 'text-[#00A651]' },
  { name: 'Airtel Money', type: 'Dépôt', amount: '+8 000 CDF', color: 'text-[#00A651]' },
  { name: 'Jean B.', type: 'Envoyé', amount: '-2 000 CDF', color: 'text-white' },
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00A651] shadow-lg shadow-[#00A651]/25">
        <svg width="21" height="21" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20.5L17 27.5L30 12.5" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="leading-none">
        <p className="text-base font-black tracking-tight text-white">UniPay</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#C9A84C]">Congo</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { locale } = useParams<{ locale: string }>();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <main className="min-h-screen max-w-screen overflow-x-hidden bg-[#0A1628] text-white">
      <header className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A1628]/90 shadow-2xl shadow-black/20 backdrop-blur' : 'bg-transparent'}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <Link
            href={`/${locale}/wallet/login`}
            className="rounded-full border border-white/35 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-[#0A1628] active:scale-95"
          >
            Se connecter
          </Link>
        </div>
      </header>

      <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-b from-[#0A1628] via-[#0D2040] to-[#0A1628] px-5 pb-16 pt-28">
        <div className="absolute left-1/2 top-32 h-72 w-72 -translate-x-1/2 rounded-full border border-[#00A651]/20 animate-pulse" />
        <div className="absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full border border-[#1A5FAB]/20 animate-pulse" />
        <div className="absolute left-1/2 top-16 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[#00A651]/10 blur-3xl" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="mx-auto w-full max-w-[18rem] rounded-[2.25rem] border border-white/15 bg-black/40 p-3 shadow-2xl shadow-[#00A651]/10 backdrop-blur lg:order-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#0A1628] p-4">
              <div className="mb-5 flex items-center justify-between">
                <Logo />
                <div className="h-8 w-8 rounded-full bg-[#1A5FAB]/30" />
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-[#00A651] to-[#1A5FAB] p-5 shadow-xl shadow-[#00A651]/20">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Solde wallet</p>
                <p className="mt-3 text-3xl font-black tracking-tight">12 500</p>
                <p className="text-sm font-semibold text-white/80">CDF disponibles</p>
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Dernières transactions</p>
                  <span className="rounded-full bg-[#C9A84C]/15 px-2 py-1 text-[10px] font-bold text-[#C9A84C]">Live</span>
                </div>
                {transactions.map((tx) => (
                  <div key={tx.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{tx.name}</p>
                      <p className="text-xs text-white/45">{tx.type}</p>
                    </div>
                    <p className={`text-sm font-black ${tx.color}`}>{tx.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <p className="mb-4 inline-flex rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-[#C9A84C]">
              Wallet mobile pour la RDC
            </p>
            <h1 className="text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Envoyez de l’argent
              <span className="mt-2 block bg-gradient-to-r from-[#00A651] to-[#1A5FAB] bg-clip-text text-transparent">
                en toute simplicité
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-white/70 sm:text-lg lg:mx-0">
              Dépôt, retrait et transfert via Mobile Money — Orange, Airtel, M-Pesa, Africell.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href={`/${locale}/wallet/register`}
                className="rounded-2xl bg-[#00A651] px-7 py-4 text-center text-base font-black text-white shadow-xl shadow-[#00A651]/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#008f45] active:scale-95"
              >
                Créer mon wallet
              </Link>
              <Link
                href={`/${locale}/wallet/login`}
                className="rounded-2xl border border-white/30 px-7 py-4 text-center text-base font-black text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-[#0A1628] active:scale-95"
              >
                J’ai déjà un compte
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0D2040] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#C9A84C]">Comment ça marche</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Trois étapes pour utiliser votre wallet</h2>
          </div>
          <div className="relative mt-12 grid gap-6 md:grid-cols-3">
            <div className="absolute left-1/2 top-12 hidden h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#C9A84C]/45 to-transparent md:block" />
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/15 text-3xl shadow-lg shadow-[#C9A84C]/10">
                  {step.icon}
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[#C9A84C]">Étape {index + 1}</p>
                <h3 className="mt-2 text-xl font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0A1628] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#00A651]">Pourquoi UniPay Congo</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Un wallet premium, pensé pour le quotidien congolais</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#00A651]/40">
                <div className="mb-5 text-4xl">{feature.icon}</div>
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0D2040] px-5 py-16">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#C9A84C]/25 bg-[#0A1628]/70 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <h2 className="text-center text-2xl font-black tracking-tight sm:text-3xl">Compatible avec tous les opérateurs DRC</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {operators.map((operator) => (
              <div key={operator} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-center font-black text-white/90 transition-all duration-300 hover:border-[#C9A84C]/50 hover:text-[#C9A84C]">
                {operator}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-5xl rounded-[2.25rem] bg-gradient-to-r from-[#00A651] to-[#1A5FAB] p-8 text-center shadow-2xl shadow-[#1A5FAB]/20 sm:p-12">
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Prêt à commencer ?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">Créez votre wallet UniPay Congo et envoyez de l’argent en quelques secondes.</p>
          <Link
            href={`/${locale}/wallet/register`}
            className="mt-8 inline-flex rounded-2xl bg-white px-8 py-4 text-base font-black text-[#0A1628] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
          >
            Créer mon wallet
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#07111f] px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 text-xs text-white/45">© CGL 2026. Tous droits réservés.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
            <Link href={`/${locale}/terms`} className="transition-colors hover:text-white">CGU</Link>
            <Link href={`/${locale}/privacy`} className="transition-colors hover:text-white">Confidentialité</Link>
            <Link href={`/${locale}/legal`} className="transition-colors hover:text-white">Mentions légales</Link>
            <Link href={`/${locale}/contact`} className="transition-colors hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
