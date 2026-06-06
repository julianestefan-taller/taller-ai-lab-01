import { NextRequest, NextResponse } from 'next/server'
import { findByShortCode, incrementClicks } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params
  const row = await findByShortCode(shortCode)

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  incrementClicks(shortCode)
  return NextResponse.redirect(row.original_url, { status: 301 })
}
