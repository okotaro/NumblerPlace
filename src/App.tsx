import { Board } from './components/Board'
import { ClearModal } from './components/ClearModal'
import { Controls } from './components/Controls'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { useNumberPlaceGame } from './hooks/useNumberPlaceGame'

function App() {
  const {
    board,
    selected,
    isMemoMode,
    errorCells,
    isCleared,
    selectCell,
    moveSelection,
    toggleMemoMode,
    inputNumber,
    eraseSelectedCell,
    undo,
    check,
    newGame,
  } = useNumberPlaceGame()

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
          onSelectCell={selectCell}
        />
      </div>
      <Controls
        isMemoMode={isMemoMode}
        onToggleMemoMode={toggleMemoMode}
        onNumberClick={inputNumber}
        onUndo={undo}
        onErase={eraseSelectedCell}
        onCheck={check}
        onNewGame={newGame}
      />
      <ClearModal isOpen={isCleared} onNewGame={newGame} />
    </div>
  )
}

export default App
