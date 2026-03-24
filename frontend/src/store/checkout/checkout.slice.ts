import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CheckoutState { step: number; productId: string | null; transactionId: string | null }
const initialState: CheckoutState = { step: 1, productId: null, transactionId: null }

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setStep: (s, a: PayloadAction<number>) => { s.step = a.payload },
    setProductId: (s, a: PayloadAction<string>) => { s.productId = a.payload },
    setTransactionId: (s, a: PayloadAction<string>) => { s.transactionId = a.payload },
    resetCheckout: () => initialState,
  },
})
export const { setStep, setProductId, setTransactionId, resetCheckout } = checkoutSlice.actions
export default checkoutSlice.reducer
