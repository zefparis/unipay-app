import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UniPay Wallet',
    short_name: 'UniPay',
    description: 'Votre portefeuille mobile UniPay Congo — Envoyez et recevez de l\'argent facilement',
    start_url: '/fr/wallet',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00A651',
    orientation: 'portrait',
    categories: ['finance'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
