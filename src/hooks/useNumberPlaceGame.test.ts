import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNumberPlaceGame } from './useNumberPlaceGame'
import * as numberPlaceService from '../services/numberPlaceService'
import { DEFAULT_DIFFICULTY } from '../services/numberPlaceService'
import { countPlacedValues } from '../utils/board'
import { STORAGE_KEY, loadGameState } from '../utils/storage'

vi.mock('../services/numberPlaceService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/numberPlaceService')>()
  return { ...actual, findHint: vi.fn(actual.findHint) }
})

beforeEach(() => {
  localStorage.clear()
})

function confirmNewGame(
  result: { current: ReturnType<typeof useNumberPlaceGame> },
) {
  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
  act(() => result.current.openNewGame())
  act(() => result.current.confirmNewGame())
  confirmSpy.mockRestore()
}

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

function findAnotherBlankCellPosition(
  board: ReturnType<typeof useNumberPlaceGame>['board'],
  exclude: { row: number; col: number },
) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (!board[row][col].isGiven && !(row === exclude.row && col === exclude.col)) {
        return { row, col }
      }
    }
  }
  throw new Error('no second blank cell found')
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

describe('useNumberPlaceGame moveSelection', () => {
  it('選択中に上下左右へ1マスずつ移動できる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    act(() => result.current.selectCell({ row: 4, col: 4 }))
    act(() => result.current.moveSelection('up'))
    expect(result.current.selected).toEqual({ row: 3, col: 4 })

    act(() => result.current.moveSelection('down'))
    expect(result.current.selected).toEqual({ row: 4, col: 4 })

    act(() => result.current.moveSelection('left'))
    expect(result.current.selected).toEqual({ row: 4, col: 3 })

    act(() => result.current.moveSelection('right'))
    expect(result.current.selected).toEqual({ row: 4, col: 4 })
  })

  it('盤面上端でupを呼んでもラップせず移動しない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    act(() => result.current.selectCell({ row: 0, col: 4 }))
    act(() => result.current.moveSelection('up'))

    expect(result.current.selected).toEqual({ row: 0, col: 4 })
  })

  it('盤面下端でdownを呼んでもラップせず移動しない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    act(() => result.current.selectCell({ row: 8, col: 4 }))
    act(() => result.current.moveSelection('down'))

    expect(result.current.selected).toEqual({ row: 8, col: 4 })
  })

  it('盤面左端でleftを呼んでもラップせず移動しない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    act(() => result.current.selectCell({ row: 4, col: 0 }))
    act(() => result.current.moveSelection('left'))

    expect(result.current.selected).toEqual({ row: 4, col: 0 })
  })

  it('盤面右端でrightを呼んでもラップせず移動しない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    act(() => result.current.selectCell({ row: 4, col: 8 }))
    act(() => result.current.moveSelection('right'))

    expect(result.current.selected).toEqual({ row: 4, col: 8 })
  })

  it('何も選択していない状態で呼んでも何も起きない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    expect(() =>
      act(() => result.current.moveSelection('up')),
    ).not.toThrow()
    expect(result.current.selected).toBeNull()
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

function fillNumberToBoardCount(
  result: { current: ReturnType<typeof useNumberPlaceGame> },
  n: number,
  targetCount: number,
) {
  while (countPlacedValues(result.current.board)[n] < targetCount) {
    const board = result.current.board
    let filled = false
    for (let row = 0; row < 9 && !filled; row++) {
      for (let col = 0; col < 9 && !filled; col++) {
        const cell = board[row][col]
        if (!cell.isGiven && cell.value !== n) {
          act(() => result.current.selectCell({ row, col }))
          act(() => result.current.inputNumber(n))
          filled = true
        }
      }
    }
    if (!filled) throw new Error('no more blank cells to fill')
  }
}

