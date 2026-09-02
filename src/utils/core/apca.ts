/**
 * Accessible Perceptual Contrast Algorithm (APCA)
 * Standard: 0.0.98G-4g-base-W3 (WCAG 3.0 candidate method)
 * Reference: https://github.com/Myndex/SAPC-APCA
 *
 * Computes Lightness Contrast (Lc) between text and background colors,
 * accounting for display gamma, spatial frequency, and visual polarity.
 * Sign convention: positive = dark text on light bg (normal polarity),
 * negative = light text on dark bg (reverse polarity).
 */

// 0.0.98G-4g frozen constants
const mainTRC = 2.4; // sRGB transfer function power curve
const normBG = 0.56; // Normal polarity (dark text on light bg)
const normTXT = 0.57;
const revTXT = 0.62; // Reverse polarity (light text on dark bg)
const revBG = 0.65;

const sRco = 0.2126729; // Spectral luminance coefficients
const sGco = 0.7151522;
const sBco = 0.072175;

const blkThrs = 0.022; // Soft black clamp threshold
const blkClmp = 1.414; // Soft black clamp exponent
const deltaYmin = 0.0005; // Imperceptible luminance difference guard
const W_scale = 1.14; // Raw SAPC scale factor
const W_offset = 0.027; // Low-clip offset
const W_clamp = 0.1; // Below this, contrast is reported as 0

export interface RgbColor {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
}

/** Convert 8-bit sRGB channels to linear screen luminance (Ys) */
function sRgbToY(color: RgbColor): number {
  const r = Math.pow(Math.max(0, Math.min(255, color.r)) / 255.0, mainTRC);
  const g = Math.pow(Math.max(0, Math.min(255, color.g)) / 255.0, mainTRC);
  const b = Math.pow(Math.max(0, Math.min(255, color.b)) / 255.0, mainTRC);
  return r * sRco + g * sGco + b * sBco;
}

/** Soft-clip black levels (f_sc) so near-black backgrounds keep activity */
function clampY(y: number): number {
  if (y < 0.0) return 0.0;
  if (y < blkThrs) {
    return y + Math.pow(blkThrs - y, blkClmp);
  }
  return y;
}

/** Parse a CSS hex string (#fff or #ffffff) to RgbColor */
export function parseHex(hex: string): RgbColor {
  let c = hex.trim().replace(/^#/, "");
  if (c.length === 3) {
    c = c
      .split("")
      .map(ch => ch + ch)
      .join("");
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calculate APCA Lightness Contrast (Lc)
 * @param text - Text color (foreground)
 * @param bg - Background color
 * @returns Lc score from -108.0 (reverse polarity) to +106.0 (normal)
 */
export function calcAPCA(text: RgbColor, bg: RgbColor): number {
  const yTxtRaw = sRgbToY(text);
  const yBgRaw = sRgbToY(bg);

  // Guard: imperceptible luminance difference
  if (Math.abs(yBgRaw - yTxtRaw) < deltaYmin) {
    return 0.0;
  }

  const yTxt = clampY(yTxtRaw);
  const yBg = clampY(yBgRaw);

  let sapc = 0.0;

  if (yBg > yTxt) {
    // Normal polarity (dark text on light background)
    sapc = (Math.pow(yBg, normBG) - Math.pow(yTxt, normTXT)) * W_scale;
  } else {
    // Reverse polarity (light text on dark background)
    sapc = (Math.pow(yBg, revBG) - Math.pow(yTxt, revTXT)) * W_scale;
  }

  // Low-contrast clamp and offset scaling to Lc scale
  if (Math.abs(sapc) < W_clamp) {
    return 0.0;
  }

  if (sapc > 0) {
    return (sapc - W_offset) * 100.0;
  }
  return (sapc + W_offset) * 100.0;
}
