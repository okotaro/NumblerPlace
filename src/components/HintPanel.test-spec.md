# HintPanel.tsx テスト仕様書

対象: `src/components/HintPanel.tsx`
関連仕様: `docs/spec.md` 15章、Issue #22

`useNumberPlaceGame` が公開する `hint: HintState`（`none` / `notFound` / `highlight` / `reason`）を受け取り、
`reason` のときのみ技法名・理由文を表示する。マスのハイライト自体は `Board`/`Cell` 側の責務であり、
このコンポーネントはテキスト表示のみを担当する。

## 表示

| #   | ケース                                                   | 前提・入力                                              | 期待される結果                                              |
| --- | ----------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | statusがnoneのときは何も表示しない                       | `hint: { status: 'none' }`                                  | コンポーネントの表示内容が空になる                                |
| 2   | statusがhighlightのときはまだ技法名・理由を表示しない    | `hint: { status: 'highlight', hint: {...} }`                | 技法名・理由文のテキストが表示されない                             |
| 3   | statusがreasonのとき技法名と理由文を表示する             | `hint: { status: 'reason', hint: { techniqueLabel: '単一候補（Naked Single）', reasonText: 'このマスは候補が5の1つだけに絞られます', ... } }` | "単一候補（Naked Single）" と "このマスは候補が5の1つだけに絞られます" が表示される |
| 4   | statusがnotFoundのとき見つからなかった旨のメッセージを表示する | `hint: { status: 'notFound' }`                            | "ヒントが見つかりませんでした" が表示される                       |
