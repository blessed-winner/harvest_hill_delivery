"use client";

import { useState } from 'react';
import { Grid, List, ChevronRight, SlidersHorizontal, ArrowUpDown, ChevronLeft, ArrowRight, ShoppingCart } from 'lucide-react';

interface CatalogProps {
  onNavigate: (screen: string) => void;
  addToCart: () => void;
}

export default function Catalog({ onNavigate, addToCart }: CatalogProps) {
  const [organicOnly, setOrganicOnly] = useState(true);
  const [inSeason, setInSeason] = useState(false);
  const [bulkAvailable, setBulkAvailable] = useState(false);
  const [priceMax, setPriceMax] = useState(35); // slider
  const [selectedCategory, setSelectedCategory] = useState('stone');
  const [sortBy, setSortBy] = useState('Freshness First');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  const products = [
    {
      id: 'cherries',
      badge: 'SEASONAL',
      badgeColor: 'bg-[#9ed0ab] text-[#00210f]',
      name: 'Organic Bing Cherries',
      farm: 'Oak Grove Farms',
      price: '$12.50',
      unit: 'per 2lb basket',
      img: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80'
    },
    {
      id: 'apricots',
      badge: 'NEW ARRIVAL',
      badgeColor: 'bg-[#ffdcc5] text-[#301400]',
      name: 'Sun-Ripened Apricots',
      farm: 'Hillside Orchards',
      price: '$8.75',
      unit: 'per dozen',
      img: 'https://images.unsplash.com/photo-1501159724905-a56cbcd5b8c3?w=400&q=80'
    },
    {
      id: 'grapes',
      badge: 'BEST SELLER',
      badgeColor: 'bg-[#144227] text-white',
      name: 'Concord Table Grapes',
      farm: 'Vineyard Valley',
      price: '$5.40',
      unit: 'per lb',
      img: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80'
    },
    {
      id: 'apples',
      badge: null,
      name: 'Honeycrisp Apples',
      farm: 'Northern Ridge',
      price: '$14.00',
      unit: '5lb bag',
      img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80'
    },
    {
      id: 'berries',
      badge: null,
      name: 'Mixed Berry Basket',
      farm: 'Berry Patch Co.',
      price: '$18.90',
      unit: 'Variety Pack',
      img: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&q=80'
    },
    {
      id: 'pears',
      badge: null,
      name: 'Heritage Anjou Pears',
      farm: 'River Bend Farms',
      price: '$9.20',
      unit: 'per 3lb',
      img: 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=400&q=80'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Breadcrumbs */}
      <div className="text-xs text-[#717971] flex items-center gap-1.5 mb-4">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer">Home</button>
        <ChevronRight size={12} />
        <button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors cursor-pointer">Catalog</button>
        <ChevronRight size={12} />
        <span className="text-[#1c1c18] font-bold">Fruits & Orchards</span>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight">Seasonal Fruits</h1>
        <p className="text-xs text-[#717971] mt-1">Showing 1-24 of 142 products from certified local suppliers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar Filters */}
        <div className="space-y-6">
          
          {/* Categories card */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#1c1c18] uppercase tracking-wider">Categories</h3>
            
            <div className="space-y-3">
              {[
                { id: 'stone', label: 'Stone Fruits', count: 42 },
                { id: 'berries', label: 'Berries', count: 28 },
                { id: 'citrus', label: 'Citrus', count: 19 },
                { id: 'apples', label: 'Apples & Pears', count: 35 },
              ].map((cat) => (
                <label key={cat.id} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat.id}
                      onChange={() => setSelectedCategory(cat.id)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-[#144227] border-[#144227] text-white'
                        : 'border-[#c1c9c0] bg-white group-hover:border-[#144227]'
                    }`}>
                      {selectedCategory === cat.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-xs text-[#414942] font-semibold group-hover:text-[#144227]">{cat.label}</span>
                  </div>
                  <span className="text-[10px] text-[#717971] bg-[#f0eee7] px-1.5 py-0.5 rounded-full font-bold">({cat.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range card */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#1c1c18] uppercase tracking-wider">Price Range</h3>
            
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="70"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-[#144227] bg-[#f0eee7] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs font-bold text-[#414942]">
                <span>Min <span className="text-[#1c1c18]">$0.00</span></span>
                <span>Max <span className="text-[#144227]">${priceMax.toFixed(2)}</span></span>
              </div>
            </div>
          </div>

          {/* Toggle Switches card */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="space-y-4">
              
              {/* Toggle 1: Organic */}
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setOrganicOnly(!organicOnly)}>
                <div>
                  <span className="block text-xs font-bold text-[#1c1c18]">Organic Only</span>
                  <span className="block text-[10px] text-[#717971]">Certified farms</span>
                </div>
                <button
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                    organicOnly ? 'bg-[#9ed0ab]' : 'bg-[#e5e2db]'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white shadow absolute transition-all ${
                    organicOnly ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Toggle 2: In Season */}
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setInSeason(!inSeason)}>
                <div>
                  <span className="block text-xs font-bold text-[#1c1c18]">In Season</span>
                  <span className="block text-[10px] text-[#717971]">Harvested recently</span>
                </div>
                <button
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                    inSeason ? 'bg-[#9ed0ab]' : 'bg-[#e5e2db]'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white shadow absolute transition-all ${
                    inSeason ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Toggle 3: Bulk */}
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setBulkAvailable(!bulkAvailable)}>
                <div>
                  <span className="block text-xs font-bold text-[#1c1c18]">Bulk Available</span>
                  <span className="block text-[10px] text-[#717971]">Wholesale pricing</span>
                </div>
                <button
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                    bulkAvailable ? 'bg-[#9ed0ab]' : 'bg-[#e5e2db]'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white shadow absolute transition-all ${
                    bulkAvailable ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

            </div>
          </div>

          {/* Farmer of the Month Card */}
          <div className="bg-[#144227] text-white rounded-2xl p-5 shadow-sm space-y-4">
            <span className="inline-block bg-[#376847] text-[#bceec8] text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
              Farmer of the Month
            </span>
            <div>
              <h4 className="text-lg font-bold">Hillside Orchards</h4>
              <p className="text-xs text-white/80 leading-relaxed mt-1">
                Direct from Sonoma Valley. Get 15% off bulk cherry orders.
              </p>
            </div>
            <button
              onClick={() => {
                setOrganicOnly(true);
                setSelectedCategory('stone');
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-[#9ed0ab] hover:underline underline-offset-4 cursor-pointer"
            >
              Browse Collection <ArrowRight size={14} />
            </button>
          </div>

        </div>

        {/* Right Product Grid */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Controls Bar (Sort By & Layout mode) */}
          <div className="flex items-center justify-between bg-white border border-[#e5e2db] rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#414942]">
              <ArrowUpDown size={14} className="text-[#717971]" />
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-[#144227] focus:outline-none cursor-pointer border-none p-0 ml-1 focus:ring-0"
              >
                <option value="Freshness First">Freshness First</option>
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Price: High to Low">Price: High to Low</option>
              </select>
            </div>

            <div className="flex items-center gap-1 border-l border-[#f0eee7] pl-3">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-md cursor-pointer ${
                  layoutMode === 'grid' ? 'bg-[#f0eee7] text-[#144227]' : 'text-[#717971] hover:bg-[#fcf9f2]'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 rounded-md cursor-pointer ${
                  layoutMode === 'list' ? 'bg-[#f0eee7] text-[#144227]' : 'text-[#717971] hover:bg-[#fcf9f2]'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className={
            layoutMode === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {products.map((prod) => (
              <div
                key={prod.id}
                onClick={() => onNavigate('product-detail')}
                className={`bg-white border border-[#e5e2db] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex ${
                  layoutMode === 'grid' ? 'flex-col justify-between max-w-[260px] w-full mx-auto' : 'flex-row items-center p-4 gap-4'
                }`}
              >
                {/* Product Image */}
                <div 
                  className={`relative bg-[#f6f3ec] overflow-hidden ${
                    layoutMode === 'grid' ? 'w-full' : 'w-24 h-24 rounded-lg'
                  }`}
                  style={layoutMode === 'grid' ? { aspectRatio: '26 / 24' } : undefined}
                >
                  <img
                    src={prod.img}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  {prod.badge && (
                    <span className={`absolute top-2.5 left-2.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-sm ${prod.badgeColor}`}>
                      {prod.badge}
                    </span>
                  )}
                </div>

                {/* Content Panel */}
                <div className={`flex-grow flex flex-col justify-between ${
                  layoutMode === 'grid' ? 'p-3.5' : 'p-0'
                }`}>
                  <div>
                    <span className="block text-[8px] font-bold tracking-wider text-[#717971] uppercase">{prod.farm}</span>
                    <h3 className="text-xs font-bold text-[#1c1c18] mt-0.5 group-hover:text-[#144227] transition-colors line-clamp-1">{prod.name}</h3>
                  </div>

                  <div className={`flex items-center justify-between border-t border-[#f0eee7] ${
                    layoutMode === 'grid' ? 'mt-2.5 pt-2' : 'mt-2 pt-2'
                  }`}>
                    <div>
                      <span className="block text-xs font-bold text-[#144227]">{prod.price}</span>
                      <span className="block text-[8px] text-[#717971] uppercase font-semibold">{prod.unit}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart();
                      }}
                      className="bg-[#144227] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#376847] transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <ShoppingCart size={11} /> Add to Cart
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1.5 pt-4">
            <button className="p-2 border border-[#c1c9c0] rounded-lg hover:bg-white text-[#414942] disabled:opacity-50 cursor-pointer" disabled>
              <ChevronLeft size={16} />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#144227] text-white text-xs font-bold">1</button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#c1c9c0] hover:bg-white text-xs text-[#414942] cursor-pointer">2</button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#c1c9c0] hover:bg-white text-xs text-[#414942] cursor-pointer">3</button>
            <span className="text-xs text-[#717971] px-1">...</span>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#c1c9c0] hover:bg-white text-xs text-[#414942] cursor-pointer">12</button>
            <button className="p-2 border border-[#c1c9c0] rounded-lg hover:bg-white text-[#414942] cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
