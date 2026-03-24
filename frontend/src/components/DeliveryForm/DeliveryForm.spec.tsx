import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeliveryForm } from './DeliveryForm'

describe('DeliveryForm', () => {
  it('submit disabled when empty', () => {
    render(<DeliveryForm onSubmit={jest.fn()} />)
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled()
  })

  it('calls onSubmit when valid', () => {
    const onSubmit = jest.fn()
    render(<DeliveryForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText(/nombre/i), { target: { value: 'Juan Perez' } })
    fireEvent.change(screen.getByPlaceholderText(/correo/i), { target: { value: 'juan@test.com' } })
    fireEvent.change(screen.getByPlaceholderText(/teléfono/i), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByPlaceholderText(/dirección/i), { target: { value: 'Calle 123' } })
    fireEvent.change(screen.getByPlaceholderText(/ciudad/i), { target: { value: 'Bogota' } })
    
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Juan Perez',
      email: 'juan@test.com',
      phone: '3001234567',
      address: 'Calle 123',
      city: 'Bogota'
    })
  })

  it('shows error for invalid email', () => {
    render(<DeliveryForm onSubmit={jest.fn()} />)
    const emailInput = screen.getByPlaceholderText(/correo/i)
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } })
    fireEvent.blur(emailInput)
    expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/correo inválido/i)).toBeInTheDocument()
  })
})
