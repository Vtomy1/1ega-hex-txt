/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Bookmark,
  Plus,
  Search,
  Trash2,
  Copy,
  Download,
  Upload,
  Check,
  Sliders,
  Palette as PaletteIcon,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
  Wand2,
} from 'lucide-react';
import {
  UserPreset,
  PresetSettings,
  Palette,
  PaletteColor,
  DitherAlgorithm,
  QuickFilterType,
  ImageAdjustments,
} from '../types/palette';
import { ALL_PALETTES } from '../data/palettes';
import {
  FACTORY_PRESETS,
  loadUserPresets,
  saveUserPreset,
  deleteUserPreset,
  exportPresetsToJson,
  importPresetsFromJson,
} from '../utils/presets';

interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: PresetSettings;
  currentPaletteName: string;
  onApplyPreset: (preset: UserPreset) => void;
  activePresetId?: string | null;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  currentPaletteName,
  onApplyPreset,
  activePresetId,
}) => {
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'user' | 'factory'>('all');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [includeDimensions, setIncludeDimensions] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load presets whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setUserPresets(loadUserPresets());
      setNewPresetName(`Preset ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setNewPresetDescription('');
      setIsSavingNew(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Combine user presets and factory presets
  const allPresets = useMemo(() => {
    return [...userPresets, ...FACTORY_PRESETS];
  }, [userPresets]);

  // Filter presets
  const filteredPresets = useMemo(() => {
    return allPresets.filter((p) => {
      if (activeCategoryFilter === 'user' && p.category !== 'User') return false;
      if (activeCategoryFilter === 'factory' && p.category !== 'Factory') return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.settings.paletteId.toLowerCase().includes(q) ||
        p.settings.algorithm.toLowerCase().includes(q)
      );
    });
  }, [allPresets, activeCategoryFilter, searchQuery]);

  if (!isOpen) return null;

  // Handle saving current settings as a new user preset
  const handleSaveCurrentAsPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPreset: UserPreset = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: newPresetName.trim(),
      description: newPresetDescription.trim(),
      category: 'User',
      createdAt: Date.now(),
      settings: {
        ...currentSettings,
        width: includeDimensions ? currentSettings.width : undefined,
        height: includeDimensions ? currentSettings.height : undefined,
      },
    };

    const updated = saveUserPreset(newPreset);
    setUserPresets(updated);
    setIsSavingNew(false);
    showToast(`Preset "${newPreset.name}" saved!`);
  };

  // Handle deleting a preset
  const handleDeletePreset = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete preset "${name}"?`)) {
      const updated = deleteUserPreset(id);
      setUserPresets(updated);
      showToast(`Deleted "${name}"`);
    }
  };

  // Handle duplicating any preset as user preset
  const handleDuplicatePreset = (preset: UserPreset) => {
    const duplicated: UserPreset = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${preset.name} (Copy)`,
      description: preset.description || '',
      category: 'User',
      createdAt: Date.now(),
      settings: JSON.parse(JSON.stringify(preset.settings)),
    };
    const updated = saveUserPreset(duplicated);
    setUserPresets(updated);
    showToast(`Created duplicate: "${duplicated.name}"`);
  };

  // Handle overwriting user preset with current settings
  const handleOverwritePreset = (preset: UserPreset) => {
    if (confirm(`Overwrite preset "${preset.name}" with your current settings?`)) {
      const updatedPreset: UserPreset = {
        ...preset,
        settings: {
          ...currentSettings,
          width: preset.settings.width !== undefined ? currentSettings.width : undefined,
          height: preset.settings.height !== undefined ? currentSettings.height : undefined,
        },
      };
      const updated = saveUserPreset(updatedPreset);
      setUserPresets(updated);
      showToast(`Updated "${preset.name}" with current settings!`);
    }
  };

  // Handle file import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const res = importPresetsFromJson(content);
      if (res.success) {
        setUserPresets(loadUserPresets());
        showToast(`Successfully imported ${res.count} presets!`);
      } else {
        alert(res.error || 'Failed to import presets.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper to render mini color swatches for a preset
  const renderMiniPaletteSwatches = (paletteId: string, isCustom: boolean, customColors?: PaletteColor[]) => {
    let colors: string[] = [];
    if (isCustom && customColors && customColors.length > 0) {
      colors = customColors.slice(0, 10).map((c) => c.hexColor);
    } else {
      const found = ALL_PALETTES.find((p) => p.id === paletteId);
      if (found) {
        colors = found.colors.slice(0, 10).map((c) => c.hexColor);
      }
    }

    if (colors.length === 0) return null;

    return (
      <div className="flex items-center gap-0.5 rounded overflow-hidden p-0.5 bg-neutral-900 border border-neutral-700/60 shrink-0">
        {colors.map((hex, idx) => (
          <div
            key={idx}
            className="w-2.5 h-3.5 first:rounded-l-sm last:rounded-r-sm"
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121624] border border-neutral-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-[#0e121e] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Preset Manager</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded border border-neutral-700">
                  {allPresets.length} Presets Available
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Save, load, and share your dither algorithms, image adjustments, quick filters, and 16-color palettes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close Preset Manager (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-indigo-600/95 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shrink-0 shadow-md animate-in slide-in-from-top">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              {toastMessage}
            </span>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Current Active Settings Bar */}
        <div className="bg-[#151928] border-b border-neutral-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 font-medium">Currently Configured:</span>
            <span className="font-mono text-indigo-300 font-semibold px-2 py-0.5 bg-indigo-950/60 border border-indigo-800/60 rounded">
              {currentPaletteName}
            </span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-300 capitalize">{currentSettings.algorithm} ({Math.round(currentSettings.ditherIntensity * 100)}%)</span>
            {currentSettings.quickFilter !== 'none' && (
              <>
                <span className="text-neutral-500">·</span>
                <span className="text-amber-300 capitalize">Filter: {currentSettings.quickFilter}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isSavingNew ? (
              <button
                onClick={() => setIsSavingNew(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save Current as Preset</span>
              </button>
            ) : (
              <button
                onClick={() => setIsSavingNew(false)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Save Current as New Preset Form Drawer */}
        {isSavingNew && (
          <form
            onSubmit={handleSaveCurrentAsPreset}
            className="p-5 bg-[#181d2f] border-b border-indigo-500/30 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-400" />
                <span>Save Current Setup to User Presets</span>
              </h3>
              <span className="text-[11px] text-neutral-400">Stores dither settings, image adjustments, quick filter & palette</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Preset Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. My Vintage Sierra Dither"
                  className="w-full px-3 py-2 bg-[#0e121d] border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  placeholder="e.g. Optimized for pixel art portraits with sharp borders"
                  className="w-full px-3 py-2 bg-[#0e121d] border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300 select-none">
                <input
                  type="checkbox"
                  checked={includeDimensions}
                  onChange={(e) => setIncludeDimensions(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 text-indigo-600 focus:ring-indigo-500 bg-neutral-900"
                />
                <span>Also lock resolution dimensions ({currentSettings.width}×{currentSettings.height})</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSavingNew(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Preset</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Controls Toolbar: Search, Filters, and JSON Actions */}
        <div className="p-4 sm:px-6 bg-[#0f1320] border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search presets by name, palette, algorithm..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#171b29] border border-neutral-700/80 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-[#171b29] p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                activeCategoryFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All ({allPresets.length})
            </button>
            <button
              onClick={() => setActiveCategoryFilter('user')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                activeCategoryFilter === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              My Presets ({userPresets.length})
            </button>
            <button
              onClick={() => setActiveCategoryFilter('factory')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                activeCategoryFilter === 'factory'
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Factory ({FACTORY_PRESETS.length})
            </button>
          </div>

          {/* Import / Export actions */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium border border-neutral-700/60 transition-colors cursor-pointer"
              title="Import Presets from JSON file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>

            <button
              onClick={() => exportPresetsToJson(userPresets)}
              disabled={userPresets.length === 0}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                userPresets.length > 0
                  ? 'bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 border-neutral-700/60'
                  : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
              }`}
              title={userPresets.length > 0 ? "Export all User Presets to JSON" : "Save at least one User Preset to export"}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON ({userPresets.length})</span>
            </button>
          </div>
        </div>

        {/* Presets List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 min-h-[300px]">
          {filteredPresets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400 gap-3 border border-dashed border-neutral-800 rounded-xl my-auto">
              <Bookmark className="w-10 h-10 text-neutral-600 stroke-[1.5]" />
              <div className="flex flex-col">
                <span className="font-semibold text-neutral-300">No Presets Found</span>
                <span className="text-xs text-neutral-500 mt-0.5">
                  {searchQuery
                    ? `No presets match "${searchQuery}".`
                    : activeCategoryFilter === 'user'
                    ? "You haven't saved any user presets yet. Click 'Save Current as Preset' above!"
                    : 'No presets available.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPresets.map((preset) => {
                const isUser = preset.category === 'User';
                const isActive = activePresetId === preset.id;
                const paletteObj = ALL_PALETTES.find((p) => p.id === preset.settings.paletteId);
                const paletteDisplayName = preset.settings.isCustomPalette
                  ? 'Custom 16-Color'
                  : paletteObj?.name || preset.settings.paletteId;

                return (
                  <div
                    key={preset.id}
                    className={`group relative p-4 rounded-xl border flex flex-col justify-between gap-3.5 transition-all ${
                      isActive
                        ? 'bg-[#181d33] border-indigo-500 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/30'
                        : 'bg-[#151928] border-neutral-800 hover:border-neutral-700 hover:bg-[#181c2d]'
                    }`}
                  >
                    {/* Top Row: Category badge & Name */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
                              isUser
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                            }`}
                          >
                            {preset.category}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500 text-white font-bold animate-pulse">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Swatches preview */}
                        {renderMiniPaletteSwatches(
                          preset.settings.paletteId,
                          preset.settings.isCustomPalette,
                          preset.settings.customColors
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {preset.name}
                      </h4>
                      {preset.description && (
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      )}
                    </div>

                    {/* Middle specs tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-neutral-300">
                      {/* Palette */}
                      <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-300 truncate max-w-[170px]">
                        🎨 {paletteDisplayName}
                      </span>

                      {/* Dither algorithm */}
                      <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-300 capitalize">
                        ⚡ {preset.settings.algorithm} ({Math.round(preset.settings.ditherIntensity * 100)}%)
                      </span>

                      {/* Quick Filter */}
                      {preset.settings.quickFilter && preset.settings.quickFilter !== 'none' && (
                        <span className="px-2 py-0.5 bg-amber-950/40 border border-amber-800/50 rounded text-amber-300 capitalize">
                          ✨ {preset.settings.quickFilter}
                        </span>
                      )}

                      {/* Dimensions if locked */}
                      {preset.settings.width && preset.settings.height && (
                        <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-400">
                          📐 {preset.settings.width}×{preset.settings.height}
                        </span>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {isUser ? (
                          <>
                            <button
                              onClick={() => handleOverwritePreset(preset)}
                              className="p-1.5 text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                              title="Overwrite this preset with current settings"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicatePreset(preset)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                              title="Duplicate as new preset"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePreset(preset.id, preset.name)}
                              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                              title="Delete preset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDuplicatePreset(preset)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                            title="Make an editable copy in My Presets"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy to User</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          onApplyPreset(preset);
                          showToast(`Loaded preset "${preset.name}"!`);
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                            : 'bg-neutral-800 hover:bg-indigo-600 text-neutral-200 hover:text-white'
                        }`}
                      >
                        <span>{isActive ? 'Re-Apply' : 'Load Preset'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-[#0d101a] border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span>User presets are securely stored in your browser's local storage.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
