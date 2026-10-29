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

// IBM CGA 16-Color RGBI Standard (1981)
export const CGA_RGBI_COLORS: [string, string][] = [
  ['#000000', 'Black (IRGB 0000)'],
  ['#0000AA', 'Blue (IRGB 0001)'],
  ['#00AA00', 'Green (IRGB 0010)'],
  ['#00AAAA', 'Cyan (IRGB 0011)'],
  ['#AA0000', 'Red (IRGB 0100)'],
  ['#AA00AA', 'Magenta (IRGB 0101)'],
  ['#AA5500', 'Brown (IRGB 0110 with color fix)'],
  ['#AAAAAA', 'Light Gray (IRGB 0111)'],
  ['#555555', 'Dark Gray (IRGB 1000)'],
  ['#5555FF', 'Light Blue (IRGB 1001)'],
  ['#55FF55', 'Light Green (IRGB 1010)'],
  ['#55FFFF', 'Light Cyan (IRGB 1011)'],
  ['#FF5555', 'Light Red (IRGB 1100)'],
  ['#FF55FF', 'Light Magenta (IRGB 1101)'],
  ['#FFFF55', 'Yellow (IRGB 1110)'],
  ['#FFFFFF', 'Bright White (IRGB 1111)'],
];

// IBM CGA Mode 4 Gaming (Cyan / Magenta / White 16-Slot Dither Ramp)
export const CGA_MODE4_CYAN_MAGENTA_COLORS: [string, string][] = [
  ['#000000', 'CGA Black'],
  ['#002B2B', 'Deep Teal Shadow'],
  ['#005555', 'Dark Cyan (Low-Mid)'],
  ['#00AAAA', 'Cyan (Low Intensity)'],
  ['#2A8080', 'Medium Aqua'],
  ['#55FFFF', 'Bright Cyan (High Intensity)'],
  ['#2B002B', 'Deep Plum Shadow'],
  ['#550055', 'Dark Magenta (Low-Mid)'],
  ['#AA00AA', 'Magenta (Low Intensity)'],
  ['#D42AD4', 'Medium Orchid'],
  ['#FF55FF', 'Bright Magenta (High Intensity)'],
  ['#555555', 'Charcoal Gray'],
  ['#AAAAAA', 'Light Gray (Low Intensity)'],
  ['#FFAAFF', 'Pale Lavender Highlight'],
  ['#AAFFFF', 'Pale Ice Cyan'],
  ['#FFFFFF', 'Bright White (High Intensity)'],
];

// IBM CGA Mode 4 Gaming (Green / Red / Yellow 16-Slot Dither Ramp)
export const CGA_MODE4_GREEN_RED_COLORS: [string, string][] = [
  ['#000000', 'CGA Black'],
  ['#002B00', 'Deep Pine Shadow'],
  ['#005500', 'Dark Green (Low-Mid)'],
  ['#00AA00', 'Green (Low Intensity)'],
  ['#2AD42A', 'Emerald Tint'],
  ['#55FF55', 'Bright Green (High Intensity)'],
  ['#2B0000', 'Deep Maroon Shadow'],
  ['#550000', 'Dark Red (Low-Mid)'],
  ['#AA0000', 'Red (Low Intensity)'],
  ['#AA5500', 'Brown (Low Intensity)'],
  ['#FF5555', 'Bright Red (High Intensity)'],
  ['#D48000', 'Amber Ochre'],
  ['#AAAAAA', 'Light Gray'],
  ['#FFAA55', 'Peach Warm Highlight'],
  ['#FFFF55', 'Bright Yellow (High Intensity)'],
  ['#FFFFFF', 'Bright White'],
];

