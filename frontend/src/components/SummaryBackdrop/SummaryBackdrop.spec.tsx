import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { SummaryBackdrop } from './SummaryBackdrop'

const amounts = { productPrice: 15000000, baseFee: 300000, deliveryFee: 500000, total: 15800000 }

describe('SummaryBackdrop', () => {
  it('renders price breakdown', () => {
    render(<SummaryBackdrop amounts={amounts} onConfirm={jest.fn()} onBack={jest.fn()} loading={false} />)
    expect(screen.getByText(/base fee/i)).toBeInTheDocument()
    expect(screen.getByText(/delivery/i)).toBeInTheDocument()
  })

  it('disables confirm button while loading', () => {
    render(<SummaryBackdrop amounts={amounts} onConfirm={jest.fn()} onBack={jest.fn()} loading={true} />)
    expect(screen.getByRole('button', { name: /procesando/i })).toBeDisabled()
  })

  it('calls onConfirm when button clicked', () => {
    const onConfirm = jest.fn()
    render(<SummaryBackdrop amounts={amounts} onConfirm={onConfirm} onBack={jest.fn()} loading={false} />)
    fireEvent.click(screen.getByRole('button', { name: /confirmar pago/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onBack when volver is clicked', () => {
    const onBack = jest.fn()
    render(<SummaryBackdrop amounts={amounts} onConfirm={jest.fn()} onBack={onBack} loading={false} />)
    fireEvent.click(screen.getByRole('button', { name: /volver/i }))
    expect(onBack).toHaveBeenCalled()
  })

  it('moves focus into the dialog on mount', () => {
    render(<SummaryBackdrop amounts={amounts} onConfirm={jest.fn()} onBack={jest.fn()} loading={false} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('closes on Escape key when not loading', () => {
    const onBack = jest.fn()
    render(<SummaryBackdrop amounts={amounts} onConfirm={jest.fn()} onBack={onBack} loading={false} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onBack).toHaveBeenCalled()
  })

  it('does not close on Escape when loading', () => {
    const onBack = jest.fn()
    render(<SummaryBackdrop amounts={amounts} onConfirm={jest.fn()} onBack={onBack} loading={true} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onBack).not.toHaveBeenCalled()
  })

  it('has role=dialog and aria-modal=true', () => {
    render(<SummaryBackdrop amounts={amounts} onConfirm={jest.fn()} onBack={jest.fn()} loading={false} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })
})
