import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before module evaluation, so these refs are available in vi.mock factories.
const { mockSingle, mockRpc, mockBuilder, mockSupabaseClient } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockRpc = vi.fn()

  // Two-step assignment to allow self-referencing chain methods.
  const mockBuilder = {} as Record<string, ReturnType<typeof vi.fn>>
  mockBuilder.select = vi.fn(() => mockBuilder)
  mockBuilder.insert = vi.fn(() => mockBuilder)
  mockBuilder.eq = vi.fn(() => mockBuilder)
  mockBuilder.single = mockSingle

  const mockSupabaseClient = {
    from: vi.fn(() => mockBuilder),
    rpc: mockRpc,
  }

  return { mockSingle, mockRpc, mockBuilder, mockSupabaseClient }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

import { findByOriginalUrl, findByShortCode, insertUrl, incrementClicks } from '../db'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockRow = {
  id: 1,
  short_code: 'abc123',
  original_url: 'https://example.com',
  created_at: '2026-01-01T00:00:00Z',
  clicks: 5,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('db', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-wire chain methods after clearAllMocks drains mockReturnValue queues
    // (implementations set via vi.fn(factory) survive clearAllMocks, but
    // we explicitly reset so tests stay independent).
    mockBuilder.select = vi.fn(() => mockBuilder)
    mockBuilder.insert = vi.fn(() => mockBuilder)
    mockBuilder.eq = vi.fn(() => mockBuilder)
    mockBuilder.single = mockSingle
    mockSupabaseClient.from = vi.fn(() => mockBuilder)
  })

  // --- findByOriginalUrl ---

  describe('findByOriginalUrl', () => {
    it('returns the row when found', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockRow })
      const result = await findByOriginalUrl('https://example.com')
      expect(result).toEqual(mockRow)
    })

    it('returns null when not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null })
      const result = await findByOriginalUrl('https://notfound.com')
      expect(result).toBeNull()
    })

    it('queries the urls table with the correct url', async () => {
      mockSingle.mockResolvedValueOnce({ data: null })
      await findByOriginalUrl('https://example.com')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('urls')
      expect(mockBuilder.eq).toHaveBeenCalledWith('original_url', 'https://example.com')
    })
  })

  // --- findByShortCode ---

  describe('findByShortCode', () => {
    it('returns the row when found', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockRow })
      const result = await findByShortCode('abc123')
      expect(result).toEqual(mockRow)
    })

    it('returns null when not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null })
      const result = await findByShortCode('missing')
      expect(result).toBeNull()
    })

    it('queries the urls table with the correct short code', async () => {
      mockSingle.mockResolvedValueOnce({ data: null })
      await findByShortCode('abc123')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('urls')
      expect(mockBuilder.eq).toHaveBeenCalledWith('short_code', 'abc123')
    })
  })

  // --- insertUrl ---

  describe('insertUrl', () => {
    it('returns the new row on success', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockRow, error: null })
      const result = await insertUrl('abc123', 'https://example.com')
      expect(result).toEqual(mockRow)
    })

    it('throws when supabase returns an error', async () => {
      const dbError = new Error('unique constraint violation')
      mockSingle.mockResolvedValueOnce({ data: null, error: dbError })
      await expect(insertUrl('abc123', 'https://example.com')).rejects.toThrow(
        'unique constraint violation'
      )
    })

    it('inserts into the urls table', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockRow, error: null })
      await insertUrl('abc123', 'https://example.com')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('urls')
      expect(mockBuilder.insert).toHaveBeenCalledWith({
        short_code: 'abc123',
        original_url: 'https://example.com',
      })
    })
  })

  // --- incrementClicks ---

  describe('incrementClicks', () => {
    it('calls the increment_clicks RPC with the correct code', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null })
      await incrementClicks('abc123')
      expect(mockRpc).toHaveBeenCalledWith('increment_clicks', { code: 'abc123' })
    })

    it('resolves without throwing on success', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null })
      await expect(incrementClicks('abc123')).resolves.toBeUndefined()
    })
  })
})
