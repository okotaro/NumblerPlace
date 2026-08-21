import { describe, expect, it } from 'vitest'
import { findHiddenSingleInUnit, findHint, findNakedSingle } from './hintFinder'

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

describe('hintFinder findNakedSingle', () => {
  it('候補が1つだけに絞られるマスをNaked Singleとして検出する', () => {
    const grid = cloneSolution() as (number | null)[][]
    grid[0][0] = null

    const hint = findNakedSingle(grid, SOLUTION)

    expect(hint).toEqual({
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
  // 対象マス(0,0)は候補{1,2}が残るためNaked Singleではないが、
  // 行0・列0のいずれで見ても値1が入りうるマスは(0,0)だけになっている。
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

  // 対象マス(1,3)は候補{1,7}が残るためNaked Singleではないが、
  // ブロック1（行0-2・列3-5）の中で値7が入りうるマスは(1,3)だけになっている。
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
      position: { row: 1, col: 3 },
      value: 7,
      technique: 'hiddenSingle',
      techniqueLabel: 'ブロック内消去（Hidden Single）',
      reasonText: 'このブロックの中で7が入るのはこのマスだけです',
    })
  })
})

describe('hintFinder findHint', () => {
  it('Naked SingleとHidden Singleが両方存在する場合はNaked Singleを優先する', () => {
    // このグリッドは(0,0)がHidden Single（行・列）候補である一方、
    // (0,1)は候補が{2}の1つだけに絞られる正しいNaked Singleでもある。
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

    expect(hint?.technique).toBe('nakedSingle')
    expect(hint?.position).toEqual({ row: 0, col: 1 })
    expect(hint?.value).toBe(2)
  })

  it('Naked Singleが存在せずHidden Singleのみ存在する場合はHidden Singleを返す', () => {
    // 空欄が多く、盤面のどのマスにもNaked Single（候補1つ）は存在しないが、
    // 行1の中で値5が入りうるマスは(1,1)だけになっている。
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

    expect(hint?.technique).toBe('hiddenSingle')
    expect(hint?.position).toEqual({ row: 1, col: 1 })
    expect(hint?.value).toBe(5)
  })

  it('どちらの技法にも該当するマスがない場合はnullを返す', () => {
    expect(findHint(emptyGrid(), SOLUTION)).toBeNull()
  })

  it('全マス入力済みの盤面ではnullを返す', () => {
    expect(findHint(cloneSolution(), SOLUTION)).toBeNull()
  })
})
