# CLAUDE.md

このファイルは、このリポジトリで作業する際の開発・構築指針である。詳細な機能仕様は `docs/spec.md`、開発フェーズの計画は `docs/roadmap.md` を参照すること。両ドキュメントとこのファイルは一貫している状態を保つ（一方を変更したら矛盾がないか確認する）。

## プロジェクト概要

ナンバープレースのWebアプリ。PCブラウザで9x9盤面を操作し、解答・候補メモ・非候補メモを入力しながらパズルを解く。GitHub Pagesで公開する。

「数独」および英語表記の「SUDOKU」はいずれも登録商標のため、我々がコントロールできる範囲の文言（プロジェクトの呼称・コード識別子・ドキュメントの説明文）では使用しない（「ナンバープレース」/ `numberPlace` 系の名称に統一する）。外部ライブラリのパッケージ名（例: `sudoku-core`）はコントロール対象外であり、事実として参照するのは問題ない。

## 技術スタック

- フロントエンド: Vite + React (TypeScript) + Tailwind CSS
- ロジック層: `src/services/numberPlaceService.ts`
  - フェーズ1: npmライブラリ（想定 `sudoku-core`）をラップ
  - フェーズ3: バックトラッキング法による自作アルゴリズムに差し替え（`docs/roadmap.md` 参照）
- テスト: Vitest + React Testing Library
- Lint/Format: ESLint + Prettier
- インフラ: GitHub Pages + GitHub Actions
- パッケージマネージャ: npm（Node 22+。vitest/jsdomの依存undiciがNode 20では動作しないため）

## ディレクトリ構成方針

```
src/
  components/     # Reactコンポーネント（Board, Cell, NumberPad, Controls 等）
  hooks/          # カスタムフック（useNumberPlaceGame 等の状態管理ロジック）
  services/
    numberPlaceService.ts   # パズルロジックの唯一の窓口
  types/          # 共有の型定義（Cell, Board, GameState 等）
  utils/          # 汎用ユーティリティ（localStorage操作など）
docs/
  spec.md
  roadmap.md
```

- テストファイルは実装ファイルに隣接させる（例: `Board.tsx` に対し `Board.test.tsx`）。

## アーキテクチャ上の必須ルール

**UIコンポーネント（`src/components/`, `src/hooks/`）は `src/services/numberPlaceService.ts` が公開する関数・型のみに依存し、外部ライブラリ（sudoku-core等）や自作アルゴリズムの型・実装を直接importしてはならない。**

理由: `docs/roadmap.md` フェーズ3で `numberPlaceService.ts` の内部実装を自作バックトラッキングアルゴリズムに差し替える際、UI層のコードを一切変更しないことが完了条件になっている。この境界を破るとフェーズ3の作業がUI側の改修を伴ってしまう。

`numberPlaceService.ts` の公開インターフェースを変更する必要が生じた場合は、先に `docs/spec.md` 12章を更新してから実装すること。

## TDDの運用

- 本プロジェクトはTDD（テスト駆動開発）を採用する。新しいロジック・コンポーネントのテストを書く際は、次の順序で進める:
  1. テストケース一覧を記した**テスト仕様書**を、実装ファイル・テストファイルに隣接するMarkdownファイル（`<対象ファイル名>.test-spec.md`。例: `numberPlaceService.ts` に対して `numberPlaceService.test-spec.md`）として作成する
  2. そのテスト仕様書に基づいて失敗するテストコードを書く（Red）
  3. 実装してテストを通す（Green）
  4. リファクタリングする（Refactor）
- テスト仕様書には各テストケースについて「検証したい振る舞い」「前提・入力」「期待される結果」を記載する。関連する `docs/spec.md` の章があれば参照を書く。
- 実装中にテストケースの追加・変更が生じた場合は、テスト仕様書・テストコード・実装の内容を一致させる（仕様書だけが古いままにならないようにする）。
- テストツール: Vitest + React Testing Library。実行は `npm test`。
- ロジック層（`numberPlaceService.ts` とその内部実装）はユニットテストで、UIの主要フロー（マス選択→入力→Check→クリアなど）は結合テストでカバーする。
- フェーズ1で書いた `numberPlaceService.ts` に対するテストは、フェーズ3で内部実装を差し替えた後も無修正で通ることを目標にする。これがフェーズ3の受け入れ基準そのものになる。

## コーディング規約

- TypeScript は strict モードを使用する。
- コメントは基本的に書かない。書く場合は「なぜそうしているか」が非自明なときのみ（隠れた制約、特定バグの回避策など）。何をしているかの説明や、タスク・修正内容への言及は書かない。
- 過剰な抽象化を避ける。今必要な範囲だけを実装し、将来の拡張を見越した一般化はしない（`docs/spec.md` 14章のスコープ外機能のための準備コードを書かない）。
- 状態管理は React 標準機能（useState/useReducer + カスタムフック）で完結させる。Redux等の外部状態管理ライブラリは導入しない（スコープ的に不要なため）。

