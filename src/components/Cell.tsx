import type { Cell as CellType } from '../types'

type CellProps = {
  cell: CellType
  isSelected: boolean
  isRelated: boolean
  isError: boolean
  onSelect: () => void
  className?: string
}

const MEMO_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function Cell({
  cell,
  isSelected,
  isRelated,
  isError,
  onSelect,
  className,
}: CellProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-given={cell.isGiven || undefined}
      data-selected={isSelected || undefined}
      data-related={isRelated || undefined}
      data-error={isError || undefined}
      className={`flex aspect-square w-full items-center justify-center border border-gray-300 text-lg data-[given]:bg-gray-100 data-[given]:font-bold data-[given]:text-gray-700 data-[related]:bg-blue-100 data-[selected]:bg-blue-300 data-[error]:!bg-red-200 ${className ?? ''}`}
    >
      {cell.value !== null ? (
        <span
          className={`text-2xl font-bold ${
            isError
              ? 'text-red-700'
              : cell.isGiven
                ? 'text-gray-700'
                : 'text-blue-700'
          }`}
        >
          {cell.value}
        </span>
      ) : (
        <div className="grid h-full w-full grid-cols-3 grid-rows-3 text-[0.7rem] font-medium leading-none text-gray-500">
          {MEMO_POSITIONS.map((n) => (
            <span key={n} className="flex items-center justify-center">
              {cell.memos[n] === 'candidate' && n}
              {cell.memos[n] === 'notCandidate' && <s>{n}</s>}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
