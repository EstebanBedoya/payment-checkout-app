import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { IProductRepository } from '../domain/product.repository.port'
import { Product } from '../domain/product.entity'

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } })
  }

  findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'asc' } })
  }

  async decrementStock(productId: string, tx?: any): Promise<void> {
    const client = tx ?? this.prisma
    await client.product.update({
      where: { id: productId },
      data: { stock: { decrement: 1 } },
    })
  }
}
