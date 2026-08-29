import { useEffect, useReducer } from 'react'
import {
  DEFAULT_DIFFICULTY,
  checkAnswers,
  findHint,
  generatePuzzle,
  isBoardComplete,
  type Difficulty,
  type Hint,
  type PuzzleBoard,
} from '../services/numberPlaceService'
import {
  countPlacedValues,
  createEmptyMemos,
  createInitialBoard,
  hasProgress,
} from '../utils/board'
import { loadGameState, saveGameState } from '../utils/storage'
import type { Board, MemoMark, Position } from '../types'

export type HintState =
  | { status: 'none' }
  | { status: 'notFound' }
  | { status: 'highlight'; hint: Hint }
  | { status: 'reason'; hint: Hint }

const NO_HINT: HintState = { status: 'none' }

type GameState = {
  board: Board
  solution: number[][]
  selected: Position | null
  isMemoMode: boolean
  history: Board[]
  errorCells: Position[]
  isCleared: boolean
  difficulty: Difficulty
  newGameModal: { isOpen: boolean; difficulty: Difficulty }
  hint: HintState
}

export type Direction = 'up' | 'down' | 'left' | 'right'

const DIRECTION_DELTA: Record<Direction, { row: number; col: number }> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
}

type GameAction =
  | { type: 'SELECT_CELL'; position: Position }
  | { type: 'MOVE_SELECTION'; direction: Direction }
  | { type: 'TOGGLE_MEMO_MODE' }
  | { type: 'INPUT_NUMBER'; value: number }
  | { type: 'ERASE_SELECTED_CELL' }
  | { type: 'UNDO' }
  | { type: 'CHECK' }
  | { type: 'NEW_GAME'; puzzle: PuzzleBoard; difficulty: Difficulty }
  | { type: 'OPEN_NEW_GAME_MODAL' }
  | { type: 'CLOSE_NEW_GAME_MODAL' }
  | { type: 'SELECT_NEW_GAME_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'REQUEST_HINT' }

function createGameState(puzzle: PuzzleBoard, difficulty: Difficulty): GameState {
  return {
    board: createInitialBoard(puzzle.given),
    solution: puzzle.solution,
    selected: null,
    isMemoMode: false,
    history: [],
    errorCells: [],
    isCleared: false,
    difficulty,
    newGameModal: { isOpen: false, difficulty },
    hint: NO_HINT,
  }
}

function createInitialGameState(difficulty: Difficulty): GameState {
  const persisted = loadGameState()
  if (persisted !== null) {
    return {
      board: persisted.board,
      solution: persisted.solution,
      selected: persisted.selected,
      isMemoMode: persisted.isMemoMode,
      history: [],
      errorCells: [],
      isCleared: persisted.isCleared,
      difficulty: persisted.difficulty,
      newGameModal: { isOpen: false, difficulty: persisted.difficulty },
      hint: NO_HINT,
    }
  }
  return createGameState(generatePuzzle(difficulty), difficulty)
}

function isSamePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col
}

