import { GetProductUseCase } from '../application/use-cases/get-product.use-case'
import { IProductRepository } from '../domain/product.repository.port'

const mockProduct = {
  id: 'p1', name: 'Test', description: 'D',
  imageUrl: 'https://img.com', priceInCents: 10000, stock: 5, createdAt: new Date(),
}

const mockRepo: jest.Mocked<IProductRepository> = {
  findById: jest.fn(), findAll: jest.fn(), decrementStock: jest.fn(),
}

describe('GetProductUseCase', () => {
  let useCase: GetProductUseCase
  beforeEach(() => { jest.clearAllMocks(); useCase = new GetProductUseCase(mockRepo) })

  it('returns Ok(product) when found', async () => {
    mockRepo.findById.mockResolvedValue(mockProduct)
    const r = await useCase.execute({ productId: 'p1' })
    expect(r.isOk()).toBe(true)
    if (r.isOk()) expect(r.value.id).toBe('p1')
  })

  it('returns Err(PRODUCT_NOT_FOUND) when missing', async () => {
    mockRepo.findById.mockResolvedValue(null)
    const r = await useCase.execute({ productId: 'x' })
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('PRODUCT_NOT_FOUND')
  })
})
