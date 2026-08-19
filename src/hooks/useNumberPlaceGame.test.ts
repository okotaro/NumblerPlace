import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNumberPlaceGame } from './useNumberPlaceGame'
import { DEFAULT_DIFFICULTY } from '../services/numberPlaceService'
import { STORAGE_KEY, loadGameState } from '../utils/storage'

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

  it('1マスでも誤答があるとisClearedはfalseのまま', () => {
    const { result } = renderHook(() => useNumberPlaceGame())
    const blanks = findBlankCellPositions(result.current.board)

    blanks.slice(0, -1).forEach((position) => fillCorrectValue(result, position))
    const last = blanks[blanks.length - 1]
    act(() => result.current.selectCell(last))
    act(() => result.current.inputNumber(1))
    act(() => result.current.check())
    if (!result.current.errorCells.some((p) => p.row === last.row && p.col === last.col)) {
      act(() => result.current.inputNumber(2))
    }

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
