// ─── Visual design tokens ────────────────────────────────────────────────────
// Calm, high-contrast, large type, one accent, dark mode.
// No red badges. No gamified counters.

export const Colors = {
  bg: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceLight: '#2A2A2A',
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  accent: '#4ECDC4',       // teal — single accent colour
  accentDim: '#2A7A74',
  error: '#E05555',
  border: '#333333',
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
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;
