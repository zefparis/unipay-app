'use client';

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { X, Camera, QrCode, Keyboard } from 'lucide-react';
import { wT } from '@/lib/i18n-wallet';

const SCHEME = 'unipaycongo://send';

export default function WalletScanPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const T = wT(locale ?? 'fr');

  const [error, setError]         = useState('');
  const [scanned, setScanned]     = useState(false);
  const [active, setActive]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [manual, setManual]       = useState(false);
  const [manualInput, setManualInput] = useState('');

  const isSecure = typeof window !== 'undefined' && window.isSecureContext;
  const hasMediaDevices = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const processQr = useCallback(
    (result: string) => {
      if (scanned) return;

      if (!result.startsWith(SCHEME)) {
        setError(T.scan_qr_invalid);
        setScanned(false);
        return;
      }

      setScanned(true);
      setError('');

      try {
        const url   = new URL(result.replace('unipaycongo://', 'https://unipaycongo.com/'));
        const phone = url.searchParams.get('phone') ?? '';
        const name  = url.searchParams.get('name')  ?? '';

        const dest = new URLSearchParams();
        if (phone) dest.set('phone', phone);
        if (name)  dest.set('name', name);

        router.push(`/${locale}/wallet/send?${dest.toString()}`);
      } catch {
        setScanned(false);
        setError(T.scan_qr_invalid);
      }
    },
    [scanned, locale, router, T],
  );

  const handleScan = useCallback(
    (detectedCodes: IDetectedBarcode[]) => {
      if (detectedCodes.length === 0) return;
      processQr(detectedCodes[0].rawValue);
    },
    [processQr],
  );

  const handleError = useCallback(
    (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        setActive(false);
        setError(T.scan_permission);
      } else if (!msg.toLowerCase().includes('aborted') && !msg.toLowerCase().includes('track')) {
        setActive(false);
        setError(T.scan_err);
      }
    },
    [T],
  );

  async function startCamera() {
    if (!isSecure) {
      setError(T.scan_https);
      return;
    }
    if (!hasMediaDevices) {
      setError(T.scan_unsupported);
      setManual(true);
      return;
    }

    setLoading(true);
    setError('');
    setManual(false);

    try {
      // Explicit permission request with user gesture (required on iOS Safari).
      await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      setActive(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        setError(T.scan_permission);
      } else {
        setError(T.scan_err);
      }
      setManual(true);
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processQr(manualInput.trim());
  }

  function closeManual() {
    setManual(false);
    setManualInput('');
    setError('');
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4 z-10">
        <div>
          <p className="text-white font-semibold text-base">{T.scan_title}</p>
          <p className="text-white/60 text-xs mt-0.5">{T.scan_point}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
          aria-label={T.back}
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center px-6">
        {active ? (
          <div className="absolute inset-0">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              paused={scanned}
              constraints={{ facingMode: 'environment' }}
              styles={{
                container: { width: '100%', height: '100%' },
                video:     { objectFit: 'cover', width: '100%', height: '100%' },
              }}
              sound={false}
              components={{ finder: false }}
            >
              {/* Custom viewfinder */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00A651] rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00A651] rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00A651] rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00A651] rounded-br-lg" />
                  {!scanned && (
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#00A651]/70 animate-scan-line" />
                  )}
                </div>
              </div>
            </Scanner>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 text-center max-w-xs">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
              <QrCode size={40} className="text-white/80" />
            </div>
            <div>
              <p className="text-white font-semibold text-base">{T.scan_title}</p>
              <p className="text-white/60 text-sm mt-1">{T.scan_point}</p>
            </div>
            <button
              onClick={startCamera}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-[#00A651] text-white rounded-xl font-semibold text-sm active:scale-95 transition disabled:opacity-60"
            >
              <Camera size={20} />
              {loading ? '…' : T.scan_enable}
            </button>
            <button
              onClick={() => setManual(true)}
              className="flex items-center gap-2 text-white/70 text-sm hover:text-white transition"
            >
              <Keyboard size={16} />
              {T.scan_manual}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-10 pt-4 flex flex-col items-center gap-3 z-10">
        {scanned && (
          <p className="text-[#00A651] text-sm font-semibold animate-pulse">{T.scan_detected}</p>
        )}
        {error && !scanned && (
          <div className="w-full bg-red-600/80 rounded-2xl px-4 py-3 text-center">
            <p className="text-white text-sm font-medium">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-white/70 text-xs underline mt-1"
            >
              Réessayer
            </button>
          </div>
        )}
        {active && !scanned && !error && (
          <p className="text-white/40 text-xs text-center">
            Scannez le QR code d&apos;un autre utilisateur UniPay
          </p>
        )}
      </div>

      {/* Manual input fallback */}
      {manual && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-end sm:items-center justify-center sm:p-4">
          <div className="w-full sm:max-w-sm bg-[#1a1a2e] rounded-t-2xl sm:rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">{T.scan_manual}</h3>
              <button onClick={closeManual} className="text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={T.scan_manual_label}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#00A651]"
                autoFocus
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="w-full py-3 bg-[#00A651] text-white rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-95 transition"
              >
                {T.scan_manual_cta}
              </button>
            </form>
            {error && (
              <p className="mt-3 text-sm text-red-400 text-center">{error}</p>
            )}
            <p className="mt-3 text-xs text-white/40 text-center">
              Ex: unipaycongo://send?phone=+243812345678
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
