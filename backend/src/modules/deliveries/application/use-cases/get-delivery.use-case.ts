import { Injectable, Inject } from '@nestjs/common'
import { ok, err, Result } from '../../../../shared/result'
import { DomainError, Errors } from '../../../../shared/domain-errors'
import type { Delivery } from '../../domain/delivery.entity'
import type { IDeliveryRepository } from '../../domain/delivery.repository.port'

@Injectable()
export class GetDeliveryUseCase {
  constructor(
    @Inject('IDeliveryRepository') private readonly deliveryRepo: IDeliveryRepository,
  ) {}

  async execute({ transactionId }: { transactionId: string }): Promise<Result<Delivery, DomainError>> {
    const delivery = await this.deliveryRepo.findByTransactionId(transactionId)
    if (!delivery) return err(Errors.deliveryNotFound())
    return ok(delivery)
  }
}
