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
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size_desc' | 'size_asc'>('newest');

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
      let orderingParam = '-created_at';
      if (sortBy === 'oldest') orderingParam = 'created_at';
      else if (sortBy === 'name') orderingParam = 'original_filename';
      else if (sortBy === 'size_desc') orderingParam = '-file_size';
      else if (sortBy === 'size_asc') orderingParam = 'file_size';

      const res = await api.media.list({
        search: searchTerm,
        filter: usageFilter !== 'all' ? usageFilter : '',
        ordering: orderingParam
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
    }, 280);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Dynamic counts for filter tabs
  const { inUseCount, unusedCount } = useMemo(() => {
    let inUse = 0;
    let unused = 0;
    for (const a of assets) {
      if (a.usage_count > 0) inUse++;
      else unused++;
    }
    return { inUseCount: inUse, unusedCount: unused };
  }, [assets]);

  const handleSyncStorage = async () => {
    try {
      setSyncing(true);
      const res = await api.media.sync();
      toast(res.message || "Media storage synchronized successfully.", "success");
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
      toast("Image deleted successfully from Media Library.", "success");
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
      toast("Image deleted and detached from affected products.", "success");
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
      toast(`Successfully deleted ${selectedIds.length} image(s) and detached them from affected products.`, "success");
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
    <div className="min-h-full bg-[#f9f9f7] pb-16">
      <div className="max-w-[1560px] mx-auto px-6 sm:px-8 lg:px-10 py-7 space-y-7">
        
        {/* ── 1. Page Header ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E8E4DA] p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                <ImageIcon size={20} />
              </div>
              <h1 className="text-2xl font-extrabold text-[#1C2A1E] tracking-tight">Media Library</h1>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200/80 shadow-2xs">
                {assets.length} {assets.length === 1 ? 'Media Asset' : 'Media Assets'}
              </span>
            </div>
            <p className="text-xs text-[#717971] font-medium leading-relaxed max-w-2xl">
              Browse, manage, and reuse stored product images across your catalog. Reusing library photos prevents duplicate files and saves server storage.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap self-start md:self-auto shrink-0">
            <button
              onClick={handleSyncStorage}
              disabled={syncing || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D5D0C5] hover:bg-[#F5F3ED] text-xs font-bold text-[#1C2A1E] transition-all cursor-pointer shadow-2xs hover:border-primary/50 disabled:opacity-50"
              title="Scan media folder for newly added files on disk"
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
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Upload Images</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── 2. Search, Filter & Bulk Toolbar ─────────────────────── */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E4DA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717971]" />
              <input
                type="text"
                placeholder="Search images by filename or storage path..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-9 bg-[#FAF7F0] hover:bg-[#F5F1E6] focus:bg-white rounded-xl text-xs sm:text-sm font-medium text-[#1C2A1E] placeholder:text-[#8C887B] border border-[#E8E4DA] focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all outline-none shadow-2xs"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717971] hover:text-[#1C2A1E] p-1 rounded-md"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills & Sorting */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-0.5">
              {/* Usage Filter Pills */}
              <div className="flex items-center bg-[#FAF7F0] p-1 rounded-xl border border-[#E8E4DA] text-xs">
                <button
                  onClick={() => setUsageFilter('all')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap",
                    usageFilter === 'all' 
                      ? "bg-white text-primary shadow-xs ring-1 ring-black/5" 
                      : "text-[#717971] hover:text-[#1C2A1E]"
                  )}
                >
                  All Images
                </button>
                <button
                  onClick={() => setUsageFilter('in_use')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap",
                    usageFilter === 'in_use' 
                      ? "bg-white text-primary shadow-xs ring-1 ring-black/5" 
                      : "text-[#717971] hover:text-[#1C2A1E]"
                  )}
                >
                  In Use {usageFilter === 'all' && assets.length > 0 ? `(${inUseCount})` : ''}
                </button>
                <button
                  onClick={() => setUsageFilter('unused')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap",
                    usageFilter === 'unused' 
                      ? "bg-white text-primary shadow-xs ring-1 ring-black/5" 
                      : "text-[#717971] hover:text-[#1C2A1E]"
                  )}
                >
                  Unused {usageFilter === 'all' && assets.length > 0 ? `(${unusedCount})` : ''}
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="h-11 px-3.5 bg-[#FAF7F0] hover:bg-white rounded-xl border border-[#E8E4DA] flex items-center gap-2 text-xs font-bold text-[#1C2A1E] transition-colors cursor-pointer shadow-2xs shrink-0">
                <ArrowUpDown size={14} className="text-[#717971]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none outline-none font-bold text-xs cursor-pointer text-[#1C2A1E]"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="name">Sort: Filename (A-Z)</option>
                  <option value="size_desc">Sort: Size (Largest)</option>
                  <option value="size_asc">Sort: Size (Smallest)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl text-xs transition-all animate-fadeIn">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="font-extrabold text-primary hover:underline cursor-pointer"
                >
                  {selectedIds.length === assets.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-[#1C2A1E] font-semibold">
                  <strong>{selectedIds.length}</strong> of {assets.length} image(s) selected
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 text-[#717971] hover:text-[#1C2A1E] font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-extrabold shadow-2xs transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Image Gallery Grid ─────────────────────────────────── */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E8E4DA] p-20 flex flex-col items-center justify-center text-center space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-xs font-bold text-[#717971]">Loading media assets...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E4DA] p-20 flex flex-col items-center justify-center text-center space-y-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF7F0] flex items-center justify-center text-[#717971]/60">
              <ImageIcon size={32} />
            </div>
            <h3 className="text-base font-extrabold text-[#1C2A1E]">No Media Assets Found</h3>
            <p className="text-xs text-[#717971] max-w-md leading-relaxed">
              {searchTerm || usageFilter !== 'all' 
                ? 'No media matches your search query or filter. Try clearing the filter or checking another search term.' 
                : 'Your media library is currently empty. Upload your first product photos or sync existing files from server storage.'}
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              {(searchTerm || usageFilter !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setUsageFilter('all'); }}
                  className="px-4 py-2.5 text-xs font-bold border border-[#D5D0C5] rounded-xl hover:bg-[#FAF7F0] cursor-pointer transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 text-xs font-extrabold bg-primary text-white rounded-xl shadow-xs hover:opacity-90 cursor-pointer flex items-center gap-2 transition-all"
              >
                <UploadCloud size={15} />
                <span>Upload Images</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(215px,1fr))] gap-5">
            {assets.map((asset) => {
              const isSelected = selectedIds.includes(asset.id);
              const fullUrl = getFullImageUrl(asset.url);
              const inUse = asset.usage_count > 0;

              return (
                <div
                  key={asset.id}
                  onClick={() => setInspectAsset(asset)}
                  className={cn(
                    "group relative bg-white rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-0.5",
                    isSelected
                      ? "border-primary ring-2 ring-primary/40 bg-emerald-50/10"
                      : "border-[#E8E4DA] hover:border-primary/50"
                  )}
                >
                  {/* Thumbnail Image Container */}
                  <div className="relative aspect-square w-full bg-[#FAF7F0] overflow-hidden flex items-center justify-center">
                    <img
                      src={fullUrl}
                      alt={asset.original_filename || 'Media'}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Selection Checkbox (always visible if selected, or on hover) */}
                    <button
                      type="button"
                      onClick={(e) => toggleSelectAsset(asset.id, e)}
                      className={cn(
                        "absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm",
                        isSelected
                          ? "bg-primary text-white opacity-100"
                          : "bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 backdrop-blur-xs"
                      )}
                    >
                      {isSelected ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded border border-white" />}
                    </button>

                    {/* Usage Badge */}
                    <span
                      className={cn(
                        "absolute top-2.5 right-2.5 text-[9.5px] font-extrabold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 backdrop-blur-xs",
                        inUse
                          ? "bg-emerald-700/95 text-white"
                          : "bg-black/50 text-white/95"
                      )}
                    >
                      {inUse ? `Used (${asset.usage_count})` : 'Unused'}
                    </span>

                    {/* Quick Action Overlay on Hover */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/75 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); copyImageUrl(asset.url); }}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                        title="Copy Image URL"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSingle(asset, e)}
                        className="p-1.5 rounded-lg bg-red-600/85 hover:bg-red-600 text-white transition-colors"
                        title="Delete Image"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="p-3.5 space-y-1 bg-white border-t border-[#F0ECE1] flex-1 flex flex-col justify-between">
                    <p 
                      className="text-xs font-bold text-[#1C2A1E] truncate group-hover:text-primary transition-colors leading-snug" 
                      title={asset.original_filename || asset.file}
                    >
                      {asset.original_filename || asset.file_path.split('/').pop()}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-[#717971] font-medium pt-0.5">
                      <span className="font-semibold">{asset.file_size_formatted}</span>
                      <span>{asset.created_at ? new Date(asset.created_at).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 4. Image Detail Drawer / Modal ───────────────────────── */}
        {inspectAsset && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E8E4DA] flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-[#E8E4DA]">
                <div className="flex items-center gap-2.5">
                  <ImageIcon size={18} className="text-primary" />
                  <h3 className="text-base font-extrabold text-[#1C2A1E]">Image Information</h3>
                </div>
                <button
                  onClick={() => setInspectAsset(null)}
                  className="p-1.5 rounded-xl text-[#717971] hover:text-[#1C2A1E] hover:bg-[#FAF7F0] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-7 overflow-y-auto space-y-6">
                {/* Image Preview Container */}
                <div className="relative rounded-2xl overflow-hidden bg-[#FAF7F0] border border-[#E8E4DA] flex items-center justify-center max-h-80 p-2">
                  <img
                    src={getFullImageUrl(inspectAsset.url)}
                    alt={inspectAsset.original_filename}
                    className="w-full h-full object-contain max-h-76 rounded-xl"
                  />
                </div>

                {/* File Metadata Grid */}
                <div className="grid grid-cols-2 gap-3.5 p-4.5 bg-[#FAF7F0] rounded-2xl border border-[#E8E4DA] text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#717971] block tracking-wider">Original Filename</span>
                    <p className="font-bold text-[#1C2A1E] truncate mt-0.5">{inspectAsset.original_filename || inspectAsset.file}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#717971] block tracking-wider">File Size</span>
                    <p className="font-bold text-[#1C2A1E] mt-0.5">{inspectAsset.file_size_formatted}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#717971] block tracking-wider">Storage Path</span>
                    <p className="font-mono text-[11px] text-[#717971] truncate mt-0.5">{inspectAsset.file_path}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#717971] block tracking-wider">Upload Timestamp</span>
                    <p className="font-bold text-[#1C2A1E] mt-0.5">
                      {inspectAsset.created_at ? new Date(inspectAsset.created_at).toLocaleString() : 'Recently'}
                    </p>
                  </div>
                </div>

                {/* Usage & Associated Products */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#1C2A1E] uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={15} className="text-primary" />
                      <span>Associated Products ({inspectAsset.usage_count})</span>
                    </span>
                    <span className={cn(
                      "text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs",
                      inspectAsset.usage_count > 0 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    )}>
                      {inspectAsset.usage_count > 0 ? 'In Active Use' : 'Not Currently In Use'}
                    </span>
                  </div>

                  {inspectAsset.usage_count > 0 ? (
                    <div className="border border-[#E8E4DA] rounded-xl divide-y divide-[#F0ECE1] overflow-hidden bg-white max-h-48 overflow-y-auto">
                      {inspectAsset.products_using.map(prod => (
                        <div key={prod.id} className="p-3 flex items-center justify-between text-xs hover:bg-[#FAF7F0] transition-colors">
                          <span className="font-bold text-[#1C2A1E]">{prod.name}</span>
                          <span className="text-[10px] text-[#717971] font-mono">ID: {prod.id.slice(0, 8)}...</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#717971] bg-[#FAF7F0] p-3.5 rounded-xl border border-[#E8E4DA] leading-relaxed">
                      This media asset is currently not referenced by any catalog products. It can be safely deleted without impacting existing items.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-7 py-5 border-t border-[#E8E4DA] flex items-center justify-between bg-[#FAF7F0]">
                <button
                  type="button"
                  onClick={() => copyImageUrl(inspectAsset.url)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D5D0C5] hover:bg-white text-xs font-bold text-[#1C2A1E] transition-colors cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy Image URL</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setInspectAsset(null)}
                    className="px-4 py-2 text-xs font-bold text-[#717971] hover:text-[#1C2A1E] cursor-pointer transition-colors"
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

        {/* ── 5. Forced Deletion Warning Modal ─────────────────────── */}
        {deleteModalData.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-amber-300 p-6 sm:p-7 space-y-4.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
                <AlertTriangle size={24} />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-extrabold text-[#1C2A1E]">
                  {deleteModalData.isBulk 
                    ? 'Selected Images are Currently in Use' 
                    : 'Image is Currently in Use by Products'}
                </h3>
                <p className="text-xs text-[#717971] leading-relaxed">
                  {deleteModalData.isBulk
                    ? `${deleteModalData.inUseCount} of the selected images are attached to active catalog products. Deleting them will detach them from those products and permanently erase the files.`
                    : `"${deleteModalData.singleAsset?.original_filename || 'This image'}" is currently used in ${deleteModalData.inUseCount} product(s).`}
                </p>
              </div>

              {deleteModalData.affectedProducts && deleteModalData.affectedProducts.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-extrabold text-amber-900 uppercase block tracking-wider">
                    Affected Catalog Products ({deleteModalData.affectedProducts.length}):
                  </span>
                  <div className="max-h-36 overflow-y-auto bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 divide-y divide-amber-100 text-xs">
                    {deleteModalData.affectedProducts.map(p => (
                      <div key={p.id} className="py-1.5 font-semibold text-amber-950 flex items-center justify-between">
                        <span>• {p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalData({ isOpen: false, isBulk: false })}
                  className="flex-1 py-2.5 rounded-xl border border-[#D5D0C5] text-xs font-bold text-[#1C2A1E] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
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
    </div>
  );
}
