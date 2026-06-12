// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ShortenForm } from '../ShortenForm'

function renderForm(overrides: Partial<Parameters<typeof ShortenForm>[0]> = {}) {
  const props = {
    url: '',
    customCode: '',
    loading: false,
    onUrlChange: vi.fn(),
    onCustomCodeChange: vi.fn(),
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    ...overrides,
  }
  render(<ShortenForm {...props} />)
  return props
}

describe('ShortenForm', () => {
  it('renders the url input and submit button', () => {
    renderForm()
    expect(screen.getByPlaceholderText(/very\/long\/url/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Shorten URL' })).toBeInTheDocument()
  })

  it('disables the submit button when the url is empty', () => {
    renderForm({ url: '' })
    expect(screen.getByRole('button', { name: 'Shorten URL' })).toBeDisabled()
  })

  it('enables the submit button when a url is present', () => {
    renderForm({ url: 'https://example.com' })
    expect(screen.getByRole('button', { name: 'Shorten URL' })).toBeEnabled()
  })

  it('calls onUrlChange as the user types', async () => {
    const user = userEvent.setup()
    const props = renderForm()
    await user.type(screen.getByPlaceholderText(/very\/long\/url/i), 'x')
    expect(props.onUrlChange).toHaveBeenCalledWith('x')
  })

  it('shows the loading state and disables inputs', () => {
    renderForm({ url: 'https://example.com', loading: true })
    expect(screen.getByRole('button', { name: /shortening/i })).toBeDisabled()
    expect(screen.getByPlaceholderText(/very\/long\/url/i)).toBeDisabled()
  })

  it('fires onSubmit when the form is submitted', async () => {
    const user = userEvent.setup()
    const props = renderForm({ url: 'https://example.com' })
    await user.click(screen.getByRole('button', { name: 'Shorten URL' }))
    expect(props.onSubmit).toHaveBeenCalled()
  })
})
