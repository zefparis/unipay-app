'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

const SECTIONS_FR = [
  { id: 'section-1',  title: '1. Présentation du service' },
  { id: 'section-2',  title: '2. Acceptation des conditions' },
  { id: 'section-3',  title: '3. Éligibilité et inscription' },
  { id: 'section-4',  title: '4. Nature du wallet et des actifs' },
  { id: 'section-5',  title: '5. Usages autorisés et interdits' },
  { id: 'section-6',  title: '6. Limites et frais' },
  { id: 'section-7',  title: '7. Responsabilité' },
  { id: 'section-8',  title: '8. Protection des données' },
  { id: 'section-9',  title: '9. Lutte contre le blanchiment' },
  { id: 'section-10', title: '10. Suspension de compte' },
  { id: 'section-11', title: '11. Droit applicable' },
  { id: 'section-12', title: '12. Contact' },
];

const SECTIONS_EN = [
  { id: 'section-1',  title: '1. About the Service' },
  { id: 'section-2',  title: '2. Acceptance of Terms' },
  { id: 'section-3',  title: '3. Eligibility and Registration' },
  { id: 'section-4',  title: '4. Wallet and Digital Assets' },
  { id: 'section-5',  title: '5. Permitted and Prohibited Uses' },
  { id: 'section-6',  title: '6. Limits and Fees' },
  { id: 'section-7',  title: '7. Liability' },
  { id: 'section-8',  title: '8. Personal Data Protection' },
  { id: 'section-9',  title: '9. Anti-Money Laundering' },
  { id: 'section-10', title: '10. Account Suspension' },
  { id: 'section-11', title: '11. Governing Law' },
  { id: 'section-12', title: '12. Contact' },
];

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-base font-bold mt-8 mb-3" style={{ color: '#10b981' }}>
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed mb-3" style={{ color: '#e5e7eb' }}>{children}</p>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1.5 mb-3 pl-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm leading-relaxed" style={{ color: '#e5e7eb' }}>{item}</li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const isFr = locale !== 'en';
  const sections = isFr ? SECTIONS_FR : SECTIONS_EN;
  const [tocOpen, setTocOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: '#0a0f1e' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b border-white/10" style={{ background: '#0a0f1e' }}>
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-white/10 transition flex-shrink-0"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" style={{ color: '#e5e7eb' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate" style={{ color: '#f9fafb' }}>
            {isFr ? 'Conditions Générales d\'Utilisation' : 'Terms of Service'}
          </h1>
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            UniPay Congo — {isFr ? 'Version 1.0 — Juin 2026' : 'Version 1.0 — June 2026'}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 pb-28 lg:flex lg:gap-8">

        {/* Table of Contents — desktop sticky / mobile collapsible */}
        <aside className="lg:w-64 lg:flex-shrink-0">
          {/* Mobile toggle */}
          <button
            onClick={() => setTocOpen(v => !v)}
            className="lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-xl mb-4 border border-white/10 text-sm font-semibold"
            style={{ background: '#111827', color: '#e5e7eb' }}
          >
            <span>{isFr ? 'Table des matières' : 'Table of contents'}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-transform ${tocOpen ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <nav
            className={`rounded-xl border border-white/10 p-4 lg:sticky lg:top-16 ${tocOpen ? 'block mb-4' : 'hidden lg:block'}`}
            style={{ background: '#111827' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#6b7280' }}>
              {isFr ? 'Sommaire' : 'Contents'}
            </p>
            <ul className="space-y-1.5">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => setTocOpen(false)}
                    className="text-xs leading-relaxed hover:opacity-100 transition block py-0.5"
                    style={{ color: '#9ca3af' }}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {isFr ? (
            <>
              <section id="section-1">
                <SectionTitle id="section-1">1. Présentation du service</SectionTitle>
                <P>UniPay Congo est une application de portefeuille numérique éditée par <strong style={{ color: '#f9fafb' }}>Congo Gaming Limited S.a.r.l.</strong> (RCCM CD/KIN/RCCM/16-B-9723, Kinshasa, RDC) et développée par <strong style={{ color: '#f9fafb' }}>IA-Solution</strong> (SIRET 438 055 097 00036, Alès, France).</P>
                <P>UniPay Congo permet à ses utilisateurs de :</P>
                <Ul items={[
                  'Stocker et gérer des valeurs numériques (CDF, USD, USDT, CGLT)',
                  'Envoyer et recevoir des fonds via Mobile Money, carte bancaire, et réseau blockchain BSC',
                  'Effectuer des échanges (swap) entre devises supportées',
                  'Interagir avec l\'écosystème Congo Gaming et ses partenaires',
                ]} />
                <P><strong style={{ color: '#f9fafb' }}>UniPay Congo n&apos;est pas une banque.</strong> Le service opère en tant qu&apos;agrégateur de paiement et gestionnaire de portefeuille numérique sous la licence ARPTC n°0573/0574 accordée à Congo Gaming Limited.</P>
              </section>

              <section id="section-2">
                <SectionTitle id="section-2">2. Acceptation des conditions</SectionTitle>
                <P>L&apos;utilisation de l&apos;application UniPay Congo implique l&apos;acceptation pleine et entière des présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous devez cesser immédiatement toute utilisation du service.</P>
                <P>Ces conditions peuvent être mises à jour à tout moment. Les utilisateurs seront notifiés des modifications substantielles par email ou notification in-app.</P>
              </section>

              <section id="section-3">
                <SectionTitle id="section-3">3. Éligibilité et inscription</SectionTitle>
                <P>Pour utiliser UniPay Congo, vous devez :</P>
                <Ul items={[
                  'Être âgé d\'au moins 18 ans',
                  'Disposer d\'un numéro de téléphone valide',
                  'Ne pas faire l\'objet d\'une interdiction légale d\'utiliser ce type de service',
                  'Fournir des informations exactes lors de l\'inscription',
                ]} />
                <P>L&apos;inscription se fait par numéro de téléphone et code PIN à 6 chiffres. Vous êtes seul responsable de la confidentialité de votre PIN. Toute transaction effectuée avec votre PIN est réputée avoir été initiée par vous.</P>
              </section>

              <section id="section-4">
                <SectionTitle id="section-4">4. Nature du wallet et des actifs numériques</SectionTitle>
                <P><strong style={{ color: '#10b981' }}>4.1 Wallet non-bancaire —</strong> Le solde UniPay Congo n&apos;est pas un dépôt bancaire et ne bénéficie d&apos;aucune garantie de l&apos;État.</P>
                <P><strong style={{ color: '#10b981' }}>4.2 CGLT et wCGLT —</strong> Le CGLT est un <strong style={{ color: '#f9fafb' }}>token utilitaire interne</strong> à l&apos;écosystème Congo Gaming. Il n&apos;est pas un instrument financier, une valeur mobilière, ni une monnaie légale. Le wCGLT est sa représentation sur le réseau BSC (BEP-20).</P>
                <P><strong style={{ color: '#10b981' }}>4.3 Infrastructure blockchain expérimentale —</strong> L&apos;infrastructure blockchain CGLT (chainId 242626) est en déploiement progressif et peut évoluer, migrer ou être temporairement indisponible.</P>
                <P><strong style={{ color: '#10b981' }}>4.4 USDT et cryptomonnaies —</strong> Les transactions crypto sont soumises aux risques de volatilité, techniques et de liquidité. UniPay Congo ne garantit pas la valeur des actifs cryptographiques.</P>
              </section>

              <section id="section-5">
                <SectionTitle id="section-5">5. Usages autorisés et interdits</SectionTitle>
                <P><strong style={{ color: '#f9fafb' }}>Usages autorisés :</strong> transferts personnels et familiaux, paiements marchands, Mobile Money, crypto BSC/BEP-20, services Congo Gaming.</P>
                <P><strong style={{ color: '#f9fafb' }}>Usages strictement interdits :</strong></P>
                <Ul items={[
                  'Blanchiment d\'argent ou financement du terrorisme',
                  'Toute activité illégale selon les lois de la RDC, de la France, ou du pays de résidence',
                  'Contournement de sanctions internationales',
                  'Transactions pour compte de tiers sans autorisation légale',
                  'Fraude, usurpation d\'identité ou manipulation du système',
                ]} />
              </section>

              <section id="section-6">
                <SectionTitle id="section-6">6. Limites et frais</SectionTitle>
                <P>Des limites de transactions s&apos;appliquent en fonction du profil utilisateur et des réglementations en vigueur. UniPay Congo peut modifier ces limites à tout moment.</P>
                <P>Les frais applicables sont affichés dans l&apos;application avant la confirmation de chaque transaction. La grille tarifaire peut être modifiée avec un préavis de 30 jours.</P>
              </section>

              <section id="section-7">
                <SectionTitle id="section-7">7. Responsabilité</SectionTitle>
                <P>UniPay Congo ne saurait être tenu responsable des pertes résultant de :</P>
                <Ul items={[
                  'Divulgation de votre PIN ou utilisation non autorisée de votre compte',
                  'Interruptions dues à des pannes réseau, opérateurs Mobile Money ou congestion blockchain',
                  'Pertes de valeur des actifs cryptographiques',
                  'Adresses de destination incorrectes fournies par l\'utilisateur',
                ]} />
                <P><strong style={{ color: '#ef4444' }}>Les transactions blockchain (USDT, wCGLT) sont irréversibles.</strong> UniPay Congo ne peut pas annuler ou rembourser une transaction blockchain confirmée.</P>
              </section>

              <section id="section-8">
                <SectionTitle id="section-8">8. Protection des données</SectionTitle>
                <P>Les données collectées (numéro de téléphone, email optionnel, historique des transactions) sont utilisées exclusivement pour la fourniture du service et la conformité réglementaire. Elles ne sont pas vendues à des tiers.</P>
                <P>Droit d&apos;accès, de rectification et de suppression : <a href="mailto:support@unipaycongo.com" style={{ color: '#10b981' }}>support@unipaycongo.com</a>. Conservation minimum 5 ans pour obligations légales.</P>
              </section>

              <section id="section-9">
                <SectionTitle id="section-9">9. Lutte contre le blanchiment (LBC/FT)</SectionTitle>
                <P>Congo Gaming Limited applique une politique stricte LBC/FT. UniPay Congo se réserve le droit de bloquer toute transaction suspecte, demander des justificatifs d&apos;origine des fonds, signaler aux autorités compétentes et fermer tout compte présentant des risques.</P>
              </section>

              <section id="section-10">
                <SectionTitle id="section-10">10. Suspension de compte</SectionTitle>
                <P>UniPay Congo peut suspendre ou clôturer tout compte sans préavis en cas de violation des présentes CGU, activité frauduleuse, demande des autorités, ou non-conformité. Le solde résiduel sera restitué sous réserve des obligations légales.</P>
              </section>

              <section id="section-11">
                <SectionTitle id="section-11">11. Droit applicable</SectionTitle>
                <P>Les présentes CGU sont régies par le droit de la <strong style={{ color: '#f9fafb' }}>République Démocratique du Congo</strong>. Juridiction compétente : <strong style={{ color: '#f9fafb' }}>Kinshasa</strong>. Pour les résidents français, le droit français de la consommation s&apos;applique également.</P>
              </section>

              <section id="section-12">
                <SectionTitle id="section-12">12. Contact</SectionTitle>
                <div className="rounded-xl border border-white/10 p-4 text-sm space-y-1" style={{ background: '#111827', color: '#9ca3af' }}>
                  <p><strong style={{ color: '#e5e7eb' }}>Congo Gaming Limited S.a.r.l.</strong> — Kinshasa, RDC — RCCM CD/KIN/RCCM/16-B-9723</p>
                  <p><strong style={{ color: '#e5e7eb' }}>IA-Solution</strong> — Alès, France — SIRET 438 055 097 00036</p>
                  <p>Support : <a href="mailto:support@unipaycongo.com" style={{ color: '#10b981' }}>support@unipaycongo.com</a></p>
                  <p>Site : <a href="https://unipaycongo.com" target="_blank" rel="noopener noreferrer" style={{ color: '#10b981' }}>unipaycongo.com</a></p>
                </div>
              </section>
            </>
          ) : (
            <>
              <section id="section-1">
                <SectionTitle id="section-1">1. About the Service</SectionTitle>
                <P>UniPay Congo is a digital wallet application published by <strong style={{ color: '#f9fafb' }}>Congo Gaming Limited S.a.r.l.</strong> (RCCM CD/KIN/RCCM/16-B-9723, Kinshasa, DRC) and developed by <strong style={{ color: '#f9fafb' }}>IA-Solution</strong> (SIRET 438 055 097 00036, Alès, France).</P>
                <P>UniPay Congo enables its users to:</P>
                <Ul items={[
                  'Store and manage digital values (CDF, USD, USDT, CGLT)',
                  'Send and receive funds via Mobile Money, bank card, and BSC blockchain network',
                  'Exchange (swap) between supported currencies',
                  'Interact with the Congo Gaming ecosystem and its partners',
                ]} />
                <P><strong style={{ color: '#f9fafb' }}>UniPay Congo is not a bank.</strong> The service operates as a payment aggregator and digital wallet manager under ARPTC license n°0573/0574 granted to Congo Gaming Limited.</P>
              </section>

              <section id="section-2">
                <SectionTitle id="section-2">2. Acceptance of Terms</SectionTitle>
                <P>Using the UniPay Congo application implies full and unconditional acceptance of these Terms of Service. If you do not accept these terms, you must immediately stop using the service.</P>
                <P>These terms may be updated at any time. Users will be notified of substantial changes by email or in-app notification.</P>
              </section>

              <section id="section-3">
                <SectionTitle id="section-3">3. Eligibility and Registration</SectionTitle>
                <P>To use UniPay Congo, you must:</P>
                <Ul items={[
                  'Be at least 18 years old',
                  'Have a valid phone number',
                  'Not be legally prohibited from using this type of service in your country',
                  'Provide accurate information during registration',
                ]} />
                <P>Registration is done via phone number and a 6-digit PIN. You are solely responsible for the confidentiality of your PIN. Any transaction made with your PIN is deemed to have been initiated by you.</P>
              </section>

              <section id="section-4">
                <SectionTitle id="section-4">4. Wallet and Digital Assets</SectionTitle>
                <P><strong style={{ color: '#10b981' }}>4.1 Non-Banking Wallet —</strong> The UniPay Congo balance is not a bank deposit and does not benefit from any state guarantee.</P>
                <P><strong style={{ color: '#10b981' }}>4.2 CGLT and wCGLT —</strong> CGLT is a <strong style={{ color: '#f9fafb' }}>utility token internal</strong> to the Congo Gaming ecosystem. It is not a financial instrument, a security, or legal tender. wCGLT is its representation on the BSC network (BEP-20).</P>
                <P><strong style={{ color: '#10b981' }}>4.3 Experimental Blockchain —</strong> The CGLT blockchain infrastructure (chainId 242626) is in progressive deployment and may evolve, migrate, or be temporarily unavailable.</P>
                <P><strong style={{ color: '#10b981' }}>4.4 USDT and Cryptocurrencies —</strong> Crypto transactions are subject to volatility, technical and liquidity risks. UniPay Congo does not guarantee the value of cryptographic assets.</P>
              </section>

              <section id="section-5">
                <SectionTitle id="section-5">5. Permitted and Prohibited Uses</SectionTitle>
                <P><strong style={{ color: '#f9fafb' }}>Permitted uses:</strong> personal and family transfers, merchant payments, Mobile Money, BSC/BEP-20 crypto, Congo Gaming services.</P>
                <P><strong style={{ color: '#f9fafb' }}>Strictly prohibited uses:</strong></P>
                <Ul items={[
                  'Money laundering or terrorist financing',
                  'Any illegal activity under the laws of the DRC, France, or your country of residence',
                  'Circumventing international sanctions',
                  'Transactions on behalf of third parties without legal authorization',
                  'Fraud, identity theft, or system manipulation',
                ]} />
              </section>

              <section id="section-6">
                <SectionTitle id="section-6">6. Limits and Fees</SectionTitle>
                <P>Transaction limits may apply depending on the user profile and applicable regulations. UniPay Congo may modify these limits at any time.</P>
                <P>Applicable fees are displayed in the application before each transaction confirmation. The fee schedule may be modified with 30 days&apos; notice.</P>
              </section>

              <section id="section-7">
                <SectionTitle id="section-7">7. Liability</SectionTitle>
                <P>UniPay Congo shall not be held liable for losses resulting from:</P>
                <Ul items={[
                  'Disclosure of your PIN or unauthorized use of your account',
                  'Interruptions due to network outages, Mobile Money operators, or blockchain congestion',
                  'Losses in value of cryptographic assets',
                  'Incorrect destination addresses provided by the user',
                ]} />
                <P><strong style={{ color: '#ef4444' }}>Blockchain transactions (USDT, wCGLT) are irreversible.</strong> UniPay Congo cannot cancel or refund a confirmed blockchain transaction.</P>
              </section>

              <section id="section-8">
                <SectionTitle id="section-8">8. Personal Data Protection</SectionTitle>
                <P>Data collected (phone number, optional email, transaction history) is used exclusively for service provision and regulatory compliance. It is not sold to third parties.</P>
                <P>Right of access, rectification, and deletion: <a href="mailto:support@unipaycongo.com" style={{ color: '#10b981' }}>support@unipaycongo.com</a>. Data retained minimum 5 years for legal obligations.</P>
              </section>

              <section id="section-9">
                <SectionTitle id="section-9">9. Anti-Money Laundering (AML/CFT)</SectionTitle>
                <P>Congo Gaming Limited applies a strict AML/CFT policy. UniPay Congo reserves the right to block suspicious transactions, request proof of funds origin, report to competent authorities, and close any account presenting AML/CFT risks.</P>
              </section>

              <section id="section-10">
                <SectionTitle id="section-10">10. Account Suspension</SectionTitle>
                <P>UniPay Congo may suspend or close any account without notice in case of Terms of Service violation, fraudulent activity, authority request, or non-compliance. The residual balance will be returned subject to legal obligations.</P>
              </section>

              <section id="section-11">
                <SectionTitle id="section-11">11. Governing Law</SectionTitle>
                <P>These Terms are governed by the law of the <strong style={{ color: '#f9fafb' }}>Democratic Republic of Congo</strong>. Jurisdiction: <strong style={{ color: '#f9fafb' }}>Kinshasa</strong>. For users residing in France, mandatory French consumer law also applies.</P>
              </section>

              <section id="section-12">
                <SectionTitle id="section-12">12. Contact</SectionTitle>
                <div className="rounded-xl border border-white/10 p-4 text-sm space-y-1" style={{ background: '#111827', color: '#9ca3af' }}>
                  <p><strong style={{ color: '#e5e7eb' }}>Congo Gaming Limited S.a.r.l.</strong> — Kinshasa, DRC — RCCM CD/KIN/RCCM/16-B-9723</p>
                  <p><strong style={{ color: '#e5e7eb' }}>IA-Solution</strong> — Alès, France — SIRET 438 055 097 00036</p>
                  <p>Support: <a href="mailto:support@unipaycongo.com" style={{ color: '#10b981' }}>support@unipaycongo.com</a></p>
                  <p>Website: <a href="https://unipaycongo.com" target="_blank" rel="noopener noreferrer" style={{ color: '#10b981' }}>unipaycongo.com</a></p>
                </div>
              </section>
            </>
          )}

          {/* CTA */}
          <div className="mt-10 pt-6 border-t border-white/10">
            <Link
              href={`/${locale}/wallet/register`}
              className="flex items-center justify-center gap-2 w-full h-[52px] rounded-xl font-bold text-base transition-all"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff' }}
            >
              {isFr ? 'Accepter et créer mon wallet' : 'Accept and create my wallet'}
            </Link>
            <p className="text-center text-xs mt-3" style={{ color: '#6b7280' }}>
              {isFr ? 'En continuant, vous acceptez ces conditions.' : 'By continuing, you accept these terms.'}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
