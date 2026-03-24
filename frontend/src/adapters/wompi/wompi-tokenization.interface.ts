export interface CardData { number: string; cvc: string; expMonth: string; expYear: string; cardHolder: string }
export type TokenizeResult = { success: true; tokenId: string } | { success: false; error: string }

export interface IWompiTokenizationAdapter {
  tokenizeCard(data: CardData): Promise<TokenizeResult>
  getAcceptanceToken(): Promise<{ success: true; token: string } | { success: false; error: string }>
}
