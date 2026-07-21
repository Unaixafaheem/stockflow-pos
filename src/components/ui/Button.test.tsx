import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

describe('Button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children and handles click', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Checkout</Button>)
    expect(screen.getByRole('button', { name: /checkout/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /checkout/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('respects disabled state', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Save</Button>)
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
