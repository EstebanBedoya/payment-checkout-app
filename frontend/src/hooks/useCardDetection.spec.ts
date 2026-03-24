import { renderHook } from '@testing-library/react'
import { useCardDetection } from './useCardDetection'

describe('useCardDetection', () => {
  it('initially returns UNKNOWN', () => {
    const { result } = renderHook(() => useCardDetection(''))
    expect(result.current).toBe('UNKNOWN')
  })

  it('returns VISA for prefix 4', () => {
    const { result } = renderHook(() => useCardDetection('4111 1111 1111 1111'))
    expect(result.current).toBe('VISA')
  })

  it('returns MASTERCARD for prefix 51-55', () => {
    const { result } = renderHook(() => useCardDetection('5500 0055 5555 5559'))
    expect(result.current).toBe('MASTERCARD')
  })

  it('returns UNKNOWN for unrecognized prefixes', () => {
    const { result } = renderHook(() => useCardDetection('3714 4963 5398 4312'))
    expect(result.current).toBe('UNKNOWN')
  })
})
