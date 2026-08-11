import { generate, solve } from 'sudoku-core'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master'

export type PuzzleBoard = {
  given: (number | null)[][] // 9x9、初期ヒント（ヒントでないマスはnull）
  solution: number[][] // 9x9、完全な正解
}

export const DEFAULT_DIFFICULTY: Difficulty = 'medium'

const BOARD_SIZE = 9

function toGrid<T>(flat: T[]): T[][] {
  const grid: T[][] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    grid.push(flat.slice(row * BOARD_SIZE, (row + 1) * BOARD_SIZE))
  }
  return grid
}

export function generatePuzzle(difficulty: Difficulty): PuzzleBoard {
  const given = generate(difficulty)
  const result = solve(given)

  if (!result.solved || !result.board) {
    throw new Error(
      `sudoku-core failed to solve a puzzle it generated (difficulty=${difficulty})`,
    )
  }

  const solutionFlat = result.board.map((value) => {
    if (value === null) {
      throw new Error(
        `sudoku-core returned a solved board with an empty cell (difficulty=${difficulty})`,
      )
    }
    return value
  })

  return {
    given: toGrid(given),
    solution: toGrid(solutionFlat),
  }
}

export function isBoardComplete(userValues: (number | null)[][]): boolean {
  return userValues.every((row) => row.every((cell) => cell !== null))
}

export function checkAnswers(
  userValues: (number | null)[][],
  solution: number[][],
): boolean[][] {
  return userValues.map((row, rowIndex) =>
    row.map(
      (value, colIndex) =>
        value !== null && value !== solution[rowIndex][colIndex],
    ),
  )
}
