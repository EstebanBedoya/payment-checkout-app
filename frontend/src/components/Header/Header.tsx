import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../../store'
import { setStep, setProductId } from '../../store/checkout/checkout.slice'
import './Header.css'

export function Header() {
  const dispatch = useDispatch<AppDispatch>()
  const step = useSelector((s: RootState) => s.checkout.step)
  const productId = useSelector((s: RootState) => s.checkout.productId)

  const handleBack = () => {
    if (step === 4) return // On status page, back is handled by "Restart" button
    
    if (step > 1) {
      dispatch(setStep(1))
    } else if (step === 1 && productId) {
      dispatch(setProductId(null))
    }
  }

  const showBack = step > 1 || (step === 1 && productId)

  return (
    <header className="app-header">
      <div className="header-content">
        {showBack ? (
          <button className="back-button" onClick={handleBack} aria-label="Volver">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Atrás</span>
          </button>
        ) : (
          <div className="logo-placeholder">Vault</div>
        )}
      </div>
    </header>
  )
}
