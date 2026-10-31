/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BatchExportOptions, BatchImageItem, ExportFormat, Palette, ProcessedImageData } from '../types/palette';

export interface ExportOptions {
  format: ExportFormat;
  includeHeader: boolean;
  uppercase: boolean;
  lineWrap: number; // For assembly/C arrays, bytes per row
}

/**
 * Format the processed 4-bit data according to format requirements
 */
export function formatHexData(
  processed: ProcessedImageData,
  palette: Palette,
  options: ExportOptions
): string {
  const { width, height, hexMatrix, indexMatrix } = processed;
  const { format, includeHeader, uppercase } = options;

  let header = '';
  if (includeHeader) {
    const paletteMap = palette.colors
      .map((c) => `${c.hexNibble}=${c.hexColor} (${c.name})`)
      .join(', ');

    header = [
      `; ==========================================================`,
      `; EGA 4-BIT HEX IMAGE EXPORT`,
      `; Width: ${width} px`,
      `; Height: ${height} px`,
      `; Total Pixels: ${width * height}`,
      `; Palette: ${palette.name} (${palette.colors.length} Colors)`,
      `; Unique Colors Used: ${processed.uniqueColorCount} / 16`,
      `; Color Map: ${paletteMap}`,
      `; Export Format: ${format}`,
      `; Generated with EGA HexStudio`,
      `; ==========================================================`,
      '',
    ].join('\n');
  }

  let body = '';

  switch (format) {
    case 'raw-matrix': {
      // 1 line per pixel row, 1 hex digit per pixel
      const rows = hexMatrix.map((row) => {
        const line = row.join('');
        return uppercase ? line.toUpperCase() : line.toLowerCase();
      });
      body = rows.join('\n');
      break;
    }

    case 'delimited-space': {
      const rows = hexMatrix.map((row) => {
        const line = row.join(' ');
        return uppercase ? line.toUpperCase() : line.toLowerCase();
      });
      body = rows.join('\n');
      break;
    }

    case 'delimited-comma': {
      const rows = hexMatrix.map((row) => {
        const line = row.join(', ');
        return uppercase ? line.toUpperCase() : line.toLowerCase();
      });
      body = rows.join('\n');
      break;
    }

    case 'packed-hex': {
      // 2 pixels per byte (High nibble = Pixel 0, Low nibble = Pixel 1)
      const bytes: string[] = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x += 2) {
          const highNibble = indexMatrix[y * width + x] & 0x0f;
          const lowNibble = x + 1 < width ? indexMatrix[y * width + x + 1] & 0x0f : 0x00;
          const byteVal = (highNibble << 4) | lowNibble;
          const byteHex = '0x' + byteVal.toString(16).padStart(2, '0');
          bytes.push(uppercase ? byteHex.toUpperCase() : byteHex.toLowerCase());
        }
      }

      // Format in neat rows of 16 bytes
      const lines: string[] = [];
      const bytesPerRow = 16;
      for (let i = 0; i < bytes.length; i += bytesPerRow) {
        lines.push(bytes.slice(i, i + bytesPerRow).join(', '));
      }
      body = lines.join(',\n');
      break;
    }

    case 'c-array': {
      // Packed C/C++ array
      const bytes: string[] = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x += 2) {
          const highNibble = indexMatrix[y * width + x] & 0x0f;
          const lowNibble = x + 1 < width ? indexMatrix[y * width + x + 1] & 0x0f : 0x00;
          const byteVal = (highNibble << 4) | lowNibble;
          bytes.push('0x' + byteVal.toString(16).padStart(2, '0'));
        }
      }

      const rowLength = Math.ceil(width / 2);
      const lines: string[] = [];
      lines.push(`// EGA 4-Bit Packed Bitmap: ${width}x${height} (${bytes.length} bytes)`);
      lines.push(`#define IMAGE_WIDTH ${width}`);
      lines.push(`#define IMAGE_HEIGHT ${height}`);
      lines.push(`const unsigned char image_data[${bytes.length}] = {`);

      for (let i = 0; i < bytes.length; i += rowLength) {
        const rowBytes = bytes.slice(i, i + rowLength);
        lines.push(`  /* row ${(i / rowLength).toString().padStart(3, ' ')} */ ${rowBytes.join(', ')},`);
      }
      lines.push('};');
      body = lines.join('\n');
      break;
    }

    case 'qbasic-ports': {
      // Complete standalone QBasic 1.1 / QuickBASIC 4.5 runnable program with OUT &H3C8/&H3C9 hardware ports
      const lines: string[] = [];
      let screenMode = 12;
      if (width <= 320 && height <= 200) screenMode = 7;
      else if (width <= 640 && height <= 350) screenMode = 9;

      lines.push(`' ======================================================================`);
      lines.push(`' QBASIC 1.1 / QUICKBASIC 4.5 EXECUTABLE IMAGE & PALETTE PROGRAM`);
      lines.push(`' Target Resolution: ${width} x ${height} (16 Colors, 4-Bit Hex 0-F)`);
      lines.push(`' Palette: ${palette.name}`);
      lines.push(`' Hardware I/O Ports:`);
      lines.push(`'   Port &H3C8: VGA DAC Pel Write Address (Color Index 0-15)`);
      lines.push(`'   Port &H3C9: VGA DAC Pel Data Register (Red, Green, Blue in 0-63)`);
      lines.push(`' ======================================================================`);
      lines.push(`DEFINT A-Z`);
      lines.push(`SCREEN ${screenMode}`);
      lines.push(`CLS`);
      lines.push(``);
      lines.push(`' ----------------------------------------------------------------------`);
      lines.push(`' 1. PROGRAM 16-COLOR PALETTE VIA HARDWARE I/O PORTS &H3C8 AND &H3C9`);
      lines.push(`' ----------------------------------------------------------------------`);
      lines.push(`RESTORE PaletteDACData`);
      lines.push(`FOR i = 0 TO 15`);
      lines.push(`    READ r, g, b`);
      lines.push(`    OUT &H3C8, i`);
      lines.push(`    OUT &H3C9, r`);
      lines.push(`    OUT &H3C9, g`);
      lines.push(`    OUT &H3C9, b`);
      lines.push(`NEXT i`);
      lines.push(``);
      lines.push(`' ----------------------------------------------------------------------`);
      lines.push(`' 2. DRAW 4-BIT HEX PIXELS (0-F) ON SCREEN`);
      lines.push(`' ----------------------------------------------------------------------`);
      lines.push(`RESTORE ImageData`);
      lines.push(`FOR y = 0 TO ${height - 1}`);
      lines.push(`    READ row$`);
      lines.push(`    FOR x = 0 TO ${width - 1}`);
      lines.push(`        h$ = MID$(row$, x + 1, 1)`);
      lines.push(`        c = INSTR("0123456789ABCDEF", UCASE$(h$)) - 1`);
      lines.push(`        IF c >= 0 THEN PSET (x, y), c`);
      lines.push(`    NEXT x`);
      lines.push(`NEXT y`);
      lines.push(``);
      lines.push(`' Wait for keypress then restore text mode`);
      lines.push(`DO WHILE INKEY$ = "": LOOP`);
      lines.push(`SCREEN 0: WIDTH 80: CLS`);
      lines.push(`END`);
      lines.push(``);
      lines.push(`' ----------------------------------------------------------------------`);
      lines.push(`' 16-COLOR PALETTE DATA (6-Bit DAC Values: 0-63 per R, G, B channel)`);
      lines.push(`' ----------------------------------------------------------------------`);
      lines.push(`PaletteDACData:`);
      palette.colors.forEach((c) => {
        const [r8, g8, b8] = c.rgb;
        const r6 = Math.floor(r8 / 4);
        const g6 = Math.floor(g8 / 4);
        const b6 = Math.floor(b8 / 4);
        const hexStr = c.hexColor;
        lines.push(`DATA ${r6.toString().padStart(2, ' ')}, ${g6.toString().padStart(2, ' ')}, ${b6.toString().padStart(2, ' ')} ' Color ${c.hexNibble}: ${c.name} (${hexStr})`);
      });
      lines.push(``);
      lines.push(`' ----------------------------------------------------------------------`);
      lines.push(`' IMAGE 4-BIT HEX DATA (${height} lines of ${width} chars)`);
      lines.push(`' ----------------------------------------------------------------------`);
      lines.push(`ImageData:`);
      for (let y = 0; y < height; y++) {
        const rowStr = hexMatrix[y].join('');
        const lineText = uppercase ? rowStr.toUpperCase() : rowStr.toLowerCase();
        lines.push(`DATA "${lineText}"`);
      }
      body = lines.join('\n');
      break;
    }

    case 'qbasic': {
      // QuickBASIC DATA statements + Subroutine for OUT &H3C8/&H3C9 ports
      const lines: string[] = [];
      lines.push(`' QBasic 4-Bit Hex Image: ${width}x${height} (${palette.name})`);
      lines.push(`' Hardware Palette Setup Routine using I/O Ports:`);
      lines.push(`SUB SetPalettePorts`);
      lines.push(`    OUT &H3C8, 0 ' Start at color 0`);
      palette.colors.forEach((c) => {
        const [r8, g8, b8] = c.rgb;
        const r6 = Math.floor(r8 / 4);
        const g6 = Math.floor(g8 / 4);
        const b6 = Math.floor(b8 / 4);
        lines.push(`    OUT &H3C9, ${r6}: OUT &H3C9, ${g6}: OUT &H3C9, ${b6} ' ${c.hexNibble}: ${c.hexColor} ${c.name}`);
      });
      lines.push(`END SUB`);
      lines.push(``);
      lines.push(`' Image Hex Rows (0-F):`);
      for (let y = 0; y < height; y++) {
        const rowStr = hexMatrix[y].join('');
        const lineText = uppercase ? rowStr.toUpperCase() : rowStr.toLowerCase();
        lines.push(`DATA "${lineText}"`);
      }
      body = lines.join('\n');
      break;
    }

    case 'assembly': {
      // x86 assembly db directives
      const bytes: string[] = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x += 2) {
          const highNibble = indexMatrix[y * width + x] & 0x0f;
          const lowNibble = x + 1 < width ? indexMatrix[y * width + x + 1] & 0x0f : 0x00;
          const byteVal = (highNibble << 4) | lowNibble;
          bytes.push('0' + byteVal.toString(16).padStart(2, '0') + 'h');
        }
      }

      const lines: string[] = [];
      lines.push(`; EGA 4-bit Packed Image: ${width}x${height}`);
      lines.push(`IMAGE_W EQU ${width}`);
      lines.push(`IMAGE_H EQU ${height}`);
      lines.push(`image_bytes:`);

      const bytesPerRow = 16;
      for (let i = 0; i < bytes.length; i += bytesPerRow) {
        const slice = bytes.slice(i, i + bytesPerRow);
        lines.push(`  db ${slice.join(', ')}`);
      }
      body = lines.join('\n');
      break;
    }

    case 'json': {
      const exportObj = {
        metadata: {
          app: 'EGA HexStudio',
          width,
          height,
          totalPixels: width * height,
          paletteId: palette.id,
          paletteName: palette.name,
          uniqueColorsUsed: processed.uniqueColorCount,
        },
        palette: palette.colors.map((c) => ({
          index: c.index,
          nibble: c.hexNibble,
          hex: c.hexColor,
          name: c.name,
        })),
        hexRows: hexMatrix.map((row) => {
          const r = row.join('');
          return uppercase ? r.toUpperCase() : r.toLowerCase();
        }),
      };
      body = JSON.stringify(exportObj, null, 2);
      break;
    }
  }

  return header ? `${header}\n${body}` : body;
}

