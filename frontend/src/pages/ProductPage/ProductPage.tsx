import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { setStep, setProductId } from '../../store/checkout/checkout.slice'
import { fetchProducts, type Product } from '../../api/products.api'
import { formatCOP } from '../../utils/currency'
import './ProductPage.css'

export function ProductPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()
  const productId = useSelector((s: RootState) => s.checkout.productId)

  useEffect(() => {
    fetchProducts()
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="loading-state">Cargando catálogo...</div>
  }

  // Detail View
  if (productId) {
    const product = products.find(p => p.id === productId)
    
    if (!product) {
      return <div className="error-state">Producto no encontrado</div>
    }

    return (
      <div className="product-detail-view">
        <div className="product-image-large">
          <img src={product.imageUrl} alt={product.name} />
        </div>
        
        <div className="product-content-sheet">
          <div className="product-header">
            <h1 className="product-title">{product.name}</h1>
            <p className="product-price">{formatCOP(product.priceInCents)}</p>
          </div>
          
          <div className="product-info-section">
            <p className="product-description">{product.description}</p>
            <p className="product-stock-badge">
              {product.stock > 0 ? `${product.stock} unidades en bóveda` : 'Agotado'}
            </p>
          </div>
          
          <div className="action-area">
            <button
              className="btn-primary product-pay-btn"
              onClick={() => dispatch(setStep(2))}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'Sin stock disponible' : 'Pagar con tarjeta de crédito'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // List View
  return (
    <div className="product-list-view">
      <h1 className="list-title">Catálogo Exclusivo</h1>
      <div className="product-grid">
        {products.map(product => (
          <div 
            key={product.id} 
            className="product-card-premium"
            onClick={() => dispatch(setProductId(product.id))}
          >
            <div className="card-image-wrapper">
              <img src={product.imageUrl} alt={product.name} loading="lazy" />
            </div>
            <div className="card-content-wrapper">
              <h3 className="card-title">{product.name}</h3>
              <p className="card-price">{formatCOP(product.priceInCents)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
