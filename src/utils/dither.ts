/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ColorMetric,
  DitherAlgorithm,
  FitMode,
  ImageAdjustments,
  PaletteColor,
  ProcessedImageData,
  ResampleFilter,
} from '../types/palette';
import { PaletteMatcher } from './color';

// Bayer ordered dithering threshold matrices normalized to [-0.5, 0.5]
const BAYER_2X2 = [
  [0 / 4 - 0.5, 2 / 4 - 0.5],
  [3 / 4 - 0.5, 1 / 4 - 0.5],
];

const BAYER_4X4 = [
  [ 0 / 16 - 0.5,  8 / 16 - 0.5,  2 / 16 - 0.5, 10 / 16 - 0.5],
  [12 / 16 - 0.5,  4 / 16 - 0.5, 14 / 16 - 0.5,  6 / 16 - 0.5],
  [ 3 / 16 - 0.5, 11 / 16 - 0.5,  1 / 16 - 0.5,  9 / 16 - 0.5],
  [15 / 16 - 0.5,  7 / 16 - 0.5, 13 / 16 - 0.5,  5 / 16 - 0.5],
];

const BAYER_8X8 = [
  [ 0/64 - 0.5, 32/64 - 0.5,  8/64 - 0.5, 40/64 - 0.5,  2/64 - 0.5, 34/64 - 0.5, 10/64 - 0.5, 42/64 - 0.5],
  [48/64 - 0.5, 16/64 - 0.5, 56/64 - 0.5, 24/64 - 0.5, 50/64 - 0.5, 18/64 - 0.5, 58/64 - 0.5, 26/64 - 0.5],
  [12/64 - 0.5, 44/64 - 0.5,  4/64 - 0.5, 36/64 - 0.5, 14/64 - 0.5, 46/64 - 0.5,  6/64 - 0.5, 38/64 - 0.5],
  [60/64 - 0.5, 28/64 - 0.5, 52/64 - 0.5, 20/64 - 0.5, 62/64 - 0.5, 30/64 - 0.5, 54/64 - 0.5, 22/64 - 0.5],
  [ 3/64 - 0.5, 35/64 - 0.5, 11/64 - 0.5, 43/64 - 0.5,  1/64 - 0.5, 33/64 - 0.5,  9/64 - 0.5, 41/64 - 0.5],
  [51/64 - 0.5, 19/64 - 0.5, 59/64 - 0.5, 27/64 - 0.5, 49/64 - 0.5, 17/64 - 0.5, 57/64 - 0.5, 25/64 - 0.5],
  [15/64 - 0.5, 47/64 - 0.5,  7/64 - 0.5, 39/64 - 0.5, 13/64 - 0.5, 45/64 - 0.5,  5/64 - 0.5, 37/64 - 0.5],
  [63/64 - 0.5, 31/64 - 0.5, 55/64 - 0.5, 23/64 - 0.5, 61/64 - 0.5, 29/64 - 0.5, 53/64 - 0.5, 21/64 - 0.5],
];

// Error diffusion kernel definitions: [dx, dy, weight]
interface DiffusionKernel {
  divisor: number;
  offsets: [number, number, number][]; // [dx, dy, weight]
}

