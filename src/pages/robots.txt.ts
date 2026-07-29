import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://ivrooom.github.io');
  const rawBasePath = import.meta.env.BASE_URL;
  const basePath = rawBasePath.endsWith('/') ? rawBasePath : `${rawBasePath}/`;
  const baseUrl = new URL(basePath, origin);
  const sitemapUrl = new URL('sitemap.xml', baseUrl);
  const body = [
    'User-agent: *',
    `Allow: ${basePath}`,
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
