import { onRequest } from './functions/api/enquiry.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/enquiry') {
      return onRequest({ request, env });
    }

    if (url.pathname === '/') {
      url.pathname = '/index.html';
    }
    const response = await env.ASSETS.fetch(new Request(url, request));
    if (response.status !== 404 || !['GET', 'HEAD'].includes(request.method)) {
      return response;
    }

    url.pathname = '/404.html';
    const errorPage = await env.ASSETS.fetch(new Request(url, request));
    return new Response(errorPage.body, { headers: errorPage.headers, status: 404 });
  },
};
