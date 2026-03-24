import { createAsyncThunk } from '@reduxjs/toolkit'
import { createTransaction, type CreateTransactionPayload } from '../../api/transactions.api'
import { setResult, setError } from './payment.slice'
import { setTransactionId, setStep } from '../checkout/checkout.slice'

export const processPayment = createAsyncThunk(
  'payment/processPayment',
  async (payload: CreateTransactionPayload, { dispatch, rejectWithValue }) => {
    try {
      const result = await createTransaction(payload)
      dispatch(setResult(result))
      dispatch(setTransactionId(result.transactionId))
      dispatch(setStep(4))
      return result
    } catch (e: any) {
      dispatch(setError(e.message))
      return rejectWithValue(e.message)
    }
  }
)
