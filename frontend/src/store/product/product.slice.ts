import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Product } from '../../api/products.api'

interface ProductState {
  product: Product | null
  loading: boolean
  error: string | null
}

const initialState: ProductState = { product: null, loading: false, error: null }

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setProduct: (s, a: PayloadAction<Product>) => { s.product = a.payload },
    setLoading: (s, a: PayloadAction<boolean>) => { s.loading = a.payload },
    setError: (s, a: PayloadAction<string | null>) => { s.error = a.payload },
  },
})
export const { setProduct, setLoading, setError } = productSlice.actions
export default productSlice.reducer
