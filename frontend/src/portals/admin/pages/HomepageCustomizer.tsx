"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, ArrowDown, Eye, EyeOff, Save, RotateCcw, 
  Grid, Layout, CheckCircle2, Plus, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface HomepageSectionConfig {
  id: string;
  title: string;
  category: string;
  itemsPerPage: number;
  rows: number;
  cols: number;
  order: number;
  enabled: boolean;
}

export const DEFAULT_HOMEPAGE_CONFIG: HomepageSectionConfig[] = [
  {
    id: 'featured',
    title: 'Popular now',
    category: 'Popular',
    itemsPerPage: 8,
    rows: 2,
    cols: 4,
    order: 1,
    enabled: true,
  },
  {
    id: 'deals',
    title: 'Fresh Discounts',
    category: 'Deals',
    itemsPerPage: 8,
    rows: 2,
    cols: 4,
    order: 2,
    enabled: true,
  },
  {
    id: 'vegetables_herbs',
    title: 'Fresh Vegetables & Herbs',
    category: 'Vegetables & Herbs',
    itemsPerPage: 12,
    rows: 3,
    cols: 4,
    order: 3,
    enabled: true,
  },
  {
    id: 'fruits',
    title: 'Seasonal Fruits',
    category: 'Fruits',
    itemsPerPage: 8,
    rows: 2,
    cols: 4,
    order: 4,
    enabled: true,
  },
  {
    id: 'dairy',
    title: 'Farm Dairy & Eggs',
    category: 'Dairy',
    itemsPerPage: 8,
    rows: 2,
    cols: 4,
    order: 5,
    enabled: true,
  },
  {
    id: 'grains',
    title: 'Grains & Organic Staples',
    category: 'Grains',
    itemsPerPage: 8,
    rows: 2,
    cols: 4,
    order: 6,
    enabled: true,
  },
];

import { api as adminApi } from '../lib/api';

