import { NextRequest, NextResponse } from 'next/server';

const TARGET = 'https://www.stouch.id';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '/';
  const targetUrl = `${TARGET}${path}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0',
        'Accept': request.headers.get('accept') || '*/*',
        'Accept-Language': request.headers.get('accept-language') || 'id-ID,id;q=0.9,en;q=0.8',
        'Referer': TARGET,
      },
      redirect: 'follow',
    });

    const contentType = res.headers.get('content-type') || '';
    let body: ArrayBuffer | string;

    if (contentType.includes('text/html')) {
      let html = await res.text();

      // Rewrite absolute URLs to go through proxy
      html = html
        // src="https://www.stouch.id/..." → src="/api/proxy?path=/..."
        .replace(/src=["'](https?:\/\/(?:www\.)?stouch\.id)(\/[^"']*)?["']/gi,
          (_, _origin, p) => `src="/api/proxy?path=${encodeURIComponent(p || '/')}"`)
        // href="https://www.stouch.id/..." → href="/api/proxy?path=/..."
        .replace(/href=["'](https?:\/\/(?:www\.)?stouch\.id)(\/[^"']*)?["']/gi,
          (_, _origin, p) => `href="/api/proxy?path=${encodeURIComponent(p || '/')}"`)
        // action="https://www.stouch.id/..."
        .replace(/action=["'](https?:\/\/(?:www\.)?stouch\.id)(\/[^"']*)?["']/gi,
          (_, _origin, p) => `action="/api/proxy?path=${encodeURIComponent(p || '/')}"`)
        // Inject base tag so relative paths resolve correctly
        .replace(/<head([^>]*)>/i,
          `<head$1><base href="${TARGET}/">`);

      body = html;
    } else {
      body = await res.arrayBuffer();
    }

    // Build response, stripping frame-blocking headers
    const headers = new Headers();
    headers.set('content-type', contentType);

    // Copy safe headers
    ['cache-control', 'content-encoding', 'content-language'].forEach(h => {
      const v = res.headers.get(h);
      if (v) headers.set(h, v);
    });

    // Explicitly do NOT copy:
    //  - x-frame-options
    //  - content-security-policy
    //  - x-content-type-options (can leave on)

    return new NextResponse(body, { status: res.status, headers });
  } catch (err) {
    console.error('[proxy] error:', err);
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  }
}