/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ALL_PALETTES } from '../data/palettes';
import { Palette } from '../types/palette';
import { Check, ArrowRight } from 'lucide-react';

interface PalettesGuideProps {
  currentPalette: Palette;
  onSelectPalette: (palette: Palette) => void;
  onGoToConverter: () => void;
}

export const PalettesGuide: React.FC<PalettesGuideProps> = ({
  currentPalette,
  onSelectPalette,
  onGoToConverter,
}) => {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 py-6 px-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          <span>Palette Repository</span>
          <span className="text-neutral-600">·</span>
          <span>4-Bit (16 Colors) Canonical Standards</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Retro 16-Color & EGA Palettes
        </h1>
        <p className="text-sm text-neutral-400 max-w-3xl leading-relaxed">
          The Enhanced Graphics Adapter (EGA) standard introduced in 1984 established the 16-color 4-bit standard in personal computing. Explore the official IBM BIOS color assignments alongside iconic 8-bit and 16-bit computer palettes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ALL_PALETTES.map((pal) => {
          const isSelected = currentPalette.id === pal.id;

          return (
            <div
              key={pal.id}
              className={`rounded-xl border p-5 transition-all flex flex-col justify-between gap-4 ${
                isSelected
                  ? 'bg-[#151c2f] border-indigo-500 ring-1 ring-indigo-500/50'
                  : 'bg-[#121624] border-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{pal.name}</h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-750">
                      {pal.category}
                    </span>
                  </div>

                  {isSelected ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        onSelectPalette(pal);
                        onGoToConverter();
                      }}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Use Palette</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">{pal.description}</p>
              </div>

              {/* 16 Color Swatches */}
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800/60">
                <div className="grid grid-cols-8 gap-1.5">
                  {pal.colors.map((c) => {
                    const [r, g, b] = c.rgb;
                    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    const textColor = lum > 0.5 ? 'text-black' : 'text-white';

                    return (
                      <div
                        key={c.index}
                        className="group relative flex flex-col items-center"
                        title={`${c.hexNibble}: ${c.name} (${c.hexColor})`}
                      >
                        <div
                          className="w-full h-7 rounded shadow-inner flex items-center justify-center font-mono font-bold text-[11px]"
                          style={{ backgroundColor: c.hexColor }}
                        >
                          <span className={`${textColor} drop-shadow-sm`}>{c.hexNibble}</span>
                        </div>
                        <span className="text-[9px] font-mono text-neutral-500 mt-1 truncate max-w-full">
                          {c.hexColor.slice(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
