import type { HintState } from '../hooks/useNumberPlaceGame'

type HintPanelProps = {
  hint: HintState
}

export function HintPanel({ hint }: HintPanelProps) {
  if (hint.status === 'notFound') {
    return (
      <p role="status" className="text-sm text-gray-600">
        ヒントが見つかりませんでした
      </p>
    )
  }

  if (hint.status === 'reason') {
    return (
      <div role="status" className="rounded border border-gray-300 bg-gray-50 p-3 text-sm">
        <p className="font-bold text-gray-800">{hint.hint.techniqueLabel}</p>
        <p className="text-gray-700">{hint.hint.reasonText}</p>
      </div>
    )
  }

  return null
}
