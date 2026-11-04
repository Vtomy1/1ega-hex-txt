/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Upload, Sparkles, Layers, Wand2, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { QuickFilterType } from '../types/palette';
import { QUICK_FILTERS } from '../utils/filter';

interface SampleItem {
  id: string;
  name: string;
  url: string;
  tag: string;
}

const SAMPLES: SampleItem[] = [
  {
    id: 'hero',
    name: 'Cyberpunk Hero',
    url: '/src/assets/images/sample_pixel_hero_1792891947606.jpg',
    tag: '1:1 Portrait',
  },
  {
    id: 'scenery',
    name: 'Sunset Lake & Pines',
    url: '/src/assets/images/sample_retro_scenery_1792891948685.jpg',
    tag: '4:3 Scenery',
  },
  {
    id: 'arcade',
    name: 'Synth Console',
    url: '/src/assets/images/sample_arcade_scene_1792891949358.jpg',
    tag: '16:9 Arcade',
  },
];

interface ImageSourceSelectorProps {
  onLoadImage: (imgUrl: string) => void;
  activeSampleId?: string;
  onOpenBatch?: () => void;
  activeFilter?: QuickFilterType;
  onFilterChange?: (filter: QuickFilterType) => void;
  filterStrength?: number;
  onFilterStrengthChange?: (strength: number) => void;
}

export const ImageSourceSelector: React.FC<ImageSourceSelectorProps> = ({
  onLoadImage,
  activeSampleId,
  onOpenBatch,
  activeFilter = 'none',
  onFilterChange,
  filterStrength = 1.0,
  onFilterStrengthChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onLoadImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onLoadImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentFilterPreset = QUICK_FILTERS.find((f) => f.id === activeFilter) || QUICK_FILTERS[0];

  return (
    <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-3.5 flex flex-col gap-3 shadow-sm">
      {/* Top Row: File Upload, Batch Mode, Paste Hint, and Preset Samples */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800/70"
      >
        {/* Upload button & drop instructions */}
        <div className="flex items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1e253b] hover:bg-[#283250] text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Image</span>
          </button>

          {onOpenBatch && (
            <button
              onClick={onOpenBatch}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#171e33] hover:bg-[#202947] text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Batch process multiple images at once"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Batch Mode</span>
            </button>
          )}

          <span className="hidden sm:inline text-[11px] text-neutral-400">
            Drop image or paste (<kbd className="font-mono text-neutral-300">Ctrl+V</kbd>)
          </span>
        </div>

        {/* Preset sample images */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Samples:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {SAMPLES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => onLoadImage(sample.url)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                  activeSampleId === sample.id
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-[#181e30] border-neutral-700/60 text-neutral-300 hover:text-white hover:bg-[#202840]'
                }`}
                title={`Load ${sample.name} (${sample.tag})`}
              >
                <img
                  src={sample.url}
                  alt={sample.name}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded object-cover"
                />
                <span className="truncate max-w-[80px] sm:max-w-none">{sample.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Filters Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300">
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quick Filters</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hidden sm:inline">
              Pre-conversion Presets
            </span>
          </div>

          {/* Right controls: Active status, strength slider, and reset button */}
          <div className="flex items-center gap-3">
            {activeFilter !== 'none' && onFilterStrengthChange && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-neutral-500" />
                  <span className="hidden sm:inline">Intensity:</span>
                </span>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={filterStrength}
                  onChange={(e) => onFilterStrengthChange(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 accent-indigo-500 h-1.5 cursor-pointer"
                  title={`Filter strength: ${Math.round(filterStrength * 100)}%`}
                />
                <span className="font-mono text-[11px] text-indigo-300 w-8 tabular-nums">
                  {Math.round(filterStrength * 100)}%
                </span>
              </div>
            )}

            {activeFilter !== 'none' && onFilterChange && (
              <button
                onClick={() => onFilterChange('none')}
                className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer py-0.5 px-1.5 rounded hover:bg-neutral-800"
                title="Reset to Original (no filter)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Presets Button Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-neutral-800">
          {QUICK_FILTERS.map((preset) => {
            const isSelected = activeFilter === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onFilterChange?.(preset.id)}
                className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40'
                    : 'bg-[#161c2d] border-neutral-700/60 text-neutral-300 hover:text-white hover:bg-[#1d253b] hover:border-neutral-600'
                }`}
                title={`${preset.name}: ${preset.description}`}
              >
                {/* Visual indicator gradient swatch */}
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${preset.iconBg} ring-1 ring-white/20 shrink-0 shadow-inner group-hover:scale-105 transition-transform`}
                />
                <span className="leading-none">{preset.name}</span>
                {preset.tag && !isSelected && (
                  <span className="text-[9px] font-mono text-neutral-400 opacity-70 group-hover:opacity-100">
                    {preset.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Informative Sub-bar */}
        <div className="text-[11px] text-neutral-400 flex items-center justify-between gap-2 pt-0.5">
          <p className="truncate">
            <span className="text-neutral-300 font-medium">{currentFilterPreset.name}:</span>{' '}
            <span>{currentFilterPreset.description}</span>
          </p>
          <span className="font-mono text-[10px] text-neutral-400 shrink-0 hidden md:inline">
            Applies to source before 4-bit error diffusion
          </span>
        </div>
      </div>
    </div>
  );
};
