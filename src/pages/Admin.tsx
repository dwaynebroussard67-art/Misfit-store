import { useAppData } from "@/context/AppDataContext";
import {
  PRODUCT_SIZES,
  PRODUCT_STATUSES,
  PRODUCT_TYPES,
  defaultSizesForType,
  formatFileSize,
  formatMoney,
  isAdminPasswordConfigured,
  makeProductArtwork,
  type Product,
  type ProductSize,
  type ProductType,
} from "@/lib/store";
import { Archive, Lock, LogOut, Package, RotateCcw, Save, ShieldAlert, Trash2, Upload } from "lucide-react";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

type AdminTab = "products" | "orders" | "vault";

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  type: ProductType;
  sizes: ProductSize[];
  image: string;
  backImage: string;
  category: string;
  status: Product["status"];
  featured: boolean;
}

const createEmptyForm = (): ProductFormState => ({
  name: "",
  description: "",
  price: "24.99",
  type: "Hoodie",
  sizes: defaultSizesForType("Hoodie"),
  image: "",
  backImage: "",
  category: "New Releases",
  status: "draft",
  featured: false,
});

const createFormFromProduct = (product: Product): ProductFormState => ({
  name: product.name,
  description: product.description,
  price: product.price.toString(),
  type: product.type,
  sizes: [...product.sizes],
  image: product.image,
  backImage: product.backImage ?? "",
  category: product.category,
  status: product.status,
  featured: product.featured,
});

const nextProductId = (products: Product[]) => {
  const maxId = products.reduce((max, product) => {
    const match = /^p(\d+)$/.exec(product.id);
    return match ? Math.max(max, Number.parseInt(match[1], 10)) : max;
  }, 0);

  return `p${String(maxId + 1).padStart(3, "0")}`;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read file"));
    };
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

