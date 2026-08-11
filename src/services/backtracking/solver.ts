const SIZE = 9
const BOX_SIZE = 3

export type Grid = (number | null)[][]

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row])
}

export function isPlacementValid(
  grid: Grid,
  row: number,
  col: number,
  value: number,
): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (grid[row][i] === value) return false
    if (grid[i][col] === value) return false
  }

  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE
  for (let r = 0; r < BOX_SIZE; r++) {
    for (let c = 0; c < BOX_SIZE; c++) {
      if (grid[boxRow + r][boxCol + c] === value) return false
    }
  }

  return true
}

export function findEmptyCell(
  grid: Grid,
): { row: number; col: number } | null {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (grid[row][col] === null) return { row, col }
    }
  }
  return null
}

// 空きマスの中で候補数が最も少ないマスを優先して埋める（MRVヒューリスティック）。
// 行優先の固定順だと、空欄の多い盤面（一意解判定の対象など）で
// バックトラック量が爆発的に増え実用的な時間で終わらないため必須。
function findMostConstrainedCell(
  grid: Grid,
): { row: number; col: number; candidates: number[] } | null {
  let best: { row: number; col: number; candidates: number[] } | null = null

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (grid[row][col] !== null) continue

      const candidates: number[] = []
      for (let value = 1; value <= SIZE; value++) {
        if (isPlacementValid(grid, row, col, value)) candidates.push(value)
      }

      if (best === null || candidates.length < best.candidates.length) {
        best = { row, col, candidates }
        if (candidates.length <= 1) return best
      }
    }
  }

  return best
}

function backtrackSolve(grid: Grid): boolean {
  const target = findMostConstrainedCell(grid)
  if (!target) return true

  const { row, col, candidates } = target
  for (const value of candidates) {
    grid[row][col] = value
    if (backtrackSolve(grid)) return true
    grid[row][col] = null
  }
  return false
}

export function solve(board: Grid): number[][] | null {
  const grid = cloneGrid(board)
  if (!backtrackSolve(grid)) return null
  return grid as number[][]
}

function countSolutions(grid: Grid, limit: number): number {
  const target = findMostConstrainedCell(grid)
  if (!target) return 1

  const { row, col, candidates } = target
  let count = 0
  for (const value of candidates) {
    if (count >= limit) break
    grid[row][col] = value
    count += countSolutions(grid, limit - count)
    grid[row][col] = null
  }
  return count
}

export function hasUniqueSolution(board: Grid): boolean {
  const grid = cloneGrid(board)
  return countSolutions(grid, 2) === 1
}