describe('useNumberPlaceGame completedNumbers・入力済み数字のガード', () => {
  it('初期状態のcompletedNumbersはヒント配置数が9個の数字のみを含む', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const counts = countPlacedValues(result.current.board)

    result.current.completedNumbers.forEach((n) => {
      expect(counts[n]).toBe(9)
    })
  })

  it('ある数字の配置数が9個になるとcompletedNumbersにその数字が含まれる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    fillNumberToBoardCount(result, 1, 9)

    expect(result.current.completedNumbers).toContain(1)
  })

  it('配置数が9個の数字にinputNumberを呼んでも選択中マスのvalueは変わらない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    fillNumberToBoardCount(result, 1, 9)
    const blank = result.current.board
      .flatMap((row, rowIndex) =>
        row.map((cell, colIndex) => ({ cell, position: { row: rowIndex, col: colIndex } })),
      )
      .find(({ cell }) => !cell.isGiven && cell.value === null)?.position
    if (!blank) throw new Error('no blank cell found')

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(1))

    expect(result.current.board[blank.row][blank.col].value).toBeNull()
  })

  it('配置数が9個の数字にinputNumberを呼んでも選択中マスのmemosは変わらない（メモON）', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    fillNumberToBoardCount(result, 1, 9)
    const blank = result.current.board
      .flatMap((row, rowIndex) =>
        row.map((cell, colIndex) => ({ cell, position: { row: rowIndex, col: colIndex } })),
      )
      .find(({ cell }) => !cell.isGiven && cell.value === null)?.position
    if (!blank) throw new Error('no blank cell found')

    act(() => result.current.selectCell(blank))
    act(() => result.current.toggleMemoMode())
    act(() => result.current.inputNumber(1))

    expect(result.current.board[blank.row][blank.col].memos[1]).toBe('none')
  })

  it('誤答を含めて配置数が9個になった数字も同様に入力不可になる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    fillNumberToBoardCount(result, 9, 9)

    expect(result.current.completedNumbers).toContain(9)
  })

  it('配置数9個のマスを消去すると再びその数字が入力可能になる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    fillNumberToBoardCount(result, 1, 9)
    const filledPosition = result.current.board
      .flatMap((row, rowIndex) =>
        row.map((cell, colIndex) => ({ cell, position: { row: rowIndex, col: colIndex } })),
      )
      .find(({ cell }) => !cell.isGiven && cell.value === 1)?.position
    if (!filledPosition) throw new Error('no filled cell found')

    act(() => result.current.selectCell(filledPosition))
    act(() => result.current.eraseSelectedCell())

    expect(result.current.completedNumbers).not.toContain(1)

    act(() => result.current.inputNumber(1))

    expect(result.current.board[filledPosition.row][filledPosition.col].value).toBe(1)
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

describe('useNumberPlaceGame undo', () => {
  it('解答入力後にundoを呼ぶと直前の状態（未入力）に戻る', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))
    act(() => result.current.undo())

    expect(result.current.board[blank.row][blank.col].value).toBeNull()
  })

  it('メモ変更後にundoを呼ぶと直前のメモ状態に戻る', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.toggleMemoMode())
    act(() => result.current.inputNumber(4))
    act(() => result.current.undo())

    expect(result.current.board[blank.row][blank.col].memos[4]).toBe('none')
  })

  it('消しゴム操作後にundoを呼ぶと消しゴム前の状態に戻る', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))
    act(() => result.current.eraseSelectedCell())
    act(() => result.current.undo())

    expect(result.current.board[blank.row][blank.col].value).toBe(7)
  })

  it('複数回の操作後、undoを複数回呼ぶと1手ずつ遡れる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))
    act(() => result.current.inputNumber(3))

    act(() => result.current.undo())
    expect(result.current.board[blank.row][blank.col].value).toBe(7)

    act(() => result.current.undo())
    expect(result.current.board[blank.row][blank.col].value).toBeNull()
  })

  it('履歴が空の状態でundoを呼んでも例外が起きず盤面は変化しない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const boardBefore = result.current.board

    expect(() => act(() => result.current.undo())).not.toThrow()
    expect(result.current.board).toEqual(boardBefore)
  })

  it('確定マス（ヒント）への入力は履歴に積まれない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const given = findGivenCellPosition(result.current.board)
    const originalValue = result.current.board[given.row][given.col].value

    act(() => result.current.selectCell(given))
    act(() => result.current.inputNumber(originalValue === 1 ? 2 : 1))
    const boardBefore = result.current.board

    expect(() => act(() => result.current.undo())).not.toThrow()
    expect(result.current.board).toEqual(boardBefore)
  })

  it('New Game確定後はUndo履歴もリセットされる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))
    confirmNewGame(result)
    const boardAfterNewGame = result.current.board

    act(() => result.current.undo())

    expect(result.current.board).toEqual(boardAfterNewGame)
  })

  it('マス選択・メモON/OFF切替は履歴に積まれない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)
    const other = blank.row === 0 && blank.col === 0 ? { row: 8, col: 8 } : { row: 0, col: 0 }

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))
    act(() => result.current.selectCell(other))
    act(() => result.current.toggleMemoMode())

    act(() => result.current.undo())

    expect(result.current.board[blank.row][blank.col].value).toBeNull()
  })

  it('誤答マスへの入力をUndoで取り消すと、そのマスのエラー表示が解除される', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)
    act(() => result.current.selectCell(blank))
    const { wrongValue } = classifyValues(result, blank)
    act(() => result.current.eraseSelectedCell())

    act(() => result.current.inputNumber(wrongValue))
    act(() => result.current.check())
    expect(result.current.errorCells).toContainEqual(blank)

    act(() => result.current.undo())

    expect(result.current.errorCells).not.toContainEqual(blank)
  })

  it('無関係な操作のUndoでは、既存のエラー表示は解除されない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blankA = findBlankCellPosition(result.current.board)
    act(() => result.current.selectCell(blankA))
    const { wrongValue: wrongA } = classifyValues(result, blankA)
    act(() => result.current.eraseSelectedCell())
    act(() => result.current.inputNumber(wrongA))
    act(() => result.current.check())
    expect(result.current.errorCells).toContainEqual(blankA)

    const blankB = findAnotherBlankCellPosition(result.current.board, blankA)
    act(() => result.current.selectCell(blankB))
    const { correctValue: correctB } = classifyValues(result, blankB)
    act(() => result.current.eraseSelectedCell())
    act(() => result.current.inputNumber(correctB))

    act(() => result.current.undo())

    expect(result.current.errorCells).toContainEqual(blankA)
  })
})

