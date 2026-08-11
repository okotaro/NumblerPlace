import { useState } from 'react'
import { Board } from './components/Board'
import {
  DEFAULT_DIFFICULTY,
  generatePuzzle,
} from './services/numberPlaceService'
import { createInitialBoard } from './utils/board'
import type { Board as BoardType, Position } from './types'

function App() {
  const [board] = useState<BoardType>(() =>
    createInitialBoard(generatePuzzle(DEFAULT_DIFFICULTY).given),
  )
  const [selected, setSelected] = useState<Position | null>(null)

  return (
    <div className="flex min-h-svh items-center justify-center bg-white p-8">
      <div className="w-full max-w-xl">
        <Board board={board} selected={selected} onSelectCell={setSelected} />
      </div>
    </div>
  )
}

export default App
