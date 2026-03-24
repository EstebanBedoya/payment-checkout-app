import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setStep, setProductId } from '../../store/checkout/checkout.slice'
import { fetchProducts, Product } from '../../api/products.api'
import { formatCOP } from '../../utils/currency'

function ProductList({ onPayClick }: { onPayClick?: () => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()

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
    return <div>Cargando producto...</div>
  }

  const product = products[0]

  if (!product) {
    return <div>Producto no encontrado</div>
  }

  const handlePay = () => {
    dispatch(setProductId(product.id))
    dispatch(setStep(2))
    onPayClick?.()
  }

  return (
    <div className="product-page">
      <img src={product.imageUrl} alt={product.name} loading="lazy" />
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p className="price">{formatCOP(product.priceInCents)}</p>
      <p>{product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock disponible'}</p>
      <button
        onClick={handlePay}
        disabled={product.stock === 0}
        aria-label={product.stock === 0 ? 'Sin stock disponible' : 'Pagar con tarjeta de crédito'}
      >
        {product.stock === 0 ? 'Sin stock disponible' : 'Pagar con tarjeta de crédito'}
      </button>
    </div>
  )
}

export function ProductPage({ onPayClick }: { onPayClick?: () => void }) {
  return <ProductList onPayClick={onPayClick} />
}
