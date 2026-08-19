import { DIFFICULTIES, type Difficulty } from '../services/numberPlaceService'

type NewGameModalProps = {
  isOpen: boolean
  difficulty: Difficulty
  onSelectDifficulty: (difficulty: Difficulty) => void
  onConfirm: () => void
  onCancel: () => void
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
  master: 'Master',
}

export function NewGameModal({
  isOpen,
  difficulty,
  onSelectDifficulty,
  onConfirm,
  onCancel,
}: NewGameModalProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 flex items-center justify-center bg-black/50"
    >
      <div className="flex flex-col gap-4 rounded bg-white p-8 shadow-lg">
        <p className="text-lg font-bold text-gray-800">New Game</p>
        <div className="flex flex-col gap-2">
          {DIFFICULTIES.map((value) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="difficulty"
                value={value}
                checked={difficulty === value}
                onChange={() => onSelectDifficulty(value)}
              />
              {DIFFICULTY_LABELS[value]}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            決定
          </button>
        </div>
      </div>
    </div>
  )
}
