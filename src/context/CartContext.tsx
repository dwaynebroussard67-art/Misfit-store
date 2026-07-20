import { type CartItem, getCart, saveCart } from "@/lib/store";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface CartContextValue {
  items: CartItem[];
  open: boolean;
  cartCount: number;
  subtotal: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  incrementItem: (productId: string, size: CartItem["size"]) => void;
  decrementItem: (productId: string, size: CartItem["size"]) => void;
  removeItem: (productId: string, size: CartItem["size"]) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => getCart());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((current) => {
      const existingIndex = current.findIndex((entry) => entry.productId === item.productId && entry.size === item.size);

      if (existingIndex === -1) {
        return [...current, { ...item }];
      }

      return current.map((entry, index) =>
        index === existingIndex ? { ...entry, quantity: entry.quantity + item.quantity, price: item.price } : entry,
      );
    });

    setOpen(true);
  };

  const incrementItem = (productId: string, size: CartItem["size"]) => {
    setItems((current) =>
      current.map((entry) =>
        entry.productId === productId && entry.size === size ? { ...entry, quantity: entry.quantity + 1 } : entry,
      ),
    );
  };

  const decrementItem = (productId: string, size: CartItem["size"]) => {
    setItems((current) =>
      current.flatMap((entry) => {
        if (entry.productId !== productId || entry.size !== size) {
          return [entry];
        }

        if (entry.quantity <= 1) {
          return [];
        }

        return [{ ...entry, quantity: entry.quantity - 1 }];
      }),
    );
  };

  const removeItem = (productId: string, size: CartItem["size"]) => {
    setItems((current) => current.filter((entry) => entry.productId !== productId || entry.size !== size));
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      open,
      cartCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.quantity * item.price, 0),
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      addItem,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart,
    }),
    [items, open],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
