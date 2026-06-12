'use client'

import { useState } from 'react'
import { ShortenForm } from './components/ShortenForm'
import { ShortenResult } from './components/ShortenResult'
import { ErrorBanner } from './components/ErrorBanner'
import type { ShortenResult as ShortenResultData } from './components/types'

export default function Home() {
  const [url, setUrl] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [result, setResult] = useState<ShortenResultData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    setCopied(false)

    try {
      const body: Record<string, string> = { url }
      if (customCode.trim()) body.custom_code = customCode.trim()

      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
      } else {
        setResult(data)
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result.short_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">URL Shortener</h1>
          <p className="text-slate-400">Paste a long URL and get a short one instantly</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20">
          <ShortenForm
            url={url}
            customCode={customCode}
            loading={loading}
            onUrlChange={setUrl}
            onCustomCodeChange={setCustomCode}
            onSubmit={handleSubmit}
          />

          <ErrorBanner error={error} />

          {result && <ShortenResult result={result} copied={copied} onCopy={handleCopy} />}
        </div>
      </div>
    </main>
  )
}
