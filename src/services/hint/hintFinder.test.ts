import { describe, expect, it } from 'vitest'
import {
  findClaiming,
  findHiddenSingleInUnit,
  findHiddenSubset,
  findHint,
  findNakedSingle,
  findNakedSubset,
  findPointingPair,
  findXWing,
  type MemoGrid,
} from './hintFinder'

// 完成済みの妥当な数独盤面（行・列・3x3ブロックすべてに1〜9が重複なく含まれる）。
// 各フィクスチャはこの盤面を正解として、そこから一部マスを空欄・誤入力にして作る。
const SOLUTION: number[][] = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [4, 5, 6, 7, 8, 9, 1, 2, 3],
  [7, 8, 9, 1, 2, 3, 4, 5, 6],
  [2, 3, 4, 5, 6, 7, 8, 9, 1],
  [5, 6, 7, 8, 9, 1, 2, 3, 4],
  [8, 9, 1, 2, 3, 4, 5, 6, 7],
  [3, 4, 5, 6, 7, 8, 9, 1, 2],
  [6, 7, 8, 9, 1, 2, 3, 4, 5],
  [9, 1, 2, 3, 4, 5, 6, 7, 8],
]

function cloneSolution(): number[][] {
  return SOLUTION.map((row) => [...row])
}

function emptyGrid(): (number | null)[][] {
  return Array.from({ length: 9 }, () => Array<number | null>(9).fill(null))
}

function filledGrid(fillValue = 1): (number | null)[][] {
  return Array.from({ length: 9 }, () => Array<number | null>(9).fill(fillValue))
}

function emptyCandidatesGrid(): number[][][] {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [] as number[]))
}

function emptyMemoGrid(): MemoGrid {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => {
      const memo: Record<number, 'none' | 'candidate' | 'notCandidate'> = {}
      for (let n = 1; n <= 9; n++) memo[n] = 'none'
      return memo
    }),
  )
}

describe('hintFinder findNakedSingle', () => {
  it('候補が1つだけに絞られるマスをNaked Singleとして検出する', () => {
    const grid = cloneSolution() as (number | null)[][]
    grid[0][0] = null

    const hint = findNakedSingle(grid, SOLUTION)

    expect(hint).toEqual({
      kind: 'value',
      position: { row: 0, col: 0 },
      value: 1,
      technique: 'nakedSingle',
      techniqueLabel: '単一候補（Naked Single）',
      reasonText: 'このマスは候補が1の1つだけに絞られます',
    })
  })

  it('候補が2つ以上残るマスはNaked Singleとして検出しない', () => {
    expect(findNakedSingle(emptyGrid(), SOLUTION)).toBeNull()
  })

  it('ユーザーの誤入力により偽の単一候補が生じても誤検出せず、その他の正しいNaked Singleを返す', () => {
    const grid = cloneSolution() as (number | null)[][]
    grid[0][0] = null // 正解は1。だが(0,1)の誤入力により候補が偽の{2}のみに絞られる
    grid[0][1] = 1 // 誤入力（正解は2）
    grid[3][0] = null // 正解は2。他マスの誤入力の影響を受けない正しいNaked Single

    const hint = findNakedSingle(grid, SOLUTION)

    expect(hint?.position).toEqual({ row: 3, col: 0 })
    expect(hint?.value).toBe(2)
  })
})

