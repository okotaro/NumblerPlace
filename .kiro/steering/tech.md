# Technology Stack

## Architecture

フロントエンドのみの構成。パズルロジックは `src/services/numberPlaceService.ts` を唯一の窓口とし、UI層はその公開関数・型のみに依存する（境界の詳細は [[structure]] の Code Organization Principles を参照）。内部実装は自作のバックトラッキング法アルゴリズム（`docs/roadmap.md` フェーズ3で外部npmライブラリから置き換え済み・完了）。

## Core Technologies

- **言語**: TypeScript（strict モード）
- **フレームワーク**: React + Tailwind CSS
- **ビルド**: Vite
- **ランタイム**: Node.js 22+（vitest/jsdom の依存 undici が Node 20 では動作しないため）
- **パッケージマネージャ**: npm

## Development Standards

### Type Safety
TypeScript strict モードを使用する。

### Code Quality
- ESLint + Prettier
- コメントは基本的に書かない。書く場合は「なぜそうしているか」が非自明なときのみ（隠れた制約、特定バグの回避策など）。何をしているかの説明や、タスク・修正内容への言及は書かない
- 過剰な抽象化を避ける。今必要な範囲だけを実装し、将来の拡張を見越した一般化はしない（`docs/spec.md` 14章のスコープ外機能のための準備コードを書かない）
- 状態管理は React 標準機能（useState/useReducer + カスタムフック）で完結させる。Redux等の外部状態管理ライブラリは導入しない（スコープ的に不要なため）

### Testing
Vitest + React Testing Library。TDDの詳細な運用は [[testing]] を参照。

## Development Environment

### Common Commands
```bash
# Test: npm test
# Build: tsc -b && vite build
```

## Key Technical Decisions

- `numberPlaceService.ts` の公開インターフェースを変更する必要が生じた場合は、先に `docs/spec.md` 12章を更新してから実装する
- デプロイ・CI運用は [[deployment]]、Issue→PR運用は [[github-workflow]] を参照

---
_Document standards and patterns, not every dependency_
