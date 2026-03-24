import paymentReducer, { setTokenId, setAcceptanceToken, setAmounts, setResult, setLoading, setError, resetPayment } from './payment.slice'

describe('paymentSlice', () => {
  const initial = { tokenId: null, acceptanceToken: null, amounts: null, result: null, loading: false, error: null }

  it('setTokenId stores token', () => {
    const s = paymentReducer(initial, setTokenId('tok_1'))
    expect(s.tokenId).toBe('tok_1')
  })

  it('setAcceptanceToken stores token', () => {
    const s = paymentReducer(initial, setAcceptanceToken('acc_1'))
    expect(s.acceptanceToken).toBe('acc_1')
  })

  it('setAmounts stores amounts', () => {
    const amounts = { productPrice: 100, baseFee: 10, deliveryFee: 20, total: 130 }
    const s = paymentReducer(initial, setAmounts(amounts))
    expect(s.amounts).toEqual(amounts)
  })

  it('setResult stores result', () => {
    const result: any = { transactionId: 'tx1', status: 'APPROVED' }
    const s = paymentReducer(initial, setResult(result))
    expect(s.result).toEqual(result)
  })

  it('setLoading updates loading', () => {
    const s = paymentReducer(initial, setLoading(true))
    expect(s.loading).toBe(true)
  })

  it('setError updates error', () => {
    const s = paymentReducer(initial, setError('err'))
    expect(s.error).toBe('err')
  })

  it('resetPayment clears all', () => {
    const dirty = { tokenId: 't', acceptanceToken: 'a', amounts: { productPrice: 1, baseFee: 2, deliveryFee: 3, total: 6 }, result: null, loading: true, error: 'e' }
    const s = paymentReducer(dirty, resetPayment())
    expect(s).toEqual(initial)
  })
})
