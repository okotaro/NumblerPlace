import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useKeyboardControls } from './useKeyboardControls'

function setup() {
  const onMove = vi.fn()
  const onNumberInput = vi.fn()
  const onErase = vi.fn()
  const view = renderHook(() =>
    useKeyboardControls({ onMove, onNumberInput, onErase }),
  )
  return { onMove, onNumberInput, onErase, ...view }
}

describe('useKeyboardControls キー入力とコールバックの対応', () => {
  it('ArrowUp/Down/Left/RightでonMoveが対応する方向で呼ばれる', () => {
    const { onMove } = setup()

    fireEvent.keyDown(window, { key: 'ArrowUp' })
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(onMove).toHaveBeenNthCalledWith(1, 'up')
    expect(onMove).toHaveBeenNthCalledWith(2, 'down')
    expect(onMove).toHaveBeenNthCalledWith(3, 'left')
    expect(onMove).toHaveBeenNthCalledWith(4, 'right')
  })

  it('矢印キー押下時にデフォルト動作を抑止する', () => {
    setup()

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      cancelable: true,
    })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('数字キー1〜9でonNumberInputがその数値で呼ばれる', () => {
    const { onNumberInput } = setup()

    fireEvent.keyDown(window, { key: '5' })

    expect(onNumberInput).toHaveBeenCalledTimes(1)
    expect(onNumberInput).toHaveBeenCalledWith(5)
  })

  it('DeleteキーでonEraseが呼ばれる', () => {
    const { onErase } = setup()

    fireEvent.keyDown(window, { key: 'Delete' })

    expect(onErase).toHaveBeenCalledTimes(1)
  })

  it('BackspaceキーでonEraseが呼ばれる', () => {
    const { onErase } = setup()

    fireEvent.keyDown(window, { key: 'Backspace' })

    expect(onErase).toHaveBeenCalledTimes(1)
  })

  it('対応しないキーは何のコールバックも呼ばない', () => {
    const { onMove, onNumberInput, onErase } = setup()

    fireEvent.keyDown(window, { key: 'a' })

    expect(onMove).not.toHaveBeenCalled()
    expect(onNumberInput).not.toHaveBeenCalled()
    expect(onErase).not.toHaveBeenCalled()
  })

  it('アンマウント後はキー入力を購読しない', () => {
    const { onMove, unmount } = setup()

    unmount()
    fireEvent.keyDown(window, { key: 'ArrowUp' })

    expect(onMove).not.toHaveBeenCalled()
  })
})
