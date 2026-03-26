import type { IWompiTokenizationAdapter, CardData, TokenizeResult } from './wompi-tokenization.interface'

interface Config { publicKey: string; apiUrl: string }

export class WompiTokenizationAdapter implements IWompiTokenizationAdapter {
  private readonly config: Config
  constructor(config: Config) { this.config = config }

  async tokenizeCard(data: CardData): Promise<TokenizeResult> {
    try {
      const res = await fetch(`${this.config.apiUrl}/tokens/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.config.publicKey}` },
        body: JSON.stringify({
          number: data.number.replace(/\s/g, ''),
          cvc: data.cvc,
          exp_month: data.expMonth,
          exp_year: data.expYear,
          card_holder: data.cardHolder,
        }),
      })
      if (!res.ok) return { success: false, error: 'Tokenization failed' }
      const json = await res.json()
      return { success: true, tokenId: json.data.id }
    } catch {
      return { success: false, error: 'Network error during tokenization' }
    }
  }

  async getAcceptanceToken(): Promise<{ success: true; token: string } | { success: false; error: string }> {
    try {
      const res = await fetch(`${this.config.apiUrl}/merchants/${this.config.publicKey}`)
      if (!res.ok) return { success: false, error: 'Could not fetch acceptance token' }
      const json = await res.json()
      return { success: true, token: json.data.presigned_acceptance.acceptance_token }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }
}
