import { Eraser, Lightbulb, NotebookPen, Undo2 } from 'lucide-react'
import { NumberPad } from './NumberPad'

type ControlsProps = {
  isMemoMode: boolean
  completedNumbers: number[]
  onNumberClick: (n: number) => void
  onUndo: () => void
  onErase: () => void
  onToggleMemoMode: () => void
  onCheck: () => void
  onNewGame: () => void
  onHint: () => void
}

const buttonClassName =
  'rounded border border-gray-300 px-3 py-2 hover:bg-gray-100'

const iconButtonClassName =
  'flex h-10 w-10 items-center justify-center rounded border border-gray-300 hover:bg-gray-100'

export function Controls({
  isMemoMode,
  completedNumbers,
  onNumberClick,
  onUndo,
  onErase,
  onToggleMemoMode,
  onCheck,
  onNewGame,
  onHint,
}: ControlsProps) {
  const memoLabel = `メモ ${isMemoMode ? 'ON' : 'OFF'}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onUndo}
          className={iconButtonClassName}
          aria-label="戻る"
          title="戻る"
        >
          <Undo2 aria-hidden="true" className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onErase}
          className={iconButtonClassName}
          aria-label="消しゴム"
          title="消しゴム"
        >
          <Eraser aria-hidden="true" className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToggleMemoMode}
          aria-pressed={isMemoMode}
          aria-label={memoLabel}
          title={memoLabel}
          className={`${iconButtonClassName} ${isMemoMode ? 'border-blue-500 bg-blue-100' : ''}`}
        >
          <NotebookPen aria-hidden="true" className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onHint}
          className={iconButtonClassName}
          aria-label="ヒント"
          title="ヒント"
        >
          <Lightbulb aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <NumberPad onNumberClick={onNumberClick} completedNumbers={completedNumbers} />
      <button type="button" onClick={onCheck} className={buttonClassName}>
        Check
      </button>
      <button type="button" onClick={onNewGame} className={buttonClassName}>
        New Game
      </button>
    </div>
  )
}
