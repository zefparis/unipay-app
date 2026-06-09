'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink, RefreshCw } from 'lucide-react';

interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  icon: string;
}

interface WCGLTData {
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  txns24h: number;
}

function fmt(n: number, decimals = 2) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(decimals)}`;
}

function PriceChange({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-sm font-semibold ${positive ? 'text-green-500' : 'text-red-500'}`}>
      {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {positive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const COIN_IDS = ['bitcoin', 'ethereum', 'binancecoin', 'tether'];
const COIN_META: Record<string, { symbol: string; name: string; icon: string }> = {
  bitcoin:      { symbol: 'BTC', name: 'Bitcoin',    icon: '₿' },
  ethereum:     { symbol: 'ETH', name: 'Ethereum',   icon: 'Ξ' },
  binancecoin:  { symbol: 'BNB', name: 'BNB',        icon: '◈' },
  tether:       { symbol: 'USDT', name: 'Tether',    icon: '₮' },
};

const WCGLT_CONTRACT = '0x6b402687B45f98913dF7409660A8f04f81752f8B';
const PANCAKE_URL = `https://pancakeswap.finance/swap?outputCurrency=${WCGLT_CONTRACT}`;
const BSCSCAN_URL = `https://bscscan.com/token/${WCGLT_CONTRACT}`;
const DEXSCREENER_URL = `https://dexscreener.com/bsc/${WCGLT_CONTRACT}`;

export default function CryptoPage() {
  const { locale } = useParams<{ locale: string }>();
  const [coins, setCoins]       = useState<CoinPrice[]>([]);
  const [wcglt, setWcglt]       = useState<WCGLTData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  async function fetchData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      // CoinGecko — top coins
      const cgRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
      );
      const cgData = await cgRes.json();
      const coinList: CoinPrice[] = COIN_IDS.map((id) => ({
        id,
        symbol:   COIN_META[id].symbol,
        name:     COIN_META[id].name,
        icon:     COIN_META[id].icon,
        price:    cgData[id]?.usd ?? 0,
        change24h: cgData[id]?.usd_24h_change ?? 0,
        volume24h: cgData[id]?.usd_24h_vol ?? 0,
      }));
      setCoins(coinList);

      // DexScreener — wCGLT pool
      const dexRes = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${WCGLT_CONTRACT}`
      );
      const dexData = await dexRes.json();
      const pair = dexData?.pairs?.[0];
      if (pair) {
        setWcglt({
          price:     parseFloat(pair.priceUsd ?? '0'),
          change24h: pair.priceChange?.h24 ?? 0,
          volume24h: pair.volume?.h24 ?? 0,
          liquidity: pair.liquidity?.usd ?? 0,
          txns24h:   (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0),
        });
      }

      setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
    } catch (e) {
      console.error('fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f172a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition">
            <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">Marchés Crypto</h1>
        </div>
        <button onClick={() => fetchData(true)} disabled={refreshing}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition">
          <RefreshCw size={18} className={`text-gray-500 dark:text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {lastUpdate && (
        <p className="text-xs text-gray-400 dark:text-slate-500 px-4 pt-2">Mis à jour à {lastUpdate} · Auto-refresh 60s</p>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 py-4">

          {/* wCGLT Hero Card */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">W</div>
                <div>
                  <p className="font-bold text-lg">wCGLT</p>
                  <p className="text-purple-200 text-xs">Wrapped CGLT · BSC</p>
                </div>
              </div>
              {wcglt && <PriceChange value={wcglt.change24h} />}
            </div>

            <p className="text-3xl font-bold mb-1">
              {wcglt ? `$${wcglt.price.toFixed(6)}` : '—'}
            </p>

            {wcglt && (
              <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                <div className="bg-white/10 rounded-xl py-2">
                  <p className="text-purple-200 text-xs">Volume 24h</p>
                  <p className="font-bold text-sm">{fmt(wcglt.volume24h)}</p>
                </div>
                <div className="bg-white/10 rounded-xl py-2">
                  <p className="text-purple-200 text-xs">Liquidité</p>
                  <p className="font-bold text-sm">{fmt(wcglt.liquidity)}</p>
                </div>
                <div className="bg-white/10 rounded-xl py-2">
                  <p className="text-purple-200 text-xs">Tx 24h</p>
                  <p className="font-bold text-sm">{wcglt.txns24h}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <a href={PANCAKE_URL} target="_blank" rel="noopener noreferrer"
                className="flex-1 bg-white text-purple-700 font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-purple-50 transition">
                Acheter sur PancakeSwap <ExternalLink size={14} />
              </a>
              <a href={DEXSCREENER_URL} target="_blank" rel="noopener noreferrer"
                className="px-3 bg-white/20 text-white rounded-xl flex items-center justify-center hover:bg-white/30 transition">
                <ExternalLink size={16} />
              </a>
            </div>

            <div className="flex gap-3 mt-2 text-xs text-purple-300 justify-center">
              <a href={BSCSCAN_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">
                BscScan <ExternalLink size={10} />
              </a>
              <span>·</span>
              <span className="font-mono">{WCGLT_CONTRACT.slice(0, 10)}...{WCGLT_CONTRACT.slice(-6)}</span>
            </div>
          </div>

          {/* Top Coins */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 mb-3 uppercase tracking-wide">Marchés</h2>
            <div className="flex flex-col gap-2">
              {coins.map((coin) => (
                <div key={coin.id}
                  className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-slate-300">
                      {coin.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-slate-100">{coin.symbol}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{coin.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-slate-100">
                      ${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: coin.price > 1 ? 2 : 6 })}
                    </p>
                    <PriceChange value={coin.change24h} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 Gagnez du <strong>CGLT</strong> en jouant sur Congo Gaming, puis retirez-le en <strong>wCGLT</strong> sur BSC depuis la page Retrait.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}