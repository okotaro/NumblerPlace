import type { Board, Cell, MemoMark } from '../types'

function createEmptyMemos(): Record<number, MemoMark> {
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
