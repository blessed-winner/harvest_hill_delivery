"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ChevronLeft, ChevronRight, Sprout, ShieldCheck, Truck, 
  Plus, ShoppingCart, Percent, AlertCircle, Play, Star, MapPin, CheckCircle, 
  HelpCircle, ChevronDown, ChevronUp, Clock, Award
} from 'lucide-react';
import { clientApi } from '../lib/api';

interface LandingProps {
  onNavigate: (screen: string, category?: string, productId?: number) => void;
  addToCart: (product?: any) => void;
}

export default function Landing({ onNavigate, addToCart }: LandingProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // Fetch products from catalog on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await clientApi.products.list();
        setProducts(res?.results || []);
      } catch (err) {
        console.error("Failed to fetch landing products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Filter accepted products for the slider
  const acceptedProducts = products.filter((p: any) => p.status === 'accepted').map((prod: any) => ({
    id: prod.id,
    product_id: prod.product,
    name: prod.product_detail?.name || prod.name,
    category: prod.product_detail?.category || prod.category,
    unit: prod.unit || 'kg',
    price: prod.price || 0,
    image_url: prod.photo || prod.product_detail?.image_url || 'https://images.unsplash.com/photo-1610348725531-843dff14722a?w=400&q=80',
    quantity: prod.quantity || 0,
    farmer_name: prod.farmer_name || 'Verified Farmer'
  }));

  const handleNextSlide = () => {
    if (acceptedProducts.length > 4) {
      setSliderIndex((prev) => (prev + 1) % (acceptedProducts.length - 3));
    }
  };

  const handlePrevSlide = () => {
    if (acceptedProducts.length > 4) {
      setSliderIndex((prev) => (prev - 1 + (acceptedProducts.length - 3)) % (acceptedProducts.length - 3));
    }
  };

  const toggleFaq = (index: number) => {
    setFaqOpenIndex(faqOpenIndex === index ? null : index);
  };

  const faqs = [
    {
      q: "How does negotiation work?",
      a: "Once a supply is listed, client buyers can make counter proposals. If the farmer accepts, the price is finalized. Both sides can revise terms until an agreement is reached."
    },
    {
      q: "What are the quality grades?",
      a: "We categorize produce into Premium (top-tier size, look, and freshness), Standard (choice wholesale grade), and Economy (utility grade for processing/sauces)."
    },
    {
      q: "Who pays for delivery?",
      a: "Delivery logistics are managed automatically through the Harvest Hill logistics network. Shipping costs are calculated dynamically based on distance and order volume."
    },
    {
      q: "How long does verification take?",
      a: "Supplier identity and crop batches are typically verified within 24 hours of submission to maintain fresh delivery standards."
    },
    {
      q: "Is my payment secure?",
      a: "Yes. Payment is escrowed securely and only released to the farmer after the digital delivery log is signed by the client recipient without dispute."
    }
  ];

  return (
    <div className="space-y-16 pb-16 font-sans bg-[#fcf9f2] text-[#1c1c18] selection:bg-[#9ed0ab] selection:text-[#144227]">
      
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Hero Left */}
        <div className="lg:col-span-6 space-y-6">
          <span className="inline-block text-[10px] uppercase font-extrabold tracking-widest text-[#144227] bg-[#144227]/10 px-3.5 py-1.5 rounded-full">
            FARM DIRECT DELIVERY
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#144227] leading-[1.1] font-sans">
            Fresh produce, sourced directly, delivered reliably.
          </h1>
          <p className="text-sm sm:text-base text-[#414942] font-semibold leading-relaxed max-w-xl">
            Harvest Hill bridges the gap between regional agricultural fields and business kitchens with direct negotiations and real-time ledger tracking.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('catalog')}
              className="bg-[#144227] text-white hover:bg-[#2d5a3d] px-8 py-3.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <span>Find harvest</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => onNavigate('catalog')}
              className="bg-white border border-[#c1c9c0] text-[#1c1c18] hover:bg-[#f6f3ec] px-8 py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Share a harvest
            </button>
          </div>
        </div>

        {/* Hero Right: Collage of rounded crop cards */}
        <div className="lg:col-span-6 relative h-[400px] flex items-center justify-center select-none">
          {/* Card 1: Left tall */}
          <div className="absolute left-[5%] top-[10%] w-[160px] h-[220px] rounded-3xl overflow-hidden shadow-xl border border-white/50 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80" 
              alt="fresh produce" 
              className="w-full h-full object-cover" 
            />
          </div>
          {/* Card 2: Right large */}
          <div className="absolute right-[5%] top-[5%] w-[200px] h-[280px] rounded-3xl overflow-hidden shadow-2xl border border-white/50 transform rotate-2 hover:rotate-0 transition-transform duration-500 z-10">
            <img 
              src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500&q=80" 
              alt="fresh vegetables" 
              className="w-full h-full object-cover" 
            />
          </div>
          {/* Card 3: Center bottom */}
          <div className="absolute left-[20%] bottom-[5%] w-[170px] h-[170px] rounded-3xl overflow-hidden shadow-lg border border-white/50 transform -rotate-6 hover:rotate-0 transition-transform duration-500 z-20">
            <img 
              src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80" 
              alt="tomatoes" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </section>

      {/* 2. PARTNERS / STATS BAR */}
      <section className="bg-[#eef7f0] border-y border-[#c1c9c0]/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-3xl font-extrabold text-[#144227]">50+</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#717971]">Verified Producers</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-extrabold text-[#144227]">12k+</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#717971]">Products Delivered</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-extrabold text-[#144227]">12 min</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#717971]">Avg Response</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-extrabold text-[#144227]">15+</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#717971]">Crop Categories</p>
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC PRODUCT CAROUSEL / SLIDER */}
      {acceptedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold text-[#1c1c18] tracking-tight">What's popular this week</h2>
                <span className="bg-[#bceec8] text-[#00210f] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Percent size={10} /> 12% Off this week
                </span>
              </div>
              <p className="text-xs text-[#717971] mt-1 font-semibold">High-quality wholesale catalog items with finalized pricing.</p>
            </div>
            
            {acceptedProducts.length > 4 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevSlide}
                  className="p-2 border border-[#c1c9c0] rounded-full hover:bg-white text-[#414942] transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="p-2 border border-[#c1c9c0] rounded-full hover:bg-white text-[#414942] transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden w-full">
            <div 
              className="flex gap-6 transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${sliderIndex * (100 / 4)}%)` }}
            >
              {acceptedProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => onNavigate('product-detail', undefined, prod.id)}
                  className="bg-white border border-[#e5e2db] rounded-2xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group min-w-[260px] w-[calc(25%-18px)]"
                >
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#f6f3ec]">
                    <img 
                      src={prod.image_url} 
                      alt={prod.name} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" 
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] font-bold text-[#717971] uppercase tracking-wider">{prod.farmer_name}</span>
                      <h4 className="text-xs font-bold text-[#1c1c18] line-clamp-1">{prod.name}</h4>
                      <span className="block text-xs font-extrabold text-[#144227] mt-0.5">${parseFloat(prod.price).toFixed(2)} / {prod.unit}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(prod);
                      }}
                      className="w-7 h-7 bg-[#f6f3ec] text-[#144227] hover:bg-[#144227] hover:text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-90"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. HOW ORDER WORKS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#144227] bg-[#eef7f0] px-3.5 py-1 rounded-full">
            EASY STEPS
          </span>
          <h2 className="text-2xl font-extrabold text-[#144227] tracking-tight mt-3">How order works</h2>
          <p className="text-xs text-[#717971] mt-1 font-semibold">Simplify wholesale crop procurement in three digital steps.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 text-center space-y-4 shadow-sm hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-[#144227]/10 text-[#144227] flex items-center justify-center mx-auto text-lg font-bold">1</div>
            <h3 className="text-sm font-bold text-[#1c1c18]">Browse harvests</h3>
            <p className="text-xs text-[#717971] leading-relaxed">
              Select fresh produce from our interactive map and wholesale supplier list.
            </p>
          </div>
          <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 text-center space-y-4 shadow-sm hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-[#144227]/10 text-[#144227] flex items-center justify-center mx-auto text-lg font-bold">2</div>
            <h3 className="text-sm font-bold text-[#1c1c18]">Place your order</h3>
            <p className="text-xs text-[#717971] leading-relaxed">
              Submit custom counter proposals or lock standard pricing deals directly.
            </p>
          </div>
          <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 text-center space-y-4 shadow-sm hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-[#144227]/10 text-[#144227] flex items-center justify-center mx-auto text-lg font-bold">3</div>
            <h3 className="text-sm font-bold text-[#1c1c18]">Track route</h3>
            <p className="text-xs text-[#717971] leading-relaxed">
              Real-time route logging updates as your harvest moves to destination.
            </p>
          </div>
        </div>
      </section>

      {/* 5. GROW WITH HARVEST HILL ( split card banner ) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#144227] rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 items-center shadow-xl">
          {/* Grow Left */}
          <div className="p-8 md:p-12 space-y-6 text-white">
            <span className="text-[9px] uppercase tracking-widest bg-white/10 text-[#bceec8] px-3.5 py-1.5 rounded-full font-bold">
              GROWER COLLABORATIVE
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Grow with Harvest Hill</h2>
            <ul className="space-y-3.5 text-xs text-white/80">
              <li className="flex items-center gap-2.5 font-medium">
                <CheckCircle size={16} className="text-[#9ed0ab]" /> Access directly to local farmer products
              </li>
              <li className="flex items-center gap-2.5 font-medium">
                <CheckCircle size={16} className="text-[#9ed0ab]" /> Clear quality grades and specifications
              </li>
              <li className="flex items-center gap-2.5 font-medium">
                <CheckCircle size={16} className="text-[#9ed0ab]" /> Secure payments and digital delivery log
              </li>
            </ul>
            <button
              onClick={() => onNavigate('catalog')}
              className="bg-white text-[#144227] hover:bg-[#f6f3ec] px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Learn more
            </button>
          </div>

          {/* Grow Right */}
          <div className="h-[300px] lg:h-full relative overflow-hidden bg-surface-container-low min-h-[300px]">
            <img 
              src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&q=80" 
              alt="farmer in wheat field" 
              className="w-full h-full object-cover absolute inset-0"
            />
          </div>
        </div>
      </section>

      {/* 6. SHOP BY CATEGORY GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[#1c1c18] tracking-tight">Shop by category</h2>
          <p className="text-xs text-[#717971] mt-1 font-semibold">Explore diverse fresh collections curated for culinary professionals.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[480px]">
          {/* Large Left: Fruits */}
          <div 
            onClick={() => onNavigate('catalog', 'Fruits')}
            className="lg:col-span-5 bg-white border border-[#e5e2db] rounded-3xl overflow-hidden shadow-sm relative group cursor-pointer min-h-[280px]"
          >
            <img 
              src="https://images.unsplash.com/photo-1610832958506-ee56336191a1?w=600&q=80" 
              alt="fruits" 
              className="w-full h-full object-cover absolute inset-0 group-hover:scale-103 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-6 text-white space-y-1">
              <h3 className="text-lg font-bold">Fruits</h3>
              <p className="text-[10px] text-white/80">Fresh apples, berries, and regional citrus yields.</p>
            </div>
          </div>

          {/* Right Cards list */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6 h-full">
            {/* Vegetables */}
            <div 
              onClick={() => onNavigate('catalog', 'Vegetables')}
              className="bg-white border border-[#e5e2db] rounded-3xl overflow-hidden shadow-sm relative group cursor-pointer min-h-[220px]"
            >
              <img 
                src="https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&q=80" 
                alt="vegetables" 
                className="w-full h-full object-cover absolute inset-0 group-hover:scale-103 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                <h4 className="text-base font-bold">Vegetables</h4>
                <p className="text-[9px] text-white/80">Dark greens and root vegetables.</p>
              </div>
            </div>

            {/* Dairy */}
            <div 
              onClick={() => onNavigate('catalog', 'Animal-Based')}
              className="bg-white border border-[#e5e2db] rounded-3xl overflow-hidden shadow-sm relative group cursor-pointer min-h-[220px]"
            >
              <img 
                src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&q=80" 
                alt="dairy" 
                className="w-full h-full object-cover absolute inset-0 group-hover:scale-103 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                <h4 className="text-base font-bold">Dairy</h4>
                <p className="text-[9px] text-white/80">Butter, local cheese, and organic milk.</p>
              </div>
            </div>

            {/* Bakery */}
            <div 
              onClick={() => onNavigate('catalog', 'Grains')}
              className="bg-white border border-[#e5e2db] rounded-3xl overflow-hidden shadow-sm relative group cursor-pointer min-h-[220px]"
            >
              <img 
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80" 
                alt="grains and bakery" 
                className="w-full h-full object-cover absolute inset-0 group-hover:scale-103 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                <h4 className="text-base font-bold">Bakery</h4>
                <p className="text-[9px] text-white/80">Artisanal breads, grains, and wheat.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#144227] bg-[#eef7f0] px-3.5 py-1.5 rounded-full">
            REVIEWS
          </span>
          <h2 className="text-2xl font-extrabold text-[#144227] tracking-tight mt-3">Trusted on both sides of the harvest</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl p-5 shadow-sm space-y-4 text-xs font-semibold leading-relaxed">
            <div className="flex gap-0.5 text-amber-500"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/></div>
            <p className="text-[#414942]">
              "The contract options made it easy for us to negotiate bulk rates for our kitchens. Everything was transparently handled."
            </p>
            <div className="pt-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden"><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80" className="w-full h-full object-cover" /></div>
              <div>
                <p className="font-extrabold text-[#1c1c18]">Sarah Jenkins</p>
                <p className="text-[10px] text-[#717971]">Procurement Lead, Bite Corp</p>
              </div>
            </div>
          </div>

          {/* Card 2: Green Featured Card */}
          <div className="bg-[#144227] text-white rounded-2xl p-5 shadow-md space-y-4 text-xs font-semibold leading-relaxed">
            <div className="flex gap-0.5 text-[#9ed0ab]"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/></div>
            <p className="text-white/90">
              "Direct buyer bidding helps us secure crop margins before harvest is fully completed. Highly recommended collaborative."
            </p>
            <div className="pt-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" className="w-full h-full object-cover" /></div>
              <div>
                <p className="font-extrabold text-white">David Kamanzi</p>
                <p className="text-[10px] text-[#bceec8]/80">Wheat Grower, Green Hills Coop</p>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl p-5 shadow-sm space-y-4 text-xs font-semibold leading-relaxed">
            <div className="flex gap-0.5 text-amber-500"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/></div>
            <p className="text-[#414942]">
              "Delivery logs are synchronized automatically. Having signature tracking has resolved all of our prior disputes."
            </p>
            <div className="pt-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden"><img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80" className="w-full h-full object-cover" /></div>
              <div>
                <p className="font-extrabold text-[#1c1c18]">Elena Rostova</p>
                <p className="text-[10px] text-[#717971]">Logistics Manager, Fresh Foods</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. QUALITY SHOWCASE WITH LIVE MOCK DASHBOARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: UI Mockup Dashboard */}
        <div className="lg:col-span-6 bg-white border border-[#e5e2db] rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden group">
          <div className="flex items-center justify-between border-b border-[#f0eee7] pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#144227]/20 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-[#144227]"/></span>
              <span className="font-extrabold text-[#1c1c18]">Supply Chain Log</span>
            </div>
            <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded font-bold uppercase">Synced</span>
          </div>

          <div className="space-y-3 font-mono text-[10px] text-[#414942]">
            <div className="flex justify-between border-b border-[#f0eee7]/60 pb-2">
              <span>ORDER REFERENCE:</span>
              <span className="font-bold text-[#1c1c18]">#ORD-184920</span>
            </div>
            <div className="flex justify-between border-b border-[#f0eee7]/60 pb-2">
              <span>SHIPMENT STATUS:</span>
              <span className="font-bold text-[#144227]">IN TRANSIT (VERIFIED)</span>
            </div>
            <div className="flex justify-between border-b border-[#f0eee7]/60 pb-2">
              <span>LEDGER DEPOSIT:</span>
              <span className="font-bold text-[#1c1c18]">$4,850.00</span>
            </div>
          </div>

          {/* Styled Mock Map / Chart block */}
          <div className="bg-[#fcf9f2] rounded-2xl p-4 border border-[#e5e2db] relative min-h-[140px] flex items-center justify-center overflow-hidden">
            {/* Mock Map Background Grid */}
            <div className="absolute inset-0 opacity-10 flex flex-wrap gap-2 p-1">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="w-8 h-8 border border-[#144227] rounded-sm" />
              ))}
            </div>
            {/* Route path */}
            <div className="relative w-full h-1 bg-[#144227]/20 rounded-full flex justify-between items-center px-8 z-10">
              <div className="w-3.5 h-3.5 rounded-full bg-[#144227] border-4 border-white flex items-center justify-center shadow-md"><MapPin size={6} className="text-white"/></div>
              <div className="w-3.5 h-3.5 rounded-full bg-[#9ed0ab] border-4 border-white flex items-center justify-center shadow-md animate-pulse"><Clock size={6} className="text-[#144227]"/></div>
              <div className="w-3.5 h-3.5 rounded-full bg-slate-300 border-4 border-white flex items-center justify-center shadow-md"><Award size={6} className="text-white"/></div>
            </div>
          </div>
        </div>

        {/* Right Column: Copywriting */}
        <div className="lg:col-span-6 space-y-6">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#144227] bg-[#eef7f0] px-3.5 py-1.5 rounded-full">
            QUALITY SYSTEM
          </span>
          <h2 className="text-3xl font-extrabold text-[#144227] leading-tight tracking-tight">
            How quality of our products works
          </h2>
          <p className="text-sm text-[#414942] font-semibold leading-relaxed">
            Every shipment goes through strict inspection processes. We maintain a high-trust verification chain so buyers receive exact specifications.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="p-3 bg-[#eef7f0] text-[#144227] rounded-xl shrink-0 h-fit"><ShieldCheck size={20}/></div>
              <div>
                <h4 className="text-sm font-bold text-[#1c1c18]">Vetted local farms</h4>
                <p className="text-xs text-[#717971] leading-relaxed mt-0.5">We check supplier licenses and verify soil/growth practices in regional locations.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="p-3 bg-[#eef7f0] text-[#144227] rounded-xl shrink-0 h-fit"><Truck size={20}/></div>
              <div>
                <h4 className="text-sm font-bold text-[#1c1c18]">Certified logistics</h4>
                <p className="text-xs text-[#717971] leading-relaxed mt-0.5">Inbound transports keep exact temperature controls logged on-chain.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#144227] bg-[#eef7f0] px-3.5 py-1.5 rounded-full">
            QUESTIONS
          </span>
          <h2 className="text-2xl font-extrabold text-[#144227] tracking-tight mt-3">Frequently asked questions</h2>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = faqOpenIndex === idx;
            return (
              <div 
                key={idx} 
                className="bg-white border border-[#e5e2db] rounded-2xl overflow-hidden transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-[#1c1c18] hover:bg-[#f6f3ec]/40 transition-colors outline-none cursor-pointer"
                >
                  <span className="font-sans font-bold pr-4">{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} className="text-[#144227] shrink-0" /> : <ChevronDown size={16} className="text-[#717971] shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 pt-1 text-xs text-[#717971] leading-relaxed border-t border-[#f0eee7] bg-[#fcf9f2]/40 font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-[#144227] text-white rounded-[32px] p-8 md:p-14 text-center space-y-6 shadow-xl relative overflow-hidden flex flex-col items-center">
          {/* Subtle backgrounds */}
          <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-[#376847]/40 blur-2xl pointer-events-none" />
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[#376847]/40 blur-2xl pointer-events-none" />

          <h2 className="text-2xl md:text-4xl font-extrabold max-w-xl leading-tight font-sans">
            Ready to taste the difference?
          </h2>
          <p className="text-xs md:text-sm text-[#9ed0ab] font-bold max-w-md">
            Get fresh crop directly from local farm now. Lock negotiated rates.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('catalog')}
              className="bg-white text-[#144227] hover:bg-[#f6f3ec] px-8 py-3.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              Shop all
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
