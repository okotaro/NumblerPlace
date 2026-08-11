import { describe, expect, it } from 'vitest'
import { createInitialBoard } from './board'

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
