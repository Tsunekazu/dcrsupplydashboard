// ── Color palette ──────────────────────────────────────────────
export const COLORS = {
  teal: '#2ed6a1',
  tealDim: '#1a7a5c',
  blue: '#2970ff',
  purple: '#6d28d9',
  gold: '#f0b040',
  red: '#ef4444',
  green: '#22c55e',
  cyan: '#06b6d4',
  white: '#ffffff',
  bg: '#050a12',
  bgDeep: '#020610',
  accent1: '#3bf0c0',   // bright mint for highlights
  accent2: '#ff6b35',   // warm pop for celebrations
};

// ── Particle population targets ────────────────────────────────
export const POPULATION = {
  orbit: { min: 200, max: 350, spawnRate: 4 },
  flow: { min: 100, max: 200, spawnRate: 3 },
  ambient: { min: 60, max: 120, spawnRate: 2 },
  burst: 20,   // on new-block event
};

// ── Ring geometry ──────────────────────────────────────────────
export const RINGS = {
  count: 3,
  baseRadiusFraction: [0.18, 0.28, 0.40],   // fraction of min(w,h)
  strokeAlpha: [0.8, 0.65, 0.5],
  strokeWidth: [3.5, 2.5, 2.0],
  rotationSpeed: [0.0003, -0.0002, 0.00015],
  arcGap: Math.PI * 0.25,   // gap in each ring arc
};

// ── Core reactor ───────────────────────────────────────────────
export const CORE = {
  baseSizeFraction: 0.045,
  glowLayers: 5,
  glowMaxRadius: 6,       // multiplier of core size
  heartbeatBPM: 72,
  heartbeatDepth: 0.2,    // scale oscillation amplitude
};

// ── Energy beams ───────────────────────────────────────────────
export const BEAMS = {
  count: 3,
  rotationSpeed: 0.004,
  alpha: 0.4,
  width: 2.5,
};

// ── Animation timing ───────────────────────────────────────────
export const TIMING = {
  nebulaRotation: 0.0004,
  shimmerInterval: 480,   // frames between diagonal sweeps
  shimmerSpeed: 0.015,
  sweepAlpha: 0.07,
};

// ── Helpers ────────────────────────────────────────────────────
export function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function rgbaStr(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

export function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${bl})`;
}
