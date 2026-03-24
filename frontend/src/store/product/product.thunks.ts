import { createAsyncThunk } from '@reduxjs/toolkit'
import { fetchProduct as apiFetchProduct } from '../../api/products.api'

export const fetchProduct = createAsyncThunk('product/fetchProduct', async (id: string) => {
  return await apiFetchProduct(id)
})
