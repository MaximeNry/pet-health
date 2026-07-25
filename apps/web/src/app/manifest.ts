import type { MetadataRoute } from 'next';

/**
 * Web app manifest (served at /manifest.webmanifest, linked automatically).
 * Makes the app installable ("Add to Home Screen") on iOS and Android.
 * Colors come from the design system: green-600 and stone-50 (canvas).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PetHealth',
    short_name: 'PetHealth',
    description: "Scan and organize your pets' health documents",
    start_url: '/',
    display: 'standalone',
    background_color: '#FBFAF7',
    theme_color: '#16704A',
    icons: [
      {
        src: '/brand/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/brand/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/brand/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
