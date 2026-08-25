import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: 'DoAm — Small problems. Nearby solutions.',
  description: 'Post what you need done. Find someone nearby. Get it done.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
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
