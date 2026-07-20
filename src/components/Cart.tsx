import { useAppData } from "@/context/AppDataContext";
import { useCart } from "@/context/CartContext";
import { formatMoney } from "@/lib/store";
import { startCheckout } from "@/lib/data";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

export function Cart() {
  const { items, open, closeCart, subtotal, incrementItem, decrementItem, removeItem, clearCart } = useCart();
  const { products, createOrder } = useAppData();
  const [email, setEmail] = useState("");

  const storeUrl = import.meta.env.VITE_STORE_URL?.trim() ?? "";

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0 || checkingOut) {
      return;
    }
    setCheckingOut(true);

    // Send ONLY product_id/size/quantity. The server reads real prices from the
    // DB (checkout.ts) and returns a Stripe Checkout URL. No prices cross here.
    const url = await startCheckout(
      items.map((item) => ({
        product_id: item.productId,
        size: item.size,
        quantity: item.quantity,
      })),
    );

    setCheckingOut(false);

    if (url) {
      // The real order + tithe + Printify all happen in the Stripe webhook
      // AFTER payment — not here. So we do NOT createOrder() on the client.
      window.location.href = url;
    }
  };

  return (
    <>
      <button
        type="button"
        className={`cart-backdrop ${open ? "visible" : ""}`}
        onClick={closeCart}
        aria-label="Close cart"
      />

      <aside className={`cart-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="cart-header">
          <div>
            <p className="eyebrow">Cart drawer</p>
            <h2>The loadout</h2>
          </div>
          <button type="button" className="icon-btn" onClick={closeCart} aria-label="Close cart">
            <X size={18} />
          </button>
        </div>

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={22} />
              <p>Your cart is empty. Add a piece from the Armory to begin the handoff.</p>
            </div>
          ) : (
            items.map((item) => {
              const product = productMap.get(item.productId);

              return (
                <article key={`${item.productId}-${item.size}`} className="cart-item">
                  <img className="cart-item-image" src={product?.image} alt={product?.name ?? "Product"} />
                  <div className="cart-item-copy">
                    <div className="cart-item-head">
                      <div>
                        <h3>{product?.name ?? "Archived item"}</h3>
                        <p>
                          {item.size} • {formatMoney(item.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => removeItem(item.productId, item.size)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="qty-row">
                      <button type="button" className="qty-btn" onClick={() => decrementItem(item.productId, item.size)}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" className="qty-btn" onClick={() => incrementItem(item.productId, item.size)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="totals-panel">
          <div className="field">
            <label htmlFor="checkout-email">Email for the handoff record</label>
            <input
              id="checkout-email"
              className="checkout-field"
              type="email"
              placeholder="you@notalone.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="totals-row">
            <span>Subtotal</span>
            <strong>{formatMoney(subtotal)}</strong>
          </div>
          <div className="drawer-actions">
            <button type="button" className="btn-subtle" onClick={clearCart} disabled={items.length === 0}>
              Clear cart
            </button>
            <button type="button" className="btn-armory" onClick={handleCheckout} disabled={items.length === 0 || checkingOut}>
              {checkingOut ? "Redirecting…" : "Proceed to checkout"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