const ERROR_KERNELS: Record<string, DiffusionKernel> = {
  'floyd-steinberg': {
    divisor: 16,
    offsets: [
      [1, 0, 7],
      [-1, 1, 3],
      [0, 1, 5],
      [1, 1, 1],
    ],
  },
  atkinson: {
    divisor: 8,
    // Atkinson discards 2/8 of the error for high-contrast retro aesthetics
    offsets: [
      [1, 0, 1],
      [2, 0, 1],
      [-1, 1, 1],
      [0, 1, 1],
      [1, 1, 1],
      [0, 2, 1],
    ],
  },
  jarvis: {
    divisor: 48,
    offsets: [
      [1, 0, 7], [2, 0, 5],
      [-2, 1, 3], [-1, 1, 5], [0, 1, 7], [1, 1, 5], [2, 1, 3],
      [-2, 2, 1], [-1, 2, 3], [0, 2, 5], [1, 2, 3], [2, 2, 1],
    ],
  },
  stucki: {
    divisor: 42,
    offsets: [
      [1, 0, 8], [2, 0, 4],
      [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2],
      [-2, 2, 1], [-1, 2, 2], [0, 2, 4], [1, 2, 2], [2, 2, 1],
    ],
  },
  burkes: {
    divisor: 32,
    offsets: [
      [1, 0, 8], [2, 0, 4],
      [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2],
    ],
  },
  'sierra-lite': {
    divisor: 4,
    offsets: [
      [1, 0, 2],
      [-1, 1, 1],
      [0, 1, 1],
    ],
  },
  'sierra-3': {
    divisor: 32,
    offsets: [
      [1, 0, 5], [2, 0, 3],
      [-2, 1, 2], [-1, 1, 4], [0, 1, 5], [1, 1, 4], [2, 1, 2],
      [-1, 2, 2], [0, 2, 3], [1, 2, 2],
    ],
  },
};

/**
 * Resize and crop source image onto target canvas dimensions with user-selected fit mode
 */
