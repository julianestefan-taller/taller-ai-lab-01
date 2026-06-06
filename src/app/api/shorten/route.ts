import { NextRequest, NextResponse } from 'next/server'
import { findByOriginalUrl, findByShortCode, insertUrl } from '@/lib/db'
import { randomBytes } from 'crypto'

function generateShortCode(): string {
  return randomBytes(4).toString('base64url').slice(0, 6)
}

export async function POST(request: NextRequest) {
  let url: string
  let custom_code: string | undefined
  try {
    const body = await request.json()
    url = body?.url
    custom_code = body?.custom_code
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

  if (custom_code !== undefined) {
    if (typeof custom_code !== 'string' || !/^[a-zA-Z0-9_-]{3,20}$/.test(custom_code)) {
      return NextResponse.json(
        { error: 'Custom code must be 3–20 characters (letters, numbers, - or _)' },
        { status: 400 }
      )
    }
  }

  const host = request.headers.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'

  const existing = await findByOriginalUrl(url)
  if (existing) {
    return NextResponse.json({
      short_code: existing.short_code,
      short_url: `${protocol}://${host}/${existing.short_code}`,
      clicks: existing.clicks,
    })
  }

  if (custom_code) {
    const taken = await findByShortCode(custom_code)
    if (taken) {
      return NextResponse.json({ error: 'Custom code already taken' }, { status: 409 })
    }
  }

  const shortCode = custom_code ?? generateShortCode()
  const row = await insertUrl(shortCode, url)

  return NextResponse.json(
    { short_code: row.short_code, short_url: `${protocol}://${host}/${row.short_code}`, clicks: row.clicks },
    { status: 201 }
  )
}
