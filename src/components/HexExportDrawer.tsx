/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ExportFormat, Palette, ProcessedImageData } from '../types/palette';
import { formatHexData, downloadTextFile, downloadCanvasAsPng } from '../utils/export';
import {
  Download,
  Copy,
  Check,
  FileCode,
  Image as ImageIcon,
  Terminal,
  Settings2,
} from 'lucide-react';

interface HexExportDrawerProps {
  processedData: ProcessedImageData | null;
  palette: Palette;
  onDownloadTxt: () => void;
  ditherCanvas?: HTMLCanvasElement | null;
}

export const HexExportDrawer: React.FC<HexExportDrawerProps> = ({
  processedData,
  palette,
  onDownloadTxt,
  ditherCanvas,
}) => {
  const [format, setFormat] = useState<ExportFormat>('raw-matrix');
  const [includeHeader, setIncludeHeader] = useState<boolean>(true);
  const [uppercase, setUppercase] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Compute formatted text memoized
  const formattedText = useMemo(() => {
    if (!processedData) return '';
    return formatHexData(processedData, palette, {
      format,
      includeHeader,
      uppercase,
      lineWrap: 16,
    });
  }, [processedData, palette, format, includeHeader, uppercase]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadTxtClick = () => {
    if (!processedData) return;
    const filename = `ega-${processedData.width}x${processedData.height}-${palette.id}.txt`;
    downloadTextFile(formattedText, filename);
  };

  const handleDownloadPng = () => {
    if (!processedData) return;
    // Create an offscreen canvas with nearest-neighbor scaling
    const canvas = document.createElement('canvas');
    canvas.width = processedData.width;
    canvas.height = processedData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(processedData.quantizedImageData, 0, 0);
      downloadCanvasAsPng(canvas, `ega-${processedData.width}x${processedData.height}.png`);
    }
  };

  if (!processedData) return null;

  const totalPixels = processedData.width * processedData.height;
  const packedBytesCount = Math.ceil(totalPixels / 2);

  return (
    <div className="bg-[#121624] border border-neutral-800/80 rounded-xl overflow-hidden flex flex-col">
      {/* Header with format tabs & options */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-neutral-800/80 bg-[#161b2c]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
            Export 4-Bit Hex Data (0-F)
          </h3>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e253b] hover:bg-[#283250] text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Copy formatted hex string to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPng}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e253b] hover:bg-[#283250] text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Download scaled pixel art PNG"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handleDownloadTxtClick}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            title="Download hex data as .txt file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .txt</span>
          </button>
        </div>
      </div>

      {/* Format selector buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0f121d] border-b border-neutral-800/80">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'raw-matrix', label: 'Raw Hex (0-F Rows)' },
            { id: 'delimited-space', label: 'Spaced' },
            { id: 'delimited-comma', label: 'Comma' },
            { id: 'packed-hex', label: 'Packed Bytes (0x..)' },
            { id: 'c-array', label: 'C / C++ Array' },
            { id: 'qbasic-ports', label: 'QBasic (OUT &H3C8/9)' },
            { id: 'qbasic', label: 'QBasic DATA' },
            { id: 'assembly', label: 'x86 Assembly' },
            { id: 'json', label: 'JSON' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id as ExportFormat)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                format === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 bg-[#161a29]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-4 text-xs text-neutral-300">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHeader}
              onChange={(e) => setIncludeHeader(e.target.checked)}
              className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
            />
            <span>Include Info Header</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
            />
            <span className="font-mono">Uppercase (0-F)</span>
          </label>
        </div>
      </div>

      {/* Text Preview Box */}
      <div className="relative">
        <div className="max-h-72 overflow-auto p-4 bg-[#080a10] font-mono text-xs text-neutral-300 leading-relaxed select-text">
          <pre className="font-mono whitespace-pre">{formattedText}</pre>
        </div>

        {/* Stats overlay badge */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#121624] border-t border-neutral-800/80 text-[11px] text-neutral-400 font-mono">
          <div className="flex items-center gap-3">
            <span>
              Format: <strong className="text-neutral-200">{format}</strong>
            </span>
            <span className="text-neutral-600">·</span>
            <span>
              Lines: <strong className="text-neutral-200">{processedData.height}</strong>
            </span>
            <span className="text-neutral-600">·</span>
            <span>
              Characters per line: <strong className="text-neutral-200">{processedData.width}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Raw: <strong className="text-neutral-200">{totalPixels.toLocaleString()} hex chars</strong>
            </span>
            <span className="text-neutral-600">·</span>
            <span>
              Packed: <strong className="text-indigo-400">{packedBytesCount.toLocaleString()} bytes</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
