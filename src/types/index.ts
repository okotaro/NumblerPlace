export type MemoMark = 'none' | 'candidate' | 'notCandidate'

export type Cell = {
  value: number | null
  isGiven: boolean
  memos: Record<number, MemoMark> // key: 1-9
}

export type Board = Cell[][] // 9x9

export type Position = { row: number; col: number } // 0-8