function classifyValues(
  result: { current: ReturnType<typeof useNumberPlaceGame> },
  position: { row: number; col: number },
) {
  let correctValue: number | null = null
  let wrongValue: number | null = null
  for (let n = 1; n <= 9; n++) {
    act(() => result.current.inputNumber(n))
    if (result.current.board[position.row][position.col].value !== n) continue
    act(() => result.current.check())
    const isError = result.current.errorCells.some(
      (p) => p.row === position.row && p.col === position.col,
    )
    if (isError && wrongValue === null) wrongValue = n
    if (!isError && correctValue === null) correctValue = n
  }
  if (correctValue === null || wrongValue === null) {
    throw new Error('failed to classify correct/wrong values')
  }
  return { correctValue, wrongValue }
}

describe('useNumberPlaceGame check', () => {
  it('誤答マスにcheckを呼ぶとそのマスがerrorCellsに含まれる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)
    act(() => result.current.selectCell(blank))
    const { wrongValue } = classifyValues(result, blank)

    act(() => result.current.inputNumber(wrongValue))
    act(() => result.current.check())

    expect(result.current.errorCells).toContainEqual(blank)
  })

  it('正解マスにcheckを呼んでもerrorCellsに含まれない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)
    act(() => result.current.selectCell(blank))
    const { correctValue } = classifyValues(result, blank)

    act(() => result.current.inputNumber(correctValue))
    act(() => result.current.check())

    expect(result.current.errorCells).not.toContainEqual(blank)
  })

  it('未入力マスはcheckを呼んでもerrorCellsに含まれない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.check())

    expect(result.current.errorCells).not.toContainEqual(blank)
  })

  it('確定マス（ヒント）はcheckを呼んでもerrorCellsに含まれない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const given = findGivenCellPosition(result.current.board)

    act(() => result.current.check())

    expect(result.current.errorCells).not.toContainEqual(given)
  })

  it('エラーマスのvalueを変更するとそのマスのエラーが即座に解除される', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)
    act(() => result.current.selectCell(blank))
    const { correctValue, wrongValue } = classifyValues(result, blank)
    act(() => result.current.inputNumber(wrongValue))
    act(() => result.current.check())
    expect(result.current.errorCells).toContainEqual(blank)

    act(() => result.current.inputNumber(correctValue))

    expect(result.current.errorCells).not.toContainEqual(blank)
  })

  it('エラーマスのメモを変更してもエラー表示は解除されない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)
    act(() => result.current.selectCell(blank))
    const { wrongValue } = classifyValues(result, blank)
    act(() => result.current.inputNumber(wrongValue))
    act(() => result.current.check())
    expect(result.current.errorCells).toContainEqual(blank)

    act(() => result.current.toggleMemoMode())
    act(() => result.current.inputNumber(1))

    expect(result.current.errorCells).toContainEqual(blank)
  })

  it('エラーマスをeraseSelectedCellで消去するとエラーが解除される', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)
    act(() => result.current.selectCell(blank))
    const { wrongValue } = classifyValues(result, blank)
    act(() => result.current.inputNumber(wrongValue))
    act(() => result.current.check())
    expect(result.current.errorCells).toContainEqual(blank)

    act(() => result.current.eraseSelectedCell())

    expect(result.current.errorCells).not.toContainEqual(blank)
  })

  it('New Game確定後はerrorCellsがリセットされる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)
    act(() => result.current.selectCell(blank))
    const { wrongValue } = classifyValues(result, blank)
    act(() => result.current.inputNumber(wrongValue))
    act(() => result.current.check())
    expect(result.current.errorCells.length).toBeGreaterThan(0)

    confirmNewGame(result)

    expect(result.current.errorCells).toEqual([])
  })
})

