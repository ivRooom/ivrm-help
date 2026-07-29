import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();

const scannedExtensions = new Set([
  '.astro',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mdx',
  '.mjs',
  '.ts',
  '.txt',
  '.yaml',
  '.yml',
]);

const ignoredFiles = new Set([
  'package-lock.json',
  'scripts/check-public-content.mjs',
]);

const checks = [
  {
    reason: '秘密鍵が含まれています',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
  },
  {
    reason: 'GitHubアクセストークンの可能性があります',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g,
  },
  {
    reason: 'AWSアクセスキーの可能性があります',
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    reason: 'OpenAI APIキーの可能性があります',
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    reason: 'Slackトークンの可能性があります',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    reason: '認証情報を含むURLがあります',
    pattern: /\bhttps?:\/\/[^\s/:@]+:[^\s/@]+@[^\s]+/g,
  },
  {
    reason: 'プライベートIPv4アドレスがあります',
    pattern: /\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b/g,
  },
  {
    reason: '内部向けホスト名の可能性があります',
    pattern: /\b[a-z0-9][a-z0-9.-]*\.(?:internal|corp|lan|local|home\.arpa)\b/gi,
  },
  {
    reason: '固定された認証情報の可能性があります',
    pattern: /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd)\b\s*[:=]\s*["'][^\s"'`$<{]{12,}["']/gi,
  },
];

const { stdout } = await execFileAsync('git', ['ls-files', '-z'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});

const trackedFiles = stdout.split('\0').filter(Boolean);
const findings = [];
let scannedFileCount = 0;

for (const relativePath of trackedFiles) {
  if (ignoredFiles.has(relativePath)) continue;
  if (!scannedExtensions.has(path.extname(relativePath).toLowerCase())) continue;

  const content = await readFile(path.join(root, relativePath), 'utf8');
  scannedFileCount += 1;

  for (const check of checks) {
    check.pattern.lastIndex = 0;
    for (const match of content.matchAll(check.pattern)) {
      const line = content.slice(0, match.index).split('\n').length;
      findings.push({ relativePath, line, reason: check.reason });
    }
  }
}

if (findings.length > 0) {
  console.error('公開リポジトリへ置けない可能性がある情報を検出しました。');
  for (const finding of findings) {
    console.error(`- ${finding.relativePath}:${finding.line} ${finding.reason}`);
  }
  console.error('実値は削除し、公開用の予約済みドメイン・IPアドレス・ダミー値へ置き換えてください。');
  process.exitCode = 1;
} else {
  console.log(`公開情報の安全性チェックに成功しました: ${scannedFileCount}ファイル`);
}
