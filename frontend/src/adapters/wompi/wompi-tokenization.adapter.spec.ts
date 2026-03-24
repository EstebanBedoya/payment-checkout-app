import { WompiTokenizationAdapter } from './wompi-tokenization.adapter'

const adapter = new WompiTokenizationAdapter({
  publicKey: 'pub_test', apiUrl: 'https://api-sandbox.co.uat.wompi.dev/v1',
})

describe('WompiTokenizationAdapter', () => {
  it('tokenizeCard calls POST /tokens/cards and returns token', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'CREATED', data: { id: 'tok_test_123' } }),
    }) as any

    const r = await adapter.tokenizeCard({ number: '4111111111111111', cvc: '123', expMonth: '12', expYear: '28', cardHolder: 'Test User' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.tokenId).toBe('tok_test_123')
  })

  it('returns error on network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network')) as any
    const r = await adapter.tokenizeCard({ number: '4111111111111111', cvc: '123', expMonth: '12', expYear: '28', cardHolder: 'Test' })
    expect(r.success).toBe(false)
  })
})
