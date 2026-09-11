# Issue→PR運用フロー（GitHub Actions連携）

`.github/workflows/claude-plan.yml` / `claude-implement.yml` / `claude-review.yml` / `claude-nightly-implement.yml`（いずれも `anthropics/claude-code-action`）により、Issueベースの開発フローをGitHub上で運用する。ステージごとに明示的なトリガーフレーズを使い分け、各ジョブは目的外のツール（ファイル変更等）を持たない設計にしている。

この運用は本リポジトリの `.kiro/` ベースのSDDワークフロー（Discovery→Spec→Impl）とは別系統。Issueコメント経由でのGitHub Actions駆動が必要な場合にこちらを使う。

## フロー

1. Issueを起票する
2. Issueを `claude` にアサイン、またはIssueに `@claude 計画して` とコメント（`claude-plan.yml` が読み取り専用で計画を立て、コメントする。要件が曖昧な場合は質問する）
3. 計画に変更が必要なら再度 `@claude 計画して` でコメントする
4. 計画を承認する場合、次のいずれかで実装を開始する
   - Issueに `@claude 実装して` とコメントする（`claude-implement.yml` がTDDでの実装・ブランチ作成・PR作成まで行う）
   - すぐに実装させたくない場合はIssueに `claude-auto-implement` ラベルを付ける。`claude-nightly-implement.yml` が毎晩4:00 JST頃に、このラベルが付いた最も古いopen Issueを1件選び、ラベルを外した上で夜間実行である旨がわかる記録用コメントを投稿し、同一ジョブ内で直接 `claude-code-action` を実行して実装・ブランチ作成・PR作成まで行う（1晩1件まで）。`claude-implement.yml`（`issue_comment` トリガー）は経由しない（`GITHUB_TOKEN` で作成したコメントは他ワークフローの起動トリガーにならないため）。手動で `@claude 実装して` を実行した場合は、二重処理を避けるため `claude-auto-implement` ラベルが付いていれば外しておくこと
5. PR上で `@claude レビューして <観点>` とコメントすると、`claude-review.yml` が指定観点でレビューコメントを付ける（ファイル変更はしない）
6. PR上でさらに修正してほしい内容がある場合は、通常コメントまたはインラインのレビューコメントで `@claude 実装して <指示内容>` とコメントする（`claude-implement.yml` が新規ブランチ・新規PRを作らず、そのPRのブランチに直接コミット・pushする）
7. マージはClaudeに行わせず、ユーザーがGitHub上で手動で行う（`main` はレビュー承認必須・CI必須のブランチ保護がかかっている）

## 画面とコマンドの対応

迷ったらこの表を参照する。

| 画面 | コマンド/操作 | 動作 | ファイル変更 |
|---|---|---|---|
| Issue | `@claude 計画して`（アサインでも可） | 実装計画をコメント | なし |
| Issue | `@claude 実装して` | 新規ブランチ作成→TDD実装→新規PR作成 | あり |
| Issue | `claude-auto-implement` ラベル付与 | 夜間バッチで上記を自動実行 | あり |
| PR | `@claude レビューして <観点>` | 指定観点でレビューコメント | なし |
| PR | `@claude 実装して <指示内容>` | 既存PRブランチに直接コミット・push（新規PR作成なし） | あり |

`claude-auto-implement` ラベルはリポジトリ側で事前に作成しておく必要がある（例: `gh label create claude-auto-implement --description "夜間バッチで自動実装トリガーする対象" --color <任意>`）。

## コミット/PR運用

- 特別な指定がない限り、ユーザーから明示的に依頼された場合のみコミットする
- コミットメッセージは変更の「why」を簡潔に記述する

---
_Issue→PR自動化はGitHub Actions側の固有運用のため、パターンではなく手順・対応表として詳細に記録する_
