import { NextRequest, NextResponse } from 'next/server';

const TARGET = 'https://www.stouch.id';

const INJECTED_SCRIPT = `<script>
(function(){
  // 1. Block Service Worker registration → prevents sw.js NetworkError in iframe
  if ('serviceWorker' in navigator) {
    Object.defineProperty(navigator, 'serviceWorker', {
      get: function() {
        return {
          register:            function() { return Promise.resolve({ scope: '/' }); },
          getRegistration:     function() { return Promise.resolve(undefined); },
          getRegistrations:    function() { return Promise.resolve([]); },
          addEventListener:    function() {},
          removeEventListener: function() {},
          ready:               new Promise(function(){}),
          controller:          null,
        };
      }
    });
  }

  // 2. Override history.pushState / replaceState
  //    stouch.id calls replaceState with 'https://www.stouch.id/...' which throws
  //    SecurityError because document origin is localhost. We strip to path only.
  var _push    = history.pushState.bind(history);
  var _replace = history.replaceState.bind(history);

  function safeUrl(url) {
    if (!url) return url;
    try {
      var u = new URL(String(url));
      // If it's a stouch.id absolute URL, keep only path+query+hash
      if (u.hostname.includes('stouch.id')) {
        return u.pathname + u.search + u.hash;
      }
    } catch(e) {}
    return url;
  }

  history.pushState = function(state, title, url) {
    try { _push(state, title, safeUrl(url)); } catch(e) {}
  };
  history.replaceState = function(state, title, url) {
    try { _replace(state, title, safeUrl(url)); } catch(e) {}
  };
})();
<\/script>`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '/';
  const targetUrl = `${TARGET}${path}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':      request.headers.get('user-agent') || 'Mozilla/5.0',
        'Accept':          request.headers.get('accept')     || '*/*',
        'Accept-Language': request.headers.get('accept-language') || 'id-ID,id;q=0.9,en;q=0.8',
        'Referer':         TARGET,
      },
      redirect: 'follow',
    });

    const contentType = res.headers.get('content-type') || '';
    let body: ArrayBuffer | string;

    if (contentType.includes('text/html')) {
      let html = await res.text();

      html = html
        .replace(/src=["'](https?:\/\/(?:www\.)?stouch\.id)(\/[^"']*)?["']/gi,
          (_, _o, p) => `src="/api/proxy?path=${encodeURIComponent(p || '/')}"`)
        .replace(/href=["'](https?:\/\/(?:www\.)?stouch\.id)(\/[^"']*)?["']/gi,
          (_, _o, p) => `href="/api/proxy?path=${encodeURIComponent(p || '/')}"`)
        .replace(/action=["'](https?:\/\/(?:www\.)?stouch\.id)(\/[^"']*)?["']/gi,
          (_, _o, p) => `action="/api/proxy?path=${encodeURIComponent(p || '/')}"`)
        .replace(/<head([^>]*)>/i,
          `<head$1><base href="${TARGET}/">${INJECTED_SCRIPT}`);

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