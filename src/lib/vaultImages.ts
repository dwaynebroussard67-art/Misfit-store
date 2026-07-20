const toDataUri = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

export interface VaultImage {
  id: string;
  name: string;
  category: string;
  description: string;
  thumb: string;
  full: string;
}

const createVaultArtwork = (name: string, category: string, accent: string, height: number, detail: string) => {
  const safeName = name.toUpperCase().replace(/[^A-Z0-9 ]+/g, "").slice(0, 28);
  const safeCategory = category.toUpperCase();

  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}" viewBox="0 0 900 ${height}" role="img" aria-label="${safeName}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0a0a0a" />
          <stop offset="52%" stop-color="#151515" />
          <stop offset="100%" stop-color="#1d1407" />
        </linearGradient>
        <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="#cc2200" />
        </linearGradient>
      </defs>
      <rect width="900" height="${height}" rx="34" fill="url(#bg)" />
      <rect x="30" y="30" width="840" height="${height - 60}" rx="24" fill="none" stroke="rgba(212,169,30,.45)" stroke-width="2" />
      <circle cx="450" cy="${Math.round(height * 0.46)}" r="${Math.round(height * 0.16)}" fill="rgba(255,255,255,.03)" stroke="url(#accent)" stroke-width="3" />
      <path d="M160 ${Math.round(height * 0.24)}L740 ${Math.round(height * 0.78)}" stroke="rgba(255,255,255,.08)" stroke-width="8" stroke-linecap="round" />
      <path d="M730 ${Math.round(height * 0.24)}L180 ${Math.round(height * 0.76)}" stroke="rgba(212,169,30,.12)" stroke-width="6" stroke-linecap="round" />
      <path d="M450 ${Math.round(height * 0.19)}v${Math.round(height * 0.56)}M270 ${Math.round(height * 0.47)}h360" stroke="rgba(255,255,255,.06)" stroke-width="10" stroke-linecap="round" />
      <text x="450" y="${Math.round(height * 0.18)}" fill="${accent}" font-family="Arial, sans-serif" font-size="24" letter-spacing="8" text-anchor="middle">${safeCategory}</text>
      <text x="450" y="${Math.round(height * 0.82)}" fill="#e8e4dc" font-family="Georgia, serif" font-size="52" letter-spacing="4" text-anchor="middle">${safeName}</text>
      <text x="450" y="${Math.round(height * 0.89)}" fill="rgba(232,228,220,.72)" font-family="Arial, sans-serif" font-size="18" letter-spacing="6" text-anchor="middle">${detail.toUpperCase()}</text>
    </svg>
  `);
};

const makeImg = (
  id: string,
  name: string,
  category: string,
  accent: string,
  height: number,
  description: string,
): VaultImage => ({
  id,
  name,
  category,
  description,
  thumb: createVaultArtwork(name, category, accent, height, "The vault remembers"),
  full: createVaultArtwork(name, category, accent, Math.max(1200, Math.round(height * 1.8)), "One King. One Blood. One War."),
});

export const VAULT_IMAGES: VaultImage[] = [
  makeImg("v001", "Watchman Cover", "Protection", "#d4a91e", 720, "A prayer-wall scene for the people who keep watch while the city sleeps."),
  makeImg("v002", "Mercy Over Ash", "Grace", "#b8960c", 820, "A dark-panel study in mercy landing where shame once set up camp."),
  makeImg("v003", "Furnace Hymn", "Fire", "#cc2200", 980, "Ember-toned vault art built around cleansing, courage, and refined allegiance."),
  makeImg("v004", "Held From the Pit", "Redemption", "#d4931d", 760, "A rescue image for rooms that need the language of lift and return."),
  makeImg("v005", "Shielded Hearts", "Love", "#c86a3b", 920, "A love-themed composition where affection still carries authority and cover."),
  makeImg("v006", "Signal in the Night", "Warfare", "#8B0000", 830, "An armory-coded visual for intercession, midnight prayer, and spiritual alertness."),
  makeImg("v007", "Chains at Dawn", "Liberation", "#d4a91e", 1040, "A liberation panel about the first light after a long season of captivity."),
  makeImg("v008", "Kingdom Muster", "Community", "#b57d12", 790, "Communal imagery for the scattered becoming a people again."),
  makeImg("v009", "Breath Returns", "Deliverance", "#cc2200", 960, "A vault study in return, recovery, and the violence of grace against darkness."),
  makeImg("v010", "Oil & Iron", "Protection", "#a88121", 840, "A stern visual built around strengthening, healing, and staying ready."),
  makeImg("v011", "Covenant Flame", "Fire", "#dd5b1b", 730, "A smaller ember panel about fidelity under pressure."),
  makeImg("v012", "Grace in the Breach", "Grace", "#d7b14a", 910, "A gold-lit composition for the places where weakness met unearned favor."),
  makeImg("v013", "Brothers Restored", "Community", "#c08d2f", 780, "An image for reunions, repentance, and the long work of repaired fellowship."),
  makeImg("v014", "Sword Song", "Warfare", "#99210f", 1010, "Vault art centered on praise as weaponry and scripture as steel."),
  makeImg("v015", "No Grave Claim", "Redemption", "#d4a91e", 880, "A resurrection-coded piece that speaks return and authority over finality."),
  makeImg("v016", "Banner of Peace", "Love", "#cd7b52", 750, "A warmer panel reminding the house that tenderness is still strong."),
  makeImg("v017", "Open Door Testimony", "Deliverance", "#cc2200", 940, "A full-height deliverance piece with thresholds, witness, and forward movement."),
  makeImg("v018", "After the Fire", "Liberation", "#d49012", 860, "A closing panel about what remains when the false structure finally falls."),
];

export const VAULT_CATEGORIES = ["All", ...new Set(VAULT_IMAGES.map((image) => image.category))];
