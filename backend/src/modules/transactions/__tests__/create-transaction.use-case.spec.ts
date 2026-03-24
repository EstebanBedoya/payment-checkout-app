import { CreateTransactionUseCase } from '../application/use-cases/create-transaction.use-case'
import { WompiPaymentAdapterMock } from '../../payment/infrastructure/adapters/wompi-payment-adapter.mock'
import { err } from '../../../shared/result'
import { Errors } from '../../../shared/domain-errors'

const product = {
  id: 'p1',
  name: 'Smartwatch',
  description: 'D',
  imageUrl: 'i',
  priceInCents: 15000000,
  stock: 5,
  createdAt: new Date(),
}

const mockProductRepo = {
  findById: jest.fn(),
  findAll: jest.fn(),
  decrementStock: jest.fn(),
}
const mockTransactionRepo = {
  create: jest.fn(),
  updateStatus: jest.fn(),
  findById: jest.fn(),
}
const mockDeliveryRepo = {
  create: jest.fn(),
  findByTransactionId: jest.fn(),
}
const mockPrisma = {
  $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(mockPrisma)),
  customer: {
    findUnique: jest.fn(),
  },
}
const wompiMock = new WompiPaymentAdapterMock()

const baseInput = {
  customerId: 'c1',
  productId: 'p1',
  cardTokenId: 'tok_1',
  installments: 1,
  acceptanceToken: 'acc1',
  customerEmail: 'j@t.com',
  address: 'Calle 1 #2-3',
  city: 'Bogotá',
}

const pendingTx = {
  id: 'tx1',
  reference: 'ref1',
  customerId: 'c1',
  productId: 'p1',
  status: 'PENDING' as const,
  amountInCents: 20800000,
  baseFeeInCents: 300000,
  deliveryFeeInCents: 500000,
  wompiTransactionId: null,
  cardTokenId: 'tok_1',
  installments: 1,
  finalizedAt: null,
  createdAt: new Date(),
}

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase

  beforeEach(() => {
    jest.restoreAllMocks() // restore any jest.spyOn() from prior tests
    jest.clearAllMocks()
    wompiMock.setStatus('APPROVED')
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', name: 'Juan', email: 'j@t.com' })
    mockProductRepo.findById.mockResolvedValue(product)
    mockTransactionRepo.create.mockResolvedValue(pendingTx)
    mockTransactionRepo.updateStatus.mockResolvedValue(undefined)
    mockDeliveryRepo.create.mockResolvedValue({ id: 'd1' })
    useCase = new CreateTransactionUseCase(
      mockProductRepo as any,
      mockTransactionRepo as any,
      mockDeliveryRepo as any,
      wompiMock,
      mockPrisma as any,
      { baseFee: 300000, deliveryFee: 500000 },
    )
  })

  it('returns Err(CUSTOMER_NOT_FOUND) when customer missing', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue(null)
    const r = await useCase.execute(baseInput)
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('CUSTOMER_NOT_FOUND')
    expect(mockTransactionRepo.create).not.toHaveBeenCalled()
  })

  it('returns Err(PRODUCT_NOT_FOUND) when product missing', async () => {
    mockProductRepo.findById.mockResolvedValue(null)
    const r = await useCase.execute(baseInput)
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('PRODUCT_NOT_FOUND')
    expect(mockTransactionRepo.create).not.toHaveBeenCalled()
  })

  it('returns Err(STOCK_UNAVAILABLE) when stock is 0', async () => {
    mockProductRepo.findById.mockResolvedValue({ ...product, stock: 0 })
    const r = await useCase.execute(baseInput)
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('STOCK_UNAVAILABLE')
    expect(mockTransactionRepo.create).not.toHaveBeenCalled()
  })

  it('returns Err(PAYMENT_GATEWAY_UNAVAILABLE) when Wompi fails', async () => {
    jest
      .spyOn(wompiMock, 'createTransaction')
      .mockResolvedValue(err(Errors.paymentGatewayUnavailable()))
    const r = await useCase.execute(baseInput)
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('PAYMENT_GATEWAY_UNAVAILABLE')
    expect(mockTransactionRepo.create).toHaveBeenCalledTimes(1)
    expect(mockTransactionRepo.updateStatus).toHaveBeenCalledWith('tx1', 'ERROR')
    expect(mockDeliveryRepo.create).not.toHaveBeenCalled()
    expect(mockProductRepo.decrementStock).not.toHaveBeenCalled()
  })

  it('on APPROVED: creates delivery, decrements stock, returns Ok', async () => {
    wompiMock.setStatus('APPROVED')
    const r = await useCase.execute(baseInput)
    expect(r.isOk()).toBe(true)
    if (r.isOk()) expect(r.value.status).toBe('APPROVED')
    expect(mockDeliveryRepo.create).toHaveBeenCalledTimes(1)
    expect(mockDeliveryRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ transactionId: 'tx1', productId: 'p1', customerId: 'c1' }),
      mockPrisma,
    )
    expect(mockProductRepo.decrementStock).toHaveBeenCalledWith('p1', mockPrisma)
  })

  it('on DECLINED: does NOT create delivery or decrement stock', async () => {
    wompiMock.setStatus('DECLINED')
    const r = await useCase.execute(baseInput)
    expect(r.isOk()).toBe(true)
    if (r.isOk()) expect(r.value.status).toBe('DECLINED')
    expect(mockDeliveryRepo.create).not.toHaveBeenCalled()
    expect(mockProductRepo.decrementStock).not.toHaveBeenCalled()
  })
})
