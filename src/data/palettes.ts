/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Palette, PaletteColor } from '../types/palette';

export const HEX_DIGITS = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'] as const;

export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + [clamp(r), clamp(g), clamp(b)]
    .map(x => x.toString(16).padStart(2, '0').toUpperCase())
    .join('');
}

function createPaletteList(
  id: string,
  name: string,
  category: Palette['category'],
  description: string,
  colorDefs: [string, string][] // [hex, name]
): Palette {
  const colors: PaletteColor[] = colorDefs.map(([hexColor, colorName], index) => ({
    index,
    hexNibble: HEX_DIGITS[index],
    name: colorName,
    hexColor: hexColor.toUpperCase(),
    rgb: hexToRgb(hexColor),
  }));

  return { id, name, category, description, colors };
}

// Canonical IBM Enhanced Graphics Adapter (EGA) 16-color palette
// Defined in IBM EGA BIOS ROM and video memory registers
export const EGA_STANDARD_COLORS: [string, string][] = [
  ['#000000', 'Black'],
  ['#0000AA', 'Blue (Dark Blue)'],
  ['#00AA00', 'Green (Dark Green)'],
  ['#00AAAA', 'Cyan (Dark Cyan)'],
  ['#AA0000', 'Red (Dark Red)'],
  ['#AA00AA', 'Magenta (Dark Magenta)'],
  ['#AA5500', 'Brown (Dark Yellow)'],
  ['#AAAAAA', 'Light Gray'],
  ['#555555', 'Dark Gray'],
  ['#5555FF', 'Light Blue'],
  ['#55FF55', 'Light Green'],
  ['#55FFFF', 'Light Cyan'],
  ['#FF5555', 'Light Red'],
  ['#FF55FF', 'Light Magenta'],
  ['#FFFF55', 'Yellow (Bright Yellow)'],
  ['#FFFFFF', 'Bright White'],
];

// IBM EGA Alternative (Pure RGBI CGA Mode with #AAAA00 Olive instead of brown)
export const EGA_ALT_COLORS: [string, string][] = [
  ['#000000', 'Black'],
  ['#0000AA', 'Blue'],
  ['#00AA00', 'Green'],
  ['#00AAAA', 'Cyan'],
  ['#AA0000', 'Red'],
  ['#AA00AA', 'Magenta'],
  ['#AAAA00', 'Olive / Dark Yellow'],
  ['#AAAAAA', 'Light Gray'],
  ['#555555', 'Dark Gray'],
  ['#5555FF', 'Light Blue'],
  ['#55FF55', 'Light Green'],
  ['#55FFFF', 'Light Cyan'],
  ['#FF5555', 'Light Red'],
  ['#FF55FF', 'Light Magenta'],
  ['#FFFF55', 'Yellow'],
  ['#FFFFFF', 'Bright White'],
];

// Windows 16 (Standard Windows 3.1 & Windows 95 16-color VGA palette)
export const WINDOWS_16_COLORS: [string, string][] = [
  ['#000000', 'Black'],
  ['#800000', 'Maroon'],
  ['#008000', 'Green'],
  ['#808000', 'Olive'],
  ['#000080', 'Navy'],
  ['#800080', 'Purple'],
  ['#008080', 'Teal'],
  ['#C0C0C0', 'Silver'],
  ['#808080', 'Gray'],
  ['#FF0000', 'Red'],
  ['#00FF00', 'Lime'],
  ['#FFFF00', 'Yellow'],
  ['#0000FF', 'Blue'],
  ['#FF00FF', 'Fuchsia'],
  ['#00FFFF', 'Aqua'],
  ['#FFFFFF', 'White'],
];

// Commodore 64 16-Color Palette (Pepto PAL calibration)
export const C64_COLORS: [string, string][] = [
  ['#000000', 'Black'],
  ['#FFFFFF', 'White'],
  ['#880000', 'Red'],
  ['#AAFFEE', 'Cyan'],
  ['#CC44CC', 'Purple'],
  ['#00CC55', 'Green'],
  ['#0000AA', 'Blue'],
  ['#EEEE77', 'Yellow'],
  ['#DD8855', 'Orange'],
  ['#664400', 'Brown'],
  ['#FF7777', 'Light Red'],
  ['#333333', 'Dark Gray'],
  ['#777777', 'Medium Gray'],
  ['#AAFF66', 'Light Green'],
  ['#0088FF', 'Light Blue'],
  ['#BBBBBB', 'Light Gray'],
];

