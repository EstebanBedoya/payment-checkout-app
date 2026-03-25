import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '../../store'
import { setStep } from '../../store/checkout/checkout.slice'
import { setTokenId, setAmounts, setAcceptanceToken, setLoading, setError } from '../../store/payment/payment.slice'
import { processPayment } from '../../store/payment/payment.thunks'
import { CreditCardForm } from '../../components/CreditCardForm/CreditCardForm'
import { DeliveryForm } from '../../components/DeliveryForm/DeliveryForm'
import { SummaryBackdrop } from '../../components/SummaryBackdrop/SummaryBackdrop'
import { upsertCustomer } from '../../api/customers.api'
import { fetchProduct } from '../../api/products.api'
import { WompiTokenizationAdapter } from '../../adapters/wompi/wompi-tokenization.adapter'
import { WOMPI_PUBLIC_KEY, WOMPI_API_URL } from '../../utils/env'

const wompiAdapter = new WompiTokenizationAdapter({
  publicKey: WOMPI_PUBLIC_KEY,
  apiUrl: WOMPI_API_URL,
})

const BASE_FEE = 300000
const DELIVERY_FEE = 500000

interface CardData {
  number: string
  cardHolder: string
  expMonth: string
  expYear: string
  cvc: string
}

interface CustomerData {
  name: string
  email: string
  phone: string
  address: string
  city: string
}

export function CheckoutPage() {
  const dispatch = useDispatch<AppDispatch>()
  const step = useSelector((s: RootState) => s.checkout.step)
  const productId = useSelector((s: RootState) => s.checkout.productId)
  const { tokenId, acceptanceToken, amounts, loading, error } = useSelector((s: RootState) => s.payment)
  
  const [cardData, setCardData] = useState<CardData | null>(null)
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)

  const handleCardSubmit = async (data: CardData) => {
    setCardData(data)
    dispatch(setStep(2.5))
  }

  const handleDeliverySubmit = async (data: CustomerData) => {
    dispatch(setLoading(true))
    setCustomerData(data)
    
    try {
      const [customer, product, acceptanceResult] = await Promise.all([
        upsertCustomer(data),
        fetchProduct(productId!),
        wompiAdapter.getAcceptanceToken(),
      ])

      if (!acceptanceResult.success) {
        dispatch(setError('No se pudo obtener el token de aceptación'))
        return
      }

      if (!cardData) {
        dispatch(setError('Datos de tarjeta no disponibles'))
        return
      }

      const tokenResult = await wompiAdapter.tokenizeCard({
        number: cardData.number,
        cvc: cardData.cvc,
        expMonth: cardData.expMonth,
        expYear: cardData.expYear,
        cardHolder: cardData.cardHolder,
      })

      if (!tokenResult.success) {
        dispatch(setError('Error al tokenizar la tarjeta'))
        return
      }

      setCustomerId(customer.id)
      dispatch(setTokenId(tokenResult.tokenId))
      dispatch(setAcceptanceToken(acceptanceResult.token))
      dispatch(setAmounts({
        productPrice: product.priceInCents,
        baseFee: BASE_FEE,
        deliveryFee: DELIVERY_FEE,
        total: product.priceInCents + BASE_FEE + DELIVERY_FEE,
      }))
      dispatch(setStep(3))
    } catch (err: any) {
      dispatch(setError(err.message || 'Error al procesar los datos'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleConfirmPayment = () => {
    if (!tokenId || !acceptanceToken || !customerId || !customerData || !productId) {
      dispatch(setError('Faltan datos para procesar el pago'))
      return
    }

    dispatch(processPayment({
      customerId,
      productId,
      cardTokenId: tokenId,
      installments: 1,
      acceptanceToken,
      customerEmail: customerData.email,
      address: customerData.address,
      city: customerData.city,
    }))
  }

  const handleBack = () => {
    dispatch(setStep(2))
  }

  if (step === 3 && amounts) {
    return (
      <SummaryBackdrop
        amounts={amounts}
        onConfirm={handleConfirmPayment}
        onBack={handleBack}
        loading={loading}
      />
    )
  }

  return (
    <div className="checkout-page">
      {step === 2 && (
        <CreditCardForm onSubmit={handleCardSubmit} />
      )}
      {step === 2.5 && (
        <DeliveryForm onSubmit={handleDeliverySubmit} />
      )}
      {error && (
        <div className="error-message" role="alert">
          <p>{error}</p>
          <button onClick={() => dispatch(setError(null))}>Cerrar</button>
        </div>
      )}
    </div>
  )
}
