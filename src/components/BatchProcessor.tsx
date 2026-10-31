/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Layers,
  Play,
  Download,
  Copy,
  Check,
  Trash2,
  Sparkles,
  FileText,
  AlertCircle,
  RefreshCw,
  Eye,
  Settings2,
  ChevronRight,
} from 'lucide-react';
import {
  BatchCommentStyle,
  BatchExportOptions,
  BatchImageItem,
  ColorMetric,
  DitherAlgorithm,
  ExportFormat,
  FitMode,
  ImageAdjustments,
  Palette,
  ResampleFilter,
} from '../types/palette';
import { ALL_PALETTES } from '../data/palettes';
import { processImageToHex4Bit, renderResizedImageToCanvas } from '../utils/dither';
import { downloadTextFile, formatBatchHexData } from '../utils/export';

interface BatchProcessorProps {
  currentPalette: Palette;
  defaultWidth?: number;
  defaultHeight?: number;
}

const SAMPLE_BATCH_ITEMS = [
  {
    name: 'hero_cyberpunk.jpg',
    url: '/src/assets/images/sample_pixel_hero_1792891947606.jpg',
  },
  {
    name: 'sunset_lake.jpg',
    url: '/src/assets/images/sample_retro_scenery_1792891948685.jpg',
  },
  {
    name: 'arcade_synth.jpg',
    url: '/src/assets/images/sample_arcade_scene_1792891949358.jpg',
  },
];

