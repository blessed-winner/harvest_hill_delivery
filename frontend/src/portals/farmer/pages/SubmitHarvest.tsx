"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Bolt, ArrowRight, X, Calendar as CalendarIcon, Verified, Star, Package, TrendingUp, CloudUpload, Send, Leaf, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useAlert } from '../../../context/AlertContext';

type DemandProduct = {
  id: number;
  name: string;
  category: string;
  unit: string;
  base_price?: string | number;
  image?: string | null;
  image_url?: string | null;
  quantity_needed?: string | number | null;
  urgency?: 'high' | 'steady' | string;
  description?: string;
};

type HarvestFormState = {
  quantity: string;
  availableDate: string;
  askingPrice: string;
  qualityGrade: 'premium' | 'standard' | 'economy';
  notes: string;
  photo: File | null;
  customProductName?: string;
  customCategory?: string;
  customUnit?: string;
  bulkMinQty?: string;
  bulkPrice?: string;
};

const initialFormState: HarvestFormState = {
  quantity: '',
  availableDate: new Date().toISOString().slice(0, 10),
  askingPrice: '',
  qualityGrade: 'premium',
  notes: '',
  photo: null,
  customProductName: '',
  customCategory: 'Vegetables',
  customUnit: 'kg',
  bulkMinQty: '',
  bulkPrice: '',
};

const referenceProductImages: Record<string, string> = {
  'Roma Tomatoes':
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
  'Durum Wheat':
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80',
  'Iceberg Lettuce':
    'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=500&auto=format&fit=crop&q=80',
  'Russet Potatoes':
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
};

const getReferenceImage = (name: string) => {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes('roma') || normalized.includes('tomato')) return referenceProductImages['Roma Tomatoes'];
  if (normalized.includes('durum whe')) return referenceProductImages['Durum Wheat'];
  if (normalized.includes('iceberg')) return referenceProductImages['Iceberg Lettuce'];
  if (normalized.includes('russet')) return referenceProductImages['Russet Potatoes'];

  return '';
};

const getBadgeMeta = (name: string, urgency?: string) => {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes('roma') || normalized.includes('tomato') || urgency === 'high') {
    return {
      label: 'High Urgency',
      className: 'bg-error text-white',
    };
  }

  if (normalized.includes('durum') || normalized.includes('wheat')) {
    return {
      label: 'Medium Demand',
      className: 'bg-tertiary-container text-on-tertiary-container',
    };
  }

  if (normalized.includes('iceberg')) {
    return {
      label: 'Seasonal Pick',
      className: 'bg-primary text-white',
    };
  }

  return null;
};

interface SubmitHarvestProps {
  preselectedProduct?: any | null;
  clearPreselected?: () => void;
}

