'use client';

import React, { useEffect, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';

export default function WebViewPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('dashboard-page');
    return () => document.documentElement.classList.remove('dashboard-page');
  }, []);

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom))',
      }}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            background: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              border: '2px solid rgba(52,211,153,0.15)',
              borderTop: '2px solid #34d399',
              borderRadius: '50%',
              animation: 'spin 0.9s linear infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-exo)',
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(52,211,153,0.6)',
            }}
          >
            Memuat...
          </span>
        </div>
      )}

      {/* iframe load dari /stouch → next.config rewrite → /api/proxy?path=/ */}
      <iframe
        src="/stouch"
        onLoad={() => setLoading(false)}
        allow="fullscreen; payment; camera; microphone"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          background: '#000',
          display: 'block',
        }}
      />

      <BottomNav />
    </main>
  );
}