'use client';

import { useRouter } from 'next/navigation';

function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition mb-6"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Retour
    </button>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold text-gray-900 dark:text-white mt-8 mb-3">{children}</h2>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-gray-50 dark:border-slate-800 last:border-0">
      <span className="text-xs text-gray-400 dark:text-slate-500 w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{value}</span>
    </div>
  );
}

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <BackButton />

        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Mentions Légales</h1>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-8">UniPay Congo</p>

        <H2>Éditeur du service</H2>
        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl px-4 py-2 space-y-0.5">
          <Row label="Société"        value="Congo Gaming Limited S.a.r.l." />
          <Row label="Adresse"        value="195 Avenue Colonel Ebeya, Commune de la Gombe, Kinshasa, RDC" />
          <Row label="RCCM"           value="CD/KIN/RCCM/16-B-9723" />
          <Row label="Idnat"          value="01-9-N15024X" />
          <Row label="N° Impôt"       value="A1621850T" />
          <Row label="INSS"           value="010109351A1" />
          <Row label="Agréments ARPTC" value="n°0573 & n°0574 (2023)" />
          <Row label="Directeur de publication" value="Benjamin Barrère" />
        </div>

        <H2>Hébergement</H2>
        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl px-4 py-2 space-y-0.5">
          <Row label="Frontend"       value="Vercel Inc. — 340 Pine Street Suite 701, San Francisco, CA 94104, USA" />
          <Row label="Backend"        value="Render Inc. — 525 Brannan Street Suite 300, San Francisco, CA 94107, USA" />
          <Row label="Base de données" value="Supabase Inc." />
        </div>

        <H2>Contact</H2>
        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl px-4 py-2 space-y-0.5">
          <Row label="Email"          value="contact@unipaycongo.com" />
          <Row label="Site"           value="https://unipaycongo.com" />
          <Row label="Application"    value="https://app.unipaycongo.com" />
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            © {new Date().getFullYear()} Congo Gaming Limited S.a.r.l. — Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
