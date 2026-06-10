'use client';

import { useParams, useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const isFr = locale !== 'en';

  return (
    <div className="min-h-screen" style={{ background: '#0a0f1e' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b border-white/10" style={{ background: '#0a0f1e' }}>
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/10 transition flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" style={{ color: '#e5e7eb' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-bold" style={{ color: '#f9fafb' }}>
            {isFr ? 'Politique de Confidentialité' : 'Privacy Policy'}
          </h1>
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            UniPay Congo — {isFr ? 'Version 1.0 — Juin 2026' : 'Version 1.0 — June 2026'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-24 space-y-6" style={{ color: '#e5e7eb' }}>
        <div className="rounded-xl border border-white/10 p-5" style={{ background: '#111827' }}>
          <p className="text-sm leading-relaxed">
            {isFr
              ? 'UniPay Congo collecte uniquement les données nécessaires à la fourniture du service (numéro de téléphone, email optionnel, historique des transactions). Ces données ne sont pas vendues à des tiers.'
              : 'UniPay Congo only collects data necessary to provide the service (phone number, optional email, transaction history). This data is not sold to third parties.'}
          </p>
        </div>

        {isFr ? (
          <>
            <Section title="1. Données collectées" color="#10b981">
              <ul className="list-disc list-inside space-y-1.5 text-sm">
                {['Numéro de téléphone mobile', 'Nom complet (optionnel)', 'Email (optionnel)', 'Documents KYC (niveau 1 uniquement)', 'Historique des transactions', 'Adresse IP et données de connexion'].map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Section>

            <Section title="2. Utilisation des données" color="#10b981">
              <p className="text-sm leading-relaxed">Les données sont utilisées exclusivement pour la fourniture du service, la conformité réglementaire (LBC/FT) et la prévention de la fraude. Elles ne sont jamais vendues ni cédées à des tiers à des fins commerciales.</p>
            </Section>

            <Section title="3. Conservation" color="#10b981">
              <p className="text-sm leading-relaxed">Les données sont conservées pendant la durée d&apos;utilisation du service et au minimum 5 ans après la clôture du compte pour satisfaire aux obligations légales de traçabilité financière.</p>
            </Section>

            <Section title="4. Vos droits" color="#10b981">
              <p className="text-sm leading-relaxed mb-2">Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données.</p>
              <p className="text-sm">Contact : <a href="mailto:support@unipaycongo.com" style={{ color: '#10b981' }}>support@unipaycongo.com</a></p>
            </Section>
          </>
        ) : (
          <>
            <Section title="1. Data Collected" color="#10b981">
              <ul className="list-disc list-inside space-y-1.5 text-sm">
                {['Phone number', 'Full name (optional)', 'Email (optional)', 'KYC documents (level 1 only)', 'Transaction history', 'IP address and connection data'].map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Section>

            <Section title="2. Use of Data" color="#10b981">
              <p className="text-sm leading-relaxed">Data is used exclusively for service provision, regulatory compliance (AML/CFT), and fraud prevention. It is never sold or transferred to third parties for commercial purposes.</p>
            </Section>

            <Section title="3. Retention" color="#10b981">
              <p className="text-sm leading-relaxed">Data is retained for the duration of service use and a minimum of 5 years after account closure to meet legal financial traceability obligations.</p>
            </Section>

            <Section title="4. Your Rights" color="#10b981">
              <p className="text-sm leading-relaxed mb-2">You have the right to access, rectify, and delete your data.</p>
              <p className="text-sm">Contact: <a href="mailto:support@unipaycongo.com" style={{ color: '#10b981' }}>support@unipaycongo.com</a></p>
            </Section>
          </>
        )}

        <div className="rounded-xl border border-white/10 p-4 text-xs space-y-1" style={{ background: '#111827', color: '#6b7280' }}>
          <p><strong style={{ color: '#9ca3af' }}>Congo Gaming Limited S.a.r.l.</strong> — Kinshasa, {isFr ? 'RDC' : 'DRC'}</p>
          <p><strong style={{ color: '#9ca3af' }}>IA-Solution</strong> — Alès, France</p>
          <p><a href="mailto:support@unipaycongo.com" style={{ color: '#10b981' }}>support@unipaycongo.com</a></p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 p-5" style={{ background: '#111827' }}>
      <h2 className="text-sm font-bold mb-3" style={{ color }}>{title}</h2>
      <div style={{ color: '#e5e7eb' }}>{children}</div>
    </div>
  );
}
