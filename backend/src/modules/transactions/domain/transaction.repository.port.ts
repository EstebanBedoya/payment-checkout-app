import type { Transaction, TransactionStatus } from './transaction.entity'

export interface ITransactionRepository {
  create(data: Omit<Transaction, 'id' | 'createdAt' | 'delivery'>): Promise<Transaction>
  updateStatus(id: string, status: TransactionStatus, wompiId?: string): Promise<void>
  findById(id: string): Promise<Transaction | null>
}
