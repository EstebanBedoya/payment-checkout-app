import type { Delivery } from './delivery.entity'

export interface IDeliveryRepository {
  create(data: Omit<Delivery, 'id' | 'createdAt'>, tx?: unknown): Promise<Delivery>
  findByTransactionId(transactionId: string): Promise<Delivery | null>
}
