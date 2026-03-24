import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import checkoutReducer from '../../store/checkout/checkout.slice'
import paymentReducer from '../../store/payment/payment.slice'
import productReducer from '../../store/product/product.slice'
import { CheckoutPage } from './CheckoutPage'

jest.mock('../../api/customers.api', () => ({
  upsertCustomer: jest.fn(() => Promise.resolve({ id: 'c1', name: 'Test', email: 'test@test.com' })),
}))

jest.mock('../../api/products.api', () => ({
  fetchProduct: jest.fn(() => Promise.resolve({ id: 'p1', name: 'Product', priceInCents: 15000000, stock: 5 })),
}))

jest.mock('../../adapters/wompi/wompi-tokenization.adapter', () => ({
  WompiTokenizationAdapter: jest.fn().mockImplementation(() => ({
    tokenizeCard: jest.fn(() => Promise.resolve({ success: true, tokenId: 'tok_test' })),
    getAcceptanceToken: jest.fn(() => Promise.resolve({ success: true, token: 'acc_test' })),
  })),
}))

jest.mock('../../store/payment/payment.thunks', () => ({
  processPayment: jest.fn(),
}))

const makeStore = (step: number = 2, paymentState = {}) => configureStore({
  reducer: {
    checkout: checkoutReducer,
    payment: paymentReducer,
    product: productReducer,
  },
  preloadedState: {
    checkout: { step, productId: 'p1', transactionId: null },
    payment: {
      tokenId: null,
      acceptanceToken: null,
      amounts: null,
      result: null,
      loading: false,
      error: null,
      ...paymentState,
    },
  },
})

describe('CheckoutPage', () => {
  it('renders CreditCardForm at step 2', () => {
    const store = makeStore(2)
    render(
      <Provider store={store}>
        <CheckoutPage />
      </Provider>
    )
    expect(screen.getByLabelText(/número de tarjeta/i)).toBeInTheDocument()
  })

  it('shows SummaryBackdrop at step 3', () => {
    const store = makeStore(3, {
      amounts: { productPrice: 15000000, baseFee: 300000, deliveryFee: 500000, total: 15800000 },
    })
    render(
      <Provider store={store}>
        <CheckoutPage />
      </Provider>
    )
    expect(screen.getByText(/resumen de pago/i)).toBeInTheDocument()
  })

  it('renders error message when error is set', () => {
    const store = makeStore(2, {
      error: 'Test error message'
    })
    render(
      <Provider store={store}>
        <CheckoutPage />
      </Provider>
    )
    expect(screen.getByText(/test error message/i)).toBeInTheDocument()
  })

  it('submitting CreditCardForm advances to step 2.5 (DeliveryForm)', async () => {
    const store = makeStore(2)
    render(
      <Provider store={store}>
        <CheckoutPage />
      </Provider>
    )

    fireEvent.change(screen.getByLabelText(/número de tarjeta/i), { target: { value: '4111 1111 1111 1111' } })
    fireEvent.change(screen.getByLabelText(/nombre del titular/i), { target: { value: 'Juan Perez' } })
    fireEvent.change(screen.getByLabelText(/mes exp/i), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText(/año exp/i), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText(/cvv/i), { target: { value: '123' } })

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    })
  })

  it('back button in SummaryBackdrop goes back to step 2', async () => {
    const store = makeStore(3, {
      amounts: { productPrice: 15000000, baseFee: 300000, deliveryFee: 500000, total: 15800000 },
    })
    render(
      <Provider store={store}>
        <CheckoutPage />
      </Provider>
    )

    expect(screen.getByText(/resumen de pago/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /volver/i }))

    await waitFor(() => {
      expect(store.getState().checkout.step).toBe(2)
    })
  })

  it('full flow: card → delivery → step 3 with SummaryBackdrop', async () => {
    const store = makeStore(2)
    render(
      <Provider store={store}>
        <CheckoutPage />
      </Provider>
    )

    // Step 1: submit card form
    fireEvent.change(screen.getByLabelText(/número de tarjeta/i), { target: { value: '4111 1111 1111 1111' } })
    fireEvent.change(screen.getByLabelText(/nombre del titular/i), { target: { value: 'Juan Perez' } })
    fireEvent.change(screen.getByLabelText(/mes exp/i), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText(/año exp/i), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText(/cvv/i), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    // Step 2: submit delivery form
    await waitFor(() => expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Juan Perez' } })
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'juan@test.com' } })
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByLabelText(/dirección/i), { target: { value: 'Calle 123 #45' } })
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Bogota' } })
    fireEvent.click(screen.getByRole('button', { name: /continuar a pago/i }))

    await waitFor(() => {
      expect(store.getState().checkout.step).toBe(3)
    })
  })
})
