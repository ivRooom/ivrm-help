import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const prerender = true;

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const docIdToPath = (id: string) => {
  const normalizedId = id
    .replaceAll('\\', '/')
    .replace(/\.(md|mdx|mdoc)$/i, '')
    .replace(/^\/+|\/+$/g, '');

  if (!normalizedId || normalizedId === 'index') return '/';
  if (normalizedId.endsWith('/index')) {
    return `/${normalizedId.slice(0, -'/index'.length)}/`;
  }

  return `/${normalizedId}/`;
};

const is404Page = (id: string) =>
  /(^|\/)404(?:\.(md|mdx|mdoc))?$/i.test(id.replaceAll('\\', '/'));

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL('https://help.ivrm.jp');
  const documents = await getCollection('docs');
  const paths = documents
    .filter(({ id, data }) => !data.draft && !is404Page(id))
    .map(({ id }) => docIdToPath(id));
  const urls = [...new Set(paths)]
    .sort((a, b) => a.localeCompare(b))
    .map((pathname) => new URL(pathname, baseUrl).href);

  const entries = urls
    .map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`)
    .join('\n');
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
