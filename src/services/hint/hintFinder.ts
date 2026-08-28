const SIZE = 9

type Grid = (number | null)[][]

export type HintTechnique =
  | 'nakedSingle'
  | 'hiddenSingle'
  | 'nakedPair'
  | 'nakedTriple'
  | 'hiddenPair'
  | 'hiddenTriple'
  | 'pointingPair'
  | 'claiming'
  | 'xWing'

export type Position = { row: number; col: number }

export type HintCell = { position: Position; role: 'cause' | 'eliminated' }

export type EliminatedCandidate = { position: Position; value: number }

export type ValueHint = {
  kind: 'value'
  position: Position
  value: number
  technique: 'nakedSingle' | 'hiddenSingle'
  techniqueLabel: string
  reasonText: string
}

export type EliminationTechnique = Exclude<
  HintTechnique,
  'nakedSingle' | 'hiddenSingle'
>

export type EliminationHint = {
  kind: 'elimination'
  technique: EliminationTechnique
  techniqueLabel: string
  reasonText: string
  cells: HintCell[]
  eliminatedCandidates: EliminatedCandidate[]
}

export type Hint = ValueHint | EliminationHint

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

export function findNakedSingle(userValues: Grid, solution: number[][]): ValueHint | null {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (userValues[row][col] !== null) continue
      const candidates = computeCandidates(userValues, row, col)
      if (candidates.length !== 1) continue
      const value = candidates[0]
      if (solution[row][col] !== value) continue
      return {
        kind: 'value',
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

function unitCells(type: UnitType, index: number): Position[] {
  const cells: Position[] = []
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

function blockIndexOf(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3)
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
): ValueHint | null {
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
      kind: 'value',
      position: { row, col },
      value,
      technique: 'hiddenSingle',
      techniqueLabel: UNIT_TECHNIQUE_LABELS[type],
      reasonText: `${UNIT_REASON_LABELS[type]}の中で${value}が入るのはこのマスだけです`,
    }
  }
  return null
}

export function findHiddenSingle(userValues: Grid, solution: number[][]): ValueHint | null {
  const unitTypes: UnitType[] = ['row', 'column', 'block']
  for (const type of unitTypes) {
    for (let index = 0; index < SIZE; index++) {
      const hint = findHiddenSingleInUnit(userValues, solution, type, index)
      if (hint !== null) return hint
    }
  }
  return null
}

// --- 候補絞り込み系（消去型）ヒントの共通ユーティリティ ---

type EmptyCellWithCandidates = { row: number; col: number; candidates: number[] }

function unitEmptyCellsWithCandidates(
  grid: Grid,
  type: UnitType,
  index: number,
): EmptyCellWithCandidates[] {
  return unitCells(type, index)
    .filter(({ row, col }) => grid[row][col] === null)
    .map(({ row, col }) => ({ row, col, candidates: computeCandidates(grid, row, col) }))
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]]
  if (items.length < size) return []
  const [first, ...rest] = items
  const withFirst = combinations(rest, size - 1).map((combo) => [first, ...combo])
  const withoutFirst = combinations(rest, size)
  return [...withFirst, ...withoutFirst]
}

function posKey(position: Position): string {
  return `${position.row}-${position.col}`
}

function dedupPositions(positions: Position[]): Position[] {
  const seen = new Set<string>()
  const result: Position[] = []
  for (const position of positions) {
    const key = posKey(position)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(position)
  }
  return result
}

function buildEliminationHint(
  technique: EliminationTechnique,
  techniqueLabel: string,
  reasonText: string,
  causePositions: Position[],
  rawEliminatedCandidates: EliminatedCandidate[],
  solution: number[][],
): EliminationHint | null {
  // ユーザーの誤入力に起因して候補計算が実際の正解と矛盾する場合、
  // 正解の値そのものを誤って消去候補にしてしまうことがあるため除外する。
  const eliminatedCandidates = rawEliminatedCandidates.filter(
    ({ position, value }) => solution[position.row][position.col] !== value,
  )
  if (eliminatedCandidates.length === 0) return null

  const causeKeys = new Set(causePositions.map(posKey))
  const eliminatedPositions = dedupPositions(
    eliminatedCandidates.map((candidate) => candidate.position),
  ).filter((position) => !causeKeys.has(posKey(position)))

  return {
    kind: 'elimination',
    technique,
    techniqueLabel,
    reasonText,
    cells: [
      ...causePositions.map((position) => ({ position, role: 'cause' as const })),
      ...eliminatedPositions.map((position) => ({ position, role: 'eliminated' as const })),
    ],
    eliminatedCandidates,
  }
}

