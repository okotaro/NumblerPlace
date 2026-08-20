# useNumberPlaceGame.ts テスト仕様書

対象: `src/hooks/useNumberPlaceGame.ts`
関連仕様: `docs/spec.md` 3章・4章・4.1章・4.2章・5.1章・5.3章・5.4章・5.6章・7章、Issue #21

## 初期状態

| #   | ケース                                             | 期待される結果                                                                          |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | 初期化直後、boardは9x9でヒントセルが設定されている | `board` の長さが9、各行の長さが9。ヒントセルは `isGiven === true` かつ `value` が非null |
| 2   | 初期化直後、selectedはnull                         | `selected === null`                                                                     |
| 3   | 初期化直後、isMemoModeはfalse                      | `isMemoMode === false`                                                                  |

## selectCell

| #   | ケース                                     | 前提・操作                      | 期待される結果                          |
| --- | ------------------------------------------ | ------------------------------- | --------------------------------------- |
| 4   | selectCellを呼ぶとselectedが更新される     | `selectCell({row: 2, col: 3})`  | `selected` が `{row: 2, col: 3}` になる |
| 5   | 確定マス（ヒント）もselectCellで選択できる | ヒントセルの位置を `selectCell` | `selected` がそのヒント位置になる       |

## moveSelection（spec.md 6章）

| #   | ケース                                                     | 前提・操作                                            | 期待される結果                              |
| --- | ------------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------- |
| 28  | 選択中に上下左右へ1マスずつ移動できる                       | `{row:4, col:4}` を選択後 `moveSelection('up')`           | `selected` が `{row:3, col:4}` になる          |
| 29  | 盤面上端で `up` を呼んでもラップせず移動しない              | `{row:0, col:4}` を選択後 `moveSelection('up')`            | `selected` が `{row:0, col:4}` のまま変化しない |
| 30  | 盤面下端で `down` を呼んでもラップせず移動しない            | `{row:8, col:4}` を選択後 `moveSelection('down')`          | `selected` が `{row:8, col:4}` のまま変化しない |
| 31  | 盤面左端で `left` を呼んでもラップせず移動しない            | `{row:4, col:0}` を選択後 `moveSelection('left')`          | `selected` が `{row:4, col:0}` のまま変化しない |
| 32  | 盤面右端で `right` を呼んでもラップせず移動しない           | `{row:4, col:8}` を選択後 `moveSelection('right')`         | `selected` が `{row:4, col:8}` のまま変化しない |
| 33  | 何も選択していない状態でmoveSelectionを呼んでも何も起きない | `selected === null` の状態で `moveSelection('up')`         | 例外が発生せず、`selected` は `null` のまま     |

## toggleMemoMode

| #   | ケース                                                   | 前提・操作                   | 期待される結果                  |
| --- | -------------------------------------------------------- | ---------------------------- | ------------------------------- |
| 6   | toggleMemoModeを呼ぶたびにisMemoModeがtrue/false反転する | `toggleMemoMode()` を2回呼ぶ | 1回目でtrue、2回目でfalseになる |

## inputNumber（メモOFF時、spec.md 5.1章）

| #   | ケース                                                                         | 前提・操作                                                   | 期待される結果                          |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ | --------------------------------------- |
| 7   | 選択中の空マスにinputNumber(n)を呼ぶとそのマスのvalueがnになる                 | 空マスを選択後 `inputNumber(7)`                              | そのマスの `value === 7`                |
| 8   | 選択中の解答済みマスにinputNumber(n)を呼ぶと値が上書きされる                   | value=7のマスを選択後 `inputNumber(3)`                       | そのマスの `value === 3`                |
| 9   | 確定マス（ヒント）を選択している状態ではinputNumber(n)を呼んでも値は変わらない | ヒントセルを選択後 `inputNumber(n)`（元の値と異なるnを使用） | そのマスの `value` は元のヒント値のまま |
| 10  | 何も選択していない状態でinputNumber(n)を呼んでも何も起きない                   | `selected === null` の状態で `inputNumber(5)`                | 例外が発生せず、boardが変化しない       |

## inputNumber（メモON時・循環ロジック、spec.md 4.2章）

