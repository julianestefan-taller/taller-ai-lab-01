import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  findByShortCode: vi.fn(),
  incrementClicks: vi.fn(),
}))

import { GET } from '../route'
import { findByShortCode, incrementClicks } from '@/lib/db'

const mockFindByShortCode = vi.mocked(findByShortCode)
const mockIncrementClicks = vi.mocked(incrementClicks)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockRow = {
  id: 1,
  short_code: 'abc123',
  original_url: 'https://example.com/destination',
  created_at: '2026-01-01T00:00:00Z',
  clicks: 3,
}

function makeRequest(code: string): [NextRequest, { params: Promise<{ shortCode: string }> }] {
  const req = new NextRequest(`http://localhost:3000/${code}`)
  const params = Promise.resolve({ shortCode: code })
  return [req, { params }]
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /[shortCode]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIncrementClicks.mockResolvedValue(undefined)
  })

  it('returns 404 when the short code does not exist', async () => {
    mockFindByShortCode.mockResolvedValueOnce(null)
    const [req, ctx] = makeRequest('notfound')
    const res = await GET(req, ctx)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })

  it('returns 301 redirect when the short code exists', async () => {
    mockFindByShortCode.mockResolvedValueOnce(mockRow)
    const [req, ctx] = makeRequest('abc123')
    const res = await GET(req, ctx)
    expect(res.status).toBe(301)
  })

  it('redirects to the correct original URL', async () => {
    mockFindByShortCode.mockResolvedValueOnce(mockRow)
    const [req, ctx] = makeRequest('abc123')
    const res = await GET(req, ctx)
    expect(res.headers.get('location')).toBe('https://example.com/destination')
  })

  it('looks up the correct short code in the database', async () => {
    mockFindByShortCode.mockResolvedValueOnce(mockRow)
    const [req, ctx] = makeRequest('abc123')
    await GET(req, ctx)
    expect(mockFindByShortCode).toHaveBeenCalledWith('abc123')
  })

  it('calls incrementClicks with the short code on a hit', async () => {
    mockFindByShortCode.mockResolvedValueOnce(mockRow)
    const [req, ctx] = makeRequest('abc123')
    await GET(req, ctx)
    expect(mockIncrementClicks).toHaveBeenCalledWith('abc123')
  })

  it('does not call incrementClicks on a miss', async () => {
    mockFindByShortCode.mockResolvedValueOnce(null)
    const [req, ctx] = makeRequest('notfound')
    await GET(req, ctx)
    expect(mockIncrementClicks).not.toHaveBeenCalled()
  })
})
