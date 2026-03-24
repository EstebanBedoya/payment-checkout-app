import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { ITransactionRepository } from '../domain/transaction.repository.port'
import { Transaction, TransactionStatus } from '../domain/transaction.entity'

@Injectable()
export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Omit<Transaction, 'id' | 'createdAt' | 'delivery'>): Promise<Transaction> {
    return this.prisma.transaction.create({ data }) as any
  }

  async updateStatus(id: string, status: TransactionStatus, wompiId?: string): Promise<void> {
    await this.prisma.transaction.update({
      where: { id },
      data: {
        status,
        wompiTransactionId: wompiId ?? undefined,
        finalizedAt: status !== 'PENDING' ? new Date() : undefined,
      },
    })
  }

  findById(id: string): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        delivery: true,
      },
    }) as any
  }
}
