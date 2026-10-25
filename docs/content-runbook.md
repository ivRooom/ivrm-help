# Help Center — 更新/公開/復旧/テスト/受入Runbook

Reviewed: 2026-10-26 JST. This is a controlled checklist, **not** evidence of a completed production deployment, signed acceptance or passing CI.

## 運用手順

### コンテンツ更新前
1. Source-of-TruthがDiscord運用告知か、Minecraft構成か、API/UI仕様かを識別。相手サービスの最新Repo/Ownerと照合する。
2. `src/content/docs/**` の日本語版・`en/**` 英語版の対象を列挙。翻訳未完は未完として記録。
3. 接続先・IP/credential・内部構成を直書きしない。運用で頻繁に変わる情報はDiscord最新案内へ誘導する。
4. URL slug・Redirect/404・Navigation sidebar、画像alt、キーボード操作、モバイル表示を確認。

### ローカル/CIのテスト仕様
| Case | How | Expectation |
| --- | --- | --- |
| HELP-01 | `npm run check:public` | Token/秘密鍵/内部IP等の漏洩疑いなし |
| HELP-02 | `npm run check:links` | 内部Link/Anchorの参照整合 |
| HELP-03 | `npm run check` | Astro型/MDX check成功 |
| HELP-04 | `npm run build` | Astro build + `verify:site` + accessibility contract成功 |
| HELP-05 | ブラウザで匿名 JA/EN 遷移 | 表示・Mobile・Keyboard・404・Navigation/検索が利用可能 |
| HELP-06 | 内部運用文書の追加のみ | サイト公開内容/検索indexへの意図しない混入なし |
| HELP-07 | Pagesデプロイ後の主なURLとリンク | 期待SHAの公開が確認できる |

実行結果は `.github/workflows/ci.yml` のworkflow run SHA・Job Logs、`deploy.yml` のPages Deploy SHA、手動UATの日時/環境/スクリーンショット等を保存する。**テストコード存在とCI成功を混同しない**。

### 本番公開
1. PR review/CI完了、変更による公開対象の差分を確認する。GitHub Pagesの`main` Push deployは自動発動なので、マージは公開操作とみなす。
2. `SITE_URL`、`BASE_PATH`、`Settings > Pages` (Source GitHub Actions)、Cloudflare DNSの現行値をread-onlyで確認。
3. リンク切れ、公開禁止情報、操作説明の旧Version、英語翻訳の整合性、データ扱いを最終点検する。
4. 承認された変更をマージし、GitHub Pages deploy Jobが成功し期待Commit SHAのbundleで公開されていることを確認。
5. 重要ページ（Home/Discord Join/Minecraft Join/Rules/Support）の匿名表示と検索・モバイルの回帰を確認。

### ロールバック・インシデント
- 誤掲載のToken/個人情報は**単なるGit revertだけで解決しない**。直ちに公開停止/秘匿情報の失効と再発行/権限・キャッシュ/履歴の精査を行い、正式Incident処理を優先する。
- 一般的なリンク/表示不具合は、影響リリースのSHAと安全な既知Commitを確認したうえで修正PRまたは承認済みrevertを使用。Pages rollout完了まで旧ページが残る可能性を考慮。
- 重大なMinecraft/Discord参加条件の誤りは情報Ownerに確認して更新。独自判断でサーバー接続Version/Allowlist条件を断定しない。

## 受入テスト項目・検収（未署名）

| ID | 合格基準 | 判定 |
| --- | --- | --- |
| UAT-H01 | 認証なしで主要な日本語コンテンツへアクセス可能 | 未確認 |
| UAT-H02 | 英語が存在するページと存在しないページを正しく区別 | 未確認 |
| UAT-H03 | 最新のMinecraft/Discord参加方法が公式案内と一致 | 未確認 |
| UAT-H04 | 公開ページ・bundleにSecret/非公開データなし | 未確認 |
| UAT-H05 | 主要Navigation/404/リンク/Keyboard/Mobileが機能 | 未確認 |
| UAT-H06 | GitHub Pages Release・rollback窓口が文書化 | 未確認 |

受入者 / 対象SHA / 実環境 / 日時 / 結果 / 証拠 / 不具合一覧リンクを記入したときだけ検収判定する。バグは [Issue tracker](https://github.com/ivRooom/ivrm-help/issues)で管理する。

## 文書保守チェック

次の変更は関連資料の再レビューを要求: Minecraft Modpack/Java/Loader/Whitelist、Discord参加Role/招待、OAuth UI導線、Contact受付、公開ドメイン、Astro/Starlight更新、GitHub Pages Workflow、外部Link/画像資産、翻訳差分。

RPO/RTOや運用SLA、承認済み検収は未定義。バックアップDB/移行手順はN/A（このRepoは静的サイト）。