function fillCorrectValue(
  result: { current: ReturnType<typeof useNumberPlaceGame> },
  position: { row: number; col: number },
) {
  act(() => result.current.selectCell(position))
  for (let n = 1; n <= 9; n++) {
    act(() => result.current.inputNumber(n))
    if (result.current.board[position.row][position.col].value !== n) continue
    act(() => result.current.check())
    const isError = result.current.errorCells.some(
      (p) => p.row === position.row && p.col === position.col,
    )
    if (!isError) return
  }
  throw new Error('failed to find correct value')
}

function findBlankCellPositions(
  board: ReturnType<typeof useNumberPlaceGame>['board'],
) {
  const positions: { row: number; col: number }[] = []
  board.forEach((row, rowIndex) =>
    row.forEach((cell, colIndex) => {
      if (!cell.isGiven) positions.push({ row: rowIndex, col: colIndex })
    }),
  )
  return positions
}

describe('useNumberPlaceGame クリア自動検出', () => {
  it('初期状態ではisClearedはfalse', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    expect(result.current.isCleared).toBe(false)
  })

  it('全マスに正解を入力し終えるとisClearedがtrueになる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blanks = findBlankCellPositions(result.current.board)

    blanks.forEach((position) => fillCorrectValue(result, position))

    expect(result.current.isCleared).toBe(true)
  })

  it('1マスでも未入力のままではisClearedはfalseのまま', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blanks = findBlankCellPositions(result.current.board)

    blanks.slice(0, -1).forEach((position) => fillCorrectValue(result, position))

    expect(result.current.isCleared).toBe(false)
  })

  it('全マス入力済みでも誤答が残っていればisClearedはfalseのまま', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blanks = findBlankCellPositions(result.current.board)

    // 入力済み数字ボタンの無効化（Issue #21）により、既に9個配置済みの数字は
    // 他のマスへ入力できなくなる。そのため「全マス入力済みで1マスだけ誤答」という
    // 状態は最後の2マスの正解を入れ替えることでのみ作れる（2マスとも誤答になる）。
    blanks.slice(0, -2).forEach((position) => fillCorrectValue(result, position))
    const [posX, posY] = blanks.slice(-2)

    act(() => result.current.selectCell(posX))
    const { correctValue: correctX, wrongValue: correctY } = classifyValues(
      result,
      posX,
    )
    act(() => result.current.selectCell(posX))
    act(() => result.current.inputNumber(correctY))
    act(() => result.current.selectCell(posY))
    act(() => result.current.inputNumber(correctX))

    expect(result.current.isCleared).toBe(false)
  })

  it('New Game確定後はisClearedがfalseにリセットされる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blanks = findBlankCellPositions(result.current.board)
    blanks.forEach((position) => fillCorrectValue(result, position))
    expect(result.current.isCleared).toBe(true)

    confirmNewGame(result)

    expect(result.current.isCleared).toBe(false)
  })
})

