import { onRequest } from './functions/api/enquiry.js';
import { lookupRedirect } from './functions/_lib/redirects.mjs';

function assetPath(pathname) {
  if (pathname === '/') return '/index.html';
  if (pathname.startsWith('/api/')) return pathname;
  if (pathname.includes('.')) return pathname;
  return pathname.replace(/\/$/, '') + '/index.html';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/enquiry') {
      return onRequest({ request, env });
    }

    const redirected = lookupRedirect(url.pathname);
    if (redirected) {
      const target = new URL(redirected, url.origin);
      target.search = url.search;
      return Response.redirect(target, 301);
    }

    const assetUrl = new URL(url);
    assetUrl.pathname = assetPath(url.pathname);
    const response = await env.ASSETS.fetch(new Request(assetUrl, request));
    if (response.status !== 404 || !['GET', 'HEAD'].includes(request.method)) {
      return response;
    }

    assetUrl.pathname = '/404.html';
    const errorPage = await env.ASSETS.fetch(new Request(assetUrl, request));
    return new Response(errorPage.body, { headers: errorPage.headers, status: 404 });
  },
};
