import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import ThemeProvider from '@/components/ThemeProvider';
import '../globals.css';

export const metadata: Metadata = {
  title: 'UniPay Wallet',
  description: "Envoyez et recevez de l'argent facilement avec UniPay Congo.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  return (
    <html lang={params.locale}>
      <body className="bg-white dark:bg-[#0f172a] antialiased transition-colors duration-200">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
