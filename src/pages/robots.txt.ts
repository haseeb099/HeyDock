import type { APIRoute } from 'astro';
import { site } from '../data/site';

export const GET: APIRoute = () => {
  const body = site.isPublic
    ? [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${site.origin}/sitemap-index.xml`,
        '',
      ].join('\n')
    : [
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
