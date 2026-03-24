import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TransactionResult } from '../../api/transactions.api'

interface PaymentState {
  tokenId: string | null
  acceptanceToken: string | null
  amounts: { productPrice: number; baseFee: number; deliveryFee: number; total: number } | null
  result: TransactionResult | null
  loading: boolean
  error: string | null
}

const initialState: PaymentState = { tokenId: null, acceptanceToken: null, amounts: null, result: null, loading: false, error: null }

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setTokenId: (s, a: PayloadAction<string>) => { s.tokenId = a.payload },
    setAcceptanceToken: (s, a: PayloadAction<string>) => { s.acceptanceToken = a.payload },
    setAmounts: (s, a: PayloadAction<PaymentState['amounts']>) => { s.amounts = a.payload },
    setResult: (s, a: PayloadAction<TransactionResult>) => { s.result = a.payload },
    setLoading: (s, a: PayloadAction<boolean>) => { s.loading = a.payload },
    setError: (s, a: PayloadAction<string | null>) => { s.error = a.payload },
    resetPayment: () => initialState,
  },
})
export const { setTokenId, setAcceptanceToken, setAmounts, setResult, setLoading, setError, resetPayment } = paymentSlice.actions
export default paymentSlice.reducer