| #   | ケース                                                                              | 前提・操作                                                  | 期待される結果                            |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| 11  | メモONで選択中マスの数字nにinputNumber(n)を呼ぶとmemos[n]が'none'→'candidate'になる | メモON、空マスを選択後 `inputNumber(4)` を1回               | そのマスの `memos[4] === 'candidate'`     |
| 12  | 更にもう一度inputNumber(n)を呼ぶとmemos[n]が'candidate'→'notCandidate'になる        | 上記に続けて `inputNumber(4)` をもう1回                     | そのマスの `memos[4] === 'notCandidate'`  |
| 13  | 更にもう一度inputNumber(n)を呼ぶとmemos[n]が'notCandidate'→'none'に戻る             | 上記に続けて `inputNumber(4)` をもう1回                     | そのマスの `memos[4] === 'none'`          |
| 14  | メモONでも確定マス（ヒント）を選択している場合はmemosが変更されない                 | メモON、ヒントセルを選択後 `inputNumber(n)`                 | そのマスの `memos` は全て `'none'` のまま |
| 15  | メモON時にinputNumber(n)を呼んでもそのマスのvalueは変化しない                       | 値が入っているマスを選択・メモONにしてから `inputNumber(n)` | そのマスの `value` は変化しない           |

## completedNumbers・入力済み数字のガード（spec.md 5.1章、Issue #21）

| #   | ケース                                                                          | 前提・操作                                                                 | 期待される結果                                              |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| 60  | 初期状態のcompletedNumbersはヒント配置数が9個の数字のみを含む                    | フックをマウント（通常の生成盤面では配置数9になる数字は基本的にない想定）      | `completedNumbers` に含まれるのは実際に9個配置済みの数字のみ  |
| 61  | ある数字の配置数が9個になるとcompletedNumbersにその数字が含まれる                | 空マスに `inputNumber` を繰り返し、ある数字の盤面全体の配置数を9個にする        | `completedNumbers` にその数字が含まれる                       |
| 62  | 配置数が9個の数字にinputNumber(n)（メモOFF）を呼んでも選択中マスのvalueは変わらない | ある数字の配置数が9個の状態で、別の空マスを選択し `inputNumber(その数字)`      | 選択中マスの `value` は変化しない（`null` のまま）             |
| 63  | 配置数が9個の数字にinputNumber(n)（メモON）を呼んでも選択中マスのmemosは変わらない | メモON、ある数字の配置数が9個の状態で、別の空マスを選択し `inputNumber(その数字)` | 選択中マスの `memos[その数字]` が `'none'` のまま変化しない    |
| 64  | 誤答を含めて配置数が9個になった数字も同様に入力不可になる                        | 正解でない数字をユーザー入力で9個配置し、別の空マスに同じ数字を `inputNumber`  | 選択中マスの `value` は変化しない                              |
| 65  | 配置数9個のマスを消去すると再びその数字が入力可能になる                          | ある数字の配置数を9個にした後、そのうちの1マスを `eraseSelectedCell` で消去    | `completedNumbers` からその数字が消える。以後 `inputNumber` で入力可能 |

## eraseSelectedCell（spec.md 5.3章）

| #   | ケース                                                                            | 前提・操作                                         | 期待される結果                                      |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| 16  | 選択中マスにeraseSelectedCellを呼ぶとvalueがnullになり全メモがnoneになる          | 値・メモが入ったマスを選択後 `eraseSelectedCell()` | そのマスの `value === null`、全 `memos` が `'none'` |
| 17  | 確定マス（ヒント）を選択している状態ではeraseSelectedCellを呼んでも何も変わらない | ヒントセルを選択後 `eraseSelectedCell()`           | そのマスの `value` は元のヒント値のまま             |
| 18  | 何も選択していない状態でeraseSelectedCellを呼んでも何も起きない                   | `selected === null` の状態で `eraseSelectedCell()` | 例外が発生せず、boardが変化しない                   |

## undo（Undo履歴スタック、spec.md 5.2章）

