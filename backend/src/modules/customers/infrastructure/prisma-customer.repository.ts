import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { ICustomerRepository } from '../domain/customer.repository.port'
import { Customer } from '../domain/customer.entity'

@Injectable()
export class PrismaCustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertByEmail(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    return this.prisma.customer.upsert({
      where: { email: data.email },
      update: { name: data.name, phone: data.phone, address: data.address, city: data.city },
      create: data,
    })
  }
}
