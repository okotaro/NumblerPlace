# Product Overview

ナンバープレースのWebアプリ。PCブラウザで9x9盤面を操作し、解答・候補メモ・非候補メモを入力しながらパズルを解く。GitHub Pagesで公開する。

詳細な機能仕様は `docs/spec.md`、開発フェーズの計画・進捗は `docs/roadmap.md` を参照。両ドキュメントとステアリング（本ディレクトリ）は一貫している状態を保つ（一方を変更したら矛盾がないか確認する）。

## Core Capabilities

- 9x9盤面での数字入力（解答・候補メモ・非候補メモの切り替え）
- パズル生成・解答チェック・ヒント機能（難易度選択つき）
- localStorageによる進行状態の永続化

## Naming Constraint（商標対応）

「数独」および英語表記の「SUDOKU」はいずれも登録商標のため、我々がコントロールできる範囲の文言（プロジェクトの呼称・コード識別子・ドキュメントの説明文）では使用しない。「ナンバープレース」/ `numberPlace` 系の名称に統一する。

外部ライブラリのパッケージ名（例: 過去に利用していた `sudoku-core`）はコントロール対象外であり、事実として参照するのは問題ない。

---
_Focus on patterns and purpose, not exhaustive feature lists_
