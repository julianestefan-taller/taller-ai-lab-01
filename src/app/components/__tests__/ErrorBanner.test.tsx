// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { ErrorBanner } from '../ErrorBanner'

describe('ErrorBanner', () => {
  it('renders nothing when error is null', () => {
    const { container } = render(<ErrorBanner error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the error message when present', () => {
    render(<ErrorBanner error="Invalid URL" />)
    expect(screen.getByText('Invalid URL')).toBeInTheDocument()
  })
})
