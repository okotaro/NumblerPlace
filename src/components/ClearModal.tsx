type ClearModalProps = {
  isOpen: boolean
  onNewGame: () => void
}

export function ClearModal({ isOpen, onNewGame }: ClearModalProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 flex items-center justify-center bg-black/50"
    >
      <div className="flex flex-col items-center gap-4 rounded bg-white p-8 text-center shadow-lg">
        <p className="text-xl font-bold text-gray-800">クリアしました！</p>
        <button
          type="button"
          onClick={onNewGame}
          className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
        >
          New Game
        </button>
      </div>
    </div>
  )
}
