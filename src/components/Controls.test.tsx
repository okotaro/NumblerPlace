import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Controls } from './Controls'

function renderControls(
  overrides: Partial<Parameters<typeof Controls>[0]> = {},
) {
  const props = {
    isMemoMode: false,
    onNumberClick: vi.fn(),
    onUndo: vi.fn(),
    onErase: vi.fn(),
    onToggleMemoMode: vi.fn(),
    onCheck: vi.fn(),
    onNewGame: vi.fn(),
    ...overrides,
  }
  render(<Controls {...props} />)
  return props
}

describe('Controls 表示', () => {
  it('戻る・消しゴム・メモON/OFF・Check・New Gameの各ボタンと数字パッド(1〜9)が表示される', () => {
    renderControls()

    expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '消しゴム' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /メモ/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New Game' })).toBeInTheDocument()
    for (let n = 1; n <= 9; n++) {
      expect(
        screen.getByRole('button', { name: String(n) }),
      ).toBeInTheDocument()
    }
  })
})

describe('Controls 操作', () => {
  it('戻るボタンをクリックするとonUndoが呼ばれる', async () => {
    const props = renderControls()
    await userEvent.click(screen.getByRole('button', { name: '戻る' }))
    expect(props.onUndo).toHaveBeenCalledTimes(1)
  })

  it('消しゴムボタンをクリックするとonEraseが呼ばれる', async () => {
    const props = renderControls()
    await userEvent.click(screen.getByRole('button', { name: '消しゴム' }))
    expect(props.onErase).toHaveBeenCalledTimes(1)
  })

  it('メモON/OFFボタンをクリックするとonToggleMemoModeが呼ばれる', async () => {
    const props = renderControls()
    await userEvent.click(screen.getByRole('button', { name: /メモ/ }))
    expect(props.onToggleMemoMode).toHaveBeenCalledTimes(1)
  })

  it('数字ボタンをクリックするとonNumberClickがその数字で呼ばれる', async () => {
    const props = renderControls()
    await userEvent.click(screen.getByRole('button', { name: '5' }))
    expect(props.onNumberClick).toHaveBeenCalledTimes(1)
    expect(props.onNumberClick).toHaveBeenCalledWith(5)
  })

  it('Checkボタンをクリックするとon Checkが呼ばれる', async () => {
    const props = renderControls()
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(props.onCheck).toHaveBeenCalledTimes(1)
  })

  it('New Gameボタンをクリックするとon NewGameが呼ばれる', async () => {
    const props = renderControls()
    await userEvent.click(screen.getByRole('button', { name: 'New Game' }))
    expect(props.onNewGame).toHaveBeenCalledTimes(1)
  })
})

describe('Controls メモON/OFFの状態表示', () => {
  it('isMemoMode=trueのときメモボタンがON状態を示す', () => {
    renderControls({ isMemoMode: true })
    expect(screen.getByRole('button', { name: /メモ/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('isMemoMode=falseのときメモボタンがOFF状態を示す', () => {
    renderControls({ isMemoMode: false })
    expect(screen.getByRole('button', { name: /メモ/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
