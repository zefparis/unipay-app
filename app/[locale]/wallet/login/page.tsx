'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function WalletLoginRedirect() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  useEffect(() => {
    router.replace(`/${locale}`);
  }, [router, locale]);

  return null;
}
