const SIZE = 9

type Grid = (number | null)[][]

type MemoMark = 'none' | 'candidate' | 'notCandidate'
export type MemoGrid = Record<number, MemoMark>[][]

type Pos = { row: number; col: number }

export type HintTechnique =
  | 'nakedSingle'
  | 'hiddenSingle'
  | 'nakedPair'
  | 'nakedTriple'
  | 'nakedQuad'
  | 'hiddenPair'
  | 'hiddenTriple'
  | 'hiddenQuad'
  | 'pointingPair'
  | 'claiming'
  | 'xWing'
  | 'swordfish'
  | 'jellyfish'

export type HintCell = { position: Pos; role: 'cause' | 'eliminated' }
export type EliminatedCandidate = { position: Pos; value: number }

export type ValueHint = {
  kind: 'value'
  position: Pos
  value: number
  technique: 'nakedSingle' | 'hiddenSingle'
  techniqueLabel: string
  reasonText: string
}

export type EliminationHint = {
  kind: 'elimination'
  technique: Exclude<HintTechnique, 'nakedSingle' | 'hiddenSingle'>
  techniqueLabel: string
  reasonText: string
  cells: HintCell[]
  eliminatedCandidates: EliminatedCandidate[]
}

export type Hint = ValueHint | EliminationHint

type UnitType = 'row' | 'column' | 'block'

const NEXT_HINT_GUIDE =
  '除去できるマスの非候補メモに反映すると、次のヒントに進めます。'

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

function unitCells(type: UnitType, index: number): Pos[] {
  const cells: Pos[] = []
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

function computeEffectiveCandidates(grid: Grid, memos: MemoGrid | undefined, row: number, col: number): number[] {
  const base = computeCandidates(grid, row, col)
  if (!memos) return base
  return base.filter((value) => memos[row][col]?.[value] !== 'notCandidate')
}

function buildCandidatesGrid(grid: Grid, memos?: MemoGrid): number[][][] {
  const result: number[][][] = []
  for (let row = 0; row < SIZE; row++) {
    result.push([])
    for (let col = 0; col < SIZE; col++) {
      result[row].push(computeEffectiveCandidates(grid, memos, row, col))
    }
  }
  return result
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]]
  if (items.length < size) return []
  const [first, ...rest] = items
  const withFirst = combinations(rest, size - 1).map((c) => [first, ...c])
  const withoutFirst = combinations(rest, size)
  return [...withFirst, ...withoutFirst]
}

function positionKey(position: Pos): string {
  return `${position.row}-${position.col}`
}

function buildHintCells(causeCells: Pos[], eliminatedCandidates: EliminatedCandidate[]): HintCell[] {
  const cause: HintCell[] = causeCells.map((position) => ({ position, role: 'cause' }))
  const causeKeys = new Set(causeCells.map(positionKey))
  const eliminated: HintCell[] = []
  const seen = new Set<string>()
  for (const candidate of eliminatedCandidates) {
    const key = positionKey(candidate.position)
    if (causeKeys.has(key) || seen.has(key)) continue
    seen.add(key)
    eliminated.push({ position: candidate.position, role: 'eliminated' })
  }
  return [...cause, ...eliminated]
}

const UNIT_TYPES: UnitType[] = ['row', 'column', 'block']

const NAKED_SUBSET_LABELS: Record<
  2 | 3 | 4,
  { technique: 'nakedPair' | 'nakedTriple' | 'nakedQuad'; label: string }
> = {
  2: { technique: 'nakedPair', label: 'ネイキッドペア（Naked Pair）' },
  3: { technique: 'nakedTriple', label: 'ネイキッドトリプル（Naked Triple）' },
  4: { technique: 'nakedQuad', label: 'ネイキッドクアッド（Naked Quad）' },
}

