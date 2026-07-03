import { useEffect, useRef, useState, useCallback } from 'react'
import {
  fetchProducts, updateProduct, insertProduct, saveOrder,
  type StoreProduct,
} from '../lib/supabase'
import { CartItem } from '../lib/types'
import OwnerBar from '../components/OwnerBar'
import ImagePicker from '../components/ImagePicker'

interface StoreProps {
  onAddToCart: (item: CartItem) => void
}

type EditField = { id: string; field: 'price' | 'name' } | null

export default function Store({ onAddToCart }: StoreProps) {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})

  // Forge Mode (owner editing)
  const [forgeMode, setForgeMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<EditField>(null)
  const [editValue, setEditValue] = useState('')
  const [pickerFor, setPickerFor] = useState<string | null>(null)

  // Drag state
  const [dragId, setDragId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const dragIdRef = useRef<string | null>(null)
  const productsRef = useRef<StoreProduct[]>([])
  productsRef.current = products

  const load = useCallback(async (includeHidden: boolean) => {
    try {
      setLoadError(false)
      const data = await fetchProducts(includeHidden)
      setProducts(data)
    } catch (err) {
      console.error('Failed to load products:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(forgeMode) }, [load, forgeMode])

  const persist = async (work: () => Promise<void>) => {
    setSaving(true)
    try {
      await work()
    } catch (err) {
      console.error('Save failed:', err)
      alert('Save failed. Check that you are signed in as the owner.')
      await load(forgeMode)
    } finally {
      setSaving(false)
    }
  }

  // ---------- Inline editing ----------

  const startEdit = (id: string, field: 'price' | 'name', current: string) => {
    if (!forgeMode) return
    setEditing({ id, field })
    setEditValue(current)
  }

  const commitEdit = () => {
    if (!editing) return
    const { id, field } = editing
    const value = editValue.trim()
    setEditing(null)
    if (!value) return

    if (field === 'price') {
      const dollars = parseFloat(value.replace(/[$,\s]/g, ''))
      if (isNaN(dollars) || dollars <= 0) return
      const cents = Math.round(dollars * 100)
      setProducts(prev => prev.map(p =>
        p.id === id ? { ...p, price_cents: cents, price: cents / 100 } : p
      ))
      persist(() => updateProduct(id, { price_cents: cents }))
    } else {
      setProducts(prev => prev.map(p => (p.id === id ? { ...p, name: value } : p)))
      persist(() => updateProduct(id, { name: value }))
    }
  }

  // ---------- Artwork ----------

  const changeImage = (id: string, url: string) => {
    setPickerFor(null)
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, image_url: url, image: url } : p
    ))
    persist(() => updateProduct(id, { image_url: url }))
  }

  // ---------- Visibility / add ----------

  const toggleHidden = (p: StoreProduct) => {
    const status = p.status === 'live' ? 'hidden' : 'live'
    setProducts(prev => prev.map(x => (x.id === p.id ? { ...x, status } : x)))
    persist(() => updateProduct(p.id, { status }))
  }

  const addWindow = () => {
    persist(async () => {
      const created = await insertProduct({
        name: 'New Piece',
        description: '',
        price_cents: 2499,
        image_url: '/images/products/design-01.jpg',
        sizes: ['S', 'M', 'L', 'XL', '2XL'],
        category: 'apparel',
        status: 'hidden',
        display_order: productsRef.current.length,
      })
      setProducts(prev => [...prev, created])
    })
  }

  // ---------- Drag to arrange (pointer events: mouse + touch) ----------

  const onDragStart = (e: React.PointerEvent, id: string) => {
    if (!forgeMode) return
    e.preventDefault()
    dragIdRef.current = id
    setDragId(id)
    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', onDragEnd, { once: true })
  }

  const onDragMove = (e: PointerEvent) => {
    const id = dragIdRef.current
    const grid = gridRef.current
    if (!id || !grid) return
    const windows = Array.from(grid.querySelectorAll<HTMLElement>('[data-window-id]'))
    const from = productsRef.current.findIndex(p => p.id === id)
    if (from < 0) return

    let to = from
    for (const el of windows) {
      const r = el.getBoundingClientRect()
      if (
        e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top && e.clientY <= r.bottom
      ) {
        const overId = el.dataset.windowId!
        to = productsRef.current.findIndex(p => p.id === overId)
        break
      }
    }
    if (to !== from && to >= 0) {
      setProducts(prev => {
        const next = [...prev]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
      })
    }
  }

  const onDragEnd = () => {
    window.removeEventListener('pointermove', onDragMove)
    dragIdRef.current = null
    setDragId(null)
    const ids = productsRef.current.map(p => p.id)
    persist(() => saveOrder(ids))
  }

  // ---------- Cart ----------

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
      image: product.image || '',
      size,
      quantity: 1,
    })
    setSelectedSizes(prev => ({ ...prev, [product.id]: '' }))
  }

  // ---------- Render ----------

  if (loading) {
    return <div className="container hall-empty">Lighting the hall…</div>
  }

  const visible = forgeMode ? products : products.filter(p => p.status === 'live')

  return (
    <div className="container hall">
      <OwnerBar forgeMode={forgeMode} onForgeModeChange={setForgeMode} saving={saving} />

      <header className="hall-head">
        <h2>The Armory</h2>
        <p>Wear the message. Every window holds a piece of the vault.</p>
      </header>

      {loadError && (
        <div className="hall-empty">
          The hall is dark right now — couldn't reach the vault. Refresh to try again.
        </div>
      )}

      {!loadError && visible.length === 0 && (
        <div className="hall-empty">
          {forgeMode
            ? 'No windows yet. Add one below to begin.'
            : 'The windows are being dressed. Check back soon.'}
        </div>
      )}

      <div className="windows" ref={gridRef}>
        {visible.map(product => {
          const isDragging = dragId === product.id
          const isHidden = product.status === 'hidden'
          const editingPrice = editing?.id === product.id && editing.field === 'price'
          const editingName = editing?.id === product.id && editing.field === 'name'

          return (
            <article
              key={product.id}
              data-window-id={product.id}
              className={[
                'window',
                forgeMode ? 'forge' : '',
                isDragging ? 'dragging' : '',
                isHidden ? 'shuttered' : '',
              ].join(' ')}
            >
              {forgeMode && (
                <div className="window-tools">
                  <button
                    className="drag-handle"
                    onPointerDown={e => onDragStart(e, product.id)}
                    aria-label="Drag to arrange"
                    title="Drag to arrange"
                  >
                    ⠿
                  </button>
                  <button
                    className="tool-btn"
                    onClick={() => toggleHidden(product)}
                    title={isHidden ? 'Show in store' : 'Hide from store'}
                  >
                    {isHidden ? '🕯 Unveil' : '⛧ Shutter'}
                  </button>
                </div>
              )}

              <div
                className="window-glass"
                onClick={() => forgeMode && setPickerFor(product.id)}
                role={forgeMode ? 'button' : undefined}
                title={forgeMode ? 'Tap to change artwork' : undefined}
              >
                {product.image
                  ? <img src={product.image} alt={product.name} className="window-art" />
                  : <div className="window-art placeholder">No artwork</div>}
                {forgeMode && <div className="glass-hint">Tap to change artwork</div>}
              </div>

              <div className="window-sill">
                {editingName ? (
                  <input
                    className="inline-edit name"
                    value={editValue}
                    autoFocus
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => e.key === 'Enter' && commitEdit()}
                  />
                ) : (
                  <div
                    className={`window-name ${forgeMode ? 'editable' : ''}`}
                    onClick={() => startEdit(product.id, 'name', product.name)}
                  >
                    {product.name}
                  </div>
                )}

                {editingPrice ? (
                  <input
                    className="inline-edit price"
                    value={editValue}
                    autoFocus
                    inputMode="decimal"
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => e.key === 'Enter' && commitEdit()}
                  />
                ) : (
                  <button
                    className={`plaque ${forgeMode ? 'editable' : ''}`}
                    onClick={() => startEdit(product.id, 'price', product.price.toFixed(2))}
                    disabled={!forgeMode}
                  >
                    ${product.price.toFixed(2)}
                  </button>
                )}

                {!forgeMode && (
                  <>
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
                    <button onClick={() => handleAddToCart(product)} className="add-to-cart">
                      Add to Cart
                    </button>
                  </>
                )}
              </div>
            </article>
          )
        })}

        {forgeMode && (
          <button className="window add-window" onClick={addWindow}>
            <span className="add-glyph">＋</span>
            <span>New window</span>
            <span className="add-note">Starts shuttered — unveil when ready</span>
          </button>
        )}
      </div>

      {pickerFor && (
        <ImagePicker
          current={products.find(p => p.id === pickerFor)?.image_url ?? null}
          onSelect={url => changeImage(pickerFor, url)}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  )
}
