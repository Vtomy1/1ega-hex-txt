/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

export const FormatGuide: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 py-6 px-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          <span>Technical Reference</span>
          <span className="text-neutral-600">·</span>
          <span>4-Bit Nibble (0-F) Data Structures</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          4-Bit EGA Hex (0-F) Specification & Decoding Guide
        </h1>
        <p className="text-sm text-neutral-400 max-w-3xl leading-relaxed">
          In 4-bit graphics systems, each pixel corresponds to an index from 0 to 15 (hexadecimal <code className="text-indigo-300 font-mono">0</code> through <code className="text-indigo-300 font-mono">F</code>). Because 4 bits form one nibble, two pixels pack into exactly one 8-bit byte.
        </p>
      </div>

      {/* Hex Mapping Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IBM EGA Standard */}
        <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>IBM EGA 16-Color BIOS Table</span>
            <span className="text-[11px] font-mono text-indigo-400">Standard RGBI</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-neutral-700/80 text-neutral-400">
                  <th className="py-1.5 px-2">Nibble</th>
                  <th className="py-1.5 px-2">Dec</th>
                  <th className="py-1.5 px-2">Color</th>
                  <th className="py-1.5 px-2">Hex</th>
                  <th className="py-1.5 px-2">Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {[
                  { hex: '0', dec: '0', color: '#000000', name: 'Black' },
                  { hex: '1', dec: '1', color: '#0000AA', name: 'Dark Blue' },
                  { hex: '2', dec: '2', color: '#00AA00', name: 'Dark Green' },
                  { hex: '3', dec: '3', color: '#00AAAA', name: 'Dark Cyan' },
                  { hex: '4', dec: '4', color: '#AA0000', name: 'Dark Red' },
                  { hex: '5', dec: '5', color: '#AA00AA', name: 'Dark Magenta' },
                  { hex: '6', dec: '6', color: '#AA5500', name: 'Brown' },
                  { hex: '7', dec: '7', color: '#AAAAAA', name: 'Light Gray' },
                  { hex: '8', dec: '8', color: '#555555', name: 'Dark Gray' },
                  { hex: '9', dec: '9', color: '#5555FF', name: 'Light Blue' },
                  { hex: 'A', dec: '10', color: '#55FF55', name: 'Light Green' },
                  { hex: 'B', dec: '11', color: '#55FFFF', name: 'Light Cyan' },
                  { hex: 'C', dec: '12', color: '#FF5555', name: 'Light Red' },
                  { hex: 'D', dec: '13', color: '#FF55FF', name: 'Light Magenta' },
                  { hex: 'E', dec: '14', color: '#FFFF55', name: 'Yellow' },
                  { hex: 'F', dec: '15', color: '#FFFFFF', name: 'Bright White' },
                ].map((row) => (
                  <tr key={row.hex} className="hover:bg-[#161c2d]">
                    <td className="py-1.5 px-2 font-bold text-indigo-400">{row.hex}</td>
                    <td className="py-1.5 px-2">{row.dec}</td>
                    <td className="py-1.5 px-2">
                      <span
                        className="w-3.5 h-3.5 rounded ring-1 ring-white/20 inline-block shadow-inner"
                        style={{ backgroundColor: row.color }}
                      />
                    </td>
                    <td className="py-1.5 px-2 text-neutral-400">{row.color}</td>
                    <td className="py-1.5 px-2 text-neutral-200">{row.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 16-Level Grayscale */}
        <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>16-Level Linear Grayscale Table</span>
            <span className="text-[11px] font-mono text-emerald-400">4-Bit Monochrome</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-neutral-700/80 text-neutral-400">
                  <th className="py-1.5 px-2">Nibble</th>
                  <th className="py-1.5 px-2">Dec</th>
                  <th className="py-1.5 px-2">Shade</th>
                  <th className="py-1.5 px-2">Hex</th>
                  <th className="py-1.5 px-2">Intensity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {[
                  { hex: '0', dec: '0', color: '#000000', label: '0% (Black)' },
                  { hex: '1', dec: '1', color: '#111111', label: '7%' },
                  { hex: '2', dec: '2', color: '#222222', label: '13%' },
                  { hex: '3', dec: '3', color: '#333333', label: '20%' },
                  { hex: '4', dec: '4', color: '#444444', label: '27%' },
                  { hex: '5', dec: '5', color: '#555555', label: '33%' },
                  { hex: '6', dec: '6', color: '#666666', label: '40%' },
                  { hex: '7', dec: '7', color: '#777777', label: '47%' },
                  { hex: '8', dec: '8', color: '#888888', label: '53%' },
                  { hex: '9', dec: '9', color: '#999999', label: '60%' },
                  { hex: 'A', dec: '10', color: '#AAAAAA', label: '67%' },
                  { hex: 'B', dec: '11', color: '#BBBBBB', label: '73%' },
                  { hex: 'C', dec: '12', color: '#CCCCCC', label: '80%' },
                  { hex: 'D', dec: '13', color: '#DDDDDD', label: '87%' },
                  { hex: 'E', dec: '14', color: '#EEEEEE', label: '93%' },
                  { hex: 'F', dec: '15', color: '#FFFFFF', label: '100% (White)' },
                ].map((row) => (
                  <tr key={row.hex} className="hover:bg-[#161c2d]">
                    <td className="py-1.5 px-2 font-bold text-emerald-400">{row.hex}</td>
                    <td className="py-1.5 px-2">{row.dec}</td>
                    <td className="py-1.5 px-2">
                      <span
                        className="w-3.5 h-3.5 rounded ring-1 ring-white/20 inline-block shadow-inner"
                        style={{ backgroundColor: row.color }}
                      />
                    </td>
                    <td className="py-1.5 px-2 text-neutral-400">{row.color}</td>
                    <td className="py-1.5 px-2 text-neutral-200">{row.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Code snippets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>QBasic Palette Programming via OUT Ports (&H3C8 / &H3C9)</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            In MS-DOS QBasic / QuickBASIC, custom RGB palettes are sent to the VGA DAC registers through hardware I/O ports. VGA DAC takes 6-bit channel values (<code className="text-amber-300 font-mono">0–63</code>), converted from 8-bit RGB by integer division (<code className="text-amber-300 font-mono">rgb \ 4</code>):
          </p>
          <pre className="p-3 bg-[#080a10] rounded-lg font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed">
{`' Set DAC Color Index to 0 (Port &H3C8)
OUT &H3C8, 0

' Send Red, Green, Blue bytes (0-63 each) to Port &H3C9
FOR i = 0 TO 15
    READ r, g, b
    OUT &H3C8, i        ' Target DAC register index
    OUT &H3C9, r \\ 4   ' Red (0-63)
    OUT &H3C9, g \\ 4   ' Green (0-63)
    OUT &H3C9, b \\ 4   ' Blue (0-63)
NEXT i`}
          </pre>
        </div>

        <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>C / C++ Packed Nibble Unpacking</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Because each 4-bit pixel takes half a byte (one nibble), 2 adjacent pixels are packed into one 8-bit byte. Extract with simple bit shifts:
          </p>
          <pre className="p-3 bg-[#080a10] rounded-lg font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed">
{`// 1 byte contains two 4-bit pixels
uint8_t byte = 0x1F; // Left = 1 (Blue), Right = F (White)

// Extract High Nibble (Left pixel)
uint8_t pixel_left  = (byte >> 4) & 0x0F; // -> 1

// Extract Low Nibble (Right pixel)
uint8_t pixel_right = byte & 0x0F;        // -> 15 (0xF)`}
          </pre>
        </div>

        <div className="bg-[#121624] border border-neutral-800/80 rounded-xl p-5 flex flex-col gap-3 md:col-span-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Python Reading .txt Export (Single or Batch)</span>
          </div>
          <pre className="p-3 bg-[#080a10] rounded-lg font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed">
{`# 1. Single file reading:
with open("ega-image.txt") as f:
    lines = [line.strip() for line in f if not line.startswith(";")]

# Parse 0-F character into 0-15 integers
pixel_matrix = [[int(char, 16) for char in row] for row in lines]

# 2. Batch combined file reading with filename comments:
# Lines starting with '; FILE: <filename>' demarcate individual images
images = {}
current_file = None

with open("batch-ega-4bit-export.txt") as f:
    for line in f:
        line = line.strip()
        if "FILE:" in line:
            current_file = line.split("FILE:")[1].strip()
            images[current_file] = []
        elif line and not line.startswith(";") and current_file:
            images[current_file].append([int(ch, 16) for ch in line])`}
          </pre>
        </div>
      </div>
    </div>
  );
};
