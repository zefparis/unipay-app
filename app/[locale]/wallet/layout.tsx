import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import WalletBottomNav from '@/components/WalletBottomNav';

export const metadata: Metadata = {
  title: 'UniPay Wallet — Votre portefeuille mobile',
  description: "Déposez, retirez et envoyez de l'argent avec UniPay Congo.",
};

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const isLoggedIn = !!cookieStore.get('wallet_token')?.value;

  return (
    <div className="min-h-screen bg-white">
      <div className={`w-full max-w-md mx-auto min-h-screen flex flex-col${isLoggedIn ? ' pb-16' : ''}`}>
        {children}
      </div>
      {isLoggedIn && <WalletBottomNav />}
    </div>
  );
}
