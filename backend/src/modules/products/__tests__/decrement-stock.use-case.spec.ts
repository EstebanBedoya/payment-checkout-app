import { DecrementStockUseCase } from '../application/use-cases/decrement-stock.use-case'
import { IProductRepository } from '../domain/product.repository.port'

const mockProduct = {
  id: 'p1', name: 'Test', description: 'D',
  imageUrl: 'https://img.com', priceInCents: 10000, stock: 5, createdAt: new Date(),
}

const mockRepo: jest.Mocked<IProductRepository> = {
  findById: jest.fn(), findAll: jest.fn(), decrementStock: jest.fn(),
}

describe('DecrementStockUseCase', () => {
  let useCase: DecrementStockUseCase

  beforeEach(() => {
    jest.clearAllMocks()
    useCase = new DecrementStockUseCase(mockRepo)
  })

  it('returns Ok when product found and stock > 0', async () => {
    mockRepo.findById.mockResolvedValue(mockProduct)
    mockRepo.decrementStock.mockResolvedValue(undefined)
    const r = await useCase.execute({ productId: 'p1' })
    expect(r.isOk()).toBe(true)
    expect(mockRepo.decrementStock).toHaveBeenCalledWith('p1', undefined)
  })

  it('passes tx to decrementStock', async () => {
    const tx = { mock: true }
    mockRepo.findById.mockResolvedValue(mockProduct)
    mockRepo.decrementStock.mockResolvedValue(undefined)
    await useCase.execute({ productId: 'p1', tx })
    expect(mockRepo.decrementStock).toHaveBeenCalledWith('p1', tx)
  })

  it('returns Err(PRODUCT_NOT_FOUND) when product missing', async () => {
    mockRepo.findById.mockResolvedValue(null)
    const r = await useCase.execute({ productId: 'x' })
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('PRODUCT_NOT_FOUND')
  })

  it('returns Err(STOCK_UNAVAILABLE) when stock is 0', async () => {
    mockRepo.findById.mockResolvedValue({ ...mockProduct, stock: 0 })
    const r = await useCase.execute({ productId: 'p1' })
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('STOCK_UNAVAILABLE')
  })
})
