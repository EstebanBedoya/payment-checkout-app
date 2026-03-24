import { formatCOP } from './currency'

it('formats 15000000 cents as COP $150.000', () => {
  expect(formatCOP(15000000)).toMatch(/150\.000/)
})
