'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────
interface Submission {
  id: string; status: 'pending' | 'approved' | 'rejected';
  reviewer_note?: string | null; submitted_at: string;
}
interface KycStatus { submission: Submission | null; kyc_level: number; is_verified: boolean }

const KYC_LIMITS = {
  0: { deposit: '5 000 CDF/jour', withdraw: '5 000 CDF/jour', p2p: '2 000 CDF' },
  1: { deposit: '500 000 CDF/jour', withdraw: '200 000 CDF/jour', p2p: '100 000 CDF' },
};

const DOC_TYPES = [
  { value: 'national_id',       label: "Carte nationale d'identité" },
  { value: 'passport',          label: 'Passeport' },
  { value: 'driving_license',   label: 'Permis de conduire' },
];

// ── Spinner ────────────────────────────────────────────────────────────
function Spinner({ sm }: { sm?: boolean }) {
  return (
    <svg className={`animate-spin ${sm ? 'w-4 h-4' : 'w-6 h-6'} text-current`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── File Upload Preview ────────────────────────────────────────────────
function PhotoPicker({ label, hint, name, preview, onChange }: {
  label: string; hint: string; name: string;
  preview: string | null; onChange: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">{label}</p>
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">{hint}</p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-600 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-slate-500 hover:border-[#00A651] hover:text-[#00A651] transition overflow-hidden relative"
      >
        {preview ? (
          <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-90" />
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span className="text-xs font-medium">Prendre / Choisir une photo</span>
          </>
        )}
      </button>
      <input
        ref={ref} type="file" name={name} accept="image/*" capture="environment"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }}
      />
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────
function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
            ${i < current ? 'bg-[#00A651] text-white' : i === current ? 'bg-[#00A651] text-white ring-4 ring-[#00A651]/20' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'}`}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`flex-1 h-0.5 ${i < current ? 'bg-[#00A651]' : 'bg-gray-100 dark:bg-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function KycPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [kycStatus, setKycStatus]   = useState<KycStatus | null>(null);
  const [loading, setLoading]       = useState(true);
  const [step, setStep]             = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // Step 1 fields
  const [fullName, setFullName]   = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [docType, setDocType]     = useState('national_id');
  const [docNumber, setDocNumber] = useState('');

  // Step 2-3 files
  const [docFront, setDocFront]   = useState<File | null>(null);
  const [docBack, setDocBack]     = useState<File | null>(null);
  const [selfie, setSelfie]       = useState<File | null>(null);
  const [frontPrev, setFrontPrev] = useState<string | null>(null);
  const [backPrev, setBackPrev]   = useState<string | null>(null);
  const [selfiePrev, setSelfiePrev] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/wallet/kyc/status')
      .then(r => { if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; } return r.json(); })
      .then(d => { if (d) setKycStatus(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale, router]);

  function setFile(which: 'front' | 'back' | 'selfie', file: File) {
    const url = URL.createObjectURL(file);
    if (which === 'front')  { setDocFront(file);  setFrontPrev(url); }
    if (which === 'back')   { setDocBack(file);   setBackPrev(url); }
    if (which === 'selfie') { setSelfie(file);    setSelfiePrev(url); }
  }

  function canProceed() {
    if (step === 0) return fullName.trim().length >= 2 && docType;
    if (step === 1) return !!docFront;
    if (step === 2) return !!selfie;
    return false;
  }

  async function handleSubmit() {
    if (!docFront || !selfie) { setError('Les photos recto et selfie sont obligatoires'); return; }
    setSubmitting(true);
    setError('');

    const fd = new FormData();
    fd.append('doc_type',   docType);
    fd.append('full_name',  fullName.trim());
    fd.append('birth_date', birthDate);
    fd.append('doc_number', docNumber.trim());
    fd.append('doc_front',  docFront,  'front.jpg');
    if (docBack)  fd.append('doc_back', docBack, 'back.jpg');
    fd.append('selfie',     selfie,    'selfie.jpg');

    const r = await fetch('/api/wallet/kyc/submit', { method: 'POST', body: fd });
    const d = await r.json();
    setSubmitting(false);

    if (r.ok) {
      setKycStatus(prev => ({
        submission: { id: d.submission_id, status: 'pending', submitted_at: new Date().toISOString(), reviewer_note: null },
        kyc_level:  prev?.kyc_level ?? 0,
        is_verified: prev?.is_verified ?? false,
      }));
    } else {
      setError(d.error ?? 'Erreur lors de la soumission');
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
      <Spinner />
    </div>
  );

  const sub    = kycStatus?.submission;
  const status = sub?.status ?? null;

  // ── Status screens ──────────────────────────────────────────────────
  if (status === 'pending') return (
    <StatusScreen locale={locale} color="amber" icon="⏳"
      badge="En cours de vérification"
      title="Dossier soumis"
      message="Votre dossier est en cours d'examen. Délai estimé : 24 à 48h."
    />
  );
  if (status === 'approved') return (
    <StatusScreen locale={locale} color="green" icon="✓"
      badge="Identité vérifiée"
      title="KYC niveau 1 activé"
      message="Félicitations ! Vos limites ont été augmentées."
      limits={KYC_LIMITS[1]}
    />
  );
  if (status === 'rejected') return (
    <StatusScreen locale={locale} color="red" icon="✕"
      badge="Dossier rejeté"
      title="Vérification refusée"
      message={sub?.reviewer_note ?? 'Votre dossier a été refusé. Veuillez le soumettre à nouveau.'}
      onRetry={() => setKycStatus(s => s ? { ...s, submission: null } : s)}
    />
  );

  // ── Form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-28">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <Link href={`/${locale}/wallet/profile`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-600 dark:text-slate-400"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Vérification d&apos;identité</h1>
          <p className="text-xs text-gray-400 dark:text-slate-500">KYC Niveau 1</p>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-5 max-w-md mx-auto">

        {/* Limits table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-3 text-center">
            <div className="px-3 py-2 bg-gray-50 dark:bg-slate-700/50 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide" />
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide border-x border-gray-100 dark:border-slate-700">Niveau 0</div>
            <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">Niveau 1</div>
          </div>
          {[
            { label: 'Dépôt/jour', l0: KYC_LIMITS[0].deposit, l1: KYC_LIMITS[1].deposit },
            { label: 'Retrait/jour', l0: KYC_LIMITS[0].withdraw, l1: KYC_LIMITS[1].withdraw },
            { label: 'P2P max', l0: KYC_LIMITS[0].p2p, l1: KYC_LIMITS[1].p2p },
          ].map(({ label, l0, l1 }) => (
            <div key={label} className="grid grid-cols-3 text-center border-t border-gray-50 dark:border-slate-700">
              <div className="px-3 py-3 text-xs font-medium text-gray-600 dark:text-slate-400 text-left">{label}</div>
              <div className="px-3 py-3 text-xs text-gray-500 dark:text-slate-500 border-x border-gray-50 dark:border-slate-700">{l0}</div>
              <div className="px-3 py-3 text-xs font-semibold text-green-600 dark:text-green-400">{l1}</div>
            </div>
          ))}
        </div>

        {/* Stepper form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <Steps current={step} total={3} />

          {error && <p className="text-xs text-red-500 font-medium mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">{error}</p>}

          {/* Step 1: Infos personnelles */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">Informations personnelles</h2>
              <div>
                <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">Nom complet *</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Prénom Nom"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:border-[#00A651] transition" />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">Date de naissance</label>
                <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:border-[#00A651] transition" />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">Type de document *</label>
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:border-[#00A651] transition">
                  {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">Numéro du document</label>
                <input value={docNumber} onChange={e => setDocNumber(e.target.value)}
                  placeholder="Numéro d'identification"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:border-[#00A651] transition" />
              </div>
            </div>
          )}

          {/* Step 2: Photo recto */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">Photo du document — recto</h2>
              <PhotoPicker label="Recto du document" hint="Photo nette, bien éclairée, tous les coins visibles"
                name="doc_front" preview={frontPrev} onChange={f => setFile('front', f)} />
            </div>
          )}

          {/* Step 3: Photo verso + selfie */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">Photo verso &amp; selfie</h2>
              <PhotoPicker label="Verso du document (optionnel)" hint="Photo du verso si le document en a un"
                name="doc_back" preview={backPrev} onChange={f => setFile('back', f)} />
              <PhotoPicker label="Selfie avec le document *" hint="Tenez votre document à côté de votre visage"
                name="selfie" preview={selfiePrev} onChange={f => setFile('selfie', f)} />
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                Retour
              </button>
            )}
            {step < 2 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                className="flex-1 py-3 rounded-xl bg-[#00A651] text-white text-sm font-semibold disabled:opacity-50 transition">
                Continuer
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting || !canProceed()}
                className="flex-1 py-3 rounded-xl bg-[#00A651] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition">
                {submitting ? <><Spinner sm /> Envoi en cours…</> : 'Soumettre'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Status screen helper ───────────────────────────────────────────────
function StatusScreen({ locale, color, icon, badge, title, message, limits, onRetry }: {
  locale: string; color: 'amber' | 'green' | 'red'; icon: string;
  badge: string; title: string; message: string;
  limits?: { deposit: string; withdraw: string; p2p: string };
  onRetry?: () => void;
}) {
  const colors = {
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800/40', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    green: { bg: 'bg-green-50 dark:bg-green-900/10',   border: 'border-green-200 dark:border-green-800/40',   text: 'text-green-700 dark:text-green-400',   badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    red:   { bg: 'bg-red-50 dark:bg-red-900/10',       border: 'border-red-200 dark:border-red-800/40',       text: 'text-red-700 dark:text-red-400',       badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  }[color];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <Link href={`/${locale}/wallet/profile`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-600 dark:text-slate-400"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Vérification d&apos;identité</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 pb-20">
        <div className={`w-20 h-20 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center text-3xl`}>
          {icon}
        </div>
        <div className="text-center space-y-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colors.badge}`}>{badge}</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs">{message}</p>
        </div>
        {limits && (
          <div className="w-full max-w-xs bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 divide-y divide-gray-50 dark:divide-slate-700">
            {[['Dépôt/jour', limits.deposit], ['Retrait/jour', limits.withdraw], ['P2P max', limits.p2p]].map(([l, v]) => (
              <div key={l} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-500 dark:text-slate-400">{l}</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{v}</span>
              </div>
            ))}
          </div>
        )}
        {onRetry && (
          <button onClick={onRetry} className="px-6 py-3 rounded-xl bg-[#00A651] text-white font-semibold text-sm">
            Soumettre à nouveau
          </button>
        )}
        <Link href={`/${locale}/wallet`} className="text-sm text-gray-400 dark:text-slate-500 underline">
          Retour au wallet
        </Link>
      </div>
    </div>
  );
}
