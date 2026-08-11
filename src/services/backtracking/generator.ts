import {
  cloneGrid,
  findEmptyCell,
  hasUniqueSolution,
  isPlacementValid,
  type Grid,
} from './solver'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master'

export type GeneratedPuzzle = {
  given: Grid
  solution: number[][]
}

const SIZE = 9

// 難易度ごとの目安のヒント数。一意解を保ちながら間引くため、
// 実際のヒント数はこれよりわずかに多くなることがある。
const CLUE_TARGETS: Record<Difficulty, number> = {
  easy: 40,
  medium: 32,
  hard: 28,
  expert: 25,
  master: 22,
}

function shuffled<T>(values: T[]): T[] {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function fillRandomly(grid: Grid): boolean {
  const empty = findEmptyCell(grid)
  if (!empty) return true

  const { row, col } = empty
  for (const value of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (isPlacementValid(grid, row, col, value)) {
      grid[row][col] = value
      if (fillRandomly(grid)) return true
      grid[row][col] = null
    }
  }
  return false
}

export function generateSolvedBoard(): number[][] {
  const grid: Grid = Array.from({ length: SIZE }, () =>
    Array<number | null>(SIZE).fill(null),
  )

  if (!fillRandomly(grid)) {
    throw new Error('failed to generate a solved board')
  }

  return grid as number[][]
}

function allPositions(): { row: number; col: number }[] {
  const positions: { row: number; col: number }[] = []
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) positions.push({ row, col })
  }
  return positions
}

function digHoles(solution: number[][], targetClueCount: number): Grid {
  const given: Grid = cloneGrid(solution)
  let clueCount = SIZE * SIZE

  for (const { row, col } of shuffled(allPositions())) {
    if (clueCount <= targetClueCount) break

    const backup = given[row][col]
    given[row][col] = null

    if (hasUniqueSolution(given)) {
      clueCount--
    } else {
      given[row][col] = backup
    }
  }

  return given
}

export function generatePuzzleBoard(difficulty: Difficulty): GeneratedPuzzle {
  const solution = generateSolvedBoard()
  const given = digHoles(solution, CLUE_TARGETS[difficulty])

  return { given, solution }
}
