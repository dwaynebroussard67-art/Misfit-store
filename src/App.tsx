import { useState, useEffect } from 'react'
import Store from './pages/Store'
import Nav from './components/Nav'
import Cart from './components/Cart'
import { CartItem } from './lib/types'

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('misfit-cart')
    if (saved) setCart(JSON.parse(saved))
  }, [])

  const handleAddToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.size === item.size)
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, item]
    })
    localStorage.setItem('misfit-cart', JSON.stringify([...cart, item]))
  }

  const handleRemoveFromCart = (productId: string, size: string) => {
    setCart(prev => prev.filter(i => !(i.productId === productId && i.size === size)))
  }

  return (
    <div className="store">
      <Nav cartCount={cart.length} onCartClick={() => setShowCart(!showCart)} />
      {showCart ? (
        <Cart items={cart} onRemove={handleRemoveFromCart} onClose={() => setShowCart(false)} />
      ) : (
        <Store onAddToCart={handleAddToCart} />
      )}
    </div>
  )
}