| #   | ケース                                                                       | 前提・操作                                                                      | 期待される結果                                                  |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 20  | 解答入力後にundoを呼ぶと直前の状態（未入力）に戻る                          | 空マスを選択し `inputNumber(7)` の後 `undo()`                                    | そのマスの `value` が `null` に戻る                                |
| 21  | メモ変更後にundoを呼ぶと直前のメモ状態に戻る                                | メモONで空マスを選択し `inputNumber(4)`（none→candidate）の後 `undo()`           | そのマスの `memos[4]` が `'none'` に戻る                           |
| 22  | 消しゴム操作後にundoを呼ぶと消しゴム前の状態に戻る                          | 値を入力したマスに `eraseSelectedCell()` の後 `undo()`                           | そのマスの `value` が消しゴム前の値に戻る                          |
| 23  | 複数回の操作後、undoを複数回呼ぶと1手ずつ遡れる                             | `inputNumber(7)` → `inputNumber(3)` の後 `undo()` を2回                          | 1回目のundoで `value===7`、2回目のundoで `value===null` になる     |
| 24  | 履歴が空の状態でundoを呼んでも例外が起きず盤面は変化しない                  | 何も操作していない状態で `undo()`                                                | 例外が発生せず、boardが変化しない                                  |
| 25  | 確定マス（ヒント）への入力・消しゴムは盤面を変化させないため履歴に積まれない | ヒントセルを選択し `inputNumber(n)` の後 `undo()`                                | 例外が発生せず、boardが変化しない（undo可能な履歴が増えていない）  |
| 26  | New Game確定後はUndo履歴もリセットされる                                     | `inputNumber(7)` の後 `openNewGame()` → `confirmNewGame()`（`window.confirm` は `true` を返すようモック）、その後 `undo()` | undo後も新規開始直後の盤面のまま変化しない                          |
| 27  | マス選択・メモON/OFF切替は履歴に積まれない                                  | `inputNumber(7)` → 別マスを`selectCell` → `toggleMemoMode()` の後 `undo()` を1回 | 1回のundoで `inputNumber(7)` した内容が取り消される（2回分ではない）|
| 51  | 誤答マスへの入力をUndoで取り消すと、そのマスのエラー表示が解除される         | 空マスに誤った値を入力 → `check()` → `undo()`                                     | そのマスの位置が `errorCells` に含まれない                          |
| 52  | 無関係な操作のUndoでは、既存のエラー表示は解除されない                      | 誤答マスAに入力後 `check()` でAがエラーに → 別の空マスBに正しい値を入力 → `undo()`（Bの入力のみ取り消す） | Aの位置は依然として `errorCells` に含まれる                         |

## check（Checkボタン・エラー表示、spec.md 8章）

| #   | ケース                                                                         | 前提・操作                                                                                | 期待される結果                                                       |
| --- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 34  | 誤答マスにcheckを呼ぶとそのマスがerrorCellsに含まれる                            | 空マスに正解と異なる値を入力後 `check()`                                                       | そのマスの位置が `errorCells` に含まれる                                 |
| 35  | 正解マスにcheckを呼んでもerrorCellsに含まれない                                  | 空マスに正解の値を入力後 `check()`                                                             | そのマスの位置が `errorCells` に含まれない                               |
| 36  | 未入力マスはcheckを呼んでもerrorCellsに含まれない                                | 何も入力せず `check()`                                                                         | 未入力マスの位置が `errorCells` に含まれない                             |
| 37  | 確定マス（ヒント）はcheckを呼んでもerrorCellsに含まれない                        | 何も入力せず `check()`                                                                         | ヒントマスの位置が `errorCells` に含まれない                             |
| 38  | エラーマスのvalueを変更するとそのマスのエラーが即座に解除される                  | 誤答後 `check()` でエラーになったマスに別の値を `inputNumber` で入力                            | 次の `check()` を待たずに、そのマスの位置が `errorCells` から消える      |
| 39  | エラーマスのメモを変更してもエラー表示は解除されない                             | 誤答後 `check()` でエラーになったマスに、メモON状態で `inputNumber` を呼ぶ                       | そのマスの位置は `errorCells` に残ったまま                               |
| 40  | エラーマスをeraseSelectedCellで消去するとエラーが解除される                      | 誤答後 `check()` でエラーになったマスに `eraseSelectedCell()`                                   | そのマスの位置が `errorCells` から消える                                 |
| 41  | New Game確定後はerrorCellsがリセットされる                                        | 誤答後 `check()` の後 `openNewGame()` → `confirmNewGame()`                                     | `errorCells` が空配列になる                                              |

## クリア自動検出（spec.md 9章）

