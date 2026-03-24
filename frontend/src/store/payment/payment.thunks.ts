import { createAsyncThunk } from '@reduxjs/toolkit'
import { createTransaction, CreateTransactionPayload } from '../../api/transactions.api'

export const processPayment = createAsyncThunk('payment/processPayment', async (payload: CreateTransactionPayload) => {
  return await createTransaction(payload)
})
