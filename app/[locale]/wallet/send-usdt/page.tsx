'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function WalletSendUsdtPage() {
  const router   = useRouter();
  const { locale } = useParams<{ locale: string }>();

  useEffect(() => {
    router.replace(`/${locale}/wallet/send?tab=usdt`);
  }, [locale]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0f172a]">
      <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
