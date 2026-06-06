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
  return <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-2 break-words">{children}</p>;
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{children}</li>;
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-lg mx-auto px-4 py-6">
        <BackButton />

        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Conditions Générales d&apos;Utilisation
        </h1>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-8">UniPay Congo — Version 1.0 — Juin 2026</p>

        <H2>1. Objet</H2>
        <P>
          UniPay Congo est un service de portefeuille électronique mobile opéré par Congo Gaming Limited S.a.r.l.
          (ci-après &laquo;&nbsp;CGL&nbsp;&raquo;), société de droit congolais immatriculée sous le numéro
          RCCM&nbsp;CD/KIN/RCCM/16-B-9723, titulaire des agréments ARPTC n°0573 et n°0574 (2023), autorisée à opérer
          en République Démocratique du Congo.
        </P>
        <P>
          Le service permet aux utilisateurs de déposer, retirer et transférer des fonds en Francs Congolais (CDF)
          via les réseaux Mobile Money.
        </P>

        <H2>2. Acceptation</H2>
        <P>
          L&apos;utilisation du service vaut acceptation pleine et entière des présentes CGU. Toute personne
          n&apos;acceptant pas ces conditions doit cesser d&apos;utiliser le service.
        </P>

        <H2>3. Conditions d&apos;inscription</H2>
        <ul className="list-disc list-inside space-y-1 mb-2 pl-1">
          <Li>Être âgé d&apos;au moins 18 ans</Li>
          <Li>Être résident en République Démocratique du Congo</Li>
          <Li>Disposer d&apos;un numéro de téléphone mobile actif</Li>
          <Li>Un seul compte par numéro de téléphone</Li>
          <Li>Fournir des informations exactes et à jour</Li>
        </ul>

        <H2>4. Code PIN et sécurité</H2>
        <P>
          L&apos;utilisateur est seul responsable de la confidentialité de son code PIN à 6 chiffres. CGL ne
          demandera jamais votre PIN. Toute opération effectuée avec le bon PIN est réputée avoir été effectuée par
          le titulaire du compte.
        </P>

        <H2>5. Opérations et limites</H2>
        <div className="rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden mb-2 text-sm">
          <div className="grid grid-cols-3 bg-gray-50 dark:bg-slate-800 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            <div className="px-3 py-2">Opération</div>
            <div className="px-3 py-2 border-x border-gray-100 dark:border-slate-700">Niveau 0</div>
            <div className="px-3 py-2">Niveau 1</div>
          </div>
          {[
            ['Dépôt/jour',      '5 000 CDF',   '500 000 CDF'],
            ['Retrait/jour',    '5 000 CDF',   '200 000 CDF'],
            ['Transfert P2P',   '2 000 CDF',   '100 000 CDF'],
          ].map(([op, l0, l1]) => (
            <div key={op} className="grid grid-cols-3 border-t border-gray-50 dark:border-slate-700 text-gray-700 dark:text-gray-300">
              <div className="px-3 py-2.5">{op}</div>
              <div className="px-3 py-2.5 border-x border-gray-50 dark:border-slate-700 text-amber-600 dark:text-amber-400">{l0}</div>
              <div className="px-3 py-2.5 text-green-600 dark:text-green-400 font-medium">{l1}</div>
            </div>
          ))}
        </div>

        <H2>6. Tarification</H2>
        <ul className="list-disc list-inside space-y-1 mb-2 pl-1">
          <Li>Dépôt : frais de 3&nbsp;% prélevés sur le montant déposé</Li>
          <Li>Retrait : gratuit (sous réserve des frais propres à l&apos;opérateur Mobile Money)</Li>
          <Li>Transfert P2P entre wallets UniPay : gratuit</Li>
        </ul>

        <H2>7. Lutte contre le blanchiment (LBC/FT)</H2>
        <P>
          Conformément à la loi n°04/016 du 19 juillet 2004 portant lutte contre le blanchiment des capitaux et le
          financement du terrorisme en RDC, CGL est tenu de vérifier l&apos;identité de ses utilisateurs et de
          signaler toute opération suspecte à la Cellule Nationale des Renseignements Financiers (CENAREF).
        </P>

        <H2>8. Suspension et clôture</H2>
        <P>CGL se réserve le droit de suspendre ou clôturer tout compte en cas de&nbsp;:</P>
        <ul className="list-disc list-inside space-y-1 mb-2 pl-1">
          <Li>Fourniture de fausses informations</Li>
          <Li>Activité suspecte ou frauduleuse</Li>
          <Li>Non-respect des présentes CGU</Li>
          <Li>Injonction d&apos;une autorité compétente</Li>
        </ul>

        <H2>9. Responsabilité</H2>
        <P>
          CGL ne peut être tenu responsable des interruptions ou dysfonctionnements des réseaux Mobile Money
          (Orange, Airtel, Vodacom/M-Pesa, Africell) qui sont des tiers indépendants. En cas d&apos;opération
          échouée, les fonds sont restitués dans un délai de 24 à 72 heures ouvrables.
        </P>

        <H2>10. Protection des données</H2>
        <P>
          Le traitement des données personnelles est soumis à la Politique de Confidentialité d&apos;UniPay Congo
          et aux dispositions applicables du droit congolais.
        </P>

        <H2>11. Loi applicable et juridiction</H2>
        <P>
          Les présentes CGU sont régies par le droit de la République Démocratique du Congo. Tout litige sera
          soumis à la compétence exclusive des tribunaux de Kinshasa/Gombe.
        </P>

        <H2>12. Modifications</H2>
        <P>
          CGL se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés
          par notification dans l&apos;application. La poursuite de l&apos;utilisation du service vaut acceptation
          des nouvelles conditions.
        </P>

        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-800 space-y-1">
          <p className="text-xs text-gray-400 dark:text-slate-500">contact@unipaycongo.com</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">195 Avenue Colonel Ebeya, Commune de la Gombe, Kinshasa, RDC</p>
        </div>
      </div>
    </div>
  );
}
