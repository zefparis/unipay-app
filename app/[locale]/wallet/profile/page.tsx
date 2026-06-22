'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, ExternalLink, X } from 'lucide-react';
import { wT } from '@/lib/i18n-wallet';
import { useNotifications } from '@/hooks/useNotifications';


// ── Types ──────────────────────────────────────────────────────────────
interface Profile {
  wallet_id: string;
  phone: string;
  full_name: string | null;
  kyc_level: number;
  is_verified: boolean;
  balance_cdf: number;
  blockchain_address: string | null;
  cdp_wallet_address: string | null;
  created_at: string;
}
interface Tx { direction: string; status: string; amount: number; net_amount: number }
interface Stats { totalDeposited: number; totalWithdrawn: number; count: number }

// ── Toast ──────────────────────────────────────────────────────────────
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium shadow-xl animate-fade-in-up">
      {msg}
    </div>
  );
}

// ── Spinner ─────────────────────────────────────────────────────────────
function Spinner({ sm }: { sm?: boolean }) {
  const s = sm ? 'h-4 w-4' : 'h-6 w-6';
  return (
    <svg className={`animate-spin ${s} text-current`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── KYC Badge ──────────────────────────────────────────────────────────
function KycBadge({ level }: { level: number }) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const TT = wT(typeof window !== 'undefined' ? (document.documentElement.lang || 'fr') : 'fr');
  const cfg = level === 0
    ? { label: TT.prof_kyc_none,  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
    : level === 1
    ? { label: TT.prof_kyc_basic, cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    : { label: TT.prof_kyc_full,  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>;
}

// ── Section card wrapper ───────────────────────────────────────────────
function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
      {title && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">{title}</p>
        </div>
      )}
      {children}
    </div>
  );
}

// ── Row ────────────────────────────────────────────────────────────────
function Row({ icon, label, value, action }: { icon: React.ReactNode; label: string; value?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-slate-700/60 last:border-0">
      <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-gray-500 dark:text-slate-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 dark:text-slate-500">{label}</p>
        {value && <div className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{value}</div>}
      </div>
      {action}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────
const IcPhone   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-.54a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
const IcUser    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcCopy    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const IcPencil  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcLock    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const IcBell    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
const IcShare   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/></svg>;
const IcMail    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcDoc     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IcLogout  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcCheck   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>;
const IcCamera  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;

// ── Main Page ──────────────────────────────────────────────────────────
export default function WalletProfilePage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const T = wT(locale);

  const [profile, setProfile]       = useState<Profile | null>(null);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState('');

  // Avatar
  const [avatar, setAvatar]         = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Name edit
  const [editName, setEditName]     = useState(false);
  const [nameVal, setNameVal]       = useState('');
  const [savingName, setSavingName] = useState(false);

  // PIN change
  const [pinOpen, setPinOpen]       = useState(false);
  const [pinForm, setPinForm]       = useState({ current_pin: '', new_pin: '', confirm_pin: '' });
  const [pinSaving, setPinSaving]   = useState(false);
  const [pinError, setPinError]     = useState('');

  // Notifications toggle
  const [notifs, setNotifs]         = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const { requestPermission, subscribeToPush } = useNotifications();

  // Logout modal
  const [logoutModal, setLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAvatar(localStorage.getItem('wallet_avatar'));
    }
    // Load real notification preferences from backend
    fetch('/api/wallet/pref/notifications')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setNotifs(d.notif_enabled !== false); })
      .catch(() => {});

    Promise.all([
      fetch('/api/wallet/profile'),
      fetch('/api/wallet/transactions?limit=200'),
    ]).then(async ([rp, rt]) => {
      if (rp.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      const [pd, td] = await Promise.all([rp.json(), rt.ok ? rt.json() : { data: [] }]);
      setProfile(pd);
      setNameVal(pd.full_name ?? '');
      const txs: Tx[] = td.data ?? [];
      // TODO: Replace client-side computation with GET /v1/wallet/stats once the endpoint is available.
      // The current approach fetches up to 200 transactions and may under-report totals for active accounts.
      const totalDeposited = txs.filter(t => t.direction === 'collect' && t.status === 'success').reduce((s, t) => s + Number(t.amount), 0);
      const totalWithdrawn = txs.filter(t => t.direction === 'payout'  && t.status === 'success').reduce((s, t) => s + Number(t.amount), 0);
      setStats({ totalDeposited, totalWithdrawn, count: txs.length });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [locale, router]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { showToast(T.prof_img_format); return; }
    if (file.size > 2 * 1024 * 1024) { showToast(T.prof_img_size); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setAvatar(b64);
      localStorage.setItem('wallet_avatar', b64);
    };
    reader.readAsDataURL(file);
  }

  async function saveName() {
    if (!nameVal.trim() || nameVal.length < 2) return;
    setSavingName(true);
    const r = await fetch('/api/wallet/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: nameVal.trim() }),
    });
    setSavingName(false);
    if (r.ok) { setProfile(p => p ? { ...p, full_name: nameVal.trim() } : p); setEditName(false); showToast(T.prof_name_updated); }
    else showToast(T.prof_err_update);
  }

  async function changePin() {
    setPinError('');
    if (pinForm.new_pin !== pinForm.confirm_pin) { setPinError(T.prof_pin_mismatch); return; }
    if (pinForm.new_pin.length < 4) { setPinError(T.prof_pin_short); return; }
    setPinSaving(true);
    const r = await fetch('/api/wallet/auth/change-pin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pinForm),
    });
    const d = await r.json();
    setPinSaving(false);
    if (r.ok) { setPinOpen(false); setPinForm({ current_pin: '', new_pin: '', confirm_pin: '' }); showToast(T.prof_pin_updated); }
    else setPinError(d.error ?? T.prof_err_update);
  }

  function removeAvatar() {
    setAvatar(null);
    localStorage.removeItem('wallet_avatar');
    showToast(T.prof_avatar_del);
  }

  function copyBscAddress() {
    if (!profile?.blockchain_address) return;
    navigator.clipboard.writeText(profile.blockchain_address).then(() => showToast(T.prof_bsc_copied));
  }

  function copyCdpAddress() {
    if (!profile?.cdp_wallet_address) return;
    navigator.clipboard.writeText(profile.cdp_wallet_address).then(() => showToast(T.prof_cdp_copied));
  }

  function copyWalletId() {
    if (!profile?.wallet_id) return;
    navigator.clipboard.writeText(profile.wallet_id).then(() => showToast(T.prof_id_copied));
  }

  const userPhone = profile?.phone ?? '';
  const userName = profile?.full_name ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.unipaycongo.com';
  const qrValue = `${appUrl}/${locale}/wallet/send?phone=${encodeURIComponent(userPhone)}&name=${encodeURIComponent(userName)}`;
  const shareData = {
    title: 'UniPay Congo',
    text: T.prof_share_text,
    url: qrValue,
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.url);
      showToast(T.prof_link_copied);
    }
  };

  async function toggleNotifs() {
    const next = !notifs;
    setNotifs(next);
    setSavingNotifs(true);
    try {
      await fetch('/api/wallet/pref/notifications', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notif_enabled: next }),
      });
      if (next) {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          await requestPermission();
        } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
          showToast(
            locale === 'en'
              ? 'Enable notifications in your browser settings'
              : 'Activez les notifications dans les paramètres de votre navigateur'
          );
        } else if (Notification.permission === 'granted') {
          await subscribeToPush();
        }
      }
    } finally {
      setSavingNotifs(false);
    }
  }

  async function doLogout() {
    setLoggingOut(true);
    await fetch('/api/wallet/auth/logout', { method: 'POST' });
    localStorage.removeItem('wallet_token');
    localStorage.removeItem('wallet_phone');
    localStorage.removeItem('wallet_avatar');
    router.push(`/${locale}`);
  }

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const truncId = (id: string) => `${id.slice(0, 8)}...${id.slice(-5)}`;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
      <Spinner />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24">
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}

      {/* Logout modal */}
      {logoutModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center px-4 pt-4 pb-32">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <p className="text-base font-bold text-gray-900 dark:text-white text-center">{T.prof_logout_title}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center">{T.prof_logout_sub}</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setLogoutModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-semibold text-sm">{T.prof_cancel}</button>
              <button onClick={doLogout} disabled={loggingOut} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {loggingOut ? <Spinner sm /> : <IcLogout />} {T.prof_sign_out}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-600 dark:text-slate-400"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{T.prof_title}</h1>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-6">

        {/* ── Avatar + Nom ── */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#00A651]/10 overflow-hidden flex items-center justify-center border-2 border-[#00A651]/30">
              {avatar
                ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                : profile?.full_name
                  ? <span className="text-2xl font-bold text-[#00A651]">{profile.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}</span>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9 text-[#00A651]"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              }
            </div>
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#00A651] flex items-center justify-center shadow text-white">
              <IcCamera />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          {avatar && (
            <button
              onClick={removeAvatar}
              className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition"
            >
              <X size={12} /> {T.prof_delete_photo}
            </button>
          )}
          <div className="text-center">
            {editName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  className="text-base font-bold text-center bg-transparent border-b-2 border-[#00A651] outline-none text-gray-900 dark:text-white w-48"
                  autoFocus
                />
                <button onClick={saveName} disabled={savingName} className="text-[#00A651]">
                  {savingName ? <Spinner sm /> : <IcCheck />}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditName(true)} className="flex items-center gap-1.5 text-lg font-bold text-gray-900 dark:text-white">
                {profile?.full_name ?? T.prof_user} <span className="text-gray-400 dark:text-slate-500"><IcPencil /></span>
              </button>
            )}
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <p className="text-sm text-gray-400 dark:text-slate-500">{profile?.phone}</p>
              {profile?.is_verified ? (
                <span className="inline-flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400 font-medium">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {T.prof_verified}
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-xs text-gray-400 dark:text-slate-500 font-medium">{T.prof_unverified}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 1 : Mon compte ── */}
        <Card title={T.prof_account}>
          <Row icon={<IcPhone />} label={T.prof_phone} value={profile?.phone ?? '—'} />
          <Row
            icon={<IcUser />}
            label={T.prof_name}
            value={profile?.full_name ?? '—'}
            action={
              <button onClick={() => setEditName(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 transition">
                <IcPencil />
              </button>
            }
          />
          <Row
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>}
            label={T.prof_wallet_id}
            value={
              <span className="font-mono text-xs text-gray-600 dark:text-slate-400">
                {profile ? truncId(profile.wallet_id) : '—'}
              </span>
            }
            action={
              <button onClick={copyWalletId} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 transition">
                <IcCopy />
              </button>
            }
          />
          {profile?.blockchain_address && (
            <Row
              icon={<Wallet size={16} />}
              label={T.prof_bsc}
              value={
                <a
                  href={`https://bscscan.com/address/${profile.blockchain_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  {profile.blockchain_address.slice(0, 6)}…{profile.blockchain_address.slice(-4)}
                  <ExternalLink size={11} />
                </a>
              }
              action={
                <button onClick={copyBscAddress} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 transition">
                  <IcCopy />
                </button>
              }
            />
          )}
          <Link href={`/${locale}/wallet/kyc`}>
            <Row
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              label={T.prof_kyc}
              value={<KycBadge level={profile?.kyc_level ?? 0} />}
              action={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-300 dark:text-slate-600"><polyline points="9 18 15 12 9 6"/></svg>}
            />
          </Link>
        </Card>

        {/* ── Section 2 : Sécurité ── */}
        <Card title={T.prof_security}>
          <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-700/60">
            <button onClick={() => setPinOpen(v => !v)} className="flex items-center gap-3 w-full">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-slate-400 shrink-0"><IcLock /></div>
              <span className="flex-1 text-left text-sm font-medium text-gray-800 dark:text-slate-200">{T.prof_pin_change}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-gray-400 transition-transform ${pinOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {pinOpen && (
              <div className="mt-4 space-y-3">
                {pinError && <p className="text-xs text-red-500 font-medium">{pinError}</p>}
                {(['current_pin', 'new_pin', 'confirm_pin'] as const).map((field) => (
                  <div key={field}>
                    <label className="text-xs text-gray-400 dark:text-slate-500 mb-1 block">
                      {field === 'current_pin' ? T.prof_pin_current : field === 'new_pin' ? T.prof_pin_new : T.prof_pin_cfm}
                    </label>
                    <input
                      type="password" inputMode="numeric" maxLength={6}
                      value={pinForm[field]}
                      onChange={e => setPinForm(p => ({ ...p, [field]: e.target.value.replace(/\D/g, '') }))}
                      placeholder="••••••"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:border-[#00A651] transition"
                    />
                  </div>
                ))}
                <button onClick={changePin} disabled={pinSaving} className="w-full py-3 rounded-xl bg-[#00A651] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {pinSaving ? <Spinner sm /> : T.prof_pin_save}
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between w-full gap-2 px-4 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-slate-400 shrink-0"><IcBell /></div>
              <span className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{T.prof_notifs}</span>
            </div>
            <div className="flex-shrink-0 pr-0.5">
              <button type="button" onClick={toggleNotifs} disabled={savingNotifs} className={`relative block w-12 h-6 rounded-full overflow-hidden transition-colors disabled:opacity-60 ${notifs ? 'bg-[#00A651]' : 'bg-gray-300 dark:bg-slate-600'}`}>
                <span className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifs ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </Card>

        {/* ── Section CDP : Adresse de dépôt USDC/Base ── */}
        {profile?.cdp_wallet_address && (
          <Card title={T.prof_cdp_lbl}>
            <div className="flex flex-col items-center gap-4 py-5 px-4">
              <div className="max-w-[160px] mx-auto p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                <QRCodeSVG
                  value={profile.cdp_wallet_address}
                  size={140}
                  level="M"
                />
              </div>
              <div className="flex items-center gap-2 w-full bg-gray-50 dark:bg-slate-700/50 rounded-xl px-3 py-2.5">
                <span className="flex-1 font-mono text-xs text-gray-700 dark:text-slate-300 break-all leading-relaxed">
                  {profile.cdp_wallet_address}
                </span>
                <button
                  onClick={copyCdpAddress}
                  className="shrink-0 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-500 dark:text-slate-400 transition"
                  aria-label="Copier l'adresse"
                >
                  <IcCopy />
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
                {locale === 'en'
                  ? 'Send USDC on Base network to this address'
                  : 'Envoyez des USDC sur le réseau Base à cette adresse'}
              </p>
            </div>
          </Card>
        )}

        {/* ── Section 3 : Statistiques ── */}
        <Card title={T.prof_stats}>
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-700">
            {[
              { label: T.prof_deposited, value: stats ? `${fmt(stats.totalDeposited)} CDF` : '—' },
              { label: T.prof_withdrawn, value: stats ? `${fmt(stats.totalWithdrawn)} CDF` : '—' },
              { label: 'Tx',      value: stats ? String(stats.count) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center py-4 px-2">
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-white text-center leading-tight">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Section 4 : Partager ── */}
        <Card title={T.prof_share_card}>
          <div className="flex flex-col items-center gap-4 py-5 px-4">
            <div className="max-w-[160px] mx-auto p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
              <QRCodeSVG
                value={qrValue}
                size={140}
                level="M"
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">{profile?.phone}</p>
            <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00A651] text-white font-semibold text-sm">
              <IcShare /> {T.prof_share_btn}
            </button>
          </div>
        </Card>

        {/* ── Section 5 : Assistance ── */}
        <Card title={T.prof_support}>
          <a href="mailto:support@unipaycongo.com">
            <Row icon={<IcMail />} label={T.prof_support_email} value="support@unipaycongo.com" />
          </a>
          <a href={`/${locale}/legal`}>
            <Row icon={<IcDoc />} label={T.prof_tos} value="" />
          </a>
          <a href={`/${locale}/privacy`}>
            <Row icon={<IcDoc />} label={T.prof_privacy} value="" />
          </a>
        </Card>

        {/* ── Section 6 : Déconnexion ── */}
        <button
          onClick={() => setLogoutModal(true)}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition mt-6 mb-24"
        >
          <IcLogout /> {T.prof_logout}
        </button>

      </div>
    </div>
  );
}
