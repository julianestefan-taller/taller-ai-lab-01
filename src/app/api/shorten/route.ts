import { NextRequest, NextResponse } from 'next/server'
import { findByOriginalUrl, insertUrl } from '@/lib/db'
import { randomBytes } from 'crypto'

function generateShortCode(): string {
  return randomBytes(4).toString('base64url').slice(0, 6)
}

export async function POST(request: NextRequest) {
  let url: string
  try {
    const body = await request.json()
    url = body?.url
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const existing = await findByOriginalUrl(url)
  if (existing) {
    const host = request.headers.get('host') ?? 'localhost:3000'
    const protocol = host.startsWith('localhost') ? 'http' : 'https'
    return NextResponse.json({
      short_code: existing.short_code,
      short_url: `${protocol}://${host}/${existing.short_code}`,
    })
  }

  const shortCode = generateShortCode()
  const row = await insertUrl(shortCode, url)
  const host = request.headers.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'

  return NextResponse.json(
    { short_code: row.short_code, short_url: `${protocol}://${host}/${row.short_code}` },
    { status: 201 }
  )
}
