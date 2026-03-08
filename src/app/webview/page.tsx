'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';

export default function WebViewPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add dashboard-page class so global styles apply correctly
    document.documentElement.classList.add('dashboard-page');
    return () => {
      document.documentElement.classList.remove('dashboard-page');
    };
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
      {/* Loading overlay */}
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
          {/* Spinning ring */}
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

      {/* WebView iframe */}
      <iframe
        ref={iframeRef}
        src="/api/proxy?path=/"
        onLoad={() => setLoading(false)}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          background: '#000',
          display: 'block',
        }}
        allow="fullscreen; payment; camera; microphone"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
      />

      <BottomNav />
    </main>
  );
}