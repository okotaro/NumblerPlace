const SIZE = 9

type Grid = (number | null)[][]

export type HintTechnique = 'nakedSingle' | 'hiddenSingle'

export type Hint = {
  position: { row: number; col: number }
  value: number
  technique: HintTechnique
  techniqueLabel: string
  reasonText: string
}

type UnitType = 'row' | 'column' | 'block'

function computeCandidates(grid: Grid, row: number, col: number): number[] {
  if (grid[row][col] !== null) return []

  const used = new Set<number>()
  for (let i = 0; i < SIZE; i++) {
    const rowValue = grid[row][i]
    if (rowValue !== null) used.add(rowValue)
    const colValue = grid[i][col]
    if (colValue !== null) used.add(colValue)
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const value = grid[boxRow + r][boxCol + c]
      if (value !== null) used.add(value)
    }
  }

  const candidates: number[] = []
  for (let value = 1; value <= SIZE; value++) {
    if (!used.has(value)) candidates.push(value)
  }
  return candidates
}

export function findNakedSingle(userValues: Grid, solution: number[][]): Hint | null {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (userValues[row][col] !== null) continue
      const candidates = computeCandidates(userValues, row, col)
      if (candidates.length !== 1) continue
      const value = candidates[0]
      if (solution[row][col] !== value) continue
      return {
        position: { row, col },
        value,
        technique: 'nakedSingle',
        techniqueLabel: '単一候補（Naked Single）',
        reasonText: `このマスは候補が${value}の1つだけに絞られます`,
      }
    }
  }
  return null
}

function unitCells(type: UnitType, index: number): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = []
  if (type === 'row') {
    for (let col = 0; col < SIZE; col++) cells.push({ row: index, col })
  } else if (type === 'column') {
    for (let row = 0; row < SIZE; row++) cells.push({ row, col: index })
  } else {
    const boxRow = Math.floor(index / 3) * 3
    const boxCol = (index % 3) * 3
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) cells.push({ row: boxRow + r, col: boxCol + c })
    }
  }
  return cells
}

const UNIT_TECHNIQUE_LABELS: Record<UnitType, string> = {
  row: '行内消去（Hidden Single）',
  column: '列内消去（Hidden Single）',
  block: 'ブロック内消去（Hidden Single）',
}

const UNIT_REASON_LABELS: Record<UnitType, string> = {
  row: 'この行',
  column: 'この列',
  block: 'このブロック',
}

export function findHiddenSingleInUnit(
  userValues: Grid,
  solution: number[][],
  type: UnitType,
  index: number,
): Hint | null {
  const cells = unitCells(type, index)
  for (let value = 1; value <= SIZE; value++) {
    const candidateCells = cells.filter(
      ({ row, col }) =>
        userValues[row][col] === null &&
        computeCandidates(userValues, row, col).includes(value),
    )
    if (candidateCells.length !== 1) continue
    const { row, col } = candidateCells[0]
    if (solution[row][col] !== value) continue
    return {
      position: { row, col },
      value,
      technique: 'hiddenSingle',
      techniqueLabel: UNIT_TECHNIQUE_LABELS[type],
      reasonText: `${UNIT_REASON_LABELS[type]}の中で${value}が入るのはこのマスだけです`,
    }
  }
  return null
}

export function findHiddenSingle(userValues: Grid, solution: number[][]): Hint | null {
  const unitTypes: UnitType[] = ['row', 'column', 'block']
  for (const type of unitTypes) {
    for (let index = 0; index < SIZE; index++) {
      const hint = findHiddenSingleInUnit(userValues, solution, type, index)
      if (hint !== null) return hint
    }
  }
  return null
}

export function findHint(userValues: Grid, solution: number[][]): Hint | null {
  return findNakedSingle(userValues, solution) ?? findHiddenSingle(userValues, solution)
}
