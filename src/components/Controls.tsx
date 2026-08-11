import { NumberPad } from './NumberPad'

type ControlsProps = {
  isMemoMode: boolean
  onNumberClick: (n: number) => void
  onUndo: () => void
  onErase: () => void
  onToggleMemoMode: () => void
  onCheck: () => void
  onNewGame: () => void
}

const buttonClassName =
  'rounded border border-gray-300 px-3 py-2 hover:bg-gray-100'

export function Controls({
  isMemoMode,
  onNumberClick,
  onUndo,
  onErase,
  onToggleMemoMode,
  onCheck,
  onNewGame,
}: ControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button type="button" onClick={onUndo} className={buttonClassName}>
          戻る
        </button>
        <button type="button" onClick={onErase} className={buttonClassName}>
          消しゴム
        </button>
        <button
          type="button"
          onClick={onToggleMemoMode}
          aria-pressed={isMemoMode}
          className={`${buttonClassName} ${isMemoMode ? 'border-blue-500 bg-blue-100' : ''}`}
        >
          メモ {isMemoMode ? 'ON' : 'OFF'}
        </button>
      </div>
      <NumberPad onNumberClick={onNumberClick} />
      <button type="button" onClick={onCheck} className={buttonClassName}>
        Check
      </button>
      <button type="button" onClick={onNewGame} className={buttonClassName}>
        New Game
      </button>
    </div>
  )
}
