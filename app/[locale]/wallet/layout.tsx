import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import WalletBottomNav from '@/components/WalletBottomNav';
import DarkModeToggle from '@/components/DarkModeToggle';

export const metadata: Metadata = {
  title: 'UniPay Wallet — Votre portefeuille mobile',
  description: "Déposez, retirez et envoyez de l'argent avec UniPay Congo.",
};

export default async function WalletLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get('wallet_token')?.value;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-200">
      <div className={`w-full max-w-md mx-auto min-h-screen flex flex-col${isLoggedIn ? ' pb-16' : ''}`}>
        {children}
      </div>
      {isLoggedIn && (
        <div className="fixed top-3 right-3 z-50">
          <DarkModeToggle />
        </div>
      )}
      {isLoggedIn && <WalletBottomNav isLoggedIn={isLoggedIn} />}
    </div>
  );
}
