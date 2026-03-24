import productReducer, { setProduct, setLoading, setError } from './product.slice'

describe('productSlice', () => {
  const initial = { product: null, loading: false, error: null }

  it('setProduct stores product', () => {
    const product: any = { id: 'p1', name: 'Product 1' }
    const s = productReducer(initial, setProduct(product))
    expect(s.product).toEqual(product)
  })

  it('setLoading updates loading state', () => {
    const s = productReducer(initial, setLoading(true))
    expect(s.loading).toBe(true)
  })

  it('setError updates error state', () => {
    const s = productReducer(initial, setError('err'))
    expect(s.error).toBe('err')
  })
})
