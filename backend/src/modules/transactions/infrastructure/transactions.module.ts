import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaModule } from '../../../prisma/prisma.module'
import { PrismaService } from '../../../prisma/prisma.service'
import { ProductsModule } from '../../products/infrastructure/products.module'
import { DeliveriesModule } from '../../deliveries/infrastructure/deliveries.module'
import { PaymentModule } from '../../payment/infrastructure/payment.module'
import { TransactionsController } from './transactions.controller'
import { PrismaTransactionRepository } from './prisma-transaction.repository'
import { CreateTransactionUseCase } from '../application/use-cases/create-transaction.use-case'
import { GetTransactionUseCase } from '../application/use-cases/get-transaction.use-case'

@Module({
  imports: [PrismaModule, ProductsModule, PaymentModule, DeliveriesModule],
  controllers: [TransactionsController],
  providers: [
    { provide: 'ITransactionRepository', useClass: PrismaTransactionRepository },
    {
      provide: 'PRISMA_SERVICE',
      useExisting: PrismaService,
    },
    {
      provide: 'FEES_CONFIG',
      useFactory: (config: ConfigService) => ({
        baseFee: parseInt(config.get('BASE_FEE_CENTS', '300000'), 10),
        deliveryFee: parseInt(config.get('DELIVERY_FEE_CENTS', '500000'), 10),
      }),
      inject: [ConfigService],
    },
    CreateTransactionUseCase,
    GetTransactionUseCase,
  ],
})
export class TransactionsModule {}