export default function SubmitHarvest({ preselectedProduct, clearPreselected }: SubmitHarvestProps = {}) {
  const { toast } = useAlert();
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [demands, setDemands] = useState<DemandProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<HarvestFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Local currency conversion toggles per product ID
  const [convertedProducts, setConvertedProducts] = useState<Record<number, boolean>>({});

  // Inline Validation Errors
  const [validationErrors, setValidationErrors] = useState<{
    quantity?: string;
    askingPrice?: string;
    customProductName?: string;
  }>({});

  const [currentPage, setCurrentPage] = useState(1);

  // Custom success modal dialog state
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    productName: string;
    isDraft?: boolean;
  }>({
    isOpen: false,
    productName: '',
  });

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const currentCount = photos.length;
      const allowedCount = 5 - currentCount;
      if (allowedCount <= 0) {
        toast("You can upload a maximum of 5 images.", "warning");
        return;
      }
      const filesToAdd = files.slice(0, allowedCount);
      if (files.length > allowedCount) {
        toast(`Only the first ${allowedCount} image(s) were added (limit: 5 images).`, "warning");
      }
      setPhotos(prev => [...prev, ...filesToAdd]);
      const newUrls = filesToAdd.map(file => URL.createObjectURL(file));
      setPhotoPreviews(prev => [...prev, ...newUrls]);
      if (!form.photo && filesToAdd.length > 0) {
        setForm((current) => ({ ...current, photo: filesToAdd[0] }));
      }
    }
  };

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, urgencyFilter, priceFilter]);

  useEffect(() => {
    let mounted = true;

    async function loadDemands() {
      setIsLoading(true);
      const safetyTimer = setTimeout(() => {
        if (mounted) setIsLoading(false);
      }, 4000);

      try {
        const data = await api.currentDemands();
        if (!mounted) return;
        setDemands(
          (data || []).map((item: DemandProduct) => ({
            ...item,
            image: item.image_url || item.image || getReferenceImage(item.name) || '',
          }))
        );
      } catch (error) {
        console.error('Failed to load current demands:', error);
      } finally {
        clearTimeout(safetyTimer);
        if (mounted) setIsLoading(false);
      }
    }

    loadDemands();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (preselectedProduct) {
      const isRequest = typeof preselectedProduct.id === 'string' && preselectedProduct.id.startsWith('req-');
      if (isRequest) {
        const reqProd = {
          id: null,
          name: preselectedProduct.name,
          category: preselectedProduct.category,
          unit: preselectedProduct.unit,
          base_price: preselectedProduct.base_price,
          quantity_needed: preselectedProduct.quantity_needed,
          isRequest: true,
          requestId: preselectedProduct.id.replace('req-', ''),
        };
        setSelectedProduct(reqProd);
        setForm({
          quantity: String(preselectedProduct.quantity_needed || ''),
          availableDate: new Date().toISOString().slice(0, 10),
          askingPrice: preselectedProduct.base_price ? String(preselectedProduct.base_price) : '',
          qualityGrade: 'standard',
          notes: `Supplying in response to client request.`,
          photo: null,
          customProductName: preselectedProduct.name,
          customCategory: preselectedProduct.category || 'Vegetables',
          customUnit: preselectedProduct.unit || 'kg',
        });
      } else {
        setSelectedProduct(preselectedProduct);
        let baseVal = Number(preselectedProduct.base_price || 0);
        if (baseVal > 0 && baseVal < 100) {
          baseVal = Math.round(baseVal * 1473.97);
        }
        setForm({
          quantity: preselectedProduct.quantity_needed ? String(preselectedProduct.quantity_needed).split(' ')[0] : '',
          availableDate: new Date().toISOString().slice(0, 10),
          askingPrice: baseVal ? String(baseVal) : '',
          qualityGrade: 'standard',
          notes: '',
          photo: null,
          customProductName: '',
          customCategory: 'Vegetables',
          customUnit: 'kg',
        });
      }
      if (clearPreselected) clearPreselected();
    }
  }, [preselectedProduct, clearPreselected]);

  const openCustomProduct = () => {
    const customProd = {
      id: null,
      name: 'Custom Product Submission',
      category: 'Vegetables',
      unit: 'kg',
      isCustom: true
    };
    setSelectedProduct(customProd);
    setForm({
      quantity: '',
      availableDate: new Date().toISOString().slice(0, 10),
      askingPrice: '',
      qualityGrade: 'standard',
      notes: '',
      photo: null,
      customProductName: '',
      customCategory: 'Vegetables',
      customUnit: 'kg'
    });
    setPhotoPreview(null);
    setValidationErrors({});
  };

  const openProduct = (product: DemandProduct) => {
    setSelectedProduct(product);
    let baseVal = Number(product.base_price || 0);
    if (baseVal > 0 && baseVal < 100) {
      baseVal = Math.round(baseVal * 1473.97);
    }
    const initialAskingPrice = baseVal ? String(baseVal) : '';

    setForm({
      quantity: product.quantity_needed ? String(product.quantity_needed).split(' ')[0] : '',
      availableDate: new Date().toISOString().slice(0, 10),
      askingPrice: initialAskingPrice,
      qualityGrade: 'premium',
      notes: '',
      photo: null,
    });
    setPhotoPreview(null);
    setValidationErrors({});
  };

  const handleSubmit = async (isDraft = false) => {
    if (!selectedProduct) return;

    // Validate fields and set inline errors
    const qty = Number(form.quantity);
    const askingPriceRWF = Number(form.askingPrice);

    let hasErrors = false;
    const errors: typeof validationErrors = {};

    if (selectedProduct.isCustom && !form.customProductName?.trim()) {
      errors.customProductName = "Product name is required.";
      hasErrors = true;
    }

    if (isNaN(qty) || qty <= 0) {
      errors.quantity = "Quantity must be greater than zero.";
      hasErrors = true;
    }

    if (isNaN(askingPriceRWF) || askingPriceRWF <= 0) {
      errors.askingPrice = "Asking price must be greater than zero.";
      hasErrors = true;
    }

    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        quantity: qty,
        price: askingPriceRWF,
        available_date: form.availableDate,
        quality_grade: form.qualityGrade,
        notes: form.notes,
        photo: photos[0] || null,
        images: photos,
        status: isDraft ? 'draft' : 'pending',
      };

      if (form.bulkMinQty && form.bulkPrice) {
        payload.bulk_min_qty = Number(form.bulkMinQty);
        payload.bulk_price = Number(form.bulkPrice);
      }

      if (selectedProduct.isCustom || selectedProduct.isRequest || !selectedProduct.id) {
        payload.product = null;
        payload.custom_product_name = selectedProduct.isCustom ? form.customProductName : selectedProduct.name;
        payload.custom_category = selectedProduct.isCustom ? form.customCategory : selectedProduct.category;
        payload.custom_unit = selectedProduct.isCustom ? form.customUnit : selectedProduct.unit;
      } else {
        payload.product = selectedProduct.id;
        payload.unit = selectedProduct.unit;
      }

      await api.submitSupply(payload);

      setSuccessModal({
        isOpen: true,
        productName: selectedProduct.isCustom ? form.customProductName! : selectedProduct.name,
        isDraft,
      });
      setSelectedProduct(null);
      setForm(initialFormState);
      setPhotoPreview(null);
      setPhotos([]);
      setPhotoPreviews([]);
      setValidationErrors({});
    } catch (error) {
      console.error('Failed to submit harvest:', error);
      toast('Could not submit harvest right now. Please try again shortly.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter calculations
  const filteredDemands = demands.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || product.category === selectedCategory;
    const matchesUrgency = urgencyFilter === 'All' || 
      (urgencyFilter === 'high' && (product.urgency === 'high' || product.name.toLowerCase().includes('tomato'))) ||
      (urgencyFilter === 'steady' && product.urgency === 'steady' && !product.name.toLowerCase().includes('tomato'));
    const matchesPrice = priceFilter === 'All' || 
      (priceFilter === 'Under $1.00' && Number(product.base_price || 0) < 1.00) ||
      (priceFilter === 'Over $1.00' && Number(product.base_price || 0) >= 1.00);
    return matchesSearch && matchesCategory && matchesUrgency && matchesPrice;
  });

  // Pagination calculations
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredDemands.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDemands = filteredDemands.slice(indexOfFirstItem, indexOfLastItem);

  const isSelectedProductRwf = selectedProduct ? (convertedProducts[selectedProduct.id] || false) : false;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-sans text-xl sm:text-2xl font-extrabold text-primary">Submit a New Harvest</h1>
        <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1">Current industry demand for fresh produce in your region.</p>
      </div>

      <div className="relative mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant custom-shadow">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
            <input
              className="w-full pl-11 pr-4 py-2 rounded-lg border border-outline-variant font-sans text-sm bg-surface-container-low focus:bg-white transition-all"
              placeholder="Search products (e.g., Tomatoes, Wheat)"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-outline-variant bg-white font-mono text-xs min-w-[160px] cursor-pointer focus:ring-primary focus:border-primary outline-none"
            >
              <option>All Categories</option>
              <option>Vegetables</option>
              <option>Grains</option>
              <option>Fruits</option>
            </select>
            <button 
              onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all active:scale-95 cursor-pointer",
                showFiltersMenu ? "bg-primary text-white" : "bg-surface-container-high text-primary hover:bg-surface-container-highest"
              )}
            >
              <SlidersHorizontal size={16} />
              <span className="font-mono text-xs uppercase tracking-wider">Filters</span>
            </button>
          </div>
        </div>

        {/* Real dropdown filters menu */}
        {showFiltersMenu && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-outline-variant rounded-2xl shadow-xl z-30 p-4 space-y-4">
            <div className="space-y-2">
              <label className="block font-mono text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Demand Urgency</label>
              <div className="grid grid-cols-3 gap-2">
                {['All', 'High', 'Steady'].map((urg) => (
                  <button
                    key={urg}
                    type="button"
                    onClick={() => setUrgencyFilter(urg === 'All' ? 'All' : urg.toLowerCase())}
                    className={cn(
                      "py-1.5 rounded-lg font-sans text-xs font-bold border transition-all cursor-pointer",
                      (urgencyFilter === 'All' && urg === 'All') || (urgencyFilter === urg.toLowerCase() && urg !== 'All')
                        ? "bg-primary border-primary text-white"
                        : "bg-white border-[#c1c9c0] text-[#414942]"
                    )}
                  >
                    {urg}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Price Level</label>
              <div className="flex flex-col gap-1.5">
                {['All', 'Under $1.00', 'Over $1.00'].map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => setPriceFilter(price)}
                    className={cn(
                      "py-1.5 px-3 rounded-lg font-sans text-xs font-bold border text-left transition-all cursor-pointer",
                      priceFilter === price
                        ? "bg-primary border-primary text-white"
                        : "bg-white border-[#c1c9c0] text-[#414942]"
                    )}
                  >
                    {price}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant flex justify-between">
              <button 
                onClick={() => {
                  setUrgencyFilter('All');
                  setPriceFilter('All');
                }}
                className="text-[10px] font-mono uppercase font-bold text-on-surface-variant hover:text-[#1c1c18]"
              >
                Reset
              </button>
              <button 
                onClick={() => setShowFiltersMenu(false)}
                className="text-[10px] font-mono uppercase font-bold text-primary hover:underline"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {!isLoading && (
          <motion.div
            whileHover={{ y: -2 }}
            onClick={() => openCustomProduct()}
            className={cn(
              'bg-[#fcf9f2] rounded-xl border-2 border-dashed border-[#c1c9c0] p-4.5 custom-shadow cursor-pointer transition-all duration-300 group flex flex-col items-center justify-center text-center min-h-[220px] h-full justify-between',
              selectedProduct?.isCustom ? 'border-primary ring-1 ring-primary/30' : 'hover:border-primary/50'
            )}
          >
            <div className="flex flex-col items-center justify-center flex-grow py-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Plus className="text-primary" size={24} />
              </div>
              <h3 className="font-sans text-sm font-bold text-primary">Submit Custom Crop</h3>
              <p className="font-sans text-[11px] text-[#717971] max-w-[180px] mt-1 leading-relaxed">
                Submit a harvest for a crop not listed in active demands.
              </p>
            </div>
          </motion.div>
        )}
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-2 animate-pulse">
              <div className="h-40 bg-surface-container-high rounded-lg mb-3" />
              <div className="px-2 pb-2 space-y-2">
                <div className="h-4 bg-surface-container-high rounded w-3/4" />
                <div className="h-3 bg-surface-container-high rounded w-1/2" />
              </div>
            </div>
          ))
        ) : currentDemands.map((product) => {
          let baseVal = Number(product.base_price || 0);
          if (baseVal > 0 && baseVal < 100) {
            baseVal = Math.round(baseVal * 1473.97);
          }
          const formattedPrice = `RWF ${baseVal.toLocaleString('en-US')}`;

          return (
            <motion.div
              key={product.id}
              whileHover={{ y: -2 }}
              onClick={() => openProduct(product)}
              className={cn(
                'bg-surface-container-lowest rounded-xl border p-2.5 custom-shadow cursor-pointer transition-all duration-300 group overflow-hidden flex flex-col justify-between',
                selectedProduct?.id === product.id
                  ? 'border-primary ring-1 ring-primary/30'
                  : 'border-outline-variant hover:border-outline'
              )}
            >
              <div>
                <div className="relative rounded-lg overflow-hidden h-32 sm:h-36 mb-2.5">
                  <img 
                    src={product.image || getReferenceImage(product.name) || ''} 
                    alt={product.name} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  {getBadgeMeta(product.name, product.urgency) && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full font-mono text-[9px] flex items-center gap-1 shadow-sm uppercase tracking-wider font-bold",
                        getBadgeMeta(product.name, product.urgency)?.className
                      )}>
                        {getBadgeMeta(product.name, product.urgency)?.label === 'High Urgency' && (
                          <Bolt size={10} fill="currentColor" />
                        )}
                        {getBadgeMeta(product.name, product.urgency)?.label}
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-1 pb-1">
                  <div className="flex justify-between items-start mb-1.5 gap-1">
                    <h3 className="font-sans text-sm font-bold text-primary truncate">{product.name}</h3>
                    <span className="bg-primary-container/20 text-primary px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider shrink-0 font-bold">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex flex-col">
                      <span className="text-on-surface-variant font-mono text-[9px] uppercase tracking-wider font-bold">Quantity Needed</span>
                      <span className="font-sans text-base font-bold text-primary">
                        {String(product.quantity_needed ?? '0').split(' ')[0]}
                        <span className="text-xs font-normal ml-1">{product.unit}</span>
                      </span>
                    </div>
                    <div
                      className={cn(
                        'p-1.5 rounded-lg transition-colors group-hover:translate-x-0.5 duration-300',
                        selectedProduct?.id === product.id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary'
                      )}
                    >
                      <ArrowRight size={15} />
                    </div>
                  </div>
                </div>
              </div>

              {/* RWF Base Price */}
              <div className="mt-2.5 pt-2.5 border-t border-outline-variant/40 flex justify-between items-center bg-surface-container-low/20 p-2 rounded-lg text-xs shrink-0">
                <div>
                  <span className="text-on-surface-variant font-mono text-[9px] uppercase tracking-wider block font-bold">Base Price</span>
                  <span className="font-sans text-xs font-bold text-primary">
                    {formattedPrice} / {product.unit}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-surface-container-lowest border border-outline-variant p-4 rounded-xl custom-shadow shrink-0">
          <span className="text-xs text-on-surface-variant font-bold font-sans">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredDemands.length)} of {filteredDemands.length} products
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 border border-[#c1c9c0] rounded-xl text-xs font-bold bg-white text-[#414942] hover:border-primary hover:text-primary transition-all disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 border border-[#c1c9c0] rounded-xl text-xs font-bold bg-white text-[#414942] hover:border-primary hover:text-primary transition-all disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[440px] md:w-[460px] bg-white z-[70] shadow-2xl overflow-y-auto flex flex-col custom-scrollbar"
            >
              <div className="p-4 border-b border-outline-variant flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-1.5 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-on-surface"
                  >
                    <X size={18} />
                  </button>
                  <div>
                    <h3 className="font-sans text-base font-bold text-primary">
                      {selectedProduct.isCustom ? 'Propose New Crop Harvest' : `Submit Harvest: ${selectedProduct.name}`}
                    </h3>
                    <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">
                      {selectedProduct.isCustom ? 'Custom Crop Submission' : (
                        `Demand Base Price: ${isSelectedProductRwf 
                          ? `RWF ${(Number(selectedProduct.base_price || 0) * 1300).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                          : `$${Number(selectedProduct.base_price || 0).toFixed(2)}`
                        }`
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 sm:p-5 space-y-5 sm:space-y-6">
                {(selectedProduct.isCustom || selectedProduct.isRequest) && (
                  <div className="space-y-4 p-4 border border-outline-variant/60 rounded-xl bg-surface-container-low/20">
                    <h4 className="font-mono text-[9px] uppercase tracking-wider text-primary font-bold">Custom Crop Specification</h4>
                    
                    {selectedProduct.isCustom && (
                      <div className="space-y-1.5">
                        <label className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Crop / Product Name</label>
                        <input
                          className={cn(
                            "w-full px-3 py-2 rounded-lg border bg-surface-container-lowest font-sans text-xs font-semibold focus:border-primary outline-none transition-all",
                            validationErrors.customProductName ? "border-error focus:ring-error" : "border-outline-variant"
                          )}
                          placeholder="e.g. Red Gala Apples"
                          type="text"
                          required
                          value={form.customProductName}
                          onChange={(e) => {
                            setForm(current => ({ ...current, customProductName: e.target.value }));
                            setValidationErrors(prev => ({ ...prev, customProductName: undefined }));
                          }}
                        />
                        {validationErrors.customProductName && (
                          <p className="text-error font-mono text-[9px] uppercase font-bold mt-0.5 pl-0.5">
                            {validationErrors.customProductName}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Category</label>
                        <select
                          className="w-full px-2 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest font-sans text-xs focus:border-primary outline-none"
                          value={form.customCategory}
                          onChange={(e) => setForm(current => ({ ...current, customCategory: e.target.value }))}
                        >
                          <option value="Vegetables">Vegetables</option>
                          <option value="Fruits">Fruits</option>
                          <option value="Herbs">Herbs</option>
                          <option value="Grains">Grains</option>
                          <option value="Animal-Based">Animal-Based</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Unit</label>
                        <select
                          className="w-full px-2 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest font-sans text-xs focus:border-primary outline-none"
                          value={form.customUnit}
                          onChange={(e) => setForm(current => ({ ...current, customUnit: e.target.value }))}
                        >
                          <option value="kg">kg</option>
                          <option value="litre">litre</option>
                          <option value="crate">crate</option>
                          <option value="jar">jar</option>
                          <option value="bundle">bundle</option>
                          <option value="dozen">dozen</option>
                          <option value="bunch">bunch</option>
                          <option value="tray">tray</option>
                          <option value="pack">pack</option>
                          <option value="box">box</option>
                          <option value="bottle">bottle</option>
                          <option value="punnet">punnet</option>
                          <option value="head">head</option>
                          <option value="block">block</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Quantity Available</label>
                    <div className="relative">
                      <input
                        className={cn(
                          "w-full px-3 py-2 rounded-lg border bg-surface-container-lowest font-sans text-sm font-bold focus:border-primary outline-none transition-all",
                          validationErrors.quantity ? "border-error focus:ring-error" : "border-outline-variant"
                        )}
                        placeholder="0.00"
                        type="number"
                        value={form.quantity}
                        onChange={(event) => {
                          const val = event.target.value;
                          setForm((current) => ({ ...current, quantity: val }));
                          const qtyNum = Number(val);
                          if (val) {
                            const err = (isNaN(qtyNum) || qtyNum <= 0) ? "Quantity must be greater than zero." : undefined;
                            setValidationErrors(prev => ({ ...prev, quantity: err }));
                          } else {
                            setValidationErrors(prev => ({ ...prev, quantity: undefined }));
                          }
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-on-surface-variant font-bold">
                        {(selectedProduct.isCustom || selectedProduct.isRequest) ? form.customUnit : selectedProduct.unit}
                      </span>
                    </div>
                    {validationErrors.quantity && (
                      <p className="text-error font-mono text-[9px] uppercase font-bold mt-0.5 pl-0.5">
                        {validationErrors.quantity}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Ready Date</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={15} />
                      <input
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest font-sans text-xs focus:border-primary outline-none"
                        type="date"
                        value={form.availableDate}
                        onChange={(e) => setForm(current => ({ ...current, availableDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Bulk Deal Offer Section */}
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-widest flex items-center gap-1">
                      ⚡ Optional Bulk Deal Offer
                    </span>
                    <span className="text-[9px] font-medium text-emerald-700">Tiered Discount for Volume Buyers</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-emerald-900 uppercase">Min Bulk Qty</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={form.bulkMinQty || ''}
                        onChange={(e) => setForm(c => ({ ...c, bulkMinQty: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 text-xs font-semibold bg-white outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-emerald-900 uppercase">Bulk Price / Unit (RWF)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1000"
                        value={form.bulkPrice || ''}
                        onChange={(e) => setForm(c => ({ ...c, bulkPrice: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 text-xs font-semibold bg-white outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Quality Grade Selection</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'premium', label: 'Premium', icon: Verified },
                      { id: 'standard', label: 'Standard', icon: Star },
                      { id: 'economy', label: 'Economy', icon: Package }
                    ].map((grade) => (
                      <button
                        key={grade.id}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, qualityGrade: grade.id as HarvestFormState['qualityGrade'] }))}
                        className={cn(
                          'flex-1 py-2 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer',
                          form.qualityGrade === grade.id
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-outline-variant hover:border-outline bg-white text-on-surface-variant'
                        )}
                      >
                        <grade.icon size={14} fill={form.qualityGrade === grade.id ? 'currentColor' : 'none'} />
                        <span className="font-mono text-[10px] uppercase font-bold">{grade.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 bg-surface-container-low/40 p-3.5 rounded-xl border border-outline-variant/60">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold block">Asking Price per {selectedProduct.unit} (RWF)</label>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-primary text-xs">
                      RWF
                    </span>
                    <input
                      className={cn(
                        "w-full pl-12 pr-3 py-2 rounded-lg border bg-white font-sans text-sm font-bold text-primary outline-none focus:border-primary",
                        validationErrors.askingPrice ? "border-error focus:ring-error" : "border-outline-variant/60"
                      )}
                      type="text"
                      value={form.askingPrice}
                      onChange={(event) => {
                        const val = event.target.value;
                        setForm((current) => ({ ...current, askingPrice: val }));
                        const priceNum = Number(val);
                        if (val && (isNaN(priceNum) || priceNum <= 0)) {
                          setValidationErrors(prev => ({ ...prev, askingPrice: "Price must be greater than zero." }));
                        } else {
                          setValidationErrors(prev => ({ ...prev, askingPrice: undefined }));
                        }
                      }}
                    />
                  </div>
                  {validationErrors.askingPrice && (
                    <p className="text-error font-mono text-[9px] uppercase font-bold mt-0.5 pl-0.5">
                      {validationErrors.askingPrice}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-secondary font-bold pt-1">
                    <TrendingUp size={14} />
                    <span className="font-mono text-[9px] uppercase tracking-wider">
                      Recommended price based on market value in RWF.
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Current Crop Photos</label>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {photoPreviews.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {photoPreviews.map((preview, idx) => (
                          <div key={idx} className="relative border border-outline-variant rounded-lg overflow-hidden aspect-video bg-surface-container-lowest group">
                            <img src={preview} alt="Crop preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
                                setPhotos(prev => prev.filter((_, i) => i !== idx));
                                if (idx === 0) {
                                  setForm(current => ({ ...current, photo: photos[1] || null }));
                                }
                              }}
                              className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow flex items-center justify-center cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      {photoPreviews.length < 5 && (
                        <button
                          type="button"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-primary text-primary rounded-lg font-bold hover:bg-primary/5 transition-all text-xs cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Add Image ({photoPreviews.length}/5)</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="border border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center bg-surface-container-lowest hover:border-primary transition-all cursor-pointer group"
                    >
                      <div className="w-9 h-9 bg-primary-container/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                        <CloudUpload size={18} className="text-primary" />
                      </div>
                      <p className="font-sans text-xs font-bold text-primary">Click to upload crop photos</p>
                      <p className="font-mono text-[9px] text-on-surface-variant mt-0.5 uppercase font-medium">Supports JPG, PNG up to 5 images</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pb-4">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Additional Notes</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest font-sans text-xs focus:border-primary outline-none min-h-[70px] resize-none"
                    placeholder="Ripeness, storage conditions, or logistics preferences..."
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  />
                </div>
              </div>

              <div className="p-4 bg-white border-t border-outline-variant flex flex-col gap-2 sticky bottom-0 z-20">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting || !form.quantity || !form.askingPrice || !!validationErrors.quantity || !!validationErrors.askingPrice}
                    className="flex-1 py-2 px-3 border border-primary text-primary rounded-lg font-bold font-sans text-xs hover:bg-surface-container-low transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting || !form.quantity || !form.askingPrice || !!validationErrors.quantity || !!validationErrors.askingPrice}
                    className="flex-1 py-2 px-3 bg-primary text-white rounded-lg font-bold font-sans text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
                    <Send size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  disabled={isSubmitting}
                  className="w-full py-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors font-semibold cursor-pointer text-center"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reusable Success Confirmation Modal */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/50 transform scale-100 transition-all space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-700">
              <Verified size={32} />
            </div>
            <h3 className="text-lg font-extrabold text-[#144227]">
              {successModal.isDraft ? 'Draft Saved Successfully!' : 'Harvest Submitted Successfully!'}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Your harvest proposal for <strong className="text-primary">{successModal.productName}</strong> has been {successModal.isDraft ? 'saved as a draft' : 'submitted for review'}.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setSuccessModal({ isOpen: false, productName: '' })}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold font-sans text-base hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
