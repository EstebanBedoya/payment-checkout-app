import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { ProductsModule } from './modules/products/infrastructure/products.module'
import { CustomersModule } from './modules/customers/infrastructure/customers.module'
import { PaymentModule } from './modules/payment/infrastructure/payment.module'
import { TransactionsModule } from './modules/transactions/infrastructure/transactions.module'
import { DeliveriesModule } from './modules/deliveries/infrastructure/deliveries.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProductsModule,
    CustomersModule,
    PaymentModule,
    TransactionsModule,
    DeliveriesModule,
  ],
})
export class AppModule {}
