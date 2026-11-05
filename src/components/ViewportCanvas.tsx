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
  ArrowLeftRight,
  Eye,
} from 'lucide-react';

interface ViewportCanvasProps {
  originalCanvas: HTMLCanvasElement | null;
  processedData: ProcessedImageData | null;
  palette: Palette;
  width: number;
  height: number;
}

type ViewMode = 'dithered' | 'split' | 'side-by-side' | 'hex-overlay';
type ABState = 'original' | 'dithered';

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  originalCanvas,
  processedData,
  palette,
  width,
  height,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ditherCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const trackingOverlayRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('dithered');
  const [abState, setAbState] = useState<ABState>('dithered');
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

  // Copy originalCanvas onto originalCanvasRef for zero-latency, artifact-free A/B crossfade
  useEffect(() => {
    if (!originalCanvas || !originalCanvasRef.current) return;
    const canvas = originalCanvasRef.current;
    canvas.width = originalCanvas.width;
    canvas.height = originalCanvas.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(originalCanvas, 0, 0);
    }
  }, [originalCanvas, width, height]);

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

  // Keyboard shortcut listener for quick A/B toggle (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is interacting with an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setAbState((prev) => (prev === 'dithered' ? 'original' : 'dithered'));
        if (viewMode !== 'dithered') {
          setViewMode('dithered');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  // Handle mouse move for pixel coordinate inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingSplit) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      setSplitPos(pct);
      return;
    }

    if (!processedData) return;
    const targetEl = trackingOverlayRef.current || ditherCanvasRef.current;
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();
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

  const toggleAB = () => {
    setAbState((prev) => (prev === 'dithered' ? 'original' : 'dithered'));
    if (viewMode !== 'dithered') {
      setViewMode('dithered');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0d14] border border-neutral-800/80 rounded-xl overflow-hidden min-h-[440px]">
      {/* Viewport Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#121624] border-b border-neutral-800/80">
        {/* Left Side: View Mode & A/B Toggle Segmented Control */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main View modes */}
          <div className="flex items-center gap-1 bg-[#181e30] p-1 rounded-lg border border-neutral-750">
            <button
              onClick={() => setViewMode('dithered')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'dithered'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
              title="Standard Viewport Canvas with A/B Crossfade"
            >
              Canvas View
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

          {/* Dedicated A/B Crossfade Toggle Button */}
          <div className="flex items-center gap-1 bg-[#181e30] p-1 rounded-lg border border-neutral-750">
            <span className="text-[10px] font-mono font-bold text-neutral-400 pl-1.5 pr-0.5">A/B:</span>
            <button
              onClick={() => {
                setAbState('original');
                if (viewMode !== 'dithered') setViewMode('dithered');
              }}
              className={`px-2 py-0.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                abState === 'original' && viewMode === 'dithered'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm ring-1 ring-amber-300'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Switch to A: Original Source Image"
            >
              A: Original
            </button>

            <button
              onClick={toggleAB}
              onMouseDown={() => {
                // Hold to peek original!
                setAbState('original');
                if (viewMode !== 'dithered') setViewMode('dithered');
              }}
              onMouseUp={() => {
                setAbState('dithered');
              }}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
              title="Click to crossfade toggle, or hold button down to peek Original (Shortcut: Spacebar)"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            <button
              onClick={() => {
                setAbState('dithered');
                if (viewMode !== 'dithered') setViewMode('dithered');
              }}
              className={`px-2 py-0.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                abState === 'dithered' && viewMode === 'dithered'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm ring-1 ring-indigo-400'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Switch to B: 4-Bit EGA Dithered Output"
            >
              B: Dithered
            </button>
          </div>
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
              <span className="text-xs font-medium text-neutral-400">Original Source (A)</span>
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
              <span className="text-xs font-medium text-indigo-300">4-Bit EGA Dithered (B)</span>
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
          /* Standard Canvas Viewport with A/B Crossfade Animation */
          <div
            className={`relative border border-neutral-750 shadow-2xl overflow-hidden transition-all ${
              showGrid && zoom >= 4 ? 'pixel-grid-overlay' : ''
            }`}
            style={{
              width: width * zoom,
              height: height * zoom,
            }}
          >
            {/* Layer A: Original Source Image (Smooth Fade-in / Fade-out) */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                abState === 'original' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <canvas
                ref={originalCanvasRef}
                className="w-full h-full pixelated block"
                width={width}
                height={height}
              />
            </div>

            {/* Layer B: 4-Bit EGA Dithered Canvas (Smooth Fade-in / Fade-out) */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                abState === 'dithered' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <canvas
                ref={ditherCanvasRef}
                className="w-full h-full pixelated block"
                width={width}
                height={height}
              />
            </div>

            {/* Mouse tracking overlay to ensure continuous, pixel-accurate inspection */}
            <div
              ref={trackingOverlayRef}
              className="absolute inset-0 z-20 cursor-crosshair"
            />

            {/* Floating A/B Indicator Badge & Quick Flip Button */}
            <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 bg-[#0e121e]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-neutral-700/80 shadow-lg text-[11px] font-mono pointer-events-auto">
              <span className="text-neutral-400">View:</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded ${
                  abState === 'original'
                    ? 'text-amber-300 bg-amber-950/70 border border-amber-800/70'
                    : 'text-indigo-300 bg-indigo-950/70 border border-indigo-800/70'
                }`}
              >
                {abState === 'original' ? 'A (Original Source)' : 'B (4-Bit Dithered)'}
              </span>
              <button
                onClick={toggleAB}
                className="ml-1 p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Crossfade to other layer (Shortcut: Spacebar)"
              >
                <ArrowLeftRight className="w-3 h-3 text-indigo-400" />
              </button>
              <span className="hidden sm:inline text-[10px] text-neutral-500 pl-0.5">[Space]</span>
            </div>

            {/* Pixel Grid SVG Overlay */}
            {showGrid && zoom >= 4 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-25"
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
              className="w-8 h-8 rounded-md border border-white/20 shadow-inner flex items-center justify-center font-mono font-bold text-sm shrink-0"
              style={{
                backgroundColor:
                  abState === 'original' && hoverPixel.originalRgb
                    ? `rgb(${hoverPixel.originalRgb.join(',')})`
                    : hoverPixel.paletteHex,
              }}
            >
              <span className="drop-shadow px-1 bg-black/40 rounded text-white text-xs">
                {abState === 'original' ? 'A' : hoverPixel.hexNibble}
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-white font-bold">
                  ({hoverPixel.x}, {hoverPixel.y})
                </span>
                <span className="text-neutral-500">·</span>
                {abState === 'original' ? (
                  <span className="text-amber-400 font-bold">Mode A: Original</span>
                ) : (
                  <span className="text-indigo-400 font-bold">Nibble: {hoverPixel.hexNibble}</span>
                )}
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-300">Index {hoverPixel.colorIndex}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                <span className="text-neutral-200">{hoverPixel.colorName}</span>
                <span>{hoverPixel.paletteHex}</span>
                {hoverPixel.originalRgb && (
                  <span className="text-neutral-300 font-mono font-semibold">
                    RGB({hoverPixel.originalRgb.join(', ')})
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
            Layer:{' '}
            <strong className={abState === 'original' ? 'text-amber-400' : 'text-indigo-400'}>
              {abState === 'original' ? 'A (Original Source)' : 'B (4-Bit Dithered)'}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>Palette: {palette.name} (4-bit 0-F)</span>
        </div>
      </div>
    </div>
  );
};
