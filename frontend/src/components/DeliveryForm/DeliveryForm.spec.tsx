import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeliveryForm } from './DeliveryForm'

describe('DeliveryForm', () => {
  it('renders visible labels for all inputs', () => {
    render(<DeliveryForm onSubmit={jest.fn()} />)
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ciudad/i)).toBeInTheDocument()
  })

  it('submit disabled when empty', () => {
    render(<DeliveryForm onSubmit={jest.fn()} />)
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled()
  })

  it('calls onSubmit when valid', () => {
    const onSubmit = jest.fn()
    render(<DeliveryForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Juan Perez' } })
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'juan@test.com' } })
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByLabelText(/dirección/i), { target: { value: 'Calle 123' } })
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Bogota' } })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Juan Perez',
      email: 'juan@test.com',
      phone: '3001234567',
      address: 'Calle 123',
      city: 'Bogota',
    })
  })

  it('shows error for invalid email', () => {
    render(<DeliveryForm onSubmit={jest.fn()} />)
    const emailInput = screen.getByLabelText(/correo electrónico/i)
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } })
    fireEvent.blur(emailInput)
    expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/correo inválido/i)).toBeInTheDocument()
  })

  it('shows error for phone with less than 7 digits', () => {
    render(<DeliveryForm onSubmit={jest.fn()} />)
    const phoneInput = screen.getByLabelText(/teléfono/i)
    fireEvent.change(phoneInput, { target: { value: '123' } })
    fireEvent.blur(phoneInput)
    expect(phoneInput).toHaveAttribute('aria-invalid', 'true')
  })
})
