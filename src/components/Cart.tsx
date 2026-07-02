import { CartItem } from '../lib/types'
import { useState } from 'react'

interface CartProps {
  items: CartItem[]
  onRemove: (productId: string, size: string) => void
  onClose: () => void
}

export default function Cart({ items, onRemove, onClose }: CartProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleCheckout = async () => {
    if (items.length === 0) return
    
    setIsCheckingOut(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      alert('Checkout failed. Please try again.')
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="container">
      <button onClick={onClose} style={{ marginBottom: 20, color: 'var(--gold)' }}>← Back</button>
      
      <h2 style={{ marginBottom: 30 }}>Cart</h2>

      {items.length === 0 ? (
        <p style={{ color: 'rgba(237,230,217,0.6)' }}>Your cart is empty</p>
      ) : (
        <>
          <div style={{ marginBottom: 40 }}>
            {items.map(item => (
              <div key={`${item.productId}-${item.size}`} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: '1px solid rgba(212,175,55,0.1)'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: 'rgba(237,230,217,0.6)' }}>Size: {item.size} × {item.quantity}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--gold)', marginBottom: 8 }}>${(item.price * item.quantity).toFixed(2)}</div>
                  <button 
                    onClick={() => onRemove(item.productId, item.size)}
                    style={{ fontSize: 12, color: 'var(--blood)', opacity: 0.7 }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'right', marginBottom: 40 }}>
            <div style={{ fontSize: 18, color: 'var(--gold)', fontWeight: 600 }}>
              Total: ${total.toFixed(2)}
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            style={{
              width: '100%',
              padding: '16px',
              background: 'var(--blood)',
              color: 'var(--bone)',
              fontSize: 16,
              fontWeight: 600,
              opacity: isCheckingOut ? 0.6 : 1
            }}
          >
            {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
          </button>
        </>
      )}
    </div>
  )
}
