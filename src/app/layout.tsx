import type { Metadata, Viewport } from 'next';
import { Exo_2 } from 'next/font/google';
import './globals.css';

const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-exo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'STC AutoTrade',
  description: 'Platform dengan penarikan kilat, profit hingga 100%, dan keamanan maksimal.',
  keywords: ['binary option', 'trading', 'IDX_STC', 'forex', 'crypto', 'Stouch', 'STC AutoTrade'],
  icons: {
    icon: '/stc.ico',
    shortcut: '/stc.ico',
    apple: '/stc.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stouch',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={exo2.variable}>
      <body>{children}</body>
    </html>
  );
}