export function findNakedSubset(candidatesGrid: number[][][], grid: Grid, size: 2 | 3 | 4): EliminationHint | null {
  const { technique, label } = NAKED_SUBSET_LABELS[size]

  for (const type of UNIT_TYPES) {
    for (let index = 0; index < SIZE; index++) {
      const cells = unitCells(type, index).filter(
        ({ row, col }) =>
          grid[row][col] === null &&
          candidatesGrid[row][col].length >= 2 &&
          candidatesGrid[row][col].length <= size,
      )

      for (const subset of combinations(cells, size)) {
        const union = new Set<number>()
        subset.forEach(({ row, col }) => candidatesGrid[row][col].forEach((value) => union.add(value)))
        if (union.size !== size) continue

        const otherCells = unitCells(type, index).filter(
          ({ row, col }) =>
            grid[row][col] === null && !subset.some((s) => s.row === row && s.col === col),
        )
        const eliminatedCandidates: EliminatedCandidate[] = []
        for (const { row, col } of otherCells) {
          for (const value of candidatesGrid[row][col]) {
            if (union.has(value)) eliminatedCandidates.push({ position: { row, col }, value })
          }
        }
        if (eliminatedCandidates.length === 0) continue

        const values = Array.from(union).sort((a, b) => a - b).join('・')
        return {
          kind: 'elimination',
          technique,
          techniqueLabel: label,
          reasonText: `${UNIT_REASON_LABELS[type]}の${subset.length}マスは候補が${values}に限定されるため、${UNIT_REASON_LABELS[type]}の他のマスから${values}を候補から除去できます。${NEXT_HINT_GUIDE}`,
          cells: buildHintCells(subset, eliminatedCandidates),
          eliminatedCandidates,
        }
      }
    }
  }
  return null
}

const HIDDEN_SUBSET_LABELS: Record<
  2 | 3 | 4,
  { technique: 'hiddenPair' | 'hiddenTriple' | 'hiddenQuad'; label: string }
> = {
  2: { technique: 'hiddenPair', label: 'ハイデンペア（Hidden Pair）' },
  3: { technique: 'hiddenTriple', label: 'ハイデントリプル（Hidden Triple）' },
  4: { technique: 'hiddenQuad', label: 'ハイデンクアッド（Hidden Quad）' },
}

export function findHiddenSubset(candidatesGrid: number[][][], grid: Grid, size: 2 | 3 | 4): EliminationHint | null {
  const { technique, label } = HIDDEN_SUBSET_LABELS[size]

  for (const type of UNIT_TYPES) {
    for (let index = 0; index < SIZE; index++) {
      const cells = unitCells(type, index).filter(({ row, col }) => grid[row][col] === null)
      const valuesPresent = Array.from({ length: SIZE }, (_, i) => i + 1).filter((value) =>
        cells.some(({ row, col }) => candidatesGrid[row][col].includes(value)),
      )

      for (const valueSet of combinations(valuesPresent, size)) {
        const cellsWithAny = cells.filter(({ row, col }) =>
          valueSet.some((value) => candidatesGrid[row][col].includes(value)),
        )
        if (cellsWithAny.length !== size) continue

        const eliminatedCandidates: EliminatedCandidate[] = []
        for (const { row, col } of cellsWithAny) {
          for (const value of candidatesGrid[row][col]) {
            if (!valueSet.includes(value)) eliminatedCandidates.push({ position: { row, col }, value })
          }
        }
        if (eliminatedCandidates.length === 0) continue

        const values = [...valueSet].sort((a, b) => a - b).join('・')
        return {
          kind: 'elimination',
          technique,
          techniqueLabel: label,
          reasonText: `${UNIT_REASON_LABELS[type]}の中で${values}が入るのはこの${cellsWithAny.length}マスだけなので、このマス自身の他の候補を除去できます。${NEXT_HINT_GUIDE}`,
          cells: buildHintCells(cellsWithAny, eliminatedCandidates),
          eliminatedCandidates,
        }
      }
    }
  }
  return null
}

