import { validateLuhn, detectCardNetwork } from './luhn'

describe('validateLuhn', () => {
  it('returns true for valid Visa test card', () => expect(validateLuhn('4111111111111111')).toBe(true))
  it('returns true for valid MC test card', () => expect(validateLuhn('5500005555555559')).toBe(true))
  it('returns false for invalid number', () => expect(validateLuhn('1234567890123456')).toBe(false))
  it('returns false for empty string', () => expect(validateLuhn('')).toBe(false))
})

describe('detectCardNetwork', () => {
  it('detects Visa by prefix 4', () => expect(detectCardNetwork('4111111111111111')).toBe('VISA'))
  it('detects MasterCard by prefix 51-55', () => expect(detectCardNetwork('5500005555555559')).toBe('MASTERCARD'))
  it('returns UNKNOWN for unrecognized prefix', () => expect(detectCardNetwork('3714496353984312')).toBe('UNKNOWN'))
})
