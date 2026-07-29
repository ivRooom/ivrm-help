import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const docsRoot = path.join(root, 'src', 'content', 'docs');

const normalizeBasePath = (value) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
};

const basePath = normalizeBasePath(process.env.BASE_PATH || '/ivrm-help');

const collectDocumentFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectDocumentFiles(absolutePath);
    if (!entry.isFile()) return [];
    return /\.(?:md|mdx)$/i.test(entry.name) ? [absolutePath] : [];
  }));
  return nestedFiles.flat();
};

const routeFromDocument = (absolutePath) => {
  const relativePath = path.relative(docsRoot, absolutePath).split(path.sep).join('/');
  const withoutExtension = relativePath.replace(/\.(?:md|mdx)$/i, '');
  const segments = withoutExtension.split('/');
  if (segments.at(-1) === 'index') segments.pop();
  const route = `/${segments.filter(Boolean).join('/')}`;
  return route === '/' ? '/' : `${route}/`;
};

const normalizeTargetRoute = (pathname) => {
  let normalizedPath = pathname;

  if (basePath !== '/') {
    if (normalizedPath === basePath) normalizedPath = '/';
    else if (normalizedPath.startsWith(`${basePath}/`)) normalizedPath = normalizedPath.slice(basePath.length);
  }

  normalizedPath = normalizedPath.replace(/\.(?:md|mdx|html)$/i, '');
  normalizedPath = normalizedPath.replace(/\/index$/i, '/');
  normalizedPath = path.posix.normalize(normalizedPath);

  if (!normalizedPath.startsWith('/')) normalizedPath = `/${normalizedPath}`;
  return normalizedPath === '/' ? '/' : `${normalizedPath.replace(/\/+$/g, '')}/`;
};

const extractLinks = (content) => {
  const links = [];
  const patterns = [
    /!?\[[^\]]*\]\(\s*<?([^\s)>]+)>?(?:\s+["'][^"']*["'])?\s*\)/g,
    /\b(?:href|link)=["']([^"']+)["']/g,
    /^\s*(?:href|link):\s*["']?([^"'\s]+)["']?\s*$/gm,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      links.push({ target: match[1], index: match.index });
    }
  }

  return links;
};

const shouldIgnoreTarget = (target) => {
  if (!target || target.startsWith('#') || target.startsWith('?')) return true;
  if (target.startsWith('//') || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(target)) return true;
  return target.includes('{') || target.includes('}');
};

const documentFiles = await collectDocumentFiles(docsRoot);
const availableRoutes = new Set(documentFiles.map(routeFromDocument));
const failures = [];
let checkedLinkCount = 0;

for (const documentPath of documentFiles) {
  const content = await readFile(documentPath, 'utf8');
  const sourceRoute = routeFromDocument(documentPath);

  for (const { target, index } of extractLinks(content)) {
    if (shouldIgnoreTarget(target)) continue;

    let parsedUrl;
    try {
      parsedUrl = new URL(target, `https://docs.example.invalid${sourceRoute}`);
    } catch {
      const line = content.slice(0, index).split('\n').length;
      failures.push({ documentPath, line, target, reason: 'URLとして解釈できません' });
      continue;
    }

    const extension = path.posix.extname(parsedUrl.pathname).toLowerCase();
    if (extension && !['.md', '.mdx', '.html'].includes(extension)) continue;

    const targetRoute = normalizeTargetRoute(parsedUrl.pathname);
    checkedLinkCount += 1;

    if (!availableRoutes.has(targetRoute)) {
      const line = content.slice(0, index).split('\n').length;
      failures.push({ documentPath, line, target, reason: `対応するページがありません (${targetRoute})` });
    }
  }
}

if (failures.length > 0) {
  console.error('ドキュメントの内部リンク切れを検出しました。');
  for (const failure of failures) {
    const relativePath = path.relative(root, failure.documentPath);
    console.error(`- ${relativePath}:${failure.line} ${failure.target} - ${failure.reason}`);
  }
  process.exitCode = 1;
} else {
  console.log(`内部リンクの検証に成功しました: ${documentFiles.length}ページ / ${checkedLinkCount}リンク`);
}
