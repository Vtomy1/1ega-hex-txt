/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { PaletteViewer } from './components/PaletteViewer';
import { DimensionControls } from './components/DimensionControls';
import { DitherControls } from './components/DitherControls';
import { ImageSourceSelector } from './components/ImageSourceSelector';
import { ViewportCanvas } from './components/ViewportCanvas';
import { HexExportDrawer } from './components/HexExportDrawer';
import { PalettesGuide } from './components/PalettesGuide';
import { FormatGuide } from './components/FormatGuide';
import {
  ColorMetric,
  DitherAlgorithm,
  FitMode,
  ImageAdjustments,
  Palette,
  PaletteColor,
  ProcessedImageData,
  ResampleFilter,
} from './types/palette';
import { ALL_PALETTES, EGA_STANDARD_COLORS, hexToRgb, HEX_DIGITS } from './data/palettes';
import { processImageToHex4Bit, renderResizedImageToCanvas } from './utils/dither';
import { formatHexData, downloadTextFile } from './utils/export';

const DEFAULT_SAMPLE_URL = '/src/assets/images/sample_pixel_hero_1792891947606.jpg';

export default function App() {
  const [activeTab, setActiveTab] = useState<'converter' | 'palettes' | 'export-docs'>('converter');

  // Image source state
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_SAMPLE_URL);
  const [activeSampleId, setActiveSampleId] = useState<string>('hero');
  const [sourceImgElement, setSourceImgElement] = useState<HTMLImageElement | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);

  // Dimensions state
  const [width, setWidth] = useState<number>(64);
  const [height, setHeight] = useState<number>(64);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [fitMode, setFitMode] = useState<FitMode>('cover');
  const [resampleFilter, setResampleFilter] = useState<ResampleFilter>('nearest');

  // Palette state
  const [currentPalette, setCurrentPalette] = useState<Palette>(ALL_PALETTES[0]);
  const [isCustomPalette, setIsCustomPalette] = useState<boolean>(false);
  const [customColors, setCustomColors] = useState<PaletteColor[]>(() =>
    EGA_STANDARD_COLORS.map(([hexColor, name], index) => ({
      index,
      hexNibble: HEX_DIGITS[index],
      name,
      hexColor,
      rgb: hexToRgb(hexColor),
    }))
  );

  // Dithering & Color Engine state
  const [algorithm, setAlgorithm] = useState<DitherAlgorithm>('floyd-steinberg');
  const [ditherIntensity, setDitherIntensity] = useState<number>(0.85);
  const [colorMetric, setColorMetric] = useState<ColorMetric>('perceptual');

  // Pre-processing Adjustments
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 0,
    contrast: 10,
    saturation: 15,
    gamma: 1.0,
    invert: false,
    sharpness: 0.6,
  });

  // Processed Output Data
  const [originalResizedCanvas, setOriginalResizedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load Image Element
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setSourceImgElement(img);
      setOriginalWidth(img.naturalWidth || img.width);
      setOriginalHeight(img.naturalHeight || img.height);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Global Clipboard Paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setImageSrc(event.target.result as string);
                setActiveSampleId('');
              }
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Run Conversion Pipeline
  const runConversion = useCallback(() => {
    if (!sourceImgElement) return;

    try {
      setIsProcessing(true);

      // 1. Resize image onto intermediate canvas
      const resizedCanvas = renderResizedImageToCanvas(
        sourceImgElement,
        width,
        height,
        fitMode,
        resampleFilter
      );
      setOriginalResizedCanvas(resizedCanvas);

      // 2. Determine active colors (custom or selected palette)
      const colors = isCustomPalette ? customColors : currentPalette.colors;

      // 3. Process Dithering & 4-bit Quantization
      const result = processImageToHex4Bit(
        resizedCanvas,
        colors,
        algorithm,
        colorMetric,
        ditherIntensity,
        adjustments
      );

      setProcessedData(result);
    } catch (err) {
      console.error('Error during image processing:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [
    sourceImgElement,
    width,
    height,
    fitMode,
    resampleFilter,
    isCustomPalette,
    customColors,
    currentPalette,
    algorithm,
    colorMetric,
    ditherIntensity,
    adjustments,
  ]);

  // Re-run pipeline whenever dependencies update
  useEffect(() => {
    runConversion();
  }, [runConversion]);

  // Handle Palette Selection
  const handleSelectPalette = (palette: Palette) => {
    if (palette.id === 'custom') {
      setIsCustomPalette(true);
    } else {
      setIsCustomPalette(false);
      setCurrentPalette(palette);
    }
  };

  // Handle Custom Color Tweaks
  const handleUpdateCustomColor = (index: number, newHex: string, newName?: string) => {
    const updated = [...customColors];
    updated[index] = {
      ...updated[index],
      hexColor: newHex.toUpperCase(),
      name: newName || updated[index].name,
      rgb: hexToRgb(newHex),
    };
    setCustomColors(updated);
    setIsCustomPalette(true);
  };

  const handleResetCustomPalette = () => {
    setCustomColors(
      EGA_STANDARD_COLORS.map(([hexColor, name], index) => ({
        index,
        hexNibble: HEX_DIGITS[index],
        name,
        hexColor,
        rgb: hexToRgb(hexColor),
      }))
    );
    setIsCustomPalette(false);
    setCurrentPalette(ALL_PALETTES[0]);
  };

  const handleResetAdjustments = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 1.0,
      invert: false,
      sharpness: 0,
    });
  };

  // Top action: Download .txt immediately
  const handleDownloadTxt = () => {
    if (!processedData) return;
    const activePal = isCustomPalette
      ? {
          id: 'custom-palette',
          name: 'Custom 16-Color Palette',
          category: 'Custom' as const,
          description: 'User-customized 16-color 4-bit palette',
          colors: customColors,
        }
      : currentPalette;

    const content = formatHexData(processedData, activePal, {
      format: 'raw-matrix',
      includeHeader: true,
      uppercase: true,
      lineWrap: 16,
    });

    const filename = `ega-${width}x${height}-${activePal.id}.txt`;
    downloadTextFile(content, filename);
  };

  return (
    <div className="min-h-screen bg-[#0a0c13] text-neutral-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Bar Contract Compliant Header */}
      <Header
        onDownloadTxt={handleDownloadTxt}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        width={width}
        height={height}
        paletteName={isCustomPalette ? 'Custom 16' : currentPalette.name}
      />

      {/* Main Content Viewports */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {activeTab === 'converter' ? (
          <div className="flex flex-col gap-6">
            {/* Top Toolbar: Image Source Picker */}
            <ImageSourceSelector
              activeSampleId={activeSampleId}
              onLoadImage={(url) => {
                setImageSrc(url);
                if (url.includes('sample_pixel_hero')) setActiveSampleId('hero');
                else if (url.includes('sample_retro_scenery')) setActiveSampleId('scenery');
                else if (url.includes('sample_arcade_scene')) setActiveSampleId('arcade');
                else setActiveSampleId('');
              }}
            />

            {/* 16-Color Palette Bar */}
            <PaletteViewer
              currentPalette={
                isCustomPalette
                  ? {
                      id: 'custom',
                      name: 'Custom User Palette',
                      category: 'Custom',
                      description:
                        'Click any swatch to customize its color and create your personal 16-color 4-bit palette.',
                      colors: customColors,
                    }
                  : currentPalette
              }
              onSelectPalette={handleSelectPalette}
              onUpdateCustomColor={handleUpdateCustomColor}
              colorCounts={processedData?.colorCounts}
              totalPixels={width * height}
              isCustomPalette={isCustomPalette}
              onResetCustomPalette={handleResetCustomPalette}
            />

            {/* Split Grid: Left Controls (Dimensions & Dither) + Right Viewport */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Dimensions & Dither Settings */}
              <div className="lg:col-span-4 flex flex-col gap-5">
                <DimensionControls
                  width={width}
                  height={height}
                  onWidthChange={setWidth}
                  onHeightChange={setHeight}
                  lockAspectRatio={lockAspectRatio}
                  onToggleLockAspectRatio={() => setLockAspectRatio(!lockAspectRatio)}
                  fitMode={fitMode}
                  onFitModeChange={setFitMode}
                  resampleFilter={resampleFilter}
                  onResampleFilterChange={setResampleFilter}
                  originalWidth={originalWidth}
                  originalHeight={originalHeight}
                />

                <DitherControls
                  algorithm={algorithm}
                  onAlgorithmChange={setAlgorithm}
                  intensity={ditherIntensity}
                  onIntensityChange={setDitherIntensity}
                  colorMetric={colorMetric}
                  onColorMetricChange={setColorMetric}
                  adjustments={adjustments}
                  onAdjustmentsChange={setAdjustments}
                  onResetAdjustments={handleResetAdjustments}
                />
              </div>

              {/* Right Column: Interactive Canvas Viewport */}
              <div className="lg:col-span-8 flex flex-col gap-5">
                <ViewportCanvas
                  originalCanvas={originalResizedCanvas}
                  processedData={processedData}
                  palette={
                    isCustomPalette
                      ? {
                          id: 'custom',
                          name: 'Custom User Palette',
                          category: 'Custom',
                          description: '',
                          colors: customColors,
                        }
                      : currentPalette
                  }
                  width={width}
                  height={height}
                />
              </div>
            </div>

            {/* Bottom Export Drawer */}
            <HexExportDrawer
              processedData={processedData}
              palette={
                isCustomPalette
                  ? {
                      id: 'custom',
                      name: 'Custom User Palette',
                      category: 'Custom',
                      description: '',
                      colors: customColors,
                    }
                  : currentPalette
              }
              onDownloadTxt={handleDownloadTxt}
              ditherCanvas={originalResizedCanvas}
            />
          </div>
        ) : activeTab === 'palettes' ? (
          <PalettesGuide
            currentPalette={currentPalette}
            onSelectPalette={(pal) => {
              handleSelectPalette(pal);
              setIsCustomPalette(false);
            }}
            onGoToConverter={() => setActiveTab('converter')}
          />
        ) : (
          <FormatGuide />
        )}
      </main>

      {/* Clean, quiet footer */}
      <footer className="border-t border-neutral-800/80 py-4 px-6 text-xs text-neutral-500 flex flex-wrap items-center justify-between gap-4 bg-[#0c0e16]">
        <div className="flex items-center gap-2">
          <span>EGA HexStudio</span>
          <span>·</span>
          <span>4-Bit Color Quantization & Error Diffusion Engine</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Classic IBM EGA 16 Colors (0-F)</span>
          <span>·</span>
          <span>Client-side Canvas Processing</span>
        </div>
      </footer>
    </div>
  );
}
