import { NextRequest, NextResponse } from 'next/server';

const TARGET = 'https://www.stouch.id';

// Minimal script — hanya block SW, sisanya handled by next.config.js rewrite
const INJECTED_SCRIPT = `<script>
(function(){
  // Stub SW lengkap agar tidak ada error registration
  if ('serviceWorker' in navigator) {
    var reg = {
      scope: '/', active: null, installing: null, waiting: null,
      update:              function() { return Promise.resolve(); },
      unregister:          function() { return Promise.resolve(true); },
      addEventListener:    function() {},
      removeEventListener: function() {},
      pushManager:         { subscribe: function() { return Promise.reject(); } },
      navigationPreload:   { enable: function() { return Promise.resolve(); } },
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      get: function() {
        return {
          register:            function() { return Promise.resolve(reg); },
          getRegistration:     function() { return Promise.resolve(reg); },
          getRegistrations:    function() { return Promise.resolve([reg]); },
          addEventListener:    function() {},
          removeEventListener: function() {},
          ready:               Promise.resolve(reg),
          controller:          null,
        };
      },
      configurable: true,
    });
  }
})();
<\/script>`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = decodeURIComponent(searchParams.get('path') || '/');
  const targetUrl = `${TARGET}${path}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':      request.headers.get('user-agent') || 'Mozilla/5.0',
        'Accept':          request.headers.get('accept')     || '*/*',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        'Referer':         TARGET,
        'x-nextjs-data':   '1',
      },
      redirect: 'follow',
    });

    const contentType = res.headers.get('content-type') || '';
    let body: ArrayBuffer | string;

    if (contentType.includes('text/html')) {
      let html = await res.text();
      html = html
        // Rewrite absolute stouch.id URLs → /stouch/<path>
        // next.config.js rewrite: /stouch/:path* → /api/proxy?path=/:path*
        .replace(/src=["'](https?:\/\/(?:www\.)?(?:stouch|stcautotrade)\.id)(\/[^"']*)?["']/gi,
          (_, _o, p) => `src="/stouch${p || '/'}"`)
        .replace(/href=["'](https?:\/\/(?:www\.)?(?:stouch|stcautotrade)\.id)(\/[^"']*)?["']/gi,
          (_, _o, p) => `href="/stouch${p || '/'}"`)
        .replace(/action=["'](https?:\/\/(?:www\.)?(?:stouch|stcautotrade)\.id)(\/[^"']*)?["']/gi,
          (_, _o, p) => `action="/stouch${p || '/'}"`)
        // base href → /stouch/ sehingga semua relative URL otomatis lewat rewrite
        .replace(/<head([^>]*)>/i,
          `<head$1><base href="/stouch/">${INJECTED_SCRIPT}`);

      body = html;
    } else {
      body = await res.arrayBuffer();
    }

    const headers = new Headers();
    headers.set('content-type', contentType);
    ['cache-control', 'content-language'].forEach(h => {
      const v = res.headers.get(h);
      if (v) headers.set(h, v);
    });
    // Stripped: x-frame-options, content-security-policy, content-encoding

    return new NextResponse(body, { status: res.status, headers });
  } catch (err) {
    console.error('[proxy] error:', err);
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  }
}