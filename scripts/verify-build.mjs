import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

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
  'https://help.ivrm.jp/',
  'https://help.ivrm.jp/en/',
  'https://help.ivrm.jp/minecraft/how-to-join/',
  'https://help.ivrm.jp/en/minecraft/how-to-join/',
];

for (const url of requiredUrls) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) {
    throw new Error(`サイトマップに必要なURLがありません: ${url}`);
  }
}

const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
if (!robots.includes('Sitemap: https://help.ivrm.jp/sitemap.xml')) {
  throw new Error('robots.txtにサイトマップURLが設定されていません。');
}

console.log('生成物の検証に成功しました。');
