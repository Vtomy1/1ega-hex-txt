/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Palette, PixelHoverInfo, ProcessedImageData } from '../types/palette';
import {
  ZoomIn,
  ZoomOut,
  Grid,
  Columns,
  SplitSquareVertical,
  Maximize,
  Info,
  Layers,
} from 'lucide-react';

interface ViewportCanvasProps {
  originalCanvas: HTMLCanvasElement | null;
  processedData: ProcessedImageData | null;
  palette: Palette;
  width: number;
  height: number;
}

type ViewMode = 'dithered' | 'split' | 'side-by-side' | 'hex-overlay';

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  originalCanvas,
  processedData,
  palette,
  width,
  height,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ditherCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('dithered');
  const [zoom, setZoom] = useState<number>(4); // Default 4x zoom for pixel art
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0-100
  const [hoverPixel, setHoverPixel] = useState<PixelHoverInfo | null>(null);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Paint the dithered quantized ImageData onto ditherCanvasRef
  useEffect(() => {
    if (!processedData || !ditherCanvasRef.current) return;
    const canvas = ditherCanvasRef.current;
    canvas.width = processedData.width;
    canvas.height = processedData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(processedData.quantizedImageData, 0, 0);
    }
  }, [processedData]);

  // Handle Hex Overlay rendering when viewMode is 'hex-overlay'
  useEffect(() => {
    if (!overlayCanvasRef.current || !processedData || viewMode !== 'hex-overlay') return;
    const canvas = overlayCanvasRef.current;
    const cellScale = Math.max(16, zoom * 8);
    canvas.width = width * cellScale;
    canvas.height = height * cellScale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `bold ${Math.floor(cellScale * 0.42)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const { hexMatrix, indexMatrix } = processedData;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = indexMatrix[y * width + x];
        const hexChar = hexMatrix[y][x];
        const color = palette.colors[idx] || palette.colors[0];

        // Fill pixel background
        ctx.fillStyle = color.hexColor;
        ctx.fillRect(x * cellScale, y * cellScale, cellScale, cellScale);

        // Draw grid border
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(x * cellScale, y * cellScale, cellScale, cellScale);

        // Draw contrasting text
        const [r, g, b] = color.rgb;
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        ctx.fillStyle = lum > 0.5 ? '#000000' : '#FFFFFF';
        ctx.fillText(
          hexChar,
          x * cellScale + cellScale / 2,
          y * cellScale + cellScale / 2
        );
      }
    }
  }, [processedData, viewMode, zoom, width, height, palette]);

  // Handle mouse move for pixel coordinate inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingSplit) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      setSplitPos(pct);
      return;
    }

    if (!processedData || !ditherCanvasRef.current) return;
    const rect = ditherCanvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX >= 0 && mouseX < rect.width && mouseY >= 0 && mouseY < rect.height) {
      const px = Math.floor((mouseX / rect.width) * width);
      const py = Math.floor((mouseY / rect.height) * height);

      if (px >= 0 && px < width && py >= 0 && py < height) {
        const colorIdx = processedData.indexMatrix[py * width + px];
        const hexNibble = processedData.hexMatrix[py][px];
        const color = palette.colors[colorIdx] || palette.colors[0];

        let origRgb: [number, number, number] | undefined = undefined;
        if (originalCanvas) {
          const oCtx = originalCanvas.getContext('2d');
          if (oCtx) {
            const p = oCtx.getImageData(px, py, 1, 1).data;
            origRgb = [p[0], p[1], p[2]];
          }
        }

        setHoverPixel({
          x: px,
          y: py,
          hexNibble,
          colorIndex: colorIdx,
          colorName: color.name,
          paletteHex: color.hexColor,
          originalRgb: origRgb,
        });
      }
    } else {
      setHoverPixel(null);
    }
  };

  const handleFitZoom = () => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth - 48;
    const containerH = containerRef.current.clientHeight - 48;
    const fitZoom = Math.max(1, Math.floor(Math.min(containerW / width, containerH / height)));
    setZoom(fitZoom);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0d14] border border-neutral-800/80 rounded-xl overflow-hidden min-h-[440px]">
      {/* Viewport Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#121624] border-b border-neutral-800/80">
        {/* View mode segmented buttons */}
        <div className="flex items-center gap-1 bg-[#181e30] p-1 rounded-lg border border-neutral-750">
          <button
            onClick={() => setViewMode('dithered')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'dithered'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
            title="Dithered 4-bit EGA output"
          >
            Dithered (0-F)
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'split'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
            title="Interactive Split Slider"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'side-by-side'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
            title="Side by side view"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
          <button
            onClick={() => setViewMode('hex-overlay')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'hex-overlay'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white'
            }`}
            title="Inspect 0-F glyph on each pixel cell"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hex Grid (0-F)</span>
          </button>
        </div>

        {/* Zoom & Grid tools */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-[#181e30] px-2 py-1 rounded-lg border border-neutral-750">
            <button
              onClick={() => setZoom(Math.max(1, zoom - 1))}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-neutral-200 w-9 text-center tabular-nums">
              {zoom}×
            </span>
            <button
              onClick={() => setZoom(Math.min(16, zoom + 1))}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick zoom presets */}
          <div className="hidden sm:flex items-center gap-1 bg-[#181e30] p-1 rounded-lg border border-neutral-750 text-xs">
            {[1, 2, 4].map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  zoom === z
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title={`Set zoom to ${z}×`}
              >
                {z}×
              </button>
            ))}
          </div>

          <button
            onClick={handleFitZoom}
            className="p-1.5 bg-[#181e30] text-neutral-400 hover:text-white border border-neutral-750 rounded-lg text-xs transition-colors cursor-pointer"
            title="Fit to screen"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              showGrid
                ? 'bg-indigo-600/20 border-indigo-500/80 text-indigo-300'
                : 'bg-[#181e30] border-neutral-750 text-neutral-400 hover:text-white'
            }`}
            title="Toggle pixel grid"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverPixel(null)}
        className="flex-1 relative overflow-auto p-6 flex items-center justify-center bg-[#07090e] select-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, #151a29 1px, transparent 1px), radial-gradient(circle, #151a29 1px, #07090e 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Render based on viewMode */}
        {viewMode === 'hex-overlay' ? (
          <div className="relative border border-neutral-700 shadow-2xl overflow-auto max-w-full max-h-[580px]">
            <canvas ref={overlayCanvasRef} className="block pixelated" />
          </div>
        ) : viewMode === 'side-by-side' ? (
          <div className="flex flex-wrap items-center justify-center gap-6 max-w-full">
            {/* Original */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-neutral-400">Original Source</span>
              <div
                className="relative border border-neutral-700 shadow-xl overflow-hidden"
                style={{
                  width: width * zoom,
                  height: height * zoom,
                }}
              >
                {originalCanvas && (
                  <img
                    src={originalCanvas.toDataURL()}
                    alt="Original scaled"
                    className="w-full h-full object-contain pixelated"
                  />
                )}
              </div>
            </div>

            {/* Dithered */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-indigo-300">4-Bit EGA Dithered</span>
              <div
                className={`relative border border-neutral-700 shadow-xl overflow-hidden ${
                  showGrid && zoom >= 4 ? 'ring-1 ring-white/10' : ''
                }`}
                style={{
                  width: width * zoom,
                  height: height * zoom,
                }}
              >
                <canvas
                  ref={ditherCanvasRef}
                  className="w-full h-full pixelated block"
                  width={width}
                  height={height}
                />
              </div>
            </div>
          </div>
        ) : viewMode === 'split' ? (
          <div
            className="relative border border-neutral-700 shadow-2xl cursor-col-resize overflow-hidden"
            style={{
              width: width * zoom,
              height: height * zoom,
            }}
            onMouseDown={() => setIsDraggingSplit(true)}
            onMouseUp={() => setIsDraggingSplit(false)}
          >
            {/* Under layer: Original */}
            {originalCanvas && (
              <img
                src={originalCanvas.toDataURL()}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none"
              />
            )}

            {/* Top clipped layer: Dithered */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${splitPos}%` }}
            >
              <canvas
                ref={ditherCanvasRef}
                className="pixelated block pointer-events-none"
                style={{
                  width: width * zoom,
                  height: height * zoom,
                }}
                width={width}
                height={height}
              />
            </div>

            {/* Split Divider bar */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none"
              style={{ left: `${splitPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg text-[10px] text-white font-bold">
                ↔
              </div>
            </div>
          </div>
        ) : (
          /* Standard Dithered Canvas */
          <div
            className={`relative border border-neutral-750 shadow-2xl overflow-hidden transition-all ${
              showGrid && zoom >= 4 ? 'pixel-grid-overlay' : ''
            }`}
            style={{
              width: width * zoom,
              height: height * zoom,
            }}
          >
            <canvas
              ref={ditherCanvasRef}
              className="w-full h-full pixelated block"
              width={width}
              height={height}
            />

            {/* Pixel Grid SVG Overlay */}
            {showGrid && zoom >= 4 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
                width={width * zoom}
                height={height * zoom}
              >
                <defs>
                  <pattern
                    id="grid-pattern"
                    width={zoom}
                    height={zoom}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${zoom} 0 L 0 0 0 ${zoom}`}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              </svg>
            )}
          </div>
        )}

        {/* Hover Pixel HUD Inspector Tooltip */}
        {hoverPixel && (
          <div className="absolute bottom-4 left-4 bg-[#121624]/95 border border-neutral-700 rounded-lg p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs z-30 pointer-events-none">
            <div
              className="w-8 h-8 rounded-md border border-white/20 shadow-inner flex items-center justify-center font-mono font-bold text-sm"
              style={{ backgroundColor: hoverPixel.paletteHex }}
            >
              <span className="drop-shadow px-1 bg-black/30 rounded text-white text-xs">
                {hoverPixel.hexNibble}
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-white font-bold">
                  ({hoverPixel.x}, {hoverPixel.y})
                </span>
                <span className="text-neutral-500">·</span>
                <span className="text-indigo-400 font-bold">Nibble: {hoverPixel.hexNibble}</span>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-300">Index {hoverPixel.colorIndex}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                <span className="text-neutral-200">{hoverPixel.colorName}</span>
                <span>{hoverPixel.paletteHex}</span>
                {hoverPixel.originalRgb && (
                  <span className="text-neutral-500 font-mono">
                    (orig rgb: {hoverPixel.originalRgb.join(',')})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#121624] border-t border-neutral-800/80 text-[11px] text-neutral-400 font-mono">
        <div className="flex items-center gap-3">
          <span>
            Canvas: <strong className="text-neutral-200">{width} × {height}</strong>
          </span>
          <span className="text-neutral-600">|</span>
          <span>Zoom: <strong className="text-neutral-200">{zoom}×</strong></span>
          <span className="text-neutral-600">|</span>
          <span>
            Mode: <strong className="text-indigo-400">{viewMode}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>Palette: {palette.name} (4-bit 0-F)</span>
        </div>
      </div>
    </div>
  );
};
