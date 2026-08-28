import { describe, expect, it } from 'vitest'
import {
  findClaiming,
  findHiddenPair,
  findHiddenSingleInUnit,
  findHiddenTriple,
  findHint,
  findNakedPair,
  findNakedSingle,
  findNakedTriple,
  findPointingPair,
  findXWing,
} from './hintFinder'

// 消去候補が実際の正解値と偶然一致して防御フィルタに削られることのない中立な正解盤面。
// （候補消去系の技法はNaked/Hidden Singleと異なり、単一マスの確定値ではなく候補の除去を扱うため、
// 「正解」自体はテストの本質に関与しない。ただしfindHintのシグネチャ上、常にsolutionを渡す必要がある。）
const NEUTRAL_SOLUTION: number[][] = Array.from({ length: 9 }, () => Array(9).fill(-1))

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

describe('hintFinder findNakedPair', () => {
  function emptyGrid(): (number | null)[][] {
    return Array.from({ length: 9 }, () => Array<number | null>(9).fill(null))
  }

  it('ブロック内でNaked Pairを検出し、他マスから候補を除去する', () => {
    const grid = emptyGrid()
    grid[0] = [1, 2, 3, 4, 5, 6, 7, null, null] // (0,7),(0,8)の候補はともに{8,9}
    grid[1][6] = 1
    grid[1][8] = 2
    grid[2][6] = 3
    grid[2][7] = 4
    grid[2][8] = 5
    // (1,7)は空欄のまま。候補は{6,8,9}となり、Naked Pair{8,9}の除去対象になる。

    const hint = findNakedPair(grid, NEUTRAL_SOLUTION)

    expect(hint).toEqual({
      kind: 'elimination',
      technique: 'nakedPair',
      techniqueLabel: '裸のペア（Naked Pair）',
      reasonText:
        'このブロックで8・9の候補が2マスに絞られるため、他のマスからこれらの値の候補を除去できます',
      cells: [
        { position: { row: 0, col: 7 }, role: 'cause' },
        { position: { row: 0, col: 8 }, role: 'cause' },
        { position: { row: 1, col: 7 }, role: 'eliminated' },
      ],
      eliminatedCandidates: [
        { position: { row: 1, col: 7 }, value: 8 },
        { position: { row: 1, col: 7 }, value: 9 },
      ],
    })
  })

  it('除去先が存在しない場合はnullを返す', () => {
    const grid = emptyGrid()
    grid[0] = [1, 2, 3, 4, 5, 6, 7, null, null] // (0,7),(0,8)の候補はともに{8,9}
    // 列7・列8・ブロック2の他のマスをすべて埋め、除去先となる空欄マスをなくす。
    for (let row = 1; row <= 8; row++) {
      grid[row][6] = 3
      grid[row][7] = 1
      grid[row][8] = 2
    }

    expect(findNakedPair(grid, NEUTRAL_SOLUTION)).toBeNull()
  })
})

describe('hintFinder findNakedTriple', () => {
  function emptyGrid(): (number | null)[][] {
    return Array.from({ length: 9 }, () => Array<number | null>(9).fill(null))
  }

  it('ブロック内でNaked Tripleを検出し、他マスから候補を除去する', () => {
    const grid = emptyGrid()
    grid[0] = [1, 2, 3, 4, 5, 6, null, null, null] // (0,6),(0,7),(0,8)の候補はいずれも{7,8,9}

    const hint = findNakedTriple(grid, NEUTRAL_SOLUTION)

    expect(hint?.kind).toBe('elimination')
    expect(hint?.technique).toBe('nakedTriple')
    expect(hint?.cells.filter((c) => c.role === 'cause')).toEqual([
      { position: { row: 0, col: 6 }, role: 'cause' },
      { position: { row: 0, col: 7 }, role: 'cause' },
      { position: { row: 0, col: 8 }, role: 'cause' },
    ])
    expect(hint?.eliminatedCandidates.length).toBeGreaterThan(0)
    expect(hint?.eliminatedCandidates).toEqual(
      expect.arrayContaining([{ position: { row: 1, col: 6 }, value: 7 }]),
    )
  })
})

