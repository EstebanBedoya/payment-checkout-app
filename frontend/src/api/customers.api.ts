const BASE = import.meta.env.VITE_API_URL

export interface CustomerPayload { name: string; email: string; phone: string; address: string; city: string }
export interface Customer { id: string; name: string; email: string }

export const upsertCustomer = async (payload: CustomerPayload): Promise<Customer> => {
  const res = await fetch(`${BASE}/customers`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? 'Failed to save customer') }
  return (await res.json()).data
}
