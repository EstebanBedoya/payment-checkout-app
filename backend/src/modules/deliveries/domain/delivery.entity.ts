export type DeliveryStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED'

export interface Delivery {
  id: string
  transactionId: string
  productId: string
  customerId: string
  address: string
  city: string
  status: DeliveryStatus
  createdAt: Date
}
