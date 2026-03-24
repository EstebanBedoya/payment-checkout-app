// @ts-ignore
const BASE = typeof process !== 'undefined' ? process.env.VITE_API_URL || 'http://localhost:3000' : import.meta.env.VITE_API_URL

export interface CreateTransactionPayload {
  customerId: string; productId: string; cardTokenId: string
  installments: number; acceptanceToken: string; customerEmail: string
  address: string; city: string
}

export interface TransactionResult {
  transactionId: string; reference: string; status: string
  amountInCents: number; wompiTransactionId: string | null
  delivery?: { id: string; address: string; city: string; status: string } | null
}

export const createTransaction = async (payload: CreateTransactionPayload): Promise<TransactionResult> => {
  const res = await fetch(`${BASE}/transactions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Payment failed') }
  return (await res.json()).data
}

export const getTransaction = async (id: string): Promise<TransactionResult> => {
  const res = await fetch(`${BASE}/transactions/${id}`)
  if (!res.ok) throw new Error('Transaction not found')
  return (await res.json()).data
}
