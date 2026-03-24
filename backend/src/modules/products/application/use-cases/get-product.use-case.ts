import { Injectable, Inject } from '@nestjs/common'
import { ok, err, Result } from '../../../../shared/result'
import { DomainError, Errors } from '../../../../shared/domain-errors'
import { Product } from '../../domain/product.entity'
import type { IProductRepository } from '../../domain/product.repository.port'

@Injectable()
export class GetProductUseCase {
  constructor(@Inject('IProductRepository') private readonly repo: IProductRepository) {}

  async execute({ productId }: { productId: string }): Promise<Result<Product, DomainError>> {
    const product = await this.repo.findById(productId)
    if (!product) return err(Errors.productNotFound())
    return ok(product)
  }
}
