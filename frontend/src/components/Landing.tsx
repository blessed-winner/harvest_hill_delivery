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
  const [supplies, setSupplies] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [prodRes, suppRes] = await Promise.all([
          clientApi.products.list().catch(() => []),
          clientApi.supplies.list().catch(() => [])
        ]);
        setProducts(prodRes?.results || prodRes || []);
        setSupplies(suppRes?.results || suppRes || []);
      } catch (err) {
        console.error("Failed to fetch landing data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeFarmerSupplies = supplies.filter((s: any) => s.status === 'accepted' || s.status === 'pending');
  const flashDealSupplies = activeFarmerSupplies.filter((s: any) => s.is_discounted);

  // Circular Category Icons
  const categoryBubbles = [
    { name: "Fruits", category: "Fruits", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&auto=format&fit=crop&q=80" },
    { name: "Greens", category: "Vegetables", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80" },
    { name: "Dairy", category: "Animal-Based", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=80" },
    { name: "Bakery", category: "Grains", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80" },
    { name: "Grains", category: "Grains", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80" },
    { name: "Veg", category: "Vegetables", image: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&auto=format&fit=crop&q=80" },
    { name: "Animal", category: "Animal-Based", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&auto=format&fit=crop&q=80" }
  ];

  if (loading) {
    return (
      <div className="bg-[#f5f4ef] text-[#1c1c18] font-sans min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#144227] border-t-transparent"></div>
      </div>
    );
  }



  return (
    <div className="bg-[#f5f4ef] text-[#1c1c18] font-sans space-y-10 pb-16">
      
      {/* 1. HERO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="relative rounded-3xl overflow-hidden min-h-[380px] sm:min-h-[440px] flex items-center shadow-lg border border-[#e5e2db]">
          <img 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80" 
            alt="Harvest Hill Organic Produce" 
            className="w-full h-full object-cover absolute inset-0 transform scale-105 hover:scale-100 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#144227]/90 via-[#144227]/60 to-transparent" />
          
          <div className="relative z-10 p-8 sm:p-14 max-w-xl text-white space-y-5">
            <span className="inline-block bg-[#9ed0ab] text-[#00210f] font-extrabold text-[10px] uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-sm">
              FRESH LOCAL HARVESTS
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight font-sans text-white drop-shadow-sm">
              Farm-Direct Goods Delivered To Your Table.
            </h1>
            <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
              Connecting local Rwandan family farms directly with your kitchen. Guaranteed freshness, fair pricing, and 100% sustainable produce.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => onNavigate('catalog')}
                className="bg-[#9ed0ab] text-[#00210f] hover:bg-[#8cc49a] font-extrabold text-xs px-7 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
              >
                Explore Marketplace
              </button>
              <button
                onClick={() => onNavigate('catalog', 'Vegetables')}
                className="bg-white/15 backdrop-blur-md text-white border border-white/30 hover:bg-white/25 font-bold text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer"
              >
                In-Season Veg
              </button>
            </div>
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
          {(supplies.length > 0 ? supplies.slice(0, 5) : products.slice(0, 5)).map((item: any) => {
            const isSupply = !!item.product_detail;
            const name = isSupply ? item.product_detail?.name : item.name;
            const farm = isSupply ? (item.farmer_name || 'Local Farm') : 'Harvest Hill Farm';
            const priceVal = isSupply ? Number(item.price) : Number(item.base_price || 0);
            const imgUrl = isSupply ? (item.photo || item.product_detail?.image_url) : (item.image_url || item.image);
            const unit = isSupply ? (item.unit || item.product_detail?.unit || 'kg') : (item.unit || 'kg');
            const targetProdId = isSupply ? (item.product_detail?.id || item.product || item.id) : item.id;

            return (
              <div 
                key={item.id} 
                onClick={() => onNavigate('product-detail', undefined, targetProdId)}
                className="bg-white rounded-2xl p-3 border border-[#e5e2db] shadow-sm flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all"
              >
                <div>
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#f6f3ec] mb-3">
                    <img 
                      src={imgUrl || "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=400&q=80"} 
                      alt={name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  </div>
                  <span className="text-[10px] text-[#717971] block font-medium">{farm}</span>
                  <h4 className="text-xs font-bold text-[#1c1c18] line-clamp-1">{name}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-1">
                    <Star size={10} fill="currentColor" /> 4.9 (Fresh)
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-extrabold text-[#1c1c18]">
                    RWF {priceVal.toLocaleString()}
                    <span className="text-[10px] text-[#717971] font-normal">/{unit}</span>
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }}
                    className="w-7 h-7 bg-[#144227] text-white hover:bg-[#376847] rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. FLASH DEALS BANNER & CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-[#ba1a1a] text-white text-[10px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider">FLASH DEALS</span>
          <span className="text-xs font-bold text-[#1c1c18]">Ends in <span className="font-mono text-sm font-extrabold text-[#ba1a1a]">04:22:15</span></span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {flashDealSupplies.length > 0 ? (
            flashDealSupplies.map((item: any) => {
              const original = Number(item.price);
              const disc = Number(item.discount_price || item.price);
              const pct = original > 0 ? Math.round(((original - disc) / original) * 100) : 15;
              const prodName = item.product_detail?.name || 'Farm Produce';
              const imgUrl = item.photo || item.product_detail?.image_url || 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80';
              return (
                <div 
                  key={item.id} 
                  onClick={() => onNavigate('product-detail', undefined, item.product_detail?.id || item.product)}
                  className="bg-white rounded-2xl p-2.5 border border-[#e5e2db] shadow-sm relative cursor-pointer hover:shadow-md transition-all"
                >
                  <span className="absolute top-4 left-4 bg-[#ba1a1a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    -{pct}%
                  </span>
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#f6f3ec] mb-2">
                    <img src={imgUrl} alt={prodName} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-xs font-bold text-[#1c1c18] truncate">{prodName}</h4>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xs font-extrabold text-[#ba1a1a]">RWF {disc.toLocaleString()}</span>
                    <span className="text-[10px] text-[#717971] line-through">RWF {original.toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white rounded-2xl p-6 text-center text-xs text-[#717971] border border-[#e5e2db]">
              No active flash deal discounts right now. Check back soon!
            </div>
          )}
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
          {(supplies.length > 0 ? supplies.slice(0, 5) : products.slice(0, 5)).map((item: any) => {
            const isSupply = !!item.product_detail;
            const name = isSupply ? item.product_detail?.name : item.name;
            const farm = isSupply ? (item.farmer_name || 'Local Farm') : 'Harvest Hill Farm';
            const priceVal = isSupply ? Number(item.price) : Number(item.base_price || 0);
            const imgUrl = isSupply ? (item.photo || item.product_detail?.image_url) : (item.image_url || item.image);
            const targetProdId = isSupply ? (item.product_detail?.id || item.product || item.id) : item.id;

            return (
              <div 
                key={item.id} 
                onClick={() => onNavigate('product-detail', undefined, targetProdId)}
                className="bg-white rounded-2xl p-3 border border-[#e5e2db] shadow-sm flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all"
              >
                <div>
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#f6f3ec] mb-3 relative">
                    <span className="absolute top-2 left-2 bg-[#144227] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">NEW</span>
                    <img 
                      src={imgUrl || "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=400&q=80"} 
                      alt={name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  </div>
                  <span className="text-[10px] text-[#717971] block font-medium">{farm}</span>
                  <h4 className="text-xs font-bold text-[#1c1c18] line-clamp-1">{name}</h4>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-extrabold text-[#1c1c18]">RWF {priceVal.toLocaleString()}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }}
                    className="w-7 h-7 bg-[#144227] text-white hover:bg-[#376847] rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
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
            <p className="text-xs text-white/80 max-w-sm">Join our network of local family farms and reach thousands of customers.</p>
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
            <p className="text-xs text-white/80 max-w-sm">Stock up and save on wholesale-size produce crates for families and events.</p>
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
          {(supplies.length > 0 ? supplies.slice(0, 5) : products.slice(0, 5)).map((item: any) => {
            const isSupply = !!item.product_detail;
            const name = isSupply ? item.product_detail?.name : item.name;
            const farm = isSupply ? (item.farmer_name || 'Local Farm') : 'Harvest Hill Farm';
            const priceVal = isSupply ? Number(item.price) : Number(item.base_price || 0);
            const imgUrl = isSupply ? (item.photo || item.product_detail?.image_url) : (item.image_url || item.image);
            const unit = isSupply ? (item.unit || item.product_detail?.unit || 'kg') : (item.unit || 'kg');
            const targetProdId = isSupply ? (item.product_detail?.id || item.product || item.id) : item.id;

            return (
              <div 
                key={item.id} 
                onClick={() => onNavigate('product-detail', undefined, targetProdId)}
                className="bg-white rounded-2xl p-3 border border-[#e5e2db] shadow-sm flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all"
              >
                <div>
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#f6f3ec] mb-3">
                    <img 
                      src={imgUrl || "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=400&q=80"} 
                      alt={name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  </div>
                  <span className="text-[10px] text-[#717971] block font-medium">{farm}</span>
                  <h4 className="text-xs font-bold text-[#1c1c18] line-clamp-1">{name}</h4>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-extrabold text-[#1c1c18]">
                    RWF {priceVal.toLocaleString()}
                    <span className="text-[10px] text-[#717971] font-normal">/{unit}</span>
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }}
                    className="w-7 h-7 bg-[#144227] text-white hover:bg-[#376847] rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. BROWSE ALL DEPARTMENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#1c1c18]">Browse All Departments</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Fresh Fruits", category: "Fruits", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80" },
            { name: "Organic Veg", category: "Vegetables", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80" },
            { name: "Grains", category: "Grains", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80" },
            { name: "Butcher Shop", category: "Animal-Based", image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=80" }
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
