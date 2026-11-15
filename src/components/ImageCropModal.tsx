/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Crop as CropIcon,
  Check,
  RotateCcw,
  Maximize2,
  AlignCenterHorizontal,
  Lock,
  Unlock,
} from 'lucide-react';
import { CropRegion } from '../types/palette';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  originalWidth: number;
  originalHeight: number;
  targetWidth: number;
  targetHeight: number;
  initialCrop: CropRegion | null;
  onApplyCrop: (crop: CropRegion | null) => void;
}

type DragHandle =
  | 'move'
  | 'draw'
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

type AspectPreset = 'free' | 'target' | '1:1' | '4:3' | '16:9' | '3:2';

const DEFAULT_FULL_CROP: CropRegion = { x: 0, y: 0, width: 1, height: 1 };
const MIN_NORM_SIZE = 0.02;

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  originalWidth,
  originalHeight,
  targetWidth,
  targetHeight,
  initialCrop,
  onApplyCrop,
}) => {
  const imageBoxRef = useRef<HTMLDivElement>(null);

  const [crop, setCrop] = useState<CropRegion>(initialCrop || DEFAULT_FULL_CROP);
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>('free');

  // Dragging state stored in a ref for smooth 60fps pointermove updates
  const dragStateRef = useRef<{
    handle: DragHandle;
    startClientX: number;
    startClientY: number;
    startCrop: CropRegion;
    drawOriginNormX?: number;
    drawOriginNormY?: number;
  } | null>(null);

  const [activeHandle, setActiveHandle] = useState<DragHandle | null>(null);

  // Reset local crop state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCrop(initialCrop || DEFAULT_FULL_CROP);
      setAspectPreset('free');
    }
  }, [isOpen, initialCrop]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const safeOrigW = Math.max(1, originalWidth || 1);
  const safeOrigH = Math.max(1, originalHeight || 1);

  // Convert preset ID into pixel aspect ratio (widthPx / heightPx), or null if free
  const getLockedPixelRatio = useCallback(
    (preset: AspectPreset): number | null => {
      switch (preset) {
        case 'target':
          return Math.max(1, targetWidth) / Math.max(1, targetHeight);
        case '1:1':
          return 1;
        case '4:3':
          return 4 / 3;
        case '16:9':
          return 16 / 9;
        case '3:2':
          return 3 / 2;
        case 'free':
        default:
          return null;
      }
    },
    [targetWidth, targetHeight]
  );

  // Compute maximum centered crop fitting a given pixel aspect ratio
  const applyAspectPreset = (preset: AspectPreset) => {
    setAspectPreset(preset);
    const ratio = getLockedPixelRatio(preset);
    if (!ratio) return;

    // Normalized ratio: (normW * safeOrigW) / (normH * safeOrigH) = ratio
    // => normW / normH = ratio * (safeOrigH / safeOrigW)
    const normRatio = ratio * (safeOrigH / safeOrigW);

    let newW = crop.width;
    let newH = newW / normRatio;

    if (newH > 1) {
      newH = 1;
      newW = newH * normRatio;
    }
    if (newW > 1) {
      newW = 1;
      newH = newW / normRatio;
    }

    // Keep center of current crop, clamped inside [0, 1]
    const cx = crop.x + crop.width / 2;
    const cy = crop.y + crop.height / 2;
    const newX = Math.max(0, Math.min(1 - newW, cx - newW / 2));
    const newY = Math.max(0, Math.min(1 - newH, cy - newH / 2));

    setCrop({
      x: newX,
      y: newY,
      width: Math.max(MIN_NORM_SIZE, newW),
      height: Math.max(MIN_NORM_SIZE, newH),
    });
  };

  // Pointer Move & Up global listeners
  useEffect(() => {
    if (!activeHandle) return;

    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragStateRef.current;
      const box = imageBoxRef.current;
      if (!drag || !box) return;

      const rect = box.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dx = (e.clientX - drag.startClientX) / rect.width;
      const dy = (e.clientY - drag.startClientY) / rect.height;
      const sc = drag.startCrop;

      const pixelRatio = getLockedPixelRatio(aspectPreset);
      const normRatio = pixelRatio ? pixelRatio * (safeOrigH / safeOrigW) : null;

      if (drag.handle === 'move') {
        const nx = Math.max(0, Math.min(1 - sc.width, sc.x + dx));
        const ny = Math.max(0, Math.min(1 - sc.height, sc.y + dy));
        setCrop({ ...sc, x: nx, y: ny });
        return;
      }

      if (drag.handle === 'draw') {
        const ox = drag.drawOriginNormX ?? 0;
        const oy = drag.drawOriginNormY ?? 0;
        const curX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const curY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        let x1 = Math.min(ox, curX);
        let y1 = Math.min(oy, curY);
        let w = Math.max(MIN_NORM_SIZE, Math.abs(curX - ox));
        let h = Math.max(MIN_NORM_SIZE, Math.abs(curY - oy));

        if (normRatio) {
          h = w / normRatio;
          if (curY < oy) {
            y1 = Math.max(0, oy - h);
            h = oy - y1;
            w = h * normRatio;
            if (curX < ox) x1 = Math.max(0, ox - w);
          } else {
            if (y1 + h > 1) {
              h = 1 - y1;
              w = h * normRatio;
              if (curX < ox) x1 = Math.max(0, ox - w);
            }
          }
          if (x1 + w > 1) {
            w = 1 - x1;
            h = w / normRatio;
          }
        }

        setCrop({
          x: Math.max(0, Math.min(1 - MIN_NORM_SIZE, x1)),
          y: Math.max(0, Math.min(1 - MIN_NORM_SIZE, y1)),
          width: Math.max(MIN_NORM_SIZE, Math.min(1 - x1, w)),
          height: Math.max(MIN_NORM_SIZE, Math.min(1 - y1, h)),
        });
        return;
      }

      // Edge / Corner resize handles
      let left = sc.x;
      let top = sc.y;
      let right = sc.x + sc.width;
      let bottom = sc.y + sc.height;

      const h = drag.handle;
      if (h.includes('w')) {
        left = Math.max(0, Math.min(right - MIN_NORM_SIZE, sc.x + dx));
      }
      if (h.includes('e')) {
        right = Math.min(1, Math.max(left + MIN_NORM_SIZE, sc.x + sc.width + dx));
      }
      if (h.includes('n')) {
        top = Math.max(0, Math.min(bottom - MIN_NORM_SIZE, sc.y + dy));
      }
      if (h.includes('s')) {
        bottom = Math.min(1, Math.max(top + MIN_NORM_SIZE, sc.y + sc.height + dy));
      }

      let newW = right - left;
      let newH = bottom - top;

      // Enforce aspect ratio lock if active
      if (normRatio) {
        if (h === 'n' || h === 's') {
          newW = newH * normRatio;
          const cx = (left + right) / 2;
          left = cx - newW / 2;
          if (left < 0) {
            left = 0;
          }
          if (left + newW > 1) {
            left = Math.max(0, 1 - newW);
          }
          if (newW > 1) {
            newW = 1;
            newH = newW / normRatio;
            if (h === 'n') top = bottom - newH;
          }
        } else if (h === 'e' || h === 'w') {
          newH = newW / normRatio;
          const cy = (top + bottom) / 2;
          top = cy - newH / 2;
          if (top < 0) top = 0;
          if (top + newH > 1) top = Math.max(0, 1 - newH);
          if (newH > 1) {
            newH = 1;
            newW = newH * normRatio;
            if (h === 'w') left = right - newW;
          }
        } else {
          // Corner handle: adjust height to match width, clamping to bounds
          newH = newW / normRatio;
          if (h.includes('n')) {
            top = bottom - newH;
            if (top < 0) {
              top = 0;
              newH = bottom;
              newW = newH * normRatio;
              if (h.includes('w')) left = right - newW;
            }
          } else {
            if (top + newH > 1) {
              newH = 1 - top;
              newW = newH * normRatio;
              if (h.includes('w')) left = right - newW;
            }
          }
        }
      }

      setCrop({
        x: Math.max(0, Math.min(1 - MIN_NORM_SIZE, left)),
        y: Math.max(0, Math.min(1 - MIN_NORM_SIZE, top)),
        width: Math.max(MIN_NORM_SIZE, Math.min(1 - left, newW)),
        height: Math.max(MIN_NORM_SIZE, Math.min(1 - top, newH)),
      });
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      setActiveHandle(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeHandle, aspectPreset, getLockedPixelRatio, safeOrigH, safeOrigW]);

  if (!isOpen) return null;

  const startDrag = (handle: DragHandle, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const box = imageBoxRef.current;
    let originX = 0;
    let originY = 0;
    if (box) {
      const rect = box.getBoundingClientRect();
      originX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      originY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    }

    dragStateRef.current = {
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startCrop: { ...crop },
      drawOriginNormX: originX,
      drawOriginNormY: originY,
    };
    setActiveHandle(handle);
  };

  // Derived pixel values for numeric display & manual entry
  const pxX = Math.round(crop.x * safeOrigW);
  const pxY = Math.round(crop.y * safeOrigH);
  const pxW = Math.max(1, Math.round(crop.width * safeOrigW));
  const pxH = Math.max(1, Math.round(crop.height * safeOrigH));

  const isFullImage =
    pxX === 0 &&
    pxY === 0 &&
    Math.abs(pxW - safeOrigW) <= 1 &&
    Math.abs(pxH - safeOrigH) <= 1;

  const updatePixelField = (field: 'x' | 'y' | 'w' | 'h', val: number) => {
    if (Number.isNaN(val)) return;
    let nextX = pxX;
    let nextY = pxY;
    let nextW = pxW;
    let nextH = pxH;

    if (field === 'x') {
      nextX = Math.max(0, Math.min(safeOrigW - 1, Math.round(val)));
      if (nextX + nextW > safeOrigW) nextW = safeOrigW - nextX;
    } else if (field === 'y') {
      nextY = Math.max(0, Math.min(safeOrigH - 1, Math.round(val)));
      if (nextY + nextH > safeOrigH) nextH = safeOrigH - nextY;
    } else if (field === 'w') {
      nextW = Math.max(1, Math.min(safeOrigW - nextX, Math.round(val)));
    } else if (field === 'h') {
      nextH = Math.max(1, Math.min(safeOrigH - nextY, Math.round(val)));
    }

    setAspectPreset('free');
    setCrop({
      x: nextX / safeOrigW,
      y: nextY / safeOrigH,
      width: Math.max(MIN_NORM_SIZE, nextW / safeOrigW),
      height: Math.max(MIN_NORM_SIZE, nextH / safeOrigH),
    });
  };

  const handleCenterCrop = () => {
    setCrop((prev) => ({
      ...prev,
      x: Math.max(0, (1 - prev.width) / 2),
      y: Math.max(0, (1 - prev.height) / 2),
    }));
  };

  const handleReset = () => {
    setAspectPreset('free');
    setCrop(DEFAULT_FULL_CROP);
  };

  const handleConfirm = () => {
    if (isFullImage) {
      onApplyCrop(null);
    } else {
      onApplyCrop(crop);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121624] border border-neutral-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 bg-[#0e121e] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <CropIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Crop Input Image Region
              </h2>
              <p className="text-[11px] text-neutral-400">
                Drag handles or draw a region to crop before resizing &amp; 4-bit dithering.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Cancel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio & Quick Action Toolbar */}
        <div className="px-5 py-2.5 bg-[#151a2b] border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1 mr-1">
              {aspectPreset === 'free' ? (
                <Unlock className="w-3 h-3 text-neutral-400" />
              ) : (
                <Lock className="w-3 h-3 text-amber-400" />
              )}
              <span>Aspect:</span>
            </span>
            {(
              [
                { id: 'free', label: 'Freeform' },
                { id: 'target', label: `Output (${targetWidth}×${targetHeight})` },
                { id: '1:1', label: '1:1' },
                { id: '4:3', label: '4:3' },
                { id: '16:9', label: '16:9' },
                { id: '3:2', label: '3:2' },
              ] as { id: AspectPreset; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => applyAspectPreset(opt.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                  aspectPreset === opt.id
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-[#1a2136] border-neutral-700/70 text-neutral-300 hover:text-white hover:bg-[#232c47]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCenterCrop}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#1a2136] hover:bg-[#232c47] text-neutral-300 hover:text-white border border-neutral-700/70 transition-colors cursor-pointer"
              title="Center current crop box"
            >
              <AlignCenterHorizontal className="w-3 h-3 text-indigo-400" />
              <span>Center</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#1a2136] hover:bg-[#232c47] text-neutral-300 hover:text-white border border-neutral-700/70 transition-colors cursor-pointer"
              title="Reset crop to full image"
            >
              <Maximize2 className="w-3 h-3 text-neutral-400" />
              <span>Full Image</span>
            </button>
          </div>
        </div>

        {/* Interactive Image Stage */}
        <div className="flex-1 bg-[#07090f] p-5 flex items-center justify-center overflow-auto min-h-[280px]">
          <div
            ref={imageBoxRef}
            onPointerDown={(e) => startDrag('draw', e)}
            className="relative inline-block overflow-hidden select-none touch-none border border-neutral-800 shadow-2xl cursor-crosshair"
          >
            <img
              src={imageSrc}
              alt="Crop source preview"
              draggable={false}
              className="block max-w-full max-h-[52vh] w-auto h-auto pointer-events-none select-none"
            />

            {/* Crop Selection Box */}
            <div
              onPointerDown={(e) => startDrag('move', e)}
              className="absolute border-2 border-amber-400 cursor-move"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.width * 100}%`,
                height: `${crop.height * 100}%`,
                boxShadow: '0 0 0 9999px rgba(5, 7, 13, 0.72)',
              }}
            >
              {/* Rule-of-thirds grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />
              </div>

              {/* Dimensions badge inside selection */}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-amber-300 font-mono text-[10px] font-semibold pointer-events-none backdrop-blur-sm border border-amber-500/30">
                {pxW} × {pxH} px
              </div>

              {/* 8 Resize Handles */}
              {/* Corners */}
              <div
                onPointerDown={(e) => startDrag('nw', e)}
                className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border-2 border-[#0b0d14] rounded-sm cursor-nwse-resize shadow"
              />
              <div
                onPointerDown={(e) => startDrag('ne', e)}
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border-2 border-[#0b0d14] rounded-sm cursor-nesw-resize shadow"
              />
              <div
                onPointerDown={(e) => startDrag('sw', e)}
                className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border-2 border-[#0b0d14] rounded-sm cursor-nesw-resize shadow"
              />
              <div
                onPointerDown={(e) => startDrag('se', e)}
                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border-2 border-[#0b0d14] rounded-sm cursor-nwse-resize shadow"
              />

              {/* Edges */}
              <div
                onPointerDown={(e) => startDrag('n', e)}
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-amber-400/90 border border-[#0b0d14] rounded-full cursor-ns-resize"
              />
              <div
                onPointerDown={(e) => startDrag('s', e)}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-amber-400/90 border border-[#0b0d14] rounded-full cursor-ns-resize"
              />
              <div
                onPointerDown={(e) => startDrag('w', e)}
                className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-6 bg-amber-400/90 border border-[#0b0d14] rounded-full cursor-ew-resize"
              />
              <div
                onPointerDown={(e) => startDrag('e', e)}
                className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-6 bg-amber-400/90 border border-[#0b0d14] rounded-full cursor-ew-resize"
              />
            </div>
          </div>
        </div>

        {/* Bottom Precision Coordinates & Action Bar */}
        <div className="px-5 py-3.5 bg-[#0f1320] border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          {/* Numeric pixel coordinates */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-[11px] text-neutral-400 font-mono">
              Source: <strong className="text-neutral-200">{safeOrigW}×{safeOrigH}</strong>
            </span>
            <div className="flex items-center gap-2 font-mono">
              <label className="flex items-center gap-1 text-[11px] text-neutral-400">
                <span>X:</span>
                <input
                  type="number"
                  min={0}
                  max={safeOrigW - 1}
                  value={pxX}
                  onChange={(e) => updatePixelField('x', Number(e.target.value))}
                  className="w-16 px-1.5 py-1 bg-[#171d30] border border-neutral-700 rounded text-neutral-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </label>
              <label className="flex items-center gap-1 text-[11px] text-neutral-400">
                <span>Y:</span>
                <input
                  type="number"
                  min={0}
                  max={safeOrigH - 1}
                  value={pxY}
                  onChange={(e) => updatePixelField('y', Number(e.target.value))}
                  className="w-16 px-1.5 py-1 bg-[#171d30] border border-neutral-700 rounded text-neutral-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </label>
              <label className="flex items-center gap-1 text-[11px] text-neutral-400">
                <span>W:</span>
                <input
                  type="number"
                  min={1}
                  max={safeOrigW - pxX}
                  value={pxW}
                  onChange={(e) => updatePixelField('w', Number(e.target.value))}
                  className="w-16 px-1.5 py-1 bg-[#171d30] border border-neutral-700 rounded text-neutral-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </label>
              <label className="flex items-center gap-1 text-[11px] text-neutral-400">
                <span>H:</span>
                <input
                  type="number"
                  min={1}
                  max={safeOrigH - pxY}
                  value={pxH}
                  onChange={(e) => updatePixelField('h', Number(e.target.value))}
                  className="w-16 px-1.5 py-1 bg-[#171d30] border border-neutral-700 rounded text-neutral-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </label>
            </div>
          </div>

          {/* Confirm / Clear Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {initialCrop && (
              <button
                type="button"
                onClick={() => {
                  onApplyCrop(null);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Crop</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isFullImage ? 'Use Full Image' : 'Apply Crop'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
