export function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')
  if (!digits.length) return false
  let sum = 0
  let alternate = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10)
    if (alternate) { n *= 2; if (n > 9) n -= 9 }
    sum += n
    alternate = !alternate
  }
  return sum % 10 === 0
}

export type CardNetwork = 'VISA' | 'MASTERCARD' | 'UNKNOWN'

export function detectCardNetwork(cardNumber: string): CardNetwork {
  const digits = cardNumber.replace(/\D/g, '')
  if (/^4/.test(digits)) return 'VISA'
  if (/^5[1-5]/.test(digits)) return 'MASTERCARD'
  return 'UNKNOWN'
}