## デプロイ運用

- `main` ブランチへのpushで GitHub Actions（`deploy.yml`）が自動的にビルドし、`gh-pages` ブランチへpublishする（`peaceiris/actions-gh-pages`、`keep_files: true`）。GitHub Pagesはこの `gh-pages` ブランチをソースとして配信する（`https://okotaro.github.io/NumblerPlace/`、`docs/roadmap.md` フェーズ2）。
- `vite.config.ts` の `base` は `/NumblerPlace/` 固定。リポジトリ名を変更しない限り変更不要。
- デプロイ前にLint・型チェック（`tsc -b`）・テストが通ることをCIのゲートにする。これらが失敗した状態のコードは `main` にマージしない。
- PRごとに `https://okotaro.github.io/NumblerPlace/pr-preview/pr-<PR番号>/` へ自動プレビューがデプロイされる（`pr-preview.yml`、`rossjrw/pr-preview-action`）。プレビューURLはPRへのコメントで通知され、PRクローズ時に自動削除される。`vite.config.ts` の `base` 自体は変更せず、プレビュービルド時のみ `vite build --base=...` で上書きする。

## コミット/PR運用

- 特別な指定がない限り、ユーザーから明示的に依頼された場合のみコミットする。
- コミットメッセージは変更の「why」を簡潔に記述する。

## Issue→PR運用フロー（GitHub Actions連携）

`.github/workflows/claude-plan.yml` / `claude-implement.yml` / `claude-review.yml` / `claude-nightly-implement.yml`（いずれも `anthropics/claude-code-action`）により、Issueベースの開発フローをGitHub上で運用する。ステージごとに明示的なトリガーフレーズを使い分け、各ジョブは目的外のツール（ファイル変更等）を持たない設計にしている。

1. Issueを起票する
2. Issueを `claude` にアサイン、またはIssueに `@claude 計画して` とコメント（`claude-plan.yml` が読み取り専用で計画を立て、コメントする。要件が曖昧な場合は質問する）
3. 計画に変更が必要なら再度 `@claude 計画して` でコメントする
4. 計画を承認する場合、次のいずれかで実装を開始する
   - Issueに `@claude 実装して` とコメントする（`claude-implement.yml` がTDDでの実装・ブランチ作成・PR作成まで行う）
   - すぐに実装させたくない場合はIssueに `claude-auto-implement` ラベルを付ける。`claude-nightly-implement.yml` が毎晩4:00 JST頃に、このラベルが付いた最も古いopen Issueを1件選び、ラベルを外した上で夜間実行である旨がわかる記録用コメントを投稿し、同一ジョブ内で直接 `claude-code-action` を実行して実装・ブランチ作成・PR作成まで行う（1晩1件まで）。`claude-implement.yml`（`issue_comment` トリガー）は経由しない（`GITHUB_TOKEN` で作成したコメントは他ワークフローの起動トリガーにならないため）。手動で `@claude 実装して` を実行した場合は、二重処理を避けるため `claude-auto-implement` ラベルが付いていれば外しておくこと
5. PR上で `@claude レビューして <観点>` とコメントすると、`claude-review.yml` が指定観点でレビューコメントを付ける（ファイル変更はしない）
6. PR上でさらに修正してほしい内容がある場合は、通常コメントまたはインラインのレビューコメントで `@claude 実装して <指示内容>` とコメントする（`claude-implement.yml` が新規ブランチ・新規PRを作らず、そのPRのブランチに直接コミット・pushする）
7. マージはClaudeに行わせず、ユーザーがGitHub上で手動で行う（`main` はレビュー承認必須・CI必須のブランチ保護がかかっている）

画面とコマンドの対応は次のとおり（迷ったらこの表を参照する）。

| 画面 | コマンド/操作 | 動作 | ファイル変更 |
|---|---|---|---|
| Issue | `@claude 計画して`（アサインでも可） | 実装計画をコメント | なし |
| Issue | `@claude 実装して` | 新規ブランチ作成→TDD実装→新規PR作成 | あり |
| Issue | `claude-auto-implement` ラベル付与 | 夜間バッチで上記を自動実行 | あり |
| PR | `@claude レビューして <観点>` | 指定観点でレビューコメント | なし |
| PR | `@claude 実装して <指示内容>` | 既存PRブランチに直接コミット・push（新規PR作成なし） | あり |

`claude-auto-implement` ラベルはリポジトリ側で事前に作成しておく必要がある（例: `gh label create claude-auto-implement --description "夜間バッチで自動実装トリガーする対象" --color <任意>`）。