describe('hintFinder findHiddenPair', () => {
  function emptyGrid(): (number | null)[][] {
    return Array.from({ length: 9 }, () => Array<number | null>(9).fill(null))
  }

  it('行内でHidden Pairを検出し、当該マス自身の余分な候補を除去する', () => {
    const grid = emptyGrid()
    grid[0] = [null, null, null, 4, 5, 6, 7, 8, 9] // (0,0)(0,1)(0,2)の候補は{1,2,3}
    grid[3][2] = 1 // 列2から値1を除外
    grid[4][2] = 2 // 列2から値2を除外
    // これにより(0,2)の候補は{3}のみになり、値1・2は(0,0)(0,1)にしか入らない（Hidden Pair）。
    // (0,0)(0,1)の候補は{1,2,3}のままなので、3は余分な候補として除去できる。

    const hint = findHiddenPair(grid, NEUTRAL_SOLUTION)

    expect(hint).toEqual({
      kind: 'elimination',
      technique: 'hiddenPair',
      techniqueLabel: '隠れたペア（Hidden Pair）',
      reasonText:
        'この行で1・2が入りうるマスがこの2マスに絞られるため、これらのマスの他の候補を除去できます',
      cells: [
        { position: { row: 0, col: 0 }, role: 'cause' },
        { position: { row: 0, col: 1 }, role: 'cause' },
      ],
      eliminatedCandidates: [
        { position: { row: 0, col: 0 }, value: 3 },
        { position: { row: 0, col: 1 }, value: 3 },
      ],
    })
  })
})

describe('hintFinder findHiddenTriple', () => {
  function emptyGrid(): (number | null)[][] {
    return Array.from({ length: 9 }, () => Array<number | null>(9).fill(null))
  }

  it('行内でHidden Tripleを検出し、当該マス自身の余分な候補を除去する', () => {
    const grid = emptyGrid()
    grid[0] = [null, null, null, null, 5, 6, 7, 8, 9] // (0,0)(0,1)(0,2)(0,3)の候補は{1,2,3,4}
    grid[3][3] = 1
    grid[4][3] = 2
    grid[5][3] = 3
    // (0,3)の候補は{4}のみになり、値1・2・3は(0,0)(0,1)(0,2)にしか入らない（Hidden Triple）。

    const hint = findHiddenTriple(grid, NEUTRAL_SOLUTION)

    expect(hint).toEqual({
      kind: 'elimination',
      technique: 'hiddenTriple',
      techniqueLabel: '隠れたトリプル（Hidden Triple）',
      reasonText:
        'この行で1・2・3が入りうるマスがこの3マスに絞られるため、これらのマスの他の候補を除去できます',
      cells: [
        { position: { row: 0, col: 0 }, role: 'cause' },
        { position: { row: 0, col: 1 }, role: 'cause' },
        { position: { row: 0, col: 2 }, role: 'cause' },
      ],
      eliminatedCandidates: [
        { position: { row: 0, col: 0 }, value: 4 },
        { position: { row: 0, col: 1 }, value: 4 },
        { position: { row: 0, col: 2 }, value: 4 },
      ],
    })
  })
})

describe('hintFinder findPointingPair', () => {
  // ブロック0内で(0,0)の候補は{5,6}、(0,1)の候補は{5,7}に絞られる（(0,2)以下は埋まっている）。
  // 共通するのは値5のみで、値5が入りうるマスは行0に閉じ込められている。
  // ブロック外・同じ行0の(0,4)も候補5を持つため除去できる。
  function makePointingPairGrid(): (number | null)[][] {
    // 対象マス以外はすべて9で埋め、他のブロック・行・列で偶然の一致（誤発火）が
    // 起きないようにする（空欄マスは(0,0)(0,1)(0,4)の3マスのみ）。
    const grid: (number | null)[][] = Array.from({ length: 9 }, () => Array(9).fill(9))
    grid[0] = [null, null, 1, 2, null, 3, 4, 8, 9]
    grid[1][0] = 1
    grid[1][1] = 2
    grid[1][2] = 3
    grid[2][0] = 4
    grid[2][1] = 8
    grid[2][2] = 9
    grid[3][0] = 7
    grid[3][1] = 6
    return grid
  }

  it('ブロック内で値が同じ行に閉じ込められている場合、ブロック外の同じ行から候補を除去する', () => {
    const hint = findPointingPair(makePointingPairGrid(), NEUTRAL_SOLUTION)

    expect(hint).toEqual({
      kind: 'elimination',
      technique: 'pointingPair',
      techniqueLabel: 'ポインティング（Pointing Pair/Triple）',
      reasonText:
        'このブロックの中で5が入りうるマスはこの行に閉じ込められているため、ブロック外のこの行から5の候補を除去できます',
      cells: [
        { position: { row: 0, col: 0 }, role: 'cause' },
        { position: { row: 0, col: 1 }, role: 'cause' },
        { position: { row: 0, col: 4 }, role: 'eliminated' },
      ],
      eliminatedCandidates: [{ position: { row: 0, col: 4 }, value: 5 }],
    })
  })

  it('消去候補が正解値と一致する場合はその消去候補を除外し、除去先がなくなれば不採用になる', () => {
    const solutionWithMatch = Array.from({ length: 9 }, () => Array(9).fill(-1))
    solutionWithMatch[0][4] = 5 // 唯一の消去候補(0,4)=5がまさに正解値と一致する

    expect(findPointingPair(makePointingPairGrid(), solutionWithMatch)).toBeNull()
  })
})

