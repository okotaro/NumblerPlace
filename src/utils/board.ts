import type { Board, Cell, MemoMark } from '../types'

export function createEmptyMemos(): Record<number, MemoMark> {
  const memos: Record<number, MemoMark> = {}
  for (let n = 1; n <= 9; n++) {
    memos[n] = 'none'
  }
  return memos
}

export function createInitialBoard(given: (number | null)[][]): Board {
  return given.map((row) =>
    row.map((value): Cell => {
      if (value === null) {
        return { value: null, isGiven: false, memos: createEmptyMemos() }
      }
      return { value, isGiven: true, memos: createEmptyMemos() }
    }),
  )
}

export function hasProgress(board: Board): boolean {
  return board.some((row) =>
    row.some((cell) => !cell.isGiven && cell.value !== null),
  )
}

export function countPlacedValues(board: Board): Record<number, number> {
  const counts: Record<number, number> = {}
  for (let n = 1; n <= 9; n++) {
    counts[n] = 0
  }
  board.forEach((row) =>
    row.forEach((cell) => {
      if (cell.value !== null) {
        counts[cell.value] += 1
      }
    }),
  )
  return counts
}
