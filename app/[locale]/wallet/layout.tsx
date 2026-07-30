import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import WalletNavGate from '@/components/WalletNavGate';

export const metadata: Metadata = {
  title: 'UniPay Wallet — Votre portefeuille mobile',
  description: "Déposez, retirez et envoyez de l'argent avec UniPay Congo.",
};

export default async function WalletLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get('wallet_token')?.value;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-200">
      <WalletNavGate isLoggedIn={isLoggedIn}>{children}</WalletNavGate>
    </div>
  );
}
