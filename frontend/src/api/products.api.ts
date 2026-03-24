const BASE = typeof process !== 'undefined' && process.env ? (process.env.VITE_API_URL || 'http://localhost:3001') : 'http://localhost:3001'

export interface Product { id: string; name: string; description: string; imageUrl: string; priceInCents: number; stock: number }

export const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch(`${BASE}/products`)
  if (!res.ok) throw new Error('Failed to fetch products')
  const json = await res.json()
  return json.data
}

export const fetchProduct = async (id: string): Promise<Product> => {
  const res = await fetch(`${BASE}/products/${id}`)
  if (!res.ok) throw new Error('Product not found')
  const json = await res.json()
  return json.data
}
