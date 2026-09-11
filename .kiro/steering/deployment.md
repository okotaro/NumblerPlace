# Deployment Standards

GitHub Pages + GitHub Actions によるデプロイ。

## CI/CD Flow

- `main` ブランチへのpushで GitHub Actions（`deploy.yml`）が自動的にビルドし、`gh-pages` ブランチへpublishする（`peaceiris/actions-gh-pages`、`keep_files: true`）。GitHub Pagesはこの `gh-pages` ブランチをソースとして配信する（`https://okotaro.github.io/NumblerPlace/`）
- `vite.config.ts` の `base` は `/NumblerPlace/` 固定。リポジトリ名を変更しない限り変更不要
- デプロイ前にLint・型チェック（`tsc -b`）・テストが通ることをCIのゲートにする（`ci.yml`）。これらが失敗した状態のコードは `main` にマージしない

## PRプレビュー

- PRごとに `https://okotaro.github.io/NumblerPlace/pr-preview/pr-<PR番号>/` へ自動プレビューがデプロイされる（`pr-preview.yml`、`rossjrw/pr-preview-action`）
- プレビューURLはPRへのコメントで通知され、PRクローズ時に自動削除される
- `vite.config.ts` の `base` 自体は変更せず、プレビュービルド時のみ `vite build --base=...` で上書きする

---
_Focus on rollout patterns and safeguards. No provider-specific steps._
