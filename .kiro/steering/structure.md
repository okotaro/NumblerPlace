# Project Structure

## Organization Philosophy

サービス層ゲートウェイ方式。パズルロジックへのアクセスは全て `src/services/numberPlaceService.ts` を経由させ、UIとロジック実装（外部ライブラリ／自作アルゴリズム）を切り離す。

## Directory Patterns

### Components
**Location**: `src/components/`
**Purpose**: Reactコンポーネント（Board, Cell, NumberPad, Controls 等）

### Hooks
**Location**: `src/hooks/`
**Purpose**: カスタムフック（`useNumberPlaceGame` 等の状態管理ロジック）

### Services
**Location**: `src/services/`
**Purpose**: `numberPlaceService.ts` がパズルロジックの唯一の窓口。内部実装（自作バックトラッキング等）は `src/services/backtracking/` 配下に置き、この境界の外には公開しない

### Types / Utils
**Location**: `src/types/`, `src/utils/`
**Purpose**: 共有の型定義（Cell, Board, GameState 等）、汎用ユーティリティ（localStorage操作など）

### Docs
**Location**: `docs/`
**Purpose**: `spec.md`（機能仕様）, `roadmap.md`（開発フェーズ計画・進捗）

## Naming Conventions

- テストファイルは実装ファイルに隣接させる（例: `Board.tsx` に対し `Board.test.tsx`）

## Code Organization Principles

**必須ルール: UIコンポーネント（`src/components/`, `src/hooks/`）は `src/services/numberPlaceService.ts` が公開する関数・型のみに依存し、外部ライブラリや自作アルゴリズムの型・実装を直接importしてはならない。**

理由: `docs/roadmap.md` フェーズ3で `numberPlaceService.ts` の内部実装を自作バックトラッキングアルゴリズムに差し替える際、UI層のコードを一切変更しないことが完了条件だった（達成済み）。この境界を破ると、今後同様の内部実装差し替えがUI側の改修を伴ってしまう。

`numberPlaceService.ts` の公開インターフェースを変更する場合は、先に `docs/spec.md` 12章を更新してから実装すること。

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
