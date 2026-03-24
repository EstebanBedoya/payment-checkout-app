import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../../store'

import { fetchTransactionStatus } from '../../store/payment/payment.thunks'

import { formatCOP } from '../../utils/currency'

interface Props {
  onRestart?: () => void
}

export function StatusPage({ onRestart }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const { result, loading, error } = useSelector((state: RootState) => state.payment)
  const { transactionId } = useSelector((state: RootState) => state.checkout)

  useEffect(() => {
    if (transactionId && !result && !loading && !error) {
      dispatch(fetchTransactionStatus(transactionId))
    }
  }, [transactionId, result, loading, error, dispatch])

  if (loading) {

    return (
      <div className="page status-page status-page--loading">
        <div className="loading-spinner"></div>
        <p>Verificando el estado de tu pago...</p>
      </div>
    )
  }

  const isSuccess = result?.status === 'APPROVED'
  const isDeclined = result?.status === 'DECLINED' || result?.status === 'REJECTED' || result?.status === 'ERROR'
  const isPending = result?.status === 'PENDING'

  return (
    <div className={`page status-page status-page--${result?.status?.toLowerCase() || 'unknown'}`}>
      <div className="status-card">
        <div className="status-card__icon">
          {isSuccess && <span className="icon-success">✓</span>}
          {isDeclined && <span className="icon-error">✕</span>}
          {isPending && <span className="icon-pending">⌛</span>}
        </div>

        <h1 className="status-card__title">
          {isSuccess && '¡Pago Exitoso!'}
          {isDeclined && 'Pago Rechazado'}
          {isPending && 'Pago Pendiente'}
          {!result && 'Estado Desconocido'}
        </h1>

        <div className="status-card__details">
          {result && (
            <>
              <div className="status-row">
                <span>Referencia:</span>
                <strong>{result.reference || result.transactionId}</strong>
              </div>
              {result.amountInCents && (
                <div className="status-row">
                  <span>Monto:</span>
                  <strong>{formatCOP(result.amountInCents)}</strong>
                </div>
              )}
            </>
          )}

          {error && <p className="status-error-msg">{error}</p>}
        </div>

        <div className="status-card__actions">
          <button className="btn-secondary" onClick={() => onRestart?.()}>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