function withClearedStatus(state: GameState): GameState {
  const userValues = state.board.map((row) => row.map((cell) => cell.value))
  const isCleared =
    isBoardComplete(userValues) &&
    checkAnswers(userValues, state.solution).every((row) =>
      row.every((isError) => !isError),
    )
  return { ...state, isCleared }
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

function updateBoardWithHistory(
  state: GameState,
  update: (memos: Record<number, MemoMark>) => Partial<{
    value: number | null
    memos: Record<number, MemoMark>
  }>,
  { clearsError }: { clearsError: boolean },
): GameState {
  const next = updateSelectedCell(state, update)
  if (next.board === state.board) return next
  const selected = state.selected
  const errorCells =
    clearsError && selected !== null
      ? state.errorCells.filter((position) => !isSamePosition(position, selected))
      : state.errorCells
  return withClearedStatus({
    ...next,
    history: [...state.history, state.board],
    errorCells,
    hint: NO_HINT,
  })
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_CELL':
      return { ...state, selected: action.position }
    case 'MOVE_SELECTION': {
      if (state.selected === null) return state
      const delta = DIRECTION_DELTA[action.direction]
      const row = state.selected.row + delta.row
      const col = state.selected.col + delta.col
      if (row < 0 || row > 8 || col < 0 || col > 8) return state
      return { ...state, selected: { row, col } }
    }
    case 'TOGGLE_MEMO_MODE':
      return { ...state, isMemoMode: !state.isMemoMode }
    case 'INPUT_NUMBER':
      if (countPlacedValues(state.board)[action.value] === 9) return state
      return updateBoardWithHistory(
        state,
        (memos) =>
          state.isMemoMode
            ? {
                memos: {
                  ...memos,
                  [action.value]: cycleMemo(memos[action.value]),
                },
              }
            : { value: action.value },
        { clearsError: !state.isMemoMode },
      )
    case 'ERASE_SELECTED_CELL':
      return updateBoardWithHistory(
        state,
        () => ({
          value: null,
          memos: createEmptyMemos(),
        }),
        { clearsError: true },
      )
    case 'CHECK': {
      const userValues = state.board.map((row) =>
        row.map((cell) => cell.value),
      )
      const errors = checkAnswers(userValues, state.solution)
      const errorCells: Position[] = []
      errors.forEach((row, rowIndex) =>
        row.forEach((isError, colIndex) => {
          if (isError) errorCells.push({ row: rowIndex, col: colIndex })
        }),
      )
      return { ...state, errorCells }
    }
    case 'UNDO': {
      if (state.history.length === 0) return state
      const previousBoard = state.history[state.history.length - 1]
      const userValues = previousBoard.map((row) =>
        row.map((cell) => cell.value),
      )
      const errors = checkAnswers(userValues, state.solution)
      const errorCells = state.errorCells.filter(
        (position) => errors[position.row][position.col],
      )
      return withClearedStatus({
        ...state,
        board: previousBoard,
        history: state.history.slice(0, -1),
        errorCells,
        hint: NO_HINT,
      })
    }
    case 'NEW_GAME':
      return createGameState(action.puzzle, action.difficulty)
    case 'OPEN_NEW_GAME_MODAL':
      return {
        ...state,
        newGameModal: { isOpen: true, difficulty: state.difficulty },
      }
    case 'CLOSE_NEW_GAME_MODAL':
      return { ...state, newGameModal: { ...state.newGameModal, isOpen: false } }
    case 'SELECT_NEW_GAME_DIFFICULTY':
      return {
        ...state,
        newGameModal: { ...state.newGameModal, difficulty: action.difficulty },
      }
    case 'REQUEST_HINT': {
      if (state.hint.status === 'highlight') {
        return { ...state, hint: { status: 'reason', hint: state.hint.hint } }
      }
      const userValues = state.board.map((row) => row.map((cell) => cell.value))
      const memos = state.board.map((row) => row.map((cell) => cell.memos))
      const hint = findHint(userValues, state.solution, memos)
      if (hint === null) {
        return { ...state, hint: { status: 'notFound' } }
      }
      return {
        ...state,
        selected: hint.kind === 'value' ? hint.position : state.selected,
        hint: { status: 'highlight', hint },
      }
    }
    default:
      return state
  }
}

export function useNumberPlaceGame(
  difficulty: Difficulty = DEFAULT_DIFFICULTY,
) {
  const [state, dispatch] = useReducer(
    gameReducer,
    difficulty,
    createInitialGameState,
  )

  useEffect(() => {
    saveGameState({
      board: state.board,
      solution: state.solution,
      selected: state.selected,
      isMemoMode: state.isMemoMode,
      isCleared: state.isCleared,
      difficulty: state.difficulty,
    })
  }, [
    state.board,
    state.solution,
    state.selected,
    state.isMemoMode,
    state.isCleared,
    state.difficulty,
  ])

  const placedValueCounts = countPlacedValues(state.board)
  const completedNumbers = Array.from({ length: 9 }, (_, i) => i + 1).filter(
    (n) => placedValueCounts[n] === 9,
  )

  return {
    board: state.board,
    selected: state.selected,
    isMemoMode: state.isMemoMode,
    errorCells: state.errorCells,
    completedNumbers,
    isCleared: state.isCleared,
    newGameModal: state.newGameModal,
    hint: state.hint,
    selectCell: (position: Position) =>
      dispatch({ type: 'SELECT_CELL', position }),
    moveSelection: (direction: Direction) =>
      dispatch({ type: 'MOVE_SELECTION', direction }),
    toggleMemoMode: () => dispatch({ type: 'TOGGLE_MEMO_MODE' }),
    inputNumber: (value: number) => dispatch({ type: 'INPUT_NUMBER', value }),
    eraseSelectedCell: () => dispatch({ type: 'ERASE_SELECTED_CELL' }),
    undo: () => dispatch({ type: 'UNDO' }),
    check: () => dispatch({ type: 'CHECK' }),
    openNewGame: () => dispatch({ type: 'OPEN_NEW_GAME_MODAL' }),
    closeNewGame: () => dispatch({ type: 'CLOSE_NEW_GAME_MODAL' }),
    selectNewGameDifficulty: (value: Difficulty) =>
      dispatch({ type: 'SELECT_NEW_GAME_DIFFICULTY', difficulty: value }),
    requestHint: () => dispatch({ type: 'REQUEST_HINT' }),
    confirmNewGame: () => {
      if (hasProgress(state.board) && !state.isCleared) {
        if (!window.confirm('進行中の盤面があります。新しいゲームを開始しますか？')) {
          return
        }
      }
      const newDifficulty = state.newGameModal.difficulty
      dispatch({
        type: 'NEW_GAME',
        puzzle: generatePuzzle(newDifficulty),
        difficulty: newDifficulty,
      })
    },
  }
}
