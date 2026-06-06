import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  findByOriginalUrl: vi.fn(),
  findByShortCode: vi.fn(),
  insertUrl: vi.fn(),
}))

import { POST } from '../route'
import { findByOriginalUrl, findByShortCode, insertUrl } from '@/lib/db'

const mockFindByOriginalUrl = vi.mocked(findByOriginalUrl)
const mockFindByShortCode = vi.mocked(findByShortCode)
const mockInsertUrl = vi.mocked(insertUrl)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockRow = {
  id: 1,
  short_code: 'abc123',
  original_url: 'https://example.com',
  created_at: '2026-01-01T00:00:00Z',
  clicks: 7,
}

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/shorten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', host: 'localhost:3000', ...headers },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/shorten', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindByOriginalUrl.mockResolvedValue(null)
    mockFindByShortCode.mockResolvedValue(null)
    mockInsertUrl.mockResolvedValue(mockRow)
  })

  // --- Input validation ---

  it('returns 400 for a non-JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/invalid json/i)
  })

  it('returns 400 when url is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/url is required/i)
  })

  it('returns 400 when url is not a valid URL', async () => {
    const res = await POST(makeRequest({ url: 'not-a-url' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/invalid url/i)
  })

  it('returns 400 when custom_code is too short', async () => {
    const res = await POST(makeRequest({ url: 'https://example.com', custom_code: 'ab' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('3')
  })

  it('returns 400 when custom_code contains invalid characters', async () => {
    const res = await POST(makeRequest({ url: 'https://example.com', custom_code: 'has space' }))
    expect(res.status).toBe(400)
  })

  // --- Deduplication ---

  it('returns 200 with existing row when URL is already shortened', async () => {
    mockFindByOriginalUrl.mockResolvedValueOnce(mockRow)
    const res = await POST(makeRequest({ url: 'https://example.com' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.short_code).toBe('abc123')
    expect(body.clicks).toBe(7)
    expect(mockInsertUrl).not.toHaveBeenCalled()
  })

  it('includes the correct short_url on dedup', async () => {
    mockFindByOriginalUrl.mockResolvedValueOnce(mockRow)
    const res = await POST(makeRequest({ url: 'https://example.com' }))
    const body = await res.json()
    expect(body.short_url).toBe('http://localhost:3000/abc123')
  })

  // --- Custom code conflict ---

  it('returns 409 when the requested custom code is already taken', async () => {
    mockFindByShortCode.mockResolvedValueOnce(mockRow)
    const res = await POST(makeRequest({ url: 'https://example.com', custom_code: 'mylink' }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/already taken/i)
  })

  // --- Successful creation ---

  it('returns 201 on a new URL with auto-generated code', async () => {
    const res = await POST(makeRequest({ url: 'https://example.com' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.short_code).toBe('abc123')
    expect(body.clicks).toBe(7)
  })

  it('returns 201 with the correct short_url on production host', async () => {
    const res = await POST(makeRequest({ url: 'https://example.com' }, { host: 'myapp.vercel.app' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.short_url).toMatch(/^https:\/\/myapp\.vercel\.app\//)
  })

  it('returns 201 when a valid custom code is provided', async () => {
    const customRow = { ...mockRow, short_code: 'my-link' }
    mockInsertUrl.mockResolvedValueOnce(customRow)
    const res = await POST(makeRequest({ url: 'https://example.com', custom_code: 'my-link' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.short_code).toBe('my-link')
  })

  it('passes the custom code to insertUrl', async () => {
    const customRow = { ...mockRow, short_code: 'custom' }
    mockInsertUrl.mockResolvedValueOnce(customRow)
    await POST(makeRequest({ url: 'https://example.com', custom_code: 'custom' }))
    const [[code]] = mockInsertUrl.mock.calls
    expect(code).toBe('custom')
  })

  it('passes the original url to insertUrl', async () => {
    await POST(makeRequest({ url: 'https://example.com' }))
    const [[, originalUrl]] = mockInsertUrl.mock.calls
    expect(originalUrl).toBe('https://example.com')
  })

  it('response includes clicks from the inserted row', async () => {
    const res = await POST(makeRequest({ url: 'https://example.com' }))
    const body = await res.json()
    expect(body.clicks).toBe(mockRow.clicks)
  })
})
