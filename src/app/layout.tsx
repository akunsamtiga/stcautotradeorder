import type { Metadata, Viewport } from 'next';
import './globals.css';


export const metadata: Metadata = {
  title: 'STC AutoTrade',
  description: 'Platform dengan penarikan kilat, profit hingga 100%, dan keamanan maksimal.',
  keywords: ['binary option', 'trading', 'IDX_STC', 'forex', 'crypto', 'Stouch' ,'STC AutoTrade'],
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f1419',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}