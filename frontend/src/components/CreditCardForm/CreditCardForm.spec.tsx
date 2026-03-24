import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { CreditCardForm } from './CreditCardForm'

describe('CreditCardForm', () => {
  it('shows Visa logo when card starts with 4', () => {
    render(<CreditCardForm onSubmit={jest.fn()} />)
    const input = screen.getByPlaceholderText(/número de tarjeta/i)
    fireEvent.change(input, { target: { value: '4111 1111 1111 1111' } })
    expect(screen.getByAltText(/visa/i)).toBeInTheDocument()
  })

  it('shows MasterCard logo when card starts with 5', () => {
    render(<CreditCardForm onSubmit={jest.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/número de tarjeta/i), { target: { value: '5500 0055 5555 5559' } })
    expect(screen.getByAltText(/mastercard/i)).toBeInTheDocument()
  })

  it('submit button disabled when form invalid', () => {
    render(<CreditCardForm onSubmit={jest.fn()} />)
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled()
  })

  it('shows validation errors with aria-invalid and role=alert', () => {
    render(<CreditCardForm onSubmit={jest.fn()} />)
    const numberInput = screen.getByPlaceholderText(/número de tarjeta/i)
    fireEvent.change(numberInput, { target: { value: '111' } })
    fireEvent.blur(numberInput)
    expect(numberInput).toHaveAttribute('aria-invalid', 'true')
    const alert = screen.getByText(/número inválido/i)
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveAttribute('role', 'alert')
  })

  it('calls onSubmit with card data when valid', async () => {
    const onSubmit = jest.fn()
    render(<CreditCardForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText(/número de tarjeta/i), { target: { value: '4111 1111 1111 1111' } })
    fireEvent.change(screen.getByPlaceholderText(/titular/i), { target: { value: 'Juan Perez' } })
    fireEvent.change(screen.getByPlaceholderText(/mm/i), { target: { value: '12' } })
    fireEvent.change(screen.getByPlaceholderText(/yy/i), { target: { value: '28' } })
    fireEvent.change(screen.getByPlaceholderText(/cvv/i), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onSubmit).toHaveBeenCalledWith({ number: '4111111111111111', cardHolder: 'Juan Perez', expMonth: '12', expYear: '28', cvc: '123' })
  })
})
