export function ShortenForm({
  url,
  customCode,
  loading,
  onUrlChange,
  onCustomCodeChange,
  onSubmit,
}: {
  url: string
  customCode: string
  loading: boolean
  onUrlChange: (value: string) => void
  onCustomCodeChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="https://example.com/very/long/url"
        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
        required
        disabled={loading}
      />
      <input
        type="text"
        value={customCode}
        onChange={(e) => onCustomCodeChange(e.target.value)}
        placeholder="Custom code (optional, e.g. my-link)"
        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition text-sm"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Shortening…
          </>
        ) : (
          'Shorten URL'
        )}
      </button>
    </form>
  )
}
