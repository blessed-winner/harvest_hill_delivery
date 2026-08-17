"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Trash2, Edit3, ChevronLeft, ChevronRight, X, AlertTriangle, CloudUpload, Sparkles, Save, Tag, Plus, Handshake } from 'lucide-react';
import { cn } from '../lib/utils';
import { api, apiRequest } from '../lib/api';
import { useAlert } from '../../../context/AlertContext';
import { ContextualNegotiationPane } from '../../common/components/ContextualNegotiationPane';

const romaTomatoesImage =
  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80';

export default function MySupplies() {
  const { toast } = useAlert();
  const [supplies, setSupplies] = useState<any[]>([]);

  // Filter & modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [dateFilter, setDateFilter] = useState('All Dates');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editSupply, setEditSupply] = useState<any | null>(null);
  const [activeNegotiationSupply, setActiveNegotiationSupply] = useState<any | null>(null);

  // Discount modal state
  const [discountSupply, setDiscountSupply] = useState<any | null>(null);
  const [newDiscountPrice, setNewDiscountPrice] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const handleDiscountClick = (supply: any) => {
    setDiscountSupply(supply);
    setNewDiscountPrice(supply.discount_price ? String(supply.discount_price) : String(Math.round(Number(supply.price) * 0.85)));
  };

  const handleSaveDiscount = async () => {
    if (!discountSupply) return;
    const discPrice = Number(newDiscountPrice);
    if (isNaN(discPrice) || discPrice <= 0 || discPrice >= Number(discountSupply.price)) {
      toast("Discounted price must be greater than 0 and lower than original price", "warning");
      return;
    }
    try {
      setIsApplyingDiscount(true);
      await api.updateSupply(discountSupply.id, {
        is_discounted: true,
        discount_price: discPrice,
      });
      toast("Discount applied! Item will now feature in Flash Deals.", "success");
      setDiscountSupply(null);
      loadSupplies();
    } catch (err) {
      console.error("Failed to apply discount:", err);
      toast("Failed to apply discount.", "error");
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    if (!discountSupply) return;
    try {
      setIsApplyingDiscount(true);
      await api.updateSupply(discountSupply.id, {
        is_discounted: false,
        discount_price: null,
      });
      toast("Discount removed.", "success");
      setDiscountSupply(null);
      loadSupplies();
    } catch (err) {
      console.error("Failed to remove discount:", err);
      toast("Failed to remove discount.", "error");
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  // Edit form state
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editQuality, setEditQuality] = useState('standard');
  const [editNotes, setEditNotes] = useState('');
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Inline Validation Errors
  const [validationErrors, setValidationErrors] = useState<{
    quantity?: string;
    price?: string;
  }>({});

  const getSupplyImage = (supply: any) => {
    if (supply?.photo) return supply.photo;
    const name = String(supply?.product_detail?.name || '').trim().toLowerCase();
    if (name.includes('roma') || name.includes('tomato')) {
      return romaTomatoesImage;
    }
    return supply?.product_detail?.image_url || supply?.product_detail?.image || '';
  };

  async function loadSupplies() {
    try {
      const data = await api.supplies();
      setSupplies((data || []).map((item: any) => ({
        ...item,
        product_detail: {
          ...item.product_detail,
          image: getSupplyImage(item),
        },
      })));
    } catch (err) {
      console.error("Error loading supplies:", err);
      setSupplies([]);
    }
  }

  useEffect(() => {
    loadSupplies();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await api.deleteSupply(deleteConfirmId);
        setSupplies(supplies.filter(s => s.id !== deleteConfirmId));
      } catch (err) {
        console.error("Failed to delete supply record:", err);
        setSupplies(supplies.filter(s => s.id !== deleteConfirmId));
      }
      setDeleteConfirmId(null);
    }
  };

  const [editImages, setEditImages] = useState<any[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [hasImageChanges, setHasImageChanges] = useState(false);

  const handleEditClick = (supply: any) => {
    if (supply.status !== 'pending') {
      toast("Farmers can only update pending harvest submissions.", "warning");
      return;
    }

    setEditSupply(supply);
    setEditQuantity(supply.quantity || '');
    setEditPrice(supply.proposed_price || supply.price || '');
    setEditDate(supply.available_date || '');
    setEditQuality(supply.quality_grade || 'standard');
    setEditNotes(supply.notes || '');
    setEditPhoto(null);
    setHasImageChanges(false);

    const mainPhotoUrl = supply.photo || supply.product_detail?.image || supply.product_detail?.image_url;
    setEditPhotoPreview(mainPhotoUrl || null);

    let initialImgs = Array.isArray(supply.images) ? [...supply.images] : [];
    
    // If supply has a main photo and it's not already in initialImgs, prepend it!
    if (mainPhotoUrl) {
      const exists = initialImgs.some(img => (img.image_url === mainPhotoUrl || img.image === mainPhotoUrl));
      if (!exists) {
        initialImgs.unshift({
          id: 'main',
          image: mainPhotoUrl,
          image_url: mainPhotoUrl
        });
      }
    }

    setEditImages(initialImgs);
    setValidationErrors({});
  };

  const handleOnTheFlyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editSupply || !e.target.files || e.target.files.length === 0) return;
    if (editImages.length >= 5) {
      toast("You can upload a maximum of 5 images.", "warning");
      return;
    }
    const file = e.target.files[0];
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await apiRequest(`/api/supplies/${editSupply.id}/upload-image/`, {
        method: 'POST',
        body: formData
      });
      setEditImages(prev => [...prev, res]);
      setHasImageChanges(true);
      if (!editPhotoPreview) {
        setEditPhotoPreview(res.image_url || res.image);
      }
      loadSupplies();
    } catch (err) {
      console.error("Failed to upload image on the fly:", err);
      toast("Failed to upload image.", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleOnTheFlyDelete = async (imageId: number) => {
    if (!editSupply) return;
    try {
      await apiRequest(`/api/supplies/${editSupply.id}/delete-image/`, {
        method: 'POST',
        body: JSON.stringify({ image_id: imageId })
      });
      const remaining = editImages.filter(img => img.id !== imageId);
      setEditImages(remaining);
      setHasImageChanges(true);
      const deletedImg = editImages.find(img => img.id === imageId);
      if (deletedImg && (editPhotoPreview === deletedImg.image || editPhotoPreview === deletedImg.image_url)) {
        setEditPhotoPreview(remaining[0]?.image_url || remaining[0]?.image || null);
      }
      loadSupplies();
    } catch (err) {
      console.error("Failed to delete image on the fly:", err);
      toast("Failed to delete image.", "error");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSupply) return;

    // Validate inputs
    const qty = Number(editQuantity);
    const priceVal = Number(editPrice);
    
    let hasErrors = false;
    const errors: typeof validationErrors = {};

    if (isNaN(qty) || qty <= 0) {
      errors.quantity = "Quantity must be greater than zero.";
      hasErrors = true;
    }

    if (isNaN(priceVal) || priceVal <= 0) {
      errors.price = "Price must be greater than zero.";
      hasErrors = true;
    }

    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }

    setIsUpdating(true);

    try {
      const payload: Record<string, any> = {
        quantity: qty,
        price: priceVal,
        available_date: editDate || null,
        quality_grade: editQuality,
        notes: editNotes,
      };

      if (editPhoto) {
        payload.photo = editPhoto;
      }

      await api.updateSupply(editSupply.id, payload);
      setEditSupply(null);
      await loadSupplies(); // Reload records
      setValidationErrors({});
    } catch (err) {
      console.error("Failed to update supply record:", err);
      toast("Could not update record. Please check validation limits.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter, dateFilter]);

  // Filter supply array
  const filteredSupplies = supplies.filter(item => {
    const name = item.product_detail?.name || '';
    const sNum = item.supply_number || item.supplyNumber || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          String(item.id).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All Statuses' || item.status.toLowerCase() === statusFilter.toLowerCase();
    
    // Use actual product category from the data
    const category = item.product_detail?.category || 'Other';
    
    const matchesCategory = categoryFilter === 'All Categories' || category === categoryFilter;
    
    const date = new Date(item.created_at || item.available_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const matchesDate = dateFilter === 'All Dates' ||
      (dateFilter === 'Last 7 Days' && diffDays <= 7) ||
      (dateFilter === 'Last 30 Days' && diffDays <= 30) ||
      (dateFilter === 'Last 6 Months' && diffDays <= 180) ||
      (dateFilter === 'Last Year' && diffDays <= 365);

    return matchesSearch && matchesStatus && matchesCategory && matchesDate;
  });

  const totalEntries = filteredSupplies.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const paginatedSupplies = filteredSupplies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedDeleteSupply = supplies.find(s => s.id === deleteConfirmId);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 sm:p-6 space-y-4 sm:space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="font-sans text-xl sm:text-2xl font-extrabold text-primary">My Supplies</h1>
      </div>

      {/* Status Quick Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['All Statuses', 'accepted', 'pending', 'draft'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={cn(
              "px-3.5 py-1.5 rounded-full font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer border",
              statusFilter.toLowerCase() === st.toLowerCase()
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
            )}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant custom-shadow items-stretch sm:items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 rounded-lg border border-outline-variant font-sans text-sm bg-surface-container-low focus:bg-white outline-none transition-all" 
            placeholder="Search supplies..." 
            type="text"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-outline-variant rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-surface-container-low transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-primary"
          >
            <option>All Categories</option>
            <option>Vegetables</option>
            <option>Fruits</option>
            <option>Herbs</option>
            <option>Grains</option>
            <option>Animal-Based</option>
          </select>

          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-outline-variant rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-surface-container-low transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-primary"
          >
            <option>All Dates</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 6 Months</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden custom-shadow w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Product</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Quantity</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Submitted Date</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Status</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Price</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {paginatedSupplies.map((supply) => (
                <tr key={supply.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-outline-variant shrink-0">
                        <img src={getSupplyImage(supply)} alt={supply.product_detail?.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-sans font-bold text-primary">
                          {supply.product_detail?.name}
                        </p>
                        <p className="font-mono text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                          {supply.supply_number || supply.supplyNumber || `SUP-${String(supply.id).slice(0, 6).toUpperCase()}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">
                    {supply.quantity} {supply.unit || supply.product_detail?.unit || 'kg'}
                    {Number(supply.quantity) === 0 ? (
                      <span className="block text-[9px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase mt-1 w-fit">Out of Stock</span>
                    ) : Number(supply.quantity) <= 10 ? (
                      <span className="block text-[9px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded uppercase mt-1 w-fit">Low Stock</span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">{formatDate(supply.created_at || supply.submitted_at)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full font-mono text-[9px] uppercase font-extrabold tracking-widest border",
                      Number(supply.quantity) === 0 ? "bg-red-100 text-red-800 border-red-200" :
                      supply.status === 'accepted' ? "bg-secondary-container text-on-secondary-container border-secondary" :
                      supply.status === 'pending' ? "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary-container" :
                      "bg-surface-container-highest text-on-surface border-outline"
                    )}>
                      {Number(supply.quantity) === 0 ? 'Out of Stock' : supply.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      {supply.is_discounted && supply.discount_price ? (
                        <>
                          <span className="font-mono text-[10px] text-red-600 line-through opacity-75">
                            RWF {Number(supply.price).toLocaleString()}
                          </span>
                          <span className="font-mono text-sm font-bold text-emerald-700">
                            RWF {Number(supply.discount_price).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-sm font-bold text-on-surface">
                          {(() => {
                            const val = Number(supply.proposed_price || supply.price || 0);
                            const rwf = val > 0 && val < 100 ? Math.round(val * 1473.97) : val;
                            return `RWF ${rwf.toLocaleString()}`;
                          })()}
                        </span>
                      )}
                      {supply.is_discounted && (
                        <span className="text-[9px] text-red-600 font-extrabold uppercase tracking-tighter">Discounted</span>
                      )}
                      {!supply.is_discounted && supply.status === 'accepted' && (
                        <span className="text-[9px] text-tertiary font-bold uppercase tracking-tighter">Negotiated</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setActiveNegotiationSupply(supply)}
                        className="p-2 text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Negotiate terms with Harvest Hill"
                      >
                        <Handshake size={16} /> Negotiate
                      </button>
                      <button
                        onClick={() => handleDiscountClick(supply)}
                        className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                        title="Discount item for Flash Deals"
                      >
                        <Tag size={18} />
                      </button>
                      <button 
                        onClick={() => handleEditClick(supply)}
                        disabled={supply.status !== 'pending'}
                        className={cn(
                          "p-2 rounded-lg transition-colors cursor-pointer",
                          supply.status === 'pending'
                            ? "text-primary hover:bg-primary/10"
                            : "text-on-surface-variant/30 cursor-not-allowed opacity-40"
                        )}
                        title={supply.status === 'pending' ? "Edit supply/product details" : "Only pending harvest submissions can be edited"}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(supply.id)}
                        className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete supply"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedSupplies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-on-surface-variant font-medium">
                    No supply records match the current filter selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-6 py-4 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-low">
          <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
            Showing {totalEntries > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-8 h-8 rounded-lg font-mono text-xs flex items-center justify-center transition-all cursor-pointer",
                  currentPage === page 
                    ? "bg-primary text-on-primary shadow-md font-bold" 
                    : "border border-outline-variant bg-white hover:bg-surface-container-high text-on-surface-variant"
                )}
              >
                {page}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Sleek and premium theme-blended delete confirmation dialog */}
      <AnimatePresence>
        {deleteConfirmId && selectedDeleteSupply && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="fixed inset-0 bg-[#144227]/40 z-[60] backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-0 m-auto w-[90vw] max-w-md h-fit bg-white z-[70] rounded-3xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-[#144227] px-6 py-5 flex items-center gap-4 text-white">
                <div className="p-2 bg-white/10 rounded-xl">
                  <AlertTriangle size={22} className="text-[#b6edc2]" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-extrabold tracking-tight">Confirm Deletion</h3>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#b6edc2]/80 mt-0.5">Supply Record {selectedDeleteSupply.supply_number || selectedDeleteSupply.supplyNumber || `SUP-${String(selectedDeleteSupply.id).slice(0, 6).toUpperCase()}`}</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  You are about to permanently delete the supply record for <span className="font-sans font-bold text-[#1c1c18]">{selectedDeleteSupply.product_detail?.name}</span> ({selectedDeleteSupply.quantity} {selectedDeleteSupply.unit}).
                </p>
                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant text-[10px] font-mono text-on-surface-variant uppercase tracking-wide leading-relaxed">
                  Notice: Once deleted, this supply transaction history cannot be recovered.
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-5 py-2.5 rounded-xl border border-[#c1c9c0] text-[#414942] font-extrabold font-sans text-xs hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Keep Record
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-[#8a3333] text-white font-extrabold font-sans text-xs hover:bg-[#732a2a] transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Own Product Update Modal */}
      <AnimatePresence>
        {editSupply && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditSupply(null)}
              className="fixed inset-0 bg-[#144227]/40 z-[60] backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, y: 25, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 25, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-0 m-auto w-[92vw] max-w-lg h-[85vh] bg-white z-[70] rounded-3xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-[#144227] px-6 py-5 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Sparkles size={20} className="text-[#b6edc2]" />
                  </div>
                  <div>
                    <h3 className="font-sans text-base font-extrabold tracking-tight">Update Harvest Supply</h3>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#b6edc2]/80 mt-0.5">{editSupply.product_detail?.name} ({editSupply.supply_number || editSupply.supplyNumber || `SUP-${String(editSupply.id).slice(0, 6).toUpperCase()}`})</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditSupply(null)}
                  className="p-1 text-white/70 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Content (Scrollable Container) */}
              <form onSubmit={handleUpdateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* 1. Quantity & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary font-sans">Harvest Quantity ({editSupply.unit || 'kg'})</label>
                    <input 
                      type="number"
                      required
                      value={editQuantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditQuantity(val);
                        const qNum = Number(val);
                        const unit = (editSupply.unit || 'kg').toLowerCase();
                        if (val) {
                          const err = (isNaN(qNum) || qNum <= 0) ? "Quantity must be greater than zero." : undefined;
                          setValidationErrors(prev => ({ ...prev, quantity: err }));
                        } else {
                          setValidationErrors(prev => ({ ...prev, quantity: undefined }));
                        }
                      }}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-surface-container-low font-sans text-sm focus:border-primary outline-none transition-all",
                        validationErrors.quantity ? "border-error focus:ring-error" : "border-outline-variant"
                      )}
                      placeholder="e.g. 500"
                    />
                    {validationErrors.quantity && (
                      <p className="text-error font-mono text-[10px] uppercase font-bold mt-1 pl-1">
                        {validationErrors.quantity}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary font-sans">Asking Price (RWF per unit)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      value={editPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditPrice(val);
                        const pNum = Number(val);
                        if (val && (isNaN(pNum) || pNum <= 0)) {
                          setValidationErrors(prev => ({ ...prev, price: "Price must be greater than zero." }));
                        } else {
                          setValidationErrors(prev => ({ ...prev, price: undefined }));
                        }
                      }}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-surface-container-low font-sans text-sm focus:border-primary outline-none transition-all",
                        validationErrors.price ? "border-error focus:ring-error" : "border-outline-variant"
                      )}
                      placeholder="e.g. 2.50"
                    />
                    {validationErrors.price && (
                      <p className="text-error font-mono text-[10px] uppercase font-bold mt-1 pl-1">
                        {validationErrors.price}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Ready Date & Quality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary font-sans">Harvest Ready Date</label>
                    <input 
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm focus:border-primary outline-none transition-all cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-primary font-sans">Quality Grade</label>
                    <select 
                      value={editQuality}
                      onChange={(e) => setEditQuality(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="premium">Premium Grade (Top Tier)</option>
                      <option value="standard">Standard Grade (Choice)</option>
                      <option value="economy">Economy Grade (Utility)</option>
                    </select>
                  </div>
                </div>

                {/* 3. Notes */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary font-sans">Description & Seller Notes</label>
                  <textarea 
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm focus:border-primary outline-none transition-all resize-none"
                    placeholder="Add batch notes, organic status details, or packing info..."
                  />
                </div>

                {/* 4. Harvest Photos Grid (Square Divs with Hover Delete & '+' Upload Tile) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-primary font-sans">
                      Harvest Photos ({editImages.length}/5)
                    </label>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      Max 5 photos
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {/* Render each uploaded photo as a square div */}
                    {editImages.map((img: any, idx: number) => (
                      <div 
                        key={img.id || idx} 
                        className="relative aspect-square rounded-2xl border border-outline-variant overflow-hidden bg-surface-container-high group shadow-xs hover:border-primary transition-all select-none"
                      >
                        <img 
                          src={img.image_url || img.image} 
                          alt={`Harvest photo ${idx + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        
                        {/* Top-Right Trash Delete Button (hover visible, permanently deletes from Cloudinary & DB) */}
                        <button
                          type="button"
                          onClick={() => handleOnTheFlyDelete(img.id)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all shadow-md flex items-center justify-center cursor-pointer active:scale-90 z-10"
                          title="Permanently delete photo"
                        >
                          <Trash2 size={12} />
                        </button>

                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 text-[7px] font-bold uppercase tracking-wider bg-[#144227] text-white px-1.5 py-0.5 rounded-md shadow-xs">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Dynamic '+' Square Tile for uploading new photo (shown if < 5 threshold) */}
                    {editImages.length < 5 && (
                      <label className="aspect-square rounded-2xl border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-all group relative">
                        {isUploadingImage ? (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <Plus size={18} />
                            </div>
                            <span className="text-[9px] font-bold text-primary mt-1 group-hover:underline">
                              Add Photo
                            </span>
                          </>
                        )}
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleOnTheFlyUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {(() => {
                  const isFormDirty = editSupply ? (
                    String(editQuantity) !== String(editSupply.quantity || '') ||
                    String(editPrice) !== String(editSupply.proposed_price || editSupply.price || '') ||
                    String(editDate) !== String(editSupply.available_date || '') ||
                    String(editQuality) !== String(editSupply.quality_grade || 'standard') ||
                    String(editNotes) !== String(editSupply.notes || '') ||
                    editPhoto !== null ||
                    hasImageChanges
                  ) : false;

                  return (
                    <div className="pt-4 flex gap-3 justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditSupply(null)}
                        className="px-6 py-2.5 rounded-xl border border-[#c1c9c0] text-[#414942] font-extrabold font-sans text-xs hover:bg-surface-container-low transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!isFormDirty || isUpdating || !!validationErrors.quantity || !!validationErrors.price}
                        className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-extrabold font-sans text-xs shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!isFormDirty ? "No changes made to update" : "Update harvest record"}
                      >
                        {isUpdating ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Save size={16} />
                            Update Harvest
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Discount Modal */}
      <AnimatePresence>
        {discountSupply && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDiscountSupply(null)}
              className="fixed inset-0 bg-[#144227]/40 z-[60] backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="fixed inset-0 m-auto w-[90vw] max-w-md h-fit bg-white z-[70] rounded-3xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3 border-outline-variant">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Tag size={20} />
                  <h3 className="text-base text-on-surface">Discount Supply #{discountSupply.id}</h3>
                </div>
                <button onClick={() => setDiscountSupply(null)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-on-surface-variant font-medium">
                  Set a promotional discounted price for <span className="font-bold text-on-surface">{discountSupply.product_detail?.name}</span>. This item will display with a discount badge in Flash Deals.
                </p>

                <div className="p-3 bg-surface-container-low rounded-xl flex justify-between items-center">
                  <span className="text-[#717971] font-bold">Original Price:</span>
                  <span className="font-mono font-bold text-on-surface">RWF {Number(discountSupply.price).toLocaleString()}</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-extrabold tracking-wider text-[#717971]">
                    New Discounted Price (RWF)
                  </label>
                  <input
                    type="number"
                    value={newDiscountPrice}
                    onChange={(e) => setNewDiscountPrice(e.target.value)}
                    placeholder="Enter discounted price..."
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-bold text-emerald-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {discountSupply.is_discounted && (
                  <button
                    type="button"
                    disabled={isApplyingDiscount}
                    onClick={handleRemoveDiscount}
                    className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 cursor-pointer"
                  >
                    Remove Discount
                  </button>
                )}
                <button
                  type="button"
                  disabled={isApplyingDiscount}
                  onClick={handleSaveDiscount}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-[#376847] transition-all cursor-pointer"
                >
                  Save & Feature in Flash Deals
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ContextualNegotiationPane
        isOpen={!!activeNegotiationSupply}
        onClose={() => setActiveNegotiationSupply(null)}
        contextType="FARMER"
        supply={activeNegotiationSupply}
        currentUserRole="farmer"
        onNegotiationUpdated={() => {
          // Re-fetch supplies to sync accepted quantities/prices
          fetch('/api/supplies/').then(r => r.json()).then(d => {
            if (Array.isArray(d)) setSupplies(d);
            else if (d.results) setSupplies(d.results);
          }).catch(() => {});
        }}
      />
    </motion.div>
  );
}
