/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, FileCode, Sliders, Palette as PaletteIcon, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onDownloadTxt: () => void;
  activeTab: 'converter' | 'palettes' | 'export-docs';
  setActiveTab: (tab: 'converter' | 'palettes' | 'export-docs') => void;
  width: number;
  height: number;
  paletteName: string;
}

export const Header: React.FC<HeaderProps> = ({
  onDownloadTxt,
  activeTab,
  setActiveTab,
  width,
  height,
  paletteName,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0f121d] border-b border-neutral-800/80 sticky top-0 z-40 backdrop-blur-md">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="/" className="flex items-center gap-2.5 text-slate-100 no-underline">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-mono font-black text-xs text-white shadow-sm ring-1 ring-white/20">
            0-F
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap leading-tight">
              EGA HexStudio
            </span>
            <span className="text-[11px] font-mono text-neutral-400 whitespace-nowrap leading-none mt-0.5">
              4-Bit EGA Palette & Dither Engine
            </span>
          </div>
        </a>
      </div>

      {/* Zone 2: Navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
        <button
          onClick={() => setActiveTab('converter')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'converter'
              ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Converter & Viewport</span>
        </button>
        <button
          onClick={() => setActiveTab('palettes')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'palettes'
              ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          <PaletteIcon className="w-4 h-4" />
          <span>Palettes Reference</span>
        </button>
        <button
          onClick={() => setActiveTab('export-docs')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'export-docs'
              ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Hex 0-F Format Specs</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-xs text-neutral-400 font-mono pr-2">
          <span className="text-neutral-300 font-medium">{width}×{height}</span>
          <span className="text-neutral-600">·</span>
          <span className="text-indigo-300 truncate max-w-[140px]">{paletteName}</span>
        </div>
        <button
          onClick={onDownloadTxt}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
          title="Download 0-F Hex Data as .txt"
        >
          <Download className="w-4 h-4" />
          <span>Download .txt</span>
        </button>
      </div>
    </header>
  );
};
