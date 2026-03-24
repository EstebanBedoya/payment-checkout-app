import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { IDeliveryRepository } from '../domain/delivery.repository.port'
import { Delivery } from '../domain/delivery.entity'

@Injectable()
export class PrismaDeliveryRepository implements IDeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Omit<Delivery, 'id' | 'createdAt'>, tx?: any): Promise<Delivery> {
    const client = tx ?? this.prisma
    return client.delivery.create({ data }) as any
  }

  findByTransactionId(transactionId: string): Promise<Delivery | null> {
    return this.prisma.delivery.findUnique({ where: { transactionId } }) as any
  }
}