function formatValues(values: number[]): string {
  return [...values].sort((a, b) => a - b).join('・')
}

// --- Naked Pair / Naked Triple ---

const NAKED_SET_LABELS: Record<2 | 3, string> = {
  2: '裸のペア（Naked Pair）',
  3: '裸のトリプル（Naked Triple）',
}

function findNakedSetInUnit(
  grid: Grid,
  solution: number[][],
  type: UnitType,
  index: number,
  size: 2 | 3,
): EliminationHint | null {
  const emptyCells = unitEmptyCellsWithCandidates(grid, type, index)
  const candidateCells = emptyCells.filter(
    (cell) => cell.candidates.length >= 2 && cell.candidates.length <= size,
  )

  for (const group of combinations(candidateCells, size)) {
    const union = new Set<number>()
    group.forEach((cell) => cell.candidates.forEach((value) => union.add(value)))
    if (union.size !== size) continue

    const groupPositions = group.map((cell) => ({ row: cell.row, col: cell.col }))
    const groupKeys = new Set(groupPositions.map(posKey))

    const eliminatedCandidates: EliminatedCandidate[] = []
    for (const other of emptyCells) {
      const position = { row: other.row, col: other.col }
      if (groupKeys.has(posKey(position))) continue
      for (const value of other.candidates) {
        if (union.has(value)) eliminatedCandidates.push({ position, value })
      }
    }

    const hint = buildEliminationHint(
      size === 2 ? 'nakedPair' : 'nakedTriple',
      NAKED_SET_LABELS[size],
      `${UNIT_REASON_LABELS[type]}で${formatValues([...union])}の候補が${size}マスに絞られるため、他のマスからこれらの値の候補を除去できます`,
      groupPositions,
      eliminatedCandidates,
      solution,
    )
    if (hint !== null) return hint
  }
  return null
}

function findFirstAcrossUnits(
  grid: Grid,
  solution: number[][],
  types: UnitType[],
  finder: (grid: Grid, solution: number[][], type: UnitType, index: number) => EliminationHint | null,
): EliminationHint | null {
  for (const type of types) {
    for (let index = 0; index < SIZE; index++) {
      const hint = finder(grid, solution, type, index)
      if (hint !== null) return hint
    }
  }
  return null
}

export function findNakedPair(grid: Grid, solution: number[][]): EliminationHint | null {
  return findFirstAcrossUnits(grid, solution, ['row', 'column', 'block'], (g, s, t, i) =>
    findNakedSetInUnit(g, s, t, i, 2),
  )
}

export function findNakedTriple(grid: Grid, solution: number[][]): EliminationHint | null {
  return findFirstAcrossUnits(grid, solution, ['row', 'column', 'block'], (g, s, t, i) =>
    findNakedSetInUnit(g, s, t, i, 3),
  )
}

// --- Hidden Pair / Hidden Triple ---

const HIDDEN_SET_LABELS: Record<2 | 3, string> = {
  2: '隠れたペア（Hidden Pair）',
  3: '隠れたトリプル（Hidden Triple）',
}

function findHiddenSetInUnit(
  grid: Grid,
  solution: number[][],
  type: UnitType,
  index: number,
  size: 2 | 3,
): EliminationHint | null {
  const emptyCells = unitEmptyCellsWithCandidates(grid, type, index)

  const valuePositions = new Map<number, Position[]>()
  for (let value = 1; value <= SIZE; value++) {
    const positions = emptyCells
      .filter((cell) => cell.candidates.includes(value))
      .map((cell) => ({ row: cell.row, col: cell.col }))
    if (positions.length >= 1 && positions.length <= size) {
      valuePositions.set(value, positions)
    }
  }
  const candidateValues = [...valuePositions.keys()]

  for (const valueGroup of combinations(candidateValues, size)) {
    const unionPositions = dedupPositions(
      valueGroup.flatMap((value) => valuePositions.get(value) ?? []),
    )
    if (unionPositions.length !== size) continue

    const eliminatedCandidates: EliminatedCandidate[] = []
    for (const position of unionPositions) {
      for (const value of computeCandidates(grid, position.row, position.col)) {
        if (!valueGroup.includes(value)) eliminatedCandidates.push({ position, value })
      }
    }

    const hint = buildEliminationHint(
      size === 2 ? 'hiddenPair' : 'hiddenTriple',
      HIDDEN_SET_LABELS[size],
      `${UNIT_REASON_LABELS[type]}で${formatValues(valueGroup)}が入りうるマスがこの${size}マスに絞られるため、これらのマスの他の候補を除去できます`,
      unionPositions,
      eliminatedCandidates,
      solution,
    )
    if (hint !== null) return hint
  }
  return null
}