// PICO-8 16-Color Fantasy Console Palette
export const PICO8_COLORS: [string, string][] = [
  ['#000000', 'Black'],
  ['#1D2B53', 'Dark Blue'],
  ['#7E2553', 'Dark Purple'],
  ['#008751', 'Dark Green'],
  ['#AB5236', 'Brown'],
  ['#5F574F', 'Dark Gray'],
  ['#C2C3C7', 'Light Gray'],
  ['#FFF1E8', 'White'],
  ['#FF004D', 'Red'],
  ['#FFA300', 'Orange'],
  ['#FFEC27', 'Yellow'],
  ['#00E436', 'Green'],
  ['#29ADFF', 'Blue'],
  ['#83769C', 'Indigo'],
  ['#FF77A8', 'Pink'],
  ['#FFCCAA', 'Peach'],
];

// Apple II 16-Color Composite Palette
export const APPLE_II_COLORS: [string, string][] = [
  ['#000000', 'Black'],
  ['#901740', 'Magenta'],
  ['#402CA5', 'Dark Blue'],
  ['#D043E5', 'Purple'],
  ['#006940', 'Dark Green'],
  ['#808080', 'Gray 1'],
  ['#2F95E5', 'Medium Blue'],
  ['#BFA6F9', 'Light Blue'],
  ['#405906', 'Brown'],
  ['#D06A1A', 'Orange'],
  ['#808080', 'Gray 2'],
  ['#FF95BF', 'Pink'],
  ['#2FA61A', 'Light Green'],
  ['#BFBF5A', 'Yellow'],
  ['#6FD3BF', 'Aquamarine'],
  ['#FFFFFF', 'White'],
];

// ZX Spectrum 16 Colors (8 Normal + 8 Bright)
export const ZX_SPECTRUM_COLORS: [string, string][] = [
  ['#000000', 'Black'],
  ['#0000D8', 'Blue'],
  ['#D80000', 'Red'],
  ['#D800D8', 'Magenta'],
  ['#00D800', 'Green'],
  ['#00D8D8', 'Cyan'],
  ['#D8D800', 'Yellow'],
  ['#D8D8D8', 'White'],
  ['#000000', 'Bright Black'],
  ['#0000FF', 'Bright Blue'],
  ['#FF0000', 'Bright Red'],
  ['#FF00FF', 'Bright Magenta'],
  ['#00FF00', 'Bright Green'],
  ['#00FFFF', 'Bright Cyan'],
  ['#FFFF00', 'Bright Yellow'],
  ['#FFFFFF', 'Bright White'],
];

// Game Boy 16-Tone Olive Grayscale Ramp
export const GAMEBOY_16_COLORS: [string, string][] = [
  ['#0F380F', 'GB Deep Ink 0'],
  ['#194614', 'GB Dark Olive 1'],
  ['#235419', 'GB Dark Olive 2'],
  ['#2E631F', 'GB Forest 3'],
  ['#306230', 'GB Classic Dark 4'],
  ['#407730', 'GB Moss 5'],
  ['#518C30', 'GB Olive 6'],
  ['#62A230', 'GB Fern 7'],
  ['#73B730', 'GB Sage 8'],
  ['#8BAC0F', 'GB Classic Mid 9'],
  ['#9EC31B', 'GB Lime A'],
  ['#AFD432', 'GB Chartreuse B'],
  ['#C1E64E', 'GB Light Grass C'],
  ['#D1F06F', 'GB Pale Meadow D'],
  ['#E0F595', 'GB Mint E'],
  ['#9BBC0F', 'GB Classic Bright F'],
];

// Cyberpunk Neon 16
export const CYBERPUNK_16_COLORS: [string, string][] = [
  ['#05050D', 'Void Black'],
  ['#0B1B3D', 'Deep Matrix Blue'],
  ['#142F6B', 'Night Blue'],
  ['#681177', 'Dark Neon Violet'],
  ['#A81180', 'Magenta Glow'],
  ['#E6007A', 'Hot Neon Pink'],
  ['#FF416C', 'Laser Coral'],
  ['#FF4B2B', 'Cyber Orange'],
  ['#FF8A00', 'Amber Ray'],
  ['#FFD200', 'Neon Yellow'],
  ['#00FF87', 'Acid Green'],
  ['#00E5FF', 'Electric Cyan'],
  ['#0077FE', 'Cobalt Pulse'],
  ['#8E2DE2', 'Arcane Violet'],
  ['#D3D9E9', 'Glitch Silver'],
  ['#FFFFFF', 'Overdrive White'],
];

