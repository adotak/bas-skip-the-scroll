// ─── UI.html (Awwwards Redesign) Visual Design Tokens ────────────────────────
// Extracted directly from UI.html (:root lines 199-206, 748-760, 1426-1434, 2108-2121, 4163-4231)
// Editorial Alabaster (#F8F8F8), Deep Charcoal (#222222), Warm Grey (#EDEDED),
// and signature Awwwards accents: Mint Inspire (#AAEEC4), Lemon Learn (#FFF083),
// Vermilion Connect (#FA5D29), Electric Awards (#502BD8), and Sky Jobs (#74BCFF).

export const Colors = {
  // Core surfaces (UI.html --bg-primary, --bg-white, --bg-3rd, --bg-secondary)
  bg: '#F8F8F8',              // --bg-primary: Editorial alabaster paper
  bgElevated: '#FFFFFF',      // --bg-white: Crisp card white
  surface: '#FFFFFF',         // Primary card background
  surfaceLight: '#EDEDED',    // --bg-3rd / --nf-bg-1: Filter container & pill surface
  surfaceMuted: '#F3F3F3',    // Subtle hover/nested surface
  surfaceDark: '#222222',     // --bg-secondary: Charcoal dark card & floating dock
  surfaceDarkInner: '#3E3E3E',// .menu-float__layout--secondary dark pill bg
  surfaceDarkBorder: '#4E4E4E',// .menu-float__item dark border
  surfaceGlass: 'rgba(34, 34, 34, 0.88)', // .menu-float__wrapper glass charcoal

  // Typography (--color-primary, muted greys)
  text: '#222222',            // --color-primary: Deep charcoal ink
  textInverse: '#FFFFFF',     // --color-white: White text on #222222 surfaces
  textSecondary: '#6E6E6E',   // Editorial secondary grey
  textMuted: '#A7A7A7',       // --form-field__label uppercase muted grey

  // Accents (--color-primary, --color-inspire, --color-learn, --color-orange)
  accent: '#222222',          // Primary interactive ink (#222)
  accentDim: '#EDEDED',       // Soft neutral active fill
  accentSoft: '#AAEEC4',      // --color-inspire: Awwwards mint green
  accentGlow: '#FFF083',      // --color-learn: Awwwards lemon yellow
  vermilion: '#FA5D29',       // --color-orange / --color-red: Awwwards vermilion
  vermilionSoft: '#FFF0EC',
  countCoral: '#FF9667',      // --nf-bg-count
  mint: '#AAEEC4',            // --color-inspire
  mintSoft: '#E2F4E9',        // --color-inspire-3
  lemon: '#FFF083',           // --color-learn
  lemonSoft: '#FFF9D0',       // --color-learn-2
  indigo: '#502BD8',          // --color-awards
  sky: '#74BCFF',             // --color-jobs
  ochre: '#C0AB3C',           // --color-read

  // Semantic kind badges
  videoAccent: '#222222',
  videoAccentDim: '#FFF083',  // Solid lemon badge for Video
  articleAccent: '#222222',
  articleAccentDim: '#AAEEC4',// Solid mint badge for Article
  docAccent: '#222222',
  docAccentDim: '#B4D7F8',    // Solid sky badge for Doc

  // Status & Borders
  warning: '#FA5D29',
  warningDim: '#FFF0EC',
  success: '#27AE60',
  error: '#FA5D29',           // --color-errors
  errorDim: '#FFE8E0',
  border: '#E2E2E2',          // --border-gray / input border
  borderStrong: '#222222',    // --border-table (1px solid #222)
  borderSubtle: '#EDEDED',
  borderAccent: '#222222',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 11,                     // --text-size-small: 11px
  sm: 13,
  md: 15,                     // --text-size-primary: 14-15px
  lg: 18,                     // --text-size-medium: 18px
  xl: 24,                     // --text-size-large: 22-24px
  xxl: 34,                    // Editorial display heading
  hero: 48,                   // .heading-1 giant uppercase title
} as const;

export const Radius = {
  xs: 4,                      // --rounded-small: 4px
  sm: 8,                      // --rounded-normal: 8px
  md: 12,                     // .menu-float__wrapper: 12px
  lg: 16,                     // --rounded-large: 1rem (16px)
  pill: 72,                   // --button-rounded-full: 72px
} as const;
