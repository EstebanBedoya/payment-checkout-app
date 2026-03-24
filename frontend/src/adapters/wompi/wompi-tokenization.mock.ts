import { IWompiTokenizationAdapter } from './wompi-tokenization.interface'

export class WompiTokenizationMock implements IWompiTokenizationAdapter {
  async tokenizeCard() { return { success: true as const, tokenId: 'tok_mock_123' } }
  async getAcceptanceToken() { return { success: true as const, token: 'mock_acceptance_token' } }
}
