type NumberPadProps = {
  onNumberClick: (n: number) => void
  completedNumbers: number[]
}

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function NumberPad({ onNumberClick, completedNumbers }: NumberPadProps) {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1">
      {NUMBERS.map((n) => {
        const isCompleted = completedNumbers.includes(n)
        return (
          <button
            key={n}
            type="button"
            disabled={isCompleted}
            onClick={() => onNumberClick(n)}
            className={`aspect-square rounded border text-2xl font-bold ${
              isCompleted
                ? 'border-gray-200 bg-gray-100 text-gray-300'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
