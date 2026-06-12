import { QRCodeSVG } from 'qrcode.react'
import type { ShortenResult as ShortenResultData } from './types'

export function ShortenResult({
  result,
  copied,
  onCopy,
}: {
  result: ShortenResultData
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="mt-4 p-4 rounded-xl bg-green-500/20 border border-green-500/30 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-green-300 text-xs font-medium uppercase tracking-wide">Shortened URL</p>
        <span className="text-slate-400 text-xs">{result.clicks} click{result.clicks !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex gap-2">
        <input
          readOnly
          value={result.short_url}
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
        />
        <button
          onClick={onCopy}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors whitespace-nowrap"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="flex justify-center pt-1">
        <div className="p-3 bg-white rounded-xl">
          <QRCodeSVG value={result.short_url} size={128} />
        </div>
      </div>
    </div>
  )
}
