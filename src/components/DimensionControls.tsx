/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FitMode, ResampleFilter } from '../types/palette';
import { Link2, Unlink, Maximize2, Crop } from 'lucide-react';

interface DimensionControlsProps {
  width: number;
  height: number;
  onWidthChange: (w: number) => void;
  onHeightChange: (h: number) => void;
  lockAspectRatio: boolean;
  onToggleLockAspectRatio: () => void;
  fitMode: FitMode;
  onFitModeChange: (m: FitMode) => void;
  resampleFilter: ResampleFilter;
  onResampleFilterChange: (f: ResampleFilter) => void;
  originalWidth: number;
  originalHeight: number;
}

export const DimensionControls: React.FC<DimensionControlsProps> = ({
  width,
  height,
  onWidthChange,
  onHeightChange,
  lockAspectRatio,
  onToggleLockAspectRatio,
  fitMode,
  onFitModeChange,
  resampleFilter,
  onResampleFilterChange,
  originalWidth,
  originalHeight,
}) => {
  const PRESETS = [
    { label: '16×16', w: 16, h: 16, desc: 'Sprite' },
    { label: '32×32', w: 32, h: 32, desc: 'Tile' },
    { label: '64×64', w: 64, h: 64, desc: 'Retro Avatar' },
    { label: '80×50', w: 80, h: 50, desc: 'DOS Text Mode' },
    { label: '160×100', w: 160, h: 100, desc: 'CGA 160×100' },
    { label: '320×200', w: 320, h: 200, desc: 'EGA Mode 0Dh' },
    { label: '640×350', w: 640, h: 350, desc: 'EGA Mode 10h' },
    { label: '640×480', w: 640, h: 480, desc: 'VGA Mode 12h (16-Color)' },
  ];

  const applyPreset = (presetW: number, presetH: number) => {
    onWidthChange(presetW);
    onHeightChange(presetH);
  };

  const applyOriginalDimensions = () => {
    // Cap at 640x480 for smooth real-time web dithering performance
    let w = originalWidth;
    let h = originalHeight;
    const maxDim = 640;
    if (w > maxDim || h > maxDim) {
      if (w >= h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    onWidthChange(w);
    onHeightChange(h);
  };

  return (
    <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-4 flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Resolution & Dimensions</span>
        </h3>
        <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
          Total: {(width * height).toLocaleString()} px
        </span>
      </div>

      {/* Width and Height input row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[11px] text-neutral-400">Width (px / chars)</label>
          <div className="relative">
            <input
              type="number"
              min={8}
              max={1024}
              value={width}
              onChange={(e) => {
                const val = Math.max(8, Math.min(1024, parseInt(e.target.value) || 8));
                onWidthChange(val);
                if (lockAspectRatio && originalWidth > 0 && originalHeight > 0) {
                  const proportionalH = Math.round((val * originalHeight) / originalWidth);
                  onHeightChange(Math.max(8, Math.min(1024, proportionalH)));
                }
              }}
              className="w-full bg-[#1a2035] text-neutral-100 font-mono text-sm rounded-lg px-3 py-1.5 border border-neutral-700/80 focus:border-indigo-500 focus:outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500">
              W
            </span>
          </div>
        </div>

        {/* Lock aspect ratio button */}
        <div className="pt-5 flex items-center justify-center">
          <button
            type="button"
            onClick={onToggleLockAspectRatio}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              lockAspectRatio
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                : 'bg-[#1a2035] border-neutral-700 text-neutral-400 hover:text-neutral-200'
            }`}
            title={lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
          >
            {lockAspectRatio ? <Link2 className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[11px] text-neutral-400">Height (lines)</label>
          <div className="relative">
            <input
              type="number"
              min={8}
              max={1024}
              value={height}
              onChange={(e) => {
                const val = Math.max(8, Math.min(1024, parseInt(e.target.value) || 8));
                onHeightChange(val);
                if (lockAspectRatio && originalWidth > 0 && originalHeight > 0) {
                  const proportionalW = Math.round((val * originalWidth) / originalHeight);
                  onWidthChange(Math.max(8, Math.min(1024, proportionalW)));
                }
              }}
              className="w-full bg-[#1a2035] text-neutral-100 font-mono text-sm rounded-lg px-3 py-1.5 border border-neutral-700/80 focus:border-indigo-500 focus:outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500">
              H
            </span>
          </div>
        </div>
      </div>

      {/* Preset dimension buttons */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-neutral-400">Retro Presets:</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const isActive = width === p.w && height === p.h;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p.w, p.h)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-[#181e30] text-neutral-300 border-neutral-700/60 hover:bg-[#202840]'
                }`}
                title={p.desc}
              >
                {p.label}
              </button>
            );
          })}
          {originalWidth > 0 && (
            <button
              type="button"
              onClick={applyOriginalDimensions}
              className="px-2.5 py-1 text-[11px] font-mono rounded-md border bg-[#181e30] text-neutral-300 border-neutral-700/60 hover:bg-[#202840] transition-colors cursor-pointer"
              title={`Match image aspect (${originalWidth}×${originalHeight})`}
            >
              Fit Source
            </button>
          )}
        </div>
      </div>

      {/* Fit & Resample selector */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/60">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-neutral-400">Fit Mode</label>
          <select
            value={fitMode}
            onChange={(e) => onFitModeChange(e.target.value as FitMode)}
            className="bg-[#1a2035] text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 border border-neutral-700/80 focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="contain">Contain (Letterbox)</option>
            <option value="cover">Cover (Crop)</option>
            <option value="stretch">Stretch (Exact)</option>
            <option value="center-crop">Center Crop</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-neutral-400">Resample Filter</label>
          <select
            value={resampleFilter}
            onChange={(e) => onResampleFilterChange(e.target.value as ResampleFilter)}
            className="bg-[#1a2035] text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 border border-neutral-700/80 focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="nearest">Nearest (Crisp Pixel)</option>
            <option value="bilinear">Bilinear (Smooth)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
