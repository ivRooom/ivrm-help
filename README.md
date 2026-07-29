# IVRM Help Center

`help.ivrm.jp`で公開する、ivRooomコミュニティ向けのマニュアル・ルール・トラブルシューティングサイトです。

## 技術構成

- Astro
- Starlight
- TypeScript
- Markdown / MDX
- GitHub Actions
- GitHub Pages
- Cloudflare DNS

## 開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run check
npm run build
```

## 記事の追加

記事は`src/content/docs/`配下へMarkdownまたはMDX形式で追加します。

## デプロイ

`main`ブランチへのpushで`.github/workflows/deploy.yml`が実行され、GitHub Pagesへ公開されます。

GitHubの`Settings > Pages`でSourceを`GitHub Actions`に設定してください。

## カスタムドメイン

- Domain: `help.ivrm.jp`
- Cloudflare DNS: `CNAME help ivrooom.github.io`
- 初期構築時のProxy status: `DNS only`

## 情報公開ルール

認証情報、内部IP、サーバー管理用ポート、バックアップ保存先、個人情報などの非公開情報を記事へ記載しないでください。
