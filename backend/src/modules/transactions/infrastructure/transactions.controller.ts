import { Controller, Post, Get, Param, Body, HttpCode, HttpException } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { IsString, IsNumber, IsEmail, Min, IsNotEmpty } from 'class-validator'
import { CreateTransactionUseCase } from '../application/use-cases/create-transaction.use-case'
import { GetTransactionUseCase } from '../application/use-cases/get-transaction.use-case'
import { DomainErrorCode } from '../../../shared/domain-errors'

const ERROR_STATUS: Record<DomainErrorCode, number> = {
  PRODUCT_NOT_FOUND: 404,
  STOCK_UNAVAILABLE: 409,
  CUSTOMER_NOT_FOUND: 404,
  TRANSACTION_NOT_FOUND: 404,
  DELIVERY_NOT_FOUND: 404,
  INVALID_CARD_TOKEN: 400,
  INVALID_ACCEPTANCE_TOKEN: 400,
  PAYMENT_GATEWAY_UNAVAILABLE: 503,
  VALIDATION_ERROR: 400,
}

export class CreateTransactionDto {
  @IsString() @IsNotEmpty() customerId: string
  @IsString() @IsNotEmpty() productId: string
  @IsString() @IsNotEmpty() cardTokenId: string
  @IsNumber() @Min(1) installments: number
  @IsString() @IsNotEmpty() acceptanceToken: string
  @IsEmail() customerEmail: string
  @IsString() @IsNotEmpty() address: string
  @IsString() @IsNotEmpty() city: string
}

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTx: CreateTransactionUseCase,
    private readonly getTx: GetTransactionUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new transaction' })
  async create(@Body() dto: CreateTransactionDto) {
    const r = await this.createTx.execute(dto)
    if (r.isErr()) {
      throw new HttpException(
        { error: r.error.code, message: r.error.message },
        ERROR_STATUS[r.error.code] ?? 500,
      )
    }
    return { data: r.value }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by id' })
  async findOne(@Param('id') id: string) {
    const r = await this.getTx.execute({ transactionId: id })
    if (r.isErr()) {
      throw new HttpException(
        { error: r.error.code, message: r.error.message },
        ERROR_STATUS[r.error.code] ?? 500,
      )
    }
    return { data: r.value }
  }
}
