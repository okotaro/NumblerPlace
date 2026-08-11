import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useNumberPlaceGame } from './useNumberPlaceGame'

function findBlankCellPosition(
  board: ReturnType<typeof useNumberPlaceGame>['board'],
) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (!board[row][col].isGiven) {
        return { row, col }
      }
    }
  }
  throw new Error('no blank cell found')
}

function findGivenCellPosition(
  board: ReturnType<typeof useNumberPlaceGame>['board'],
) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].isGiven) {
        return { row, col }
      }
    }
  }
  throw new Error('no given cell found')
}

describe('useNumberPlaceGame 初期状態', () => {
  it('boardは9x9でヒントセルが設定されている', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    expect(result.current.board).toHaveLength(9)
    result.current.board.forEach((row) => expect(row).toHaveLength(9))
    const givenPosition = findGivenCellPosition(result.current.board)
    const givenCell = result.current.board[givenPosition.row][givenPosition.col]
    expect(givenCell.isGiven).toBe(true)
    expect(givenCell.value).not.toBeNull()
  })

  it('selectedはnull', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    expect(result.current.selected).toBeNull()
  })

  it('isMemoModeはfalse', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    expect(result.current.isMemoMode).toBe(false)
  })
})

describe('useNumberPlaceGame selectCell', () => {
  it('selectCellを呼ぶとselectedが更新される', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    act(() => result.current.selectCell({ row: 2, col: 3 }))

    expect(result.current.selected).toEqual({ row: 2, col: 3 })
  })

  it('確定マス（ヒント）もselectCellで選択できる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const givenPosition = findGivenCellPosition(result.current.board)

    act(() => result.current.selectCell(givenPosition))

    expect(result.current.selected).toEqual(givenPosition)
  })
})

describe('useNumberPlaceGame toggleMemoMode', () => {
  it('呼ぶたびにisMemoModeがtrue/false反転する', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    act(() => result.current.toggleMemoMode())
    expect(result.current.isMemoMode).toBe(true)

    act(() => result.current.toggleMemoMode())
    expect(result.current.isMemoMode).toBe(false)
  })
})

describe('useNumberPlaceGame inputNumber（メモOFF時）', () => {
  it('選択中の空マスにinputNumber(n)を呼ぶとそのマスのvalueがnになる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))

    expect(result.current.board[blank.row][blank.col].value).toBe(7)
  })

  it('選択中の解答済みマスにinputNumber(n)を呼ぶと値が上書きされる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))
    act(() => result.current.inputNumber(3))

    expect(result.current.board[blank.row][blank.col].value).toBe(3)
  })

  it('確定マス（ヒント）を選択している状態では値は変わらない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const given = findGivenCellPosition(result.current.board)
    const originalValue = result.current.board[given.row][given.col].value

    act(() => result.current.selectCell(given))
    act(() => result.current.inputNumber(originalValue === 1 ? 2 : 1))

    expect(result.current.board[given.row][given.col].value).toBe(originalValue)
  })

  it('何も選択していない状態で呼んでも何も起きない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const boardBefore = result.current.board

    expect(() => act(() => result.current.inputNumber(5))).not.toThrow()
    expect(result.current.board).toEqual(boardBefore)
  })
})

describe('useNumberPlaceGame inputNumber（メモON時・循環ロジック）', () => {
  it('none→candidate→notCandidate→noneの順で循環する', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.toggleMemoMode())

    act(() => result.current.inputNumber(4))
    expect(result.current.board[blank.row][blank.col].memos[4]).toBe(
      'candidate',
    )

    act(() => result.current.inputNumber(4))
    expect(result.current.board[blank.row][blank.col].memos[4]).toBe(
      'notCandidate',
    )

    act(() => result.current.inputNumber(4))
    expect(result.current.board[blank.row][blank.col].memos[4]).toBe('none')
  })

  it('確定マス（ヒント）を選択している場合はmemosが変更されない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const given = findGivenCellPosition(result.current.board)

    act(() => result.current.selectCell(given))
    act(() => result.current.toggleMemoMode())
    act(() => result.current.inputNumber(4))

    const memos = result.current.board[given.row][given.col].memos
    for (let n = 1; n <= 9; n++) {
      expect(memos[n]).toBe('none')
    }
  })

  it('メモON時にinputNumber(n)を呼んでもvalueは変化しない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(6))
    act(() => result.current.toggleMemoMode())
    act(() => result.current.inputNumber(4))

    expect(result.current.board[blank.row][blank.col].value).toBe(6)
  })
})

describe('useNumberPlaceGame eraseSelectedCell', () => {
  it('valueがnullになり全メモがnoneになる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(6))
    act(() => result.current.toggleMemoMode())
    act(() => result.current.inputNumber(4))
    act(() => result.current.eraseSelectedCell())

    const cell = result.current.board[blank.row][blank.col]
    expect(cell.value).toBeNull()
    for (let n = 1; n <= 9; n++) {
      expect(cell.memos[n]).toBe('none')
    }
  })

  it('確定マス（ヒント）を選択している状態では何も変わらない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const given = findGivenCellPosition(result.current.board)
    const originalValue = result.current.board[given.row][given.col].value

    act(() => result.current.selectCell(given))
    act(() => result.current.eraseSelectedCell())

    expect(result.current.board[given.row][given.col].value).toBe(originalValue)
  })

  it('何も選択していない状態で呼んでも何も起きない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const boardBefore = result.current.board

    expect(() => act(() => result.current.eraseSelectedCell())).not.toThrow()
    expect(result.current.board).toEqual(boardBefore)
  })
})

describe('useNumberPlaceGame newGame', () => {
  it('盤面・選択・メモ状態がリセットされる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))
    act(() => result.current.toggleMemoMode())
    const boardBeforeNewGame = result.current.board

    act(() => result.current.newGame())

    expect(result.current.selected).toBeNull()
    expect(result.current.isMemoMode).toBe(false)
    // 新しい盤面はランダム生成のため、直前の盤面と同一になることは実質的にない
    expect(result.current.board).not.toEqual(boardBeforeNewGame)
  })
})
