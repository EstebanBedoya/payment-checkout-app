import '@testing-library/jest-dom'
import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { useFocusTrap } from './useFocusTrap'

function makeContainer(...labels: string[]): HTMLElement {
  const div = document.createElement('div')
  labels.forEach((label, i) => {
    const btn = document.createElement('button')
    btn.textContent = label
    btn.setAttribute('data-testid', `btn-${i}`)
    div.appendChild(btn)
  })
  document.body.appendChild(div)
  return div
}

describe('useFocusTrap', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('focuses the first focusable element on mount', () => {
    const container = makeContainer('First', 'Second')
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(container as any)
      useFocusTrap(ref, true)
      return ref
    })
    expect(document.activeElement).toBe(container.querySelector('button'))
    result.current // keep ref alive
  })

  it('restores focus to previous element on unmount', () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Open'
    document.body.appendChild(trigger)
    trigger.focus()

    const container = makeContainer('Inside')
    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(container as any)
      useFocusTrap(ref, true)
      return ref
    })
    unmount()
    expect(document.activeElement).toBe(trigger)
  })

  it('traps Tab at last element — wraps to first', () => {
    const container = makeContainer('A', 'B', 'C')
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(container as any)
      useFocusTrap(ref, true)
      return ref
    })
    const buttons = Array.from(container.querySelectorAll('button')) as HTMLButtonElement[]
    buttons[buttons.length - 1].focus()

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    Object.defineProperty(tabEvent, 'preventDefault', { value: jest.fn() })
    container.dispatchEvent(tabEvent)
    // After trap, focus should move to first
    expect((tabEvent as any).preventDefault).toHaveBeenCalled()
  })

  it('traps Shift+Tab at first element — wraps to last', () => {
    const container = makeContainer('A', 'B', 'C')
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(container as any)
      useFocusTrap(ref, true)
      return ref
    })
    const buttons = Array.from(container.querySelectorAll('button')) as HTMLButtonElement[]
    buttons[0].focus()

    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
    Object.defineProperty(shiftTabEvent, 'preventDefault', { value: jest.fn() })
    container.dispatchEvent(shiftTabEvent)
    expect((shiftTabEvent as any).preventDefault).toHaveBeenCalled()
  })
})
