'use client';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function LanguageSwitcher() {
  const { locale } = useParams<{ locale: string }>();
  const pathname = usePathname();
  const other = locale === 'fr' ? 'en' : 'fr';
  const href = '/' + other + pathname.slice((locale as string).length + 1);

  return (
    <Link
      href={href}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-200"
    >
      <span className="uppercase tracking-widest">{locale === 'fr' ? 'EN' : 'FR'}</span>
    </Link>
  );
}
