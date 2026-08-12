# NumblerPlace

ナンバープレースのWebアプリ。詳細な機能仕様は `docs/spec.md`、開発フェーズの計画は `docs/roadmap.md`、開発・構築の指針は `CLAUDE.md` を参照。

## 動作環境

- Node.js 22以上（vitest/jsdomがNode 20では動作しないため）
- npm

## セットアップ

```bash
npm install
```

## ローカルでの動作確認

```bash
npm run dev
```

起動後にターミナルへ表示されるURL（例: `http://localhost:5173/NumblerPlace/`）をブラウザで開く。`vite.config.ts` の `base` を `/NumblerPlace/` 固定にしているため、末尾のパスを含めてアクセスすること（ルート `http://localhost:5173/` を開いた場合も自動的に `/NumblerPlace/` へリダイレクトされる）。

停止するには、`npm run dev` を実行しているターミナルで `Ctrl+C`。

### devcontainer / Codespaces で「何も表示されない」場合

VS CodeのDev Containers拡張機能やGitHub Codespacesでこのリポジトリを開いている場合、コンテナ内の `localhost` がそのままではホスト側のブラウザに転送されず、白紙のページになることがある。以下を試すこと。

- VS Codeの **PORTS** パネルで対象ポート（5173など）の地球儀アイコンから転送後のURLを開く（`localhost:5173` を手打ちしない）
- それでも解決しない場合は、`--host` を付けて起動し直す

  ```bash
  npm run dev -- --host
  ```

## テスト・Lint・ビルド

```bash
npm test              # Vitestでユニット/結合テストを実行
npm run lint           # ESLint
npm run format:check   # Prettierのフォーマットチェック（npm run format で自動整形）
npm run build          # 型チェック(tsc)を含む本番ビルド
```

## デプロイ

`main` ブランチへのpushでGitHub Actionsが自動的にビルドし、GitHub Pages（`https://okotaro.github.io/NumblerPlace/`）へ公開される（Lint・テストが通った場合のみ。詳細は `docs/roadmap.md` フェーズ2）。


