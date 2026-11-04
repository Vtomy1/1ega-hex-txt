/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserPreset, PresetSettings } from '../types/palette';

export const LOCAL_STORAGE_PRESETS_KEY = 'pic2hex_user_presets_v1';

export const FACTORY_PRESETS: UserPreset[] = [
  {
    id: 'factory-ega-classic',
    name: 'DOS EGA Gamer',
    description: 'Authentic 1980s IBM EGA 16-color dithering as seen in classic Sierra and LucasArts DOS adventures.',
    category: 'Factory',
    createdAt: 1700000001000,
    settings: {
      paletteId: 'ega-standard',
      isCustomPalette: false,
      algorithm: 'floyd-steinberg',
      ditherIntensity: 0.85,
      colorMetric: 'perceptual',
      fitMode: 'cover',
      resampleFilter: 'nearest',
      quickFilter: 'none',
      filterStrength: 1.0,
      adjustments: {
        brightness: 0,
        contrast: 10,
        saturation: 15,
        gamma: 1.0,
        invert: false,
        sharpness: 0.6,
      },
    },
  },
  {
    id: 'factory-cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'High-contrast synthetic look with vivid neons, deep blacks, and sharp Atkinson error diffusion.',
    category: 'Factory',
    createdAt: 1700000002000,
    settings: {
      paletteId: 'cyberpunk',
      isCustomPalette: false,
      algorithm: 'atkinson',
      ditherIntensity: 0.9,
      colorMetric: 'perceptual',
      fitMode: 'cover',
      resampleFilter: 'nearest',
      quickFilter: 'vivid',
      filterStrength: 1.0,
      adjustments: {
        brightness: 5,
        contrast: 25,
        saturation: 40,
        gamma: 1.1,
        invert: false,
        sharpness: 1.2,
      },
    },
  },
  {
    id: 'factory-gameboy',
    name: 'Game Boy Pocket LCD',
    description: 'Ordered 4x4 matrix dither with authentic retro handheld olive phosphor shades and desaturated tone.',
    category: 'Factory',
    createdAt: 1700000003000,
    settings: {
      paletteId: 'gameboy-16',
      isCustomPalette: false,
      algorithm: 'bayer-4',
      ditherIntensity: 0.95,
      colorMetric: 'perceptual',
      fitMode: 'cover',
      resampleFilter: 'nearest',
      quickFilter: 'grayscale',
      filterStrength: 1.0,
      adjustments: {
        brightness: 0,
        contrast: 20,
        saturation: -100,
        gamma: 1.05,
        invert: false,
        sharpness: 0.8,
      },
    },
  },
  {
    id: 'factory-mac-1bit',
    name: 'Macintosh Classic Stipple',
    description: 'High-contrast crisp monochrome stippling reminiscent of classic 1984 MacPaint and HyperCard.',
    category: 'Factory',
    createdAt: 1700000004000,
    settings: {
      paletteId: 'grayscale-16',
      isCustomPalette: false,
      algorithm: 'floyd-steinberg',
      ditherIntensity: 1.0,
      colorMetric: 'cielab',
      fitMode: 'cover',
      resampleFilter: 'nearest',
      quickFilter: 'high-contrast',
      filterStrength: 1.0,
      adjustments: {
        brightness: 10,
        contrast: 35,
        saturation: -100,
        gamma: 0.9,
        invert: false,
        sharpness: 1.5,
      },
    },
  },
  {
    id: 'factory-c64-demo',
    name: 'Commodore 64 Demo',
    description: 'Warm VIC-II palette tones with smooth Burkes error diffusion for 1980s 8-bit computer demo scenes.',
    category: 'Factory',
    createdAt: 1700000005000,
    settings: {
      paletteId: 'c64',
      isCustomPalette: false,
      algorithm: 'burkes',
      ditherIntensity: 0.8,
      colorMetric: 'perceptual',
      fitMode: 'cover',
      resampleFilter: 'nearest',
      quickFilter: 'vintage-warm',
      filterStrength: 0.8,
      adjustments: {
        brightness: -5,
        contrast: 15,
        saturation: 20,
        gamma: 1.0,
        invert: false,
        sharpness: 0.5,
      },
    },
  },
  {
    id: 'factory-noir',
    name: 'Dark Noir Detective',
    description: 'Deep shadows, brooding contrast, and fine 16-shade grayscale grain using Jarvis error diffusion.',
    category: 'Factory',
    createdAt: 1700000006000,
    settings: {
      paletteId: 'grayscale-16',
      isCustomPalette: false,
      algorithm: 'jarvis',
      ditherIntensity: 0.9,
      colorMetric: 'perceptual',
      fitMode: 'cover',
      resampleFilter: 'nearest',
      quickFilter: 'dramatic-dark',
      filterStrength: 1.0,
      adjustments: {
        brightness: -10,
        contrast: 40,
        saturation: -100,
        gamma: 0.85,
        invert: false,
        sharpness: 1.0,
      },
    },
  },
  {
    id: 'factory-cga-mode4',
    name: 'CGA Mode 4 Vapor',
    description: 'Legendary cyan, magenta, black & white DOS palette with cool ambient tinting and Sierra Lite dithering.',
    category: 'Factory',
    createdAt: 1700000007000,
    settings: {
      paletteId: 'cga-mode4-cyan',
      isCustomPalette: false,
      algorithm: 'sierra-lite',
      ditherIntensity: 0.85,
      colorMetric: 'perceptual',
      fitMode: 'cover',
      resampleFilter: 'nearest',
      quickFilter: 'cool-cyan',
      filterStrength: 0.9,
      adjustments: {
        brightness: 0,
        contrast: 20,
        saturation: 25,
        gamma: 1.0,
        invert: false,
        sharpness: 0.8,
      },
    },
  },
  {
    id: 'factory-pico8',
    name: 'PICO-8 Fantasy Arcade',
    description: 'Cheerful fantasy console colors with crisp Stucki error diffusion and boosted saturation.',
    category: 'Factory',
    createdAt: 1700000008000,
    settings: {
      paletteId: 'pico-8',
      isCustomPalette: false,
      algorithm: 'stucki',
      ditherIntensity: 0.8,
      colorMetric: 'perceptual',
      fitMode: 'cover',
      resampleFilter: 'nearest',
      quickFilter: 'none',
      filterStrength: 1.0,
      adjustments: {
        brightness: 2,
        contrast: 15,
        saturation: 30,
        gamma: 1.0,
        invert: false,
        sharpness: 0.7,
      },
    },
  },
];

