import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Cell } from './Cell'
import type { Cell as CellType, MemoMark } from '../types'

function makeMemos(overrides: Record<number, MemoMark> = {}) {
  const memos: Record<number, MemoMark> = {}
  for (let n = 1; n <= 9; n++) {
    memos[n] = overrides[n] ?? 'none'
  }
  return memos
}

function makeCell(overrides: Partial<CellType> = {}): CellType {
  return {
    value: null,
    isGiven: false,
    memos: makeMemos(),
    ...overrides,
  }
}

describe('Cell 表示', () => {
  it('未入力マスは何も表示しない', () => {
    render(
      <Cell
        cell={makeCell()}
        isSelected={false}
        isRelated={false}
        onSelect={() => {}}
      />,
    )

    for (let n = 1; n <= 9; n++) {
      expect(screen.queryByText(String(n))).not.toBeInTheDocument()
    }
  })

  it('解答入力済みマスは数字を中央に大きく表示する', () => {
    render(
      <Cell
        cell={makeCell({ value: 6 })}
        isSelected={false}
        isRelated={false}
        onSelect={() => {}}
      />,
    )

    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('確定マス（ヒント）は数字を表示し、ヒント用スタイルが付く', () => {
    render(
      <Cell
        cell={makeCell({ value: 6, isGiven: true })}
        isSelected={false}
        isRelated={false}
        onSelect={() => {}}
      />,
    )

    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAttribute('data-given', 'true')
  })

  it('解答済みマスはメモを表示しない（value優先）', () => {
    render(
      <Cell
        cell={makeCell({ value: 6, memos: makeMemos({ 1: 'candidate' }) })}
        isSelected={false}
        isRelated={false}
        onSelect={() => {}}
      />,
    )

    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('候補メモは3x3ミニグリッドの対応位置に通常表示される', () => {
    render(
      <Cell
        cell={makeCell({
          memos: makeMemos({ 1: 'candidate', 9: 'candidate' }),
        })}
        isSelected={false}
        isRelated={false}
        onSelect={() => {}}
      />,
    )

    expect(screen.getByText('1').tagName).not.toBe('S')
    expect(screen.getByText('9').tagName).not.toBe('S')
  })

  it('非候補メモは3x3ミニグリッドの対応位置に取り消し線付きで表示される', () => {
    render(
      <Cell
        cell={makeCell({ memos: makeMemos({ 5: 'notCandidate' }) })}
        isSelected={false}
        isRelated={false}
        onSelect={() => {}}
      />,
    )

    expect(screen.getByText('5').tagName).toBe('S')
  })
})

describe('Cell 選択・関連ハイライト', () => {
  it('選択中マスには選択スタイルが付く', () => {
    render(
      <Cell
        cell={makeCell()}
        isSelected={true}
        isRelated={false}
        onSelect={() => {}}
      />,
    )

    expect(screen.getByRole('button')).toHaveAttribute('data-selected', 'true')
  })

  it('関連マスには関連スタイルが付く（選択スタイルは付かない）', () => {
    render(
      <Cell
        cell={makeCell()}
        isSelected={false}
        isRelated={true}
        onSelect={() => {}}
      />,
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-related', 'true')
    expect(button).not.toHaveAttribute('data-selected')
  })

  it('無関係のマスにはどちらのスタイルも付かない', () => {
    render(
      <Cell
        cell={makeCell()}
        isSelected={false}
        isRelated={false}
        onSelect={() => {}}
      />,
    )

    const button = screen.getByRole('button')
    expect(button).not.toHaveAttribute('data-selected')
    expect(button).not.toHaveAttribute('data-related')
  })
})

describe('Cell 操作', () => {
  it('マスをクリックするとonSelectが呼ばれる', async () => {
    const onSelect = vi.fn()
    render(
      <Cell
        cell={makeCell()}
        isSelected={false}
        isRelated={false}
        onSelect={onSelect}
      />,
    )

    await userEvent.click(screen.getByRole('button'))

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('確定マス（ヒント）をクリックしてもonSelectは呼ばれる', async () => {
    const onSelect = vi.fn()
    render(
      <Cell
        cell={makeCell({ value: 6, isGiven: true })}
        isSelected={false}
        isRelated={false}
        onSelect={onSelect}
      />,
    )

    await userEvent.click(screen.getByRole('button'))

    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})
