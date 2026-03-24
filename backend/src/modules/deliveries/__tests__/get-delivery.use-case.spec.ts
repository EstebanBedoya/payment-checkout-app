import { GetDeliveryUseCase } from '../application/use-cases/get-delivery.use-case'
import { IDeliveryRepository } from '../domain/delivery.repository.port'

const mockDelivery = {
  id: 'd1',
  transactionId: 'tx1',
  productId: 'p1',
  customerId: 'c1',
  address: 'Calle 1 # 2-3',
  city: 'Bogotá',
  status: 'PENDING' as const,
  createdAt: new Date(),
}

const mockRepo: jest.Mocked<IDeliveryRepository> = {
  create: jest.fn(),
  findByTransactionId: jest.fn(),
}

describe('GetDeliveryUseCase', () => {
  let useCase: GetDeliveryUseCase

  beforeEach(() => {
    jest.clearAllMocks()
    useCase = new GetDeliveryUseCase(mockRepo)
  })

  it('returns Ok(delivery) when found', async () => {
    mockRepo.findByTransactionId.mockResolvedValue(mockDelivery)
    const r = await useCase.execute({ transactionId: 'tx1' })
    expect(r.isOk()).toBe(true)
    if (r.isOk()) expect(r.value.transactionId).toBe('tx1')
    expect(mockRepo.findByTransactionId).toHaveBeenCalledWith('tx1')
  })

  it('returns Err(DELIVERY_NOT_FOUND) when missing', async () => {
    mockRepo.findByTransactionId.mockResolvedValue(null)
    const r = await useCase.execute({ transactionId: 'missing' })
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('DELIVERY_NOT_FOUND')
  })
})
