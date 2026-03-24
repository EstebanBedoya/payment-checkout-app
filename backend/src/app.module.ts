import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { ProductsModule } from './modules/products/infrastructure/products.module'
import { CustomersModule } from './modules/customers/infrastructure/customers.module'
import { PaymentModule } from './modules/payment/infrastructure/payment.module'
import { TransactionsModule } from './modules/transactions/infrastructure/transactions.module'
import { DeliveriesModule } from './modules/deliveries/infrastructure/deliveries.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    ProductsModule,
    CustomersModule,
    PaymentModule,
    TransactionsModule,
    DeliveriesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