export function renderResizedImageToCanvas(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  fitMode: FitMode,
  filter: ResampleFilter
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = filter === 'bilinear';
  if (filter === 'nearest') {
    ctx.imageSmoothingQuality = 'low';
  }

  const sW = sourceImage.width;
  const sH = sourceImage.height;

  let dx = 0;
  let dy = 0;
  let dW = targetWidth;
  let dH = targetHeight;

  let sx = 0;
  let sy = 0;
  let sCropW = sW;
  let sCropH = sH;

  if (fitMode === 'stretch') {
    dx = 0;
    dy = 0;
    dW = targetWidth;
    dH = targetHeight;
  } else if (fitMode === 'contain') {
    const scale = Math.min(targetWidth / sW, targetHeight / sH);
    dW = Math.round(sW * scale);
    dH = Math.round(sH * scale);
    dx = Math.round((targetWidth - dW) / 2);
    dy = Math.round((targetHeight - dH) / 2);

    // Fill background with black for classic letterboxing
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (fitMode === 'cover') {
    const scale = Math.max(targetWidth / sW, targetHeight / sH);
    sCropW = Math.round(targetWidth / scale);
    sCropH = Math.round(targetHeight / scale);
    sx = Math.round((sW - sCropW) / 2);
    sy = Math.round((sH - sCropH) / 2);
  } else if (fitMode === 'center-crop') {
    sCropW = Math.min(sW, targetWidth);
    sCropH = Math.min(sH, targetHeight);
    sx = Math.round((sW - sCropW) / 2);
    sy = Math.round((sH - sCropH) / 2);
    dW = sCropW;
    dH = sCropH;
    dx = Math.round((targetWidth - dW) / 2);
    dy = Math.round((targetHeight - dH) / 2);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(sourceImage, sx, sy, sCropW, sCropH, dx, dy, dW, dH);
  return canvas;
}

/**
 * Apply color, brightness, contrast, saturation, gamma, invert, and sharpness
 */
export function applyAdjustments(
  imageData: ImageData,
  adjustments: ImageAdjustments
): Float32Array {
  const { width, height, data } = imageData;
  const numPixels = width * height;
  const rgbBuffer = new Float32Array(numPixels * 3);

  const { brightness, contrast, saturation, gamma, invert, sharpness } = adjustments;

  // Pre-calculate adjustment factors
  const bAdd = (brightness / 100) * 255;
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const sFactor = (saturation + 100) / 100;
  const invGamma = 1 / Math.max(0.01, gamma);

  // Fill base buffer with basic adjustments
  for (let i = 0; i < numPixels; i++) {
    const srcIdx = i * 4;
    let r = data[srcIdx];
    let g = data[srcIdx + 1];
    let b = data[srcIdx + 2];

    // Invert
    if (invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    // Brightness
    r += bAdd;
    g += bAdd;
    b += bAdd;

    // Contrast
    r = cFactor * (r - 128) + 128;
    g = cFactor * (g - 128) + 128;
    b = cFactor * (b - 128) + 128;

    // Saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * sFactor;
    g = gray + (g - gray) * sFactor;
    b = gray + (b - gray) * sFactor;

    // Gamma
    if (gamma !== 1.0) {
      r = 255 * Math.pow(Math.max(0, Math.min(255, r)) / 255, invGamma);
      g = 255 * Math.pow(Math.max(0, Math.min(255, g)) / 255, invGamma);
      b = 255 * Math.pow(Math.max(0, Math.min(255, b)) / 255, invGamma);
    }

    const destIdx = i * 3;
    rgbBuffer[destIdx] = Math.max(0, Math.min(255, r));
    rgbBuffer[destIdx + 1] = Math.max(0, Math.min(255, g));
    rgbBuffer[destIdx + 2] = Math.max(0, Math.min(255, b));
  }

  // Apply sharpness unsharp-mask filter if sharpness > 0
  if (sharpness > 0) {
    const sharpened = new Float32Array(rgbBuffer.length);
    const amount = sharpness * 0.4;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 3;

        // 3x3 Laplacian edge kernel
        for (let c = 0; c < 3; c++) {
          const center = rgbBuffer[idx + c];
          const left = x > 0 ? rgbBuffer[((y * width) + (x - 1)) * 3 + c] : center;
          const right = x < width - 1 ? rgbBuffer[((y * width) + (x + 1)) * 3 + c] : center;
          const up = y > 0 ? rgbBuffer[(((y - 1) * width) + x) * 3 + c] : center;
          const down = y < height - 1 ? rgbBuffer[(((y + 1) * width) + x) * 3 + c] : center;

          const laplacian = 4 * center - left - right - up - down;
          const val = center + amount * laplacian;
          sharpened[idx + c] = Math.max(0, Math.min(255, val));
        }
      }
    }
    return sharpened;
  }

  return rgbBuffer;
}

/**
 * Execute 4-bit Palette Quantization & Dithering
 */
export function processImageToHex4Bit(
  sourceCanvas: HTMLCanvasElement,
  paletteColors: PaletteColor[],
  algorithm: DitherAlgorithm,
  metric: ColorMetric,
  ditherIntensity: number, // 0 to 1
  adjustments: ImageAdjustments
): ProcessedImageData {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  const rawImageData = ctx.getImageData(0, 0, width, height);

  // 1. Pre-process adjustments
  const rgbBuffer = applyAdjustments(rawImageData, adjustments);

  // 2. Initialize Matcher
  const matcher = new PaletteMatcher(paletteColors, metric);

  // Output structures
  const quantizedImageData = new ImageData(width, height);
  const qData = quantizedImageData.data;
  const hexMatrix: string[][] = Array.from({ length: height }, () => new Array(width));
  const indexMatrix = new Uint8Array(width * height);
  const colorCounts: Record<number, number> = {};

  for (let i = 0; i < 16; i++) {
    colorCounts[i] = 0;
  }

  // Dither processing
  const isOrdered = algorithm.startsWith('bayer-');
  const isNone = algorithm === 'none';

  if (isNone) {
    // Nearest Color Quantization
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bufIdx = (y * width + x) * 3;
        const r = rgbBuffer[bufIdx];
        const g = rgbBuffer[bufIdx + 1];
        const b = rgbBuffer[bufIdx + 2];

        const match = matcher.findNearestColor(r, g, b);

        const outIdx = (y * width + x) * 4;
        qData[outIdx] = match.rgb[0];
        qData[outIdx + 1] = match.rgb[1];
        qData[outIdx + 2] = match.rgb[2];
        qData[outIdx + 3] = 255;

        hexMatrix[y][x] = match.hexNibble;
        indexMatrix[y * width + x] = match.index;
        colorCounts[match.index] = (colorCounts[match.index] || 0) + 1;
      }
    }
  } else if (isOrdered) {
    // Ordered Bayer Dithering
    let bayerMatrix: number[][];
    let matrixSize: number;

    if (algorithm === 'bayer-2') {
      bayerMatrix = BAYER_2X2;
      matrixSize = 2;
    } else if (algorithm === 'bayer-8') {
      bayerMatrix = BAYER_8X8;
      matrixSize = 8;
    } else {
      bayerMatrix = BAYER_4X4;
      matrixSize = 4;
    }

    const amplitude = 64 * ditherIntensity;

    for (let y = 0; y < height; y++) {
      const bayerY = y % matrixSize;
      for (let x = 0; x < width; x++) {
        const bayerX = x % matrixSize;
        const offset = bayerMatrix[bayerY][bayerX] * amplitude;

        const bufIdx = (y * width + x) * 3;
        const r = rgbBuffer[bufIdx] + offset;
        const g = rgbBuffer[bufIdx + 1] + offset;
        const b = rgbBuffer[bufIdx + 2] + offset;

        const match = matcher.findNearestColor(r, g, b);

        const outIdx = (y * width + x) * 4;
        qData[outIdx] = match.rgb[0];
        qData[outIdx + 1] = match.rgb[1];
        qData[outIdx + 2] = match.rgb[2];
        qData[outIdx + 3] = 255;

        hexMatrix[y][x] = match.hexNibble;
        indexMatrix[y * width + x] = match.index;
        colorCounts[match.index] = (colorCounts[match.index] || 0) + 1;
      }
    }
  } else {
    // Error Diffusion Dithering (Floyd-Steinberg, Atkinson, Jarvis, Stucki, Burkes, Sierra)
    const kernel = ERROR_KERNELS[algorithm] || ERROR_KERNELS['floyd-steinberg'];
    const intensity = Math.max(0, Math.min(1, ditherIntensity));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bufIdx = (y * width + x) * 3;
        const oldR = rgbBuffer[bufIdx];
        const oldG = rgbBuffer[bufIdx + 1];
        const oldB = rgbBuffer[bufIdx + 2];

        const match = matcher.findNearestColor(oldR, oldG, oldB);

        const outIdx = (y * width + x) * 4;
        qData[outIdx] = match.rgb[0];
        qData[outIdx + 1] = match.rgb[1];
        qData[outIdx + 2] = match.rgb[2];
        qData[outIdx + 3] = 255;

        hexMatrix[y][x] = match.hexNibble;
        indexMatrix[y * width + x] = match.index;
        colorCounts[match.index] = (colorCounts[match.index] || 0) + 1;

        // Calculate quantization error
        const errR = (oldR - match.rgb[0]) * intensity;
        const errG = (oldG - match.rgb[1]) * intensity;
        const errB = (oldB - match.rgb[2]) * intensity;

        // Diffuse error to neighboring pixels based on kernel weights
        for (let k = 0; k < kernel.offsets.length; k++) {
          const [dx, dy, weight] = kernel.offsets[k];
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nBufIdx = (ny * width + nx) * 3;
            const factor = weight / kernel.divisor;
            rgbBuffer[nBufIdx] += errR * factor;
            rgbBuffer[nBufIdx + 1] += errG * factor;
            rgbBuffer[nBufIdx + 2] += errB * factor;
          }
        }
      }
    }
  }

  let uniqueColorCount = 0;
  for (let i = 0; i < 16; i++) {
    if (colorCounts[i] > 0) {
      uniqueColorCount++;
    }
  }

  return {
    width,
    height,
    hexMatrix,
    indexMatrix,
    colorCounts,
    uniqueColorCount,
    quantizedImageData,
  };
}
