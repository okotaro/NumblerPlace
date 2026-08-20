import { describe, expect, it } from 'vitest'
import { countPlacedValues, createInitialBoard, hasProgress } from './board'

function makeGiven(hints: Record<string, number>): (number | null)[][] {
  return Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => hints[`${row},${col}`] ?? null),
  )
}

describe('createInitialBoard', () => {
  const given = makeGiven({ '0,0': 5, '3,4': 9 })
  const board = createInitialBoard(given)

  it('returns a 9x9 grid', () => {
    expect(board).toHaveLength(9)
    board.forEach((row) => expect(row).toHaveLength(9))
  })

  it('marks cells with a given value as hints', () => {
    expect(board[0][0].isGiven).toBe(true)
    expect(board[0][0].value).toBe(5)
    expect(board[3][4].isGiven).toBe(true)
    expect(board[3][4].value).toBe(9)
  })

  it('marks cells without a given value as blank', () => {
    expect(board[1][1].isGiven).toBe(false)
    expect(board[1][1].value).toBeNull()
  })

  it('initializes every cell with all memos set to none', () => {
    board.forEach((row) =>
      row.forEach((cell) => {
        for (let n = 1; n <= 9; n++) {
          expect(cell.memos[n]).toBe('none')
        }
      }),
    )
  })
})

describe('hasProgress', () => {
  it('returns false when no user input exists', () => {
    const given = makeGiven({ '0,0': 5, '3,4': 9 })
    const board = createInitialBoard(given)

    expect(hasProgress(board)).toBe(false)
  })

  it('returns true when at least one blank cell has a user value', () => {
    const given = makeGiven({ '0,0': 5, '3,4': 9 })
    const board = createInitialBoard(given)
    board[1][1].value = 7

    expect(hasProgress(board)).toBe(true)
  })

  it('does not count given (hint) cells as progress', () => {
    const given = makeGiven({ '0,0': 5, '3,4': 9 })
    const board = createInitialBoard(given)

    expect(board[0][0].isGiven).toBe(true)
    expect(hasProgress(board)).toBe(false)
  })
})

describe('countPlacedValues', () => {
  it('returns 0 for every number on an all-blank board', () => {
    const board = createInitialBoard(makeGiven({}))

    const counts = countPlacedValues(board)

    for (let n = 1; n <= 9; n++) {
      expect(counts[n]).toBe(0)
    }
  })

  it('counts given (hint) cells', () => {
    const board = createInitialBoard(
      makeGiven({ '0,0': 3, '1,1': 3, '2,2': 3 }),
    )

    expect(countPlacedValues(board)[3]).toBe(3)
  })

  it('counts user-entered values', () => {
    const board = createInitialBoard(makeGiven({}))
    board[0][0].value = 4
    board[1][1].value = 4
    board[2][2].value = 4
    board[3][3].value = 4
    board[4][4].value = 4

    expect(countPlacedValues(board)[4]).toBe(5)
  })

  it('sums given and user-entered cells together', () => {
    const board = createInitialBoard(makeGiven({ '0,0': 2, '1,1': 2 }))
    for (let i = 2; i < 9; i++) {
      board[i][i].value = 2
    }

    expect(countPlacedValues(board)[2]).toBe(9)
  })

  it('counts placements regardless of correctness', () => {
    const board = createInitialBoard(makeGiven({}))
    for (let i = 0; i < 9; i++) {
      board[i][0].value = 7
    }

    expect(countPlacedValues(board)[7]).toBe(9)
  })
})
