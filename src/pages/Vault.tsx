import { useAppData } from "@/context/AppDataContext";
import { formatFileSize } from "@/lib/store";
import { VAULT_CATEGORIES, VAULT_IMAGES } from "@/lib/vaultImages";
import { ChevronLeft, ChevronRight, ImagePlus, Lock, Search, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

export default function Vault() {
  const { vaultFiles, addVaultFile, removeVaultFile, adminLoggedIn } = useAppData();
  const [activeTab, setActiveTab] = useState<"gallery" | "files">("gallery");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadCategory, setUploadCategory] = useState("Field Uploads");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const filteredImages = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return VAULT_IMAGES.filter((image) => {
      const matchesCategory = category === "All" || image.category === category;
      const haystack = `${image.name} ${image.description} ${image.category}`.toLowerCase();
      const matchesQuery = loweredQuery.length === 0 || haystack.includes(loweredQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  useEffect(() => {
    if (lightboxIndex === null) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) => {
          if (current === null) {
            return current;
          }

          return current === 0 ? filteredImages.length - 1 : current - 1;
        });
      }

      if (event.key === "ArrowRight") {
        setLightboxIndex((current) => {
          if (current === null) {
            return current;
          }

          return current === filteredImages.length - 1 ? 0 : current + 1;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredImages.length, lightboxIndex]);

  useEffect(() => {
    if (!uploadMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => setUploadMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [uploadMessage]);

  const currentImage = lightboxIndex === null ? null : filteredImages[lightboxIndex];

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!adminLoggedIn) {
      return;
    }

    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setIsUploading(true);
      const url = await readFileAsDataUrl(file);
      const categoryName = uploadCategory.trim() || "Field Uploads";
      const fileType = file.type.startsWith("image/") ? "image" : file.type.includes("pdf") ? "document" : "other";

      addVaultFile({
        id: `vault-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        type: fileType,
        size: formatFileSize(file.size),
        url,
        thumb: fileType === "image" ? url : undefined,
        uploadedAt: new Date().toISOString(),
        category: categoryName,
      });

      setUploadMessage(`${file.name} saved to the vault.`);
    } catch {
      setUploadMessage("Upload failed. Try another file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="section-stack vault-layout">
      <section className="route-card">
        <div className="canvas-header">
          <div>
            <p className="eyebrow">The Vault</p>
            <h1 className="section-title">Curated gallery + saved field files</h1>
          </div>
          <p className="canvas-note">Search the image archive, then move to the files tab for admin-managed uploads.</p>
        </div>

        <div className="tab-row">
          <button
            type="button"
            className={`tab-btn ${activeTab === "gallery" ? "active" : ""}`}
            onClick={() => setActiveTab("gallery")}
          >
            Gallery
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "files" ? "active" : ""}`}
            onClick={() => setActiveTab("files")}
          >
            Files
          </button>
        </div>
      </section>

      {activeTab === "gallery" ? (
        <>
          <section className="route-card filters-card">
            <div className="search-row">
              <label className="search-field">
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Search the vault"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>

            <div className="category-row">
              {VAULT_CATEGORIES.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  className={`filter-pill ${category === entry ? "active" : ""}`}
                  onClick={() => setCategory(entry)}
                >
                  {entry}
                </button>
              ))}
            </div>
          </section>

          <section className="vault-grid route-card">
            {filteredImages.map((image, index) => (
              <button key={image.id} type="button" className="vault-item" onClick={() => setLightboxIndex(index)}>
                <img className="vault-visual" src={image.thumb} alt={image.name} />
                <div className="vault-overlay">
                  <div className="vault-meta">
                    <span className="pill">{image.category}</span>
                    <h3>{image.name}</h3>
                    <p className="vault-description">{image.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </section>
        </>
      ) : (
        <section className="route-card file-panel">
          {!adminLoggedIn ? (
            <div className="empty-state locked-state">
              <Lock size={22} />
              <p>The files tab is admin-only in this demo build. Sign in through Command Center to upload and manage vault files.</p>
            </div>
          ) : (
            <>
              <div className="admin-toolbar">
                <div>
                  <p className="eyebrow">Vault files</p>
                  <h2 className="section-title">Upload local assets into the saved files archive</h2>
                </div>
                <div className="upload-controls">
                  <input
                    className="checkout-field"
                    type="text"
                    value={uploadCategory}
                    onChange={(event) => setUploadCategory(event.target.value)}
                    placeholder="Category"
                  />
                  <label className="btn-gold upload-label">
                    <Upload size={16} />
                    {isUploading ? "Uploading..." : "Upload file"}
                    <input type="file" hidden onChange={handleUpload} />
                  </label>
                </div>
              </div>

              {vaultFiles.length === 0 ? (
                <div className="empty-state">
                  <ImagePlus size={22} />
                  <p>No uploaded files yet. Add an image or document to seed the archive.</p>
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
            </>
          )}
        </section>
      )}

      {currentImage ? (
        <div className="lightbox-overlay" role="dialog" aria-modal="true">
          <button type="button" className="icon-btn close-lightbox" onClick={() => setLightboxIndex(null)} aria-label="Close lightbox">
            <X size={18} />
          </button>
          <button
            type="button"
            className="lightbox-nav left"
            onClick={() => setLightboxIndex((current) => (current === null || current === 0 ? filteredImages.length - 1 : current - 1))}
            aria-label="Previous image"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="lightbox-shell">
            <img className="lightbox-image" src={currentImage.full} alt={currentImage.name} />
            <div className="lightbox-caption">
              <span className="pill">{currentImage.category}</span>
              <h3>{currentImage.name}</h3>
              <p>{currentImage.description}</p>
            </div>
          </div>
          <button
            type="button"
            className="lightbox-nav right"
            onClick={() => setLightboxIndex((current) => (current === null || current === filteredImages.length - 1 ? 0 : current + 1))}
            aria-label="Next image"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}

      {uploadMessage ? <div className="toast">{uploadMessage}</div> : null}
    </div>
  );
}