/**
 * Load user-saved presets from localStorage
 */
export function loadUserPresets(): UserPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        category: 'User' as const,
      }));
    }
    return [];
  } catch (err) {
    console.error('Failed to load user presets from localStorage:', err);
    return [];
  }
}

/**
 * Save user presets list to localStorage
 */
export function persistUserPresets(presets: UserPreset[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanList = presets.filter((p) => p.category === 'User');
    localStorage.setItem(LOCAL_STORAGE_PRESETS_KEY, JSON.stringify(cleanList));
  } catch (err) {
    console.error('Failed to persist user presets to localStorage:', err);
  }
}

/**
 * Save or insert a new user preset
 */
export function saveUserPreset(preset: UserPreset): UserPreset[] {
  const current = loadUserPresets();
  const index = current.findIndex((p) => p.id === preset.id);
  let updated: UserPreset[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...preset, category: 'User' };
  } else {
    updated = [{ ...preset, category: 'User' }, ...current];
  }
  persistUserPresets(updated);
  return updated;
}

/**
 * Delete a user preset by ID
 */
export function deleteUserPreset(id: string): UserPreset[] {
  const current = loadUserPresets();
  const updated = current.filter((p) => p.id !== id);
  persistUserPresets(updated);
  return updated;
}

/**
 * Get all presets (Factory Curated + User Saved)
 */
