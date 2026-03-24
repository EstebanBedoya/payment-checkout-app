import { configureStore } from '@reduxjs/toolkit'
import { processPayment } from './payment.thunks'
import paymentReducer from './payment.slice'
import checkoutReducer from '../checkout/checkout.slice'
import * as api from '../../api/transactions.api'

jest.mock('../../api/transactions.api')

const mockApi = api as jest.Mocked<typeof api>

describe('payment thunks', () => {
  it('processPayment success dispatches correct actions', async () => {
    const store = configureStore({
      reducer: { payment: paymentReducer, checkout: checkoutReducer }
    })

    const mockResult = { transactionId: 'txn-123', reference: 'ref', status: 'APPROVED', amountInCents: 1000, wompiTransactionId: 'wt-123' }
    mockApi.createTransaction.mockResolvedValueOnce(mockResult)

    await store.dispatch(processPayment({
      customerId: '1', productId: 'p1', cardTokenId: 'ct1', installments: 1, acceptanceToken: 'at1', customerEmail: 'a@a.com', address: 'a', city: 'c'
    }))

    const state = store.getState()
    expect(state.payment.result).toEqual(mockResult)
    expect(state.checkout.transactionId).toBe('txn-123')
    expect(state.checkout.step).toBe(4)
  })

  it('processPayment failure dispatches error', async () => {
    const store = configureStore({
      reducer: { payment: paymentReducer, checkout: checkoutReducer }
    })

    mockApi.createTransaction.mockRejectedValueOnce(new Error('Payment failed'))

    await store.dispatch(processPayment({} as any))

    const state = store.getState()
    expect(state.payment.error).toBe('Payment failed')
  })
})