describe('useNumberPlaceGame localStorageへの自動保存・復元', () => {
  it('盤面を変更するとlocalStorageに保存される', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))

    const saved = loadGameState()
    expect(saved).not.toBeNull()
    expect(saved?.board[blank.row][blank.col].value).toBe(7)
  })

  it('保存された状態がある場合、次のマウントでその状態から復元される', () => {
    const { result, unmount } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)
    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))
    act(() => result.current.toggleMemoMode())
    const boardBeforeRemount = result.current.board
    unmount()

    const { result: remounted } = renderHook(() => useNumberPlaceGame())

    expect(remounted.current.board).toEqual(boardBeforeRemount)
    expect(remounted.current.selected).toEqual(blank)
    expect(remounted.current.isMemoMode).toBe(true)
  })

  it('保存データが壊れている場合は新規ゲームにフォールバックする', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')

    const { result } = renderHook(() => useNumberPlaceGame())

    expect(result.current.board).toHaveLength(9)
    result.current.board.forEach((row) => expect(row).toHaveLength(9))
  })

  it('New Gameを確定すると新しい盤面がlocalStorageに保存される', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    confirmNewGame(result)

    const saved = loadGameState()
    expect(saved?.board).toEqual(result.current.board)
  })
})

describe('useNumberPlaceGame New Gameモーダルフロー', () => {
  it('初期状態ではnewGameModalは閉じている', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    expect(result.current.newGameModal.isOpen).toBe(false)
  })

  it('openNewGameを呼ぶとモーダルが開き、pendingDifficultyが現在の難易度と一致する', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    act(() => result.current.openNewGame())

    expect(result.current.newGameModal.isOpen).toBe(true)
    expect(result.current.newGameModal.difficulty).toBe(DEFAULT_DIFFICULTY)
  })

  it('selectNewGameDifficultyを呼ぶとpendingDifficultyのみ変わる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const boardBefore = result.current.board

    act(() => result.current.openNewGame())
    act(() => result.current.selectNewGameDifficulty('hard'))

    expect(result.current.newGameModal.difficulty).toBe('hard')
    expect(result.current.board).toBe(boardBefore)
  })

  it('進行中の盤面がない状態でconfirmNewGameを呼ぶと、window.confirmを呼ばずに新規盤面が生成されモーダルが閉じる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const confirmSpy = vi.spyOn(window, 'confirm')

    act(() => result.current.openNewGame())
    act(() => result.current.selectNewGameDifficulty('hard'))
    act(() => result.current.confirmNewGame())

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(result.current.newGameModal.isOpen).toBe(false)
    confirmSpy.mockRestore()
  })

  it('進行中の盤面がある状態でconfirmNewGameを呼ぶとwindow.confirmが呼ばれ、同意時のみ新規盤面になる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)
    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))
    const boardBeforeNewGame = result.current.board
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    act(() => result.current.openNewGame())
    act(() => result.current.confirmNewGame())

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(result.current.newGameModal.isOpen).toBe(false)
    // 新しい盤面はランダム生成のため、直前の盤面と同一になることは実質的にない
    expect(result.current.board).not.toEqual(boardBeforeNewGame)
    confirmSpy.mockRestore()
  })

  it('window.confirmがfalseを返すと盤面もモーダル開閉状態も変化しない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)
    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    act(() => result.current.openNewGame())
    act(() => result.current.confirmNewGame())

    expect(result.current.newGameModal.isOpen).toBe(true)
    expect(result.current.board[blank.row][blank.col].value).toBe(7)
    confirmSpy.mockRestore()
  })

  it('closeNewGameを呼ぶとモーダルが閉じ盤面は変化しない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const boardBefore = result.current.board

    act(() => result.current.openNewGame())
    act(() => result.current.closeNewGame())

    expect(result.current.newGameModal.isOpen).toBe(false)
    expect(result.current.board).toBe(boardBefore)
  })

  it('新規開始した盤面のdifficultyが選択した値でlocalStorageに保存される', () => {
    const { result } = renderHook(() => useNumberPlaceGame())

    act(() => result.current.openNewGame())
    act(() => result.current.selectNewGameDifficulty('expert'))
    act(() => result.current.confirmNewGame())

    expect(loadGameState()?.difficulty).toBe('expert')
  })

  it('盤面・選択・メモ状態がリセットされる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blank = findBlankCellPosition(result.current.board)

    act(() => result.current.selectCell(blank))
    act(() => result.current.inputNumber(7))
    act(() => result.current.toggleMemoMode())
    const boardBeforeNewGame = result.current.board

    confirmNewGame(result)

    expect(result.current.selected).toBeNull()
    expect(result.current.isMemoMode).toBe(false)
    // 新しい盤面はランダム生成のため、直前の盤面と同一になることは実質的にない
    expect(result.current.board).not.toEqual(boardBeforeNewGame)
  })
})

