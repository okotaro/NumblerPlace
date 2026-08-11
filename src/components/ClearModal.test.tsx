import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClearModal } from './ClearModal'

describe('ClearModal 表示', () => {
  it('isOpen=falseのとき何も表示されない', () => {
    render(<ClearModal isOpen={false} onNewGame={() => {}} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('isOpen=trueのときクリアした旨のメッセージが表示される', () => {
    render(<ClearModal isOpen={true} onNewGame={() => {}} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/クリア/)).toBeInTheDocument()
  })

  it('isOpen=trueのときNew Gameへの導線が表示される', () => {
    render(<ClearModal isOpen={true} onNewGame={() => {}} />)

    expect(
      screen.getByRole('button', { name: 'New Game' }),
    ).toBeInTheDocument()
  })
})

describe('ClearModal 操作', () => {
  it('New Gameボタンをクリックするとon NewGameが呼ばれる', async () => {
    const onNewGame = vi.fn()
    render(<ClearModal isOpen={true} onNewGame={onNewGame} />)

    await userEvent.click(screen.getByRole('button', { name: 'New Game' }))

    expect(onNewGame).toHaveBeenCalledTimes(1)
  })
})
