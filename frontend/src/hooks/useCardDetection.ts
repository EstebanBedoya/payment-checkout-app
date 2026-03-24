import { detectCardNetwork, type CardNetwork } from '../utils/luhn'

export function useCardDetection(cardNumber: string): CardNetwork {
  return detectCardNetwork(cardNumber)
}
