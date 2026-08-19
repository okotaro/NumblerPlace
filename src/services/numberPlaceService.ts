import { generatePuzzleBoard, type Difficulty } from './backtracking/generator'

export type { Difficulty }

export type PuzzleBoard = {
  given: (number | null)[][] // 9x9、初期ヒント（ヒントでないマスはnull）
  solution: number[][] // 9x9、完全な正解
}

export const DEFAULT_DIFFICULTY: Difficulty = 'medium'

export const DIFFICULTIES: readonly Difficulty[] = [
  'easy',
  'medium',
  'hard',
  'expert',
  'master',
]

export function generatePuzzle(difficulty: Difficulty): PuzzleBoard {
  return generatePuzzleBoard(difficulty)
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
