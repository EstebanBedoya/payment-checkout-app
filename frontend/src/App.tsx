import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'
import { setStep, resetCheckout } from './store/checkout/checkout.slice'
import { resetPayment } from './store/payment/payment.slice'
import { fetchTransactionStatus } from './store/payment/payment.thunks'
import { ProductPage } from './pages/ProductPage/ProductPage'
import { CheckoutPage } from './pages/CheckoutPage/CheckoutPage'
import { StatusPage } from './pages/StatusPage/StatusPage'
import { Header } from './components/Header/Header'
import { Stepper } from './components/Stepper/Stepper'
import './App.css'

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const step = useSelector((s: RootState) => s.checkout.step)
  const transactionId = useSelector((s: RootState) => s.checkout.transactionId)
  const result = useSelector((s: RootState) => s.payment.result)
  const loading = useSelector((s: RootState) => s.payment.loading)

  // Refresh recovery: on mount, if there's a persisted transactionId without result, fetch it
  useEffect(() => {
    if (transactionId && !result && !loading) {
      dispatch(fetchTransactionStatus(transactionId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If we have a result for a transaction, ensure we're on step 4
  useEffect(() => {
    if (transactionId && result && step !== 4) {
      dispatch(setStep(4))
    }
  }, [transactionId, result, step, dispatch])

  const handleRestart = () => {
    dispatch(resetCheckout())
    dispatch(resetPayment())
  }

  return (
    <div className="app-container">
      <Header />
      <Stepper currentStep={step} />
      <main className="page">
        {step === 4 && <StatusPage onRestart={handleRestart} />}
        {step >= 2 && step < 4 && <CheckoutPage />}
        {step < 2 && <ProductPage />}
      </main>
    </div>
  )
}

export default App
