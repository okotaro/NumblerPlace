import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewGameModal } from './NewGameModal'

describe('NewGameModal 表示', () => {
  it('isOpen=falseのとき何も表示されない', () => {
    render(
      <NewGameModal
        isOpen={false}
        difficulty="medium"
        onSelectDifficulty={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('isOpen=trueのとき5つの難易度選択肢が表示される', () => {
    render(
      <NewGameModal
        isOpen={true}
        difficulty="medium"
        onSelectDifficulty={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    expect(screen.getByRole('radio', { name: 'Easy' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Hard' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Expert' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Master' })).toBeInTheDocument()
  })

  it('現在のdifficultyに対応する選択肢が選択済みになっている', () => {
    render(
      <NewGameModal
        isOpen={true}
        difficulty="hard"
        onSelectDifficulty={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    expect(screen.getByRole('radio', { name: 'Hard' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Medium' })).not.toBeChecked()
  })

  it('「決定」ボタンと「キャンセル」ボタンが表示される', () => {
    render(
      <NewGameModal
        isOpen={true}
        difficulty="medium"
        onSelectDifficulty={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: '決定' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument()
  })
})

describe('NewGameModal 操作', () => {
  it('難易度の選択肢をクリックするとonSelectDifficultyが呼ばれる', async () => {
    const onSelectDifficulty = vi.fn()
    render(
      <NewGameModal
        isOpen={true}
        difficulty="medium"
        onSelectDifficulty={onSelectDifficulty}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    await userEvent.click(screen.getByRole('radio', { name: 'Expert' }))

    expect(onSelectDifficulty).toHaveBeenCalledTimes(1)
    expect(onSelectDifficulty).toHaveBeenCalledWith('expert')
  })

  it('「決定」ボタンをクリックするとonConfirmが呼ばれる', async () => {
    const onConfirm = vi.fn()
    render(
      <NewGameModal
        isOpen={true}
        difficulty="medium"
        onSelectDifficulty={() => {}}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: '決定' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('「キャンセル」ボタンをクリックするとonCancelが呼ばれる', async () => {
    const onCancel = vi.fn()
    render(
      <NewGameModal
        isOpen={true}
        difficulty="medium"
        onSelectDifficulty={() => {}}
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
