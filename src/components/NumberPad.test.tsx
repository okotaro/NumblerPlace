import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberPad } from './NumberPad'

describe('NumberPad 表示・操作', () => {
  it('1〜9の数字ボタンが表示される', () => {
    render(<NumberPad onNumberClick={() => {}} />)

    for (let n = 1; n <= 9; n++) {
      expect(
        screen.getByRole('button', { name: String(n) }),
      ).toBeInTheDocument()
    }
  })

  it('数字ボタンをクリックするとonNumberClickがその数字で呼ばれる', async () => {
    const onNumberClick = vi.fn()
    render(<NumberPad onNumberClick={onNumberClick} />)

    await userEvent.click(screen.getByRole('button', { name: '5' }))

    expect(onNumberClick).toHaveBeenCalledTimes(1)
    expect(onNumberClick).toHaveBeenCalledWith(5)
  })

  it('数字ボタンは視認性向上のため拡大・太字スタイルを持つ', () => {
    render(<NumberPad onNumberClick={() => {}} />)

    expect(screen.getByRole('button', { name: '5' })).toHaveClass(
      'text-2xl',
      'font-bold',
    )
  })
})
