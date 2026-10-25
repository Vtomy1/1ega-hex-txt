/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react';

interface SampleItem {
  id: string;
  name: string;
  url: string;
  tag: string;
}

const SAMPLES: SampleItem[] = [
  {
    id: 'hero',
    name: 'Cyberpunk Hero',
    url: '/src/assets/images/sample_pixel_hero_1792891947606.jpg',
    tag: '1:1 Portrait',
  },
  {
    id: 'scenery',
    name: 'Sunset Lake & Pines',
    url: '/src/assets/images/sample_retro_scenery_1792891948685.jpg',
    tag: '4:3 Scenery',
  },
  {
    id: 'arcade',
    name: 'Synth Console',
    url: '/src/assets/images/sample_arcade_scene_1792891949358.jpg',
    tag: '16:9 Arcade',
  },
];

interface ImageSourceSelectorProps {
  onLoadImage: (imgUrl: string) => void;
  activeSampleId?: string;
}

export const ImageSourceSelector: React.FC<ImageSourceSelectorProps> = ({
  onLoadImage,
  activeSampleId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onLoadImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onLoadImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="bg-[#121624] border border-neutral-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3"
    >
      {/* Upload button & drop instructions */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1e253b] hover:bg-[#283250] text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span>Upload Image</span>
        </button>

        <span className="hidden sm:inline text-[11px] text-neutral-400">
          Drop any image or paste (<kbd className="font-mono text-neutral-300">Ctrl+V</kbd>)
        </span>
      </div>

      {/* Preset sample images */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Samples:</span>
        </span>
        <div className="flex items-center gap-1.5">
          {SAMPLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onLoadImage(sample.url)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                activeSampleId === sample.id
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-[#181e30] border-neutral-700/60 text-neutral-300 hover:text-white hover:bg-[#202840]'
              }`}
              title={`Load ${sample.name} (${sample.tag})`}
            >
              <img
                src={sample.url}
                alt={sample.name}
                referrerPolicy="no-referrer"
                className="w-4 h-4 rounded object-cover"
              />
              <span className="truncate max-w-[80px] sm:max-w-none">{sample.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