export default function Admin() {
  const {
    products,
    updateProduct,
    createProduct,
    deleteProduct,
    resetProducts,
    orders,
    updateOrderStatus,
    vaultFiles,
    addVaultFile,
    removeVaultFile,
    adminLoggedIn,
    loginAdmin,
    logoutAdmin,
  } = useAppData();

  const [activeTab, setActiveTab] = useState<AdminTab>("products");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(createEmptyForm());
  const [message, setMessage] = useState<string | null>(null);
  const [vaultCategory, setVaultCategory] = useState("Admin Uploads");
  const [isUploading, setIsUploading] = useState(false);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [products],
  );
  const configuredPassword = isAdminPasswordConfigured();

  const persistMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(null), 2200);
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const success = loginAdmin(password);
    if (!success) {
      setLoginError("Login failed. Configure a local admin password or connect real auth before production use.");
      return;
    }

    setLoginError(null);
    setPassword("");
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedPrice = Number.parseFloat(form.price);
    if (!form.name.trim() || !form.description.trim() || !form.category.trim() || !Number.isFinite(parsedPrice)) {
      persistMessage("Complete the product form before saving.");
      return;
    }

    const sizes = form.sizes.length > 0 ? form.sizes : defaultSizesForType(form.type);
    const image = form.image.trim() || makeProductArtwork(form.name, form.type);
    const backImage = form.backImage.trim();
    const payload: Product = {
      id: editingId ?? nextProductId(products),
      name: form.name.trim(),
      description: form.description.trim(),
      price: parsedPrice,
      type: form.type,
      sizes,
      image,
      backImage: backImage || undefined,
      category: form.category.trim(),
      status: form.status,
      featured: form.featured,
      createdAt: editingId ? productMap.get(editingId)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    };

    if (editingId) {
      updateProduct(payload);
      persistMessage(`${payload.name} updated.`);
    } else {
      createProduct(payload);
      persistMessage(`${payload.name} created.`);
    }

    setEditingId(null);
    setForm(createEmptyForm());
  };

  const toggleSize = (size: ProductSize) => {
    setForm((current) => {
      const hasSize = current.sizes.includes(size);
      return {
        ...current,
        sizes: hasSize ? current.sizes.filter((entry) => entry !== size) : [...current.sizes, size],
      };
    });
  };

  const handleTypeChange = (type: ProductType) => {
    setForm((current) => ({
      ...current,
      type,
      sizes: type === "Cap" || type === "Print" || type === "Other" ? ["One Size"] : current.sizes.filter((size) => size !== "One Size"),
    }));
  };

  const beginEdit = (product: Product) => {
    setEditingId(product.id);
    setForm(createFormFromProduct(product));
    setActiveTab("products");
  };

  const handleStatusChange = (product: Product, status: Product["status"]) => {
    updateProduct({ ...product, status });
  };

  const handleFeatureToggle = (product: Product) => {
    updateProduct({ ...product, featured: !product.featured });
  };

  const handleReset = () => {
    if (!window.confirm("Reset the catalog to the default 20 seeded products?")) {
      return;
    }

    resetProducts();
    setEditingId(null);
    setForm(createEmptyForm());
    persistMessage("Catalog reset to defaults.");
  };

  const handleVaultUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setIsUploading(true);
      const url = await readFileAsDataUrl(file);
      const type = file.type.startsWith("image/") ? "image" : file.type.includes("pdf") ? "document" : "other";

      addVaultFile({
        id: `vault-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        type,
        size: formatFileSize(file.size),
        url,
        thumb: type === "image" ? url : undefined,
        uploadedAt: new Date().toISOString(),
        category: vaultCategory.trim() || "Admin Uploads",
      });

      persistMessage(`${file.name} added to vault files.`);
    } catch {
      persistMessage("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!adminLoggedIn) {
    return (
      <section className="admin-wrap">
        <div className="login-card">
          <div className="brand-mark large">
            <Lock size={22} />
          </div>
          <p className="eyebrow">Command Center</p>
          <h1 className="section-title">Admin access</h1>
          <p className="muted">
            This route is still a local demo gate. Replace it with Supabase or another server-side auth system before
            trusting it with real writes.
          </p>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={configuredPassword ? "Configured locally" : "Fallback local password is active"}
              />
            </div>
            <button type="submit" className="btn-armory">
              Enter command center
            </button>
          </form>

          <div className="warning-card">
            <ShieldAlert size={16} />
            <p>Client-side auth is not security. Anyone can bypass a static admin gate without server enforcement.</p>
          </div>

          {loginError ? <div className="toast error">{loginError}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <div className="admin-wrap section-stack">
      <section className="route-card">
        <div className="admin-toolbar">
          <div>
            <p className="eyebrow">Command Center</p>
            <h1 className="section-title">Manage products, orders, and vault files</h1>
          </div>
          <div className="drawer-actions compact-actions">
            <button type="button" className="btn-subtle" onClick={handleReset}>
              <RotateCcw size={15} />
              Reset products
            </button>
            <button type="button" className="btn-gold" onClick={logoutAdmin}>
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>

        <div className="tab-row">
          <button type="button" className={`tab-btn ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}>
            Products
          </button>
          <button type="button" className={`tab-btn ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
            Orders
          </button>
          <button type="button" className={`tab-btn ${activeTab === "vault" ? "active" : ""}`} onClick={() => setActiveTab("vault")}>
            Vault files
          </button>
        </div>
      </section>

      {activeTab === "products" ? (
        <section className="admin-grid">
          <div className="admin-panel">
            <div className="canvas-header compact-header">
              <div>
                <p className="eyebrow">Product editor</p>
                <h2 className="section-title">{editingId ? "Edit product" : "Create product"}</h2>
              </div>
            </div>

            <form className="form-grid" onSubmit={handleFormSubmit}>
              <label className="field span-2">
                <span>Name</span>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </label>

              <label className="field">
                <span>Type</span>
                <select value={form.type} onChange={(event) => handleTypeChange(event.target.value as ProductType)}>
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Product["status"] }))}
                >
                  {PRODUCT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Price</span>
                <input type="number" step="0.01" min="0" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} />
              </label>

              <label className="field">
                <span>Category</span>
                <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
              </label>

              <label className="field span-2">
                <span>Description</span>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>

              <label className="field span-2">
                <span>Image URL / data URI</span>
                <input value={form.image} onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))} placeholder="Leave blank to auto-generate art" />
              </label>

              <label className="field span-2">
                <span>Back image URL / data URI</span>
                <input value={form.backImage} onChange={(event) => setForm((current) => ({ ...current, backImage: event.target.value }))} />
              </label>

              <div className="field span-2">
                <span>Sizes</span>
                <div className="checkbox-grid">
                  {PRODUCT_SIZES.map((size) => {
                    const forcedOneSize = form.type === "Cap" || form.type === "Print" || form.type === "Other";
                    const disabled = forcedOneSize && size !== "One Size";
                    const active = form.sizes.includes(size);

                    return (
                      <button
                        key={size}
                        type="button"
                        className={`tag-check ${active ? "active" : ""}`}
                        onClick={() => toggleSize(size)}
                        disabled={disabled}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="check-line span-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))}
                />
                Featured product
              </label>

              <div className="drawer-actions span-2 compact-actions">
                <button type="button" className="btn-subtle" onClick={() => { setEditingId(null); setForm(createEmptyForm()); }}>
                  Clear
                </button>
                <button type="submit" className="btn-armory">
                  <Save size={15} />
                  {editingId ? "Save changes" : "Create product"}
                </button>
              </div>
            </form>
          </div>

          <div className="admin-panel">
            <div className="canvas-header compact-header">
              <div>
                <p className="eyebrow">Catalog</p>
                <h2 className="section-title">{products.length} products</h2>
              </div>
            </div>

            <div className="product-admin-list">
              {sortedProducts.map((product) => (
                <article key={product.id} className="product-admin-card">
                  <img className="admin-product-thumb" src={product.image} alt={product.name} />
                  <div className="product-admin-copy">
                    <div className="product-admin-head">
                      <div>
                        <p className="meta-kicker">{product.category}</p>
                        <h3>{product.name}</h3>
                      </div>
                      <span className={`status-pill status-${product.status}`}>{product.status}</span>
                    </div>
                    <p className="muted">{formatMoney(product.price)} • {product.type}</p>
                    <div className="admin-inline-grid">
                      <label className="field">
                        <span>Status</span>
                        <select value={product.status} onChange={(event) => handleStatusChange(product, event.target.value as Product["status"])}>
                          {PRODUCT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="check-line">
                        <input type="checkbox" checked={product.featured} onChange={() => handleFeatureToggle(product)} />
                        Featured
                      </label>
                    </div>
                    <div className="drawer-actions compact-actions">
                      <button type="button" className="btn-subtle" onClick={() => beginEdit(product)}>
                        <Package size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-subtle danger"
                        onClick={() => {
                          deleteProduct(product.id);
                          if (editingId === product.id) {
                            setEditingId(null);
                            setForm(createEmptyForm());
                          }
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "orders" ? (
        <section className="admin-panel">
          <div className="canvas-header compact-header">
            <div>
              <p className="eyebrow">Orders</p>
              <h2 className="section-title">Newest first</h2>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="empty-state">
              <Archive size={22} />
              <p>No local orders yet. A checkout handoff from the cart will record one here first.</p>
            </div>
          ) : (
            <div className="order-list">
              {orders.map((order) => (
                <article key={order.id} className="order-card">
                  <div className="order-head">
                    <div>
                      <p className="meta-kicker">{new Date(order.createdAt).toLocaleString()}</p>
                      <h3>{order.email}</h3>
                    </div>
                    <strong>{formatMoney(order.total)}</strong>
                  </div>
                  <div className="order-items">
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.productId}-${item.size}`} className="order-item-row">
                        <span>{productMap.get(item.productId)?.name ?? item.productId}</span>
                        <span>
                          {item.size} × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  <label className="field order-status-field">
                    <span>Status</span>
                    <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as Product["status"] & typeof order.status)}>
                      <option value="pending">pending</option>
                      <option value="completed">completed</option>
                      <option value="fulfilled">fulfilled</option>
                    </select>
                  </label>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "vault" ? (
        <section className="admin-panel">
          <div className="admin-toolbar">
            <div>
              <p className="eyebrow">Vault files</p>
              <h2 className="section-title">Upload and manage saved files</h2>
            </div>
            <div className="upload-controls">
              <input
                className="checkout-field"
                type="text"
                value={vaultCategory}
                onChange={(event) => setVaultCategory(event.target.value)}
                placeholder="Category"
              />
              <label className="btn-gold upload-label">
                <Upload size={16} />
                {isUploading ? "Uploading..." : "Upload file"}
                <input type="file" hidden onChange={handleVaultUpload} />
              </label>
            </div>
          </div>

          {vaultFiles.length === 0 ? (
            <div className="empty-state">
              <Archive size={22} />
              <p>No uploaded vault files yet.</p>
            </div>
          ) : (
            <div className="file-list">
              {vaultFiles.map((file) => (
                <article key={file.id} className="file-card">
                  {file.thumb ? <img className="file-thumb" src={file.thumb} alt={file.name} /> : <div className="file-thumb file-fallback">DOC</div>}
                  <div className="file-copy">
                    <div>
                      <p className="meta-kicker">{file.category}</p>
                      <h3>{file.name}</h3>
                      <p>
                        {file.type} • {file.size}
                      </p>
                    </div>
                    <div className="drawer-actions compact-actions">
                      <a className="btn-subtle" href={file.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                      <button type="button" className="btn-subtle danger" onClick={() => removeVaultFile(file.id)}>
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {message ? <div className="toast">{message}</div> : null}
    </div>
  );
}
