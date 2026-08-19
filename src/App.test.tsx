import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { loadGameState } from './utils/storage'

beforeEach(() => {
  localStorage.clear()
})

function boardButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>('.grid.aspect-square button'),
  )
}

function firstBlankCell(container: HTMLElement): HTMLButtonElement {
  const blank = boardButtons(container).find(
    (button) => !button.hasAttribute('data-given'),
  )
  if (!blank) throw new Error('no blank cell found')
  return blank
}

function numberPadButton(container: HTMLElement, n: number): HTMLButtonElement {
  const buttons = Array.from(
    container.querySelectorAll<HTMLButtonElement>(
      '.grid.grid-cols-3.grid-rows-3 button',
    ),
  )
  const button = buttons.find((b) => b.textContent === String(n))
  if (!button) throw new Error(`number pad button ${n} not found`)
  return button
}

function indexToPosition(index: number) {
  return { row: Math.floor(index / 9), col: index % 9 }
}

// テストからは直接参照できない生成済みパズルの正解を、
// 実装済みのlocalStorage永続化（Task 11）経由で読み取って使う。
function currentSolution(): number[][] {
  const solution = loadGameState()?.solution
  if (!solution) throw new Error('solution not found in localStorage')
  return solution
}

describe('App 初期表示', () => {
  it('起動時に9x9盤面とヒントセルが表示される', () => {
    const { container } = render(<App />)

    const cells = boardButtons(container)
    expect(cells).toHaveLength(81)
    expect(cells.some((cell) => cell.hasAttribute('data-given'))).toBe(true)
  })
})

describe('App マウス操作による入力', () => {
  it('マスを選択し数字パッドをクリックすると解答が入力される', async () => {
    const { container } = render(<App />)
    const blank = firstBlankCell(container)

    await userEvent.click(blank)
    await userEvent.click(numberPadButton(container, 5))

    expect(blank.textContent).toBe('5')
  })

  it('メモON時に数字パッドをクリックすると候補→非候補→noneと循環する', async () => {
    const { container } = render(<App />)
    const blank = firstBlankCell(container)

    await userEvent.click(blank)
    await userEvent.click(screen.getByRole('button', { name: 'メモ OFF' }))

    await userEvent.click(numberPadButton(container, 3))
    expect(within(blank).getByText('3').tagName).not.toBe('S')

    await userEvent.click(numberPadButton(container, 3))
    expect(within(blank).getByText('3').tagName).toBe('S')

    await userEvent.click(numberPadButton(container, 3))
    expect(within(blank).queryByText('3')).not.toBeInTheDocument()
  })
})

describe('App キーボード操作による入力', () => {
  it('マスを選択後、矢印キーで移動しテンキーで入力できる', async () => {
    const { container } = render(<App />)
    const cells = boardButtons(container)
    // 右隣もヒントでない（inputNumberが反映され得る）マスの組を探す
    const blankIndex = cells.findIndex(
      (cell, index) =>
        !cell.hasAttribute('data-given') &&
        index % 9 !== 8 &&
        !cells[index + 1].hasAttribute('data-given'),
    )
    if (blankIndex === -1) throw new Error('no adjacent blank pair found')
    const blank = cells[blankIndex]
    const target = cells[blankIndex + 1]

    await userEvent.click(blank)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: '6' })

    expect(target.textContent).toBe('6')
  })

  it('Delete/Backspaceキーで選択中マスの入力を消去できる', async () => {
    const { container } = render(<App />)
    const blank = firstBlankCell(container)

    await userEvent.click(blank)
    await userEvent.click(numberPadButton(container, 4))
    expect(blank.textContent).toBe('4')

    fireEvent.keyDown(window, { key: 'Delete' })

    expect(blank.textContent).toBe('')
  })
})

describe('App Undo・消しゴム', () => {
  it('戻るボタンで直前の入力を取り消せる', async () => {
    const { container } = render(<App />)
    const blank = firstBlankCell(container)

    await userEvent.click(blank)
    await userEvent.click(numberPadButton(container, 8))
    expect(blank.textContent).toBe('8')

    await userEvent.click(screen.getByRole('button', { name: '戻る' }))

    expect(blank.textContent).toBe('')
  })

  it('消しゴムボタンで選択中マスの入力を消去できる', async () => {
    const { container } = render(<App />)
    const blank = firstBlankCell(container)

    await userEvent.click(blank)
    await userEvent.click(numberPadButton(container, 8))
    expect(blank.textContent).toBe('8')

    await userEvent.click(screen.getByRole('button', { name: '消しゴム' }))

    expect(blank.textContent).toBe('')
  })
})

