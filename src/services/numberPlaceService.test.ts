import { describe, expect, it } from 'vitest'
import {
  checkAnswers,
  DEFAULT_DIFFICULTY,
  generatePuzzle,
  isBoardComplete,
  type Difficulty,
} from './numberPlaceService'

// sudoku-core の generate() は easy/medium と比べて hard/expert/master で
// 生成時間が大きくばらつき、数十秒かかることがある。ここでは代表として
// easy と既定難易度(medium)のみをフル検証し、他の難易度はDifficulty型で保証する。
const DIFFICULTIES_TO_VALIDATE: Difficulty[] = ['easy', 'medium']

function isCompleteAndValidSolution(grid: number[][]): boolean {
  const isValidGroup = (values: number[]) =>
    new Set(values).size === 9 && values.every((v) => v >= 1 && v <= 9)

  for (let row = 0; row < 9; row++) {
    if (!isValidGroup(grid[row])) return false
  }
  for (let col = 0; col < 9; col++) {
    if (!isValidGroup(grid.map((row) => row[col]))) return false
  }
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const box: number[] = []
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          box.push(grid[boxRow * 3 + r][boxCol * 3 + c])
        }
      }
      if (!isValidGroup(box)) return false
    }
  }
  return true
}

describe('generatePuzzle', () => {
  it.each(DIFFICULTIES_TO_VALIDATE)(
    'returns a 9x9 given board and a valid complete solution for difficulty=%s',
    (difficulty) => {
      const puzzle = generatePuzzle(difficulty)

      expect(puzzle.given).toHaveLength(9)
      expect(puzzle.solution).toHaveLength(9)
      puzzle.given.forEach((row) => expect(row).toHaveLength(9))
      puzzle.solution.forEach((row) => expect(row).toHaveLength(9))

      expect(isCompleteAndValidSolution(puzzle.solution)).toBe(true)
    },
    20000,
  )

  it('given cells are a subset of the solution (hints match the solution)', () => {
    const puzzle = generatePuzzle('medium')

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const givenValue = puzzle.given[row][col]
        if (givenValue !== null) {
          expect(givenValue).toBe(puzzle.solution[row][col])
        }
      }
    }
  })

  it('given board has both hint cells and blank cells', () => {
    const puzzle = generatePuzzle('medium')
    const flat = puzzle.given.flat()

    expect(flat.some((v) => v !== null)).toBe(true)
    expect(flat.some((v) => v === null)).toBe(true)
  })
})

describe('DEFAULT_DIFFICULTY', () => {
  it('is medium', () => {
    expect(DEFAULT_DIFFICULTY).toBe('medium')
  })
})

describe('isBoardComplete', () => {
  const filled: (number | null)[][] = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => ((row + col) % 9) + 1),
  )

  it('returns true when every cell is filled', () => {
    expect(isBoardComplete(filled)).toBe(true)
  })

  it('returns false when at least one cell is empty', () => {
    const withBlank = filled.map((row) => [...row])
    withBlank[3][4] = null

    expect(isBoardComplete(withBlank)).toBe(false)
  })

  it('returns false for a fully empty board', () => {
    const empty: (number | null)[][] = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => null),
    )

    expect(isBoardComplete(empty)).toBe(false)
  })
})

describe('checkAnswers', () => {
  const solution: number[][] = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => ((row + col) % 9) + 1),
  )

  it('marks nothing wrong when all entered values match the solution', () => {
    const userValues = solution.map((row) => [...row])
    const result = checkAnswers(userValues, solution)

    expect(result.every((row) => row.every((cell) => cell === false))).toBe(
      true,
    )
  })

  it('marks only the mismatched cell as incorrect', () => {
    const userValues: (number | null)[][] = solution.map((row) => [...row])
    const wrongValue = solution[2][5] === 9 ? 1 : solution[2][5] + 1
    userValues[2][5] = wrongValue

    const result = checkAnswers(userValues, solution)

    expect(result[2][5]).toBe(true)
    result.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (r !== 2 || c !== 5) expect(cell).toBe(false)
      }),
    )
  })

  it('treats empty cells as not incorrect', () => {
    const userValues: (number | null)[][] = solution.map((row) => [...row])
    userValues[0][0] = null

    const result = checkAnswers(userValues, solution)

    expect(result[0][0]).toBe(false)
  })
})
