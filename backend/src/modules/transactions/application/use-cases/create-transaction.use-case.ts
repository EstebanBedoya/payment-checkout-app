import { randomUUID } from 'node:crypto'
import { Injectable, Inject } from '@nestjs/common'
import { ok, err, Result } from '../../../../shared/result'
import { DomainError, Errors } from '../../../../shared/domain-errors'
import type { Transaction } from '../../domain/transaction.entity'
import type { ITransactionRepository } from '../../domain/transaction.repository.port'
import type { IProductRepository } from '../../../products/domain/product.repository.port'
import type { IDeliveryRepository } from '../../../deliveries/domain/delivery.repository.port'
import type { IPaymentGateway } from '../../../payment/domain/payment-gateway.port'

interface CreateTransactionInput {
  customerId: string
  productId: string
  cardTokenId: string
  installments: number
  acceptanceToken: string
  customerEmail: string
  address: string
  city: string
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject('IProductRepository') private readonly productRepo: IProductRepository,
    @Inject('ITransactionRepository') private readonly txRepo: ITransactionRepository,
    @Inject('IDeliveryRepository') private readonly deliveryRepo: IDeliveryRepository,
    @Inject('IPaymentGateway') private readonly gateway: IPaymentGateway,
    @Inject('PRISMA_SERVICE') private readonly prisma: any,
    @Inject('FEES_CONFIG') private readonly fees: { baseFee: number; deliveryFee: number },
  ) {}

  async execute(input: CreateTransactionInput): Promise<Result<Transaction, DomainError>> {
    // 1. Validate customer existence
    const customer = await this.prisma.customer.findUnique({ where: { id: input.customerId } })
    if (!customer) return err(Errors.customerNotFound())

    // 2. Validate product + stock
    const product = await this.productRepo.findById(input.productId)
    if (!product) return err(Errors.productNotFound())
    if (product.stock <= 0) return err(Errors.stockUnavailable())

    // 3. Calculate total amount
    const amountInCents = product.priceInCents + this.fees.baseFee + this.fees.deliveryFee

    // 4. Persist PENDING transaction
    const reference = randomUUID()
    const transaction = await this.txRepo.create({
      reference,
      customerId: input.customerId,
      productId: input.productId,
      amountInCents,
      baseFeeInCents: this.fees.baseFee,
      deliveryFeeInCents: this.fees.deliveryFee,
      status: 'PENDING',
      wompiTransactionId: null,
      cardTokenId: input.cardTokenId,
      installments: input.installments,
      finalizedAt: null,
    })

    // 5. Call payment gateway
    const paymentResult = await this.gateway.createTransaction({
      amountInCents,
      reference,
      cardTokenId: input.cardTokenId,
      customerEmail: input.customerEmail,
      installments: input.installments,
      acceptanceToken: input.acceptanceToken,
      currency: 'COP',
    })

    if (paymentResult.isErr()) {
      await this.txRepo.updateStatus(transaction.id, 'ERROR')
      return err(paymentResult.error)
    }

    const wompiTx = paymentResult.value

    // 6. Update transaction status from Wompi response
    await this.txRepo.updateStatus(transaction.id, wompiTx.status as Transaction['status'], wompiTx.id)

    // 7. If APPROVED: atomically create delivery + decrement stock
    if (wompiTx.status === 'APPROVED') {
      await this.prisma.$transaction(async (tx: unknown) => {
        await this.deliveryRepo.create(
          {
            transactionId: transaction.id,
            productId: input.productId,
            customerId: input.customerId,
            address: input.address,
            city: input.city,
            status: 'PENDING',
          },
          tx,
        )
        await this.productRepo.decrementStock(input.productId, tx)
      })
    }

    return ok({ ...transaction, status: wompiTx.status as Transaction['status'], wompiTransactionId: wompiTx.id })
  }
}
