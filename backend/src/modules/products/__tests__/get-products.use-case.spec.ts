import { GetProductsUseCase } from '../application/use-cases/get-products.use-case'
import { IProductRepository } from '../domain/product.repository.port'

const mockProducts = [
  { id: 'p1', name: 'A', description: 'D', imageUrl: 'https://img.com', priceInCents: 10000, stock: 5, createdAt: new Date() },
  { id: 'p2', name: 'B', description: 'D', imageUrl: 'https://img.com', priceInCents: 20000, stock: 2, createdAt: new Date() },
]

const mockRepo: jest.Mocked<IProductRepository> = {
  findById: jest.fn(), findAll: jest.fn(), decrementStock: jest.fn(),
}

describe('GetProductsUseCase', () => {
  let useCase: GetProductsUseCase

  beforeEach(() => {
    jest.clearAllMocks()
    useCase = new GetProductsUseCase(mockRepo)
  })

  it('returns Ok with all products', async () => {
    mockRepo.findAll.mockResolvedValue(mockProducts)
    const r = await useCase.execute()
    expect(r.isOk()).toBe(true)
    if (r.isOk()) expect(r.value).toHaveLength(2)
  })

  it('returns Ok with empty array when no products', async () => {
    mockRepo.findAll.mockResolvedValue([])
    const r = await useCase.execute()
    expect(r.isOk()).toBe(true)
    if (r.isOk()) expect(r.value).toHaveLength(0)
  })
})
