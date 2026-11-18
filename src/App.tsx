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
import { ColorHistogram } from './components/ColorHistogram';
import { LuminanceMonitor } from './components/LuminanceMonitor';
import { BatchProcessor } from './components/BatchProcessor';
import { PresetManagerModal } from './components/PresetManagerModal';
import {
  ColorMetric,
  CropRegion,
  DitherAlgorithm,
  FitMode,
  ImageAdjustments,
  Palette,
  PaletteColor,
  PresetSettings,
  ProcessedImageData,
  QuickFilterType,
  ResampleFilter,
  UserPreset,
} from './types/palette';
import { ALL_PALETTES, EGA_STANDARD_COLORS, hexToRgb, HEX_DIGITS } from './data/palettes';
import { processImageToHex4Bit, renderResizedImageToCanvas } from './utils/dither';
import { formatHexData, downloadTextFile } from './utils/export';

const DEFAULT_SAMPLE_URL = '/src/assets/images/sample_pixel_hero_1792891947606.jpg';

export default function App() {
  const [activeTab, setActiveTab] = useState<'converter' | 'batch' | 'palettes' | 'export-docs'>('converter');

  // Image source state
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_SAMPLE_URL);
  const [activeSampleId, setActiveSampleId] = useState<string>('hero');
  const [sourceImgElement, setSourceImgElement] = useState<HTMLImageElement | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);

  // Quick Filters state (Pre-quantization image processing presets)
  const [activeFilter, setActiveFilter] = useState<QuickFilterType>('none');
  const [filterStrength, setFilterStrength] = useState<number>(1.0);

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

  // Preset Manager Modal & Active Preset tracking
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string | null>('factory-ega-classic');
  const [activePresetName, setActivePresetName] = useState<string | null>('DOS EGA Gamer');

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
                setCropRegion(null);
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

      // 1. Resize image onto intermediate canvas with custom crop & Quick Filter pre-processing
      const resizedCanvas = renderResizedImageToCanvas(
        sourceImgElement,
        width,
        height,
        fitMode,
        resampleFilter,
        activeFilter,
        filterStrength,
        cropRegion
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
    activeFilter,
    filterStrength,
    cropRegion,
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

  // Handle Reordering Colors in Custom Palette (organizing slots 0 to F)
  const handleReorderCustomColors = (newColors: PaletteColor[]) => {
    const reindexed = newColors.map((color, idx) => ({
      ...color,
      index: idx,
      hexNibble: HEX_DIGITS[idx],
    }));
    setCustomColors(reindexed);
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

  // Apply a selected preset (User or Factory)
  const handleApplyPreset = (preset: UserPreset) => {
    // Dithering & Color Engine
    setAlgorithm(preset.settings.algorithm);
    setDitherIntensity(preset.settings.ditherIntensity);
    setColorMetric(preset.settings.colorMetric);
    setFitMode(preset.settings.fitMode);
    setResampleFilter(preset.settings.resampleFilter);
    setAdjustments(preset.settings.adjustments);

    // Pre-processing Quick Filter
    setActiveFilter(preset.settings.quickFilter || 'none');
    setFilterStrength(preset.settings.filterStrength ?? 1.0);

    // Resolution dimensions if specified in preset
    if (preset.settings.width && preset.settings.height) {
      setWidth(preset.settings.width);
      setHeight(preset.settings.height);
    }

    // Palette loading
    if (preset.settings.isCustomPalette && preset.settings.customColors && preset.settings.customColors.length > 0) {
      setCustomColors(preset.settings.customColors);
      setIsCustomPalette(true);
    } else {
      const found = ALL_PALETTES.find((p) => p.id === preset.settings.paletteId);
      if (found) {
        setCurrentPalette(found);
        setIsCustomPalette(false);
      } else {
        setIsCustomPalette(false);
        setCurrentPalette(ALL_PALETTES[0]);
      }
    }

    setActivePresetId(preset.id);
    setActivePresetName(preset.name);
  };

  const currentPresetSettings: PresetSettings = {
    algorithm,
    ditherIntensity,
    colorMetric,
    fitMode,
    resampleFilter,
    adjustments,
    paletteId: isCustomPalette ? 'custom' : currentPalette.id,
    isCustomPalette,
    customColors: isCustomPalette ? customColors : undefined,
    quickFilter: activeFilter,
    filterStrength,
    width,
    height,
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
        onOpenPresets={() => setIsPresetModalOpen(true)}
        activePresetName={activePresetName}
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
                setCropRegion(null);
                if (url.includes('sample_pixel_hero')) setActiveSampleId('hero');
                else if (url.includes('sample_retro_scenery')) setActiveSampleId('scenery');
                else if (url.includes('sample_arcade_scene')) setActiveSampleId('arcade');
                else setActiveSampleId('');
              }}
              onOpenBatch={() => setActiveTab('batch')}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              filterStrength={filterStrength}
              onFilterStrengthChange={setFilterStrength}
              imageSrc={imageSrc}
              originalWidth={originalWidth}
              originalHeight={originalHeight}
              targetWidth={width}
              targetHeight={height}
              cropRegion={cropRegion}
              onCropChange={setCropRegion}
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
              onReorderCustomColors={handleReorderCustomColors}
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
                  onOpenPresets={() => setIsPresetModalOpen(true)}
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

                <LuminanceMonitor
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
                  totalPixels={width * height}
                />
              </div>
            </div>

            {/* 16-Color Distribution Histogram */}
            <ColorHistogram
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
              totalPixels={width * height}
            />

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
        ) : activeTab === 'batch' ? (
          <BatchProcessor
            currentPalette={
              isCustomPalette
                ? {
                    id: 'custom-palette',
                    name: 'Custom User Palette',
                    category: 'Custom',
                    description: 'User-customized 16-color 4-bit palette',
                    colors: customColors,
                  }
                : currentPalette
            }
            defaultWidth={width}
            defaultHeight={height}
          />
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

      {/* Preset Manager Modal Dialog */}
      <PresetManagerModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        currentSettings={currentPresetSettings}
        currentPaletteName={isCustomPalette ? 'Custom 16' : currentPalette.name}
        onApplyPreset={handleApplyPreset}
        activePresetId={activePresetId}
      />
    </div>
  );
}
