import { ok, type Result } from '../../../../shared/result'
import type { DomainError } from '../../../../shared/domain-errors'
import type { IPaymentGateway } from '../../domain/payment-gateway.port'
import type { CreateTransactionParams, WompiTransaction } from '../../domain/payment.types'

export class WompiPaymentAdapterMock implements IPaymentGateway {
  private _status: WompiTransaction['status'] = 'APPROVED'

  setStatus(status: WompiTransaction['status']): void {
    this._status = status
  }

  async createTransaction(
    params: CreateTransactionParams,
  ): Promise<Result<WompiTransaction, DomainError>> {
    return ok({
      id: 'mock-wt-id',
      status: this._status,
      reference: params.reference,
      amountInCents: params.amountInCents,
    })
  }

  async getTransactionStatus(wompiId: string): Promise<Result<WompiTransaction, DomainError>> {
    return ok({
      id: wompiId,
      status: this._status,
      reference: 'mock-ref',
      amountInCents: 0,
    })
  }
}