| #   | ケース                                                                     | 前提・操作                                                       | 期待される結果                              |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| 42  | 全マスに正解を入力し終えるとisClearedがtrueになる                        | 全ての空マスに正解の値を入力する                                    | `isCleared === true`                            |
| 43  | 1マスでも未入力のままではisClearedはfalseのまま                          | 1マスを除いて正解の値を入力する                                     | `isCleared === false`                           |
| 44  | 全マス入力済みでも誤答が残っていればisClearedはfalseのまま               | 最後の2マスの正解を入れ替えて入力し、両マスとも誤答の状態で全マス入力済みにする（入力済み数字ボタンの無効化により、1マスだけを誤答にしたまま全マスを埋めることはできないため） | `isCleared === false`                           |
| 45  | 初期状態ではisClearedはfalse                                              | 新規ゲーム開始直後                                                  | `isCleared === false`                           |
| 46  | New Game確定後はisClearedがfalseにリセットされる                          | 全マス正解入力でクリア後 `openNewGame()` → `confirmNewGame()`        | `isCleared === false`                           |

## localStorageへの自動保存・復元（spec.md 10章）

| #   | ケース                                                                     | 前提・操作                                                                    | 期待される結果                                                              |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 47  | 盤面を変更するとlocalStorageに保存される                                 | 空マスを選択し `inputNumber(7)`                                                | `loadGameState()` の戻り値のそのマスの `value` が `7`                          |
| 48  | 保存された状態がある場合、次のマウントでその状態から復元される           | 値入力・マス選択・メモONにした後アンマウントし、再度 `useNumberPlaceGame` をマウント | 復元後の `board`・`selected`・`isMemoMode` が直前の状態と一致する               |
| 49  | 保存データが壊れている場合は新規ゲームにフォールバックする               | localStorageの保存キーに不正なJSON文字列をセットしてからマウント                 | 例外が発生せず、9x9の新規盤面が生成される                                       |
| 50  | New Gameを確定すると新しい盤面がlocalStorageに保存される                 | `openNewGame()` → `confirmNewGame()`                                            | `loadGameState()` の `board` が新しい盤面と一致する                             |

## New Gameモーダルフロー（spec.md 5.6章・7章・10章）

`newGame()` は廃止し、`newGameModal: { isOpen, difficulty }` / `openNewGame()` / `closeNewGame()` / `selectNewGameDifficulty(d)` / `confirmNewGame()` を公開する。`window.confirm` はテスト内で `vi.spyOn(window, 'confirm')` によりモックする。

| #   | ケース                                                                                       | 前提・操作                                                                                     | 期待される結果                                                                                       |
| --- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 19  | 初期状態ではnewGameModalは閉じている                                                        | フックをマウント                                                                                    | `newGameModal.isOpen === false`                                                                             |
| 53  | openNewGameを呼ぶとモーダルが開き、pendingDifficultyが現在の難易度と一致する                | 初期状態から `openNewGame()`                                                                        | `newGameModal.isOpen === true`、`newGameModal.difficulty === DEFAULT_DIFFICULTY`                            |
| 54  | selectNewGameDifficultyを呼ぶとpendingDifficultyのみ変わる                                   | `openNewGame()` の後 `selectNewGameDifficulty('hard')`                                              | `newGameModal.difficulty === 'hard'`、盤面は変化しない                                                      |
| 55  | 進行中の盤面がない状態でconfirmNewGameを呼ぶと、window.confirmを呼ばずに新規盤面が生成されモーダルが閉じる | 何も入力していない状態で `openNewGame()` → `selectNewGameDifficulty('hard')` → `confirmNewGame()` | `window.confirm` が呼ばれない、`newGameModal.isOpen === false`、盤面が新しくなる                            |
| 56  | 進行中の盤面がある状態でconfirmNewGameを呼ぶとwindow.confirmが呼ばれ、同意時のみ新規盤面になる | 空マスに入力後 `openNewGame()` → `confirmNewGame()`、`window.confirm` が `true` を返す              | `window.confirm` が1回呼ばれる、`newGameModal.isOpen === false`、盤面が新しくなる                           |
| 57  | window.confirmがfalseを返すと盤面もモーダル開閉状態も変化しない                             | 空マスに入力後 `openNewGame()` → `confirmNewGame()`、`window.confirm` が `false` を返す             | `newGameModal.isOpen === true` のまま、直前に入力したマスの値が保持される                                   |
| 58  | closeNewGameを呼ぶとモーダルが閉じ盤面は変化しない                                          | `openNewGame()` の後 `closeNewGame()`                                                               | `newGameModal.isOpen === false`、盤面は変化しない                                                           |
| 59  | 新規開始した盤面のdifficultyが選択した値でlocalStorageに保存される                          | `openNewGame()` → `selectNewGameDifficulty('expert')` → `confirmNewGame()`                          | `loadGameState()?.difficulty === 'expert'`                                                                  |
