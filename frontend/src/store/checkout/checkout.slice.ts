import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type CheckoutStep = 1 | 2 | 2.5 | 3 | 4
interface CheckoutState { step: CheckoutStep; productId: string | null; transactionId: string | null }
const initialState: CheckoutState = { step: 1, productId: null, transactionId: null }

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setStep: (s, a: PayloadAction<CheckoutStep>) => { s.step = a.payload },
    setProductId: (s, a: PayloadAction<string | null>) => { s.productId = a.payload },
    setTransactionId: (s, a: PayloadAction<string>) => { s.transactionId = a.payload },
    resetCheckout: () => initialState,
  },
})
export const { setStep, setProductId, setTransactionId, resetCheckout } = checkoutSlice.actions
export default checkoutSlice.reducer
