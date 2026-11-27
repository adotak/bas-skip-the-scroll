// ─── Visual design tokens ────────────────────────────────────────────────────
// Serene Obsidian & Luminous Teal Design System.
// Calm, high-contrast, large type, intentional hierarchy, dark mode.
// No red notification badges. No gamified streak guilt.

export const Colors = {
  bg: '#070A0F',              // Deep obsidian ink
  bgElevated: '#0D121B',      // Subtle layer elevation
  surface: '#121824',         // Primary card surface
  surfaceLight: '#1B2333',    // Interactive / secondary surface
  surfaceGlass: 'rgba(27, 35, 51, 0.75)',
  text: '#F8FAFC',            // Crisp alabaster white
  textSecondary: '#94A3B8',   // Calm slate grey
  textMuted: '#64748B',       // Muted caption slate
  accent: '#2DD4BF',          // Luminous intentional teal
  accentDim: 'rgba(45, 212, 191, 0.14)',
  accentSoft: 'rgba(45, 212, 191, 0.25)',
  accentGlow: 'rgba(45, 212, 191, 0.35)',
  videoAccent: '#A78BFA',     // Soft violet for video badges
  videoAccentDim: 'rgba(167, 139, 250, 0.15)',
  articleAccent: '#38BDF8',   // Sky blue for articles
  articleAccentDim: 'rgba(56, 189, 248, 0.15)',
  docAccent: '#34D399',       // Emerald for canonical docs
  docAccentDim: 'rgba(52, 211, 153, 0.15)',
  warning: '#FBBF24',         // Warm amber for pacing/notices
  warningDim: 'rgba(251, 191, 36, 0.15)',
  success: '#10B981',         // Calm completion emerald
  error: '#F87171',           // Soft coral for errors
  errorDim: 'rgba(248, 113, 113, 0.14)',
  border: '#1E293B',          // Crisp slate border
  borderSubtle: '#151D2A',
  borderAccent: 'rgba(45, 212, 191, 0.45)',
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
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 34,
  hero: 44,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;