// Monokai 16
export const MONOKAI_16_COLORS: [string, string][] = [
  ['#1E1F1C', 'Charcoal Base'],
  ['#272822', 'Monokai Dark'],
  ['#3E3D32', 'Gutter Gray'],
  ['#49483E', 'Stone Gray'],
  ['#75715E', 'Comment Gray'],
  ['#A59F85', 'Warm Sand'],
  ['#CFD0C2', 'Light Linen'],
  ['#F8F8F2', 'Off White'],
  ['#F92672', 'Monokai Pink'],
  ['#FD971F', 'Monokai Orange'],
  ['#FFE792', 'Monokai Butter'],
  ['#E6DB74', 'Monokai Yellow'],
  ['#A6E22E', 'Monokai Green'],
  ['#66D9EF', 'Monokai Cyan'],
  ['#AE81FF', 'Monokai Purple'],
  ['#FFFFFF', 'Pure White'],
];

// Solarized 16
export const SOLARIZED_16_COLORS: [string, string][] = [
  ['#002B36', 'Base03 (Deep Teal)'],
  ['#073642', 'Base02 (Dark Teal)'],
  ['#586E75', 'Base01 (Muted Blue)'],
  ['#657B83', 'Base00 (Slate)'],
  ['#839496', 'Base0 (Light Slate)'],
  ['#93A1A1', 'Base1 (Pale Slate)'],
  ['#EEE8D5', 'Base2 (Cream)'],
  ['#FDF6E3', 'Base3 (Soft White)'],
  ['#B58900', 'Yellow'],
  ['#CB4B16', 'Orange'],
  ['#DC322F', 'Red'],
  ['#D33682', 'Magenta'],
  ['#6C71C4', 'Violet'],
  ['#268BD2', 'Blue'],
  ['#2AA198', 'Cyan'],
  ['#859900', 'Green'],
];

// 16-Level Linear Grayscale Palette (True 4-Bit Monochrome 0-F)
export const GRAYSCALE_16_COLORS: [string, string][] = [
  ['#000000', 'Black (Level 0)'],
  ['#111111', 'Gray 7% (Level 1)'],
  ['#222222', 'Gray 13% (Level 2)'],
  ['#333333', 'Gray 20% (Level 3)'],
  ['#444444', 'Gray 27% (Level 4)'],
  ['#555555', 'Gray 33% (Level 5)'],
  ['#666666', 'Gray 40% (Level 6)'],
  ['#777777', 'Gray 47% (Level 7)'],
  ['#888888', 'Gray 53% (Level 8)'],
  ['#999999', 'Gray 60% (Level 9)'],
  ['#AAAAAA', 'Gray 67% (Level A)'],
  ['#BBBBBB', 'Gray 73% (Level B)'],
  ['#CCCCCC', 'Gray 80% (Level C)'],
  ['#DDDDDD', 'Gray 87% (Level D)'],
  ['#EEEEEE', 'Gray 93% (Level E)'],
  ['#FFFFFF', 'Bright White (Level F)'],
];

// Amber Monochrome CRT Phosphor 16-Shade Ramp
export const AMBER_16_COLORS: [string, string][] = [
  ['#000000', 'Amber Level 0'],
  ['#1A0F00', 'Amber Level 1'],
  ['#2E1B00', 'Amber Level 2'],
  ['#422700', 'Amber Level 3'],
  ['#573300', 'Amber Level 4'],
  ['#6B3F00', 'Amber Level 5'],
  ['#804B00', 'Amber Level 6'],
  ['#945700', 'Amber Level 7'],
  ['#A86300', 'Amber Level 8'],
  ['#BD6F00', 'Amber Level 9'],
  ['#D17B00', 'Amber Level A'],
  ['#E58700', 'Amber Level B'],
  ['#F79300', 'Amber Level C'],
  ['#FFA000', 'Amber Level D'],
  ['#FFB326', 'Amber Level E'],
  ['#FFC966', 'Amber Level F'],
];

// Green Phosphor CRT Monochrome (IBM 5151) 16-Shade Ramp
export const GREEN_PHOSPHOR_16_COLORS: [string, string][] = [
  ['#000000', 'Green Level 0'],
  ['#051505', 'Green Level 1'],
  ['#0B250B', 'Green Level 2'],
  ['#103510', 'Green Level 3'],
  ['#154515', 'Green Level 4'],
  ['#1A551A', 'Green Level 5'],
  ['#206620', 'Green Level 6'],
  ['#257625', 'Green Level 7'],
  ['#2B862B', 'Green Level 8'],
  ['#309630', 'Green Level 9'],
  ['#35A635', 'Green Level A'],
  ['#3BB63B', 'Green Level B'],
  ['#41C741', 'Green Level C'],
  ['#4DD74D', 'Green Level D'],
  ['#66E666', 'Green Level E'],
  ['#85F585', 'Green Level F'],
];