// IBM CGA 160x100 Composite Mode (16 NTSC Artifact Colors)
export const CGA_COMPOSITE_16_COLORS: [string, string][] = [
  ['#000000', 'Black'],
  ['#1E370A', 'Dark Green'],
  ['#3E1E5F', 'Dark Violet'],
  ['#583569', 'Medium Violet'],
  ['#0C4D35', 'Teal Green'],
  ['#2E5040', 'Olive Gray'],
  ['#8E3006', 'Dark Ochre'],
  ['#B85816', 'Orange Rust'],
  ['#0060AA', 'CGA Blue'],
  ['#357FC6', 'Light Sky Blue'],
  ['#8765A7', 'Lavender'],
  ['#B87CD6', 'Pink Lilac'],
  ['#5DB004', 'Chartreuse Green'],
  ['#80C828', 'Bright Lime'],
  ['#C0BD40', 'Sand Yellow'],
  ['#FFFFFF', 'White'],
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

// Atari ST 16-Color Standard GEM Desktop Palette (1985)
export const ATARI_ST_COLORS: [string, string][] = [
  ['#FFFFFF', 'White'],
  ['#000000', 'Black'],
  ['#FF0000', 'Red'],
  ['#00FF00', 'Green'],
  ['#0000FF', 'Blue'],
  ['#00FFFF', 'Cyan'],
  ['#FFFF00', 'Yellow'],
  ['#FF00FF', 'Magenta'],
  ['#B4B4B4', 'Silver / Low White'],
  ['#707070', 'Dark Gray'],
  ['#800000', 'Dark Red'],
  ['#008000', 'Dark Green'],
  ['#000080', 'Dark Blue'],
  ['#008080', 'Dark Cyan'],
  ['#808000', 'Dark Yellow / Olive'],
  ['#800080', 'Dark Magenta'],
];

// Commodore Amiga 16-Color OCS Workbench 1.3 & Gaming Palette (1985)
export const AMIGA_16_COLORS: [string, string][] = [
  ['#0055AA', 'Amiga Workbench Blue'],
  ['#FFFFFF', 'White'],
  ['#000000', 'Black'],
  ['#FFAA00', 'Orange Amber'],
  ['#008800', 'Forest Green'],
  ['#55FF55', 'Bright Green'],
  ['#880000', 'Brick Crimson'],
  ['#FF4444', 'Bright Red'],
  ['#000055', 'Midnight Navy'],
  ['#55AAFF', 'Sky Blue'],
  ['#884400', 'Leather Brown'],
  ['#FFFF55', 'Light Yellow'],
  ['#555555', 'Dark Charcoal'],
  ['#AAAAAA', 'Light Silver'],
  ['#AA00AA', 'Deep Purple'],
  ['#FFAAFF', 'Pastel Pink'],
];

// Amstrad CPC 16-Color Mode 0 Palette (1984)
export const AMSTRAD_CPC_COLORS: [string, string][] = [
  ['#000000', 'Black'],
  ['#000080', 'Navy Blue'],
  ['#0000FF', 'Bright Blue'],
  ['#800000', 'Maroon'],
  ['#800080', 'Purple'],
  ['#8000FF', 'Mauve'],
  ['#FF0000', 'Bright Red'],
  ['#FF00FF', 'Bright Magenta'],
  ['#008000', 'Forest Green'],
  ['#008080', 'Teal'],
  ['#0080FF', 'Sky Blue'],
  ['#00FF00', 'Lime Green'],
  ['#00FF80', 'Sea Green'],
  ['#00FFFF', 'Bright Cyan'],
  ['#FFFF00', 'Pastel Yellow'],
  ['#FFFFFF', 'Bright White'],
];

// MSX 1 / TI-99/4A / ColecoVision (Texas Instruments TMS9918 16 Colors)
export const MSX_TMS9918_COLORS: [string, string][] = [
  ['#000000', 'Black'],
  ['#21C842', 'Medium Green'],
  ['#5EDC78', 'Light Green'],
  ['#5455ED', 'Dark Blue'],
  ['#7D76FC', 'Light Blue'],
  ['#D4524D', 'Dark Red'],
  ['#42EBF5', 'Cyan'],
  ['#FC5554', 'Medium Red'],
  ['#FF7978', 'Light Red'],
  ['#D4C154', 'Dark Yellow'],
  ['#E6CE80', 'Light Yellow'],
  ['#21B03B', 'Dark Green'],
  ['#C95BBA', 'Magenta'],
  ['#CCCCCC', 'Light Gray'],
  ['#555555', 'Dark Gray'],
  ['#FFFFFF', 'White'],
];

// Apple Macintosh II / System 7 Color QuickDraw 16 Colors (1987)
export const MAC_SYSTEM7_COLORS: [string, string][] = [
  ['#FFFFFF', 'White'],
  ['#FBF305', 'Lemon Yellow'],
  ['#FF6403', 'Bright Orange'],
  ['#DD0806', 'Carmine Red'],
  ['#F20884', 'Hot Magenta'],
  ['#4600A5', 'Royal Purple'],
  ['#0000D4', 'Cobalt Blue'],
  ['#02ABE9', 'Sky Cyan'],
  ['#1FB714', 'Apple Green'],
  ['#006411', 'Forest Green'],
  ['#562C05', 'Wood Brown'],
  ['#90713A', 'Tan Ochre'],
  ['#C0C0C0', 'System Platinum'],
  ['#808080', 'Medium Gray'],
  ['#404040', 'Dark Slate'],
  ['#000000', 'Black'],
];

// NES / Famicom 16 Colors (Curated 2C02 PPU Master Palette)
export const NES_16_COLORS: [string, string][] = [
  ['#000000', 'Void Black'],
  ['#001088', 'Dark Cobalt'],
  ['#0020A8', 'Nintendo Blue'],
  ['#44009C', 'Royal Purple'],
  ['#880000', 'Deep Crimson'],
  ['#A81000', 'Famicom Red'],
  ['#A84000', 'Fire Orange'],
  ['#507800', 'Olive Ochre'],
  ['#007800', 'Overworld Green'],
  ['#006838', 'Forest Teal'],
  ['#005858', 'Pipe Cyan'],
  ['#004058', 'Night Slate'],
  ['#FC9838', 'Peach Skin'],
  ['#FCE0A8', 'Coin Pale Yellow'],
  ['#7C7C7C', 'Stone Gray'],
  ['#FFFFFF', 'Pure White'],
];

// Sega Master System / Game Gear 16-Color Palette
export const SMS_16_COLORS: [string, string][] = [
  ['#000000', 'Black'],
  ['#0000AA', 'Deep Blue'],
  ['#0000FF', 'Sonic Blue'],
  ['#00AA00', 'Forest Green'],
  ['#00FF00', 'Emerald Green'],
  ['#00AAAA', 'Teal'],
  ['#00FFFF', 'Cyan'],
  ['#AA0000', 'Maroon'],
  ['#FF0000', 'Vibrant Red'],
  ['#AA00AA', 'Purple'],
  ['#FF00FF', 'Hot Magenta'],
  ['#AA5500', 'Brown'],
  ['#FFAA00', 'Orange'],
  ['#FFFF00', 'Bright Yellow'],
  ['#AAAAAA', 'Light Gray'],
  ['#FFFFFF', 'Pure White'],
];

// Game Boy Color Curated 16 Colors
export const GBC_16_COLORS: [string, string][] = [
  ['#081820', 'Deep Ink'],
  ['#346856', 'Sea Green'],
  ['#88C070', 'Sage Green'],
  ['#E0F8D0', 'Pale Meadow'],
  ['#000000', 'Black'],
  ['#003888', 'Sapphire'],
  ['#0088FF', 'Cyan Blue'],
  ['#88D8FF', 'Ice Blue'],
  ['#680000', 'Dark Crimson'],
  ['#B80000', 'Scarlet'],
  ['#F83800', 'Vermilion'],
  ['#F8A800', 'Gold Amber'],
  ['#F8F800', 'Yellow'],
  ['#888888', 'Slate Gray'],
  ['#D8D8D8', 'Silver'],
  ['#FFFFFF', 'White'],
];

// DawnBringer 16 (DB16 - Legendary Benchmark Pixel Art Palette)
export const DAWNBRINGER_16_COLORS: [string, string][] = [
  ['#140C1C', 'Black Plum'],
  ['#442434', 'Dark Wine'],
  ['#30346D', 'Midnight Blue'],
  ['#4E4A4E', 'Slate Gray'],
  ['#854C30', 'Leather Brown'],
  ['#346524', 'Deep Green'],
  ['#D04648', 'Brick Red'],
  ['#757161', 'Khaki Stone'],
  ['#597DCE', 'Periwinkle Blue'],
  ['#D27D2C', 'Warm Amber'],
  ['#8595A1', 'Cool Mist Gray'],
  ['#6DAA2C', 'Moss Green'],
  ['#D2A474', 'Sand Tan'],
  ['#4FA4B8', 'Aqua Blue'],
  ['#92E8C0', 'Pale Mint'],
  ['#F7E7C4', 'Cream White'],
];

// Sweetie 16 (GrafxKid - Top Rated Lospec Palette)
export const SWEETIE_16_COLORS: [string, string][] = [
  ['#1A1C2C', 'Space Cadet Navy'],
  ['#5D275D', 'Purple Jam'],
  ['#B13E53', 'Crimson Rose'],
  ['#EF7D57', 'Salmon Coral'],
  ['#FFCD75', 'Butterscotch'],
  ['#A7F070', 'Lime Sorbet'],
  ['#38B764', 'Shamrock Green'],
  ['#257179', 'Deep Seaweed'],
  ['#29366F', 'Bluebonnet'],
  ['#3B5DC9', 'Cobalt Ice'],
  ['#41A6F6', 'Sky Blue'],
  ['#73EFF7', 'Pastel Aqua'],
  ['#F4F4F4', 'Sugar White'],
  ['#94B0C2', 'Silver Cloud'],
  ['#566C86', 'Storm Gray'],
  ['#333C57', 'Blue Stone'],
];

// Endesga 16 (EDG 16 - Handcrafted Pixel Palette)
export const ENDESGA_16_COLORS: [string, string][] = [
  ['#193C3E', 'Deep Abyssal'],
  ['#265C42', 'Pine Forest'],
  ['#3E8948', 'Leaf Green'],
  ['#63C74D', 'Vibrant Sprout'],
  ['#FEE761', 'Lemon Yellow'],
  ['#FEAE34', 'Orange Peel'],
  ['#F77622', 'Rust Fire'],
  ['#E43B44', 'Ruby Red'],
  ['#A22633', 'Dark Berry'],
  ['#3E2731', 'Aubergine'],
  ['#733E39', 'Roast Umber'],
  ['#B86F50', 'Clay Terracotta'],
  ['#E4A672', 'Peach Skin'],
  ['#0099DB', 'Cyan River'],
  ['#2CE8F5', 'Electric Aqua'],
  ['#FFFFFF', 'Pure White'],
];

export const ALL_PALETTES: Palette[] = [
  // Classic Hardware
  createPaletteList('ega-standard', 'IBM EGA Standard', 'Classic Hardware', 'The authentic 16-color Enhanced Graphics Adapter palette (1984), standard for classic DOS gaming and early PC pixel art.', EGA_STANDARD_COLORS),
  createPaletteList('cga-mode4-cyan', 'CGA Mode 4 (Cyan / Magenta)', 'Classic Hardware', 'The world-famous 1980s DOS CGA gaming palette featuring Black, Cyan, Magenta, and White across 16 dither levels.', CGA_MODE4_CYAN_MAGENTA_COLORS),
  createPaletteList('cga-mode4-green', 'CGA Mode 4 (Green / Red)', 'Classic Hardware', 'The classic CGA Palette 0 gaming standard featuring Black, Green, Red, and Yellow across 16 dither levels.', CGA_MODE4_GREEN_RED_COLORS),
  createPaletteList('cga-rgbi', 'IBM CGA 16-Color RGBI', 'Classic Hardware', 'Authentic 1981 IBM Color Graphics Adapter 16-color digital RGBI monitor palette.', CGA_RGBI_COLORS),
  createPaletteList('cga-composite', 'CGA Composite (160×100)', 'Classic Hardware', 'Legendary 16-color NTSC artifact palette produced by IBM CGA composite monitors in 160×100 mode.', CGA_COMPOSITE_16_COLORS),
  createPaletteList('qbasic-16', 'Microsoft QBasic 16 (OUT &H3C8/9)', 'Classic Hardware', 'Standard 16-color palette for MS-DOS QBasic / QuickBASIC (SCREEN 7, 9, 12) with hardware I/O ports &H3C8/&H3C9.', QBASIC_16_COLORS),
  createPaletteList('ega-alt', 'IBM EGA / CGA Alternative', 'Classic Hardware', 'CGA RGBI alternative with olive dark yellow in place of brown.', EGA_ALT_COLORS),

  // Retro Computers
  createPaletteList('c64', 'Commodore 64', 'Retro Computers', 'The iconic 16-color palette of the Commodore 64 home computer (1982).', C64_COLORS),
  createPaletteList('amiga-16', 'Commodore Amiga (OCS 16)', 'Retro Computers', 'Classic 16-color palette from the Commodore Amiga 500/1000/2000 OCS generation (Workbench 1.3).', AMIGA_16_COLORS),
  createPaletteList('atari-st', 'Atari ST (GEM 16)', 'Retro Computers', 'The standard 16-color GEM desktop and game palette of the Atari ST/STE family (1985).', ATARI_ST_COLORS),
  createPaletteList('amstrad-cpc', 'Amstrad CPC (Mode 0)', 'Retro Computers', 'Iconic 16-color Mode 0 (160x200) palette of the Amstrad CPC 464/6128 home computers (1984).', AMSTRAD_CPC_COLORS),
  createPaletteList('msx-tms9918', 'MSX 1 / TMS9918', 'Retro Computers', 'Texas Instruments TMS9918 VDP 16-color palette used in MSX 1, TI-99/4A, ColecoVision, and SG-1000.', MSX_TMS9918_COLORS),
  createPaletteList('apple-ii', 'Apple II Composite', 'Retro Computers', 'Classic 16-color palette of the Apple II computer line (NTSC composite color artifacts).', APPLE_II_COLORS),
  createPaletteList('mac-system7', 'Macintosh System 7 (16 Colors)', 'Retro Computers', 'Standard 16-color QuickDraw palette of classic Apple Macintosh II systems (1987-1991).', MAC_SYSTEM7_COLORS),
  createPaletteList('zx-spectrum', 'ZX Spectrum (16 Colors)', 'Retro Computers', 'Sinclair ZX Spectrum 8 standard colors plus 8 bright intensity counterparts.', ZX_SPECTRUM_COLORS),
  createPaletteList('windows-16', 'Windows 16 (VGA/EGA)', 'Retro Computers', 'Standard 16-color VGA/EGA palette used by Windows 3.1, Windows 95, and Paint.', WINDOWS_16_COLORS),

  // Consoles
  createPaletteList('nes-16', 'NES / Famicom (16 Colors)', 'Consoles', 'Curated 16-color palette from the iconic Nintendo Entertainment System Ricoh 2C02 PPU.', NES_16_COLORS),
  createPaletteList('sms-16', 'Sega Master System (16 Colors)', 'Consoles', 'Vibrant 16-color tile and sprite palette of the Sega Master System and Game Gear (1985).', SMS_16_COLORS),
  createPaletteList('gbc-16', 'Game Boy Color (16 Colors)', 'Consoles', 'Curated 16-color palette representative of the Nintendo Game Boy Color handheld hardware.', GBC_16_COLORS),
  createPaletteList('gameboy-16', 'Game Boy Olive Ramp', 'Consoles', 'Extended 16-shade monochrome olive ramp inspired by the original Nintendo Game Boy LCD.', GAMEBOY_16_COLORS),

  // Monochrome & Grayscale
  createPaletteList('grayscale-16', '16-Level Grayscale', 'Monochrome & Grayscale', 'Linear 16-shade monochrome ramp from black (0) to white (F). Perfect for classic NeXTstation, 4-bit monochrome monitors, and e-ink displays.', GRAYSCALE_16_COLORS),
  createPaletteList('amber-16', 'Amber Phosphor CRT', 'Monochrome & Grayscale', 'Classic 16-shade warm amber monochrome CRT phosphor gradient.', AMBER_16_COLORS),
  createPaletteList('green-phosphor-16', 'IBM 5151 Green Phosphor', 'Monochrome & Grayscale', 'Iconic 16-shade P39 green phosphor CRT monitor monochrome ramp.', GREEN_PHOSPHOR_16_COLORS),

  // Modern Retro
  createPaletteList('dawnbringer-16', 'DawnBringer 16 (DB16)', 'Modern Retro', 'The world-famous 16-color benchmark pixel art palette engineered by DawnBringer for perfect harmony.', DAWNBRINGER_16_COLORS),
  createPaletteList('sweetie-16', 'Sweetie 16 (GrafxKid)', 'Modern Retro', 'Highly popular vibrant 16-color retro gaming palette created by GrafxKid for joyful pixel scenes.', SWEETIE_16_COLORS),
  createPaletteList('endesga-16', 'Endesga 16 (EDG 16)', 'Modern Retro', 'Acclaimed 16-color palette by master pixel artist Endesga with natural greens and earthy tones.', ENDESGA_16_COLORS),
  createPaletteList('pico-8', 'PICO-8 Fantasy Console', 'Modern Retro', 'Curated 16-color palette engineered by Joseph White for the PICO-8 fantasy console.', PICO8_COLORS),
  createPaletteList('cyberpunk', 'Cyberpunk Neon 16', 'Modern Retro', 'High-contrast synthetic palette with vivid neons, deep voids, and electric accents.', CYBERPUNK_16_COLORS),
  createPaletteList('monokai', 'Monokai 16', 'Modern Retro', 'Classic code editor palette adapted for balanced 4-bit graphical quantization.', MONOKAI_16_COLORS),
  createPaletteList('solarized', 'Solarized 16', 'Modern Retro', 'Ethan Schoonover\'s precision palette engineered for optimal perceptual contrast.', SOLARIZED_16_COLORS),
];

export const DEFAULT_PALETTE_ID = 'ega-standard';
