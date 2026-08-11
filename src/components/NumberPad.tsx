type NumberPadProps = {
  onNumberClick: (n: number) => void
}

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function NumberPad({ onNumberClick }: NumberPadProps) {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1">
      {NUMBERS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onNumberClick(n)}
          className="aspect-square rounded border border-gray-300 text-lg font-medium hover:bg-gray-100"
        >
          {n}
        </button>
      ))}
    </div>
  )
}
