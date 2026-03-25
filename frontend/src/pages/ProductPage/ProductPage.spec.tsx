import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import checkoutReducer from '../../store/checkout/checkout.slice'
import productReducer from '../../store/product/product.slice'
import paymentReducer from '../../store/payment/payment.slice'

jest.mock('../../api/products.api', () => ({
  fetchProducts: jest.fn(),
}))

import { fetchProducts } from '../../api/products.api'
import { ProductPage } from './ProductPage'

const makeStore = (productId: string | null = 'p1') => configureStore({
  reducer: {
    checkout: checkoutReducer,
    product: productReducer,
    payment: paymentReducer
  },
  preloadedState: {
    checkout: { step: 1, productId, transactionId: null },
  }
})

const product = { 
  id: 'p1', 
  name: 'Audífonos BT-500', 
  description: 'Great', 
  imageUrl: 'https://img.com', 
  priceInCents: 15000000, 
  stock: 5 
}

describe('ProductPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows product name, image, description, price and stock', async () => {
    ;(fetchProducts as jest.Mock).mockResolvedValue([product])
    
    render(<Provider store={makeStore()}><ProductPage /></Provider>)
    
    expect(await screen.findByText('Audífonos BT-500')).toBeInTheDocument()
    expect(screen.getByAltText('Audífonos BT-500')).toBeInTheDocument()
    expect(screen.getByText('Great')).toBeInTheDocument()
    expect(screen.getByText(/5 disponibles/i)).toBeInTheDocument()
  })

  it('shows "Sin stock disponible" text when stock is 0', async () => {
    ;(fetchProducts as jest.Mock).mockResolvedValue([{ ...product, stock: 0 }])
    
    render(<Provider store={makeStore()}><ProductPage /></Provider>)
    
    expect(await screen.findAllByText(/sin stock disponible/i)).toHaveLength(2)
  })

  it('disables pay button when stock is 0', async () => {
    ;(fetchProducts as jest.Mock).mockResolvedValue([{ ...product, stock: 0 }])
    
    render(<Provider store={makeStore()}><ProductPage /></Provider>)
    
    const btn = await screen.findByRole('button', { name: /sin stock disponible/i })
    expect(btn).toBeDisabled()
  })

  it('enables pay button when stock > 0', async () => {
    ;(fetchProducts as jest.Mock).mockResolvedValue([product])
    
    render(<Provider store={makeStore()}><ProductPage /></Provider>)
    
    const btn = await screen.findByRole('button', { name: /pagar con tarjeta/i })
    expect(btn).toBeEnabled()
  })

  it('navigates to checkout when pay button clicked', async () => {
    ;(fetchProducts as jest.Mock).mockResolvedValue([product])
    const onPay = jest.fn()
    
    render(<Provider store={makeStore()}><ProductPage onPayClick={onPay} /></Provider>)
    
    const btn = await screen.findByRole('button', { name: /pagar con tarjeta/i })
    fireEvent.click(btn)
    
    expect(onPay).toHaveBeenCalled()
  })
})
