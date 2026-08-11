# generator.ts テスト仕様書

対象: `src/services/backtracking/generator.ts`
関連仕様: `docs/roadmap.md` フェーズ3タスク2、`docs/spec.md` 7章

自作バックトラッキング法（＋ランダム化）による完成盤面生成（`generateSolvedBoard`）と、
それを間引いて作る問題生成（`generatePuzzleBoard`）を検証する。

## generateSolvedBoard

| #   | ケース                             | 前提・入力     | 期待される結果                                                    |
| --- | ------------------------------------ | -------------- | --------------------------------------------------------------------- |
| 1   | 9x9の完成した妥当な盤面が返る      | なし           | 各行・列・3x3ブロックに1〜9が重複なく含まれる                       |
| 2   | 呼び出すたびにランダムな盤面になる | 複数回呼び出す | 少なくとも1組は異なる盤面になる（全呼び出し結果が同一にならない）   |

## generatePuzzleBoard

| #   | ケース                                     | 前提・入力                                     | 期待される結果                                                        |
| --- | -------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | 難易度ごとに9x9のgiven・solutionが返る     | difficulty = `'easy'`〜`'master'` の全5種          | given・solutionともに9x9の二次元配列                                     |
| 2   | solutionが数独として妥当                   | 上記と同じ                                         | 各行・列・3x3ブロックに1〜9が重複なく含まれる                            |
| 3   | ヒントセルは正解と一致する                 | difficulty = `'medium'`                            | `given[r][c]` がnullでない場合、`solution[r][c]` と同じ値                |
| 4   | 生成された盤面はヒントと空欄が混在する     | difficulty = `'medium'`                            | givenに非null値とnullの両方が存在する                                    |
| 5   | givenは一意解を持つ                        | difficulty = `'easy'`〜`'master'` の全5種          | `hasUniqueSolution(given)` が `true`（自作solverで検証）                 |
| 6   | 難易度が上がるほどヒント数は少なくなる傾向 | easyとmasterでそれぞれ`generatePuzzleBoard`を実行 | easyのヒント数 > masterのヒント数                                        |