export function getAllPresets(): UserPreset[] {
  const userPresets = loadUserPresets();
  return [...userPresets, ...FACTORY_PRESETS];
}

/**
 * Export all user presets to downloadable JSON file
 */
export function exportPresetsToJson(presets: UserPreset[]): void {
  const exportPayload = {
    app: 'EGA HexStudio',
    version: '1.0',
    exportDate: new Date().toISOString(),
    presets: presets.filter((p) => p.category === 'User'),
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ega-hexstudio-user-presets-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import presets from a JSON string with schema validation
 */
export function importPresetsFromJson(jsonString: string): {
  success: boolean;
  count: number;
  error?: string;
  importedPresets?: UserPreset[];
} {
  try {
    const parsed = JSON.parse(jsonString);
    let itemsToImport: any[] = [];

    if (Array.isArray(parsed)) {
      itemsToImport = parsed;
    } else if (parsed && Array.isArray(parsed.presets)) {
      itemsToImport = parsed.presets;
    } else {
      return {
        success: false,
        count: 0,
        error: 'Invalid preset file format: expected an array or object with "presets" array.',
      };
    }

    if (itemsToImport.length === 0) {
      return { success: false, count: 0, error: 'No presets found in file.' };
    }

    const currentPresets = loadUserPresets();
    const existingIds = new Set(currentPresets.map((p) => p.id));
    const validatedNewPresets: UserPreset[] = [];

    for (const item of itemsToImport) {
      if (!item.name || !item.settings) {
        continue;
      }

      // Generate unique ID if collision occurs
      let newId = item.id || `user-preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      if (existingIds.has(newId)) {
        newId = `user-preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }
      existingIds.add(newId);

      const validated: UserPreset = {
        id: newId,
        name: String(item.name).slice(0, 50),
        description: item.description ? String(item.description).slice(0, 200) : '',
        category: 'User',
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
        settings: {
          algorithm: item.settings.algorithm || 'floyd-steinberg',
          ditherIntensity: typeof item.settings.ditherIntensity === 'number' ? item.settings.ditherIntensity : 0.85,
          colorMetric: item.settings.colorMetric || 'perceptual',
          fitMode: item.settings.fitMode || 'cover',
          resampleFilter: item.settings.resampleFilter || 'nearest',
          quickFilter: item.settings.quickFilter || 'none',
          filterStrength: typeof item.settings.filterStrength === 'number' ? item.settings.filterStrength : 1.0,
          paletteId: item.settings.paletteId || 'ega-standard',
          isCustomPalette: Boolean(item.settings.isCustomPalette),
          customColors: Array.isArray(item.settings.customColors) ? item.settings.customColors : undefined,
          width: typeof item.settings.width === 'number' ? item.settings.width : undefined,
          height: typeof item.settings.height === 'number' ? item.settings.height : undefined,
          adjustments: {
            brightness: item.settings.adjustments?.brightness ?? 0,
            contrast: item.settings.adjustments?.contrast ?? 0,
            saturation: item.settings.adjustments?.saturation ?? 0,
            gamma: item.settings.adjustments?.gamma ?? 1.0,
            invert: Boolean(item.settings.adjustments?.invert),
            sharpness: item.settings.adjustments?.sharpness ?? 0,
          },
        },
      };

      validatedNewPresets.push(validated);
    }

    if (validatedNewPresets.length === 0) {
      return { success: false, count: 0, error: 'No valid presets could be parsed from the file.' };
    }

    const merged = [...validatedNewPresets, ...currentPresets];
    persistUserPresets(merged);

    return {
      success: true,
      count: validatedNewPresets.length,
      importedPresets: validatedNewPresets,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      error: err?.message || 'Failed to parse JSON file.',
    };
  }
}
