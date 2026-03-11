// src/app/api/gold-price/route.ts
// Proxy untuk https://data-asg.goldprice.org/dbXRates/USD
// Diperlukan karena goldprice.org memblokir request langsung dari browser (CORS + 403).
// Request ini dilakukan dari server Next.js, bukan dari browser.

import { NextResponse } from 'next/server';

export const runtime = 'edge'; // gunakan edge runtime agar lebih cepat

export async function GET() {
  try {
    const res = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
      headers: {
        // Beberapa API price butuh User-Agent yang wajar agar tidak di-block
        'User-Agent': 'Mozilla/5.0 (compatible; NextJS-Proxy/1.0)',
        'Accept': 'application/json',
      },
      // Cache 60 detik di edge — sesuai interval refresh di frontend
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        // Browser boleh cache 55 detik, CDN/edge 60 detik
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch gold price' },
      { status: 500 }
    );
  }
}