import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

const normalizeBasePath = (value) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
};

const siteUrl = (process.env.SITE_URL || 'https://ivrooom.github.io').replace(/\/+$/g, '');
const basePath = normalizeBasePath(process.env.BASE_PATH || '/ivrm-help');
const deployedPrefix = basePath === '/' ? '/' : `${basePath}/`;
const baseUrl = new URL(deployedPrefix, `${siteUrl}/`);

const requiredFiles = [
  'dist/404.html',
  'dist/robots.txt',
  'dist/sitemap.xml',
];

for (const relativePath of requiredFiles) {
  try {
    await access(path.join(root, relativePath));
  } catch {
    throw new Error(`生成物が見つかりません: ${relativePath}`);
  }
}

const pagefindDirectory = path.join(dist, 'pagefind');
let pagefindFiles;
try {
  pagefindFiles = await readdir(pagefindDirectory);
} catch {
  throw new Error('Pagefindの検索インデックスが生成されていません。');
}

if (!pagefindFiles.some((fileName) => fileName.startsWith('pagefind'))) {
  throw new Error('Pagefindの検索用ファイルが見つかりません。');
}

const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const requiredUrls = [
  new URL('', baseUrl).href,
  new URL('en/', baseUrl).href,
  new URL('minecraft/how-to-join/', baseUrl).href,
  new URL('en/minecraft/how-to-join/', baseUrl).href,
];

for (const url of requiredUrls) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) {
    throw new Error(`サイトマップに必要なURLがありません: ${url}`);
  }
}

const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
const expectedSitemapUrl = new URL('sitemap.xml', baseUrl).href;
if (!robots.includes(`Sitemap: ${expectedSitemapUrl}`)) {
  throw new Error('robots.txtにサイトマップURLが設定されていません。');
}

const collectHtmlFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(absolutePath);
    return entry.isFile() && entry.name.endsWith('.html') ? [absolutePath] : [];
  }));
  return nested.flat();
};

const htmlFiles = await collectHtmlFiles(dist);
const rootRelativeReference = /\b(?:href|src)=["'](\/(?!\/)[^"']*)["']/g;

for (const htmlPath of htmlFiles) {
  const html = await readFile(htmlPath, 'utf8');
  for (const match of html.matchAll(rootRelativeReference)) {
    const reference = match[1];
    if (basePath !== '/' && reference !== basePath && !reference.startsWith(deployedPrefix)) {
      throw new Error(`ベースパス外の参照があります: ${path.relative(root, htmlPath)} -> ${reference}`);
    }
  }
}

const indexHtml = await readFile(path.join(dist, 'index.html'), 'utf8');
if (!indexHtml.includes(`${deployedPrefix}_astro/`)) {
  throw new Error('トップページのCSS・JavaScriptがデプロイ先のベースパスを参照していません。');
}
if (!indexHtml.includes(`${deployedPrefix}favicon.svg`)) {
  throw new Error('faviconがデプロイ先のベースパスを参照していません。');
}

const localizedHomePages = [
  ['日本語', path.join(dist, 'index.html')],
  ['英語', path.join(dist, 'en', 'index.html')],
];

for (const [locale, homePath] of localizedHomePages) {
  const html = await readFile(homePath, 'utf8');
  if (!html.includes('data-ivrm-open-search')) {
    throw new Error(`${locale}トップページに検索導線がありません。`);
  }
  if (!html.includes('<site-search')) {
    throw new Error(`${locale}トップページにStarlight標準検索がありません。`);
  }
}

const astroAssetDirectory = path.join(dist, '_astro');
const assetFiles = await readdir(astroAssetDirectory);
const cssFiles = assetFiles.filter((fileName) => fileName.endsWith('.css'));
if (cssFiles.length === 0) {
  throw new Error('ビルド済みCSSが見つかりません。');
}

const cssContents = await Promise.all(
  cssFiles.map((fileName) => readFile(path.join(astroAssetDirectory, fileName), 'utf8')),
);
if (!cssContents.some((content) => content.includes('--sl-color-accent-low'))) {
  throw new Error('カスタムスタイルがビルド済みCSSへ含まれていません。');
}
if (!cssContents.some((content) => content.includes('.ivrm-home-search'))) {
  throw new Error('トップページ検索UIのスタイルがビルド済みCSSへ含まれていません。');
}

console.log(`生成物の検証に成功しました: ${baseUrl.href}`);
