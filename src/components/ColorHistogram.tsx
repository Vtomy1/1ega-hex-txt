/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Palette, ProcessedImageData } from '../types/palette';
import { BarChart3, ArrowDownWideNarrow, ListOrdered, Sparkles } from 'lucide-react';

interface ColorHistogramProps {
  processedData: ProcessedImageData | null;
  palette: Palette;
  totalPixels: number;
}

interface HistogramEntry {
  nibble: string;
  index: number;
  name: string;
  hexColor: string;
  count: number;
  percentage: number;
  rgb: [number, number, number];
}

export const ColorHistogram: React.FC<ColorHistogramProps> = ({
  processedData,
  palette,
  totalPixels,
}) => {
  const [metricType, setMetricType] = useState<'count' | 'percentage'>('percentage');
  const [sortOrder, setSortOrder] = useState<'nibble' | 'frequency'>('nibble');

  // Prepare chart data for all 16 colors (0 to F)
  const chartData = useMemo<HistogramEntry[]>(() => {
    if (!processedData) return [];

    const entries: HistogramEntry[] = palette.colors.map((c) => {
      const count = processedData.colorCounts[c.index] || 0;
      const percentage = totalPixels > 0 ? (count / totalPixels) * 100 : 0;
      return {
        nibble: c.hexNibble,
        index: c.index,
        name: c.name,
        hexColor: c.hexColor,
        count,
        percentage: Number(percentage.toFixed(2)),
        rgb: c.rgb,
      };
    });

    if (sortOrder === 'frequency') {
      return [...entries].sort((a, b) => b.count - a.count);
    }
    return entries;
  }, [processedData, palette.colors, totalPixels, sortOrder]);

  // Derived metrics
  const stats = useMemo(() => {
    if (!chartData.length || totalPixels === 0) return null;

    const usedColors = chartData.filter((d) => d.count > 0);
    const sortedByCount = [...chartData].sort((a, b) => b.count - a.count);
    const dominant = sortedByCount[0];
    const leastUsed = usedColors.length > 0 ? [...usedColors].sort((a, b) => a.count - b.count)[0] : null;

    return {
      usedCount: usedColors.length,
      dominant,
      leastUsed,
      usedPercentage: ((usedColors.length / 16) * 100).toFixed(0),
    };
  }, [chartData, totalPixels]);

  if (!processedData) return null;

  return (
    <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-4 flex flex-col gap-4">
      {/* Header with Title and View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
              4-Bit Color Distribution Histogram (0–F)
            </h3>
            <p className="text-[11px] text-neutral-400">
              Pixel frequency across the 16 palette nibbles
            </p>
          </div>
        </div>

        {/* Segmented Controls for Metric and Sort Order */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Metric Selector: Percentage vs Count */}
          <div className="flex items-center bg-[#181e30] p-0.5 rounded-lg border border-neutral-700/80">
            <button
              onClick={() => setMetricType('percentage')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                metricType === 'percentage'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Percentage (%)
            </button>
            <button
              onClick={() => setMetricType('count')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                metricType === 'count'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Pixel Count
            </button>
          </div>

          {/* Sort Order Selector */}
          <div className="flex items-center bg-[#181e30] p-0.5 rounded-lg border border-neutral-700/80">
            <button
              onClick={() => setSortOrder('nibble')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                sortOrder === 'nibble'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Order standard 0 to F"
            >
              <ListOrdered className="w-3 h-3" />
              <span>0–F Order</span>
            </button>
            <button
              onClick={() => setSortOrder('frequency')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                sortOrder === 'frequency'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Order from highest to lowest frequency"
            >
              <ArrowDownWideNarrow className="w-3 h-3" />
              <span>Ranked</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Active Colors */}
          <div className="bg-[#161c2d] border border-neutral-800/80 rounded-lg p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
              Active Colors
            </span>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-base font-bold text-white tabular-nums">
                {stats.usedCount}
              </span>
              <span className="text-xs text-neutral-500">/ 16 ({stats.usedPercentage}%)</span>
            </div>
          </div>

          {/* Dominant Color */}
          <div className="bg-[#161c2d] border border-neutral-800/80 rounded-lg p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
              Dominant Nibble
            </span>
            <div className="flex items-center gap-1.5 font-mono">
              <span
                className="w-3.5 h-3.5 rounded shadow-inner ring-1 ring-white/20 inline-block shrink-0"
                style={{ backgroundColor: stats.dominant.hexColor }}
              />
              <span className="text-xs font-bold text-white">
                {stats.dominant.nibble}
              </span>
              <span className="text-xs text-indigo-400 font-semibold tabular-nums truncate">
                {stats.dominant.percentage}%
              </span>
            </div>
          </div>

          {/* Least Used Active Color */}
          <div className="bg-[#161c2d] border border-neutral-800/80 rounded-lg p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
              Least Used Active
            </span>
            <div className="flex items-center gap-1.5 font-mono">
              {stats.leastUsed ? (
                <>
                  <span
                    className="w-3.5 h-3.5 rounded shadow-inner ring-1 ring-white/20 inline-block shrink-0"
                    style={{ backgroundColor: stats.leastUsed.hexColor }}
                  />
                  <span className="text-xs font-bold text-white">
                    {stats.leastUsed.nibble}
                  </span>
                  <span className="text-xs text-neutral-400 tabular-nums truncate">
                    {stats.leastUsed.percentage}%
                  </span>
                </>
              ) : (
                <span className="text-xs text-neutral-500">None</span>
              )}
            </div>
          </div>

          {/* Total Sampled Pixels */}
          <div className="bg-[#161c2d] border border-neutral-800/80 rounded-lg p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
              Total Pixels
            </span>
            <span className="text-base font-bold font-mono text-white tabular-nums">
              {totalPixels.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Main Recharts Bar Histogram */}
      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -16, bottom: 20 }}
          >
            <XAxis
              dataKey="nibble"
              stroke="#525252"
              tickLine={false}
              tick={(props) => {
                const { x, y, payload } = props;
                const entry = chartData.find((d) => d.nibble === payload.value);
                if (!entry) return null;

                return (
                  <g transform={`translate(${x},${y})`}>
                    {/* Color dot swatch */}
                    <circle
                      cx="0"
                      cy="8"
                      r="4"
                      fill={entry.hexColor}
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="1"
                    />
                    {/* Nibble text label */}
                    <text
                      x="0"
                      y="23"
                      textAnchor="middle"
                      fill="#d4d4d8"
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      {payload.value}
                    </text>
                  </g>
                );
              }}
            />
            <YAxis
              stroke="#525252"
              fontSize={10}
              fontFamily="JetBrains Mono, monospace"
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) =>
                metricType === 'percentage' ? `${val}%` : val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val
              }
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload as HistogramEntry;

                return (
                  <div className="bg-[#121624]/95 border border-neutral-700/80 rounded-lg p-2.5 shadow-xl backdrop-blur-md font-mono text-xs text-neutral-200 flex flex-col gap-1.5 z-50">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded ring-1 ring-white/20 shadow-inner shrink-0"
                        style={{ backgroundColor: data.hexColor }}
                      />
                      <span className="font-bold text-white">
                        Nibble {data.nibble}
                      </span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-indigo-400 font-semibold">{data.hexColor}</span>
                    </div>

                    <div className="text-[11px] text-neutral-400">
                      {data.name}
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-neutral-800 text-[11px]">
                      <span className="text-neutral-400">Pixel Count:</span>
                      <strong className="text-white tabular-nums">
                        {data.count.toLocaleString()} px
                      </strong>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-[11px]">
                      <span className="text-neutral-400">Distribution:</span>
                      <strong className="text-indigo-300 tabular-nums">
                        {data.percentage}%
                      </strong>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey={metricType === 'percentage' ? 'percentage' : 'count'}
              radius={[4, 4, 0, 0]}
              animationDuration={500}
            >
              {chartData.map((entry) => (
                <Cell
                  key={`cell-${entry.nibble}`}
                  fill={entry.hexColor}
                  stroke={entry.count > 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.05)'}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
