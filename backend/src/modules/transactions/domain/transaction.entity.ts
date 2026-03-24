export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR'

export interface Transaction {
  id: string
  reference: string
  customerId: string
  productId: string
  amountInCents: number
  baseFeeInCents: number
  deliveryFeeInCents: number
  status: TransactionStatus
  wompiTransactionId: string | null
  cardTokenId: string
  installments: number
  finalizedAt: Date | null
  createdAt: Date
  delivery?: unknown
}
