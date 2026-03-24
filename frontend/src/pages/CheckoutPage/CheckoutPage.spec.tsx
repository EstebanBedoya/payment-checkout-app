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
})
