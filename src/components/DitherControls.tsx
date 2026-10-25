/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ColorMetric, DitherAlgorithm, ImageAdjustments } from '../types/palette';
import { Sliders, Eye, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface DitherControlsProps {
  algorithm: DitherAlgorithm;
  onAlgorithmChange: (a: DitherAlgorithm) => void;
  intensity: number;
  onIntensityChange: (i: number) => void;
  colorMetric: ColorMetric;
  onColorMetricChange: (m: ColorMetric) => void;
  adjustments: ImageAdjustments;
  onAdjustmentsChange: (adj: ImageAdjustments) => void;
  onResetAdjustments: () => void;
}

export const DitherControls: React.FC<DitherControlsProps> = ({
  algorithm,
  onAlgorithmChange,
  intensity,
  onIntensityChange,
  colorMetric,
  onColorMetricChange,
  adjustments,
  onAdjustmentsChange,
  onResetAdjustments,
}) => {
  const [showAdjustments, setShowAdjustments] = useState(false);

  const ALGORITHMS: { id: DitherAlgorithm; name: string; category: string }[] = [
    { id: 'none', name: 'None (Threshold / Nearest)', category: 'Direct' },
    { id: 'floyd-steinberg', name: 'Floyd-Steinberg (Classic)', category: 'Error Diffusion' },
    { id: 'atkinson', name: 'Atkinson (Vintage Mac / Sharp)', category: 'Error Diffusion' },
    { id: 'jarvis', name: 'Jarvis, Judice & Ninke', category: 'Error Diffusion' },
    { id: 'stucki', name: 'Stucki (Clean Edges)', category: 'Error Diffusion' },
    { id: 'burkes', name: 'Burkes (Fast)', category: 'Error Diffusion' },
    { id: 'sierra-lite', name: 'Sierra Lite', category: 'Error Diffusion' },
    { id: 'sierra-3', name: 'Sierra 3', category: 'Error Diffusion' },
    { id: 'bayer-2', name: 'Bayer 2×2 (Ordered Grid)', category: 'Ordered Dithering' },
    { id: 'bayer-4', name: 'Bayer 4×4 (Classic Crosshatch)', category: 'Ordered Dithering' },
    { id: 'bayer-8', name: 'Bayer 8×8 (Fine Stipple)', category: 'Ordered Dithering' },
  ];

  return (
    <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-4 flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dithering & Color Engine</span>
        </h3>
        <span className="text-[11px] font-mono text-neutral-400">4-Bit Quantizer</span>
      </div>

      {/* Algorithm selector */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-neutral-400">Dithering Algorithm</label>
        <select
          value={algorithm}
          onChange={(e) => onAlgorithmChange(e.target.value as DitherAlgorithm)}
          className="bg-[#1a2035] text-neutral-100 text-xs rounded-lg px-3 py-2 border border-neutral-700/80 focus:border-indigo-500 focus:outline-none cursor-pointer font-medium"
        >
          <optgroup label="Direct Quantization">
            {ALGORITHMS.filter((a) => a.category === 'Direct').map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Error Diffusion">
            {ALGORITHMS.filter((a) => a.category === 'Error Diffusion').map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Ordered (Bayer)">
            {ALGORITHMS.filter((a) => a.category === 'Ordered Dithering').map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Dithering intensity slider */}
      {algorithm !== 'none' && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Dither Diffusion Intensity</span>
            <span className="font-mono text-indigo-400 font-semibold tabular-nums">
              {Math.round(intensity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={intensity}
            onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-[#1a2035] rounded-lg cursor-pointer"
          />
        </div>
      )}

      {/* Color match metric */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-neutral-400 flex items-center gap-1">
          <Eye className="w-3 h-3 text-neutral-400" />
          <span>Color Distance Metric</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'perceptual', label: 'Perceptual', desc: 'Human Eye Weighted' },
            { id: 'cielab', label: 'CIELAB ΔE', desc: 'L*a*b* Perceptual' },
            { id: 'euclidean', label: 'Euclidean', desc: 'Raw RGB Distance' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onColorMetricChange(m.id as ColorMetric)}
              className={`py-1.5 px-2 text-[11px] rounded-lg border text-center transition-all cursor-pointer ${
                colorMetric === m.id
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-medium'
                  : 'bg-[#181e30] border-neutral-700/60 text-neutral-400 hover:text-neutral-200'
              }`}
              title={m.desc}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pre-Processing adjustments accordion */}
      <div className="border-t border-neutral-800/80 pt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowAdjustments(!showAdjustments)}
          className="flex items-center justify-between text-xs font-medium text-neutral-300 hover:text-white py-1 transition-colors cursor-pointer"
        >
          <span>Image Pre-Adjustments</span>
          {showAdjustments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdjustments && (
          <div className="flex flex-col gap-3 p-3 bg-[#161c2d] rounded-lg border border-neutral-700/60 text-xs">
            {/* Contrast */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-400">Contrast</span>
                <span className="font-mono text-neutral-300">{adjustments.contrast}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={adjustments.contrast}
                onChange={(e) =>
                  onAdjustmentsChange({ ...adjustments, contrast: parseInt(e.target.value) })
                }
                className="accent-indigo-500 h-1 bg-[#1a2035] rounded cursor-pointer"
              />
            </div>

            {/* Brightness */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-400">Brightness</span>
                <span className="font-mono text-neutral-300">{adjustments.brightness}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={adjustments.brightness}
                onChange={(e) =>
                  onAdjustmentsChange({ ...adjustments, brightness: parseInt(e.target.value) })
                }
                className="accent-indigo-500 h-1 bg-[#1a2035] rounded cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-400">Saturation</span>
                <span className="font-mono text-neutral-300">{adjustments.saturation}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={adjustments.saturation}
                onChange={(e) =>
                  onAdjustmentsChange({ ...adjustments, saturation: parseInt(e.target.value) })
                }
                className="accent-indigo-500 h-1 bg-[#1a2035] rounded cursor-pointer"
              />
            </div>

            {/* Gamma */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-400">Gamma</span>
                <span className="font-mono text-neutral-300">{adjustments.gamma.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.05"
                value={adjustments.gamma}
                onChange={(e) =>
                  onAdjustmentsChange({ ...adjustments, gamma: parseFloat(e.target.value) })
                }
                className="accent-indigo-500 h-1 bg-[#1a2035] rounded cursor-pointer"
              />
            </div>

            {/* Sharpness */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-400">Sharpness</span>
                <span className="font-mono text-neutral-300">{adjustments.sharpness.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="0.2"
                value={adjustments.sharpness}
                onChange={(e) =>
                  onAdjustmentsChange({ ...adjustments, sharpness: parseFloat(e.target.value) })
                }
                className="accent-indigo-500 h-1 bg-[#1a2035] rounded cursor-pointer"
              />
            </div>

            {/* Invert & Reset */}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-750">
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-neutral-300">
                <input
                  type="checkbox"
                  checked={adjustments.invert}
                  onChange={(e) =>
                    onAdjustmentsChange({ ...adjustments, invert: e.target.checked })
                  }
                  className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
                />
                <span>Invert Colors</span>
              </label>

              <button
                type="button"
                onClick={onResetAdjustments}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
