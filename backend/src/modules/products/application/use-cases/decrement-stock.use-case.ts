import { Injectable, Inject } from '@nestjs/common'
import { ok, err, Result } from '../../../../shared/result'
import { DomainError, Errors } from '../../../../shared/domain-errors'
import type { IProductRepository } from '../../domain/product.repository.port'

@Injectable()
export class DecrementStockUseCase {
  constructor(@Inject('IProductRepository') private readonly repo: IProductRepository) {}

  async execute({ productId, tx }: { productId: string; tx?: any }): Promise<Result<void, DomainError>> {
    const product = await this.repo.findById(productId)
    if (!product) return err(Errors.productNotFound())
    if (product.stock <= 0) return err(Errors.stockUnavailable())
    await this.repo.decrementStock(productId, tx)
    return ok(undefined)
  }
}
