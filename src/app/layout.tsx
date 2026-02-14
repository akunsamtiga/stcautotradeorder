import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Configure Inter font with fallback and better error handling
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Use swap to show fallback immediately
  fallback: ['system-ui', 'arial'], // Define fallback fonts
  // Add these options to handle network issues better
  adjustFontFallback: true,
  preload: true,
});

export const metadata: Metadata = {
  title: 'Order Schedule Platform',
  description: 'Professional trading schedule management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}