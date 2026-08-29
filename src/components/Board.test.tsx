import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Board } from './Board'
import type { Board as BoardType, MemoMark } from '../types'

function makeBoard(): BoardType {
  const memos: Record<number, MemoMark> = {}
  for (let n = 1; n <= 9; n++) memos[n] = 'none'

  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({
      value: null,
      isGiven: false,
      memos: { ...memos },
    })),
  )
}

describe('Board 描画', () => {
  it('81マス分のセルが描画される', () => {
    render(
      <Board board={makeBoard()} selected={null} errorCells={[]} onSelectCell={() => {}} />,
    )

    expect(screen.getAllByRole('button')).toHaveLength(81)
  })
})

describe('Board 選択・関連ハイライト', () => {
  it('selectedがnullのときはどのマスにも選択・関連スタイルが付かない', () => {
    render(
      <Board board={makeBoard()} selected={null} errorCells={[]} onSelectCell={() => {}} />,
    )

    screen.getAllByRole('button').forEach((button) => {
      expect(button).not.toHaveAttribute('data-selected')
      expect(button).not.toHaveAttribute('data-related')
    })
  })

  it('selectedで指定した位置のマスにのみ選択スタイルが付く', () => {
    render(
      <Board
        board={makeBoard()}
        errorCells={[]}
        selected={{ row: 4, col: 4 }}
        onSelectCell={() => {}}
      />,
    )

    const buttons = screen.getAllByRole('button')
    const selectedButtons = buttons.filter((b) =>
      b.hasAttribute('data-selected'),
    )
    expect(selectedButtons).toHaveLength(1)
    expect(selectedButtons[0]).toBe(buttons[4 * 9 + 4])
  })

  it('選択マスと同じ行のマスには関連スタイルが付く（選択マス自身は除く）', () => {
    render(
      <Board
        board={makeBoard()}
        errorCells={[]}
        selected={{ row: 4, col: 4 }}
        onSelectCell={() => {}}
      />,
    )

    const buttons = screen.getAllByRole('button')
    for (let col = 0; col < 9; col++) {
      const button = buttons[4 * 9 + col]
      if (col === 4) {
        expect(button).not.toHaveAttribute('data-related')
      } else {
        expect(button).toHaveAttribute('data-related', 'true')
      }
    }
  })

  it('選択マスと同じ列のマスには関連スタイルが付く（選択マス自身は除く）', () => {
    render(
      <Board
        board={makeBoard()}
        errorCells={[]}
        selected={{ row: 4, col: 4 }}
        onSelectCell={() => {}}
      />,
    )

    const buttons = screen.getAllByRole('button')
    for (let row = 0; row < 9; row++) {
      const button = buttons[row * 9 + 4]
      if (row === 4) {
        expect(button).not.toHaveAttribute('data-related')
      } else {
        expect(button).toHaveAttribute('data-related', 'true')
      }
    }
  })

  it('選択マスと同じ3x3ブロックのマスには関連スタイルが付く（選択マス自身は除く）', () => {
    render(
      <Board
        board={makeBoard()}
        errorCells={[]}
        selected={{ row: 4, col: 4 }}
        onSelectCell={() => {}}
      />,
    )

    const buttons = screen.getAllByRole('button')
    for (let row = 3; row <= 5; row++) {
      for (let col = 3; col <= 5; col++) {
        const button = buttons[row * 9 + col]
        if (row === 4 && col === 4) {
          expect(button).not.toHaveAttribute('data-related')
        } else {
          expect(button).toHaveAttribute('data-related', 'true')
        }
      }
    }
  })

  it('行・列・ブロックいずれにも属さないマスには関連スタイルが付かない', () => {
    render(
      <Board
        board={makeBoard()}
        errorCells={[]}
        selected={{ row: 0, col: 0 }}
        onSelectCell={() => {}}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons[4 * 9 + 4]).not.toHaveAttribute('data-related')
  })

  it('選択マスに値がある場合、盤面内の同じ値を持つ他の全マスに同値スタイルが付く', () => {
    const board = makeBoard()
    board[0][0].value = 5
    board[8][8].value = 5
    board[3][6].value = 5
    board[1][1].value = 6

    render(
      <Board
        board={board}
        errorCells={[]}
        selected={{ row: 0, col: 0 }}
        onSelectCell={() => {}}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons[8 * 9 + 8]).toHaveAttribute('data-same-value', 'true')
    expect(buttons[3 * 9 + 6]).toHaveAttribute('data-same-value', 'true')
    expect(buttons[1 * 9 + 1]).not.toHaveAttribute('data-same-value')
  })

  it('選択マス自身には同値スタイルが付かない', () => {
    const board = makeBoard()
    board[0][0].value = 5

    render(
      <Board
        board={board}
        errorCells={[]}
        selected={{ row: 0, col: 0 }}
        onSelectCell={() => {}}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).not.toHaveAttribute('data-same-value')
  })

  it('選択マスが未入力の場合はどのマスにも同値スタイルが付かない', () => {
    const board = makeBoard()
    board[1][1].value = 5
    board[2][2].value = 5

    render(
      <Board
        board={board}
        errorCells={[]}
        selected={{ row: 0, col: 0 }}
        onSelectCell={() => {}}
      />,
    )

    screen.getAllByRole('button').forEach((button) => {
      expect(button).not.toHaveAttribute('data-same-value')
    })
  })

  it('selectedがnullの場合はどのマスにも同値スタイルが付かない', () => {
    const board = makeBoard()
    board[1][1].value = 5
    board[2][2].value = 5

    render(
      <Board board={board} errorCells={[]} selected={null} onSelectCell={() => {}} />,
    )

    screen.getAllByRole('button').forEach((button) => {
      expect(button).not.toHaveAttribute('data-same-value')
    })
  })

  it('候補メモは同値判定に影響しない', () => {
    const board = makeBoard()
    board[0][0].value = 5
    board[1][1].memos[5] = 'candidate'

    render(
      <Board
        board={board}
        errorCells={[]}
        selected={{ row: 0, col: 0 }}
        onSelectCell={() => {}}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons[1 * 9 + 1]).not.toHaveAttribute('data-same-value')
  })
})

