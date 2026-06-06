'use client';

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { X } from 'lucide-react';

const SCHEME = 'unipaycongo://send';

export default function WalletScanPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [error, setError]   = useState('');
  const [scanned, setScanned] = useState(false);

  const handleScan = useCallback((detectedCodes: IDetectedBarcode[]) => {
    if (scanned || detectedCodes.length === 0) return;
    const result = detectedCodes[0].rawValue;

    if (!result.startsWith(SCHEME)) {
      setError('QR code non compatible UniPay.');
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
      setError('QR code non compatible UniPay.');
    }
  }, [scanned, locale, router]);

  const handleError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.toLowerCase().includes('aborted') && !msg.toLowerCase().includes('track')) {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4 z-10">
        <div>
          <p className="text-white font-semibold text-base">Scanner un QR UniPay</p>
          <p className="text-white/60 text-xs mt-0.5">Pointez la caméra vers le QR code</p>
        </div>
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Scanner */}
      <div className="flex-1 relative overflow-hidden">
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

      {/* Footer */}
      <div className="px-6 pb-10 pt-4 flex flex-col items-center gap-3">
        {scanned && (
          <p className="text-[#00A651] text-sm font-semibold animate-pulse">QR détecté — Redirection…</p>
        )}
        {error && !scanned && (
          <div className="w-full bg-red-600/80 rounded-2xl px-4 py-3 text-center">
            <p className="text-white text-sm font-medium">{error}</p>
            <button onClick={() => setError('')} className="text-white/70 text-xs underline mt-1">
              Réessayer
            </button>
          </div>
        )}
        {!error && !scanned && (
          <p className="text-white/40 text-xs text-center">
            Scannez le QR code d&apos;un autre utilisateur UniPay
          </p>
        )}
      </div>
    </div>
  );
}
