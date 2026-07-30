"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ChevronLeft, ChevronRight, Plus, ShoppingBag, 
  MapPin, ShieldCheck, Truck, Clock, Leaf, Search, Star
} from 'lucide-react';
import { clientApi } from '../portals/client/lib/api';

interface LandingProps {
  onNavigate: (screen: string, category?: string, productId?: number) => void;
  addToCart: (product?: any) => void;
}

export default function Landing({ onNavigate, addToCart }: LandingProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await clientApi.products.list();
        setProducts(res?.results || res || []);
      } catch (err) {
        console.error("Failed to fetch landing products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Popular this week items
  const popularItems = [
    {
      id: 1,
      farm: "Ocean Valley Farm",
      name: "Organic Fuji Apples",
      rating: "4.8 (126)",
      price: "$4.99",
      unit: "lb",
      image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80"
    },
    {
      id: 2,
      farm: "Sunny Brook Dairy",
      name: "Fresh Strawberries",
      rating: "4.9 (380)",
      price: "$6.50",
      unit: "pkg",
      image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80"
    },
    {
      id: 3,
      farm: "Happy Hen Farms",
      name: "Large Brown Eggs (12pk)",
      rating: "4.7 (240)",
      price: "$5.25",
      unit: "dozen",
      image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80"
    },
    {
      id: 4,
      farm: "Earthwise Gardens",
      name: "Heirloom Carrots",
      rating: "4.8 (110)",
      price: "$3.99",
      unit: "bunch",
      image: "https://images.unsplash.com/photo-1598170845058-12ef4a457939?w=400&q=80"
    },
    {
      id: 5,
      farm: "River Valley Dairy",
      name: "A2 Organic Whole Milk",
      rating: "4.9 (184)",
      price: "$7.20",
      unit: "gal",
      image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80"
    }
  ];

  // Flash Deals
  const flashDeals = [
    {
      id: 101,
      name: "Avocados (3pk)",
      discount: "-15%",
      price: "$3.25",
      oldPrice: "$3.90",
      image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80"
    },
    {
      id: 102,
      name: "Clover Honey 12oz",
      discount: "-20%",
      price: "$8.80",
      oldPrice: "$11.00",
      image: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=400&q=80"
    },
    {
      id: 103,
      name: "Savoy Cabbage",
      discount: "-10%",
      price: "$1.50",
      oldPrice: "$1.70",
      image: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&q=80"
    },
    {
      id: 104,
      name: "Aged Cheddar 8oz",
      discount: "-15%",
      price: "$5.95",
      oldPrice: "$7.00",
      image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&q=80"
    },
    {
      id: 105,
      name: "Asparagus Bunch",
      discount: "-15%",
      price: "$2.40",
      oldPrice: "$2.85",
      image: "https://images.unsplash.com/photo-1515471209610-e3b35f68a69d?w=400&q=80"
    },
    {
      id: 106,
      name: "Wild Mushrooms Mix",
      discount: "-10%",
      price: "$6.75",
      oldPrice: "$7.50",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80"
    }
  ];

  // New From Local Farms
  const newArrivals = [
    {
      id: 201,
      farm: "Black Soil Estate",
      name: "Spring Radishes",
      price: "$2.50",
      image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80"
    },
    {
      id: 202,
      farm: "Hillside Foragers",
      name: "Wild Ramps",
      price: "$4.00",
      image: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&q=80"
    },
    {
      id: 203,
      farm: "Oak Grove Creamery",
      name: "Herbed Goat Cheese",
      price: "$9.50",
      image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80"
    },
    {
      id: 204,
      farm: "Old Town Bakery",
      name: "Walnut Sourdough",
      price: "$6.75",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80"
    },
    {
      id: 205,
      farm: "Cider Hill Orchards",
      name: "Unfiltered Apple Cider",
      price: "$8.00",
      image: "https://images.unsplash.com/photo-1576675784201-0e1697726a07?w=400&q=80"
    }
  ];

  // Recommended For You
  const recommendedItems = [
    {
      id: 301,
      farm: "Clean Greens Farms",
      name: "Organic Broccoli",
      price: "$3.50",
      unit: "lb",
      image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80"
    },
    {
      id: 302,
      farm: "Fair Trade Farms",
      name: "Organic Bananas",
      price: "$0.89",
      unit: "lb",
      image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80"
    },
    {
      id: 303,
      farm: "Valley Nut Co.",
      name: "Raw Whole Almonds",
      price: "$12.50",
      image: "https://images.unsplash.com/photo-1508061252227-814144342217?w=400&q=80"
    },
    {
      id: 304,
      farm: "Green Leafy Gardens",
      name: "Curly Kale Bunch",
      price: "$2.99",
      image: "https://images.unsplash.com/photo-1524179091875-bf0a08c5745f?w=400&q=80"
    },
    {
      id: 305,
      farm: "The Cheese Monger",
      name: "Artisan Cheese Board",
      price: "$24.00",
      image: "https://images.unsplash.com/photo-1631379578550-7038263db699?w=400&q=80"
    }
  ];

  // Circular Category Icons
  const categoryBubbles = [
    { name: "Fruits", category: "Fruits", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&q=80" },
    { name: "Greens", category: "Vegetables", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80" },
    { name: "Dairy", category: "Animal-Based", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&q=80" },
    { name: "Bakery", category: "Grains", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80" },
    { name: "Grains", category: "Grains", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&q=80" },
    { name: "Veg", category: "Vegetables", image: "https://images.unsplash.com/photo-1598170845058-12ef4a457939?w=200&q=80" },
    { name: "Eggs", category: "Animal-Based", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&q=80" },
    { name: "Herbs", category: "Vegetables", image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=200&q=80" }
  ];

  return (
    <div className="bg-[#f5f4ef] text-[#1c1c18] font-sans space-y-10 pb-16">
      
      {/* 1. HERO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="relative rounded-3xl overflow-hidden min-h-[360px] sm:min-h-[420px] flex items-center shadow-md">
          <img 
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&q=80" 
            alt="Farm Hero" 
            className="w-full h-full object-cover absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          
          <div className="relative z-10 p-8 sm:p-14 max-w-xl text-white space-y-4">
            <span className="inline-block bg-[#ffc72c] text-black font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-md">
              SEASONAL SPECIAL
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              Fresh Organic Harvests Delivered Daily.
            </h1>
            <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
              Support 200+ local family farms. Zero middleman, maximum freshness, delivered straight to your doorstep.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('catalog')}
                className="bg-[#9ed0ab] text-[#144227] hover:bg-[#8cc49a] font-extrabold text-xs px-6 py-3 rounded-full transition-all cursor-pointer shadow-md"
              >
                Shop Spring Picks
              </button>
            </div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </div>
        </div>
      </section>

      {/* 2. CATEGORY BUBBLES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 overflow-x-auto py-2 scrollbar-hide">
          {categoryBubbles.map((cat, idx) => (
            <div 
              key={idx}
              onClick={() => onNavigate('catalog', cat.category)}
              className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:scale-105 transition-transform bg-white">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-bold text-[#414942] group-hover:text-[#144227]">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. POPULAR THIS WEEK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1c1c18]">Popular This Week</h2>
          <button onClick={() => onNavigate('catalog')} className="text-xs font-bold text-[#717971] hover:text-[#144227]">View All</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {popularItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-3 border border-[#e5e2db] shadow-sm flex flex-col justify-between group">
              <div>
                <div className="aspect-square rounded-xl overflow-hidden bg-[#f6f3ec] mb-3">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <span className="text-[10px] text-[#717971] block font-medium">{item.farm}</span>
                <h4 className="text-xs font-bold text-[#1c1c18] line-clamp-1">{item.name}</h4>
                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-1">
                  <Star size={10} fill="currentColor" /> {item.rating}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-extrabold text-[#1c1c18]">{item.price}<span className="text-[10px] text-[#717971] font-normal">/{item.unit || 'lb'}</span></span>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-7 h-7 bg-[#144227] text-white hover:bg-[#376847] rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FLASH DEALS BANNER & CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-[#ba1a1a] text-white text-[10px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider">FLASH DEALS</span>
          <span className="text-xs font-bold text-[#1c1c18]">Ends in <span className="font-mono text-sm font-extrabold text-[#ba1a1a]">04:22:15</span></span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {flashDeals.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-2.5 border border-[#e5e2db] shadow-sm relative">
              <span className="absolute top-4 left-4 bg-[#ba1a1a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                {item.discount}
              </span>
              <div className="aspect-square rounded-xl overflow-hidden bg-[#f6f3ec] mb-2">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <h4 className="text-xs font-bold text-[#1c1c18] truncate">{item.name}</h4>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xs font-extrabold text-[#ba1a1a]">{item.price}</span>
                <span className="text-[10px] text-[#717971] line-through">{item.oldPrice}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. NEW FROM LOCAL FARMS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1c1c18]">New From Local Farms</h2>
            <p className="text-xs text-[#717971]">Recently harvested within 50 miles of you.</p>
          </div>
          <button onClick={() => onNavigate('catalog')} className="text-xs font-bold text-[#717971] hover:text-[#144227]">See New Arrivals</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {newArrivals.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-3 border border-[#e5e2db] shadow-sm flex flex-col justify-between group">
              <div>
                <div className="aspect-square rounded-xl overflow-hidden bg-[#f6f3ec] mb-3 relative">
                  <span className="absolute top-2 left-2 bg-[#144227] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">NEW</span>
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <span className="text-[10px] text-[#717971] block font-medium">{item.farm}</span>
                <h4 className="text-xs font-bold text-[#1c1c18] line-clamp-1">{item.name}</h4>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-extrabold text-[#1c1c18]">{item.price}</span>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-7 h-7 bg-[#144227] text-white hover:bg-[#376847] rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. PROMO CARDS (BECOME A SUPPLIER / BULK PRICING) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1 */}
        <div className="relative rounded-3xl overflow-hidden min-h-[220px] p-8 flex flex-col justify-end text-white shadow-md">
          <img 
            src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&q=80" 
            alt="Farmer" 
            className="w-full h-full object-cover absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 space-y-2">
            <h3 className="text-2xl font-extrabold">Become a Supplier</h3>
            <p className="text-xs text-white/80 max-w-sm">Join our network of 200+ local family farms and reach thousands of customers.</p>
            <button onClick={() => onNavigate('catalog')} className="bg-white text-[#144227] font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer hover:bg-[#f0eee7]">Apply Now</button>
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative rounded-3xl overflow-hidden min-h-[220px] p-8 flex flex-col justify-end text-white shadow-md">
          <img 
            src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80" 
            alt="Bulk Pricing" 
            className="w-full h-full object-cover absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 space-y-2">
            <h3 className="text-2xl font-extrabold">Bulk Pricing</h3>
            <p className="text-xs text-white/80 max-w-sm">Stock up and save up to 25% on wholesale-size produce crates for families and events.</p>
            <button onClick={() => onNavigate('catalog')} className="bg-[#ff9800] text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer hover:bg-[#e68900]">Shop Bulk</button>
          </div>
        </div>
      </section>

      {/* 7. RECOMMENDED FOR YOU */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1c1c18]">Recommended For You</h2>
            <p className="text-xs text-[#717971]">Based on your history</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {recommendedItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-3 border border-[#e5e2db] shadow-sm flex flex-col justify-between group">
              <div>
                <div className="aspect-square rounded-xl overflow-hidden bg-[#f6f3ec] mb-3">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <span className="text-[10px] text-[#717971] block font-medium">{item.farm}</span>
                <h4 className="text-xs font-bold text-[#1c1c18] line-clamp-1">{item.name}</h4>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-extrabold text-[#1c1c18]">{item.price}{item.unit && <span className="text-[10px] text-[#717971] font-normal">/{item.unit}</span>}</span>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-7 h-7 bg-[#144227] text-white hover:bg-[#376847] rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. BROWSE ALL DEPARTMENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#1c1c18]">Browse All Departments</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Fresh Fruits", category: "Fruits", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&q=80" },
            { name: "Organic Veg", category: "Vegetables", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80" },
            { name: "Pantry Essentials", category: "Grains", image: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=500&q=80" },
            { name: "Butcher Shop", category: "Animal-Based", image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&q=80" }
          ].map((dept, idx) => (
            <div 
              key={idx}
              onClick={() => onNavigate('catalog', dept.category)}
              className="bg-white rounded-2xl overflow-hidden border border-[#e5e2db] shadow-sm cursor-pointer group"
            >
              <div className="h-32 overflow-hidden bg-[#f6f3ec]">
                <img src={dept.image} alt={dept.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-xs font-bold text-[#1c1c18]">{dept.name}</span>
                <ArrowRight size={14} className="text-[#717971] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. TRUST BADGES FOOTER */}
      <section className="bg-white border-t border-[#e5e2db] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center gap-1.5">
            <ShieldCheck size={20} className="text-[#144227]" />
            <span className="text-xs font-bold text-[#1c1c18]">Verified Local Farms</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Truck size={20} className="text-[#144227]" />
            <span className="text-xs font-bold text-[#1c1c18]">Same Day Delivery</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Leaf size={20} className="text-[#144227]" />
            <span className="text-xs font-bold text-[#1c1c18]">Eco-Friendly Packaging</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Clock size={20} className="text-[#144227]" />
            <span className="text-xs font-bold text-[#1c1c18]">Safe, Contactless Drop</span>
          </div>
        </div>
      </section>

    </div>
  );
}
