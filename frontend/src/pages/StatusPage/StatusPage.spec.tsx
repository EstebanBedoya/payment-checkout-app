import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import checkoutReducer from '../../store/checkout/checkout.slice'
import paymentReducer from '../../store/payment/payment.slice'
import * as paymentThunks from '../../store/payment/payment.thunks'
import { StatusPage } from './StatusPage'

jest.mock('../../store/payment/payment.thunks', () => ({
  fetchTransactionStatus: jest.fn()
}))

const makeStore = (initialPaymentState = {}, initialCheckoutState = {}) => configureStore({ 
  reducer: { 
    checkout: checkoutReducer, 
    payment: paymentReducer
  },
  preloadedState: {
    checkout: { step: 4, productId: 'p1', transactionId: null, ...initialCheckoutState },
    payment: {
      tokenId: null,
      acceptanceToken: null,
      amounts: null,
      result: null,
      loading: false,
      error: null,
      ...initialPaymentState
    }
  } 
})


describe('StatusPage', () => {
  it('renders success status when payment is APPROVED', () => {
    const store = makeStore({
      result: { transactionId: 'tr_123', reference: 'REF123', status: 'APPROVED', amountInCents: 100000 },
      loading: false
    })

    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>
    )

    expect(screen.getByText(/pago exitoso/i)).toBeInTheDocument()
  })


  it('renders error status when payment is DECLINED', () => {
    const store = makeStore({
      result: { transactionId: 'tr_124', reference: 'REF124', status: 'DECLINED', amountInCents: 100000 },
      loading: false,
      error: 'La tarjeta no tiene fondos'
    })


    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>
    )

    expect(screen.getByText(/pago rechazado/i)).toBeInTheDocument()
  })

  it('shows loading state when loading is true', () => {
    const store = makeStore({
      loading: true,
      result: null
    })

    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>
    )

    expect(screen.getByText(/verificando el estado/i)).toBeInTheDocument()
  })

  it('shows pending status when payment is PENDING', () => {
    const store = makeStore({
      result: { transactionId: 'tr_125', reference: 'REF125', status: 'PENDING', amountInCents: 100000 },
      loading: false
    })

    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>
    )

    expect(screen.getByText(/pago pendiente/i)).toBeInTheDocument()
  })

  it('calls onRestart when button is clicked', () => {
    const onRestart = jest.fn()
    const store = makeStore({
      result: { transactionId: 'tr_123', reference: 'REF123', status: 'APPROVED', amountInCents: 100000 },
    })

    render(
      <Provider store={store}>
        <StatusPage onRestart={onRestart} />
      </Provider>
    )

    fireEvent.click(screen.getByText(/volver al inicio/i))
    expect(onRestart).toHaveBeenCalledTimes(1)
  })

  it('dispatches fetchTransactionStatus on refresh when transactionId exists but result is null', () => {
    const mockThunkAction = { type: 'payment/fetchStatus' }
    const mockFetch = paymentThunks.fetchTransactionStatus as jest.Mock
    mockFetch.mockReturnValue(mockThunkAction)

    const store = makeStore(
      { result: null, loading: false },
      { transactionId: 'tr_123' }
    )

    render(
      <Provider store={store}>
        <StatusPage />
      </Provider>
    )

    expect(mockFetch).toHaveBeenCalledWith('tr_123')
  })
})