// 空きマスをすべて正解で埋め、1マスだけ残す。残った1マスは盤面全体でその行・列・
// ブロックに残る値が1つしかないため、Naked Singleとして確実に検出できる状態になる。
function fillAllBlanksButOne(
  result: { current: ReturnType<typeof useNumberPlaceGame> },
) {
  const blanks = findBlankCellPositions(result.current.board)
  const remaining = blanks[blanks.length - 1]
  blanks.slice(0, -1).forEach((position) => fillCorrectValue(result, position))
  return remaining
}

describe('useNumberPlaceGame requestHint', () => {
  it('初期状態ではhintはnone', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    expect(result.current.hint.status).toBe('none')
  })

  it('requestHintを呼ぶと該当マスがハイライト状態になり、そのマスが選択される', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const remaining = fillAllBlanksButOne(result)

    act(() => result.current.requestHint())

    expect(result.current.hint.status).toBe('highlight')
    if (result.current.hint.status === 'highlight' && result.current.hint.hint.kind === 'value') {
      expect(result.current.hint.hint.position).toEqual(remaining)
    }
    expect(result.current.selected).toEqual(remaining)
  })

  it('ハイライト状態で続けてrequestHintを呼ぶと理由表示状態になる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    fillAllBlanksButOne(result)
    act(() => result.current.requestHint())
    const highlighted = result.current.hint

    act(() => result.current.requestHint())

    expect(result.current.hint.status).toBe('reason')
    if (result.current.hint.status === 'reason' && highlighted.status === 'highlight') {
      expect(result.current.hint.hint).toEqual(highlighted.hint)
    }
  })

  it('理由表示状態で続けてrequestHintを呼ぶと再計算されハイライト状態に戻る', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    fillAllBlanksButOne(result)
    act(() => result.current.requestHint())
    act(() => result.current.requestHint())

    act(() => result.current.requestHint())

    expect(result.current.hint.status).toBe('highlight')
  })

  it('該当技法が見つからない場合はnotFound状態になる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    vi.mocked(numberPlaceService.findHint).mockReturnValueOnce(null)

    act(() => result.current.requestHint())

    expect(result.current.hint.status).toBe('notFound')
  })

  it('ヒント表示中に解答を入力するとヒント状態がnoneにリセットされる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    fillAllBlanksButOne(result)
    act(() => result.current.requestHint())
    const hint = result.current.hint
    if (hint.status !== 'highlight') {
      throw new Error('expected highlight state')
    }
    if (hint.hint.kind !== 'value') {
      throw new Error('expected a value hint')
    }
    const valueHint = hint.hint

    act(() => result.current.inputNumber(valueHint.value))

    expect(result.current.hint.status).toBe('none')
  })

  it('候補消去型のヒントでは選択マスが変化しない', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const eliminationHint: numberPlaceService.Hint = {
      kind: 'elimination',
      technique: 'nakedPair',
      techniqueLabel: 'ネイキッドペア（Naked Pair）',
      reasonText: 'テスト用の理由文',
      cells: [{ position: { row: 0, col: 0 }, role: 'cause' }],
      eliminatedCandidates: [{ position: { row: 0, col: 1 }, value: 5 }],
    }
    vi.mocked(numberPlaceService.findHint).mockReturnValueOnce(eliminationHint)
    const selectedBefore = result.current.selected

    act(() => result.current.requestHint())

    expect(result.current.hint.status).toBe('highlight')
    if (result.current.hint.status === 'highlight') {
      expect(result.current.hint.hint).toEqual(eliminationHint)
    }
    expect(result.current.selected).toEqual(selectedBefore)
  })

  it('ヒント表示中にUndoを呼ぶとヒント状態がnoneにリセットされる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    fillAllBlanksButOne(result)
    act(() => result.current.requestHint())

    act(() => result.current.undo())

    expect(result.current.hint.status).toBe('none')
  })

  it('New Game確定後はヒント状態がnoneにリセットされる', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    fillAllBlanksButOne(result)
    act(() => result.current.requestHint())
    expect(result.current.hint.status).toBe('highlight')

    confirmNewGame(result)

    expect(result.current.hint.status).toBe('none')
  })
})
