import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { DeliveriesController } from './deliveries.controller'
import { PrismaDeliveryRepository } from './prisma-delivery.repository'
import { GetDeliveryUseCase } from '../application/use-cases/get-delivery.use-case'

@Module({
  imports: [PrismaModule],
  controllers: [DeliveriesController],
  providers: [
    { provide: 'IDeliveryRepository', useClass: PrismaDeliveryRepository },
    GetDeliveryUseCase,
  ],
  exports: [GetDeliveryUseCase, 'IDeliveryRepository'],
})
export class DeliveriesModule {}