export function findHiddenPair(grid: Grid, solution: number[][]): EliminationHint | null {
  return findFirstAcrossUnits(grid, solution, ['row', 'column', 'block'], (g, s, t, i) =>
    findHiddenSetInUnit(g, s, t, i, 2),
  )
}

export function findHiddenTriple(grid: Grid, solution: number[][]): EliminationHint | null {
  return findFirstAcrossUnits(grid, solution, ['row', 'column', 'block'], (g, s, t, i) =>
    findHiddenSetInUnit(g, s, t, i, 3),
  )
}

// --- Pointing Pair（ブロック→行・列） ---

function findPointingInBlock(
  grid: Grid,
  solution: number[][],
  blockIndex: number,
): EliminationHint | null {
  const blockCells = unitEmptyCellsWithCandidates(grid, 'block', blockIndex)

  for (let value = 1; value <= SIZE; value++) {
    const withValue = blockCells.filter((cell) => cell.candidates.includes(value))
    if (withValue.length < 2) continue

    const rows = new Set(withValue.map((cell) => cell.row))
    const cols = new Set(withValue.map((cell) => cell.col))

    let outsideCells: EmptyCellWithCandidates[]
    let unitLabel: string
    if (rows.size === 1) {
      const row = [...rows][0]
      outsideCells = unitEmptyCellsWithCandidates(grid, 'row', row).filter(
        (cell) => blockIndexOf(cell.row, cell.col) !== blockIndex,
      )
      unitLabel = 'この行'
    } else if (cols.size === 1) {
      const col = [...cols][0]
      outsideCells = unitEmptyCellsWithCandidates(grid, 'column', col).filter(
        (cell) => blockIndexOf(cell.row, cell.col) !== blockIndex,
      )
      unitLabel = 'この列'
    } else {
      continue
    }

    const eliminatedCandidates: EliminatedCandidate[] = outsideCells
      .filter((cell) => cell.candidates.includes(value))
      .map((cell) => ({ position: { row: cell.row, col: cell.col }, value }))

    const causePositions = withValue.map((cell) => ({ row: cell.row, col: cell.col }))
    const hint = buildEliminationHint(
      'pointingPair',
      'ポインティング（Pointing Pair/Triple）',
      `このブロックの中で${value}が入りうるマスは${unitLabel}に閉じ込められているため、ブロック外の${unitLabel}から${value}の候補を除去できます`,
      causePositions,
      eliminatedCandidates,
      solution,
    )
    if (hint !== null) return hint
  }
  return null
}

export function findPointingPair(grid: Grid, solution: number[][]): EliminationHint | null {
  for (let blockIndex = 0; blockIndex < SIZE; blockIndex++) {
    const hint = findPointingInBlock(grid, solution, blockIndex)
    if (hint !== null) return hint
  }
  return null
}

// --- Claiming（行・列→ブロック、ロックド候補） ---

