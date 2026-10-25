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

Astroの2026-10時点の最小要件に合わせ、Node.js **22.23.4以上**を使用します。CI・GitHub Pagesのビルドも22.23.4へ固定しています（旧 `22` 指定では22.23.3が選ばれ、Astro Checkが失敗したため）。

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

記事は`src/content/docs/`配下へMarkdownまたはMDX形式で追加します。公開用日本語/英語記事と、リポジトリ内の内部運用/設計資料は区別します。

仕様・更新審査・画面/業務フロー・運用・テスト/受入については[Help Center システム設計・運用文書](docs/system-design.md)と[公開品質/運用Runbook](docs/content-runbook.md)を参照してください。

## デプロイ

`main`ブランチへのpushで`.github/workflows/deploy.yml`が実行され、GitHub Pagesへ公開されます。**ドキュメントだけのmain更新でも本番Pagesデプロイを起動**するため、PRレビュー/チェック結果/公開タイミングを確認してからマージします。

GitHubの`Settings > Pages`でSourceを`GitHub Actions`に設定してください。

## カスタムドメイン

- Domain: `help.ivrm.jp`
- Cloudflare DNS: `CNAME help ivrooom.github.io`
- 初期構築時のProxy status: `DNS only`

## 情報公開ルール

認証情報、内部IP、サーバー管理用ポート、バックアップ保存先、個人情報などの非公開情報を記事へ記載しないでください。
