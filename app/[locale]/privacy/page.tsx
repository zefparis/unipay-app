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
  return <h2 className="text-base font-bold text-gray-900 dark:text-white mt-8 mb-2">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-2">{children}</p>;
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{children}</li>;
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <BackButton />

        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Politique de Confidentialité
        </h1>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-8">UniPay Congo — Version 1.0 — Juin 2026</p>

        <H2>1. Responsable du traitement</H2>
        <P>
          Congo Gaming Limited S.a.r.l. — 195 Av. Colonel Ebeya, Gombe, Kinshasa, RDC<br />
          RCCM CD/KIN/RCCM/16-B-9723 — contact@unipaycongo.com
        </P>

        <H2>2. Données collectées</H2>
        <ul className="list-disc list-inside space-y-1 mb-2 pl-1">
          <Li>Numéro de téléphone mobile</Li>
          <Li>Nom complet</Li>
          <Li>Date de naissance (niveau KYC 1)</Li>
          <Li>Copie de document d&apos;identité (niveau KYC 1)</Li>
          <Li>Photo selfie (niveau KYC 1)</Li>
          <Li>Historique des transactions</Li>
          <Li>Adresse IP et données de connexion</Li>
        </ul>

        <H2>3. Finalités du traitement</H2>
        <ul className="list-disc list-inside space-y-1 mb-2 pl-1">
          <Li>Exécution du service de portefeuille électronique</Li>
          <Li>Vérification d&apos;identité (KYC) conformément aux obligations réglementaires</Li>
          <Li>Prévention de la fraude et du blanchiment (LBC/FT)</Li>
          <Li>Amélioration du service</Li>
          <Li>Communication relative au compte</Li>
        </ul>

        <H2>4. Base légale</H2>
        <P>Le traitement est fondé sur&nbsp;:</P>
        <ul className="list-disc list-inside space-y-1 mb-2 pl-1">
          <Li>L&apos;exécution du contrat (CGU acceptées)</Li>
          <Li>Les obligations légales (loi n°04/016 du 19 juillet 2004, agréments ARPTC)</Li>
          <Li>L&apos;intérêt légitime de CGL (sécurité, prévention fraude)</Li>
        </ul>

        <H2>5. Destinataires</H2>
        <P>Les données sont transmises uniquement&nbsp;:</P>
        <ul className="list-disc list-inside space-y-1 mb-2 pl-1">
          <Li>Aux opérateurs Mobile Money (Orange, Airtel, Vodacom, Africell) pour l&apos;exécution des transactions</Li>
          <Li>À la CENAREF en cas d&apos;obligation légale de déclaration</Li>
          <Li>Aux prestataires techniques (Supabase, Vercel, Render) dans le cadre strict de l&apos;exécution du service</Li>
        </ul>

        <H2>6. Conservation</H2>
        <ul className="list-disc list-inside space-y-1 mb-2 pl-1">
          <Li>Données de compte : durée de vie du compte + 10 ans (obligations légales RDC)</Li>
          <Li>Documents KYC : 10 ans à compter de la soumission</Li>
          <Li>Historique transactions : 10 ans (droit comptable congolais)</Li>
          <Li>Données de connexion : 1 an</Li>
        </ul>

        <H2>7. Sécurité</H2>
        <ul className="list-disc list-inside space-y-1 mb-2 pl-1">
          <Li>Chiffrement des données en transit (HTTPS/TLS)</Li>
          <Li>Code PIN haché (bcrypt)</Li>
          <Li>Accès aux données restreint au personnel autorisé</Li>
          <Li>Documents KYC stockés dans un espace sécurisé non accessible publiquement</Li>
        </ul>

        <H2>8. Droits des utilisateurs</H2>
        <P>
          Conformément aux principes généraux applicables en RDC, vous disposez des droits suivants&nbsp;:
        </P>
        <ul className="list-disc list-inside space-y-1 mb-2 pl-1">
          <Li>Accès à vos données personnelles</Li>
          <Li>Rectification des données inexactes</Li>
          <Li>Suppression du compte (sous réserve des obligations de conservation légale)</Li>
          <Li>Opposition au traitement à des fins de prospection</Li>
        </ul>
        <P>Pour exercer vos droits&nbsp;: contact@unipaycongo.com</P>

        <H2>9. Modifications</H2>
        <P>
          CGL se réserve le droit de modifier la présente politique. Toute modification substantielle sera
          notifiée dans l&apos;application.
        </P>

        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-400 dark:text-slate-500">contact@unipaycongo.com</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">195 Avenue Colonel Ebeya, Commune de la Gombe, Kinshasa, RDC</p>
        </div>
      </div>
    </div>
  );
}
