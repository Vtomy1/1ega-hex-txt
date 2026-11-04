/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QuickFilterPreset, QuickFilterType } from '../types/palette';

export const QUICK_FILTERS: QuickFilterPreset[] = [
  {
    id: 'none',
    name: 'Original',
    description: 'Raw source image with no pre-filtering applied.',
    iconBg: 'from-neutral-700 to-neutral-800',
    tag: 'Raw',
  },
  {
    id: 'grayscale',
    name: 'Grayscale',
    description: 'Converts to monochrome luminance (0.299R + 0.587G + 0.114B) for clean tonal quantization.',
    iconBg: 'from-neutral-400 via-neutral-600 to-neutral-900',
    tag: 'Mono',
  },
  {
    id: 'sepia',
    name: 'Sepia',
    description: 'Warm antique brownish-amber tone inspired by vintage photographic prints.',
    iconBg: 'from-amber-700 via-amber-800 to-amber-950',
    tag: 'Warm',
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Expands dynamic range with punchy deep blacks and crisp highlights for bold pixel art edges.',
    iconBg: 'from-white via-neutral-500 to-black',
    tag: 'Punchy',
  },
  {
    id: 'vivid',
    name: 'Vivid Boost',
    description: 'Boosts saturation and contrast to emphasize rich EGA and console palette primaries.',
    iconBg: 'from-rose-500 via-purple-500 to-indigo-500',
    tag: 'Vibrant',
  },
  {
    id: 'vintage-warm',
    name: 'Vintage Warm',
    description: 'Golden 1980s retro CRT monitor warmth with boosted reds and soft amber mids.',
    iconBg: 'from-orange-500 via-amber-600 to-stone-800',
    tag: '80s CRT',
  },
  {
    id: 'cool-cyan',
    name: 'Cool Cyan',
    description: 'Cold cybernetic blue-green tint for sci-fi and arcade visuals.',
    iconBg: 'from-cyan-400 via-teal-600 to-slate-900',
    tag: 'Sci-Fi',
  },
  {
    id: 'invert',
    name: 'Invert',
    description: 'Photographic negative color inversion for schematic / blueprint styles.',
    iconBg: 'from-indigo-600 via-neutral-900 to-emerald-400',
    tag: 'Negative',
  },
  {
    id: 'dramatic-dark',
    name: 'Dark Noir',
    description: 'Crushed shadows and deep vignette mood for gothic retro scenes.',
    iconBg: 'from-neutral-600 via-neutral-900 to-black',
    tag: 'Noir',
  },
];

/**
 * Apply quick filter preset to an ImageData buffer in-place before quantization
 */
export function applyQuickFilterToImageData(
  imageData: ImageData,
  filter: QuickFilterType,
  strength: number = 1.0
): void {
  if (filter === 'none' || strength <= 0) return;

  const data = imageData.data;
  const numPixels = data.length / 4;
  const s = Math.max(0, Math.min(1, strength));

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    switch (filter) {
      case 'grayscale': {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        data[idx] = Math.round(r + (gray - r) * s);
        data[idx + 1] = Math.round(g + (gray - g) * s);
        data[idx + 2] = Math.round(b + (gray - b) * s);
        break;
      }

      case 'sepia': {
        // Standard photographic sepia matrix
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;

        const targetR = Math.min(255, sr);
        const targetG = Math.min(255, sg);
        const targetB = Math.min(255, sb);

        data[idx] = Math.round(r + (targetR - r) * s);
        data[idx + 1] = Math.round(g + (targetG - g) * s);
        data[idx + 2] = Math.round(b + (targetB - b) * s);
        break;
      }

      case 'high-contrast': {
        // Boost contrast by 65% with slight brightness lift
        const contrastVal = 65 * s;
        const factor = (259 * (contrastVal + 255)) / (255 * (259 - contrastVal));
        const bLift = 8 * s;

        const cr = factor * (r - 128) + 128 + bLift;
        const cg = factor * (g - 128) + 128 + bLift;
        const cb = factor * (b - 128) + 128 + bLift;

        data[idx] = Math.max(0, Math.min(255, Math.round(cr)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(cg)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(cb)));
        break;
      }

      case 'vivid': {
        // Boost saturation by 70% and micro-contrast by 20%
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const satBoost = 1.0 + 0.75 * s;
        let vr = gray + (r - gray) * satBoost;
        let vg = gray + (g - gray) * satBoost;
        let vb = gray + (b - gray) * satBoost;

        const cBoost = (259 * (20 * s + 255)) / (255 * (259 - 20 * s));
        vr = cBoost * (vr - 128) + 128;
        vg = cBoost * (vg - 128) + 128;
        vb = cBoost * (vb - 128) + 128;

        data[idx] = Math.max(0, Math.min(255, Math.round(vr)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(vg)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(vb)));
        break;
      }

      case 'vintage-warm': {
        // Amber/gold warmth boost
        const wr = r + 28 * s;
        const wg = g + 10 * s;
        const wb = b - 22 * s;

        // Slight contrast
        const factor = (259 * (22 * s + 255)) / (255 * (259 - 22 * s));
        const fR = factor * (wr - 128) + 128;
        const fG = factor * (wg - 128) + 128;
        const fB = factor * (wb - 128) + 128;

        data[idx] = Math.max(0, Math.min(255, Math.round(fR)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(fG)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(fB)));
        break;
      }

      case 'cool-cyan': {
        // Cyber cyan/blue boost
        const cr = r - 18 * s;
        const cg = g + 14 * s;
        const cb = b + 32 * s;

        const factor = (259 * (24 * s + 255)) / (255 * (259 - 24 * s));
        const fR = factor * (cr - 128) + 128;
        const fG = factor * (cg - 128) + 128;
        const fB = factor * (cb - 128) + 128;

        data[idx] = Math.max(0, Math.min(255, Math.round(fR)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(fG)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(fB)));
        break;
      }

      case 'invert': {
        // Negative
        const invR = 255 - r;
        const invG = 255 - g;
        const invB = 255 - b;

        data[idx] = Math.round(r + (invR - r) * s);
        data[idx + 1] = Math.round(g + (invG - g) * s);
        data[idx + 2] = Math.round(b + (invB - b) * s);
        break;
      }

      case 'dramatic-dark': {
        // Gamma 1.45 crush on shadows, preserving peak highlights
        const invG = 1.45;
        const dr = 255 * Math.pow(r / 255, 1 + 0.45 * s);
        const dg = 255 * Math.pow(g / 255, 1 + 0.45 * s);
        const db = 255 * Math.pow(b / 255, 1 + 0.45 * s);

        data[idx] = Math.max(0, Math.min(255, Math.round(dr)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(dg)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(db)));
        break;
      }
    }
  }
}
