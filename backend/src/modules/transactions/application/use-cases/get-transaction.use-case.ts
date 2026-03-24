import { Injectable, Inject } from '@nestjs/common'
import { ok, err, Result } from '../../../../shared/result'
import { DomainError, Errors } from '../../../../shared/domain-errors'
import type { Transaction } from '../../domain/transaction.entity'
import type { ITransactionRepository } from '../../domain/transaction.repository.port'

@Injectable()
export class GetTransactionUseCase {
  constructor(
    @Inject('ITransactionRepository') private readonly txRepo: ITransactionRepository,
  ) {}

  async execute({ transactionId }: { transactionId: string }): Promise<Result<Transaction, DomainError>> {
    const transaction = await this.txRepo.findById(transactionId)
    if (!transaction) return err(Errors.transactionNotFound())
    return ok(transaction)
  }
}