export function HomepageCustomizer() {
  const [sections, setSections] = useState<HomepageSectionConfig[]>(DEFAULT_HOMEPAGE_CONFIG);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      let loaded = false;
      try {
        const settings = await adminApi.systemSettings.get();
        if (settings?.homepage_sections_config) {
          const remote = settings.homepage_sections_config;
          const parsed = typeof remote === 'string' ? JSON.parse(remote) : remote;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSections(parsed.sort((a: any, b: any) => a.order - b.order));
            localStorage.setItem('homepage_sections_config', JSON.stringify(parsed));
            loaded = true;
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote section settings, using local storage:", err);
      }

      if (!loaded && typeof window !== 'undefined') {
        const saved = localStorage.getItem('homepage_sections_config');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSections(parsed.sort((a, b) => a.order - b.order));
            }
          } catch {}
        }
      }
    }
    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    const reordered = sections.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    setSections(reordered);
    if (typeof window !== 'undefined') {
      localStorage.setItem('homepage_sections_config', JSON.stringify(reordered));
      window.dispatchEvent(new Event('homepage_config_updated'));
    }

    try {
      await adminApi.systemSettings.update({ homepage_sections_config: reordered });
    } catch (err) {
      console.error("Failed to save homepage settings to backend:", err);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefault = async () => {
    setSections(DEFAULT_HOMEPAGE_CONFIG);
    if (typeof window !== 'undefined') {
      localStorage.setItem('homepage_sections_config', JSON.stringify(DEFAULT_HOMEPAGE_CONFIG));
      window.dispatchEvent(new Event('homepage_config_updated'));
    }

    try {
      await adminApi.systemSettings.update({ homepage_sections_config: DEFAULT_HOMEPAGE_CONFIG });
    } catch (err) {
      console.error("Failed to reset homepage settings on backend:", err);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddSection = () => {
    const newId = `section_${Date.now()}`;
    const newSection: HomepageSectionConfig = {
      id: newId,
      title: `New Produce Section ${sections.length + 1}`,
      category: 'Vegetables & Herbs',
      itemsPerPage: 8,
      rows: 2,
      cols: 4,
      order: sections.length + 1,
      enabled: true,
    };
    const updated = [...sections, newSection];
    setSections(updated);
  };

  const handleDeleteSection = (index: number) => {
    const updated = sections.filter((_, idx) => idx !== index);
    const reordered = updated.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    setSections(reordered);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    const reordered = newSections.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    setSections(reordered);
  };

  const updateSection = (index: number, field: keyof HomepageSectionConfig, value: any) => {
    const newSections = [...sections];
    const current = { ...newSections[index], [field]: value };
    
    if (field === 'itemsPerPage') {
      const num = Number(value);
      current.itemsPerPage = num;
      current.rows = Math.ceil(num / (current.cols || 4));
    }
    
    newSections[index] = current;
    setSections(newSections);
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 font-sans text-on-surface">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-outline-variant/40 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Layout size={16} />
            <span>Homepage Section Manager</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">Manage Sections</h1>
          <p className="text-xs text-on-surface-variant mt-1 font-medium">
            Customize homepage section order, display capacity, add custom sections, and map categories.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleAddSection}
            className="px-4 py-2.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            <span>Add New Section</span>
          </button>

          <button
            onClick={handleResetDefault}
            className="px-4 py-2.5 border border-outline-variant text-on-surface-variant hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
          
          <button
            onClick={handleSaveConfig}
            className="px-5 py-2.5 bg-primary text-white hover:opacity-90 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <Save size={15} />
            <span>Save Sections</span>
          </button>
        </div>
      </div>

      {/* Success Toast Banner */}
      {savedSuccess && (
        <div className="bg-[#bceec8] text-[#00210f] border border-[#9ed0ab] p-4 rounded-xl flex items-center justify-between font-medium text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#144227]" />
            <span>Homepage layout settings saved! Changes are live on the website.</span>
          </div>
        </div>
      )}

      {/* Sections Configurator List */}
      <div className="space-y-4">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            className={cn(
              "bg-white rounded-2xl border p-5 transition-all shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5",
              section.enabled ? "border-outline-variant/60" : "border-outline-variant/30 opacity-60 bg-surface-container-low/30"
            )}
          >
            {/* Left Order Controls & Info */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex flex-col gap-1 items-center bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/40">
                <button
                  disabled={idx === 0}
                  onClick={() => moveSection(idx, 'up')}
                  className="p-1 hover:bg-white rounded-lg transition-colors text-on-surface disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  title="Move Up"
                >
                  <ArrowUp size={15} />
                </button>
                <span className="font-mono text-xs font-extrabold text-primary px-1">
                  #{idx + 1}
                </span>
                <button
                  disabled={idx === sections.length - 1}
                  onClick={() => moveSection(idx, 'down')}
                  className="p-1 hover:bg-white rounded-lg transition-colors text-on-surface disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  title="Move Down"
                >
                  <ArrowDown size={15} />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded">
                    Section {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant font-mono">
                    Target: {section.category}
                  </span>
                </div>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(idx, 'title', e.target.value)}
                  className="mt-1 font-bold text-sm sm:text-base text-on-surface bg-surface-container-low border border-outline-variant/40 px-3 py-1.5 rounded-lg focus:bg-white focus:border-primary outline-none min-w-[240px] sm:min-w-[320px]"
                />
              </div>
            </div>

            {/* Middle Configuration Settings */}
            <div className="grid grid-cols-2 gap-3 flex-1 max-w-md">
              {/* Category Target */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Category</label>
                <select
                  value={section.category}
                  onChange={(e) => updateSection(idx, 'category', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="Popular">Popular (Featured)</option>
                  <option value="Deals">Fresh Deals</option>
                  <option value="Vegetables & Herbs">Vegetables & Herbs</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Herbs">Herbs</option>
                  <option value="Dairy">Dairy & Eggs</option>
                  <option value="Grains">Grains & Organic Staples</option>
                  <option value="Animal-Based">Animal-Based / Meat</option>
                  <option value="All">All Products</option>
                </select>
              </div>

              {/* Products Count */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Products Displayed</label>
                <select
                  value={section.itemsPerPage}
                  onChange={(e) => updateSection(idx, 'itemsPerPage', Number(e.target.value))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer"
                >
                  <option value={4}>4 products</option>
                  <option value={8}>8 products</option>
                  <option value={12}>12 products</option>
                  <option value={16}>16 products</option>
                  <option value={20}>20 products</option>
                </select>
              </div>
            </div>

            {/* Right Enable/Disable & Delete Toggles */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={() => updateSection(idx, 'enabled', !section.enabled)}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border",
                  section.enabled
                    ? "bg-[#2D5A3D] text-white border-[#2D5A3D]"
                    : "bg-surface-container-high text-on-surface-variant border-outline-variant"
                )}
              >
                {section.enabled ? (
                  <>
                    <Eye size={14} />
                    <span>Visible</span>
                  </>
                ) : (
                  <>
                    <EyeOff size={14} />
                    <span>Hidden</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSection(idx)}
                className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                title="Remove Section"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