describe('hintFinder findHiddenSingleInUnit', () => {
  const ROW_COLUMN_HIDDEN_SINGLE_GRID: (number | null)[][] = [
    [null, null, 3, 4, 5, 6, 7, null, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [null, 3, 4, 5, 6, 7, 8, 9, 1],
    [5, 6, 7, 8, null, 1, 2, 3, 4],
    [8, 9, 1, 2, 3, 4, 5, 6, 7],
    [3, 4, 5, 6, 7, 8, 9, 1, 2],
    [6, 7, 8, 9, 1, 2, null, 4, 5],
    [9, 1, 2, 3, 4, 5, 6, 7, 8],
  ]

  const BLOCK_HIDDEN_SINGLE_GRID: (number | null)[][] = [
    [1, 2, 3, 4, 5, 6, null, 8, 9],
    [4, 5, 6, null, 8, null, null, 2, 3],
    [7, 8, 9, null, 2, 3, 4, null, 6],
    [2, 3, 4, 5, 6, 7, 8, 9, 1],
    [5, 6, 7, 8, 9, 1, 2, 3, 4],
    [8, 9, 1, 2, 3, 4, 5, 6, 7],
    [3, 4, 5, 6, 7, null, 9, 1, 2],
    [6, 7, 8, 9, 1, 2, 3, 4, 5],
    [9, 1, 2, 3, 4, 5, 6, 7, 8],
  ]

  it('行内で1マスにしか入らない値をHidden Single（行）として検出する', () => {
    const hint = findHiddenSingleInUnit(ROW_COLUMN_HIDDEN_SINGLE_GRID, SOLUTION, 'row', 0)

    expect(hint).toEqual({
      kind: 'value',
      position: { row: 0, col: 0 },
      value: 1,
      technique: 'hiddenSingle',
      techniqueLabel: '行内消去（Hidden Single）',
      reasonText: 'この行の中で1が入るのはこのマスだけです',
    })
  })

  it('列内で1マスにしか入らない値をHidden Single（列）として検出する', () => {
    const hint = findHiddenSingleInUnit(ROW_COLUMN_HIDDEN_SINGLE_GRID, SOLUTION, 'column', 0)

    expect(hint).toEqual({
      kind: 'value',
      position: { row: 0, col: 0 },
      value: 1,
      technique: 'hiddenSingle',
      techniqueLabel: '列内消去（Hidden Single）',
      reasonText: 'この列の中で1が入るのはこのマスだけです',
    })
  })

  it('ブロック内で1マスにしか入らない値をHidden Single（ブロック）として検出する', () => {
    const hint = findHiddenSingleInUnit(BLOCK_HIDDEN_SINGLE_GRID, SOLUTION, 'block', 1)

    expect(hint).toEqual({
      kind: 'value',
      position: { row: 1, col: 3 },
      value: 7,
      technique: 'hiddenSingle',
      techniqueLabel: 'ブロック内消去（Hidden Single）',
      reasonText: 'このブロックの中で7が入るのはこのマスだけです',
    })
  })
})

describe('hintFinder findNakedSubset', () => {
  it('候補が同じ2値に限定される2マスをNaked Pairとして検出し、同じ行の他マスから当該値を除去する', () => {
    const grid = filledGrid()
    grid[0][0] = null
    grid[0][1] = null
    grid[0][2] = null

    const candidatesGrid = emptyCandidatesGrid()
    candidatesGrid[0][0] = [2, 5]
    candidatesGrid[0][1] = [2, 5]
    candidatesGrid[0][2] = [2, 3, 5]

    const hint = findNakedSubset(candidatesGrid, grid, 2)

    expect(hint?.technique).toBe('nakedPair')
    expect(hint?.cells).toEqual(
      expect.arrayContaining([
        { position: { row: 0, col: 0 }, role: 'cause' },
        { position: { row: 0, col: 1 }, role: 'cause' },
        { position: { row: 0, col: 2 }, role: 'eliminated' },
      ]),
    )
    expect(hint?.eliminatedCandidates).toEqual(
      expect.arrayContaining([
        { position: { row: 0, col: 2 }, value: 2 },
        { position: { row: 0, col: 2 }, value: 5 },
      ]),
    )
  })

  it('Naked Pairの条件を満たしても除去先の候補が残っていない場合はnullを返す', () => {
    const grid = filledGrid()
    grid[0][0] = null
    grid[0][1] = null

    const candidatesGrid = emptyCandidatesGrid()
    candidatesGrid[0][0] = [2, 5]
    candidatesGrid[0][1] = [2, 5]

    expect(findNakedSubset(candidatesGrid, grid, 2)).toBeNull()
  })

  it('候補が同じ3値に限定される3マスをNaked Tripleとして検出する', () => {
    const grid = filledGrid()
    grid[0][0] = null
    grid[0][1] = null
    grid[0][2] = null
    grid[0][3] = null

    const candidatesGrid = emptyCandidatesGrid()
    candidatesGrid[0][0] = [1, 2]
    candidatesGrid[0][1] = [2, 3]
    candidatesGrid[0][2] = [1, 3]
    candidatesGrid[0][3] = [1, 2, 3, 4]

    const hint = findNakedSubset(candidatesGrid, grid, 3)

    expect(hint?.technique).toBe('nakedTriple')
    expect(hint?.eliminatedCandidates).toEqual(
      expect.arrayContaining([
        { position: { row: 0, col: 3 }, value: 1 },
        { position: { row: 0, col: 3 }, value: 2 },
        { position: { row: 0, col: 3 }, value: 3 },
      ]),
    )
  })
})

describe('hintFinder findHiddenSubset', () => {
  it('2値が入りうるマスが同じ2マスに限定される場合Hidden Pairとして検出し、そのマス自身の他の候補を除去する', () => {
    const grid = filledGrid()
    grid[0][0] = null
    grid[0][1] = null

    const candidatesGrid = emptyCandidatesGrid()
    candidatesGrid[0][0] = [1, 2, 9]
    candidatesGrid[0][1] = [1, 2]

    const hint = findHiddenSubset(candidatesGrid, grid, 2)

    expect(hint?.technique).toBe('hiddenPair')
    expect(hint?.eliminatedCandidates).toEqual([{ position: { row: 0, col: 0 }, value: 9 }])
  })

  it('Hidden Pairの条件を満たしても除去できる余分な候補がない場合はnullを返す', () => {
    const grid = filledGrid()
    grid[0][0] = null
    grid[0][1] = null

    const candidatesGrid = emptyCandidatesGrid()
    candidatesGrid[0][0] = [1, 2]
    candidatesGrid[0][1] = [1, 2]

    expect(findHiddenSubset(candidatesGrid, grid, 2)).toBeNull()
  })
})

describe('hintFinder findPointingPair', () => {
  it('ブロック内の値がすべて同じ行に含まれる場合、ブロック外の同じ行から除去する', () => {
    const grid = filledGrid()
    grid[0][0] = null
    grid[0][1] = null
    grid[0][4] = null

    const candidatesGrid = emptyCandidatesGrid()
    candidatesGrid[0][0] = [3, 5]
    candidatesGrid[0][1] = [5, 7]
    candidatesGrid[0][4] = [5, 6]

    const hint = findPointingPair(candidatesGrid, grid)

    expect(hint?.technique).toBe('pointingPair')
    expect(hint?.eliminatedCandidates).toEqual([{ position: { row: 0, col: 4 }, value: 5 }])
    expect(hint?.cells).toEqual(
      expect.arrayContaining([
        { position: { row: 0, col: 0 }, role: 'cause' },
        { position: { row: 0, col: 1 }, role: 'cause' },
        { position: { row: 0, col: 4 }, role: 'eliminated' },
      ]),
    )
  })

  it('除去先の候補が残っていない場合はnullを返す', () => {
    const grid = filledGrid()
    grid[0][0] = null
    grid[0][1] = null

    const candidatesGrid = emptyCandidatesGrid()
    candidatesGrid[0][0] = [3, 5]
    candidatesGrid[0][1] = [5, 7]

    expect(findPointingPair(candidatesGrid, grid)).toBeNull()
  })
})

describe('hintFinder findClaiming', () => {
  it('行内の値がすべて同じブロックに含まれる場合、行外の同じブロックから除去する', () => {
    const grid = filledGrid()
    grid[0][0] = null
    grid[0][1] = null
    grid[1][0] = null

    const candidatesGrid = emptyCandidatesGrid()
    candidatesGrid[0][0] = [4, 6]
    candidatesGrid[0][1] = [4, 8]
    candidatesGrid[1][0] = [4, 9]

    const hint = findClaiming(candidatesGrid, grid)

    expect(hint?.technique).toBe('claiming')
    expect(hint?.eliminatedCandidates).toEqual([{ position: { row: 1, col: 0 }, value: 4 }])
  })

  it('除去先の候補が残っていない場合はnullを返す', () => {
    const grid = filledGrid()
    grid[0][0] = null
    grid[0][1] = null

    const candidatesGrid = emptyCandidatesGrid()
    candidatesGrid[0][0] = [4, 6]
    candidatesGrid[0][1] = [4, 8]

    expect(findClaiming(candidatesGrid, grid)).toBeNull()
  })
})

describe('hintFinder findXWing', () => {
  it('2行で候補が同じ2列にのみ現れる場合、その2列の他マスから除去する', () => {
    const grid = filledGrid()
    grid[0][2] = null
    grid[0][6] = null
    grid[3][2] = null
    grid[3][6] = null
    grid[5][2] = null

    const candidatesGrid = emptyCandidatesGrid()
    candidatesGrid[0][2] = [7, 1]
    candidatesGrid[0][6] = [7, 8]
    candidatesGrid[3][2] = [7, 2]
    candidatesGrid[3][6] = [7, 9]
    candidatesGrid[5][2] = [7, 3]

    const hint = findXWing(candidatesGrid, grid)

    expect(hint?.technique).toBe('xWing')
    expect(hint?.eliminatedCandidates).toEqual([{ position: { row: 5, col: 2 }, value: 7 }])
    expect(hint?.cells).toEqual(
      expect.arrayContaining([
        { position: { row: 0, col: 2 }, role: 'cause' },
        { position: { row: 0, col: 6 }, role: 'cause' },
        { position: { row: 3, col: 2 }, role: 'cause' },
        { position: { row: 3, col: 6 }, role: 'cause' },
        { position: { row: 5, col: 2 }, role: 'eliminated' },
      ]),
    )
  })

  it('除去先の候補が残っていない場合はnullを返す', () => {
    const grid = filledGrid()
    grid[0][2] = null
    grid[0][6] = null
    grid[3][2] = null
    grid[3][6] = null

    const candidatesGrid = emptyCandidatesGrid()
    candidatesGrid[0][2] = [7, 1]
    candidatesGrid[0][6] = [7, 8]
    candidatesGrid[3][2] = [7, 2]
    candidatesGrid[3][6] = [7, 9]

    expect(findXWing(candidatesGrid, grid)).toBeNull()
  })
})

describe('hintFinder findHint', () => {
  it('Naked SingleとHidden Singleが両方存在する場合はNaked Singleを優先する', () => {
    const grid: (number | null)[][] = [
      [null, null, 3, 4, 5, 6, 7, null, 9],
      [4, 5, 6, 7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3, 4, 5, 6],
      [null, 3, 4, 5, 6, 7, 8, 9, 1],
      [5, 6, 7, 8, null, 1, 2, 3, 4],
      [8, 9, 1, 2, 3, 4, 5, 6, 7],
      [3, 4, 5, 6, 7, 8, 9, 1, 2],
      [6, 7, 8, 9, 1, 2, null, 4, 5],
      [9, 1, 2, 3, 4, 5, 6, 7, 8],
    ]

    const hint = findHint(grid, SOLUTION)

    expect(hint?.kind).toBe('value')
    expect(hint?.technique).toBe('nakedSingle')
    if (hint?.kind === 'value') {
      expect(hint.position).toEqual({ row: 0, col: 1 })
      expect(hint.value).toBe(2)
    }
  })

  it('Naked Singleが存在せずHidden Singleのみ存在する場合はHidden Singleを返す', () => {
    const grid: (number | null)[][] = [
      [null, null, 3, null, 5, null, null, null, 9],
      [4, null, 6, null, null, null, null, 2, null],
      [null, 8, null, 1, 2, null, null, null, 6],
      [null, 3, null, 5, 6, null, 8, 9, null],
      [null, null, null, null, 9, null, null, null, null],
      [null, null, 1, 2, null, null, 5, 6, 7],
      [null, null, 5, null, 7, null, 9, null, 2],
      [null, 7, null, null, 1, 2, 3, 4, 5],
      [null, null, 2, null, null, 5, null, 7, null],
    ]
    expect(findNakedSingle(grid, SOLUTION)).toBeNull()

    const hint = findHint(grid, SOLUTION)

    expect(hint?.kind).toBe('value')
    expect(hint?.technique).toBe('hiddenSingle')
    if (hint?.kind === 'value') {
      expect(hint.position).toEqual({ row: 1, col: 1 })
      expect(hint.value).toBe(5)
    }
  })

  it('全マス空欄で除去系の技法も含めどれにも該当しない場合はnullを返す', () => {
    expect(findHint(emptyGrid(), SOLUTION)).toBeNull()
  })

  it('全マス入力済みの盤面ではnullを返す', () => {
    expect(findHint(cloneSolution(), SOLUTION)).toBeNull()
  })

  // 単一候補技法を無効化し、除去系技法への配線とmemos反映を検証するためのフィクスチャ。
  // solutionには実在しない値(0)を使い、findNakedSingle/findHiddenSingleが必ずnullを返すようにする。
  const NAKED_PAIR_GRID: (number | null)[][] = [
    [null, null, 3, null, 9, 9, 9, 9, 9],
    [4, 5, 6, 3, 3, 3, 3, 3, 3],
    [7, 8, 9, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3],
  ]
  const DISABLE_SINGLE_SOLUTION: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0))

  it('単一候補技法が存在しない場合、Naked Pairが検出されkind: eliminationで返る', () => {
    const hint = findHint(NAKED_PAIR_GRID, DISABLE_SINGLE_SOLUTION)

    expect(hint?.kind).toBe('elimination')
    if (hint?.kind === 'elimination') {
      expect(hint.technique).toBe('nakedPair')
      expect(hint.eliminatedCandidates).toEqual(
        expect.arrayContaining([
          { position: { row: 0, col: 3 }, value: 1 },
          { position: { row: 0, col: 3 }, value: 2 },
        ]),
      )
    }
  })

  it('非候補メモにより除去先が既にない場合、そのNaked Pairは返らず次の技法に進む（Issue #26のバグ修正）', () => {
    const withoutMemo = findHint(NAKED_PAIR_GRID, DISABLE_SINGLE_SOLUTION)
    expect(withoutMemo?.kind === 'elimination' && withoutMemo.technique).toBe('nakedPair')

    const memos = emptyMemoGrid()
    memos[0][3][1] = 'notCandidate'
    memos[0][3][2] = 'notCandidate'

    const hint = findHint(NAKED_PAIR_GRID, DISABLE_SINGLE_SOLUTION, memos)

    if (hint?.kind === 'elimination') {
      const stillSuggestsSameElimination = hint.eliminatedCandidates.some(
        (c) => c.position.row === 0 && c.position.col === 3 && (c.value === 1 || c.value === 2),
      )
      expect(stillSuggestsSameElimination).toBe(false)
    }
  })
})
