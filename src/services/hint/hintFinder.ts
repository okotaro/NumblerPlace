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
  | 'xyWing'
  | 'xyzWing'
  | 'uniqueRectangleType1'
  | 'uniqueRectangleType2'

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

function samePos(a: Pos, b: Pos): boolean {
  return a.row === b.row && a.col === b.col
}

function cellsSee(a: Pos, b: Pos): boolean {
  if (samePos(a, b)) return false
  return a.row === b.row || a.col === b.col || blockIndexOf(a.row, a.col) === blockIndexOf(b.row, b.col)
}

function emptyCells(grid: Grid): Pos[] {
  const cells: Pos[] = []
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (grid[row][col] === null) cells.push({ row, col })
    }
  }
  return cells
}

export function findXYWing(candidatesGrid: number[][][], grid: Grid): EliminationHint | null {
  const cells = emptyCells(grid)

  for (const pivot of cells) {
    const pivotCandidates = candidatesGrid[pivot.row][pivot.col]
    if (pivotCandidates.length !== 2) continue
    const [x, y] = pivotCandidates

    const neighbors = cells.filter(
      (c) => cellsSee(c, pivot) && candidatesGrid[c.row][c.col].length === 2,
    )

    for (const w1 of neighbors) {
      const w1Candidates = candidatesGrid[w1.row][w1.col]
      const sharedWithPivot = w1Candidates.filter((v) => pivotCandidates.includes(v))
      if (sharedWithPivot.length !== 1) continue
      const sharedValue = sharedWithPivot[0]
      const otherPivotValue = sharedValue === x ? y : x
      const z = w1Candidates.find((v) => v !== sharedValue)
      if (z === undefined || z === x || z === y) continue

      for (const w2 of neighbors) {
        if (samePos(w2, w1)) continue
        const w2Candidates = candidatesGrid[w2.row][w2.col]
        if (!(w2Candidates.includes(otherPivotValue) && w2Candidates.includes(z))) continue

        const eliminatedCandidates: EliminatedCandidate[] = cells
          .filter(
            (c) =>
              !samePos(c, pivot) &&
              !samePos(c, w1) &&
              !samePos(c, w2) &&
              cellsSee(c, w1) &&
              cellsSee(c, w2) &&
              candidatesGrid[c.row][c.col].includes(z),
          )
          .map((c) => ({ position: c, value: z }))
        if (eliminatedCandidates.length === 0) continue

        return {
          kind: 'elimination',
          technique: 'xyWing',
          techniqueLabel: 'XYウイング（XY-Wing）',
          reasonText: `軸マスの候補${x}・${y}と、それぞれを共有する2マスの候補${z}から、両方を見ているマスの候補${z}を除去できます。${NEXT_HINT_GUIDE}`,
          cells: buildHintCells([pivot, w1, w2], eliminatedCandidates),
          eliminatedCandidates,
        }
      }
    }
  }
  return null
}

export function findXYZWing(candidatesGrid: number[][][], grid: Grid): EliminationHint | null {
  const cells = emptyCells(grid)

  for (const pivot of cells) {
    const pivotCandidates = candidatesGrid[pivot.row][pivot.col]
    if (pivotCandidates.length !== 3) continue

    const neighbors = cells.filter(
      (c) =>
        cellsSee(c, pivot) &&
        candidatesGrid[c.row][c.col].length === 2 &&
        candidatesGrid[c.row][c.col].every((v) => pivotCandidates.includes(v)),
    )

    for (const w1 of neighbors) {
      const w1Candidates = candidatesGrid[w1.row][w1.col]
      for (const w2 of neighbors) {
        if (samePos(w2, w1)) continue
        const w2Candidates = candidatesGrid[w2.row][w2.col]

        const union = new Set([...w1Candidates, ...w2Candidates])
        if (union.size !== 3) continue
        const intersection = w1Candidates.filter((v) => w2Candidates.includes(v))
        if (intersection.length !== 1) continue
        const z = intersection[0]

        const eliminatedCandidates: EliminatedCandidate[] = cells
          .filter(
            (c) =>
              !samePos(c, pivot) &&
              !samePos(c, w1) &&
              !samePos(c, w2) &&
              cellsSee(c, pivot) &&
              cellsSee(c, w1) &&
              cellsSee(c, w2) &&
              candidatesGrid[c.row][c.col].includes(z),
          )
          .map((c) => ({ position: c, value: z }))
        if (eliminatedCandidates.length === 0) continue

        return {
          kind: 'elimination',
          technique: 'xyzWing',
          techniqueLabel: 'XYZウイング（XYZ-Wing）',
          reasonText: `軸マスの候補${pivotCandidates.join('・')}と、それぞれを共有する2マスの候補${z}から、軸マス・両マスすべてを見ているマスの候補${z}を除去できます。${NEXT_HINT_GUIDE}`,
          cells: buildHintCells([pivot, w1, w2], eliminatedCandidates),
          eliminatedCandidates,
        }
      }
    }
  }
  return null
}

