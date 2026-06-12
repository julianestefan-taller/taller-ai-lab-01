export function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null

  return (
    <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
      {error}
    </div>
  )
}
