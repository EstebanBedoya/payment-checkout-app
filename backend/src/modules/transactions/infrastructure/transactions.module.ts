import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { PrismaService } from '../../../prisma/prisma.service'
import { ProductsModule } from '../../products/infrastructure/products.module'
import { PaymentModule } from '../../payment/infrastructure/payment.module'
import { TransactionsController } from './transactions.controller'
import { PrismaTransactionRepository } from './prisma-transaction.repository'
import { PrismaDeliveryRepository } from '../../deliveries/infrastructure/prisma-delivery.repository'
import { CreateTransactionUseCase } from '../application/use-cases/create-transaction.use-case'
import { GetTransactionUseCase } from '../application/use-cases/get-transaction.use-case'

@Module({
  imports: [PrismaModule, ProductsModule, PaymentModule],
  controllers: [TransactionsController],
  providers: [
    { provide: 'ITransactionRepository', useClass: PrismaTransactionRepository },
    { provide: 'IDeliveryRepository', useClass: PrismaDeliveryRepository },
    {
      provide: 'PRISMA_SERVICE',
      useExisting: PrismaService,
    },
    {
      provide: 'FEES_CONFIG',
      useValue: { baseFee: 0, deliveryFee: 500000 },
    },
    CreateTransactionUseCase,
    GetTransactionUseCase,
  ],
})
export class TransactionsModule {}
