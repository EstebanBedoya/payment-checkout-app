import { Test } from '@nestjs/testing'
import { DeliveriesController } from '../infrastructure/deliveries.controller'
import { GetDeliveryUseCase } from '../application/use-cases/get-delivery.use-case'
import { ok, err } from '../../../shared/result'
import { Errors } from '../../../shared/domain-errors'

const mockGetDelivery = { execute: jest.fn() }

const mockDelivery = {
  id: 'd1', transactionId: 'tx1', productId: 'p1', customerId: 'c1',
  address: 'Calle 1 # 2-3', city: 'Bogotá', status: 'PENDING', createdAt: new Date(),
}

describe('DeliveriesController', () => {
  let controller: DeliveriesController

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [DeliveriesController],
      providers: [
        { provide: GetDeliveryUseCase, useValue: mockGetDelivery },
      ],
    }).compile()
    controller = module.get(DeliveriesController)
    jest.clearAllMocks()
  })

  it('GET /deliveries/:transactionId returns 200 with data', async () => {
    mockGetDelivery.execute.mockResolvedValue(ok(mockDelivery))
    const res = await controller.findOne('tx1')
    expect(res).toEqual({ data: mockDelivery })
    expect(mockGetDelivery.execute).toHaveBeenCalledWith({ transactionId: 'tx1' })
  })

  it('GET /deliveries/:transactionId throws 404 when not found', async () => {
    mockGetDelivery.execute.mockResolvedValue(err(Errors.deliveryNotFound()))
    await expect(controller.findOne('missing')).rejects.toMatchObject({ status: 404 })
  })
})
