import { Injectable, Inject } from '@nestjs/common'
import { ok, Result } from '../../../../shared/result'
import { DomainError } from '../../../../shared/domain-errors'
import { Product } from '../../domain/product.entity'
import type { IProductRepository } from '../../domain/product.repository.port'

@Injectable()
export class GetProductsUseCase {
  constructor(@Inject('IProductRepository') private readonly repo: IProductRepository) {}

  async execute(): Promise<Result<Product[], DomainError>> {
    return ok(await this.repo.findAll())
  }
}
