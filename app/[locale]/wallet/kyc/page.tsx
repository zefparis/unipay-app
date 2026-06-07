'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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

function SelfiePicker({ preview, onChange }: { preview: string | null; onChange: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Selfie</p>
        <p className="text-xs text-gray-400 dark:text-slate-500">Prenez une photo de votre visage clairement visible</p>
      </div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-[#00A651] hover:text-[#00A651] dark:border-slate-600 dark:text-slate-500"
      >
        {preview ? (
          <img src={preview} alt="Selfie" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-9 w-9">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="text-xs font-medium">Prendre une photo</span>
          </div>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        name="selfie"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange(file);
        }}
      />
    </div>
  );
}

export default function KycPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

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
    return !!selfie;
  }

  async function handleSubmit() {
    if (!selfie) {
      setError('Le selfie est obligatoire');
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
        kyc_level: approved ? 1 : prev?.kyc_level ?? 0,
        is_verified: approved ? true : prev?.is_verified ?? false,
      }));
    } else {
      setError(data.error ?? 'Erreur lors de la soumission');
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
        color="amber"
        icon="⏳"
        badge="En cours de vérification (24-48h)"
        title="Dossier soumis"
        message="Votre identité est en cours de vérification."
      />
    );
  }

  if (status === 'approved') {
    return (
      <StatusScreen
        locale={locale}
        color="green"
        icon="✓"
        badge="Identité vérifiée ✓"
        title="KYC niveau 1 activé"
        message="Votre identité a été vérifiée avec succès."
        limits={KYC_LIMITS[1]}
      />
    );
  }

  if (status === 'rejected') {
    return (
      <StatusScreen
        locale={locale}
        color="red"
        icon="✕"
        badge="Dossier rejeté"
        title="Vérification refusée"
        message={sub?.reviewer_note ?? 'Votre dossier a été refusé. Veuillez le soumettre à nouveau.'}
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
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Vérification d&apos;identité</h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">KYC Niveau 1 avec PayGuard</p>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-5 px-4 pt-6">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="grid grid-cols-3 text-center">
            <div className="bg-gray-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-500 dark:bg-slate-700/50 dark:text-slate-400" />
            <div className="border-x border-gray-100 bg-amber-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-amber-600 dark:border-slate-700 dark:bg-amber-900/20 dark:text-amber-400">Niveau 0</div>
            <div className="bg-green-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-green-600 dark:bg-green-900/20 dark:text-green-400">Niveau 1</div>
          </div>
          {[
            { label: 'Dépôt/jour', l0: KYC_LIMITS[0].deposit, l1: KYC_LIMITS[1].deposit },
            { label: 'Retrait/jour', l0: KYC_LIMITS[0].withdraw, l1: KYC_LIMITS[1].withdraw },
            { label: 'P2P max', l0: KYC_LIMITS[0].p2p, l1: KYC_LIMITS[1].p2p },
          ].map(({ label, l0, l1 }) => (
            <div key={label} className="grid grid-cols-3 border-t border-gray-50 text-center dark:border-slate-700">
              <div className="px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400">{label}</div>
              <div className="border-x border-gray-50 px-3 py-3 text-xs text-gray-500 dark:border-slate-700 dark:text-slate-500">{l0}</div>
              <div className="px-3 py-3 text-xs font-semibold text-green-600 dark:text-green-400">{l1}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center gap-2">
            {[0, 1].map((item) => (
              <div key={item} className="flex flex-1 items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${item <= step ? 'bg-[#00A651] text-white' : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-500'}`}>
                  {item < step ? '✓' : item + 1}
                </div>
                {item === 0 && <div className={`h-0.5 flex-1 ${step > 0 ? 'bg-[#00A651]' : 'bg-gray-100 dark:bg-slate-700'}`} />}
              </div>
            ))}
          </div>

          {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-500 dark:bg-red-900/20">{error}</p>}

          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">Informations personnelles</h2>
              <Field label="Nom complet">
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Prénom Nom" className={inputClass} />
              </Field>
              <Field label="Date de naissance">
                <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Type de document">
                <select value={docType} onChange={(event) => setDocType(event.target.value)} className={inputClass}>
                  {DOC_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
              <Field label="Numéro du document">
                <input value={docNumber} onChange={(event) => setDocNumber(event.target.value)} placeholder="Numéro d'identification" className={inputClass} />
              </Field>
            </div>
          )}

          {step === 1 && <SelfiePicker preview={selfiePrev} onChange={setSelfieFile} />}

          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(0)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                Retour
              </button>
            )}
            {step === 0 ? (
              <button onClick={() => setStep(1)} disabled={!canProceed()} className="flex-1 rounded-xl bg-[#00A651] py-3 text-sm font-semibold text-white transition disabled:opacity-50">
                Continuer
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting || !canProceed()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#00A651] py-3 text-sm font-semibold text-white transition disabled:opacity-50">
                {submitting ? <><Spinner sm /> Envoi en cours…</> : 'Soumettre pour vérification'}
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

function StatusScreen({ locale, color, icon, badge, title, message, limits, onRetry }: {
  locale: string;
  color: 'amber' | 'green' | 'red';
  icon: string;
  badge: string;
  title: string;
  message: string;
  limits?: { deposit: string; withdraw: string; p2p: string };
  onRetry?: () => void;
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
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Vérification d&apos;identité</h1>
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
            {[["Dépôt/jour", limits.deposit], ["Retrait/jour", limits.withdraw], ["P2P max", limits.p2p]].map(([label, value]) => (
              <div key={label} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-500 dark:text-slate-400">{label}</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{value}</span>
              </div>
            ))}
          </div>
        )}
        {onRetry && (
          <button onClick={onRetry} className="rounded-xl bg-[#00A651] px-6 py-3 text-sm font-semibold text-white">
            Soumettre à nouveau
          </button>
        )}
        <Link href={`/${locale}/wallet`} className="text-sm text-gray-400 underline dark:text-slate-500">
          Retour au wallet
        </Link>
      </div>
    </div>
  );
}
