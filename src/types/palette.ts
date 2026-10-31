/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PaletteColor {
  index: number;         // 0 to 15
  hexNibble: string;     // '0', '1', ..., '9', 'A', ..., 'F'
  name: string;          // e.g. "Bright White", "Dark Green"
  hexColor: string;      // e.g. "#00AA00"
  rgb: [number, number, number]; // [r, g, b] 0-255
}

export interface Palette {
  id: string;
  name: string;
  category: 'Classic Hardware' | 'Retro Computers' | 'Consoles' | 'Modern Retro' | 'Monochrome & Grayscale' | 'Custom';
  description: string;
  colors: PaletteColor[];
}

export type DitherAlgorithm =
  | 'none'
  | 'floyd-steinberg'
  | 'atkinson'
  | 'jarvis'
  | 'stucki'
  | 'burkes'
  | 'sierra-lite'
  | 'sierra-3'
  | 'bayer-2'
  | 'bayer-4'
  | 'bayer-8';

export type ColorMetric = 'perceptual' | 'cielab' | 'euclidean';

export type FitMode = 'contain' | 'cover' | 'stretch' | 'center-crop';

export type ResampleFilter = 'nearest' | 'bilinear';

export type ExportFormat =
  | 'raw-matrix'
  | 'delimited-space'
  | 'delimited-comma'
  | 'packed-hex'
  | 'c-array'
  | 'qbasic-ports'
  | 'qbasic'
  | 'assembly'
  | 'json';

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  gamma: number;      // 0.2 to 3.0
  invert: boolean;
  sharpness: number;  // 0 to 5
}

export interface ProcessedImageData {
  width: number;
  height: number;
  hexMatrix: string[][];       // [y][x] -> '0'..'F'
  indexMatrix: Uint8Array;     // flat array of indices (0-15)
  colorCounts: Record<number, number>;
  uniqueColorCount: number;
  quantizedImageData: ImageData;
}

export interface PixelHoverInfo {
  x: number;
  y: number;
  hexNibble: string;
  colorIndex: number;
  colorName: string;
  paletteHex: string;
  originalRgb?: [number, number, number];
}

export interface BatchImageItem {
  id: string;
  filename: string;
  fileSize?: number;
  sourceUrl: string;
  imgElement?: HTMLImageElement;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  processed?: ProcessedImageData;
  thumbnailCanvasUrl?: string;
  originalWidth?: number;
  originalHeight?: number;
}

export type BatchCommentStyle = 'semicolon' | 'c-slash' | 'hash' | 'rem';

export interface BatchExportOptions {
  format: ExportFormat;
  commentStyle: BatchCommentStyle;
  includeGlobalHeader: boolean;
  includeFileStats: boolean;
  uppercase: boolean;
  lineWrap?: number;
}