describe('hintFinder findClaiming', () => {
  function emptyGrid(): (number | null)[][] {
    return Array.from({ length: 9 }, () => Array<number | null>(9).fill(null))
  }

  it('行内で値が同じブロックに閉じ込められている場合、行外の同じブロックから候補を除去する', () => {
    const grid = emptyGrid()
    grid[1] = [null, null, 3, 4, 5, 6, 7, 8, 9]
    // 行1内で値1が入りうるのは(1,0)(1,1)のみで、いずれもブロック0に属する。
    // 行1外・ブロック0内の(0,0)(0,1)(0,2)(2,0)(2,1)(2,2)も候補1を持つため除去できる。

    const hint = findClaiming(grid, NEUTRAL_SOLUTION)

    expect(hint?.kind).toBe('elimination')
    expect(hint?.technique).toBe('claiming')
    expect(hint?.cells.filter((c) => c.role === 'cause')).toEqual([
      { position: { row: 1, col: 0 }, role: 'cause' },
      { position: { row: 1, col: 1 }, role: 'cause' },
    ])
    expect(hint?.eliminatedCandidates).toEqual(
      expect.arrayContaining([
        { position: { row: 0, col: 0 }, value: 1 },
        { position: { row: 2, col: 2 }, value: 1 },
      ]),
    )
  })
})

describe('hintFinder findXWing', () => {
  function emptyGrid(): (number | null)[][] {
    return Array.from({ length: 9 }, () => Array<number | null>(9).fill(null))
  }

  it('2つの行でX-Wingを検出し、対象2列の他マスから候補を除去する', () => {
    const grid = emptyGrid()
    grid[0] = [null, 2, 3, null, 5, 6, 7, 8, 9]
    grid[3] = [null, 3, 5, null, 6, 7, 8, 9, 2]
    // 行0・行3ともに値1の候補が列0・列3のみに絞られる。他の行の列0・列3から候補1を除去できる。

    const hint = findXWing(grid, NEUTRAL_SOLUTION)

    expect(hint?.kind).toBe('elimination')
    expect(hint?.technique).toBe('xWing')
    expect(hint?.cells.filter((c) => c.role === 'cause')).toEqual([
      { position: { row: 0, col: 0 }, role: 'cause' },
      { position: { row: 0, col: 3 }, role: 'cause' },
      { position: { row: 3, col: 0 }, role: 'cause' },
      { position: { row: 3, col: 3 }, role: 'cause' },
    ])
    expect(hint?.eliminatedCandidates).toEqual(
      expect.arrayContaining([
        { position: { row: 1, col: 0 }, value: 1 },
        { position: { row: 6, col: 3 }, value: 1 },
      ]),
    )
    expect(
      hint?.cells.some((c) => c.role === 'cause' && c.position.row === 1),
    ).toBe(false)
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
    if (hint === null || hint.kind !== 'value') throw new Error('expected value hint')

    expect(hint.technique).toBe('nakedSingle')
    expect(hint.position).toEqual({ row: 0, col: 1 })
    expect(hint.value).toBe(2)
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
    if (hint === null || hint.kind !== 'value') throw new Error('expected value hint')

    expect(hint.technique).toBe('hiddenSingle')
    expect(hint.position).toEqual({ row: 1, col: 1 })
    expect(hint.value).toBe(5)
  })

  it('どちらの技法にも該当するマスがない場合はnullを返す', () => {
    expect(findHint(emptyGrid(), SOLUTION)).toBeNull()
  })

  it('全マス入力済みの盤面ではnullを返す', () => {
    expect(findHint(cloneSolution(), SOLUTION)).toBeNull()
  })

  it('Naked/Hidden Singleが存在せずNaked Pairのみ存在する場合はNaked PairのHintを返す', () => {
    const grid: (number | null)[][] = emptyGrid()
    grid[0] = [1, 2, 3, 4, 5, 6, 7, null, null]
    grid[1][6] = 1
    grid[1][8] = 2
    grid[2][6] = 3
    grid[2][7] = 4
    grid[2][8] = 5

    expect(findNakedSingle(grid, NEUTRAL_SOLUTION)).toBeNull()

    const hint = findHint(grid, NEUTRAL_SOLUTION)

    expect(hint?.kind).toBe('elimination')
    expect(hint?.technique).toBe('nakedPair')
  })
})
