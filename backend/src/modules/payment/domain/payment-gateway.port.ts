import type { Result } from '../../../shared/result'
import type { DomainError } from '../../../shared/domain-errors'
import type { CreateTransactionParams, WompiTransaction } from './payment.types'

export interface IPaymentGateway {
  createTransaction(params: CreateTransactionParams): Promise<Result<WompiTransaction, DomainError>>
  getTransactionStatus(wompiId: string): Promise<Result<WompiTransaction, DomainError>>
}
