'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Check, ExternalLink } from 'lucide-react';
import { wT } from '@/lib/i18n-wallet';
import { QRCodeSVG } from 'qrcode.react';

function Spinner() {
  return (
    <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function ReceivePage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const T = wT(locale);

  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    fetch('/api/wallet/profile')
      .then((r) => {
        if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; }
        return r.json();
      })
      .then((d: { blockchain_address?: string | null } | null) => {
        if (d) setAddress(d.blockchain_address ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale, router]);

  async function handleCopy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f172a]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-100 dark:border-slate-700">
        <Link href={`/${locale}/wallet`}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition">
          <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">
          {T.recv_title}
        </h1>
      </div>

      <div className="flex flex-col gap-4 px-4 py-6 items-center">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Spinner />
            <p className="text-sm text-gray-400 dark:text-slate-500">{T.recv_loading}</p>
          </div>
        ) : !address ? (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-5 py-6 text-center">
            <p className="text-sm text-red-700 dark:text-red-300 font-semibold">{T.recv_no_addr}</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{T.recv_no_addr_sub}</p>
          </div>
        ) : (
          <>
            {/* QR card */}
            <div className="w-full rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex flex-col items-center gap-5">
              <div className="p-3 bg-white rounded-xl shadow-inner">
                <QRCodeSVG
                  value={address}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Adresse texte */}
              <p className="text-xs font-mono text-gray-700 dark:text-slate-300 break-all text-center leading-relaxed">
                {address}
              </p>

              {/* Bouton Copier */}
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  copied
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/40'
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? T.copied : T.recv_copy}
              </button>
            </div>

            {/* Info card */}
            <div className="w-full rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-5 text-white">
              <p className="text-sm font-semibold leading-relaxed">
                {T.recv_bsc_info}
              </p>
              <p className="text-xs text-purple-200 mt-3 leading-relaxed">
                {T.recv_auto}
              </p>
            </div>

            {/* BscScan */}
            <a
              href={`https://bscscan.com/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
            >
              <ExternalLink size={15} />
              {T.recv_bscscan}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
