import { useCart } from "@/context/CartContext";
import { useAppData } from "@/context/AppDataContext";
import { cn } from "@/utils/cn";
import { Archive, Shield, ShoppingBag } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Armory" },
  { to: "/vault", label: "Vault" },
  { to: "/admin", label: "Admin" },
];

export function Nav() {
  const { cartCount, openCart } = useCart();
  const { adminLoggedIn } = useAppData();

  return (
    <header className="top-nav-wrap">
      <nav className="top-nav">
        <NavLink to="/" className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <Shield size={18} />
          </span>
          <span>
            <span className="brand-name">Misfit Ministries</span>
            <span className="brand-tag">The Armory</span>
          </span>
        </NavLink>

        <div className="nav-links" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => cn("nav-link", isActive && "active")}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-actions">
          {adminLoggedIn ? (
            <span className="pill pill-gold">
              <Archive size={14} />
              Admin mode
            </span>
          ) : null}
          <button type="button" className="cart-trigger" onClick={openCart}>
            <ShoppingBag size={16} />
            Cart
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