function findClaimingInUnit(
  grid: Grid,
  solution: number[][],
  type: UnitType,
  index: number,
): EliminationHint | null {
  const unitCellsWithCandidates = unitEmptyCellsWithCandidates(grid, type, index)

  for (let value = 1; value <= SIZE; value++) {
    const withValue = unitCellsWithCandidates.filter((cell) => cell.candidates.includes(value))
    if (withValue.length < 2) continue

    const blocks = new Set(withValue.map((cell) => blockIndexOf(cell.row, cell.col)))
    if (blocks.size !== 1) continue
    const blockIndex = [...blocks][0]

    const eliminatedCandidates = unitEmptyCellsWithCandidates(grid, 'block', blockIndex)
      .filter((cell) => {
        const inUnit = type === 'row' ? cell.row === index : cell.col === index
        return !inUnit && cell.candidates.includes(value)
      })
      .map((cell) => ({ position: { row: cell.row, col: cell.col }, value }))

    const causePositions = withValue.map((cell) => ({ row: cell.row, col: cell.col }))
    const hint = buildEliminationHint(
      'claiming',
      'クレーミング（Claiming）',
      `${UNIT_REASON_LABELS[type]}の中で${value}が入りうるマスは同じブロックに閉じ込められているため、そのブロックの他のマスから${value}の候補を除去できます`,
      causePositions,
      eliminatedCandidates,
      solution,
    )
    if (hint !== null) return hint
  }
  return null
}

export function findClaiming(grid: Grid, solution: number[][]): EliminationHint | null {
  return findFirstAcrossUnits(grid, solution, ['row', 'column'], findClaimingInUnit)
}

// --- X-Wing ---

function findXWingAlongLines(
  grid: Grid,
  solution: number[][],
  lineType: 'row' | 'column',
): EliminationHint | null {
  const crossType: 'row' | 'column' = lineType === 'row' ? 'column' : 'row'

  for (let value = 1; value <= SIZE; value++) {
    const crossPositionsByLine: number[][] = []
    for (let line = 0; line < SIZE; line++) {
      const positions = unitEmptyCellsWithCandidates(grid, lineType, line)
        .filter((cell) => cell.candidates.includes(value))
        .map((cell) => (lineType === 'row' ? cell.col : cell.row))
      crossPositionsByLine.push(positions)
    }

    for (let line1 = 0; line1 < SIZE; line1++) {
      if (crossPositionsByLine[line1].length !== 2) continue
      for (let line2 = line1 + 1; line2 < SIZE; line2++) {
        if (crossPositionsByLine[line2].length !== 2) continue
        const [cross1, cross2] = crossPositionsByLine[line1]
        if (
          !crossPositionsByLine[line2].includes(cross1) ||
          !crossPositionsByLine[line2].includes(cross2)
        ) {
          continue
        }

        const eliminatedCandidates: EliminatedCandidate[] = []
        for (const cross of [cross1, cross2]) {
          unitEmptyCellsWithCandidates(grid, crossType, cross)
            .filter((cell) => {
              const line = lineType === 'row' ? cell.row : cell.col
              return line !== line1 && line !== line2 && cell.candidates.includes(value)
            })
            .forEach((cell) => {
              eliminatedCandidates.push({ position: { row: cell.row, col: cell.col }, value })
            })
        }

        const toPosition = (line: number, cross: number): Position =>
          lineType === 'row' ? { row: line, col: cross } : { row: cross, col: line }

        const causePositions = [
          toPosition(line1, cross1),
          toPosition(line1, cross2),
          toPosition(line2, cross1),
          toPosition(line2, cross2),
        ]

        const lineLabel = lineType === 'row' ? '行' : '列'
        const crossLabel = crossType === 'row' ? '行' : '列'
        const hint = buildEliminationHint(
          'xWing',
          'X-Wing',
          `2つの${lineLabel}で${value}の候補が同じ2つの${crossLabel}に絞られるため、他の${crossLabel}のマスから${value}の候補を除去できます`,
          causePositions,
          eliminatedCandidates,
          solution,
        )
        if (hint !== null) return hint
      }
    }
  }
  return null
}

export function findXWing(grid: Grid, solution: number[][]): EliminationHint | null {
  return findXWingAlongLines(grid, solution, 'row') ?? findXWingAlongLines(grid, solution, 'column')
}

export function findHint(userValues: Grid, solution: number[][]): Hint | null {
  return (
    findNakedSingle(userValues, solution) ??
    findHiddenSingle(userValues, solution) ??
    findNakedPair(userValues, solution) ??
    findHiddenPair(userValues, solution) ??
    findPointingPair(userValues, solution) ??
    findClaiming(userValues, solution) ??
    findNakedTriple(userValues, solution) ??
    findHiddenTriple(userValues, solution) ??
    findXWing(userValues, solution)
  )
}
