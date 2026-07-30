import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

const collectHtmlFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(absolutePath);
    return entry.isFile() && entry.name.endsWith('.html') ? [absolutePath] : [];
  }));
  return nested.flat();
};

const attributeValue = (attributes, name) => {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
  const match = attributes.match(pattern);
  return match ? (match[1] ?? match[2] ?? '') : null;
};

const hasAttribute = (attributes, name) => (
  new RegExp(`\\b${name}(?:\\s*=|\\s|$)`, 'i').test(attributes)
);

const decodeEntities = (value) => value
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
  .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)));

const visibleText = (markup) => decodeEntities(
  markup
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim(),
);

const lineNumberAt = (source, index) => source.slice(0, index).split('\n').length;

const failures = [];
const addFailure = (filePath, source, index, reason) => {
  failures.push({
    file: path.relative(root, filePath),
    line: lineNumberAt(source, Math.max(0, index)),
    reason,
  });
};

try {
  await access(dist);
} catch {
  throw new Error('distが見つかりません。先にAstroの本番ビルドを実行してください。');
}

const htmlFiles = await collectHtmlFiles(dist);
if (htmlFiles.length === 0) {
  throw new Error('検査対象のHTMLがdistにありません。');
}

for (const filePath of htmlFiles) {
  const html = await readFile(filePath, 'utf8');
  const markup = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '');

  const htmlTag = markup.match(/<html\b([^>]*)>/i);
  if (!htmlTag) {
    addFailure(filePath, html, 0, 'html要素がありません');
  } else {
    const lang = attributeValue(htmlTag[1], 'lang');
    if (!lang?.trim()) {
      addFailure(filePath, html, htmlTag.index ?? 0, 'html[lang]が空または未設定です');
    }
  }

  const title = markup.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (!title || !visibleText(title[1])) {
    addFailure(filePath, html, title?.index ?? 0, '空でないtitle要素が必要です');
  }

  if (!/<main\b[^>]*>/i.test(markup)) {
    addFailure(filePath, html, 0, 'main要素がありません');
  }

  const ids = new Map();
  for (const match of markup.matchAll(/\bid\s*=\s*(?:"([^"]+)"|'([^']+)')/gi)) {
    const id = match[1] ?? match[2];
    if (ids.has(id)) {
      addFailure(filePath, html, match.index ?? 0, `重複IDがあります: ${id}`);
    } else {
      ids.set(id, match.index ?? 0);
    }
  }

  for (const match of markup.matchAll(/<img\b([^>]*)>/gi)) {
    if (!hasAttribute(match[1], 'alt')) {
      addFailure(filePath, html, match.index ?? 0, 'img要素にalt属性がありません');
    }
  }

  for (const match of markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attributes = match[1];
    const body = match[2];
    const ariaLabel = attributeValue(attributes, 'aria-label')?.trim();
    const labelledBy = attributeValue(attributes, 'aria-labelledby')?.trim();
    const titleText = attributeValue(attributes, 'title')?.trim();
    const text = visibleText(body);

    if (!ariaLabel && !labelledBy && !titleText && !text) {
      addFailure(filePath, html, match.index ?? 0, 'button要素にアクセシブルな名前がありません');
    }

    if (labelledBy) {
      for (const reference of labelledBy.split(/\s+/)) {
        if (!ids.has(reference)) {
          addFailure(filePath, html, match.index ?? 0, `buttonのaria-labelledby参照先がありません: ${reference}`);
        }
      }
    }
  }

  for (const match of markup.matchAll(/<input\b([^>]*)>/gi)) {
    const attributes = match[1];
    const type = (attributeValue(attributes, 'type') ?? 'text').toLowerCase();
    if (!['button', 'submit', 'reset', 'image'].includes(type)) continue;

    const ariaLabel = attributeValue(attributes, 'aria-label')?.trim();
    const labelledBy = attributeValue(attributes, 'aria-labelledby')?.trim();
    const value = attributeValue(attributes, type === 'image' ? 'alt' : 'value')?.trim();
    const titleText = attributeValue(attributes, 'title')?.trim();
    if (!ariaLabel && !labelledBy && !value && !titleText) {
      addFailure(filePath, html, match.index ?? 0, `input[type=${type}]にアクセシブルな名前がありません`);
    }
  }

  for (const match of markup.matchAll(/<dialog\b([^>]*)>/gi)) {
    const attributes = match[1];
    const ariaLabel = attributeValue(attributes, 'aria-label')?.trim();
    const labelledBy = attributeValue(attributes, 'aria-labelledby')?.trim();

    if (!ariaLabel && !labelledBy) {
      addFailure(filePath, html, match.index ?? 0, 'dialog要素にaria-labelまたはaria-labelledbyがありません');
    }

    if (labelledBy) {
      for (const reference of labelledBy.split(/\s+/)) {
        if (!ids.has(reference)) {
          addFailure(filePath, html, match.index ?? 0, `dialogのaria-labelledby参照先がありません: ${reference}`);
        }
      }
    }
  }

  for (const match of markup.matchAll(/<a\b([^>]*)>/gi)) {
    const attributes = match[1];
    const href = attributeValue(attributes, 'href')?.trim() ?? '';
    const target = attributeValue(attributes, 'target')?.trim().toLowerCase();
    if (!/^https?:\/\//i.test(href) || target !== '_blank') continue;

    const rel = (attributeValue(attributes, 'rel') ?? '').toLowerCase().split(/\s+/);
    if (!rel.includes('noopener') && !rel.includes('noreferrer')) {
      addFailure(filePath, html, match.index ?? 0, 'target="_blank"の外部リンクにrel="noopener"またはrel="noreferrer"がありません');
    }
  }
}

if (failures.length > 0) {
  console.error('生成HTMLのアクセシビリティ検査に失敗しました。');
  for (const failure of failures) {
    console.error(`- ${failure.file}:${failure.line} ${failure.reason}`);
  }
  process.exitCode = 1;
} else {
  console.log(`生成HTMLのアクセシビリティ検査に成功しました: ${htmlFiles.length}ファイル`);
}
