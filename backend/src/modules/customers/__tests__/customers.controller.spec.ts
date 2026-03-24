import { Test } from '@nestjs/testing'
import { CustomersController } from '../infrastructure/customers.controller'
import { UpsertCustomerUseCase } from '../application/use-cases/upsert-customer.use-case'
import { ok, err } from '../../../shared/result'
import { Errors } from '../../../shared/domain-errors'

const mockUpsert = { execute: jest.fn() }
const input = { name: 'Juan', email: 'juan@test.com', phone: '3001234567', address: 'Calle 1', city: 'Bogotá' }
const customer = { id: 'c1', ...input, createdAt: new Date() }

describe('CustomersController', () => {
  let controller: CustomersController

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        { provide: UpsertCustomerUseCase, useValue: mockUpsert },
      ],
    }).compile()
    controller = module.get(CustomersController)
    jest.clearAllMocks()
  })

  it('POST /customers returns 201 on success', async () => {
    mockUpsert.execute.mockResolvedValue(ok(customer))
    const res = await controller.upsert(input)
    expect(res).toEqual({ data: customer })
  })

  it('POST /customers throws 400 on validation error', async () => {
    mockUpsert.execute.mockResolvedValue(err(Errors.validationError('Invalid email format')))
    await expect(controller.upsert({ ...input, email: 'bad' })).rejects.toMatchObject({ status: 400 })
  })

  it('POST /customers throws 500 on unexpected error', async () => {
    mockUpsert.execute.mockResolvedValue(err(Errors.paymentGatewayUnavailable()))
    await expect(controller.upsert(input)).rejects.toMatchObject({ status: 500 })
  })
})
