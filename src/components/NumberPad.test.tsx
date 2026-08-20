import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberPad } from './NumberPad'

describe('NumberPad 表示・操作', () => {
  it('1〜9の数字ボタンが表示される', () => {
    render(<NumberPad onNumberClick={() => {}} completedNumbers={[]} />)

    for (let n = 1; n <= 9; n++) {
      expect(
        screen.getByRole('button', { name: String(n) }),
      ).toBeInTheDocument()
    }
  })

  it('数字ボタンをクリックするとonNumberClickがその数字で呼ばれる', async () => {
    const onNumberClick = vi.fn()
    render(<NumberPad onNumberClick={onNumberClick} completedNumbers={[]} />)

    await userEvent.click(screen.getByRole('button', { name: '5' }))

    expect(onNumberClick).toHaveBeenCalledTimes(1)
    expect(onNumberClick).toHaveBeenCalledWith(5)
  })

  it('数字ボタンは視認性向上のため拡大・太字スタイルを持つ', () => {
    render(<NumberPad onNumberClick={() => {}} completedNumbers={[]} />)

    expect(screen.getByRole('button', { name: '5' })).toHaveClass(
      'text-2xl',
      'font-bold',
    )
  })
})

describe('NumberPad 入力済み数字の無効化', () => {
  it('completedNumbersに含まれる数字のボタンは無効化される', () => {
    render(<NumberPad onNumberClick={() => {}} completedNumbers={[5]} />)

    expect(screen.getByRole('button', { name: '5' })).toBeDisabled()
  })

  it('無効化されたボタンをクリックしてもonNumberClickは呼ばれない', async () => {
    const onNumberClick = vi.fn()
    render(<NumberPad onNumberClick={onNumberClick} completedNumbers={[5]} />)

    await userEvent.click(screen.getByRole('button', { name: '5' }))

    expect(onNumberClick).not.toHaveBeenCalled()
  })

  it('completedNumbersに含まれない数字のボタンは従来通り操作できる', async () => {
    const onNumberClick = vi.fn()
    render(<NumberPad onNumberClick={onNumberClick} completedNumbers={[5]} />)

    expect(screen.getByRole('button', { name: '3' })).not.toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: '3' }))

    expect(onNumberClick).toHaveBeenCalledWith(3)
  })

  it('completedNumbersが空配列のときは全ボタンが操作可能', () => {
    render(<NumberPad onNumberClick={() => {}} completedNumbers={[]} />)

    for (let n = 1; n <= 9; n++) {
      expect(screen.getByRole('button', { name: String(n) })).not.toBeDisabled()
    }
  })
})
