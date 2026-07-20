export function HeroBanner() {
  return (
    <section className="hero-banner">
      <div className="hero-grid">
        <div>
          <p className="eyebrow">Dark goods for redeemed fighters</p>
          <h1 className="hero-title">The Armory</h1>
          <p className="hero-copy">
            One King. One Blood. One War. A storefront built like a command board for the people who have been
            carried through fire and refuse to walk alone now.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>20</strong>
              <span>Seeded pieces</span>
            </div>
            <div className="hero-stat">
              <strong>3</strong>
              <span>Routes</span>
            </div>
            <div className="hero-stat">
              <strong>0</strong>
              <span>Third-party APIs</span>
            </div>
          </div>
        </div>

        <aside className="quote-panel">
          <span className="eyebrow">Field note</span>
          <blockquote>
            “You are not alone. The work is holy, the war is real, and the King still keeps His people.”
          </blockquote>
          <p>
            Drag the product windows, set your size, and build the cart from the canvas like an old command room.
          </p>
        </aside>
      </div>
    </section>
  );
}
