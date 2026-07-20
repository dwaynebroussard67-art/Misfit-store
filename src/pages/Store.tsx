import { HeroBanner } from "@/components/HeroBanner";
import { useAppData } from "@/context/AppDataContext";
import { useCart } from "@/context/CartContext";
import { formatMoney, type Product, type ProductSize } from "@/lib/store";
import { DndContext, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { Grip, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

interface WindowPosition {
  x: number;
  y: number;
  z: number;
}

type WindowMap = Record<string, WindowPosition>;

const POSITION_STORAGE_KEY = "misfit_window_positions";
const WINDOW_WIDTH = 330;

const defaultPositionFor = (index: number): WindowPosition => ({
  x: 24 + (index % 3) * 360,
  y: 24 + Math.floor(index / 3) * 408,
  z: index + 1,
});

const readSavedPositions = (): WindowMap => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(POSITION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WindowMap) : {};
  } catch {
    return {};
  }
};

const persistPositions = (positions: WindowMap) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Ignore storage write failures.
  }
};

const hydratePositions = (products: Product[], current: WindowMap): WindowMap => {
  const next = { ...current };

  products.forEach((product, index) => {
    if (!next[product.id]) {
      next[product.id] = defaultPositionFor(index);
    }
  });

  Object.keys(next).forEach((key) => {
    if (!products.some((product) => product.id === key)) {
      delete next[key];
    }
  });

  return next;
};

interface ProductWindowProps {
  product: Product;
  position: WindowPosition;
  selectedSize?: ProductSize;
  onFocus: (id: string) => void;
  onSelectSize: (productId: string, size: ProductSize) => void;
  onAdd: (product: Product) => void;
  onPriceChange: (product: Product, value: string) => void;
  adminLoggedIn: boolean;
}