function isUniqueRectangleSpan(r1: number, r2: number, c1: number, c2: number): boolean {
  const sameRowBlock = Math.floor(r1 / 3) === Math.floor(r2 / 3)
  const sameColBlock = Math.floor(c1 / 3) === Math.floor(c2 / 3)
  return sameRowBlock !== sameColBlock
}

function uniqueRectangleCorners(grid: Grid): Pos[][] {
  const rectangles: Pos[][] = []
  for (let r1 = 0; r1 < SIZE; r1++) {
    for (let r2 = r1 + 1; r2 < SIZE; r2++) {
      for (let c1 = 0; c1 < SIZE; c1++) {
        for (let c2 = c1 + 1; c2 < SIZE; c2++) {
          if (!isUniqueRectangleSpan(r1, r2, c1, c2)) continue
          const cells: Pos[] = [
            { row: r1, col: c1 },
            { row: r1, col: c2 },
            { row: r2, col: c1 },
            { row: r2, col: c2 },
          ]
          if (cells.some(({ row, col }) => grid[row][col] !== null)) continue
          rectangles.push(cells)
        }
      }
    }
  }
  return rectangles
}

export function findUniqueRectangleType1(candidatesGrid: number[][][], grid: Grid): EliminationHint | null {
  for (const cells of uniqueRectangleCorners(grid)) {
    const candidateSets = cells.map(({ row, col }) => candidatesGrid[row][col])

    for (let i = 0; i < 4; i++) {
      const others = candidateSets.filter((_, idx) => idx !== i)
      if (others.some((c) => c.length !== 2)) continue
      const [a, b] = others[0]
      if (others.some((c) => !(c.includes(a) && c.includes(b)))) continue

      const extra = candidateSets[i]
      if (!(extra.length > 2 && extra.includes(a) && extra.includes(b))) continue

      const extraCell = cells[i]
      const causeCells = cells.filter((_, idx) => idx !== i)
      const eliminatedCandidates: EliminatedCandidate[] = [
        { position: extraCell, value: a },
        { position: extraCell, value: b },
      ]

      return {
        kind: 'elimination',
        technique: 'uniqueRectangleType1',
        techniqueLabel: 'ユニークレクタングル タイプ1（Unique Rectangle Type 1）',
        reasonText: `4マスの長方形のうち3マスの候補が${a}・${b}のみで、残り1マスも同じ2値を含んでいます。一意な解を保つため、残り1マスから候補${a}・${b}を除去できます。${NEXT_HINT_GUIDE}`,
        cells: buildHintCells(causeCells, eliminatedCandidates),
        eliminatedCandidates,
      }
    }
  }
  return null
}

const UNIQUE_RECTANGLE_FLOOR_INDEX_PAIRS: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
]

export function findUniqueRectangleType2(candidatesGrid: number[][][], grid: Grid): EliminationHint | null {
  const allCells = emptyCells(grid)

  for (const cells of uniqueRectangleCorners(grid)) {
    const candidateSets = cells.map(({ row, col }) => candidatesGrid[row][col])

    for (const floorIdx of UNIQUE_RECTANGLE_FLOOR_INDEX_PAIRS) {
      const roofIdx = [0, 1, 2, 3].filter((idx) => !floorIdx.includes(idx))
      const floorSets = floorIdx.map((idx) => candidateSets[idx])
      if (floorSets.some((c) => c.length !== 2)) continue
      const [a, b] = floorSets[0]
      if (floorSets.some((c) => !(c.includes(a) && c.includes(b)))) continue

      const roofSets = roofIdx.map((idx) => candidateSets[idx])
      if (roofSets.some((c) => c.length !== 3 || !(c.includes(a) && c.includes(b)))) continue

      const roofExtras = roofSets.map((c) => c.find((v) => v !== a && v !== b))
      const value = roofExtras[0]
      if (value === undefined || roofExtras[1] !== value) continue

      const roofCells = roofIdx.map((idx) => cells[idx])
      const eliminatedCandidates: EliminatedCandidate[] = allCells
        .filter(
          (pos) =>
            !cells.some((c) => samePos(c, pos)) &&
            roofCells.every((roofCell) => cellsSee(pos, roofCell)) &&
            candidatesGrid[pos.row][pos.col].includes(value),
        )
        .map((pos) => ({ position: pos, value }))
      if (eliminatedCandidates.length === 0) continue

      return {
        kind: 'elimination',
        technique: 'uniqueRectangleType2',
        techniqueLabel: 'ユニークレクタングル タイプ2（Unique Rectangle Type 2）',
        reasonText: `4マスの長方形のうち2マスの候補が${a}・${b}のみで、残り2マスの候補が${a}・${b}・${value}です。一意な解を保つため、残り2マスを共に見ているマスから候補${value}を除去できます。${NEXT_HINT_GUIDE}`,
        cells: buildHintCells(cells, eliminatedCandidates),
        eliminatedCandidates,
      }
    }
  }
  return null
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
    findJellyfish(candidatesGrid, userValues) ??
    findXYWing(candidatesGrid, userValues) ??
    findXYZWing(candidatesGrid, userValues) ??
    findUniqueRectangleType1(candidatesGrid, userValues) ??
    findUniqueRectangleType2(candidatesGrid, userValues)
  )
}
