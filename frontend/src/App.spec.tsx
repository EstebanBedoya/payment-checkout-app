import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from './store'
import checkoutReducer from './store/checkout/checkout.slice'
import productReducer from './store/product/product.slice'
import paymentReducer from './store/payment/payment.slice'
import App from './App'

const mockGetTransaction = jest.fn()

jest.mock('./api/transactions.api', () => ({
  getTransaction: (...args: unknown[]) => mockGetTransaction(...args),
}))

jest.mock('./api/customers.api', () => ({
  upsertCustomer: jest.fn(),
}))

jest.mock('./api/products.api', () => ({
  fetchProduct: jest.fn().mockResolvedValue({
    id: 'p1',
    name: 'Test Product',
    description: 'Test Description',
    imageUrl: 'https://example.com/image.jpg',
    priceInCents: 15000000,
    stock: 10,
  }),
  fetchProducts: jest.fn().mockResolvedValue([{
    id: 'p1',
    name: 'Test Product',
    description: 'Test Description',
    imageUrl: 'https://example.com/image.jpg',
    priceInCents: 15000000,
    stock: 10,
  }]),
}))

jest.mock('./adapters/wompi/wompi-tokenization.adapter', () => ({
  WompiTokenizationAdapter: jest.fn().mockImplementation(() => ({
    tokenizeCard: jest.fn().mockResolvedValue({ success: true, tokenId: 'tok_test' }),
    getAcceptanceToken: jest.fn().mockResolvedValue({ success: true, token: 'acc_test' }),
  })),
}))

jest.mock('./store/payment/payment.thunks', () => {
  const actual = jest.requireActual('./store/payment/payment.thunks')
  return {
    processPayment: jest.fn(),
    fetchTransactionStatus: actual.fetchTransactionStatus,
  }
})

const makeStore = (initialCheckoutState = {}, initialPaymentState = {}) => {
  const store = configureStore({
    reducer: {
      checkout: checkoutReducer,
      product: productReducer,
      payment: paymentReducer,
    },
    preloadedState: {
      checkout: { step: 1, productId: null, transactionId: null, ...initialCheckoutState },
      payment: {
        tokenId: null,
        acceptanceToken: null,
        amounts: null,
        result: null,
        loading: false,
        error: null,
        ...initialPaymentState,
      },
    },
  })
  return store
}

const renderWithProviders = (ui: React.ReactElement, store = makeStore()) => {
  return render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {ui}
      </PersistGate>
    </Provider>
  )
}

describe('App Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('step 1 → renders ProductPage', () => {
    const store = makeStore({ step: 1, productId: null })
    renderWithProviders(<App />, store)
  })

  it('step 2 → renders CheckoutPage with CreditCardForm', () => {
    const store = makeStore({ step: 2, productId: 'p1' })
    renderWithProviders(<App />, store)
    expect(screen.getByLabelText(/número de tarjeta/i)).toBeInTheDocument()
  })

  it('step 2.5 → renders CheckoutPage with DeliveryForm', () => {
    const store = makeStore({ step: 2.5, productId: 'p1' })
    renderWithProviders(<App />, store)
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
  })

  it('step 3 → renders CheckoutPage with SummaryBackdrop', () => {
    const store = makeStore(
      { step: 3, productId: 'p1', transactionId: null },
      {
        tokenId: 'tok_123',
        acceptanceToken: 'acc_123',
        amounts: { productPrice: 15000000, baseFee: 300000, deliveryFee: 500000, total: 15800000 },
      }
    )
    renderWithProviders(<App />, store)
    expect(screen.getByText(/resumen de pago/i)).toBeInTheDocument()
  })

  it('step 4 → renders StatusPage', () => {
    const store = makeStore(
      { step: 4, productId: 'p1', transactionId: 'tx_123' },
      {
        result: { transactionId: 'tx_123', reference: 'REF123', status: 'APPROVED', amountInCents: 15800000, wompiTransactionId: null },
      }
    )
    renderWithProviders(<App />, store)
    expect(screen.getByText(/pago exitoso/i)).toBeInTheDocument()
  })
})

describe('App onRestart', () => {
  it('clicking "Volver al inicio" from StatusPage resets to step 1', async () => {
    const store = makeStore(
      { step: 4, productId: 'p1', transactionId: 'tx_123' },
      {
        result: { transactionId: 'tx_123', reference: 'REF123', status: 'APPROVED', amountInCents: 15800000, wompiTransactionId: null },
      }
    )
    renderWithProviders(<App />, store)
    expect(screen.getByText(/pago exitoso/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/volver al inicio/i))

    expect(store.getState().checkout.step).toBe(1)
  })
})

describe('App Refresh Recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('on init with persisted transactionId, fetches transaction and navigates to step 4', async () => {
    mockGetTransaction.mockResolvedValue({
      transactionId: 'tx_123',
      reference: 'REF123',
      status: 'APPROVED',
      amountInCents: 15800000,
      wompiTransactionId: 'wompi_123',
    })

    const store = makeStore({ step: 1, productId: 'p1', transactionId: 'tx_123' })
    renderWithProviders(<App />, store)

    await waitFor(() => {
      expect(mockGetTransaction).toHaveBeenCalledWith('tx_123')
    })

    await waitFor(() => {
      expect(screen.getByText(/pago exitoso/i)).toBeInTheDocument()
    })
  })

  it('on init with finalized transaction (non-APPROVED), navigates to step 4 with error state', async () => {
    mockGetTransaction.mockResolvedValue({
      transactionId: 'tx_456',
      reference: 'REF456',
      status: 'DECLINED',
      amountInCents: 15800000,
      wompiTransactionId: 'wompi_456',
    })

    const store = makeStore({ step: 1, productId: 'p1', transactionId: 'tx_456' })
    renderWithProviders(<App />, store)

    await waitFor(() => {
      expect(mockGetTransaction).toHaveBeenCalledWith('tx_456')
    })

    await waitFor(() => {
      expect(screen.getByText(/pago rechazado/i)).toBeInTheDocument()
    })
  })
})
