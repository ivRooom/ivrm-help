import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://ivrooom.github.io');
  const baseUrl = new URL(import.meta.env.BASE_URL, origin);
  const sitemapUrl = new URL('sitemap.xml', baseUrl);
  const body = [
    'User-agent: *',
    `Allow: ${import.meta.env.BASE_URL}`,
    '',
    `Sitemap: ${sitemapUrl.href}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