// Microsoft QBasic / QuickBASIC 4.5 Standard 16-Color Palette
export const QBASIC_16_COLORS: [string, string][] = [
  ['#000000', '0: Black'],
  ['#0000AA', '1: Blue'],
  ['#00AA00', '2: Green'],
  ['#00AAAA', '3: Cyan'],
  ['#AA0000', '4: Red'],
  ['#AA00AA', '5: Magenta'],
  ['#AA5500', '6: Brown'],
  ['#AAAAAA', '7: White (Light Gray)'],
  ['#555555', '8: Gray (Dark Gray)'],
  ['#5555FF', '9: Light Blue'],
  ['#55FF55', '10: Light Green'],
  ['#55FFFF', '11: Light Cyan'],
  ['#FF5555', '12: Light Red'],
  ['#FF55FF', '13: Light Magenta'],
  ['#FFFF55', '14: Yellow'],
  ['#FFFFFF', '15: High-Intensity White'],
];

export const ALL_PALETTES: Palette[] = [
  createPaletteList('ega-standard', 'IBM EGA Standard', 'Classic Hardware', 'The authentic 16-color Enhanced Graphics Adapter palette (1984), standard for classic DOS gaming and early PC pixel art.', EGA_STANDARD_COLORS),
  createPaletteList('qbasic-16', 'Microsoft QBasic 16 (OUT &H3C8/9)', 'Classic Hardware', 'Standard 16-color palette for MS-DOS QBasic / QuickBASIC (SCREEN 7, 9, 12) with hardware I/O ports &H3C8/&H3C9.', QBASIC_16_COLORS),
  createPaletteList('grayscale-16', '16-Level Grayscale', 'Monochrome & Grayscale', 'Linear 16-shade monochrome ramp from black (0) to white (F). Perfect for classic NeXTstation, 4-bit monochrome monitors, and e-ink displays.', GRAYSCALE_16_COLORS),
  createPaletteList('amber-16', 'Amber Phosphor CRT', 'Monochrome & Grayscale', 'Classic 16-shade warm amber monochrome CRT phosphor gradient.', AMBER_16_COLORS),
  createPaletteList('green-phosphor-16', 'IBM 5151 Green Phosphor', 'Monochrome & Grayscale', 'Iconic 16-shade P39 green phosphor CRT monitor monochrome ramp.', GREEN_PHOSPHOR_16_COLORS),
  createPaletteList('ega-alt', 'IBM EGA / CGA Alternative', 'Classic Hardware', 'CGA RGBI alternative with olive dark yellow in place of brown.', EGA_ALT_COLORS),
  createPaletteList('windows-16', 'Windows 16 (VGA/EGA)', 'Retro Computers', 'Standard 16-color VGA/EGA palette used by Windows 3.1, Windows 95, and Paint.', WINDOWS_16_COLORS),
  createPaletteList('c64', 'Commodore 64', 'Retro Computers', 'The iconic 16-color palette of the Commodore 64 home computer (1982).', C64_COLORS),
  createPaletteList('pico-8', 'PICO-8 Fantasy Console', 'Modern Retro', 'Curated 16-color palette engineered by Joseph White for the PICO-8 fantasy console.', PICO8_COLORS),
  createPaletteList('apple-ii', 'Apple II Composite', 'Retro Computers', 'Classic 16-color palette of the Apple II computer line (NTSC composite color artifacts).', APPLE_II_COLORS),
  createPaletteList('zx-spectrum', 'ZX Spectrum (16 Colors)', 'Retro Computers', 'Sinclair ZX Spectrum 8 standard colors plus 8 bright intensity counterparts.', ZX_SPECTRUM_COLORS),
  createPaletteList('cyberpunk', 'Cyberpunk Neon 16', 'Modern Retro', 'High-contrast synthetic palette with vivid neons, deep voids, and electric accents.', CYBERPUNK_16_COLORS),
  createPaletteList('monokai', 'Monokai 16', 'Modern Retro', 'Classic code editor palette adapted for balanced 4-bit graphical quantization.', MONOKAI_16_COLORS),
  createPaletteList('solarized', 'Solarized 16', 'Modern Retro', 'Ethan Schoonover\'s precision palette engineered for optimal perceptual contrast.', SOLARIZED_16_COLORS),
  createPaletteList('gameboy-16', 'Game Boy Olive Ramp', 'Consoles', 'Extended 16-shade monochrome olive ramp inspired by the original Nintendo Game Boy LCD.', GAMEBOY_16_COLORS),
];

export const DEFAULT_PALETTE_ID = 'ega-standard';
