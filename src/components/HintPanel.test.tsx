import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HintPanel } from './HintPanel'
import type { HintState } from '../hooks/useNumberPlaceGame'
import type { Hint } from '../services/numberPlaceService'

const SAMPLE_HINT: Hint = {
  position: { row: 0, col: 4 },
  value: 5,
  technique: 'nakedSingle',
  techniqueLabel: '単一候補（Naked Single）',
  reasonText: 'このマスは候補が5の1つだけに絞られます',
}

describe('HintPanel 表示', () => {
  it('statusがnoneのときは何も表示しない', () => {
    const { container } = render(<HintPanel hint={{ status: 'none' }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('statusがhighlightのときはまだ技法名・理由を表示しない', () => {
    const hint: HintState = { status: 'highlight', hint: SAMPLE_HINT }
    const { container } = render(<HintPanel hint={hint} />)

    expect(screen.queryByText(SAMPLE_HINT.techniqueLabel)).not.toBeInTheDocument()
    expect(screen.queryByText(SAMPLE_HINT.reasonText)).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('statusがreasonのとき技法名と理由文を表示する', () => {
    const hint: HintState = { status: 'reason', hint: SAMPLE_HINT }
    render(<HintPanel hint={hint} />)

    expect(screen.getByText(SAMPLE_HINT.techniqueLabel)).toBeInTheDocument()
    expect(screen.getByText(SAMPLE_HINT.reasonText)).toBeInTheDocument()
  })

  it('statusがnotFoundのとき見つからなかった旨のメッセージを表示する', () => {
    render(<HintPanel hint={{ status: 'notFound' }} />)

    expect(screen.getByText('ヒントが見つかりませんでした')).toBeInTheDocument()
  })
})
