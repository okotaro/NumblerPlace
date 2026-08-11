import { describe, expect, it } from 'vitest'
import { hasUniqueSolution, solve } from './solver'

// Wikipedia「数独」記事に掲載されている例題（公開されている一意解を持つ問題）
const WIKIPEDIA_PUZZLE: (number | null)[][] = [
  [5, 3, null, null, 7, null, null, null, null],
  [6, null, null, 1, 9, 5, null, null, null],
  [null, 9, 8, null, null, null, null, 6, null],
  [8, null, null, null, 6, null, null, null, 3],
  [4, null, null, 8, null, 3, null, null, 1],
  [7, null, null, null, 2, null, null, null, 6],
  [null, 6, null, null, null, null, 2, 8, null],
  [null, null, null, 4, 1, 9, null, null, 5],
  [null, null, null, null, 8, null, null, 7, 9],
]

const WIKIPEDIA_SOLUTION: number[][] = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
]

// WIKIPEDIA_SOLUTIONの(0,0)を空欄にし、(0,8)に本来と異なる5を重複させることで、
// 空欄(0,0)の候補が行・列・ブロックいずれの制約からも埋まらない盤面を作る。
const CONTRADICTORY_BOARD: (number | null)[][] = WIKIPEDIA_SOLUTION.map(
  (row) => [...row],
)
CONTRADICTORY_BOARD[0][0] = null
CONTRADICTORY_BOARD[0][8] = 5

const EMPTY_BOARD: (number | null)[][] = Array.from({ length: 9 }, () =>
  Array.from({ length: 9 }, () => null),
)

describe('solve', () => {
  it('solves a puzzle with a known unique solution', () => {
    expect(solve(WIKIPEDIA_PUZZLE)).toEqual(WIKIPEDIA_SOLUTION)
  })

  it('returns the same board when there are no blanks', () => {
    expect(solve(WIKIPEDIA_SOLUTION)).toEqual(WIKIPEDIA_SOLUTION)
  })

  it('returns null for an unsolvable board', () => {
    expect(solve(CONTRADICTORY_BOARD)).toBeNull()
  })

  it('keeps given hint values unchanged in the solution', () => {
    const result = solve(WIKIPEDIA_PUZZLE)

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const given = WIKIPEDIA_PUZZLE[row][col]
        if (given !== null) {
          expect(result?.[row][col]).toBe(given)
        }
      }
    }
  })
})

describe('hasUniqueSolution', () => {
  it('returns true for a puzzle with a known unique solution', () => {
    expect(hasUniqueSolution(WIKIPEDIA_PUZZLE)).toBe(true)
  })

  it('returns true for a fully filled valid board', () => {
    expect(hasUniqueSolution(WIKIPEDIA_SOLUTION)).toBe(true)
  })

  it('returns false for a fully empty board (many solutions)', () => {
    expect(hasUniqueSolution(EMPTY_BOARD)).toBe(false)
  })

  it('returns false for a board with no solution', () => {
    expect(hasUniqueSolution(CONTRADICTORY_BOARD)).toBe(false)
  })
})
