import { Cart } from "@/components/Cart";
import { Nav } from "@/components/Nav";
import { AppDataProvider } from "@/context/AppDataContext";
import { CartProvider } from "@/context/CartContext";
import Admin from "@/pages/Admin";
import Store from "@/pages/Store";
import Vault from "@/pages/Vault";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function AppShell() {
  return (
    <div className="site-shell">
      <Nav />
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Store />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Cart />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppDataProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AppDataProvider>
    </BrowserRouter>
  );
}
