import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { ProductsController } from './products.controller'
import { PrismaProductRepository } from './prisma-product.repository'
import { GetProductUseCase } from '../application/use-cases/get-product.use-case'
import { GetProductsUseCase } from '../application/use-cases/get-products.use-case'
import { DecrementStockUseCase } from '../application/use-cases/decrement-stock.use-case'

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [
    { provide: 'IProductRepository', useClass: PrismaProductRepository },
    GetProductUseCase,
    GetProductsUseCase,
    DecrementStockUseCase,
  ],
  exports: [GetProductUseCase, DecrementStockUseCase],
})
export class ProductsModule {}
