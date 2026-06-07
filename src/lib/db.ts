import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

interface UrlRow {
  id: number
  short_code: string
  original_url: string
  created_at: string
  clicks: number
}

export async function findByOriginalUrl(url: string): Promise<UrlRow | null> {
  const { data } = await supabase
    .from('urls')
    .select('*')
    .eq('original_url', url)
    .single()
  return data
}

export async function findByShortCode(code: string): Promise<UrlRow | null> {
  const { data } = await supabase
    .from('urls')
    .select('*')
    .eq('short_code', code)
    .single()
  return data
}

export async function incrementClicks(shortCode: string): Promise<void> {
  await supabase.rpc('increment_clicks', { code: shortCode })
}

export async function insertUrl(shortCode: string, originalUrl: string): Promise<UrlRow> {
  const { data, error } = await supabase
    .from('urls')
    .insert({ short_code: shortCode, original_url: originalUrl })
    .select()
    .single()
  if (error) throw error
  return data
}
