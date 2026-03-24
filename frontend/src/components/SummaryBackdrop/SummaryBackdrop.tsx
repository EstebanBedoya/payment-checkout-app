import { useEffect, useRef } from 'react'
import { formatCOP } from '../../utils/currency'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import './SummaryBackdrop.css'

export interface Amounts {
  productPrice: number
  baseFee: number
  deliveryFee: number
  total: number
}

export function SummaryBackdrop({ amounts, onConfirm, onBack, loading }: {
  amounts: Amounts
  onConfirm: () => void
  onBack: () => void
  loading: boolean
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(dialogRef, !loading)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onBack()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onBack, loading])

  return (
    <div className="backdrop-overlay">
      <div
        className="backdrop-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <h2 id="summary-title" className="backdrop-title">Resumen de pago</h2>

        <div className="summary-content">
          <table className="summary-table">
            <tbody>
              <tr>
                <td>Producto</td>
                <td className="align-right">{formatCOP(amounts.productPrice)}</td>
              </tr>
              <tr>
                <td>Base fee</td>
                <td className="align-right">{formatCOP(amounts.baseFee)}</td>
              </tr>
              <tr>
                <td>Delivery fee</td>
                <td className="align-right">{formatCOP(amounts.deliveryFee)}</td>
              </tr>
              <tr className="total-row">
                <td><strong>Total</strong></td>
                <td className="align-right"><strong>{formatCOP(amounts.total)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="backdrop-actions">
          <button
            className="btn-secondary"
            onClick={onBack}
            disabled={loading}
          >
            Volver
          </button>
          <button
            className="btn-primary btn-cta"
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Procesando...' : 'Confirmar pago'}
          </button>
        </div>
      </div>
    </div>
  )
}
