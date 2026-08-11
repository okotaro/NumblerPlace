import { useEffect } from 'react'
import type { Direction } from './useNumberPlaceGame'

type KeyboardControlsConfig = {
  onMove: (direction: Direction) => void
  onNumberInput: (value: number) => void
  onErase: () => void
}

const ARROW_KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

export function useKeyboardControls({
  onMove,
  onNumberInput,
  onErase,
}: KeyboardControlsConfig) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const direction = ARROW_KEY_DIRECTIONS[event.key]
      if (direction) {
        event.preventDefault()
        onMove(direction)
        return
      }
      if (event.key >= '1' && event.key <= '9') {
        onNumberInput(Number(event.key))
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        onErase()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onMove, onNumberInput, onErase])
}
