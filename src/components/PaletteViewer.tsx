/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Palette, PaletteColor } from '../types/palette';
import { ALL_PALETTES, hexToRgb } from '../data/palettes';
import { Edit3, RotateCcw, Check, Sparkles } from 'lucide-react';

interface PaletteViewerProps {
  currentPalette: Palette;
  onSelectPalette: (palette: Palette) => void;
  onUpdateCustomColor: (index: number, newHex: string, newName?: string) => void;
  colorCounts?: Record<number, number>;
  totalPixels?: number;
  isCustomPalette: boolean;
  onResetCustomPalette: () => void;
}

export const PaletteViewer: React.FC<PaletteViewerProps> = ({
  currentPalette,
  onSelectPalette,
  onUpdateCustomColor,
  colorCounts = {},
  totalPixels = 1,
  isCustomPalette,
  onResetCustomPalette,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  return (
    <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-4 flex flex-col gap-3.5">
      {/* Palette selector & meta */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="palette-select" className="text-xs font-semibold text-neutral-300">
            Active 16-Color Palette:
          </label>
          <select
            id="palette-select"
            value={currentPalette.id}
            onChange={(e) => {
              const pal = ALL_PALETTES.find((p) => p.id === e.target.value);
              if (pal) onSelectPalette(pal);
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
              if (grayPal) onSelectPalette(grayPal);
            }}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
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
              const egaPal = ALL_PALETTES.find((p) => p.id === 'ega-standard');
              if (egaPal) onSelectPalette(egaPal);
            }}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
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
              onClick={onResetCustomPalette}
              className="flex items-center gap-1.5 px-2.5 py-1 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded text-xs transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 px-2.5 py-1 text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded text-xs transition-colors cursor-pointer"
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

      {/* 16 Swatches 0 through F in a crisp 2-row grid of 8 */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {currentPalette.colors.map((c) => {
          const count = colorCounts[c.index] || 0;
          const percentage = totalPixels > 0 ? ((count / totalPixels) * 100).toFixed(1) : '0.0';
          const isUsed = count > 0;

          // Determine foreground text contrast against swatch
          const [r, g, b] = c.rgb;
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const textContrast = luminance > 0.5 ? 'text-black' : 'text-white';

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
                className="w-full h-8 rounded relative flex items-center justify-center shadow-inner cursor-pointer"
                style={{ backgroundColor: c.hexColor }}
                title={`${c.name} (${c.hexColor}) - Click to inspect or customize`}
                onClick={() => {
                  if (isCustomPalette) {
                    setEditingIndex(c.index);
                  }
                }}
              >
                <span
                  className={`font-mono font-bold text-xs ${textContrast} drop-shadow-sm select-none px-1 rounded bg-black/20`}
                >
                  {c.hexNibble}
                </span>

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
                  <span className="text-neutral-500">{c.hexNibble}</span>
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
