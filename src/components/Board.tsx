import { Cell } from './Cell'
import type { Board as BoardType, Position } from '../types'

type BoardProps = {
  board: BoardType
  selected: Position | null
  errorCells: Position[]
  hintPosition?: Position | null
  onSelectCell: (position: Position) => void
}

function isRelatedCell(position: Position, selected: Position): boolean {
  if (position.row === selected.row && position.col === selected.col) {
    return false
  }
  const sameRow = position.row === selected.row
  const sameCol = position.col === selected.col
  const sameBlock =
    Math.floor(position.row / 3) === Math.floor(selected.row / 3) &&
    Math.floor(position.col / 3) === Math.floor(selected.col / 3)
  return sameRow || sameCol || sameBlock
}

function isSameValueCell(
  position: Position,
  selected: Position,
  board: BoardType,
): boolean {
  if (position.row === selected.row && position.col === selected.col) {
    return false
  }
  const selectedValue = board[selected.row][selected.col].value
  if (selectedValue === null) {
    return false
  }
  return board[position.row][position.col].value === selectedValue
}

function borderClassName(position: Position): string {
  const classes: string[] = []
  if (position.col % 3 === 0 && position.col !== 0) {
    classes.push('border-l-2 border-l-gray-700')
  }
  if (position.row % 3 === 0 && position.row !== 0) {
    classes.push('border-t-2 border-t-gray-700')
  }
  return classes.join(' ')
}

export function Board({
  board,
  selected,
  errorCells,
  hintPosition = null,
  onSelectCell,
}: BoardProps) {
  return (
    <div className="grid aspect-square w-full grid-cols-9 grid-rows-9 border-2 border-gray-700">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const position: Position = { row: rowIndex, col: colIndex }
          const isSelected =
            selected !== null &&
            selected.row === rowIndex &&
            selected.col === colIndex
          const isRelated =
            selected !== null && isRelatedCell(position, selected)
          const isError = errorCells.some(
            (errorPosition) =>
              errorPosition.row === rowIndex && errorPosition.col === colIndex,
          )
          const isSameValue =
            selected !== null && isSameValueCell(position, selected, board)
          const isHint =
            hintPosition !== null &&
            hintPosition.row === rowIndex &&
            hintPosition.col === colIndex

          return (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              isSelected={isSelected}
              isRelated={isRelated}
              isError={isError}
              isSameValue={isSameValue}
              isHint={isHint}
              onSelect={() => onSelectCell(position)}
              className={borderClassName(position)}
            />
          )
        }),
      )}
    </div>
  )
}