export function findPointingPair(candidatesGrid: number[][][], grid: Grid): EliminationHint | null {
  for (let block = 0; block < SIZE; block++) {
    const cellsInBlock = unitCells('block', block).filter(({ row, col }) => grid[row][col] === null)

    for (let value = 1; value <= SIZE; value++) {
      const withValue = cellsInBlock.filter(({ row, col }) => candidatesGrid[row][col].includes(value))
      if (withValue.length < 2) continue

      const rows = new Set(withValue.map((c) => c.row))
      if (rows.size === 1) {
        const row = withValue[0].row
        const eliminatedCandidates = unitCells('row', row)
          .filter(
            ({ row: r, col }) =>
              grid[r][col] === null && blockIndexOf(r, col) !== block && candidatesGrid[r][col].includes(value),
          )
          .map(({ row: r, col }) => ({ position: { row: r, col }, value }))
        if (eliminatedCandidates.length > 0) {
          return {
            kind: 'elimination',
            technique: 'pointingPair',
            techniqueLabel: 'ポインティングペア（Pointing Pair）',
            reasonText: `このブロックの中で${value}が入るのは行${row + 1}の中だけなので、同じ行の他のブロックから${value}を候補から除去できます。${NEXT_HINT_GUIDE}`,
            cells: buildHintCells(withValue, eliminatedCandidates),
            eliminatedCandidates,
          }
        }
      }

      const cols = new Set(withValue.map((c) => c.col))
      if (cols.size === 1) {
        const col = withValue[0].col
        const eliminatedCandidates = unitCells('column', col)
          .filter(
            ({ row: r, col: c }) =>
              grid[r][c] === null && blockIndexOf(r, c) !== block && candidatesGrid[r][c].includes(value),
          )
          .map(({ row: r, col: c }) => ({ position: { row: r, col: c }, value }))
        if (eliminatedCandidates.length > 0) {
          return {
            kind: 'elimination',
            technique: 'pointingPair',
            techniqueLabel: 'ポインティングペア（Pointing Pair）',
            reasonText: `このブロックの中で${value}が入るのは列${col + 1}の中だけなので、同じ列の他のブロックから${value}を候補から除去できます。${NEXT_HINT_GUIDE}`,
            cells: buildHintCells(withValue, eliminatedCandidates),
            eliminatedCandidates,
          }
        }
      }
    }
  }
  return null
}

export function findClaiming(candidatesGrid: number[][][], grid: Grid): EliminationHint | null {
  const lineTypes: UnitType[] = ['row', 'column']
  for (const type of lineTypes) {
    for (let index = 0; index < SIZE; index++) {
      const cellsInLine = unitCells(type, index).filter(({ row, col }) => grid[row][col] === null)

      for (let value = 1; value <= SIZE; value++) {
        const withValue = cellsInLine.filter(({ row, col }) => candidatesGrid[row][col].includes(value))
        if (withValue.length < 2) continue

        const blocks = new Set(withValue.map((c) => blockIndexOf(c.row, c.col)))
        if (blocks.size !== 1) continue
        const block = blockIndexOf(withValue[0].row, withValue[0].col)

        const eliminatedCandidates = unitCells('block', block)
          .filter(
            ({ row, col }) =>
              grid[row][col] === null &&
              !(type === 'row' ? row === index : col === index) &&
              candidatesGrid[row][col].includes(value),
          )
          .map(({ row, col }) => ({ position: { row, col }, value }))
        if (eliminatedCandidates.length === 0) continue

        const lineLabel = type === 'row' ? `行${index + 1}` : `列${index + 1}`
        return {
          kind: 'elimination',
          technique: 'claiming',
          techniqueLabel: 'クレーミング（Claiming）',
          reasonText: `${lineLabel}の中で${value}が入るのは同じブロックの中だけなので、そのブロックの他のマスから${value}を候補から除去できます。${NEXT_HINT_GUIDE}`,
          cells: buildHintCells(withValue, eliminatedCandidates),
          eliminatedCandidates,
        }
      }
    }
  }
  return null
}

const FISH_LABELS: Record<2 | 3 | 4, { technique: 'xWing' | 'swordfish' | 'jellyfish'; label: string }> = {
  2: { technique: 'xWing', label: 'エックスウィング（X-Wing）' },
  3: { technique: 'swordfish', label: 'スワードフィッシュ（Swordfish）' },
  4: { technique: 'jellyfish', label: 'ジェリーフィッシュ（Jellyfish）' },
}

