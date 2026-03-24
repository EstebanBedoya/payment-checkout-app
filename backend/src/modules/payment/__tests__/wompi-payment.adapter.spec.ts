import nock from 'nock'
import { createHash } from 'crypto'
import {
  WompiPaymentAdapter,
  type WompiAdapterConfig,
} from '../infrastructure/adapters/wompi-payment.adapter'

const API_BASE = 'https://api-sandbox.co.uat.wompi.dev'

const config: WompiAdapterConfig = {
  apiUrl: `${API_BASE}/v1`,
  publicKey: 'pub_test_xxx',
  privateKey: 'prv_test_secret',
  integrityKey: 'integrity_test_key',
}

const baseParams = {
  amountInCents: 5000000,
  reference: 'ref-001',
  cardTokenId: 'tok_test_123',
  customerEmail: 'test@example.com',
  installments: 1,
  acceptanceToken: 'acc_test_token',
  currency: 'COP',
}

describe('WompiPaymentAdapter', () => {
  let adapter: WompiPaymentAdapter

  beforeEach(() => {
    adapter = new WompiPaymentAdapter(config)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('createTransaction', () => {
    it('returns Ok with mapped transaction on 201 response', async () => {
      nock(API_BASE)
        .post('/v1/transactions')
        .reply(201, {
          data: {
            id: 'wt-001',
            status: 'PENDING',
            reference: 'ref-001',
            amount_in_cents: 5000000,
          },
        })

      const r = await adapter.createTransaction(baseParams)

      expect(r.isOk()).toBe(true)
      if (r.isOk()) {
        expect(r.value.id).toBe('wt-001')
        expect(r.value.status).toBe('PENDING')
        expect(r.value.reference).toBe('ref-001')
        expect(r.value.amountInCents).toBe(5000000)
      }
    })

    it('returns Err(PAYMENT_GATEWAY_UNAVAILABLE) on network error', async () => {
      nock(API_BASE).post('/v1/transactions').replyWithError('Network error')

      const r = await adapter.createTransaction(baseParams)

      expect(r.isErr()).toBe(true)
      if (r.isErr()) expect(r.error.code).toBe('PAYMENT_GATEWAY_UNAVAILABLE')
    })

    it('returns Err(INVALID_CARD_TOKEN) on 422 response', async () => {
      nock(API_BASE)
        .post('/v1/transactions')
        .reply(422, { error: { reason: 'INVALID_TOKEN' } })

      const r = await adapter.createTransaction(baseParams)

      expect(r.isErr()).toBe(true)
      if (r.isErr()) expect(r.error.code).toBe('INVALID_CARD_TOKEN')
    })

    it('returns Err(INVALID_ACCEPTANCE_TOKEN) on 401 response', async () => {
      nock(API_BASE)
        .post('/v1/transactions')
        .reply(401, { error: { reason: 'EXPIRED_TOKEN' } })

      const r = await adapter.createTransaction(baseParams)

      expect(r.isErr()).toBe(true)
      if (r.isErr()) expect(r.error.code).toBe('INVALID_ACCEPTANCE_TOKEN')
    })

    it('sends SHA256(reference+amountInCents+currency+integrityKey) as signature.integrity', async () => {
      const expectedHash = createHash('sha256')
        .update(
          `${baseParams.reference}${baseParams.amountInCents}${baseParams.currency}${config.integrityKey}`,
        )
        .digest('hex')

      let capturedBody: Record<string, unknown> = {}

      nock(API_BASE)
        .post('/v1/transactions', (body) => {
          capturedBody = body
          return true
        })
        .reply(201, {
          data: { id: 'wt-002', status: 'PENDING', reference: 'ref-001', amount_in_cents: 5000000 },
        })

      await adapter.createTransaction(baseParams)

      expect((capturedBody.signature as Record<string, unknown>)?.integrity).toBe(expectedHash)
    })

    it('sends privateKey in Authorization header and NOT in request body', async () => {
      let capturedBody: string = ''

      nock(API_BASE)
        .post('/v1/transactions', (body) => {
          capturedBody = JSON.stringify(body)
          return true
        })
        .matchHeader('Authorization', `Bearer ${config.privateKey}`)
        .reply(201, {
          data: { id: 'wt-003', status: 'PENDING', reference: 'ref-001', amount_in_cents: 5000000 },
        })

      const r = await adapter.createTransaction(baseParams)

      expect(r.isOk()).toBe(true)
      expect(capturedBody).not.toContain(config.privateKey)
      expect(capturedBody).not.toContain(config.integrityKey)
    })
  })

  describe('getTransactionStatus', () => {
    it('returns Ok with mapped transaction on 200 response', async () => {
      nock(API_BASE)
        .get('/v1/transactions/wt-001')
        .reply(200, {
          data: {
            id: 'wt-001',
            status: 'APPROVED',
            reference: 'ref-001',
            amount_in_cents: 5000000,
          },
        })

      const r = await adapter.getTransactionStatus('wt-001')

      expect(r.isOk()).toBe(true)
      if (r.isOk()) {
        expect(r.value.id).toBe('wt-001')
        expect(r.value.status).toBe('APPROVED')
        expect(r.value.amountInCents).toBe(5000000)
      }
    })

    it('returns Err(PAYMENT_GATEWAY_UNAVAILABLE) on network error', async () => {
      nock(API_BASE).get('/v1/transactions/wt-001').replyWithError('Network error')

      const r = await adapter.getTransactionStatus('wt-001')

      expect(r.isErr()).toBe(true)
      if (r.isErr()) expect(r.error.code).toBe('PAYMENT_GATEWAY_UNAVAILABLE')
    })
  })
})