describe('App Checkボタンとエラー表示', () => {
  it('誤答マスでCheckを押すとエラースタイルが付き、正しい値に変更すると即座に消える', async () => {
    const { container } = render(<App />)
    const cells = boardButtons(container)
    const blank = firstBlankCell(container)
    const { row, col } = indexToPosition(cells.indexOf(blank))
    const correctValue = currentSolution()[row][col]
    const wrongValue = correctValue === 9 ? 1 : correctValue + 1

    await userEvent.click(blank)
    await userEvent.click(numberPadButton(container, wrongValue))
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(blank).toHaveAttribute('data-error', 'true')

    await userEvent.click(numberPadButton(container, correctValue))

    expect(blank).not.toHaveAttribute('data-error')
  })
})

describe('App クリア自動検出とクリア演出', () => {
  it(
    '全マスを正解で埋めるとクリアモーダルが表示され、New Gameモーダルの決定で新しい盤面になる',
    () => {
      const { container } = render(<App />)
      const cellsBefore = boardButtons(container).map((b) => b.textContent)
      const solution = currentSolution()

      boardButtons(container).forEach((cell, index) => {
        if (cell.hasAttribute('data-given')) return
        const { row, col } = indexToPosition(index)
        fireEvent.click(cell)
        fireEvent.click(numberPadButton(container, solution[row][col]))
      })

      const clearDialog = screen.getByRole('dialog')
      expect(clearDialog).toBeInTheDocument()
      expect(within(clearDialog).getByText(/クリア/)).toBeInTheDocument()

      fireEvent.click(within(clearDialog).getByRole('button', { name: 'New Game' }))

      const newGameDialog = screen.getByRole('dialog')
      fireEvent.click(within(newGameDialog).getByRole('button', { name: '決定' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      const cellsAfter = boardButtons(container).map((b) => b.textContent)
      expect(cellsAfter).not.toEqual(cellsBefore)
    },
    15000,
  )
})

describe('App New Gameボタンと難易度選択モーダル', () => {
  it('New Gameボタンを押すと難易度選択モーダルが開く', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'New Game' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeInTheDocument()
  })

  it('未入力状態で決定を押すと確認ダイアログなしで新しい盤面になる', async () => {
    const { container } = render(<App />)
    const cellsBefore = boardButtons(container).map((b) => b.getAttribute('data-given'))
    const confirmSpy = vi.spyOn(window, 'confirm')

    await userEvent.click(screen.getByRole('button', { name: 'New Game' }))
    await userEvent.click(screen.getByRole('button', { name: '決定' }))

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const cellsAfter = boardButtons(container).map((b) => b.getAttribute('data-given'))
    expect(cellsAfter).not.toEqual(cellsBefore)
    confirmSpy.mockRestore()
  })

  it('入力済みの状態で決定を押すと確認ダイアログが出て、同意すると新しい盤面になる', async () => {
    const { container } = render(<App />)
    const blank = firstBlankCell(container)
    await userEvent.click(blank)
    await userEvent.click(numberPadButton(container, 7))
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    await userEvent.click(screen.getByRole('button', { name: 'New Game' }))
    await userEvent.click(screen.getByRole('button', { name: '決定' }))

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    confirmSpy.mockRestore()
  })

  it('確認ダイアログでキャンセルすると盤面は変わらない', async () => {
    const { container } = render(<App />)
    const blank = firstBlankCell(container)
    await userEvent.click(blank)
    await userEvent.click(numberPadButton(container, 7))
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    await userEvent.click(screen.getByRole('button', { name: 'New Game' }))
    await userEvent.click(screen.getByRole('button', { name: '決定' }))

    expect(blank.textContent).toBe('7')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    confirmSpy.mockRestore()
  })
})

describe('Appのマウント間でのlocalStorage永続化', () => {
  it('入力後にアンマウントし再度マウントすると入力内容が復元される', async () => {
    const { container, unmount } = render(<App />)
    const blank = firstBlankCell(container)

    await userEvent.click(blank)
    await userEvent.click(numberPadButton(container, 9))
    expect(blank.textContent).toBe('9')
    const blankIndex = boardButtons(container).indexOf(blank)

    unmount()

    const { container: remountedContainer } = render(<App />)
    const cells = boardButtons(remountedContainer)

    expect(cells[blankIndex].textContent).toBe('9')
  })
})