describe('Board エラー表示', () => {
  it('errorCellsで指定した位置のマスにのみエラースタイルが付く', () => {
    render(
      <Board
        board={makeBoard()}
        selected={null}
        errorCells={[{ row: 1, col: 2 }]}
        onSelectCell={() => {}}
      />,
    )

    const buttons = screen.getAllByRole('button')
    const errorButtons = buttons.filter((b) => b.hasAttribute('data-error'))
    expect(errorButtons).toHaveLength(1)
    expect(errorButtons[0]).toBe(buttons[1 * 9 + 2])
  })

  it('errorCellsが空配列のときはどのマスにもエラースタイルが付かない', () => {
    render(
      <Board
        board={makeBoard()}
        selected={null}
        errorCells={[]}
        onSelectCell={() => {}}
      />,
    )

    screen.getAllByRole('button').forEach((button) => {
      expect(button).not.toHaveAttribute('data-error')
    })
  })
})

describe('Board ヒント表示', () => {
  it('hintCellsで指定した位置のマスにそれぞれのroleに応じたヒントスタイルが付く', () => {
    render(
      <Board
        board={makeBoard()}
        selected={null}
        errorCells={[]}
        hintCells={[
          { position: { row: 3, col: 5 }, role: 'cause' },
          { position: { row: 3, col: 7 }, role: 'eliminated' },
        ]}
        onSelectCell={() => {}}
      />,
    )

    const buttons = screen.getAllByRole('button')
    const hintButtons = buttons.filter((b) => b.hasAttribute('data-hint'))
    expect(hintButtons).toHaveLength(2)
    expect(buttons[3 * 9 + 5]).toHaveAttribute('data-hint', 'cause')
    expect(buttons[3 * 9 + 7]).toHaveAttribute('data-hint', 'eliminated')
  })

  it('hintCellsが空配列のとき（省略時も同様）はどのマスにもヒントスタイルが付かない', () => {
    render(
      <Board board={makeBoard()} selected={null} errorCells={[]} onSelectCell={() => {}} />,
    )

    screen.getAllByRole('button').forEach((button) => {
      expect(button).not.toHaveAttribute('data-hint')
    })
  })
})

describe('Board 操作', () => {
  it('マスをクリックするとonSelectCellがそのマスの位置で呼ばれる', async () => {
    const onSelectCell = vi.fn()
    render(
      <Board board={makeBoard()} selected={null} errorCells={[]} onSelectCell={onSelectCell} />,
    )

    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[2 * 9 + 7])

    expect(onSelectCell).toHaveBeenCalledTimes(1)
    expect(onSelectCell).toHaveBeenCalledWith({ row: 2, col: 7 })
  })
})
