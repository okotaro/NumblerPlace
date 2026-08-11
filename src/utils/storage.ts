import type { Board, Cell, MemoMark, Position } from '../types'

export const STORAGE_KEY = 'numberplace:v1:gameState'

export type PersistedGameState = {
  board: Board
  solution: number[][]
  selected: Position | null
  isMemoMode: boolean
  isCleared: boolean
}

export function saveGameState(state: PersistedGameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorageが使えない環境（プライベートブラウジング等）では保存をスキップする
  }
}

export function loadGameState(): PersistedGameState | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (raw === null) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    return isPersistedGameState(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function isPosition(value: unknown): value is Position {
  if (typeof value !== 'object' || value === null) return false
  const { row, col } = value as Record<string, unknown>
  return (
    typeof row === 'number' &&
    row >= 0 &&
    row <= 8 &&
    typeof col === 'number' &&
    col >= 0 &&
    col <= 8
  )
}

function isMemoMark(value: unknown): value is MemoMark {
  return value === 'none' || value === 'candidate' || value === 'notCandidate'
}

function isMemos(value: unknown): value is Record<number, MemoMark> {
  if (typeof value !== 'object' || value === null) return false
  const memos = value as Record<string, unknown>
  for (let n = 1; n <= 9; n++) {
    if (!isMemoMark(memos[n])) return false
  }
  return true
}

function isCell(value: unknown): value is Cell {
  if (typeof value !== 'object' || value === null) return false
  const { value: cellValue, isGiven, memos } = value as Record<string, unknown>
  const isValidValue =
    cellValue === null || (typeof cellValue === 'number' && cellValue >= 1 && cellValue <= 9)
  return isValidValue && typeof isGiven === 'boolean' && isMemos(memos)
}

function isBoard(value: unknown): value is Board {
  return (
    Array.isArray(value) &&
    value.length === 9 &&
    value.every((row) => Array.isArray(row) && row.length === 9 && row.every(isCell))
  )
}

function isSolution(value: unknown): value is number[][] {
  return (
    Array.isArray(value) &&
    value.length === 9 &&
    value.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 9 &&
        row.every((n) => typeof n === 'number' && n >= 1 && n <= 9),
    )
  )
}

function isPersistedGameState(value: unknown): value is PersistedGameState {
  if (typeof value !== 'object' || value === null) return false
  const { board, solution, selected, isMemoMode, isCleared } =
    value as Record<string, unknown>

  return (
    isBoard(board) &&
    isSolution(solution) &&
    (selected === null || isPosition(selected)) &&
    typeof isMemoMode === 'boolean' &&
    typeof isCleared === 'boolean'
  )
}