const RESOLUTION_PRESETS = [
  { label: '32×32 Icon', w: 32, h: 32 },
  { label: '64×64 Tile', w: 64, h: 64 },
  { label: '128×128 Sprite', w: 128, h: 128 },
  { label: '320×200 EGA Low', w: 320, h: 200 },
  { label: '640×480 VGA Standard', w: 640, h: 480 },
];

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  currentPalette: initialPalette,
  defaultWidth = 64,
  defaultHeight = 64,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch queue
  const [items, setItems] = useState<BatchImageItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [selectedItemForInspect, setSelectedItemForInspect] = useState<BatchImageItem | null>(null);

  // Settings
  const [targetWidth, setTargetWidth] = useState<number>(defaultWidth);
  const [targetHeight, setTargetHeight] = useState<number>(defaultHeight);
  const [fitMode, setFitMode] = useState<FitMode>('cover');
  const [resampleFilter] = useState<ResampleFilter>('nearest');

  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(initialPalette.id);
  const activePalette = ALL_PALETTES.find((p) => p.id === selectedPaletteId) || initialPalette;

  const [algorithm, setAlgorithm] = useState<DitherAlgorithm>('floyd-steinberg');
  const [ditherIntensity, setDitherIntensity] = useState<number>(0.85);
  const [colorMetric] = useState<ColorMetric>('perceptual');

  // Export options
  const [format, setFormat] = useState<ExportFormat>('raw-matrix');
  const [commentStyle, setCommentStyle] = useState<BatchCommentStyle>('semicolon');
  const [includeGlobalHeader, setIncludeGlobalHeader] = useState<boolean>(true);
  const [includeFileStats, setIncludeFileStats] = useState<boolean>(true);
  const [uppercase, setUppercase] = useState<boolean>(true);

  // Copy state
  const [copied, setCopied] = useState<boolean>(false);

  // Add files to queue
  const handleAddFiles = (files: FileList | File[]) => {
    const newItems: BatchImageItem[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        filename: file.name,
        fileSize: file.size,
        sourceUrl: url,
        status: 'pending',
      });
    });

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Load sample batch
  const handleLoadSampleBatch = () => {
    const samples: BatchImageItem[] = SAMPLE_BATCH_ITEMS.map((sample, idx) => ({
      id: `sample-${idx}-${Date.now()}`,
      filename: sample.name,
      sourceUrl: sample.url,
      status: 'pending',
    }));
    setItems((prev) => [...prev, ...samples]);
  };

  // Process a single item
  const processItem = async (
    item: BatchImageItem,
    palette: Palette,
    w: number,
    h: number,
    algo: DitherAlgorithm,
    fit: FitMode,
    intensity: number
  ): Promise<BatchImageItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const resizedCanvas = renderResizedImageToCanvas(img, w, h, fit, resampleFilter);
          const adjustments: ImageAdjustments = {
            brightness: 0,
            contrast: 5,
            saturation: 10,
            gamma: 1.0,
            invert: false,
            sharpness: 0.5,
          };

          const processed = processImageToHex4Bit(
            resizedCanvas,
            palette.colors,
            algo,
            colorMetric,
            intensity,
            adjustments
          );

          // Create a small preview canvas data URL
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = w;
          thumbCanvas.height = h;
          const thumbCtx = thumbCanvas.getContext('2d');
          if (thumbCtx) {
            thumbCtx.putImageData(processed.quantizedImageData, 0, 0);
          }

          resolve({
            ...item,
            imgElement: img,
            originalWidth: img.naturalWidth || img.width,
            originalHeight: img.naturalHeight || img.height,
            status: 'done',
            processed,
            thumbnailCanvasUrl: thumbCanvas.toDataURL('image/png'),
          });
        } catch (err: any) {
          resolve({
            ...item,
            status: 'error',
            errorMessage: err?.message || 'Processing failed',
          });
        }
      };

      img.onerror = () => {
        resolve({
          ...item,
          status: 'error',
          errorMessage: 'Failed to load image source',
        });
      };

      img.src = item.sourceUrl;
    });
  };

  // Run batch processing on all pending or all items
  const processBatchQueue = useCallback(
    async (forceAll: boolean = false) => {
      if (items.length === 0 || isProcessingQueue) return;

      setIsProcessingQueue(true);

      const itemsToProcess = forceAll
        ? items.map((i) => ({ ...i, status: 'pending' as const }))
        : [...items];

      setItems(itemsToProcess);

      const updatedItems: BatchImageItem[] = [...itemsToProcess];

      for (let i = 0; i < updatedItems.length; i++) {
        if (forceAll || updatedItems[i].status !== 'done') {
          // Set to processing
          updatedItems[i] = { ...updatedItems[i], status: 'processing' };
          setItems([...updatedItems]);

          // Process
          const completed = await processItem(
            updatedItems[i],
            activePalette,
            targetWidth,
            targetHeight,
            algorithm,
            fitMode,
            ditherIntensity
          );

          updatedItems[i] = completed;
          setItems([...updatedItems]);
        }
      }

      setIsProcessingQueue(false);
    },
    [
      items,
      isProcessingQueue,
      activePalette,
      targetWidth,
      targetHeight,
      algorithm,
      fitMode,
      ditherIntensity,
      resampleFilter,
      colorMetric,
    ]
  );

  // Auto-process pending items when added
  useEffect(() => {
    const hasPending = items.some((item) => item.status === 'pending');
    if (hasPending && !isProcessingQueue) {
      processBatchQueue(false);
    }
  }, [items, isProcessingQueue, processBatchQueue]);

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedItemForInspect?.id === id) {
      setSelectedItemForInspect(null);
    }
  };

  // Clear all items
  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.sourceUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.sourceUrl);
      }
    });
    setItems([]);
    setSelectedItemForInspect(null);
  };

  // Build combined export content
  const exportOptions: BatchExportOptions = {
    format,
    commentStyle,
    includeGlobalHeader,
    includeFileStats,
    uppercase,
  };

  const combinedOutput = formatBatchHexData(items, activePalette, exportOptions);

  const completedCount = items.filter((i) => i.status === 'done').length;

  // Handle Download Combined .txt
  const handleDownloadCombinedTxt = () => {
    if (completedCount === 0) return;
    const cleanPalName = activePalette.id.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `batch-ega-4bit-${completedCount}-images-${targetWidth}x${targetHeight}-${cleanPalName}.txt`;
    downloadTextFile(combinedOutput, filename);
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!combinedOutput) return;
    navigator.clipboard.writeText(combinedOutput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Description */}
      <div className="bg-[#121624] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Batch Image Quantizer & Combined Exporter</h2>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                0-F 4-Bit Hex
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
              Upload multiple images to quantize them against the selected 16-color palette and dither engine simultaneously.
              Export all processed images into a <strong>single combined .txt file</strong> with filenames, dimensions, and metadata comments.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <button
            onClick={handleLoadSampleBatch}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-neutral-200 bg-[#1a2136] hover:bg-[#222c48] border border-neutral-700/80 rounded-lg transition-colors cursor-pointer"
            title="Load 3 sample images into the batch queue"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load 3 Samples</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Select Images...</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleAddFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* Multi-File Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => {
          if (items.length === 0) fileInputRef.current?.click();
        }}
        className={`border-2 border-dashed rounded-xl p-6 transition-all text-center flex flex-col items-center justify-center gap-2 ${
          items.length === 0
            ? 'border-neutral-700/80 hover:border-indigo-500/60 bg-[#0e121d] hover:bg-[#131929] cursor-pointer'
            : 'border-neutral-800 bg-[#0c101a]'
        }`}
      >
        <Upload className="w-8 h-8 text-neutral-500 mb-1" />
        <p className="text-sm font-medium text-neutral-200">
          Drag and drop multiple images here, or{' '}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
          >
            browse your files
          </button>
        </p>
        <p className="text-xs text-neutral-400 font-mono">
          PNG, JPEG, WebP, GIF, SVG supported · All images will be resized & dithered to 4-bit hex
        </p>
      </div>

      {/* Batch Processing Settings Bar */}
      <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200 uppercase tracking-wider">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            <span>Batch Engine Settings</span>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <>
                <button
                  onClick={() => processBatchQueue(true)}
                  disabled={isProcessingQueue}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-[#1c2238] hover:bg-[#262e4c] rounded-lg border border-neutral-700/80 transition-colors cursor-pointer disabled:opacity-50"
                  title="Re-run dither pipeline on all items"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessingQueue ? 'animate-spin text-indigo-400' : ''}`} />
                  <span>Re-process All</span>
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={isProcessingQueue}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-900/40 rounded-lg border border-rose-800/50 transition-colors cursor-pointer"
                  title="Clear all queue items"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Queue</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Target Resolution */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-400 font-medium">Target Dimensions (WxH)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="8"
                max="1024"
                value={targetWidth}
                onChange={(e) => setTargetWidth(Math.max(8, parseInt(e.target.value) || 64))}
                className="w-16 px-2.5 py-1.5 bg-[#0a0d16] border border-neutral-700 rounded-lg text-white font-mono text-center focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-neutral-500 font-mono">×</span>
              <input
                type="number"
                min="8"
                max="1024"
                value={targetHeight}
                onChange={(e) => setTargetHeight(Math.max(8, parseInt(e.target.value) || 64))}
                className="w-16 px-2.5 py-1.5 bg-[#0a0d16] border border-neutral-700 rounded-lg text-white font-mono text-center focus:border-indigo-500 focus:outline-none"
              />
              <select
                onChange={(e) => {
                  const [w, h] = e.target.value.split('x').map(Number);
                  setTargetWidth(w);
                  setTargetHeight(h);
                }}
                value={`${targetWidth}x${targetHeight}`}
                className="flex-1 px-2 py-1.5 bg-[#0a0d16] border border-neutral-700 rounded-lg text-neutral-300 text-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="custom" disabled>Presets...</option>
                {RESOLUTION_PRESETS.map((p) => (
                  <option key={p.label} value={`${p.w}x${p.h}`}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Palette Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-400 font-medium">16-Color 4-Bit Palette</label>
            <select
              value={selectedPaletteId}
              onChange={(e) => setSelectedPaletteId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0a0d16] border border-neutral-700 rounded-lg text-neutral-200 text-xs focus:border-indigo-500 focus:outline-none cursor-pointer truncate"
            >
              {ALL_PALETTES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
            {/* Color swatch row */}
            <div className="flex h-2 rounded overflow-hidden mt-0.5 border border-neutral-800">
              {activePalette.colors.map((c) => (
                <div key={c.index} className="flex-1" style={{ backgroundColor: c.hexColor }} />
              ))}
            </div>
          </div>

          {/* Dither Algorithm */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-400 font-medium">Dither Algorithm & Intensity</label>
            <div className="flex items-center gap-2">
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as DitherAlgorithm)}
                className="flex-1 px-2.5 py-1.5 bg-[#0a0d16] border border-neutral-700 rounded-lg text-neutral-200 text-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="floyd-steinberg">Floyd-Steinberg</option>
                <option value="atkinson">Atkinson (Mac Classic)</option>
                <option value="jarvis">Jarvis-Judice-Ninke</option>
                <option value="bayer-4">Bayer 4×4 Ordered</option>
                <option value="bayer-8">Bayer 8×8 Ordered</option>
                <option value="sierra-lite">Sierra Lite</option>
                <option value="none">None (Nearest Color)</option>
              </select>
              <div className="flex items-center gap-1 font-mono text-[11px] text-neutral-400 shrink-0">
                <span>{(ditherIntensity * 100).toFixed(0)}%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ditherIntensity}
              onChange={(e) => setDitherIntensity(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5"
            />
          </div>

          {/* Aspect & Fit */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-400 font-medium">Aspect Fit Mode</label>
            <div className="grid grid-cols-3 gap-1">
              {(['cover', 'contain', 'stretch'] as FitMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFitMode(mode)}
                  className={`py-1.5 px-2 rounded-lg text-center font-medium capitalize transition-all cursor-pointer ${
                    fitMode === mode
                      ? 'bg-indigo-600/30 border border-indigo-500 text-indigo-300'
                      : 'bg-[#0a0d16] border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Queue List + Combined Output Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Queue List (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Batch Queue</h3>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                {completedCount} / {items.length} Completed
              </span>
            </div>

            {isProcessingQueue && (
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing images...</span>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-10 text-center flex flex-col items-center justify-center gap-3">
              <FileText className="w-10 h-10 text-neutral-600" />
              <p className="text-sm text-neutral-300 font-medium">No images in batch queue yet.</p>
              <p className="text-xs text-neutral-400 max-w-sm">
                Click &quot;Load 3 Samples&quot; above to immediately test the batch exporter, or drop your own image files.
              </p>
              <button
                onClick={handleLoadSampleBatch}
                className="mt-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Load Sample Batch
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[640px] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemForInspect(item)}
                  className={`bg-[#121624] border rounded-xl p-3 flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    selectedItemForInspect?.id === item.id
                      ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-[#161c30]'
                      : 'border-neutral-800/80 hover:border-neutral-700 hover:bg-[#151a2b]'
                  }`}
                >
                  {/* Thumbnail & File Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-neutral-500 w-5 text-right shrink-0">
                      #{index + 1}
                    </span>

                    {/* Dual thumbnail: Original & 4-bit preview */}
                    <div className="relative w-12 h-12 bg-black rounded-lg overflow-hidden border border-neutral-800 shrink-0">
                      {item.thumbnailCanvasUrl ? (
                        <img
                          src={item.thumbnailCanvasUrl}
                          alt={item.filename}
                          className="w-full h-full object-contain [image-rendering:pixelated]"
                        />
                      ) : (
                        <img
                          src={item.sourceUrl}
                          alt={item.filename}
                          className="w-full h-full object-cover opacity-60"
                        />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-neutral-200 truncate" title={item.filename}>
                        {item.filename}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400 mt-0.5">
                        <span>{targetWidth}×{targetHeight} px</span>
                        {item.processed && (
                          <>
                            <span>·</span>
                            <span className="text-indigo-400">
                              {item.processed.uniqueColorCount}/16 Colors
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator & Remove Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    {item.status === 'done' && (
                      <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <span className="flex items-center gap-1 font-mono text-[11px] text-indigo-400 bg-indigo-950/40 border border-indigo-800/60 px-2 py-0.5 rounded animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Dithering</span>
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="font-mono text-[11px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                        Pending
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="flex items-center gap-1 font-mono text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/60 px-2 py-0.5 rounded" title={item.errorMessage}>
                        <AlertCircle className="w-3 h-3" />
                        <span>Error</span>
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.id);
                      }}
                      className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-neutral-800/60 transition-colors cursor-pointer"
                      title="Remove from batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Combined Export & Live Text Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Combined .txt Output</h3>
              </div>

              {/* Primary Download Combined CTA */}
              <button
                onClick={handleDownloadCombinedTxt}
                disabled={completedCount === 0}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors cursor-pointer"
                title="Download single combined .txt file with all images and filename comments"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Combined .txt</span>
              </button>
            </div>

            {/* Export Format & Comment Style Controls */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-neutral-400 font-medium">Hex Representation</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="w-full px-2.5 py-1.5 bg-[#0a0d16] border border-neutral-700 rounded-lg text-neutral-200 text-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="raw-matrix">Raw 0-F Matrix (1 char/pixel)</option>
                  <option value="delimited-space">Space Separated Hex</option>
                  <option value="delimited-comma">Comma Separated Hex</option>
                  <option value="packed-hex">Packed 4-Bit Hex Bytes (0x00)</option>
                  <option value="c-array">C/C++ Array (uint8_t)</option>
                  <option value="assembly">x86 Assembly (db)</option>
                  <option value="qbasic">QBasic DATA Statements</option>
                  <option value="json">JSON Array of Images</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-neutral-400 font-medium">Filename Comment Style</label>
                <select
                  value={commentStyle}
                  onChange={(e) => setCommentStyle(e.target.value as BatchCommentStyle)}
                  className="w-full px-2.5 py-1.5 bg-[#0a0d16] border border-neutral-700 rounded-lg text-neutral-200 text-xs focus:border-indigo-500 focus:outline-none cursor-pointer font-mono"
                >
                  <option value="semicolon">; Semicolon (DOS / ASM / INI)</option>
                  <option value="c-slash">// Double Slash (C / C++ / JS)</option>
                  <option value="hash"># Hash (Shell / Python / Ruby)</option>
                  <option value="rem">&apos; Apostrophe (QBasic / BASIC)</option>
                </select>
              </div>
            </div>

            {/* Toggle checkboxes */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeGlobalHeader}
                  onChange={(e) => setIncludeGlobalHeader(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                <span>Include Global Header</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeFileStats}
                  onChange={(e) => setIncludeFileStats(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                <span>Include Dimensions & Stats</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                <span>Uppercase Hex (0-F)</span>
              </label>
            </div>

            {/* Live Text Area Preview */}
            <div className="relative flex flex-col">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pb-1.5 px-1">
                <span>
                  {completedCount} image{completedCount === 1 ? '' : 's'} · {combinedOutput.length.toLocaleString()} chars
                </span>
                <button
                  onClick={handleCopy}
                  disabled={completedCount === 0}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={combinedOutput}
                className="w-full h-80 bg-[#090b12] border border-neutral-800 rounded-lg p-3 text-neutral-300 font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:border-indigo-500/50 [tab-size:4]"
                placeholder="Processed 0-F hex data from all images in the batch will appear here with filename comments..."
              />
            </div>
          </div>

          {/* Single Item Inspector Modal / Detail (if an item is clicked) */}
          {selectedItemForInspect && selectedItemForInspect.processed && (
            <div className="bg-[#121624] border border-indigo-500/30 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span className="truncate max-w-[200px]">{selectedItemForInspect.filename}</span>
                </div>
                <button
                  onClick={() => setSelectedItemForInspect(null)}
                  className="text-neutral-500 hover:text-neutral-300 text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="flex items-center gap-4">
                {selectedItemForInspect.thumbnailCanvasUrl && (
                  <img
                    src={selectedItemForInspect.thumbnailCanvasUrl}
                    alt="Inspect preview"
                    className="w-20 h-20 rounded-lg border border-neutral-800 object-contain bg-black [image-rendering:pixelated]"
                  />
                )}
                <div className="flex flex-col gap-1 text-xs font-mono text-neutral-300">
                  <div>
                    Dimensions: <span className="text-white">{selectedItemForInspect.processed.width}×{selectedItemForInspect.processed.height}</span>
                  </div>
                  <div>
                    Total Pixels:{' '}
                    <span className="text-white">
                      {selectedItemForInspect.processed.width * selectedItemForInspect.processed.height}
                    </span>
                  </div>
                  <div>
                    Unique Colors:{' '}
                    <span className="text-indigo-400">
                      {selectedItemForInspect.processed.uniqueColorCount} / 16
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const singleContent = formatBatchHexData([selectedItemForInspect], activePalette, exportOptions);
                      downloadTextFile(
                        singleContent,
                        `ega-4bit-${selectedItemForInspect.filename.replace(/\.[^/.]+$/, '')}.txt`
                      );
                    }}
                    className="mt-1 flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download only this .txt</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
