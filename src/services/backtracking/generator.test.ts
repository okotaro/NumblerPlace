import { describe, expect, it } from 'vitest'
import { generatePuzzleBoard, generateSolvedBoard } from './generator'
import { hasUniqueSolution } from './solver'
import type { Difficulty } from './generator'

const ALL_DIFFICULTIES: Difficulty[] = [
  'easy',
  'medium',
  'hard',
  'expert',
  'master',
]

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

describe('generateSolvedBoard', () => {
  it('returns a valid complete 9x9 board', () => {
    const board = generateSolvedBoard()

    expect(board).toHaveLength(9)
    board.forEach((row) => expect(row).toHaveLength(9))
    expect(isCompleteAndValidSolution(board)).toBe(true)
  })

  it('produces different boards across calls (randomized)', () => {
    const boards = Array.from({ length: 5 }, () => generateSolvedBoard())
    const serialized = boards.map((b) => JSON.stringify(b))

    expect(new Set(serialized).size).toBeGreaterThan(1)
  })
})

describe('generatePuzzleBoard', () => {
  it.each(ALL_DIFFICULTIES)(
    'returns a 9x9 given board and a valid complete solution for difficulty=%s',
    (difficulty) => {
      const puzzle = generatePuzzleBoard(difficulty)

      expect(puzzle.given).toHaveLength(9)
      expect(puzzle.solution).toHaveLength(9)
      puzzle.given.forEach((row) => expect(row).toHaveLength(9))
      puzzle.solution.forEach((row) => expect(row).toHaveLength(9))

      expect(isCompleteAndValidSolution(puzzle.solution)).toBe(true)
    },
  )

  it('given cells are a subset of the solution (hints match the solution)', () => {
    const puzzle = generatePuzzleBoard('medium')

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
    const puzzle = generatePuzzleBoard('medium')
    const flat = puzzle.given.flat()

    expect(flat.some((v) => v !== null)).toBe(true)
    expect(flat.some((v) => v === null)).toBe(true)
  })

  it.each(ALL_DIFFICULTIES)(
    'the given board for difficulty=%s has a unique solution',
    (difficulty) => {
      const puzzle = generatePuzzleBoard(difficulty)

      expect(hasUniqueSolution(puzzle.given)).toBe(true)
    },
  )

  it('produces fewer hints on average as difficulty increases (easy vs master)', () => {
    const countHints = (given: (number | null)[][]) =>
      given.flat().filter((v) => v !== null).length

    const easyHints = countHints(generatePuzzleBoard('easy').given)
    const masterHints = countHints(generatePuzzleBoard('master').given)

    expect(easyHints).toBeGreaterThan(masterHints)
  })
})
