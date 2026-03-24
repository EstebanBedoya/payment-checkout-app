import { createAsyncThunk } from '@reduxjs/toolkit'
import { createTransaction, getTransaction, type CreateTransactionPayload } from '../../api/transactions.api'
import { setResult, setError, setLoading } from './payment.slice'
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

export const fetchTransactionStatus = createAsyncThunk(
  'payment/fetchTransactionStatus',
  async (transactionId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true))
      const result = await getTransaction(transactionId)
      dispatch(setResult(result))
      return result
    } catch (e: any) {
      dispatch(setError(e.message))
      return rejectWithValue(e.message)
    } finally {
      dispatch(setLoading(false))
    }
  }
)
