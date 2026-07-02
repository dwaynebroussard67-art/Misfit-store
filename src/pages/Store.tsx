import { useEffect, useState } from 'react'
import { supabase, type StoreProduct } from '../lib/supabase'
import { CartItem } from '../lib/types'

interface StoreProps {
  onAddToCart: (item: CartItem) => void
}

export default function Store({ onAddToCart }: StoreProps) {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('store_products')
          .select('*')
          .eq('status', 'live')
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        console.error('Failed to load products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleSelectSize = (productId: string, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }))
  }

  const handleAddToCart = (product: StoreProduct) => {
    const size = selectedSizes[product.id]
    if (!size) {
      alert('Please select a size')
      return
    }

    onAddToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size,
      quantity: 1
    })

    alert(`${product.name} added to cart!`)
    setSelectedSizes(prev => ({ ...prev, [product.id]: '' }))
  }

  if (loading) return <div className="container" style={{ textAlign: 'center' }}>Loading store...</div>

  if (products.length === 0) {
    return <div className="container" style={{ textAlign: 'center', color: 'rgba(237,230,217,0.6)' }}>
      No products available yet. Check back soon!
    </div>
  }

  return (
    <div className="container">
      <h2 style={{ marginBottom: 40, fontSize: 28 }}>Merch</h2>
      <div className="products">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} className="product-image" />
            <div className="product-name">{product.name}</div>
            <div className="product-price">${product.price.toFixed(2)}</div>

            <div className="product-sizes">
              {product.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => handleSelectSize(product.id, size)}
                  className={`size-btn ${selectedSizes[product.id] === size ? 'active' : ''}`}
                >
                  {size}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleAddToCart(product)}
              className="add-to-cart"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
