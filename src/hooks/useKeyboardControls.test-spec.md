# useKeyboardControls.ts テスト仕様書

対象: `src/hooks/useKeyboardControls.ts`
関連仕様: `docs/spec.md` 6章

## キー入力とコールバックの対応

| #   | ケース                                                        | 前提・操作                            | 期待される結果                                  |
| --- | ---------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------- |
| 1   | ArrowUp/Down/Left/RightでonMoveが対応する方向で呼ばれる          | 各矢印キーを1回ずつkeydown                 | `onMove` がそれぞれ `'up'`/`'down'`/`'left'`/`'right'` で1回ずつ呼ばれる |
| 2   | 矢印キー押下時にブラウザのデフォルト動作（スクロール）を抑止する | `ArrowUp` をkeydown                        | 発火したイベントの `defaultPrevented` が `true` になる |
| 3   | 数字キー1〜9でonNumberInputがその数値で呼ばれる                  | `'5'` をkeydown                            | `onNumberInput` が `5` を引数に1回呼ばれる           |
| 4   | DeleteキーでonEraseが呼ばれる                                    | `'Delete'` をkeydown                       | `onErase` が1回呼ばれる                              |
| 5   | BackspaceキーでonEraseが呼ばれる                                 | `'Backspace'` をkeydown                    | `onErase` が1回呼ばれる                              |
| 6   | 対応しないキーは何のコールバックも呼ばない                       | `'a'` をkeydown                            | `onMove`/`onNumberInput`/`onErase` のいずれも呼ばれない |
| 7   | アンマウント後はキー入力を購読しない                             | フックをアンマウント後 `ArrowUp` をkeydown | `onMove` が呼ばれない                                |
