import { useReducer } from 'react'
import {
  DEFAULT_DIFFICULTY,
  generatePuzzle,
  type Difficulty,
  type PuzzleBoard,
} from '../services/numberPlaceService'
import { createEmptyMemos, createInitialBoard } from '../utils/board'
import type { Board, MemoMark, Position } from '../types'

type GameState = {
  board: Board
  solution: number[][]
  selected: Position | null
  isMemoMode: boolean
}

type GameAction =
  | { type: 'SELECT_CELL'; position: Position }
  | { type: 'TOGGLE_MEMO_MODE' }
  | { type: 'INPUT_NUMBER'; value: number }
  | { type: 'ERASE_SELECTED_CELL' }
  | { type: 'NEW_GAME'; puzzle: PuzzleBoard }

function createGameState(puzzle: PuzzleBoard): GameState {
  return {
    board: createInitialBoard(puzzle.given),
    solution: puzzle.solution,
    selected: null,
    isMemoMode: false,
  }
}

function cycleMemo(mark: MemoMark): MemoMark {
  if (mark === 'none') return 'candidate'
  if (mark === 'candidate') return 'notCandidate'
  return 'none'
}

function updateSelectedCell(
  state: GameState,
  update: (memos: Record<number, MemoMark>) => Partial<{
    value: number | null
    memos: Record<number, MemoMark>
  }>,
): GameState {
  if (state.selected === null) return state
  const { row, col } = state.selected
  const cell = state.board[row][col]
  if (cell.isGiven) return state

  const board = state.board.map((boardRow, r) =>
    boardRow.map((boardCell, c) =>
      r === row && c === col
        ? { ...boardCell, ...update(boardCell.memos) }
        : boardCell,
    ),
  )
  return { ...state, board }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_CELL':
      return { ...state, selected: action.position }
    case 'TOGGLE_MEMO_MODE':
      return { ...state, isMemoMode: !state.isMemoMode }
    case 'INPUT_NUMBER':
      return updateSelectedCell(state, (memos) =>
        state.isMemoMode
          ? {
              memos: {
                ...memos,
                [action.value]: cycleMemo(memos[action.value]),
              },
            }
          : { value: action.value },
      )
    case 'ERASE_SELECTED_CELL':
      return updateSelectedCell(state, () => ({
        value: null,
        memos: createEmptyMemos(),
      }))
    case 'NEW_GAME':
      return createGameState(action.puzzle)
    default:
      return state
  }
}

export function useNumberPlaceGame(
  difficulty: Difficulty = DEFAULT_DIFFICULTY,
) {
  const [state, dispatch] = useReducer(gameReducer, difficulty, (d) =>
    createGameState(generatePuzzle(d)),
  )

  return {
    board: state.board,
    selected: state.selected,
    isMemoMode: state.isMemoMode,
    selectCell: (position: Position) =>
      dispatch({ type: 'SELECT_CELL', position }),
    toggleMemoMode: () => dispatch({ type: 'TOGGLE_MEMO_MODE' }),
    inputNumber: (value: number) => dispatch({ type: 'INPUT_NUMBER', value }),
    eraseSelectedCell: () => dispatch({ type: 'ERASE_SELECTED_CELL' }),
    newGame: () =>
      dispatch({ type: 'NEW_GAME', puzzle: generatePuzzle(difficulty) }),
  }
}
