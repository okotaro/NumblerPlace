import { beforeEach, describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  clearGameState,
  loadGameState,
  saveGameState,
  type PersistedGameState,
} from './storage'
import { createInitialBoard } from './board'

function makeGiven(hints: Record<string, number>): (number | null)[][] {
  return Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => hints[`${row},${col}`] ?? null),
  )
}

function makeSolution(): number[][] {
  return Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => ((row * 3 + Math.floor(row / 3) + col) % 9) + 1),
  )
}

function makeState(
  overrides: Partial<PersistedGameState> = {},
): PersistedGameState {
  const board = createInitialBoard(makeGiven({ '0,0': 5, '3,4': 9 }))
  board[1][1].value = 7
  board[1][1].memos[3] = 'candidate'

  return {
    board,
    solution: makeSolution(),
    selected: { row: 1, col: 1 },
    isMemoMode: true,
    isCleared: false,
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('saveGameState / loadGameState', () => {
  it('保存した内容がそのまま復元できる', () => {
    const state = makeState()

    saveGameState(state)

    expect(loadGameState()).toEqual(state)
  })

  it('selectedがnullの状態でも保存・復元できる', () => {
    const state = makeState({ selected: null })

    saveGameState(state)

    expect(loadGameState()?.selected).toBeNull()
  })
})

describe('loadGameState 未保存・壊れたデータのフォールバック', () => {
  it('何も保存されていない場合はnullを返す', () => {
    expect(loadGameState()).toBeNull()
  })

  it('壊れたJSONが保存されている場合はnullを返す', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')

    expect(loadGameState()).toBeNull()
  })

  it('必須フィールドが欠落している場合はnullを返す', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}))

    expect(loadGameState()).toBeNull()
  })

  it('boardのサイズが9x9でない場合はnullを返す', () => {
    const state = makeState()
    const broken = { ...state, board: state.board.slice(0, 8) }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(broken))

    expect(loadGameState()).toBeNull()
  })
})

describe('clearGameState', () => {
  it('保存内容が削除される', () => {
    saveGameState(makeState())

    clearGameState()

    expect(loadGameState()).toBeNull()
  })
})
