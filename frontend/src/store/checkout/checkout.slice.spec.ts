import checkoutReducer, { setStep, setProductId, setTransactionId, resetCheckout } from './checkout.slice'

describe('checkoutSlice', () => {
  const initial = { step: 1, productId: null, transactionId: null }

  it('setStep updates step', () => {
    const s = checkoutReducer(initial, setStep(2))
    expect(s.step).toBe(2)
  })

  it('setProductId stores productId', () => {
    const s = checkoutReducer(initial, setProductId('p1'))
    expect(s.productId).toBe('p1')
  })

  it('setTransactionId stores transactionId', () => {
    const s = checkoutReducer(initial, setTransactionId('tx1'))
    expect(s.transactionId).toBe('tx1')
  })

  it('resetCheckout clears all fields', () => {
    const dirty = { step: 3, productId: 'p1', transactionId: 'tx1' }
    const s = checkoutReducer(dirty, resetCheckout())
    expect(s).toEqual(initial)
  })
})
