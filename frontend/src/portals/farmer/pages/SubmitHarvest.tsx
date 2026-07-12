"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Bolt, ArrowRight, X, Calendar as CalendarIcon, Verified, Star, Package, TrendingUp, CloudUpload, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { api, formatCurrency } from '../lib/api';

type DemandProduct = {
  id: number;
  name: string;
  category: string;
  unit: string;
  base_price?: string | number;
  image?: string | null;
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
  photo: string;
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

const fallbackDemands: DemandProduct[] = [
  { id: 1, name: 'Roma Tomatoes', category: 'Vegetables', unit: 'kg', base_price: '3.45', quantity_needed: 2500, urgency: 'high', image: getReferenceImage('Roma Tomatoes') },
  { id: 2, name: 'Durum Wheat', category: 'Grains', unit: 'kg', base_price: '0.85', quantity_needed: 15000, urgency: 'steady', image: getReferenceImage('Durum Wheat') },
  { id: 3, name: 'Iceberg Lettuce', category: 'Vegetables', unit: 'kg', base_price: '1.20', quantity_needed: 1200, urgency: 'steady', image: getReferenceImage('Iceberg Lettuce') },
  { id: 4, name: 'Russet Potatoes', category: 'Vegetables', unit: 'kg', base_price: '0.95', quantity_needed: 4800, urgency: 'steady', image: getReferenceImage('Russet Potatoes') },
];

const initialFormState: HarvestFormState = {
  quantity: '',
  availableDate: new Date().toISOString().slice(0, 10),
  askingPrice: '',
  qualityGrade: 'premium',
  notes: '',
  photo: '',
};

export default function SubmitHarvest() {
  const [selectedProduct, setSelectedProduct] = useState<DemandProduct | null>(null);
  const [demands, setDemands] = useState<DemandProduct[]>(fallbackDemands);
  const [form, setForm] = useState<HarvestFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDemands() {
      try {
        const data = await api.currentDemands();
        if (!mounted) return;
        setDemands((data || []).length > 0
          ? (data || [])
              .map((item: DemandProduct) => ({
                ...item,
                image: getReferenceImage(item.name) || item.image || '',
              }))
          : fallbackDemands);
      } catch (error) {
        console.error('Failed to load current demands:', error);
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
      photo: '',
    });
  };

  const handleSubmit = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    setNotice(null);

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
      });

      setNotice(`Harvest submitted for ${selectedProduct.name}.`);
      setSelectedProduct(null);
      setForm(initialFormState);
    } catch (error) {
      console.error('Failed to submit harvest:', error);
      setNotice('Could not submit harvest right now. Please try again shortly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-sans text-xl sm:text-2xl font-extrabold text-primary">Submit a New Harvest</h1>
        <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1">Current industry demand for fresh produce in your region.</p>
        {notice && (
          <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface">
            {notice}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant custom-shadow">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
          <input
            className="w-full pl-11 pr-4 py-2 rounded-lg border border-outline-variant font-sans text-sm bg-surface-container-low focus:bg-white transition-all"
            placeholder="Search products (e.g., Tomatoes, Wheat)"
            type="text"
          />
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <select className="px-4 py-2 rounded-lg border border-outline-variant bg-white font-mono text-xs min-w-[160px] cursor-pointer">
            <option>All Categories</option>
            <option>Vegetables</option>
            <option>Grains</option>
            <option>Fruits</option>
          </select>
          <button className="flex items-center gap-2 px-6 py-2 bg-surface-container-high rounded-lg text-primary font-bold hover:bg-surface-container-highest transition-colors active:scale-95">
            <SlidersHorizontal size={16} />
            <span className="font-mono text-xs uppercase tracking-wider">Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {demands.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => openProduct(product)}
            className={cn(
              'bg-surface-container-lowest rounded-xl border p-2 custom-shadow cursor-pointer transition-all duration-300 group overflow-hidden',
              selectedProduct?.id === product.id || product.name.toLowerCase().includes('roma')
                ? 'border-primary'
                : 'border-outline-variant'
            )}
          >
            <div className="relative rounded-lg overflow-hidden h-40 mb-3">
              <img src={getReferenceImage(product.name) || product.image || ''} alt={product.name} className="w-full h-full object-cover" />
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
                      Demand Base Price: {formatCurrency(selectedProduct.base_price)}
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
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">$</span>
                      <input
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-white font-sans text-2xl font-extrabold text-primary outline-none focus:ring-1 focus:ring-primary"
                        type="text"
                        value={form.askingPrice}
                        onChange={(event) => setForm((current) => ({ ...current, askingPrice: event.target.value }))}
                      />
                    </div>
                    <div className="flex-1">
                      <span className="font-mono text-[10px] text-on-surface-variant block mb-1 uppercase tracking-tight">Market Avg</span>
                      <span className="font-sans text-xl font-extrabold text-primary">{formatCurrency(selectedProduct.base_price)} - {formatCurrency(Number(selectedProduct.base_price || 0) * 1.1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-secondary font-bold">
                    <TrendingUp size={18} />
                    <span className="font-mono text-[10px] uppercase tracking-tighter leading-none">Current price is based on the local demand mock</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Current Crop Photos</label>
                  <div className="border-2 border-dashed border-outline-variant rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center bg-surface-container-lowest hover:border-primary transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-primary-container/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <CloudUpload size={24} className="text-primary" />
                    </div>
                    <p className="font-sans font-extrabold text-primary">Drop images or click to upload</p>
                    <p className="font-mono text-[10px] text-on-surface-variant mt-1 uppercase">Supports JPG, PNG up to 10MB</p>
                  </div>
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
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary text-white rounded-2xl font-bold font-sans text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-60"
                >
                  <span>{isSubmitting ? 'Submitting...' : 'Submit for Review'}</span>
                  <Send size={20} />
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full py-3 bg-white border-2 border-primary text-primary rounded-2xl font-bold font-sans text-base hover:bg-surface-container-low transition-colors active:scale-[0.98]"
                >
                  Save as draft
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
