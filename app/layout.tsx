import './globals.css';
import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { SessionProvider } from 'next-auth/react';

const siteUrl = 'https://do-am-web.vercel.app';
const ogImageUrl = 'https://do-am-web.vercel.app/do-am-seo-image.png';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'DoAm — Small problems. Nearby solutions.',
    template: '%s | DoAm',
  },
  description: 'DoAm turns everyday local needs into nearby tasks. Post what you need done. Find someone nearby. Get it done.',
  openGraph: {
    title: 'DoAm — Small problems. Nearby solutions.',
    description: 'DoAm turns everyday local needs into nearby tasks. Post what you need done. Find someone nearby. Get it done.',
    url: siteUrl,
    siteName: 'DoAm',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'DoAm — Small problems. Nearby solutions.',
        type: 'image/png',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DoAm — Small problems. Nearby solutions.',
    description: 'DoAm turns everyday local needs into nearby tasks. Post what you need done. Find someone nearby. Get it done.',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'DoAm — Small problems. Nearby solutions.',
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider><AuthProvider>{children}</AuthProvider></SessionProvider>
      </body>
    </html>
  );
}
