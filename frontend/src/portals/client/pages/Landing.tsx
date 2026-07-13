"use client";

import { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Sprout, ShieldCheck, Truck, Plus, ShoppingCart, Percent, AlertCircle } from 'lucide-react';

interface LandingProps {
  onNavigate: (screen: string) => void;
  addToCart: () => void;
}

export default function Landing({ onNavigate, addToCart }: LandingProps) {
  // Local farms scroll slider offset state
  const [scrollIndex, setScrollIndex] = useState(0);

  const partners = [
    { name: 'GreenValley', icon: Sprout },
    { name: 'RootedFarms', icon: Sprout },
    { name: 'SunPeak', icon: Sprout },
    { name: 'BlueStream', icon: Sprout },
    { name: 'WiseEarth', icon: Sprout }
  ];

  const popularItems = [
    {
      id: 'tomatoes',
      badge: 'ENDING SOON',
      badgeColor: 'bg-[#ffdcc5] text-[#301400]',
      brand: 'HERITAGE ACRES',
      name: 'Red Heirloom Tomatoes',
      price: '$4.50 / lb',
      img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
      negotiable: true
    },
    {
      id: 'kale',
      brand: 'GREENLEAF COLLECTIVE',
      name: 'Organic Lacinato Kale',
      price: '$3.25 / bunch',
      img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
      negotiable: true
    },
    {
      id: 'apples',
      brand: 'SUN-RIPENED ORCHARDS',
      name: 'Honeycrisp Apples',
      price: '$1.95 / lb',
      img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
      negotiable: true
    },
    {
      id: 'cheddar',
      badge: 'BEST VALUE',
      badgeColor: 'bg-[#9ed0ab] text-[#00210f]',
      brand: 'OAKWOOD CREAMERY',
      name: 'Aged Sharp Cheddar',
      price: '$8.75 / block',
      img: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=400&q=80',
      negotiable: true
    }
  ];

  const localFarms = [
    {
      id: 'carrots',
      brand: 'Meadowview Estates',
      name: 'Rainbow Carrots',
      price: '$2.40 / lb',
      img: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400&q=80'
    },
    {
      id: 'garlic',
      brand: 'Silverleaf Farm',
      name: 'Hardneck Garlic',
      price: '$1.15 / ea',
      img: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&q=80'
    },
    {
      id: 'basil',
      brand: 'Urban Greens Town Farm',
      name: 'Genovese Basil',
      price: '$4.00 / oz',
      img: 'https://images.unsplash.com/photo-1608797178974-15b35a61d121?w=400&q=80'
    },
    {
      id: 'mushrooms',
      brand: 'Mountain Fungi Co.',
      name: 'Blue Oyster Mushrooms',
      price: '$12.50 / lb',
      img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80'
    }
  ];

  return (
    <div className="space-y-12 pb-16 font-sans">
      
      {/* 1. Hero Orchard Banner Section */}
      <section
        className="relative bg-cover bg-center h-[420px] flex items-center px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&q=80')` }}
      >
        <div className="max-w-4xl mx-auto w-full text-white space-y-5">
          <span className="inline-block text-[10px] uppercase font-black tracking-widest bg-[#376847]/80 text-[#bceec8] px-3.5 py-1 rounded-full backdrop-blur-sm">
            Seasonal Feature
          </span>
          
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight max-w-2xl drop-shadow-sm">
            Summer Orchard Harvest
          </h1>
          
          <p className="text-sm sm:text-base opacity-90 max-w-xl leading-relaxed drop-shadow-sm">
            Experience the peak of freshness with our hand-selected orchard fruits. Directly from regional growers to your supply chain, negotiated for peak value.
          </p>

          <div className="flex items-center gap-3.5 pt-2">
            <button
              onClick={() => onNavigate('catalog')}
              className="bg-[#144227] text-white hover:bg-[#376847] px-6 py-3 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Shop Now
            </button>
            <button
              onClick={() => onNavigate('catalog')}
              className="bg-white/10 hover:bg-white/20 border border-white/40 text-white px-6 py-3 rounded-lg text-xs font-bold transition-all backdrop-blur-sm cursor-pointer"
            >
              Explore Varieties
            </button>
          </div>
        </div>
      </section>

      {/* 2. Trusted Partners Bar */}
      <section className="bg-[#f0eee7]/50 border-y border-[#e5e2db] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-[9px] uppercase font-bold tracking-widest text-[#717971]">Trusted by 500+ Local Producers</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 text-sm font-extrabold text-[#717971]/80">
            {partners.map((p, idx) => (
              <div key={idx} className="flex items-center gap-1.5 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <p.icon size={16} className="text-[#144227]" />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Popular this week section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-[#1c1c18] tracking-tight">Popular this week</h2>
            <p className="text-xs text-[#717971] mt-0.5">High-demand staples currently trending across the platform.</p>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="flex items-center gap-1 text-xs font-bold text-[#144227] hover:underline cursor-pointer"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {popularItems.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onNavigate('product-detail')}
              className="bg-white border border-[#e5e2db] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer group"
            >
              <div className="relative aspect-[4/3] bg-[#f6f3ec] overflow-hidden">
                <img src={prod.img} alt={prod.name} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                {prod.badge && (
                  <span className={`absolute top-3 left-3 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm ${prod.badgeColor}`}>
                    {prod.badge}
                  </span>
                )}
              </div>

              <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                <div>
                  <span className="block text-[8px] font-bold tracking-wider text-[#717971] uppercase">{prod.brand}</span>
                  <h3 className="text-xs font-bold text-[#1c1c18] mt-0.5 group-hover:text-[#144227] transition-colors">{prod.name}</h3>
                </div>

                <div className="pt-2 border-t border-[#f0eee7] flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-extrabold text-[#1c1c18]">{prod.price}</span>
                    {prod.negotiable && (
                      <span className="inline-block text-[8px] font-bold text-[#376847] bg-[#bceec8] px-1 rounded mt-0.5">Negotiable</span>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart();
                    }}
                    className="border border-[#144227] text-[#144227] hover:bg-[#144227]/5 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ShoppingCart size={11} /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Fresh from local farms horizontal row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-[#1c1c18] tracking-tight">Fresh from local farms</h2>
            <p className="text-xs text-[#717971] mt-0.5">Sourced within 50 miles of your distribution center.</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setScrollIndex(Math.max(0, scrollIndex - 1))}
              className="p-1.5 border border-[#c1c9c0] rounded-full hover:bg-white text-[#414942] disabled:opacity-40 cursor-pointer"
              disabled={scrollIndex === 0}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setScrollIndex(Math.min(1, scrollIndex + 1))}
              className="p-1.5 border border-[#c1c9c0] rounded-full hover:bg-white text-[#414942] disabled:opacity-40 cursor-pointer"
              disabled={scrollIndex === 1}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {localFarms.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onNavigate('product-detail')}
              className="bg-white border border-[#e5e2db] rounded-2xl overflow-hidden p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between group"
            >
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#f6f3ec]">
                <img src={prod.img} alt={prod.name} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="block text-[8px] font-semibold text-[#717971]">{prod.brand}</span>
                  <h4 className="text-xs font-bold text-[#1c1c18] line-clamp-1">{prod.name}</h4>
                  <span className="block text-xs font-extrabold text-[#414942] mt-0.5">{prod.price}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart();
                  }}
                  className="w-7 h-7 bg-[#f6f3ec] text-[#144227] hover:bg-[#144227] hover:text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Streamlining your procurement (dark green guide banner) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#144227] text-white rounded-3xl p-8 md:p-12 flex flex-col lg:flex-row justify-between items-center gap-10 shadow-lg">
          <div className="lg:w-1/3 space-y-4 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">Streamlining your procurement</h2>
            <p className="text-xs text-white/80 leading-relaxed max-w-sm">
              Harvest Hill connects professional buyers directly with verified local growers through a transparent, high-efficiency portal.
            </p>
          </div>

          <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* Step 1 */}
            <div className="space-y-2 flex flex-col items-center md:items-start">
              <span className="w-8 h-8 rounded-full bg-[#376847] text-[#bceec8] flex items-center justify-center font-bold text-xs shadow-inner">1</span>
              <h4 className="text-xs font-bold mt-1 text-[#bceec8]">Browse & Select</h4>
              <p className="text-[10px] text-white/70 leading-relaxed text-center md:text-left">
                Explore thousands of fresh products from verified local suppliers in real-time.
              </p>
            </div>
            {/* Step 2 */}
            <div className="space-y-2 flex flex-col items-center md:items-start">
              <span className="w-8 h-8 rounded-full bg-[#376847] text-[#bceec8] flex items-center justify-center font-bold text-xs shadow-inner">2</span>
              <h4 className="text-xs font-bold mt-1 text-[#bceec8]">Negotiate & Lock</h4>
              <p className="text-[10px] text-white/70 leading-relaxed text-center md:text-left">
                Use our direct bidding system to secure the best seasonal pricing for bulk orders.
              </p>
            </div>
            {/* Step 3 */}
            <div className="space-y-2 flex flex-col items-center md:items-start">
              <span className="w-8 h-8 rounded-full bg-[#376847] text-[#bceec8] flex items-center justify-center font-bold text-xs shadow-inner">3</span>
              <h4 className="text-xs font-bold mt-1 text-[#bceec8]">Automated Logistics</h4>
              <p className="text-[10px] text-white/70 leading-relaxed text-center md:text-left">
                Track your delivery from the farm gate to your facility with integrated route mapping.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Best value picks promotions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#1c1c18] tracking-tight">Best value picks</h2>
          <p className="text-xs text-[#717971] mt-0.5">Our algorithm's top recommendations based on current market surplus.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Green Peppers */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl overflow-hidden p-4 flex gap-4 shadow-sm group">
            <div className="w-1/3 aspect-[4/5] rounded-xl overflow-hidden bg-[#f6f3ec] flex-shrink-0">
              <img src="https://images.unsplash.com/photo-1589469785024-ac3e73cc994e?w=400&q=80" alt="peppers" className="w-full h-full object-cover group-hover:scale-103 transition-transform" />
            </div>
            <div className="flex-grow flex flex-col justify-between py-1">
              <div className="space-y-1.5">
                <span className="inline-block text-[8px] font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded uppercase">Limited Time Supplies</span>
                <h3 className="text-xs font-extrabold text-[#1c1c18]">Bulk Green Peppers</h3>
                <p className="text-[10px] text-[#717971] leading-relaxed">
                  Excess yield from our Northern growers means a 50% reduction in bulk rates this week only.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[#f0eee7] pt-3 mt-4">
                <div>
                  <span className="block text-sm font-black text-[#1c1c18]">$18.00</span>
                  <span className="block text-[8px] text-[#717971] uppercase font-bold">/ Case</span>
                </div>
                <button
                  onClick={addToCart}
                  className="bg-[#144227] text-white hover:bg-[#376847] text-[10px] font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Claim Deal
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Eggs */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl overflow-hidden p-4 flex gap-4 shadow-sm group">
            <div className="w-1/3 aspect-[4/5] rounded-xl overflow-hidden bg-[#f6f3ec] flex-shrink-0">
              <img src="https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&q=80" alt="eggs" className="w-full h-full object-cover group-hover:scale-103 transition-transform" />
            </div>
            <div className="flex-grow flex flex-col justify-between py-1">
              <div className="space-y-1.5">
                <span className="inline-block text-[8px] font-bold text-[#563113] bg-[#ffdcc5] px-2 py-0.5 rounded uppercase">Weekly Staple</span>
                <h3 className="text-xs font-extrabold text-[#1c1c18]">Pasture-Raised Eggs</h3>
                <p className="text-[10px] text-[#717971] leading-relaxed">
                  Premium quality from SunnySide Farms. Highest nutritional value, now at wholesale standard pricing.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[#f0eee7] pt-3 mt-4">
                <div>
                  <span className="block text-sm font-black text-[#1c1c18]">$34.50</span>
                  <span className="block text-[8px] text-[#717971] uppercase font-bold">/ Flat</span>
                </div>
                <button
                  onClick={addToCart}
                  className="bg-[#144227] text-white hover:bg-[#376847] text-[10px] font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Add to List
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
