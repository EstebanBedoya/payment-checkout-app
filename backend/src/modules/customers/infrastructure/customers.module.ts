import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { CustomersController } from './customers.controller'
import { PrismaCustomerRepository } from './prisma-customer.repository'
import { UpsertCustomerUseCase } from '../application/use-cases/upsert-customer.use-case'

@Module({
  imports: [PrismaModule],
  controllers: [CustomersController],
  providers: [
    { provide: 'ICustomerRepository', useClass: PrismaCustomerRepository },
    UpsertCustomerUseCase,
  ],
  exports: [UpsertCustomerUseCase],
})
export class CustomersModule {}
