import { UpsertCustomerUseCase } from '../application/use-cases/upsert-customer.use-case'
import { ICustomerRepository } from '../domain/customer.repository.port'

const mockRepo: jest.Mocked<ICustomerRepository> = { upsertByEmail: jest.fn() }
const input = { name: 'Juan', email: 'juan@test.com', phone: '3001234567', address: 'Calle 1', city: 'Bogotá' }
const customer = { id: 'c1', ...input, createdAt: new Date() }

describe('UpsertCustomerUseCase', () => {
  let useCase: UpsertCustomerUseCase
  beforeEach(() => { jest.clearAllMocks(); useCase = new UpsertCustomerUseCase(mockRepo) })

  it('returns Ok(customer) on success', async () => {
    mockRepo.upsertByEmail.mockResolvedValue(customer)
    const r = await useCase.execute(input)
    expect(r.isOk()).toBe(true)
    if (r.isOk()) expect(r.value.email).toBe('juan@test.com')
  })

  it('returns Err(VALIDATION_ERROR) when email invalid', async () => {
    const r = await useCase.execute({ ...input, email: 'not-an-email' })
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('VALIDATION_ERROR')
  })
})
