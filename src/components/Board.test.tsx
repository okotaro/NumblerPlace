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
      <Board board={makeBoard()} selected={null} onSelectCell={() => {}} />,
    )

    expect(screen.getAllByRole('button')).toHaveLength(81)
  })
})

describe('Board 選択・関連ハイライト', () => {
  it('selectedがnullのときはどのマスにも選択・関連スタイルが付かない', () => {
    render(
      <Board board={makeBoard()} selected={null} onSelectCell={() => {}} />,
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
        selected={{ row: 0, col: 0 }}
        onSelectCell={() => {}}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons[4 * 9 + 4]).not.toHaveAttribute('data-related')
  })
})

describe('Board 操作', () => {
  it('マスをクリックするとonSelectCellがそのマスの位置で呼ばれる', async () => {
    const onSelectCell = vi.fn()
    render(
      <Board board={makeBoard()} selected={null} onSelectCell={onSelectCell} />,
    )

    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[2 * 9 + 7])

    expect(onSelectCell).toHaveBeenCalledTimes(1)
    expect(onSelectCell).toHaveBeenCalledWith({ row: 2, col: 7 })
  })
})
