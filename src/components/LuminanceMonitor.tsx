/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Sun, Activity } from 'lucide-react';
import { Palette, ProcessedImageData } from '../types/palette';
import { getPerceivedBrightness } from '../utils/color';

interface LuminanceMonitorProps {
  processedData: ProcessedImageData | null;
  palette: Palette;
  totalPixels: number;
}

interface PaletteLuminancePoint {
  index: number;
  hexNibble: string;
  name: string;
  hexColor: string;
  lum255: number;
  lumPct: number;
  count: number;
  sharePct: number;
}

export const LuminanceMonitor: React.FC<LuminanceMonitorProps> = ({
  processedData,
  palette,
  totalPixels,
}) => {
  const metrics = useMemo(() => {
    if (!processedData || palette.colors.length === 0) return null;

    let weightedLumSum = 0;
    let countedPixels = 0;
    let paletteLumSum = 0;

    let shadowPixels = 0;
    let midtonePixels = 0;
    let highlightPixels = 0;

    let minActive: PaletteLuminancePoint | null = null;
    let maxActive: PaletteLuminancePoint | null = null;

    const points: PaletteLuminancePoint[] = palette.colors.map((color) => {
      const lum255 = getPerceivedBrightness(color.rgb[0], color.rgb[1], color.rgb[2]);
      const lumPct = (lum255 / 255) * 100;
      const count = processedData.colorCounts[color.index] || 0;
      const sharePct = totalPixels > 0 ? (count / totalPixels) * 100 : 0;

      paletteLumSum += lumPct;
      weightedLumSum += count * lumPct;
      countedPixels += count;

      if (count > 0) {
        if (lumPct < 33.333) {
          shadowPixels += count;
        } else if (lumPct < 66.667) {
          midtonePixels += count;
        } else {
          highlightPixels += count;
        }

        const pt: PaletteLuminancePoint = {
          index: color.index,
          hexNibble: color.hexNibble,
          name: color.name,
          hexColor: color.hexColor,
          lum255,
          lumPct,
          count,
          sharePct,
        };

        if (!minActive || pt.lumPct < minActive.lumPct) minActive = pt;
        if (!maxActive || pt.lumPct > maxActive.lumPct) maxActive = pt;
        return pt;
      }

      return {
        index: color.index,
        hexNibble: color.hexNibble,
        name: color.name,
        hexColor: color.hexColor,
        lum255,
        lumPct,
        count: 0,
        sharePct: 0,
      };
    });

    const denominator = countedPixels > 0 ? countedPixels : Math.max(1, totalPixels);
    const avgLumPct = countedPixels > 0 ? weightedLumSum / denominator : 0;
    const avgLum255 = (avgLumPct / 100) * 255;
    const paletteMeanPct = paletteLumSum / palette.colors.length;
    const deltaFromPalette = avgLumPct - paletteMeanPct;

    const shadowPct = countedPixels > 0 ? (shadowPixels / countedPixels) * 100 : 0;
    const midtonePct = countedPixels > 0 ? (midtonePixels / countedPixels) * 100 : 0;
    const highlightPct = countedPixels > 0 ? (highlightPixels / countedPixels) * 100 : 0;

    let zoneLabel = 'Balanced Midtone';
    let zoneClass = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    if (avgLumPct < 20) {
      zoneLabel = 'Low-Key Dark';
      zoneClass = 'bg-slate-800 text-slate-300 border-slate-700';
    } else if (avgLumPct < 38) {
      zoneLabel = 'Shadow-Biased';
      zoneClass = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    } else if (avgLumPct <= 62) {
      zoneLabel = 'Balanced Midtone';
      zoneClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    } else if (avgLumPct <= 80) {
      zoneLabel = 'Bright / Lift';
      zoneClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    } else {
      zoneLabel = 'High-Key Bright';
      zoneClass = 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40';
    }

    return {
      avgLumPct,
      avgLum255,
      paletteMeanPct,
      deltaFromPalette,
      shadowPct,
      midtonePct,
      highlightPct,
      minActive: minActive as PaletteLuminancePoint | null,
      maxActive: maxActive as PaletteLuminancePoint | null,
      points,
      zoneLabel,
      zoneClass,
    };
  }, [processedData, palette.colors, totalPixels]);

  if (!metrics) return null;

  return (
    <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-4 flex flex-col gap-3.5 shadow-sm">
      {/* Top Header & Primary Readout */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                Output Luminance Monitor
              </h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                <Activity className="w-2.5 h-2.5 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Real-time perceived brightness weighted by active palette ({palette.name})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded border ${metrics.zoneClass}`}
          >
            {metrics.zoneLabel}
          </span>
          <div className="text-right font-mono">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-xl font-bold text-white tabular-nums leading-none">
                {metrics.avgLumPct.toFixed(1)}%
              </span>
              <span className="text-[11px] text-neutral-400 tabular-nums">
                (Y&prime; {Math.round(metrics.avgLum255)}/255)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Luminance Scale Gauge with Palette Swatch Markers */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="relative h-7 flex items-center">
          {/* Linear Luminance Track */}
          <div
            className="w-full h-3.5 rounded-full border border-neutral-700/80 shadow-inner relative overflow-hidden"
            style={{
              background:
                'linear-gradient(90deg, #050507 0%, #2b2b33 25%, #777780 50%, #c4c4cc 75%, #ffffff 100%)',
            }}
          >
            {/* Quarter tick dividers */}
            {[25, 50, 75].map((tick) => (
              <div
                key={tick}
                className="absolute top-0 bottom-0 w-px bg-black/25 pointer-events-none"
                style={{ left: `${tick}%` }}
              />
            ))}
          </div>

          {/* Selected Palette Color Luminance Pins (shows where the 16 colors sit) */}
          {metrics.points.map((pt) => {
            const isUsed = pt.count > 0;
            return (
              <div
                key={pt.index}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border transition-all duration-200 pointer-events-auto ${
                  isUsed
                    ? 'w-2.5 h-2.5 border-white/80 shadow-sm z-10 opacity-95'
                    : 'w-1.5 h-1.5 border-white/25 z-0 opacity-35'
                }`}
                style={{
                  left: `${Math.max(1, Math.min(99, pt.lumPct))}%`,
                  backgroundColor: pt.hexColor,
                }}
                title={`${pt.hexNibble}: ${pt.name} (${pt.hexColor}) — Luminance ${pt.lumPct.toFixed(1)}% · Output share ${pt.sharePct.toFixed(1)}%`}
              />
            );
          })}

          {/* Palette Mean Reference Marker */}
          <div
            className="absolute top-0.5 bottom-0.5 w-0.5 border-l border-dashed border-indigo-400/80 z-10 pointer-events-none"
            style={{ left: `${Math.max(0, Math.min(100, metrics.paletteMeanPct))}%` }}
            title={`Palette baseline mean: ${metrics.paletteMeanPct.toFixed(1)}%`}
          />

          {/* Live Output Average Luminance Needle */}
          <div
            className="absolute top-0 bottom-0 -translate-x-1/2 flex flex-col items-center z-20 transition-all duration-300 ease-out pointer-events-none"
            style={{ left: `${Math.max(0.5, Math.min(99.5, metrics.avgLumPct))}%` }}
          >
            <div className="w-2.5 h-2.5 rotate-45 bg-amber-400 border border-neutral-950 shadow-md -mt-0.5" />
            <div className="w-0.5 flex-1 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          </div>
        </div>

        {/* Scale labels */}
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <span>0% (Black)</span>
          <span>
            Palette Baseline:{' '}
            <strong className="text-indigo-300">{metrics.paletteMeanPct.toFixed(1)}%</strong>{' '}
            <span
              className={
                metrics.deltaFromPalette >= 0 ? 'text-amber-300' : 'text-sky-300'
              }
            >
              ({metrics.deltaFromPalette >= 0 ? '+' : ''}
              {metrics.deltaFromPalette.toFixed(1)}%)
            </span>
          </span>
          <span>100% (White)</span>
        </div>
      </div>

      {/* Tonal Zone Breakdown & Active Luminance Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800/70">
        {/* Shadows / Midtones / Highlights */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-400">Tonal Distribution</span>
            <div className="flex items-center gap-2 text-[10px] tabular-nums">
              <span className="text-slate-300">S: {metrics.shadowPct.toFixed(0)}%</span>
              <span className="text-indigo-300">M: {metrics.midtonePct.toFixed(0)}%</span>
              <span className="text-amber-300">H: {metrics.highlightPct.toFixed(0)}%</span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-900 overflow-hidden flex border border-neutral-800">
            <div
              className="h-full bg-slate-600 transition-all duration-300"
              style={{ width: `${metrics.shadowPct}%` }}
              title={`Shadows (<33% luminance): ${metrics.shadowPct.toFixed(1)}%`}
            />
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${metrics.midtonePct}%` }}
              title={`Midtones (33%–67% luminance): ${metrics.midtonePct.toFixed(1)}%`}
            />
            <div
              className="h-full bg-amber-400 transition-all duration-300"
              style={{ width: `${metrics.highlightPct}%` }}
              title={`Highlights (>67% luminance): ${metrics.highlightPct.toFixed(1)}%`}
            />
          </div>
        </div>

        {/* Active Output Darkest & Brightest Swatches */}
        <div className="flex items-center justify-between gap-2 bg-[#161c2d] border border-neutral-800/80 rounded-lg px-3 py-1.5 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-neutral-400 shrink-0">Darkest:</span>
            {metrics.minActive ? (
              <span className="flex items-center gap-1 text-neutral-200 truncate">
                <span
                  className="w-3 h-3 rounded-sm ring-1 ring-white/20 shrink-0"
                  style={{ backgroundColor: metrics.minActive.hexColor }}
                />
                <span className="font-bold">{metrics.minActive.hexNibble}</span>
                <span className="text-neutral-400 tabular-nums">
                  {metrics.minActive.lumPct.toFixed(0)}%
                </span>
              </span>
            ) : (
              <span className="text-neutral-500">—</span>
            )}
          </div>

          <span className="text-neutral-700">|</span>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-neutral-400 shrink-0">Brightest:</span>
            {metrics.maxActive ? (
              <span className="flex items-center gap-1 text-neutral-200 truncate">
                <span
                  className="w-3 h-3 rounded-sm ring-1 ring-white/20 shrink-0"
                  style={{ backgroundColor: metrics.maxActive.hexColor }}
                />
                <span className="font-bold">{metrics.maxActive.hexNibble}</span>
                <span className="text-neutral-400 tabular-nums">
                  {metrics.maxActive.lumPct.toFixed(0)}%
                </span>
              </span>
            ) : (
              <span className="text-neutral-500">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
