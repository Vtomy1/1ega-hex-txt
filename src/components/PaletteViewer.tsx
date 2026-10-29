/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Palette, PaletteColor } from '../types/palette';
import { ALL_PALETTES } from '../data/palettes';
import {
  PaletteSortCriteria,
  SortDirection,
  sortPaletteColors,
  getPerceivedBrightness,
  rgbToHsl,
} from '../utils/color';
import {
  Edit3,
  RotateCcw,
  Check,
  ArrowUpDown,
  SunMedium,
  Compass,
  Hash,
  ListOrdered,
  Sparkles,
} from 'lucide-react';

interface PaletteViewerProps {
  currentPalette: Palette;
  onSelectPalette: (palette: Palette) => void;
  onUpdateCustomColor: (index: number, newHex: string, newName?: string) => void;
  onReorderCustomColors?: (newColors: PaletteColor[]) => void;
  colorCounts?: Record<number, number>;
  totalPixels?: number;
  isCustomPalette: boolean;
  onResetCustomPalette: () => void;
}

export const PaletteViewer: React.FC<PaletteViewerProps> = ({
  currentPalette,
  onSelectPalette,
  onUpdateCustomColor,
  onReorderCustomColors,
  colorCounts = {},
  totalPixels = 1,
  isCustomPalette,
  onResetCustomPalette,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<PaletteSortCriteria>('index');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Compute sorted array of colors
  const sortedColors = useMemo(() => {
    return sortPaletteColors(currentPalette.colors, sortBy, sortDir);
  }, [currentPalette.colors, sortBy, sortDir]);

  // Handle organizing custom 0-F slots into the currently sorted order
  const handleApplySortToSlots = () => {
    if (!onReorderCustomColors) return;

    onReorderCustomColors(sortedColors);
    setSortBy('index');
    setSortDir('asc');
    setAppliedFeedback('Colors reordered into 4-bit slots 0 to F');
    setTimeout(() => setAppliedFeedback(null), 2800);
  };

  const getSortDirLabel = () => {
    if (sortBy === 'brightness') {
      return sortDir === 'asc' ? 'Dark → Light' : 'Light → Dark';
    }
    if (sortBy === 'hue') {
      return sortDir === 'asc' ? '0° → 360°' : '360° → 0°';
    }
    if (sortBy === 'hex') {
      return sortDir === 'asc' ? 'Low → High' : 'High → Low';
    }
    return sortDir === 'asc' ? '0 → F' : 'F → 0';
  };

  return (
    <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-4 flex flex-col gap-3.5">
      {/* Palette selector & preset actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="palette-select" className="text-xs font-semibold text-neutral-300 whitespace-nowrap">
            Active 16-Color Palette:
          </label>
          <select
            id="palette-select"
            value={currentPalette.id}
            onChange={(e) => {
              const pal = ALL_PALETTES.find((p) => p.id === e.target.value);
              if (pal) {
                onSelectPalette(pal);
                setSortBy('index');
                setSortDir('asc');
              }
            }}
            className="bg-[#1a2035] text-neutral-200 text-xs rounded-lg px-3 py-1.5 border border-neutral-700/80 focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <optgroup label="Standard 4-Bit Hardware">
              {ALL_PALETTES.filter((p) => p.category === 'Classic Hardware').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Canonical 0-F)
                </option>
              ))}
            </optgroup>
            <optgroup label="Monochrome & Grayscale">
              {ALL_PALETTES.filter((p) => p.category === 'Monochrome & Grayscale').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Retro Computers">
              {ALL_PALETTES.filter((p) => p.category === 'Retro Computers').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Modern Retro & Synthetics">
              {ALL_PALETTES.filter((p) => p.category === 'Modern Retro').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Consoles">
              {ALL_PALETTES.filter((p) => p.category === 'Consoles').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            {isCustomPalette && (
              <option value="custom">★ Custom User Palette (Editable 0-F)</option>
            )}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Quick Grayscale / EGA toggles */}
          <button
            onClick={() => {
              const grayPal = ALL_PALETTES.find((p) => p.id === 'grayscale-16');
              if (grayPal) {
                onSelectPalette(grayPal);
                setSortBy('index');
              }
            }}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border whitespace-nowrap ${
              currentPalette.id === 'grayscale-16' && !isCustomPalette
                ? 'bg-white text-black font-semibold border-white shadow-sm'
                : 'text-neutral-300 hover:text-white bg-[#1a2035] border-neutral-700/80 hover:bg-[#252e4c]'
            }`}
            title="Switch to 16-Level Linear Grayscale Palette (0-F)"
          >
            16 Grayscale
          </button>

          <button
            onClick={() => {
              const cgaPal = ALL_PALETTES.find((p) => p.id === 'cga-mode4-cyan');
              if (cgaPal) {
                onSelectPalette(cgaPal);
                setSortBy('index');
              }
            }}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border whitespace-nowrap ${
              currentPalette.id === 'cga-mode4-cyan' && !isCustomPalette
                ? 'bg-cyan-500 text-black font-semibold border-cyan-400 shadow-sm'
                : 'text-neutral-300 hover:text-white bg-[#1a2035] border-neutral-700/80 hover:bg-[#252e4c]'
            }`}
            title="Switch to Iconic DOS CGA Mode 4 (Cyan / Magenta / White / Black)"
          >
            CGA Cyan/Mag
          </button>

          <button
            onClick={() => {
              const egaPal = ALL_PALETTES.find((p) => p.id === 'ega-standard');
              if (egaPal) {
                onSelectPalette(egaPal);
                setSortBy('index');
              }
            }}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border whitespace-nowrap ${
              currentPalette.id === 'ega-standard' && !isCustomPalette
                ? 'bg-indigo-600 text-white font-semibold border-indigo-500 shadow-sm'
                : 'text-neutral-300 hover:text-white bg-[#1a2035] border-neutral-700/80 hover:bg-[#252e4c]'
            }`}
            title="Switch to Standard 16-Color IBM EGA Palette (0-F)"
          >
            IBM EGA
          </button>

          {isCustomPalette ? (
            <button
              onClick={() => {
                onResetCustomPalette();
                setSortBy('index');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded text-xs transition-colors cursor-pointer whitespace-nowrap"
              title="Reset custom palette to IBM EGA colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onUpdateCustomColor(0, currentPalette.colors[0].hexColor);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded text-xs transition-colors cursor-pointer whitespace-nowrap"
              title="Customize these 16 colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Customize</span>
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-neutral-400 line-clamp-1 leading-relaxed">
        {currentPalette.description}
      </p>

      {/* Sorting & Organizing Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-t border-neutral-800/60">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-neutral-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sort Swatches:</span>
          </span>

          {/* Sort Criteria Segmented Control */}
          <div className="flex items-center bg-[#181e30] p-0.5 rounded-lg border border-neutral-700/80">
            <button
              type="button"
              onClick={() => setSortBy('index')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                sortBy === 'index'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Sort by 4-bit slot index (0 to F)"
            >
              <ListOrdered className="w-3 h-3" />
              <span>0-F Default</span>
            </button>

            <button
              type="button"
              onClick={() => setSortBy('brightness')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                sortBy === 'brightness'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Sort by perceived photometric luminance"
            >
              <SunMedium className="w-3 h-3" />
              <span>Brightness</span>
            </button>

            <button
              type="button"
              onClick={() => setSortBy('hue')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                sortBy === 'hue'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Sort by color wheel hue angle (0° to 360°)"
            >
              <Compass className="w-3 h-3" />
              <span>Hue</span>
            </button>

            <button
              type="button"
              onClick={() => setSortBy('hex')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                sortBy === 'hex'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Sort by RGB hex value (#000000 to #FFFFFF)"
            >
              <Hash className="w-3 h-3" />
              <span>Hex Value</span>
            </button>
          </div>

          {/* Direction toggle button */}
          <button
            type="button"
            onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a2035] hover:bg-[#242c48] text-neutral-300 hover:text-white border border-neutral-700/80 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap"
            title="Toggle ascending / descending order"
          >
            <span>{getSortDirLabel()}</span>
          </button>
        </div>

        {/* Action: Re-organize slots 0-F into this sorted order */}
        <div className="flex items-center gap-2">
          {appliedFeedback && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{appliedFeedback}</span>
            </span>
          )}

          {sortBy !== 'index' && onReorderCustomColors && (
            <button
              type="button"
              onClick={handleApplySortToSlots}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer whitespace-nowrap"
              title="Apply this sorted sequence to slots 0 through F in the custom palette"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Sort to 0-F Slots</span>
            </button>
          )}
        </div>
      </div>

      {/* 16 Swatches 0 through F in a crisp 2-row grid of 8 */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {sortedColors.map((c, sortedIdx) => {
          const count = colorCounts[c.index] || 0;
          const percentage = totalPixels > 0 ? ((count / totalPixels) * 100).toFixed(1) : '0.0';
          const isUsed = count > 0;

          // Determine foreground text contrast against swatch
          const [r, g, b] = c.rgb;
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const textContrast = luminance > 0.5 ? 'text-black' : 'text-white';

          // Compute contextual sort metric tag
          let sortMetricText = '';
          if (sortBy === 'brightness') {
            const briPct = Math.round(luminance * 100);
            sortMetricText = `Bri ${briPct}%`;
          } else if (sortBy === 'hue') {
            const { h, s } = rgbToHsl(r, g, b);
            sortMetricText = s < 0.08 ? 'Mono' : `${Math.round(h)}°`;
          } else if (sortBy === 'hex') {
            sortMetricText = c.hexColor;
          }

          return (
            <div
              key={c.index}
              className={`group relative rounded-lg border transition-all ${
                isUsed
                  ? 'border-neutral-700/80 bg-[#161c2d]'
                  : 'border-neutral-800/40 bg-[#111420] opacity-60'
              } p-1.5 flex flex-col gap-1.5`}
            >
              {/* Swatch block with nibble overlay */}
              <div
                className="w-full h-8 rounded relative flex items-center justify-between px-1.5 shadow-inner cursor-pointer"
                style={{ backgroundColor: c.hexColor }}
                title={`${c.name} (${c.hexColor}) - Slot ${c.hexNibble} (Index ${c.index}) - Click to inspect or customize`}
                onClick={() => {
                  if (isCustomPalette) {
                    setEditingIndex(c.index);
                  }
                }}
              >
                {/* 4-bit slot nibble identifier */}
                <span
                  className={`font-mono font-bold text-xs ${textContrast} drop-shadow-sm select-none px-1 rounded bg-black/25`}
                  title={`4-bit Slot Nibble: ${c.hexNibble}`}
                >
                  {c.hexNibble}
                </span>

                {/* Sorted order position indicator when sorted */}
                {sortBy !== 'index' && (
                  <span
                    className={`font-mono text-[9px] ${textContrast} select-none opacity-80 px-0.5 rounded bg-black/20`}
                    title={`Sorted Position #${sortedIdx + 1}`}
                  >
                    #{sortedIdx + 1}
                  </span>
                )}

                {isCustomPalette && (
                  <input
                    type="color"
                    value={c.hexColor}
                    onChange={(e) => onUpdateCustomColor(c.index, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title={`Change color for Hex ${c.hexNibble}`}
                  />
                )}
              </div>

              {/* Color details */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-[11px] font-mono leading-none">
                  <span className="text-neutral-300 font-semibold">{c.hexColor}</span>
                  {sortBy !== 'index' && sortMetricText ? (
                    <span className="text-indigo-400 text-[10px] tabular-nums" title={`Sort value: ${sortMetricText}`}>
                      {sortMetricText}
                    </span>
                  ) : (
                    <span className="text-neutral-500">{c.hexNibble}</span>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400 truncate mt-0.5 leading-tight" title={c.name}>
                  {c.name}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 tabular-nums mt-0.5">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
