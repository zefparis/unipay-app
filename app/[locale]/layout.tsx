import type { Metadata } from 'next';
import Script from 'next/script';
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
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <head>
        <meta name="theme-color" content="#00A651" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="bg-white dark:bg-[#0f172a] antialiased transition-colors duration-200">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
        <Script
          src="https://hcs-widget-mvp.vercel.app/widget/v3/hcs-widget.js"
          data-widget="443fe996-6651-48d8-8e17-3cf0a80cc5e0"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
