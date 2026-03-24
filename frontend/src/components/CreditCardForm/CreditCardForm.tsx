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

export function CreditCardForm({ onSubmit }: { onSubmit: (data: CardData) => void }) {
  const [number, setNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expMonth, setExpMonth] = useState('')
  const [expYear, setExpYear] = useState('')
  const [cvc, setCvc] = useState('')
  const [touched, setTouched] = useState(false)

  const network: CardNetwork = detectCardNetwork(number)

  // Validations
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
        cvc
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} onBlur={() => setTouched(true)} className="credit-card-form" noValidate>
      <div className="form-group">
        <div className={`input-with-logo ${showError && !isLuhnValid ? 'input-error' : ''}`}>
          <input
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder="Número de tarjeta"
            maxLength={19}
            aria-invalid={showError && !isLuhnValid ? 'true' : 'false'}
          />
          <CardNetworkLogo network={network} />
        </div>
        {showError && !isLuhnValid && <span role="alert" className="error-text">Número inválido</span>}
      </div>

      <div className="form-group">
        <input
          value={cardHolder}
          onChange={e => setCardHolder(e.target.value)}
          placeholder="Nombre del titular"
          className={showError && !isCardHolderValid ? 'input-error' : ''}
          aria-invalid={showError && !isCardHolderValid ? 'true' : 'false'}
        />
        {showError && !isCardHolderValid && <span role="alert" className="error-text">Nombre inválido</span>}
      </div>

      <div className="expiry-row">
        <div className="form-group">
          <input
            value={expMonth}
            onChange={e => setExpMonth(e.target.value)}
            placeholder="MM"
            maxLength={2}
            className={showError && !isExpMonthValid ? 'input-error' : ''}
            aria-invalid={showError && !isExpMonthValid ? 'true' : 'false'}
          />
        </div>
        <div className="form-group">
          <input
            value={expYear}
            onChange={e => setExpYear(e.target.value)}
            placeholder="YY"
            maxLength={2}
            className={showError && !isFutureDate ? 'input-error' : ''}
            aria-invalid={showError && !isFutureDate ? 'true' : 'false'}
          />
        </div>
        <div className="form-group">
          <input
            value={cvc}
            onChange={e => setCvc(e.target.value)}
            placeholder="CVV"
            maxLength={4}
            type="password"
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
