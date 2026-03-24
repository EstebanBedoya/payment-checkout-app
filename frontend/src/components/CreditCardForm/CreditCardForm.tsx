import { useState } from 'react'
import { validateLuhn, detectCardNetwork, type CardNetwork } from '../../utils/luhn'
import { CardNetworkLogo } from '../CardNetworkLogo/CardNetworkLogo'
import './CreditCardForm.css'

export interface CardData {
  number: string
  cardHolder: string
  expMonth: string
  expYear: string
  cvc: string
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

export function CreditCardForm({ onSubmit }: { onSubmit: (data: CardData) => void }) {
  const [number, setNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expMonth, setExpMonth] = useState('')
  const [expYear, setExpYear] = useState('')
  const [cvc, setCvc] = useState('')
  const [touched, setTouched] = useState(false)

  const network: CardNetwork = detectCardNetwork(number)

  const isLuhnValid = validateLuhn(number)
  const isCardHolderValid = cardHolder.trim().length > 2
  const isExpMonthValid = /^\d{2}$/.test(expMonth) && parseInt(expMonth, 10) >= 1 && parseInt(expMonth, 10) <= 12
  const isExpYearValid = /^\d{2}$/.test(expYear)

  let isFutureDate = false
  if (isExpMonthValid && isExpYearValid) {
    const now = new Date()
    const currentYear = now.getFullYear() % 100
    const currentMonth = now.getMonth() + 1
    const year = parseInt(expYear, 10)
    const month = parseInt(expMonth, 10)
    if (year > currentYear || (year === currentYear && month >= currentMonth)) {
      isFutureDate = true
    }
  }

  const isCvcValid = /^\d{3,4}$/.test(cvc)
  const isValid = isLuhnValid && isCardHolderValid && isFutureDate && isCvcValid
  const showError = touched && !isValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (isValid) {
      onSubmit({
        number: number.replace(/\s/g, ''),
        cardHolder,
        expMonth,
        expYear,
        cvc,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} onBlur={() => setTouched(true)} className="credit-card-form" noValidate>
      <div className="form-group">
        <label htmlFor="cc-number" className="form-label">Número de tarjeta</label>
        <div className={`input-with-logo${showError && !isLuhnValid ? ' input-error' : ''}`}>
          <input
            id="cc-number"
            value={number}
            onChange={e => setNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            inputMode="numeric"
            aria-invalid={showError && !isLuhnValid ? 'true' : 'false'}
          />
          <CardNetworkLogo network={network} />
        </div>
        {showError && !isLuhnValid && <span role="alert" className="error-text">Número inválido</span>}
      </div>

      <div className="form-group">
        <label htmlFor="cc-holder" className="form-label">Nombre del titular</label>
        <input
          id="cc-holder"
          value={cardHolder}
          onChange={e => setCardHolder(e.target.value)}
          placeholder="Como aparece en la tarjeta"
          className={showError && !isCardHolderValid ? 'input-error' : ''}
          aria-invalid={showError && !isCardHolderValid ? 'true' : 'false'}
        />
        {showError && !isCardHolderValid && <span role="alert" className="error-text">Nombre inválido</span>}
      </div>

      <div className="expiry-row">
        <div className="form-group">
          <label htmlFor="cc-month" className="form-label">Mes exp.</label>
          <input
            id="cc-month"
            value={expMonth}
            onChange={e => setExpMonth(e.target.value)}
            placeholder="MM"
            maxLength={2}
            inputMode="numeric"
            className={showError && !isExpMonthValid ? 'input-error' : ''}
            aria-invalid={showError && !isExpMonthValid ? 'true' : 'false'}
          />
        </div>
        <div className="form-group">
          <label htmlFor="cc-year" className="form-label">Año exp.</label>
          <input
            id="cc-year"
            value={expYear}
            onChange={e => setExpYear(e.target.value)}
            placeholder="YY"
            maxLength={2}
            inputMode="numeric"
            className={showError && !isFutureDate ? 'input-error' : ''}
            aria-invalid={showError && !isFutureDate ? 'true' : 'false'}
          />
        </div>
        <div className="form-group">
          <label htmlFor="cc-cvc" className="form-label">CVV</label>
          <input
            id="cc-cvc"
            value={cvc}
            onChange={e => setCvc(e.target.value)}
            placeholder="123"
            maxLength={4}
            type="password"
            inputMode="numeric"
            className={showError && !isCvcValid ? 'input-error' : ''}
            aria-invalid={showError && !isCvcValid ? 'true' : 'false'}
          />
        </div>
      </div>
      {showError && !isFutureDate && <span role="alert" className="error-text">Fecha expirada o inválida</span>}
      {showError && !isCvcValid && <span role="alert" className="error-text">CVV inválido</span>}

      <button type="submit" disabled={!isValid} className="btn-primary">
        Continuar
      </button>
    </form>
  )
}
