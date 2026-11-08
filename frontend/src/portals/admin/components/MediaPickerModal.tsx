"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  Check, 
  UploadCloud, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle2, 
  Info 
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { useAlert } from '../../../context/AlertContext';
import { MediaAssetItem } from '../pages/MediaLibrary';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxSelectable: number;
  alreadyAttachedPaths?: string[];
  onSelectImages: (selected: MediaAssetItem[]) => void;
  title?: string;
  subtitle?: string;
  limitMessage?: string;
}

const getFullImageUrl = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function MediaPickerModal({
  isOpen,
  onClose,
  maxSelectable,
  alreadyAttachedPaths = [],
  onSelectImages,
  title,
  subtitle,
  limitMessage,
}: MediaPickerModalProps) {
  const { toast } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<MediaAssetItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const res = await api.media.list({ search: searchTerm });
      const list = Array.isArray(res) ? res : (res?.results || []);
      setAssets(list);
    } catch (err: any) {
      console.error("Failed to load media in picker:", err);
      toast(err.message || "Failed to load media.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedAssets([]);
      setSearchTerm('');
      loadAssets();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      loadAssets();
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  if (!isOpen) return null;

  const toggleSelect = (asset: MediaAssetItem) => {
    const isAlreadyAttached = alreadyAttachedPaths.some(p => 
      p && (p === asset.file_path || p === asset.file || p.includes(asset.file_path) || asset.file_path.includes(p))
    );
    if (isAlreadyAttached) {
      toast("This image is already selected.", "warning");
      return;
    }

    const isSelected = selectedAssets.some(a => a.id === asset.id);
    if (isSelected) {
      setSelectedAssets(prev => prev.filter(a => a.id !== asset.id));
    } else {
      if (maxSelectable === 1) {
        setSelectedAssets([asset]);
        return;
      }
      if (selectedAssets.length >= maxSelectable) {
        toast(limitMessage || `You can only select up to ${maxSelectable} image(s).`, "warning");
        return;
      }
      setSelectedAssets(prev => [...prev, asset]);
    }
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const MAX_SIZE = 3 * 1024 * 1024;

    const validFiles: File[] = [];
    for (const f of files) {
      if (f.size > MAX_SIZE) {
        toast(`Image "${f.name}" exceeds the 3 MB limit.`, "error");
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
      toast(res.message || "Uploaded to Media Library successfully.", "success");
      await loadAssets();

      // Automatically auto-select newly uploaded assets if slots available
      const uploadedList: MediaAssetItem[] = res.assets || [];
      if (uploadedList.length > 0) {
        setSelectedAssets(prev => {
          const remaining = maxSelectable - prev.length;
          if (remaining > 0) {
            return [...prev, ...uploadedList.slice(0, remaining)];
          }
          return prev;
        });
      }
    } catch (err: any) {
      toast(err.message || "Upload failed.", "error");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleConfirm = () => {
    if (selectedAssets.length === 0) {
      toast("Please select at least one image to attach.", "warning");
      return;
    }
    onSelectImages(selectedAssets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-2">
              <ImageIcon size={18} className="text-primary" />
              <h3 className="text-sm font-extrabold text-on-surface">{title || "Choose from Media Library"}</h3>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {subtitle || (
                <>
                  Select up to <strong className="text-primary">{maxSelectable}</strong> image(s) ({selectedAssets.length} of {maxSelectable} selected).
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar: Search + Quick Upload */}
        <div className="p-4 border-b border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              placeholder="Search images by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-white rounded-xl text-xs font-medium text-on-surface border border-outline-variant/40 outline-none focus:border-primary/50 transition-all"
            />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleQuickUpload}
            multiple
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3.5 py-2 rounded-xl border border-outline-variant/60 hover:bg-white text-xs font-bold text-on-surface flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 size={13} className="animate-spin text-primary" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud size={14} className="text-primary" />
                <span>Upload to Library</span>
              </>
            )}
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="p-6 overflow-y-auto flex-1 min-h-[300px] max-h-[500px]">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center space-y-2">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-xs text-on-surface-variant font-medium">Loading library images...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center space-y-2">
              <ImageIcon size={32} className="text-on-surface-variant/40" />
              <p className="text-xs font-bold text-on-surface">No images found</p>
              <p className="text-[11px] text-on-surface-variant">Upload images or clear your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {assets.map((asset) => {
                const isSelected = selectedAssets.some(a => a.id === asset.id);
                const isAlreadyAttached = alreadyAttachedPaths.some(p => 
                  p && (p === asset.file_path || p === asset.file || p.includes(asset.file_path) || asset.file_path.includes(p))
                );
                const fullUrl = getFullImageUrl(asset.url);

                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleSelect(asset)}
                    className={cn(
                      "group relative rounded-xl overflow-hidden border transition-all cursor-pointer bg-white flex flex-col shadow-2xs select-none",
                      isSelected
                        ? "border-primary ring-2 ring-primary/40 bg-emerald-50/20"
                        : isAlreadyAttached
                          ? "border-outline-variant/30 opacity-50 cursor-not-allowed"
                          : "border-outline-variant/40 hover:border-primary/40 hover:shadow-xs"
                    )}
                  >
                    <div className="relative aspect-square w-full bg-surface-container-lowest overflow-hidden flex items-center justify-center">
                      <img
                        src={fullUrl}
                        alt={asset.original_filename}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
                        loading="lazy"
                      />

                      {/* Selection Checkmark */}
                      <div className={cn(
                        "absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-primary text-white shadow-sm"
                          : isAlreadyAttached
                            ? "bg-gray-700/80 text-white text-[9px] font-bold px-1"
                            : "bg-black/30 text-transparent group-hover:text-white/60"
                      )}>
                        {isSelected ? <Check size={14} /> : isAlreadyAttached ? 'Added' : <div className="w-3 h-3 rounded border border-white" />}
                      </div>

                      {/* Usage tag */}
                      {asset.usage_count > 0 && (
                        <span className="absolute bottom-1.5 left-1.5 bg-black/55 backdrop-blur-xs text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                          Used ({asset.usage_count})
                        </span>
                      )}
                    </div>

                    <div className="p-2 bg-white border-t border-outline-variant/20">
                      <p className="text-[11px] font-bold text-on-surface truncate" title={asset.original_filename}>
                        {asset.original_filename || asset.file_path.split('/').pop()}
                      </p>
                      <span className="text-[9px] text-on-surface-variant font-medium">
                        {asset.file_size_formatted}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
          <span className="text-xs font-semibold text-on-surface-variant">
            {selectedAssets.length === 0 
              ? `Select up to ${maxSelectable} image(s)` 
              : `${selectedAssets.length} image(s) selected`}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedAssets.length === 0}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-40"
            >
              Attach Selected ({selectedAssets.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