function findFish(candidatesGrid: number[][][], grid: Grid, size: 2 | 3 | 4): EliminationHint | null {
  const { technique, label } = FISH_LABELS[size]
  const primaryTypes: UnitType[] = ['row', 'column']

  for (const primary of primaryTypes) {
    const secondary: UnitType = primary === 'row' ? 'column' : 'row'

    for (let value = 1; value <= SIZE; value++) {
      const positionsByIndex: number[][] = []
      for (let i = 0; i < SIZE; i++) {
        const cells = unitCells(primary, i).filter(
          ({ row, col }) => grid[row][col] === null && candidatesGrid[row][col].includes(value),
        )
        positionsByIndex[i] = cells.map((c) => (primary === 'row' ? c.col : c.row))
      }

      const candidateLines: number[] = []
      for (let i = 0; i < SIZE; i++) {
        if (positionsByIndex[i].length >= 2 && positionsByIndex[i].length <= size) candidateLines.push(i)
      }

      for (const combo of combinations(candidateLines, size)) {
        const union = new Set<number>()
        combo.forEach((i) => positionsByIndex[i].forEach((s) => union.add(s)))
        if (union.size !== size) continue

        const causeCells: Pos[] = combo.flatMap((i) =>
          positionsByIndex[i].map((s) => (primary === 'row' ? { row: i, col: s } : { row: s, col: i })),
        )

        const eliminatedCandidates: EliminatedCandidate[] = []
        for (const s of union) {
          const cells = unitCells(secondary, s).filter(({ row, col }) => {
            if (grid[row][col] !== null) return false
            const primaryIndex = primary === 'row' ? row : col
            if (combo.includes(primaryIndex)) return false
            return candidatesGrid[row][col].includes(value)
          })
          cells.forEach(({ row, col }) => eliminatedCandidates.push({ position: { row, col }, value }))
        }
        if (eliminatedCandidates.length === 0) continue

        const primaryLabel = primary === 'row' ? '行' : '列'
        const secondaryLabel = secondary === 'row' ? '行' : '列'
        const primaryLines = combo.map((i) => `${primaryLabel}${i + 1}`).join('と')
        const secondaryLines = Array.from(union)
          .sort((a, b) => a - b)
          .map((s) => `${secondaryLabel}${s + 1}`)
          .join('・')
        return {
          kind: 'elimination',
          technique,
          techniqueLabel: label,
          reasonText: `${primaryLines}で、${value}が入るのは同じ${size}つの${secondaryLabel}（${secondaryLines}）だけなので、その${secondaryLabel}の他のマスから${value}を候補から除去できます。${NEXT_HINT_GUIDE}`,
          cells: buildHintCells(causeCells, eliminatedCandidates),
          eliminatedCandidates,
        }
      }
    }
  }
  return null
}

export function findXWing(candidatesGrid: number[][][], grid: Grid): EliminationHint | null {
  return findFish(candidatesGrid, grid, 2)
}

export function findSwordfish(candidatesGrid: number[][][], grid: Grid): EliminationHint | null {
  return findFish(candidatesGrid, grid, 3)
}

export function findJellyfish(candidatesGrid: number[][][], grid: Grid): EliminationHint | null {
  return findFish(candidatesGrid, grid, 4)
}

export function findHint(userValues: Grid, solution: number[][], memos?: MemoGrid): Hint | null {
  const nakedSingle = findNakedSingle(userValues, solution)
  if (nakedSingle !== null) return nakedSingle

  const hiddenSingle = findHiddenSingle(userValues, solution)
  if (hiddenSingle !== null) return hiddenSingle

  const candidatesGrid = buildCandidatesGrid(userValues, memos)

  return (
    findNakedSubset(candidatesGrid, userValues, 2) ??
    findHiddenSubset(candidatesGrid, userValues, 2) ??
    findPointingPair(candidatesGrid, userValues) ??
    findClaiming(candidatesGrid, userValues) ??
    findNakedSubset(candidatesGrid, userValues, 3) ??
    findHiddenSubset(candidatesGrid, userValues, 3) ??
    findNakedSubset(candidatesGrid, userValues, 4) ??
    findHiddenSubset(candidatesGrid, userValues, 4) ??
    findXWing(candidatesGrid, userValues) ??
    findSwordfish(candidatesGrid, userValues) ??
    findJellyfish(candidatesGrid, userValues)
  )
}
