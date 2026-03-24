export interface CreateTransactionParams {
  amountInCents: number
  reference: string
  cardTokenId: string
  customerEmail: string
  installments: number
  acceptanceToken: string
  currency: string
}

export interface WompiTransaction {
  id: string
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR'
  reference: string
  amountInCents: number
}
