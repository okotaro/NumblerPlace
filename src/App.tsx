import { Board } from './components/Board'
import { ClearModal } from './components/ClearModal'
import { Controls } from './components/Controls'
import { HintPanel } from './components/HintPanel'
import { NewGameModal } from './components/NewGameModal'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { useNumberPlaceGame } from './hooks/useNumberPlaceGame'

function App() {
  const {
    board,
    selected,
    isMemoMode,
    errorCells,
    isCleared,
    completedNumbers,
    newGameModal,
    hint,
    selectCell,
    moveSelection,
    toggleMemoMode,
    inputNumber,
    eraseSelectedCell,
    undo,
    check,
    openNewGame,
    closeNewGame,
    selectNewGameDifficulty,
    requestHint,
    confirmNewGame,
  } = useNumberPlaceGame()

  const hintCells =
    hint.status === 'highlight' || hint.status === 'reason'
      ? hint.hint.kind === 'value'
        ? [{ position: hint.hint.position, role: 'cause' as const }]
        : hint.hint.cells
      : []

  useKeyboardControls({
    onMove: moveSelection,
    onNumberInput: inputNumber,
    onErase: eraseSelectedCell,
  })

  return (
    <div className="flex min-h-svh items-center justify-center gap-8 bg-white p-8">
      <div className="w-full max-w-xl">
        <Board
          board={board}
          selected={selected}
          errorCells={errorCells}
          hintCells={hintCells}
          onSelectCell={selectCell}
        />
      </div>
      <div className="flex w-full max-w-xs flex-col gap-4">
        <Controls
          isMemoMode={isMemoMode}
          completedNumbers={completedNumbers}
          onToggleMemoMode={toggleMemoMode}
          onNumberClick={inputNumber}
          onUndo={undo}
          onErase={eraseSelectedCell}
          onCheck={check}
          onNewGame={openNewGame}
          onHint={requestHint}
        />
        <HintPanel hint={hint} />
      </div>
      <ClearModal isOpen={isCleared && !newGameModal.isOpen} onNewGame={openNewGame} />
      <NewGameModal
        isOpen={newGameModal.isOpen}
        difficulty={newGameModal.difficulty}
        onSelectDifficulty={selectNewGameDifficulty}
        onConfirm={confirmNewGame}
        onCancel={closeNewGame}
      />
    </div>
  )
}

export default App
