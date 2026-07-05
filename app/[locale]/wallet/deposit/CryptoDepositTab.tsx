'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { wT } from '@/lib/i18n-wallet';

interface DepositAddress {
  bsc_address: string;
  supported_tokens: { symbol: string; contract: string; decimals: number; name: string }[];
  network:  string;
  warning:  string;
}

interface CryptoDeposit {
  id:           string;
  tx_hash:      string;
  token_symbol: string;
  amount_usd:   number | null;
  from_address: string | null;
  status:       string;
  created_at:   string;
}

function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <svg className={`animate-spin ${cls} text-purple-400`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function shortTx(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* ─────────────────────────────────────────────────────────────────────────────
 * CryptoDepositTab
 * Displays user's unique BSC deposit address + history of confirmed deposits.
 * Polling for new deposits every 30 s.
 * ───────────────────────────────────────────────────────────────────────────── */
export default function CryptoDepositTab() {
  const { locale } = useParams<{ locale: string }>();
  const T = wT(locale ?? 'fr');

  const [addrData, setAddrData]   = useState<DepositAddress | null>(null);
  const [deposits, setDeposits]   = useState<CryptoDeposit[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState('');
  const [copied,   setCopied]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAddress = async () => {
    const r = await fetch('/api/wallet/deposit-address');
    if (r.status === 503) {
      setError(T.dep_crypto_not_configured);
      return;
    }
    if (!r.ok) { setError(T.dep_crypto_load_error); return; }
    const d: DepositAddress = await r.json();
    setAddrData(d);
  };

  const fetchDeposits = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const r = await fetch('/api/wallet/crypto-deposits');
      if (r.ok) setDeposits(await r.json());
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchAddress(), fetchDeposits(true)]).finally(() => setLoading(false));

    pollRef.current = setInterval(() => {
      fetchDeposits(true).catch(() => {});
    }, 30_000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const copyAddress = async () => {
    if (!addrData?.bsc_address) return;
    await navigator.clipboard.writeText(addrData.bsc_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 my-5 rounded-xl border border-red-800 bg-red-900/20 px-4 py-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!addrData) return null;

  return (
    <div className="flex flex-col gap-5 px-4 py-5">

      {/* Title */}
      <h2 className="text-base font-bold text-slate-100">{T.dep_bsc_title}</h2>

      {/* Help text */}
      <div className="rounded-xl border border-blue-700/40 bg-blue-900/20 px-4 py-3 text-xs text-blue-200 leading-relaxed">
        {T.dep_bsc_help}
      </div>

      {/* Network badge */}
      <div className="flex items-center gap-2">
        <span className="bg-yellow-500 text-black text-xs font-bold px-2.5 py-1 rounded-full">{T.dep_crypto_network_badge}</span>
        <span className="text-xs text-slate-400">{T.dep_crypto_network_name}</span>
      </div>

      {/* QR + address */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 flex flex-col items-center gap-4">
        <div className="bg-white p-3 rounded-xl">
          <QRCodeSVG value={addrData.bsc_address} size={180} />
        </div>

        <div className="w-full">
          <p className="text-xs text-slate-400 mb-1.5">{T.dep_bsc_addr_label}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 break-all">
              {addrData.bsc_address}
            </code>
            <button
              type="button"
              onClick={copyAddress}
              className="flex-shrink-0 p-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition"
              aria-label={T.dep_crypto_copy_aria}
            >
              {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
            </button>
          </div>
          {copied && <p className="text-xs text-green-400 mt-1">{T.dep_crypto_copied}</p>}
        </div>
      </div>

      {/* Tokens acceptés */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{T.dep_crypto_tokens}</p>
        <div className="flex gap-2">
          {addrData.supported_tokens.map((t) => (
            <div
              key={t.symbol}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 flex flex-col gap-0.5"
            >
              <span className="text-sm font-bold text-slate-100">{t.symbol}</span>
              <span className="text-xs text-slate-500">{t.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="rounded-xl border border-red-700/60 bg-red-900/20 px-4 py-3 flex gap-2">
        <span className="text-red-400 text-base flex-shrink-0">⚠️</span>
        <p className="text-xs text-red-300 leading-relaxed">{T.dep_bsc_warn_static}</p>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-xs text-slate-400 flex flex-col gap-1">
        <p>• {T.dep_crypto_min_deposit} <strong className="text-slate-200">1 USDT</strong></p>
        <p>• {T.dep_crypto_auto_detect}</p>
        <p>• {T.dep_crypto_onchain}</p>
        <p>• {T.dep_crypto_wcglt_rate}</p>
      </div>

      {/* Recent deposits */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">{T.dep_crypto_recent}</p>
          <button
            type="button"
            onClick={() => fetchDeposits()}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {T.dep_crypto_refresh}
          </button>
        </div>

        {deposits.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-6 text-center">
            <p className="text-sm text-slate-500">{T.dep_crypto_empty}</p>
            <p className="text-xs text-slate-600 mt-1">{T.dep_crypto_empty_hint}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {deposits.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{d.token_symbol}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      d.status === 'CONFIRMED'
                        ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                        : 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50'
                    }`}>
                      {d.status === 'CONFIRMED' ? T.dep_crypto_confirmed : d.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(d.created_at)}</span>
                </div>

                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  {d.amount_usd != null && (
                    <span className="text-sm font-bold text-green-400">+{d.amount_usd.toFixed(4)} USD</span>
                  )}
                  <a
                    href={`https://bscscan.com/tx/${d.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition"
                  >
                    {shortTx(d.tx_hash)}
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
