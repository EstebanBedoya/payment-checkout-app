import { ok, err, Result } from '../result'

describe('Result', () => {
  describe('ok()', () => {
    it('has _tag "ok" and exposes value', () => {
      const r = ok(42)
      expect(r._tag).toBe('ok')
      expect(r.value).toBe(42)
    })

    it('isOk() returns true, isErr() returns false', () => {
      const r = ok('hello')
      expect(r.isOk()).toBe(true)
      expect(r.isErr()).toBe(false)
    })
  })

  describe('err()', () => {
    it('has _tag "err" and exposes error', () => {
      const r = err('boom')
      expect(r._tag).toBe('err')
      expect(r.error).toBe('boom')
    })

    it('isOk() returns false, isErr() returns true', () => {
      const r = err('fail')
      expect(r.isOk()).toBe(false)
      expect(r.isErr()).toBe(true)
    })
  })

  describe('type narrowing', () => {
    it('narrows to Ok inside isOk() guard', () => {
      const r: Result<number, string> = ok(10)
      if (r.isOk()) {
        expect(r.value).toBe(10)
      } else {
        fail('should be Ok')
      }
    })

    it('narrows to Err inside isErr() guard', () => {
      const r: Result<number, string> = err('bad')
      if (r.isErr()) {
        expect(r.error).toBe('bad')
      } else {
        fail('should be Err')
      }
    })
  })
})
