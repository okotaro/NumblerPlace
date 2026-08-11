# ナンバープレースWebアプリ 開発ロードマップ

詳細仕様は `docs/spec.md`、開発の指針は `CLAUDE.md` を参照。全フェーズを通じてTDD（テスト駆動開発）で進める：各タスクは「失敗するテストを書く → 実装してテストを通す → リファクタリングする」のサイクルを基本とする。

## フェーズ1: UI構築とライブラリ接続（MVP作成）

### 目的

ラフ画（`prompts/01_全体図.jpg`, `prompts/01_盤面マス.jpg`）と `docs/spec.md` に基づき、PCブラウザで最初から最後まで（New Game → 入力・メモ → Check → クリア）一通り遊べる状態を作る。ロジックは外部ライブラリに委譲する。

### タスク

1. Vite + React + TypeScript + Tailwind CSS のプロジェクト初期セットアップ（`npm create vite@latest` 相当、ESLint/Prettier含む）
2. `src/services/numberPlaceService.ts` の定義（`docs/spec.md` 12章のインターフェースに準拠）。外部ライブラリ（想定: `sudoku-core`）呼び出しをラップする実装
3. `numberPlaceService.ts` に対するユニットテスト（Vitest）を先に作成し、TDDでラップ実装を進める
4. CSS Gridによる9x9盤面コンポーネント（`Board`, `Cell`）の実装。マス選択、選択マス／関連行列ブロックのハイライトを含む
5. 操作部コンポーネント（数字パッド、戻る、消しゴム、メモON/OFFトグル、Check、New Game）の実装
6. 解答・候補メモ・非候補メモの入力ロジック（循環ロジック含む、`docs/spec.md` 4.2章）を、状態管理（React state/useReducerなど）とあわせて実装
7. Undo履歴スタックの実装
8. PC操作用キーボードイベント処理（矢印キー移動、テンキー入力、Delete/Backspaceでの消去）
9. 解答チェック機能（Checkボタン）とエラー表示・解除ロジック
10. クリア自動検出とクリア演出（モーダル等）
11. localStorageへの自動保存・復元（`docs/spec.md` 10章のスキーマに準拠）
12. 主要コンポーネント・フックの結合テスト（React Testing Library）

### 完了条件（Definition of Done）

- New Gameで盤面が生成され、マウス操作・キーボード操作の両方で解答・候補メモ・非候補メモを入力できる
- Undo・消しゴム・メモON/OFFが仕様通り動作する
- Checkボタンで誤答マスが色付けされ、該当マスの値を変更すると色が消える
- 全マス正解でクリア演出が表示される
- ブラウザをリロードしても進行中の盤面が復元される
- `numberPlaceService.ts` の主要関数にユニットテストがあり、UIの主要フローに結合テストがある。`npm test` が全て通る

## フェーズ2: 自動デプロイ環境の構築

### 目的

`main` ブランチへのpushをトリガに、GitHub Pages（`https://okotaro.github.io/NumblerPlace/`）へ自動でビルド・公開されるようにする。

### タスク

1. `vite.config.ts` に GitHub Pages 用の `base: '/NumblerPlace/'` を設定
2. GitHub Actions ワークフロー（`.github/workflows/deploy.yml` 等）を追加し、`main` へのpushで以下を実行する:
   - 依存関係インストール（`npm ci`）
   - Lintとテストの実行（品質ゲート。失敗時はデプロイしない）
   - `npm run build`
   - `actions/deploy-pages` 等でGitHub Pagesへ公開
3. GitHubリポジトリ設定でPagesのソースを「GitHub Actions」に変更（手動でのリポジトリ設定作業、実装者が実施）

### 完了条件

- `main` へのpush後、GitHub Actionsが自動実行され、テスト・Lintが通った場合のみビルド成果物がGitHub Pagesに公開される
- 公開されたページで実際にゲームがプレイできる（`base` パスの誤りによるアセット404が発生しない）

## フェーズ3: アルゴリズム自作と差し替え

### 目的

`numberPlaceService.ts` の内部実装を、外部ライブラリから自作のバックトラッキング法によるアルゴリズムへ置き換える。UI層のコードには一切変更を加えない。

### タスク

1. バックトラッキング法によるパズル解法関数（盤面を受け取り解を返す／解の一意性を判定する）を自作し、ユニットテストを先に書く
2. バックトラッキング法（＋ランダム化）による盤面生成関数（指定難易度に応じてヒントセルを間引く処理を含む）を自作し、ユニットテストを先に書く
3. `numberPlaceService.ts` の内部実装のみを自作関数に差し替える。公開インターフェース（`docs/spec.md` 12章）は変更しない
4. フェーズ1で作成した `numberPlaceService.ts` のユニットテスト・UIの結合テストを**無修正のまま**実行し、全て通ることを確認する
5. 外部ライブラリへの依存（`package.json`）を削除する

### 完了条件

- `numberPlaceService.ts` の公開関数のシグネチャ・戻り値の意味がフェーズ1と変わらない
- フェーズ1で書いたテストがコード変更なしに全て通る
- UIコンポーネント側のコードに変更が発生していない（diffで確認）
- 外部のパズル解法ライブラリへの依存が `package.json` から削除されている

## フェーズ横断の作業指針

- 各タスクは可能な限り「テストを先に書く」小さな単位に分割して進める
- `numberPlaceService.ts` の公開契約を変更する場合は `docs/spec.md` 12章を必ず更新してから着手する
- 本ロードマップに記載のない機能（`docs/spec.md` 14章「スコープ外・将来検討事項」）は、別途合意なくフェーズに追加しない
