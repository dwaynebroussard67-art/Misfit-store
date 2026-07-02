interface NavProps {
  cartCount: number
  onCartClick: () => void
}

export default function Nav({ cartCount, onCartClick }: NavProps) {
  return (
    <nav className="nav">
      <h1><span className="logo">⚔</span> MISFIT STORE</h1>
      <button 
        onClick={onCartClick}
        style={{ position: 'relative', background: 'none', fontSize: 16, color: 'var(--gold)' }}
      >
        🛒 Cart
        {cartCount > 0 && <div className="cart-badge">{cartCount}</div>}
      </button>
    </nav>
  )
}