function ProductWindow({
  product,
  position,
  selectedSize,
  onFocus,
  onSelectSize,
  onAdd,
  onPriceChange,
  adminLoggedIn,
}: ProductWindowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: product.id });

  const x = position.x + (transform?.x ?? 0);
  const y = position.y + (transform?.y ?? 0);

  const style: CSSProperties = {
    width: WINDOW_WIDTH,
    transform: `translate3d(${x}px, ${y}px, 0) rotate(${isDragging ? 0.7 : 0}deg) scale(${isDragging ? 1.02 : 1})`,
    zIndex: isDragging ? position.z + 1000 : position.z,
  };

  return (
    <article
      ref={setNodeRef}
      className={`product-window ${isDragging ? "dragging" : ""}`}
      style={style}
      onMouseDown={() => onFocus(product.id)}
      onTouchStart={() => onFocus(product.id)}
    >
      <header className="window-titlebar" {...listeners} {...attributes}>
        <div className="window-controls" aria-hidden="true">
          <span className="window-control blood" />
          <span className="window-control ember" />
          <span className="window-control gold" />
        </div>
        <span>{product.category}</span>
        <span className="window-grip">
          <Grip size={14} />
          Drag
        </span>
      </header>

      <div className="window-body">
        <div className="image-stack">
          <img className="product-image" src={product.image} alt={product.name} draggable={false} />
          {product.backImage ? <img className="image-secondary" src={product.backImage} alt={`${product.name} back`} draggable={false} /> : null}
        </div>

        <div className="product-meta">
          <p className="meta-kicker">
            {product.type}
            {product.featured ? (
              <span className="pill pill-gold compact">
                <Star size={12} />
                Featured
              </span>
            ) : null}
          </p>
          <h3 className="product-name">{product.name}</h3>
          <p className="product-description">{product.description}</p>
        </div>

        <div className="size-row">
          {product.sizes.map((size) => (
            <button
              key={size}
              type="button"
              className={`size-pill ${selectedSize === size ? "active" : ""}`}
              onClick={() => onSelectSize(product.id, size)}
            >
              {size}
            </button>
          ))}
        </div>

        <div className="product-footer">
          <div className="price-stack">
            <span className="price-label">Field price</span>
            <strong className="price-value">{formatMoney(product.price)}</strong>
            {adminLoggedIn ? (
              <input
                className="price-input"
                type="number"
                min="0"
                step="0.01"
                value={product.price}
                onChange={(event) => onPriceChange(product, event.target.value)}
                aria-label={`Edit price for ${product.name}`}
              />
            ) : null}
          </div>

          <button type="button" className="btn-armory" onClick={() => onAdd(product)}>
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Store() {
  const { products, updateProduct, adminLoggedIn } = useAppData();
  const { addItem } = useCart();
  const liveProducts = useMemo(() => products.filter((product) => product.status === "live"), [products]);
  const featuredProducts = useMemo(() => liveProducts.filter((product) => product.featured), [liveProducts]);
  const categories = useMemo(() => ["All", ...new Set(liveProducts.map((product) => product.category))], [liveProducts]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedSizes, setSelectedSizes] = useState<Record<string, ProductSize>>({});
  const initialPositions = hydratePositions(liveProducts, readSavedPositions());
  const [positions, setPositions] = useState<WindowMap>(initialPositions);
  const [toast, setToast] = useState<string | null>(null);
  const zRef = useRef(
    Math.max(
      20,
      ...Object.values(initialPositions).map((position) => position.z),
    ),
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    setPositions((current) => hydratePositions(liveProducts, current));
  }, [liveProducts]);

  useEffect(() => {
    persistPositions(positions);
  }, [positions]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredProducts = useMemo(
    () => liveProducts.filter((product) => activeCategory === "All" || product.category === activeCategory),
    [activeCategory, liveProducts],
  );

  const canvasHeight = Math.max(780, Math.ceil(filteredProducts.length / 3) * 408 + 80);
  const canvasWidth = 1120;

  const liftWindow = useCallback((id: string) => {
    zRef.current += 1;
    setPositions((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? { x: 0, y: 0, z: zRef.current }),
        z: zRef.current,
      },
    }));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const id = String(event.active.id);
    const deltaX = Math.round(event.delta.x);
    const deltaY = Math.round(event.delta.y);

    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    setPositions((current) => {
      const existing = current[id] ?? { x: 0, y: 0, z: zRef.current };
      return {
        ...current,
        [id]: {
          ...existing,
          x: existing.x + deltaX,
          y: existing.y + deltaY,
        },
      };
    });
  }, []);

  const handleSelectSize = (productId: string, size: ProductSize) => {
    setSelectedSizes((current) => ({ ...current, [productId]: size }));
  };

  const handleAddToCart = (product: Product) => {
    const fallbackSize = product.sizes.length === 1 ? product.sizes[0] : undefined;
    const selectedSize = selectedSizes[product.id] ?? fallbackSize;

    if (!selectedSize) {
      setToast(`Choose a size for ${product.name} before adding it.`);
      return;
    }

    addItem({
      productId: product.id,
      size: selectedSize,
      quantity: 1,
      price: product.price,
    });

    setToast(`${product.name} added to the cart.`);
  };

  const handlePriceChange = (product: Product, value: string) => {
    if (!adminLoggedIn) {
      return;
    }

    const parsedValue = Number.parseFloat(value);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      return;
    }

    updateProduct({ ...product, price: parsedValue });
  };

  return (
    <div className="section-stack">
      <HeroBanner />

      <section className="featured-strip route-card">
        <div>
          <p className="eyebrow">Featured loadout</p>
          <h2 className="section-title">Current highlighted drops</h2>
        </div>
        <div className="featured-row">
          {featuredProducts.map((product) => (
            <button key={product.id} type="button" className="featured-chip" onClick={() => setActiveCategory(product.category)}>
              <Star size={14} />
              {product.name}
            </button>
          ))}
        </div>
      </section>

      <section className="route-card">
        <div className="canvas-header">
          <div>
            <p className="eyebrow">Windowed storefront</p>
            <h2 className="section-title">Drag the pieces around the armory board</h2>
          </div>
          <p className="canvas-note">Only live products are deployed here. Draft and hidden pieces remain in Command Center.</p>
        </div>

        <div className="category-row">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`filter-pill ${activeCategory === category ? "active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <DndContext sensors={sensors} onDragStart={({ active }) => liftWindow(String(active.id))} onDragEnd={handleDragEnd}>
        <section className="canvas-shell route-card">
          <div className="canvas-scroll">
            <div className="canvas" style={{ height: canvasHeight, minWidth: canvasWidth }}>
              {filteredProducts.map((product) => (
                <ProductWindow
                  key={product.id}
                  product={product}
                  position={positions[product.id] ?? defaultPositionFor(0)}
                  selectedSize={selectedSizes[product.id]}
                  onFocus={liftWindow}
                  onSelectSize={handleSelectSize}
                  onAdd={handleAddToCart}
                  onPriceChange={handlePriceChange}
                  adminLoggedIn={adminLoggedIn}
                />
              ))}
            </div>
          </div>
        </section>
      </DndContext>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
