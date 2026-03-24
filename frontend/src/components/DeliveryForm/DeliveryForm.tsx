import { useState } from 'react'
import './DeliveryForm.css'

export interface DeliveryData {
  name: string
  email: string
  phone: string
  address: string
  city: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function DeliveryForm({ onSubmit }: { onSubmit: (data: DeliveryData) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [touched, setTouched] = useState(false)

  const isNameValid = name.trim().length > 2
  const isEmailValid = EMAIL_RE.test(email)
  const isPhoneValid = phone.replace(/\D/g, '').length >= 7
  const isAddressValid = address.trim().length > 4
  const isCityValid = city.trim().length > 2

  const isValid = isNameValid && isEmailValid && isPhoneValid && isAddressValid && isCityValid
  const showError = touched && !isValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (isValid) {
      onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, ''),
        address: address.trim(),
        city: city.trim()
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} onBlur={() => setTouched(true)} className="delivery-form" noValidate>
      <div className="form-group">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre completo"
          className={showError && !isNameValid ? 'input-error' : ''}
          aria-invalid={showError && !isNameValid ? 'true' : 'false'}
        />
        {showError && !isNameValid && <span role="alert" className="error-text">Nombre inválido</span>}
      </div>

      <div className="form-group">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          className={showError && !isEmailValid ? 'input-error' : ''}
          aria-invalid={showError && !isEmailValid ? 'true' : 'false'}
        />
        {showError && !isEmailValid && <span role="alert" className="error-text">Correo inválido</span>}
      </div>

      <div className="form-group">
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Teléfono"
          className={showError && !isPhoneValid ? 'input-error' : ''}
          aria-invalid={showError && !isPhoneValid ? 'true' : 'false'}
        />
        {showError && !isPhoneValid && <span role="alert" className="error-text">Teléfono inválido (min 7 dígitos)</span>}
      </div>

      <div className="row-group">
        <div className="form-group">
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Dirección"
            className={showError && !isAddressValid ? 'input-error' : ''}
            aria-invalid={showError && !isAddressValid ? 'true' : 'false'}
          />
          {showError && !isAddressValid && <span role="alert" className="error-text">Dirección inválida</span>}
        </div>
        <div className="form-group">
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Ciudad"
            className={showError && !isCityValid ? 'input-error' : ''}
            aria-invalid={showError && !isCityValid ? 'true' : 'false'}
          />
          {showError && !isCityValid && <span role="alert" className="error-text">Ciudad inválida</span>}
        </div>
      </div>

      <button type="submit" disabled={!isValid} className="btn-primary">
        Continuar a Pago
      </button>
    </form>
  )
}
