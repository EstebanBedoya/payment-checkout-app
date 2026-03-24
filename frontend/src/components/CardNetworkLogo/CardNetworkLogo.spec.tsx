import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { CardNetworkLogo } from './CardNetworkLogo'

describe('CardNetworkLogo', () => {
  it('renders nothing when network is UNKNOWN', () => {
    const { container } = render(<CardNetworkLogo network="UNKNOWN" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders Visa logo when network is VISA', () => {
    render(<CardNetworkLogo network="VISA" />)
    const logo = screen.getByAltText(/visa/i)
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/icons/visa.svg')
  })

  it('renders MasterCard logo when network is MASTERCARD', () => {
    render(<CardNetworkLogo network="MASTERCARD" />)
    const logo = screen.getByAltText(/mastercard/i)
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/icons/mastercard.svg')
  })
})
