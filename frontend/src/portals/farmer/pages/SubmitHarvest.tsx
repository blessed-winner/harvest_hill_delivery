"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Bolt, ArrowRight, X, Calendar as CalendarIcon, Verified, Star, Package, TrendingUp, CloudUpload, Send, Leaf } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useCurrency } from '../../../context/CurrencyContext';

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
};

const referenceProductImages: Record<string, string> = {
  'Roma Tomatoes':
   'https://lh3.googleusercontent.com/aida-public/AB6AXuAYiimUpH1IFm39l3pnZTBX7tbAQR_aWtolqnXVfboxPqr8MJz9pLBe5CILjBLqm6QIz5161fz4Gh7uTafn3uQA1DyPdwhFX7WaRmQSkeRDy2KKPDZ0RGDpPcnCV09hCAdrNsXSzyDpkD27PXewpXBfJ0kb06ODeplODn-tSr2WmbjmcOb78uNKOU2Ow1kGtSp9wtTq1RJbY2ROo9SLCKoBXXoRYNi0fF7q1_-pLo9QpQlnjxNmUM8CXA',
  'Durum Wheat':
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBQYDniTVJvGnzcOZnyoyxdN10cAwuEDsM40zmbtxaMxe-Rvogvt5wvb9isBj_wDgTwDpTojDHf4_jCBFklPVWrjYvfN_P3fJ0uiFJJfs45K8-8K-IVMVCnt8QYgGExTonLEOjHe2AW3QDPkQksQZ3lZqYalgm1LOKScCsbjMko35cjhlcD8Gxb8Ro0-cQtY2h5VTWfYtT8iwBiVUlaDv-u8L-Bn2f_JBmIhRcuWdQUEjU8Qqkl6ZSA0w',
  'Iceberg Lettuce':
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBxaIEjUGtnGXLWgWM3dQ4i0tAvOfi7RKZLGu1fGEtWVK3e05aLGKP6QyWo87_ktHPD6eeGJE0IdMO3UIr8r1xbyzKJfapEyuokusuq4sIrAitDQp5plyNJ55e8qI6GFvfmkIu88U-hcSoIGPKI245Pcr01LUYzqaqmqv4UirXitG5XKKi07SQy_JyALKzIO_wYp8GWfZTo03pmxEI5swE3ZsUPP8o2M0LbY1lhw4Qlvi2itb3_dVKCxg',
  'Russet Potatoes':
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB41-Vuzo9PoiMU_6JQZOXCKOLW-1IS1IInscIbXRMORY7tTrv44rIvtwhrnsLhdCuonKVd7FwSgRhoTZC4E-PnVFrYOHSFAPKKBNcd8APsOv64N3UUjF53XLXomgCACC8eAwykUHfBJfNjc8JnaM4CdDIUrDyDqE3Cu4KSlEs-hs6Wza1utfBiwoQRKnhnotV-b6enuBmfjpUJYSxR-5Bb5guV7pLUip6Uo16gWDhndBPdCrBjHVsYSw',
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

const initialFormState: HarvestFormState = {
  quantity: '',
  availableDate: new Date().toISOString().slice(0, 10),
  askingPrice: '',
  qualityGrade: 'premium',
  notes: '',
  photo: null,
};

export default function SubmitHarvest() {
  const [selectedProduct, setSelectedProduct] = useState<DemandProduct | null>(null);
  const [demands, setDemands] = useState<DemandProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<HarvestFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { formatPrice, currency, setCurrency } = useCurrency();

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((current) => ({ ...current, photo: file }));
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');

  useEffect(() => {
    let mounted = true;

    async function loadDemands() {
      setIsLoading(true);
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
        if (mounted) setIsLoading(false);
      }
    }

    loadDemands();

    return () => {
      mounted = false;
    };
  }, []);

  const openProduct = (product: DemandProduct) => {
    setSelectedProduct(product);
    setForm({
      quantity: product.quantity_needed ? String(product.quantity_needed).split(' ')[0] : '',
      availableDate: new Date().toISOString().slice(0, 10),
      askingPrice: product.base_price ? String(product.base_price) : '',
      qualityGrade: 'premium',
      notes: '',
      photo: null,
    });
    setPhotoPreview(null);
  };

  const handleSubmit = async (isDraft = false) => {
    if (!selectedProduct) return;

    setIsSubmitting(true);

    try {
      await api.submitSupply({
        product: selectedProduct.id,
        quantity: Number(form.quantity),
        unit: selectedProduct.unit,
        proposed_price: Number(form.askingPrice),
        available_date: form.availableDate,
        quality_grade: form.qualityGrade,
        notes: form.notes,
        photo: form.photo,
        status: isDraft ? 'draft' : 'pending',
      });

      // Open beautiful success dialog
      setSuccessModal({
        isOpen: true,
        productName: selectedProduct.name,
        isDraft,
      });
      setSelectedProduct(null);
      setForm(initialFormState);
      setPhotoPreview(null);
    } catch (error) {
      console.error('Failed to submit harvest:', error);
      alert('Could not submit harvest right now. Please try again shortly.');
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
        ) : filteredDemands.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
              <Leaf size={28} className="text-outline" />
            </div>
            <p className="font-sans text-sm font-bold text-on-surface">
              {searchQuery || selectedCategory !== 'All Categories' || urgencyFilter !== 'All' || priceFilter !== 'All'
                ? 'No products match your filters.'
                : 'No products are currently needed.'}
            </p>
            <p className="font-sans text-xs text-on-surface-variant max-w-xs">
              {searchQuery || selectedCategory !== 'All Categories' || urgencyFilter !== 'All' || priceFilter !== 'All'
                ? 'Try adjusting or clearing your filters.'
                : 'Harvest Hill will post new demands soon. Check back later.'}
            </p>
          </div>
        ) : filteredDemands.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => openProduct(product)}
            className={cn(
              'bg-surface-container-lowest rounded-xl border p-2 custom-shadow cursor-pointer transition-all duration-300 group overflow-hidden flex flex-col justify-between',
              selectedProduct?.id === product.id || product.name.toLowerCase().includes('roma')
                ? 'border-primary'
                : 'border-outline-variant'
            )}
          >
            <div>
              <div className="relative rounded-lg overflow-hidden h-40 mb-3">
                <img src={product.image || getReferenceImage(product.name) || ''} alt={product.name} className="w-full h-full object-cover" />
                {getBadgeMeta(product.name, product.urgency) && (
                  <div className="absolute top-4 right-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full font-mono text-[10px] flex items-center gap-1 shadow-md uppercase tracking-wider",
                      getBadgeMeta(product.name, product.urgency)?.className
                    )}>
                      {getBadgeMeta(product.name, product.urgency)?.label === 'High Urgency' && (
                        <Bolt size={12} fill="currentColor" />
                      )}
                      {getBadgeMeta(product.name, product.urgency)?.label}
                    </span>
                  </div>
                )}
              </div>
              <div className="px-2 pb-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-sans text-base font-bold text-primary">{product.name}</h3>
                  <span className="bg-primary-container/20 text-primary px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider">
                    {product.category}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex flex-col">
                    <span className="text-on-surface-variant font-mono text-[10px] uppercase tracking-wider">Quantity Needed</span>
                    <span className="font-sans text-lg font-extrabold text-primary">
                      {String(product.quantity_needed ?? '0').split(' ')[0]}
                      <span className="text-xs font-normal ml-1">{product.unit}</span>
                    </span>
                  </div>
                  <div
                    className={cn(
                      'p-2 rounded-lg transition-colors group-hover:translate-x-1 duration-300',
                      selectedProduct?.id === product.id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary'
                    )}
                  >
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* In-Card Base Price & Conversion Toggle */}
            <div className="mt-3 pt-3 border-t border-outline-variant/40 flex justify-between items-center bg-surface-container-low/20 p-2 rounded-lg text-xs shrink-0">
              <div>
                <span className="text-on-surface-variant font-mono text-[9px] uppercase tracking-wider block">Base Price</span>
                <span className="font-sans font-bold text-primary">
                  {formatPrice(product.base_price)} / {product.unit}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrency(currency === 'USD' ? 'RWF' : 'USD');
                }}
                className="font-mono text-[9px] uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary/20 transition-all font-bold cursor-pointer"
              >
                Convert ({currency === 'USD' ? 'RWF' : 'USD'})
              </button>
            </div>
          </motion.div>
        ))}
      </div>

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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[85vw] md:w-[500px] bg-white z-[70] shadow-2xl overflow-y-auto flex flex-col custom-scrollbar"
            >
              <div className="p-4 sm:p-6 border-b border-outline-variant flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
                  >
                    <X size={20} className="text-on-surface" />
                  </button>
                  <div>
                    <h3 className="font-sans text-lg sm:text-xl font-extrabold text-primary">Submit: {selectedProduct.name}</h3>
                    <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                      Demand Base Price: {formatPrice(selectedProduct.base_price)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-5 sm:p-8 space-y-8 sm:space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Quantity Available</label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest font-sans text-xl font-extrabold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="0.00"
                        type="number"
                        value={form.quantity}
                        onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-on-surface-variant">{selectedProduct.unit}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Ready Date</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                      <input
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest font-sans text-sm focus:border-primary outline-none"
                        type="date"
                        value={form.availableDate}
                        onChange={(event) => setForm((current) => ({ ...current, availableDate: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Quality Grade Selection</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'premium', label: 'Premium', icon: Verified },
                      { id: 'standard', label: 'Standard', icon: Star },
                      { id: 'economy', label: 'Economy', icon: Package }
                    ].map((grade) => (
                      <button
                        key={grade.id}
                        onClick={() => setForm((current) => ({ ...current, qualityGrade: grade.id as HarvestFormState['qualityGrade'] }))}
                        className={cn(
                          'flex-1 py-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all',
                          form.qualityGrade === grade.id
                            ? 'border-primary bg-primary-container text-on-primary-container shadow-md scale-105'
                            : 'border-outline-variant hover:border-primary hover:bg-surface-container-low text-on-surface-variant'
                        )}
                      >
                        <grade.icon size={20} fill={form.qualityGrade === grade.id ? 'currentColor' : 'none'} />
                        <span className="font-mono text-[10px] uppercase font-bold">{grade.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6 bg-surface-container-low p-4 sm:p-6 rounded-2xl border border-outline-variant">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Asking Price per kg</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">
                        {currency === 'RWF' ? 'RWF' : '$'}
                      </span>
                      <input
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-white font-sans text-2xl font-extrabold text-primary outline-none focus:ring-1 focus:ring-primary"
                        type="text"
                        value={form.askingPrice}
                        onChange={(event) => setForm((current) => ({ ...current, askingPrice: event.target.value }))}
                      />
                    </div>
                    <div className="flex-1">
                      <span className="font-mono text-[10px] text-on-surface-variant block mb-1 uppercase tracking-tight">Market Avg</span>
                      <span className="font-sans text-xl font-extrabold text-primary">
                        {formatPrice(selectedProduct.base_price)} - {formatPrice(Number(selectedProduct.base_price || 0) * 1.1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-secondary font-bold">
                    <TrendingUp size={18} />
                    <span className="font-mono text-[10px] uppercase tracking-tighter leading-none">
                      The recommended asking price range is dynamically calculated based on current market indices and quality benchmarks.
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Current Crop Photos</label>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {photoPreview ? (
                    <div className="relative border-2 border-dashed border-primary rounded-2xl overflow-hidden aspect-video bg-surface-container-lowest group">
                      <img
                        src={photoPreview}
                        alt="Crop preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                          className="px-4 py-2 bg-white text-primary text-xs font-bold rounded-lg hover:bg-surface-container-low transition-colors"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((current) => ({ ...current, photo: null }));
                            setPhotoPreview(null);
                          }}
                          className="px-4 py-2 bg-error text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="border-2 border-dashed border-outline-variant rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center bg-surface-container-lowest hover:border-primary transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 bg-primary-container/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <CloudUpload size={24} className="text-primary" />
                      </div>
                      <p className="font-sans font-extrabold text-primary">Drop images or click to upload</p>
                      <p className="font-mono text-[10px] text-on-surface-variant mt-1 uppercase">Supports JPG, PNG up to 10MB</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pb-10">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Additional Notes</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest font-sans text-sm focus:border-primary outline-none min-h-[100px] resize-none"
                    placeholder="Describe specific details about ripeness, storage conditions, or logistics preference..."
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  />
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-surface-container-low border-t border-outline-variant flex flex-col gap-3 sm:gap-4 sticky bottom-0 z-20">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting || !form.quantity || !form.askingPrice}
                    className="flex-1 py-3 border-2 border-primary text-primary rounded-2xl font-bold font-sans text-base hover:bg-surface-container-low transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-center"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting || !form.quantity || !form.askingPrice}
                    className="flex-1 py-3 bg-primary text-white rounded-2xl font-bold font-sans text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
                    <Send size={16} />
                  </button>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-white border border-outline-variant text-on-surface-variant rounded-2xl font-bold font-sans text-base hover:bg-surface-container-low transition-colors active:scale-[0.98] disabled:opacity-60 cursor-pointer"
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
