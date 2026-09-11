# Testing Standards

TDD（テスト駆動開発）を採用する。ツールは Vitest + React Testing Library、実行は `npm test`。

## TDDの運用

新しいロジック・コンポーネントのテストを書く際は、次の順序で進める:

1. テストケース一覧を記した**テスト仕様書**を、実装ファイル・テストファイルに隣接するMarkdownファイル（`<対象ファイル名>.test-spec.md`。例: `numberPlaceService.ts` に対して `numberPlaceService.test-spec.md`）として作成する
2. そのテスト仕様書に基づいて失敗するテストコードを書く（Red）
3. 実装してテストを通す（Green）
4. リファクタリングする（Refactor）

テスト仕様書には各テストケースについて「検証したい振る舞い」「前提・入力」「期待される結果」を記載する。関連する `docs/spec.md` の章があれば参照を書く。

実装中にテストケースの追加・変更が生じた場合は、テスト仕様書・テストコード・実装の内容を一致させる（仕様書だけが古いままにならないようにする）。

## カバレッジの分担

- ロジック層（`numberPlaceService.ts` とその内部実装）はユニットテストでカバーする
- UIの主要フロー（マス選択→入力→Check→クリアなど）は結合テストでカバーする

## サービス層境界とテストの安定性

`numberPlaceService.ts` の公開契約に対するテストは、内部実装を差し替えても無修正で通ることを目標にする（実際に `docs/roadmap.md` フェーズ3で、外部ライブラリから自作バックトラッキングへの差し替え後もフェーズ1のテストが無修正で通ることが完了条件となり、達成済み）。境界の詳細は [[structure]] を参照。

---
_Focus on patterns and decisions. Tool-specific config lives elsewhere._
