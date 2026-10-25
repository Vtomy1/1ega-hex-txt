/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColorMetric, PaletteColor } from '../types/palette';

export interface LabColor {
  l: number;
  a: number;
  b: number;
}

// Convert sRGB (0-255) to CIELAB (D65 standard illuminant)
export function rgbToLab(r: number, g: number, b: number): LabColor {
  // 1. Convert to linear sRGB
  let rLin = r / 255;
  let gLin = g / 255;
  let bLin = b / 255;

  rLin = rLin > 0.04045 ? Math.pow((rLin + 0.055) / 1.055, 2.4) : rLin / 12.92;
  gLin = gLin > 0.04045 ? Math.pow((gLin + 0.055) / 1.055, 2.4) : gLin / 12.92;
  bLin = bLin > 0.04045 ? Math.pow((bLin + 0.055) / 1.055, 2.4) : bLin / 12.92;

  // 2. Convert to XYZ (D65 standard)
  const x = (rLin * 0.4124 + gLin * 0.3576 + bLin * 0.1805) / 0.95047;
  const y = (rLin * 0.2126 + gLin * 0.7152 + bLin * 0.0722) / 1.0;
  const z = (rLin * 0.0193 + gLin * 0.1192 + bLin * 0.9505) / 1.08883;

  const fx = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
  const fy = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
  const fz = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116;

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

// Perceptual distance metrics
export function colorDistanceSquared(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
  metric: ColorMetric,
  lab1?: LabColor,
  lab2?: LabColor
): number {
  if (metric === 'euclidean') {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return dr * dr + dg * dg + db * db;
  }

  if (metric === 'cielab') {
    const l1 = lab1 ?? rgbToLab(r1, g1, b1);
    const l2 = lab2 ?? rgbToLab(r2, g2, b2);
    const dl = l1.l - l2.l;
    const da = l1.a - l2.a;
    const db = l1.b - l2.b;
    return dl * dl + da * da + db * db;
  }

  // Default: Perceptual Redmean formula (weighted by human vision sensitivity to wavelengths)
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (
    (((512 + rMean) * dr * dr) >> 8) +
    4 * dg * dg +
    (((767 - rMean) * db * db) >> 8)
  );
}

// Pre-computed palette cache for high throughput during dithering
export class PaletteMatcher {
  private colors: PaletteColor[];
  private labs: LabColor[];
  private metric: ColorMetric;

  constructor(colors: PaletteColor[], metric: ColorMetric) {
    this.colors = colors;
    this.metric = metric;
    this.labs = colors.map((c) => rgbToLab(c.rgb[0], c.rgb[1], c.rgb[2]));
  }

  public findNearestColor(r: number, g: number, b: number): {
    color: PaletteColor;
    index: number;
    hexNibble: string;
    rgb: [number, number, number];
  } {
    // Clamp incoming RGB
    const cr = Math.max(0, Math.min(255, r));
    const cg = Math.max(0, Math.min(255, g));
    const cb = Math.max(0, Math.min(255, b));

    let targetLab: LabColor | undefined = undefined;
    if (this.metric === 'cielab') {
      targetLab = rgbToLab(cr, cg, cb);
    }

    let minDistance = Infinity;
    let bestIndex = 0;

    for (let i = 0; i < this.colors.length; i++) {
      const pRgb = this.colors[i].rgb;
      const dist = colorDistanceSquared(
        cr,
        cg,
        cb,
        pRgb[0],
        pRgb[1],
        pRgb[2],
        this.metric,
        targetLab,
        this.labs[i]
      );

      if (dist < minDistance) {
        minDistance = dist;
        bestIndex = i;
      }
    }

    const matched = this.colors[bestIndex];
    return {
      color: matched,
      index: matched.index,
      hexNibble: matched.hexNibble,
      rgb: matched.rgb,
    };
  }
}
