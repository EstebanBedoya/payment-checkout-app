import { Body, Controller, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { UpsertCustomerUseCase } from '../application/use-cases/upsert-customer.use-case'
import { Customer } from '../domain/customer.entity'

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly upsertCustomer: UpsertCustomerUseCase) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create or update customer by email' })
  async upsert(@Body() body: Omit<Customer, 'id' | 'createdAt'>) {
    const r = await this.upsertCustomer.execute(body)
    if (r.isErr()) {
      const status = r.error.code === 'VALIDATION_ERROR' ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR
      throw new HttpException({ error: r.error.code, message: r.error.message }, status)
    }
    return { data: r.value }
  }
}
