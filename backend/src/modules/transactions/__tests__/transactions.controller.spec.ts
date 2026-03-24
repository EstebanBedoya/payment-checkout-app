import { Test } from '@nestjs/testing'
import { TransactionsController } from '../infrastructure/transactions.controller'
import { CreateTransactionUseCase } from '../application/use-cases/create-transaction.use-case'
import { GetTransactionUseCase } from '../application/use-cases/get-transaction.use-case'
import { ok, err } from '../../../shared/result'
import { Errors } from '../../../shared/domain-errors'

const mockCreateTx = { execute: jest.fn() }
const mockGetTx = { execute: jest.fn() }

const mockTx = {
  id: 'tx1', reference: 'ref-1', customerId: 'c1', productId: 'p1',
  amountInCents: 16500000, baseFeeInCents: 0, deliveryFeeInCents: 500000,
  status: 'APPROVED', wompiTransactionId: 'w1', cardTokenId: 'tok', installments: 1,
  finalizedAt: null, createdAt: new Date(),
}

const dto = {
  customerId: 'c1', productId: 'p1', cardTokenId: 'tok',
  installments: 1, acceptanceToken: 'acc', customerEmail: 'a@b.com',
  address: 'Calle 1', city: 'Bogotá',
}

describe('TransactionsController', () => {
  let controller: TransactionsController

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: CreateTransactionUseCase, useValue: mockCreateTx },
        { provide: GetTransactionUseCase, useValue: mockGetTx },
      ],
    }).compile()
    controller = module.get(TransactionsController)
    jest.clearAllMocks()
  })

  it('POST /transactions returns 201 with data', async () => {
    mockCreateTx.execute.mockResolvedValue(ok(mockTx))
    const res = await controller.create(dto as any)
    expect(res).toEqual({ data: mockTx })
  })

  it('POST /transactions throws 409 on STOCK_UNAVAILABLE', async () => {
    mockCreateTx.execute.mockResolvedValue(err(Errors.stockUnavailable()))
    await expect(controller.create(dto as any)).rejects.toMatchObject({ status: 409 })
  })

  it('POST /transactions throws 404 on PRODUCT_NOT_FOUND', async () => {
    mockCreateTx.execute.mockResolvedValue(err(Errors.productNotFound()))
    await expect(controller.create(dto as any)).rejects.toMatchObject({ status: 404 })
  })

  it('POST /transactions throws 503 on PAYMENT_GATEWAY_UNAVAILABLE', async () => {
    mockCreateTx.execute.mockResolvedValue(err(Errors.paymentGatewayUnavailable()))
    await expect(controller.create(dto as any)).rejects.toMatchObject({ status: 503 })
  })

  it('GET /transactions/:id returns 200 with data', async () => {
    mockGetTx.execute.mockResolvedValue(ok(mockTx))
    const res = await controller.findOne('tx1')
    expect(res).toEqual({ data: mockTx })
    expect(mockGetTx.execute).toHaveBeenCalledWith({ transactionId: 'tx1' })
  })

  it('GET /transactions/:id throws 404 when not found', async () => {
    mockGetTx.execute.mockResolvedValue(err(Errors.transactionNotFound()))
    await expect(controller.findOne('missing')).rejects.toMatchObject({ status: 404 })
  })
})
