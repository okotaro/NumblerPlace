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
- パッケージマネージャ: npm（Node 20+）

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

- 本プロジェクトはTDD（テスト駆動開発）を採用する。新しいロジック・コンポーネントを追加する際は、失敗するテストを先に書いてから実装する（Red → Green → Refactor）。
- テストツール: Vitest + React Testing Library。実行は `npm test`。
- ロジック層（`numberPlaceService.ts` とその内部実装）はユニットテストで、UIの主要フロー（マス選択→入力→Check→クリアなど）は結合テストでカバーする。
- フェーズ1で書いた `numberPlaceService.ts` に対するテストは、フェーズ3で内部実装を差し替えた後も無修正で通ることを目標にする。これがフェーズ3の受け入れ基準そのものになる。

## コーディング規約

- TypeScript は strict モードを使用する。
- コメントは基本的に書かない。書く場合は「なぜそうしているか」が非自明なときのみ（隠れた制約、特定バグの回避策など）。何をしているかの説明や、タスク・修正内容への言及は書かない。
- 過剰な抽象化を避ける。今必要な範囲だけを実装し、将来の拡張を見越した一般化はしない（`docs/spec.md` 14章のスコープ外機能のための準備コードを書かない）。
- 状態管理は React 標準機能（useState/useReducer + カスタムフック）で完結させる。Redux等の外部状態管理ライブラリは導入しない（スコープ的に不要なため）。

## デプロイ運用

- `main` ブランチへのpushで GitHub Actions が自動的にビルドし、GitHub Pages（`https://okotaro.github.io/NumblerPlace/`）へ公開する（`docs/roadmap.md` フェーズ2）。
- `vite.config.ts` の `base` は `/NumblerPlace/` 固定。リポジトリ名を変更しない限り変更不要。
- デプロイ前にLintとテストが通ることをCIのゲートにする。テスト・Lintが失敗した状態のコードは `main` にマージしない。

## コミット/PR運用

- 特別な指定がない限り、ユーザーから明示的に依頼された場合のみコミットする。
- コミットメッセージは変更の「why」を簡潔に記述する。
