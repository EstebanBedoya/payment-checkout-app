import { Controller, Get, Param, HttpException } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { GetDeliveryUseCase } from '../application/use-cases/get-delivery.use-case'

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly getDelivery: GetDeliveryUseCase) {}

  @Get(':transactionId')
  @ApiOperation({ summary: 'Get delivery by transaction id' })
  async findOne(@Param('transactionId') transactionId: string) {
    const r = await this.getDelivery.execute({ transactionId })
    if (r.isErr()) {
      throw new HttpException({ error: r.error.code, message: r.error.message }, 404)
    }
    return { data: r.value }
  }
}
