import { Board } from './components/Board'
import { Controls } from './components/Controls'
import { useNumberPlaceGame } from './hooks/useNumberPlaceGame'

function App() {
  const {
    board,
    selected,
    isMemoMode,
    selectCell,
    toggleMemoMode,
    inputNumber,
    eraseSelectedCell,
    newGame,
  } = useNumberPlaceGame()

  return (
    <div className="flex min-h-svh items-center justify-center gap-8 bg-white p-8">
      <div className="w-full max-w-xl">
        <Board board={board} selected={selected} onSelectCell={selectCell} />
      </div>
      <Controls
        isMemoMode={isMemoMode}
        onToggleMemoMode={toggleMemoMode}
        onNumberClick={inputNumber}
        onUndo={() => {}}
        onErase={eraseSelectedCell}
        onCheck={() => {}}
        onNewGame={newGame}
      />
    </div>
  )
}

export default App
