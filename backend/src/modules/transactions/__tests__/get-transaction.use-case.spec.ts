import { GetTransactionUseCase } from '../application/use-cases/get-transaction.use-case'
import { ITransactionRepository } from '../domain/transaction.repository.port'

const mockTransaction = {
  id: 'tx1',
  reference: 'ref-001',
  customerId: 'c1',
  productId: 'p1',
  amountInCents: 16500000,
  baseFeeInCents: 0,
  deliveryFeeInCents: 500000,
  status: 'APPROVED' as const,
  wompiTransactionId: 'wompi-1',
  cardTokenId: 'tok_test_123',
  installments: 1,
  finalizedAt: new Date(),
  createdAt: new Date(),
}

const mockRepo: jest.Mocked<ITransactionRepository> = {
  create: jest.fn(),
  updateStatus: jest.fn(),
  findById: jest.fn(),
}

describe('GetTransactionUseCase', () => {
  let useCase: GetTransactionUseCase

  beforeEach(() => {
    jest.clearAllMocks()
    useCase = new GetTransactionUseCase(mockRepo)
  })

  it('returns Ok(transaction) when found', async () => {
    mockRepo.findById.mockResolvedValue(mockTransaction)
    const r = await useCase.execute({ transactionId: 'tx1' })
    expect(r.isOk()).toBe(true)
    if (r.isOk()) expect(r.value.id).toBe('tx1')
    expect(mockRepo.findById).toHaveBeenCalledWith('tx1')
  })

  it('returns Err(TRANSACTION_NOT_FOUND) when missing', async () => {
    mockRepo.findById.mockResolvedValue(null)
    const r = await useCase.execute({ transactionId: 'missing' })
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('TRANSACTION_NOT_FOUND')
  })
})
