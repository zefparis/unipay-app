'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { wT, type WalletDict } from '@/lib/i18n-wallet';
import { CognitiveTestFlow, type CognitiveData } from './cognitive/CognitiveTestFlow';
import { SelfieCapture } from './camera/SelfieCapture';

interface Submission {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_note?: string | null;
  submitted_at: string;
}

interface KycStatus {
  submission: Submission | null;
  kyc_level: number;
  is_verified: boolean;
}

const KYC_LIMITS = {
  0: { deposit: '5 000 CDF/jour', withdraw: '5 000 CDF/jour', p2p: '2 000 CDF' },
  1: { deposit: '500 000 CDF/jour', withdraw: '200 000 CDF/jour', p2p: '100 000 CDF' },
  2: { deposit: 'Illimité', withdraw: 'Illimité', p2p: 'Illimité' },
};

const DOC_TYPES = [
  { value: 'national_id', label: 'CNI' },
  { value: 'passport', label: 'Passeport' },
  { value: 'driving_license', label: 'Permis' },
];

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#00A651] dark:border-slate-600 dark:bg-slate-900 dark:text-white';

function Spinner({ sm }: { sm?: boolean }) {
  return (
    <svg className={`animate-spin ${sm ? 'w-4 h-4' : 'w-6 h-6'} text-current`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}


export default function KycPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const T = wT(locale ?? 'fr');

  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [docType, setDocType] = useState('national_id');
  const [docNumber, setDocNumber] = useState('');
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePrev, setSelfiePrev] = useState<string | null>(null);
  const [cognitiveData, setCognitiveData] = useState<CognitiveData | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  useEffect(() => {
    fetch('/api/wallet/kyc/status')
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/${locale}/wallet/login`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setKycStatus(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale, router]);

  function setSelfieFile(file: File) {
    if (selfiePrev) URL.revokeObjectURL(selfiePrev);
    setSelfie(file);
    setSelfiePrev(URL.createObjectURL(file));
  }

  function canProceed() {
    if (step === 0) {
      return fullName.trim().length >= 2 && birthDate.length > 0 && docType.length > 0 && docNumber.trim().length > 0;
    }
    if (step === 1) {
      return !!selfie;
    }
    return !!cognitiveData;
  }

  async function handleSubmit() {
    if (!selfie) {
      setError(T.err_kyc_selfie);
      return;
    }

    setSubmitting(true);
    setError('');

    const fd = new FormData();
    fd.append('doc_type', docType);
    fd.append('full_name', fullName.trim());
    fd.append('birth_date', birthDate);
    fd.append('doc_number', docNumber.trim());
    fd.append('selfie', selfie, 'selfie.jpg');

    if (cognitiveData) {
      fd.append('cognitive_data', JSON.stringify(cognitiveData));
    }

    const res = await fetch('/api/wallet/kyc/submit', { method: 'POST', body: fd });
    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      const approved = data.auto_approved === true;
      setKycStatus((prev) => ({
        submission: {
          id: data.submission_id,
          status: approved ? 'approved' : 'pending',
          submitted_at: new Date().toISOString(),
          reviewer_note: null,
        },
        kyc_level: approved ? (data.kyc_level ?? 1) : prev?.kyc_level ?? 0,
        is_verified: approved ? true : prev?.is_verified ?? false,
      }));
    } else {
      setError(data.error ?? T.err_kyc_submit);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Spinner />
      </div>
    );
  }

  const sub = kycStatus?.submission;
  const status = sub?.status ?? null;

  if (status === 'pending') {
    return (
      <StatusScreen
        locale={locale}
        T={T}
        color="amber"
        icon="⏳"
        badge={T.kyc_pending_badge}
        title={T.kyc_pending_title}
        message={T.kyc_pending_msg}
      />
    );
  }

  if (status === 'approved' || (kycStatus && kycStatus.kyc_level >= 1)) {
    const kycLevel = kycStatus?.kyc_level ?? 1;

    if (showUpgradeFlow) {
      return (
        <div className="min-h-screen bg-gray-50 pb-28 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 pb-4 pt-12 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => { setShowUpgradeFlow(false); setUpgradeError(''); }}
              className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-gray-600 dark:text-slate-400"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Upgrade KYC 2</h1>
              <p className="text-xs text-gray-500 dark:text-slate-500">Tests cognitifs de sécurité</p>
            </div>
          </div>

          <div className="mx-auto max-w-md px-4 pt-6">
            {upgradeError && (
              <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {upgradeError}
              </div>
            )}

            {upgrading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <Spinner />
                <p className="text-sm text-gray-500 dark:text-slate-400">Analyse de sécurité en cours...</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <CognitiveTestFlow
                  onComplete={async (data) => {
                    setUpgrading(true);
                    setUpgradeError('');
                    try {
                      const res = await fetch('/api/wallet/kyc/upgrade-cognitive', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cognitive_data: data }),
                      });
                      const result = await res.json();
                      setUpgrading(false);

                      if (res.ok && result.success) {
                        const statusRes = await fetch('/api/wallet/kyc/status');
                        const newStatus = await statusRes.json();
                        if (newStatus) setKycStatus(newStatus);
                        setShowUpgradeFlow(false);
                      } else {
                        setUpgradeError(result.error ?? "Échec de l'upgrade. Réessayez.");
                      }
                    } catch {
                      setUpgrading(false);
                      setUpgradeError('Erreur réseau. Réessayez.');
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <StatusScreen
        locale={locale}
        T={T}
        color="green"
        icon="✓"
        badge={T.kyc_approved_badge}
        title={T.kyc_approved_title}
        message={T.kyc_approved_msg}
        limits={KYC_LIMITS[kycLevel as 0 | 1 | 2] ?? KYC_LIMITS[1]}
        kycLevel={kycLevel}
        onUpgrade={kycLevel === 1 ? () => { setShowUpgradeFlow(true); setUpgradeError(''); } : undefined}
      />
    );
  }

  if (status === 'rejected') {
    return (
      <StatusScreen
        locale={locale}
        T={T}
        color="red"
        icon="✕"
        badge={T.kyc_rejected_badge}
        title={T.kyc_rejected_title}
        message={sub?.reviewer_note ?? T.kyc_rejected_default}
        onRetry={() => setKycStatus((value) => (value ? { ...value, submission: null } : value))}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 pb-4 pt-12 dark:border-slate-800 dark:bg-slate-900">
        <Link href={`/${locale}/wallet/profile`} className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-slate-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-gray-600 dark:text-slate-400"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{T.kyc_title}</h1>
          <p className="text-xs text-gray-500 dark:text-slate-500">{T.kyc_subtitle}</p>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-5 px-4 pt-6">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="grid grid-cols-4 text-center">
            <div className="bg-gray-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-500 dark:bg-slate-700/50 dark:text-slate-400" />
            <div className="border-x border-gray-100 bg-amber-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-amber-600 dark:border-slate-700 dark:bg-amber-900/20 dark:text-amber-400">{T.kyc_lvl0}</div>
            <div className="bg-green-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-green-600 dark:bg-green-900/20 dark:text-green-400">{T.kyc_lvl1}</div>
            <div className="bg-blue-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">KYC 2</div>
          </div>
          {[
            { label: T.kyc_dep_day, l0: KYC_LIMITS[0].deposit, l1: KYC_LIMITS[1].deposit, l2: KYC_LIMITS[2].deposit },
            { label: T.kyc_wd_day, l0: KYC_LIMITS[0].withdraw, l1: KYC_LIMITS[1].withdraw, l2: KYC_LIMITS[2].withdraw },
            { label: T.kyc_p2p_max, l0: KYC_LIMITS[0].p2p, l1: KYC_LIMITS[1].p2p, l2: KYC_LIMITS[2].p2p },
          ].map(({ label, l0, l1, l2 }) => (
            <div key={label} className="grid grid-cols-4 border-t border-gray-50 text-center dark:border-slate-700">
              <div className="px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400">{label}</div>
              <div className="border-x border-gray-50 px-3 py-3 text-xs text-gray-500 dark:border-slate-700 dark:text-slate-500">{l0}</div>
              <div className="border-r border-gray-50 px-3 py-3 text-xs font-semibold text-green-600 dark:border-slate-700 dark:text-green-400">{l1}</div>
              <div className="px-3 py-3 text-xs font-bold text-blue-600 dark:text-blue-400">{l2}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center gap-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex flex-1 items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${item <= step ? 'bg-[#00A651] text-white' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-500'}`}>
                  {item < step ? '✓' : item + 1}
                </div>
                {item < 2 && <div className={`h-0.5 flex-1 ${step > item ? 'bg-[#00A651]' : 'bg-gray-100 dark:bg-slate-700'}`} />}
              </div>
            ))}
          </div>

          {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-500 dark:bg-red-900/20">{error}</p>}

          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">{T.kyc_personal}</h2>
              <Field label={T.kyc_fullname}>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Prénom Nom" className={inputClass} />
              </Field>
              <Field label={T.kyc_birthdate}>
                <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className={inputClass} />
              </Field>
              <Field label={T.kyc_doctype}>
                <select value={docType} onChange={(event) => setDocType(event.target.value)} className={inputClass}>
                  {DOC_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
              <Field label={T.kyc_docnumber}>
                <input value={docNumber} onChange={(event) => setDocNumber(event.target.value)} placeholder={T.kyc_doc_hint} className={inputClass} />
              </Field>
            </div>
          )}

          {step === 1 && <SelfieCapture T={T} onChange={setSelfieFile} />}

          {step === 2 && (
            <CognitiveTestFlow onComplete={(data) => setCognitiveData(data)} />
          )}

          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                {T.kyc_back}
              </button>
            )}
            {step < 2 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="flex-1 rounded-xl bg-[#00A651] py-3 text-sm font-semibold text-white transition disabled:opacity-50">
                {T.kyc_continue}
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting || !cognitiveData} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#00A651] py-3 text-sm font-semibold text-white transition disabled:opacity-50">
                {submitting ? <><Spinner sm /> {T.kyc_submitting}</> : T.kyc_submit}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-gray-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function StatusScreen({ locale, T, color, icon, badge, title, message, limits, onRetry, kycLevel, onUpgrade }: {
  locale: string;
  T: WalletDict;
  color: 'amber' | 'green' | 'red';
  icon: string;
  badge: string;
  title: string;
  message: string;
  limits?: { deposit: string; withdraw: string; p2p: string };
  onRetry?: () => void;
  kycLevel?: number;
  onUpgrade?: () => void;
}) {
  const colors = {
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800/40', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    green: { bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-200 dark:border-green-800/40', text: 'text-green-700 dark:text-green-400', badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    red: { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800/40', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  }[color];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 pb-4 pt-12 dark:border-slate-800 dark:bg-slate-900">
        <Link href={`/${locale}/wallet/profile`} className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-slate-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-gray-600 dark:text-slate-400"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{T.kyc_title}</h1>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-20">
        <div className={`flex h-20 w-20 items-center justify-center rounded-full border-2 text-3xl ${colors.bg} ${colors.border}`}>
          {icon}
        </div>
        <div className="space-y-2 text-center">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${colors.badge}`}>{badge}</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="max-w-xs text-sm text-gray-500 dark:text-slate-400">{message}</p>
        </div>
        {limits && (
          <div className="w-full max-w-xs divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
            {[[T.kyc_dep_day, limits.deposit], [T.kyc_wd_day, limits.withdraw], [T.kyc_p2p_max, limits.p2p]].map(([label, value]) => (
              <div key={label} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-500 dark:text-slate-400">{label}</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{value}</span>
              </div>
            ))}
          </div>
        )}
        {onRetry && (
          <button onClick={onRetry} className="rounded-xl bg-[#00A651] px-6 py-3 text-sm font-semibold text-white">
            {T.kyc_retry}
          </button>
        )}
        {onUpgrade && kycLevel === 1 && (
          <div className="w-full max-w-xs space-y-3">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-800/40 dark:bg-blue-900/10">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                Passez au niveau 2 pour supprimer toutes les limites
              </p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-500">
                Complétez un test rapide de sécurité supplémentaire (réflexe, couleur, mémoire, voix)
              </p>
              <button
                onClick={onUpgrade}
                className="mt-3 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Compléter le test
              </button>
            </div>
          </div>
        )}
        {kycLevel === 2 && (
          <div className="rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Niveau maximum atteint ✓
          </div>
        )}
        <Link href={`/${locale}/wallet`} className="text-sm text-gray-500 underline dark:text-slate-500">
          {T.kyc_wallet_back}
        </Link>
      </div>
    </div>
  );
}