/**
 * Triggers a browser download of text data as a .txt file
 */
export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain;charset=utf-8'
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download canvas render as a PNG
 */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL('image/png');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Format multiple processed images into a single combined .txt file,
 * with filenames and dimensions included in comments.
 */
export function formatBatchHexData(
  items: BatchImageItem[],
  palette: Palette,
  options: BatchExportOptions
): string {
  const completedItems = items.filter((item) => item.status === 'done' && item.processed);
  if (completedItems.length === 0) {
    return '; No processed images in batch.';
  }

  const { format, commentStyle, includeGlobalHeader, includeFileStats, uppercase } = options;

  const prefix =
    commentStyle === 'c-slash'
      ? '// '
      : commentStyle === 'hash'
      ? '# '
      : commentStyle === 'rem'
      ? "' "
      : '; ';

  const dividerHeavy = `${prefix}======================================================================`;
  const dividerLight = `${prefix}----------------------------------------------------------------------`;

  // Special JSON batch handling
  if (format === 'json') {
    const jsonOutput = {
      batchMetadata: {
        tool: 'EGA HexStudio Batch Processor',
        totalImages: completedItems.length,
        exportedAt: new Date().toISOString(),
        palette: {
          id: palette.id,
          name: palette.name,
          colors: palette.colors.map((c) => ({
            index: c.index,
            nibble: c.hexNibble,
            hex: c.hexColor,
            name: c.name,
          })),
        },
      },
      images: completedItems.map((item) => {
        const proc = item.processed!;
        return {
          filename: item.filename,
          width: proc.width,
          height: proc.height,
          totalPixels: proc.width * proc.height,
          uniqueColorsUsed: proc.uniqueColorCount,
          hexRows: proc.hexMatrix.map((row) => {
            const str = row.join('');
            return uppercase ? str.toUpperCase() : str.toLowerCase();
          }),
        };
      }),
    };
    return JSON.stringify(jsonOutput, null, 2);
  }

  const sections: string[] = [];

  // Global Header
  if (includeGlobalHeader) {
    sections.push([
      dividerHeavy,
      `${prefix}EGA 4-BIT HEX BATCH EXPORT - COMBINED DATA`,
      `${prefix}Total Processed Images: ${completedItems.length}`,
      `${prefix}Active Palette: ${palette.name} (${palette.colors.length} Colors)`,
      `${prefix}Output Format: ${format}`,
      `${prefix}Generated by EGA HexStudio (0-F 4-Bit Hex Engine)`,
      dividerHeavy,
      '',
    ].join('\n'));
  }

  // Iterate over each processed image file
  completedItems.forEach((item, index) => {
    const proc = item.processed!;
    const sanitizedId = item.filename
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '') || `image_${index + 1}`;

    const fileHeaderLines: string[] = [
      dividerLight,
      `${prefix}IMAGE [${index + 1}/${completedItems.length}] - FILE: ${item.filename}`,
    ];

    if (includeFileStats) {
      fileHeaderLines.push(
        `${prefix}Dimensions: ${proc.width} x ${proc.height} pixels (${proc.width * proc.height} total pixels)`,
        `${prefix}Unique 4-Bit Colors Used: ${proc.uniqueColorCount} / 16`,
        `${prefix}Identifier: ${sanitizedId}`
      );
    }
    fileHeaderLines.push(dividerLight);

    // Format single image body
    let itemBody = '';
    if (format === 'c-array') {
      const bytes: string[] = [];
      for (let y = 0; y < proc.height; y++) {
        for (let x = 0; x < proc.width; x += 2) {
          const highNibble = proc.indexMatrix[y * proc.width + x] & 0x0f;
          const lowNibble = x + 1 < proc.width ? proc.indexMatrix[y * proc.width + x + 1] & 0x0f : 0x00;
          const byteVal = (highNibble << 4) | lowNibble;
          bytes.push('0x' + byteVal.toString(16).padStart(2, '0'));
        }
      }
      const rowLength = Math.ceil(proc.width / 2);
      const lines: string[] = [];
      lines.push(`// Bitmap: ${item.filename} (${proc.width}x${proc.height}, ${bytes.length} bytes)`);
      lines.push(`#define ${sanitizedId.toUpperCase()}_WIDTH ${proc.width}`);
      lines.push(`#define ${sanitizedId.toUpperCase()}_HEIGHT ${proc.height}`);
      lines.push(`const unsigned char ${sanitizedId}_data[${bytes.length}] = {`);
      for (let i = 0; i < bytes.length; i += rowLength) {
        const rowBytes = bytes.slice(i, i + rowLength);
        lines.push(`  /* row ${(i / rowLength).toString().padStart(3, ' ')} */ ${rowBytes.join(', ')},`);
      }
      lines.push('};');
      itemBody = lines.join('\n');
    } else if (format === 'assembly') {
      const bytes: string[] = [];
      for (let y = 0; y < proc.height; y++) {
        for (let x = 0; x < proc.width; x += 2) {
          const highNibble = proc.indexMatrix[y * proc.width + x] & 0x0f;
          const lowNibble = x + 1 < proc.width ? proc.indexMatrix[y * proc.width + x + 1] & 0x0f : 0x00;
          const byteVal = (highNibble << 4) | lowNibble;
          bytes.push('0' + byteVal.toString(16).padStart(2, '0') + 'h');
        }
      }
      const lines: string[] = [];
      lines.push(`${sanitizedId.toUpperCase()}_W EQU ${proc.width}`);
      lines.push(`${sanitizedId.toUpperCase()}_H EQU ${proc.height}`);
      lines.push(`${sanitizedId}_bytes:`);
      const bytesPerRow = 16;
      for (let i = 0; i < bytes.length; i += bytesPerRow) {
        const slice = bytes.slice(i, i + bytesPerRow);
        lines.push(`  db ${slice.join(', ')}`);
      }
      itemBody = lines.join('\n');
    } else if (format === 'qbasic' || format === 'qbasic-ports') {
      const lines: string[] = [];
      lines.push(`' Image: ${item.filename} (${proc.width}x${proc.height})`);
      lines.push(`${sanitizedId}Data:`);
      for (let y = 0; y < proc.height; y++) {
        const rowStr = proc.hexMatrix[y].join('');
        const lineText = uppercase ? rowStr.toUpperCase() : rowStr.toLowerCase();
        lines.push(`DATA "${lineText}"`);
      }
      itemBody = lines.join('\n');
    } else {
      itemBody = formatHexData(proc, palette, {
        format,
        includeHeader: false,
        uppercase,
        lineWrap: options.lineWrap || 16,
      });
    }

    sections.push(`${fileHeaderLines.join('\n')}\n${itemBody}\n`);
  });

  return sections.join('\n');
}
