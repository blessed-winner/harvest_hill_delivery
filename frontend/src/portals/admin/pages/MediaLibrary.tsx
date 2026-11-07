"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  UploadCloud, 
  Search, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Info, 
  Filter, 
  ArrowUpDown, 
  Package, 
  Check, 
  ExternalLink,
  Copy,
  Image as ImageIcon,
  Loader2,
  Calendar,
  HardDrive
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { useAlert } from '../../../context/AlertContext';

export interface MediaAssetItem {
  id: string;
  file: string;
  url: string;
  file_path: string;
  original_filename: string;
  file_size: number;
  file_size_formatted: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  products_using: Array<{ id: string; name: string }>;
}

const getFullImageUrl = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function MediaLibrary() {
  const { toast, showConfirm } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [usageFilter, setUsageFilter] = useState<'all' | 'in_use' | 'unused'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');

  // Selection & Details
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectAsset, setInspectAsset] = useState<MediaAssetItem | null>(null);

  // In-use warning modal state for forced deletions
  const [deleteModalData, setDeleteModalData] = useState<{
    isOpen: boolean;
    isBulk: boolean;
    singleAsset?: MediaAssetItem;
    inUseCount?: number;
    affectedProducts?: Array<{ id: string; name: string }>;
  }>({ isOpen: false, isBulk: false });

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = await api.media.list({
        search: searchTerm,
        filter: usageFilter !== 'all' ? usageFilter : '',
        ordering: sortBy === 'oldest' ? 'created_at' : (sortBy === 'name' ? 'original_filename' : (sortBy === 'size' ? '-file_size' : '-created_at'))
      });
      const dataList = Array.isArray(res) ? res : (res?.results || []);
      setAssets(dataList);
    } catch (err: any) {
      console.error("Failed to load media assets:", err);
      toast(err.message || "Failed to load media assets.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [usageFilter, sortBy]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      loadMedia();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSyncStorage = async () => {
    try {
      setSyncing(true);
      const res = await api.media.sync();
      toast(res.message || "Media library synchronized successfully.", "success");
      await loadMedia();
    } catch (err: any) {
      console.error("Sync error:", err);
      toast(err.message || "Failed to sync media storage.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const MAX_SIZE = 3 * 1024 * 1024; // 3 MB

    const validFiles: File[] = [];
    for (const f of files) {
      if (f.size > MAX_SIZE) {
        toast(`Image "${f.name}" (${(f.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 3 MB limit.`, "error");
      } else {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    validFiles.forEach(f => formData.append('files', f));

    try {
      setUploading(true);
      const res = await api.media.upload(formData);
      toast(res.message || `Uploaded ${validFiles.length} file(s) successfully.`, "success");
      await loadMedia();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast(err.message || "Failed to upload images.", "error");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const toggleSelectAsset = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map(a => a.id));
    }
  };

  const handleDeleteSingle = async (asset: MediaAssetItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (asset.usage_count > 0) {
      setDeleteModalData({
        isOpen: true,
        isBulk: false,
        singleAsset: asset,
        inUseCount: asset.usage_count,
        affectedProducts: asset.products_using || []
      });
      return;
    }

    const confirmed = await showConfirm(
      "Delete Image",
      `Are you sure you want to permanently delete "${asset.original_filename || 'this image'}" from the Media Library? This action cannot be undone.`,
      { confirmText: "Delete Image", isDanger: true }
    );
    if (!confirmed) return;

    try {
      await api.media.delete(asset.id);
      toast("Image deleted successfully.", "success");
      if (inspectAsset?.id === asset.id) setInspectAsset(null);
      setSelectedIds(prev => prev.filter(id => id !== asset.id));
      loadMedia();
    } catch (err: any) {
      toast(err.message || "Failed to delete image.", "error");
    }
  };

  const handleConfirmForcedDeleteSingle = async () => {
    const asset = deleteModalData.singleAsset;
    if (!asset) return;

    try {
      await api.media.delete(asset.id, true);
      toast("Image deleted and removed from affected products.", "success");
      setDeleteModalData({ isOpen: false, isBulk: false });
      if (inspectAsset?.id === asset.id) setInspectAsset(null);
      setSelectedIds(prev => prev.filter(id => id !== asset.id));
      loadMedia();
    } catch (err: any) {
      toast(err.message || "Failed to delete image.", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const selectedAssets = assets.filter(a => selectedIds.includes(a.id));
    const inUseAssets = selectedAssets.filter(a => a.usage_count > 0);

    if (inUseAssets.length > 0) {
      const affectedProductsMap = new Map<string, string>();
      inUseAssets.forEach(a => {
        (a.products_using || []).forEach(p => affectedProductsMap.set(p.id, p.name));
      });
      const affectedProducts = Array.from(affectedProductsMap.entries()).map(([id, name]) => ({ id, name }));

      setDeleteModalData({
        isOpen: true,
        isBulk: true,
        inUseCount: inUseAssets.length,
        affectedProducts
      });
      return;
    }

    const confirmed = await showConfirm(
      "Delete Selected Images",
      `Are you sure you want to permanently delete ${selectedIds.length} image(s) from the Media Library? This action cannot be undone.`,
      { confirmText: `Delete ${selectedIds.length} Images`, isDanger: true }
    );
    if (!confirmed) return;

    try {
      await api.media.bulkDelete(selectedIds, false);
      toast(`Successfully deleted ${selectedIds.length} image(s).`, "success");
      setSelectedIds([]);
      if (inspectAsset && selectedIds.includes(inspectAsset.id)) setInspectAsset(null);
      loadMedia();
    } catch (err: any) {
      toast(err.message || "Failed to delete images.", "error");
    }
  };

  const handleConfirmForcedBulkDelete = async () => {
    try {
      await api.media.bulkDelete(selectedIds, true);
      toast(`Successfully deleted ${selectedIds.length} image(s) and updated affected products.`, "success");
      setDeleteModalData({ isOpen: false, isBulk: false });
      setSelectedIds([]);
      if (inspectAsset && selectedIds.includes(inspectAsset.id)) setInspectAsset(null);
      loadMedia();
    } catch (err: any) {
      toast(err.message || "Failed to perform bulk delete.", "error");
    }
  };

  const copyImageUrl = (url: string) => {
    const fullUrl = getFullImageUrl(url);
    navigator.clipboard.writeText(fullUrl);
    toast("Image URL copied to clipboard!", "success");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ImageIcon size={18} />
            </div>
            <h1 className="text-xl font-extrabold text-on-surface tracking-tight">Media Library</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {assets.length} {assets.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-medium mt-1">
            Centrally manage, reuse, and upload media files across your product catalog.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSyncStorage}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant/60 hover:bg-surface-container-low text-xs font-bold text-on-surface transition-all cursor-pointer disabled:opacity-50"
            title="Scan media folder for newly added files"
          >
            <RefreshCw size={14} className={cn(syncing && "animate-spin text-primary")} />
            <span>{syncing ? 'Syncing...' : 'Sync Storage'}</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud size={15} />
                <span>Upload Images</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search, Filter, Sort & Bulk Actions */}
      <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              placeholder="Search media by filename or path..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low/60 hover:bg-surface-container-low focus:bg-white rounded-xl text-xs font-medium text-on-surface placeholder:text-on-surface-variant/60 outline-none border border-transparent focus:border-primary/40 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none">
            {/* Usage Filter Pills */}
            <div className="flex items-center bg-surface-container-low rounded-xl p-1 border border-outline-variant/30 text-xs">
              {(['all', 'in_use', 'unused'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setUsageFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer whitespace-nowrap",
                    usageFilter === f ? "bg-white text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {f === 'all' ? 'All Images' : f === 'in_use' ? 'In Use' : 'Unused'}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1.5 rounded-xl border border-outline-variant/30 text-xs text-on-surface font-semibold shrink-0">
              <ArrowUpDown size={13} className="text-on-surface-variant" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none outline-none font-bold text-xs cursor-pointer text-on-surface"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="size">File Size</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs transition-all animate-fadeIn">
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="font-extrabold text-primary hover:underline cursor-pointer"
              >
                {selectedIds.length === assets.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-on-surface font-semibold">
                <strong>{selectedIds.length}</strong> of {assets.length} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1 text-on-surface-variant hover:text-on-surface font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-extrabold shadow-2xs transition-all cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Gallery Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-outline-variant/40 p-16 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-xs font-bold text-on-surface-variant">Loading media assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-outline-variant/40 p-16 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface-variant/40">
            <ImageIcon size={28} />
          </div>
          <h3 className="text-base font-bold text-on-surface">No Media Assets Found</h3>
          <p className="text-xs text-on-surface-variant max-w-sm">
            {searchTerm || usageFilter !== 'all' 
              ? 'No media matches your search query or filter. Try clearing the filter.' 
              : 'Your media library is empty. Upload your first product photos or sync existing files from storage.'}
          </p>
          <div className="flex items-center gap-2 pt-2">
            {(searchTerm || usageFilter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setUsageFilter('all'); }}
                className="px-3.5 py-2 text-xs font-bold border border-outline-variant/60 rounded-xl hover:bg-surface-container-low cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-extrabold bg-primary text-white rounded-xl shadow-xs hover:opacity-90 cursor-pointer flex items-center gap-1.5"
            >
              <UploadCloud size={14} />
              <span>Upload Images</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {assets.map((asset) => {
            const isSelected = selectedIds.includes(asset.id);
            const fullUrl = getFullImageUrl(asset.url);
            const inUse = asset.usage_count > 0;

            return (
              <div
                key={asset.id}
                onClick={() => setInspectAsset(asset)}
                className={cn(
                  "group relative bg-white rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col shadow-2xs hover:shadow-md",
                  isSelected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-outline-variant/40 hover:border-primary/40"
                )}
              >
                {/* Thumbnail Image Container */}
                <div className="relative aspect-square w-full bg-surface-container-lowest overflow-hidden flex items-center justify-center">
                  <img
                    src={fullUrl}
                    alt={asset.original_filename || 'Media'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Selection Checkbox (always visible if selected, or on hover) */}
                  <button
                    type="button"
                    onClick={(e) => toggleSelectAsset(asset.id, e)}
                    className={cn(
                      "absolute top-2 left-2 z-10 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary text-white shadow-sm opacity-100"
                        : "bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 backdrop-blur-xs"
                    )}
                  >
                    {isSelected ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded border border-white/80" />}
                  </button>

                  {/* Usage Badge */}
                  <span
                    className={cn(
                      "absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs flex items-center gap-1 backdrop-blur-xs",
                      inUse
                        ? "bg-emerald-600/90 text-white"
                        : "bg-black/50 text-white/90"
                    )}
                  >
                    {inUse ? `Used (${asset.usage_count})` : 'Unused'}
                  </span>

                  {/* Quick Action Overlay on Hover */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); copyImageUrl(asset.url); }}
                      className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white transition-colors"
                      title="Copy URL"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingle(asset, e)}
                      className="p-1 rounded-md bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                      title="Delete Image"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Info Footer */}
                <div className="p-2.5 space-y-0.5 bg-white border-t border-outline-variant/20 flex-1 flex flex-col justify-between">
                  <p 
                    className="text-xs font-bold text-on-surface truncate" 
                    title={asset.original_filename || asset.file}
                  >
                    {asset.original_filename || asset.file_path.split('/').pop()}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium">
                    <span>{asset.file_size_formatted}</span>
                    <span>{asset.created_at ? new Date(asset.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Inspection Drawer / Modal */}
      {inspectAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-primary" />
                <h3 className="text-sm font-extrabold text-on-surface">Image Details</h3>
              </div>
              <button
                onClick={() => setInspectAsset(null)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Image Preview Container */}
              <div className="relative rounded-2xl overflow-hidden bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center max-h-72">
                <img
                  src={getFullImageUrl(inspectAsset.url)}
                  alt={inspectAsset.original_filename}
                  className="w-full h-full object-contain max-h-72"
                />
              </div>

              {/* File Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-xs">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-on-surface-variant block">Filename</span>
                  <p className="font-bold text-on-surface truncate mt-0.5">{inspectAsset.original_filename || inspectAsset.file}</p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-on-surface-variant block">File Size</span>
                  <p className="font-bold text-on-surface mt-0.5">{inspectAsset.file_size_formatted}</p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-on-surface-variant block">Storage Path</span>
                  <p className="font-mono text-[11px] text-on-surface-variant truncate mt-0.5">{inspectAsset.file_path}</p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-on-surface-variant block">Uploaded Date</span>
                  <p className="font-bold text-on-surface mt-0.5">
                    {inspectAsset.created_at ? new Date(inspectAsset.created_at).toLocaleString() : 'Recently'}
                  </p>
                </div>
              </div>

              {/* Usage & Associated Products */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={14} className="text-primary" />
                    <span>Catalog Products Using This Image ({inspectAsset.usage_count})</span>
                  </span>
                  <span className={cn(
                    "text-[10px] font-extrabold px-2 py-0.5 rounded-full",
                    inspectAsset.usage_count > 0 ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
                  )}>
                    {inspectAsset.usage_count > 0 ? 'In Active Use' : 'Not Currently In Use'}
                  </span>
                </div>

                {inspectAsset.usage_count > 0 ? (
                  <div className="border border-outline-variant/30 rounded-xl divide-y divide-outline-variant/20 overflow-hidden bg-white max-h-40 overflow-y-auto">
                    {inspectAsset.products_using.map(prod => (
                      <div key={prod.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-surface-container-lowest">
                        <span className="font-bold text-on-surface">{prod.name}</span>
                        <span className="text-[10px] text-on-surface-variant font-mono">ID: {prod.id.slice(0, 8)}...</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant bg-surface-container-low/40 p-3 rounded-xl border border-outline-variant/20">
                    This media asset is currently not referenced by any products. Deleting it will safely remove the stored file without affecting existing catalog items.
                  </p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
              <button
                type="button"
                onClick={() => copyImageUrl(inspectAsset.url)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant/60 hover:bg-surface-container-low text-xs font-bold text-on-surface transition-colors cursor-pointer"
              >
                <Copy size={13} />
                <span>Copy URL</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectAsset(null)}
                  className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSingle(inspectAsset)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete Image</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forced Deletion Warning Modal (when image is currently in use) */}
      {deleteModalData.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-amber-300 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-on-surface">
                {deleteModalData.isBulk 
                  ? 'Selected Images are Currently in Use' 
                  : 'Image is Currently in Use by Products'}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {deleteModalData.isBulk
                  ? `${deleteModalData.inUseCount} of the selected images are attached to active catalog products. Deleting them will remove them from those products and permanently erase the files.`
                  : `"${deleteModalData.singleAsset?.original_filename || 'This image'}" is currently used in ${deleteModalData.inUseCount} product(s).`}
              </p>
            </div>

            {deleteModalData.affectedProducts && deleteModalData.affectedProducts.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase block tracking-wider">
                  Affected Catalog Products ({deleteModalData.affectedProducts.length}):
                </span>
                <div className="max-h-32 overflow-y-auto bg-amber-50/60 border border-amber-200 rounded-xl p-2 divide-y divide-amber-100 text-xs">
                  {deleteModalData.affectedProducts.map(p => (
                    <div key={p.id} className="py-1 font-semibold text-amber-950 flex items-center justify-between">
                      <span>• {p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalData({ isOpen: false, isBulk: false })}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant/60 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteModalData.isBulk ? handleConfirmForcedBulkDelete : handleConfirmForcedDeleteSingle}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              >
                Confirm Delete & Detach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
