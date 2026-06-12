// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ShortenResult } from '../ShortenResult'
import type { ShortenResult as ShortenResultData } from '../types'

const RESULT: ShortenResultData = {
  short_code: 'abc123',
  short_url: 'https://sho.rt/abc123',
  clicks: 5,
}

describe('ShortenResult', () => {
  it('renders the short url in a readonly input', () => {
    render(<ShortenResult result={RESULT} copied={false} onCopy={vi.fn()} />)
    expect(screen.getByDisplayValue('https://sho.rt/abc123')).toBeInTheDocument()
  })

  it('shows plural "clicks" for counts other than 1', () => {
    render(<ShortenResult result={RESULT} copied={false} onCopy={vi.fn()} />)
    expect(screen.getByText('5 clicks')).toBeInTheDocument()
  })

  it('shows singular "click" when count is 1', () => {
    render(<ShortenResult result={{ ...RESULT, clicks: 1 }} copied={false} onCopy={vi.fn()} />)
    expect(screen.getByText('1 click')).toBeInTheDocument()
  })

  it('shows "Copy" by default and "Copied!" when copied is true', () => {
    const { rerender } = render(<ShortenResult result={RESULT} copied={false} onCopy={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    rerender(<ShortenResult result={RESULT} copied={true} onCopy={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument()
  })

  it('fires onCopy when the copy button is clicked', async () => {
    const user = userEvent.setup()
    const onCopy = vi.fn()
    render(<ShortenResult result={RESULT} copied={false} onCopy={onCopy} />)
    await user.click(screen.getByRole('button', { name: 'Copy' }))
    expect(onCopy).toHaveBeenCalled()
  })

  it('renders a QR code (svg) for the short url', () => {
    const { container } = render(<ShortenResult result={RESULT} copied={false} onCopy={vi.fn()} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
