import { Test } from '@nestjs/testing'
import { ProductsController } from '../infrastructure/products.controller'
import { GetProductUseCase } from '../application/use-cases/get-product.use-case'
import { GetProductsUseCase } from '../application/use-cases/get-products.use-case'
import { ok, err } from '../../../shared/result'
import { Errors } from '../../../shared/domain-errors'

const mockGetProduct = { execute: jest.fn() }
const mockGetProducts = { execute: jest.fn() }

describe('ProductsController', () => {
  let controller: ProductsController

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: GetProductUseCase, useValue: mockGetProduct },
        { provide: GetProductsUseCase, useValue: mockGetProducts },
      ],
    }).compile()
    controller = module.get(ProductsController)
    jest.clearAllMocks()
  })

  it('GET /products returns 200 with product array', async () => {
    mockGetProducts.execute.mockResolvedValue(ok([{ id: 'p1' }]))
    const res = await controller.findAll()
    expect(res).toEqual({ data: [{ id: 'p1' }] })
  })

  it('GET /products/:id returns 200', async () => {
    mockGetProduct.execute.mockResolvedValue(ok({ id: 'p1' }))
    const res = await controller.findOne('p1')
    expect(res).toEqual({ data: { id: 'p1' } })
  })

  it('GET /products/:id throws 404 when not found', async () => {
    mockGetProduct.execute.mockResolvedValue(err(Errors.productNotFound()))
    await expect(controller.findOne('x')).rejects.toMatchObject({ status: 404 })
  })
})
