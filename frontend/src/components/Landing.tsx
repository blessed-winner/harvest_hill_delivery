"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Plus, ChevronRight, ChevronLeft,
  ShieldCheck, ArrowUpRight, Grid, Sparkles, Tag, Package, Zap, Leaf
} from 'lucide-react';
import { clientApi } from '../portals/client/lib/api';
import { DEFAULT_HOMEPAGE_CONFIG, HomepageSectionConfig } from '../portals/admin/pages/HomepageCustomizer';

interface LandingProps {
  onNavigate: (screen: string, category?: string, productId?: number, search?: string) => void;
  addToCart: (product?: any) => void;
}

// Curated farm items to ensure full category rails even when API products are few
const DEFAULT_POPULAR_ITEMS = [
  {
    id: 101,
    name: "Organic Red Hass Avocados",
    farm: "GIKONGORO FARM CO-OP",
    price: 1800,
    unit: "kg",
    size: "approx. 1 kg (4-5 pcs)",
    category: "Fruits",
    verified: true,
    photo: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 102,
    name: "Musanze Sweet Irish Potatoes",
    farm: "VIRUNGA HIGHLAND FARMS",
    price: 950,
    unit: "kg",
    size: "approx. 2.5 kg bag",
    category: "Vegetables",
    verified: true,
    photo: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 103,
    name: "Fresh Nyagatare Whole Milk",
    farm: "EASTERN DAIRY COLLECTIVE",
    price: 1200,
    unit: "L",
    size: "1 Liter bottle",
    category: "Dairy",
    verified: true,
    photo: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 104,
    name: "Handpicked Crisp Bell Peppers",
    farm: "RUBAVU GREENHOUSE ORGANICS",
    price: 2400,
    unit: "kg",
    size: "pack of 3 mixed",
    category: "Vegetables",
    verified: true,
    photo: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 105,
    name: "Gisenyi Golden Passion Fruit",
    farm: "LAKE KIVU ORCHARDS",
    price: 3100,
    unit: "kg",
    size: "approx. 1 kg (10-12 pcs)",
    category: "Fruits",
    verified: true,
    photo: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 106,
    name: "Rwamagana Sweet Yellow Bananas",
    farm: "SUNRISE FRUIT VALLEY",
    price: 1400,
    unit: "bunch",
    size: "bunch of 8-10",
    category: "Fruits",
    verified: true,
    photo: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 107,
    name: "Fresh Cut Curly Kale & Spinach",
    farm: "HUYE COMMUNITY GARDENS",
    price: 800,
    unit: "bunch",
    size: "approx. 350g bunch",
    category: "Vegetables",
    verified: true,
    photo: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 108,
    name: "Kayonza Organic Wildflower Honey",
    farm: "AKAGERA APICULTURE",
    price: 4500,
    unit: "jar",
    size: "500g glass jar",
    category: "Grains",
    verified: true,
    photo: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 109,
    name: "Artisan Free-Range Country Eggs",
    farm: "KICUKIRO ECO POULTRY",
    price: 3600,
    unit: "tray",
    size: "tray of 15 eggs",
    category: "Dairy",
    verified: true,
    photo: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 110,
    name: "Fresh Garden Rosemary & Thyme",
    farm: "GASABO HERB ESTATE",
    price: 900,
    unit: "pack",
    size: "approx. 100g fresh cut",
    category: "Herbs",
    verified: true,
    photo: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 111,
    name: "Highland Organic Carrots",
    farm: "NORTHERN RIDGE FARMS",
    price: 1100,
    unit: "kg",
    size: "1 kg bundle",
    category: "Vegetables",
    verified: true,
    photo: "https://images.unsplash.com/photo-1598170845058-12ef4a45753b?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 112,
    name: "Crisp Green Lettuce Heads",
    farm: "HUYE HYDROPONICS",
    price: 850,
    unit: "head",
    size: "pack of 2 twin heads",
    category: "Vegetables",
    verified: true,
    photo: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 113,
    name: "Fresh Red Onions Mesh Sack",
    farm: "NORTHERN VALLEY FARMS",
    price: 1400,
    unit: "kg",
    size: "2 kg mesh sack",
    category: "Vegetables",
    verified: true,
    photo: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 114,
    name: "Juicy Red Vine Tomatoes",
    farm: "NYARUGENGE GROWERS",
    price: 1500,
    unit: "kg",
    size: "approx. 1 kg crate",
    category: "Vegetables",
    verified: true,
    photo: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 115,
    name: "Fresh Farm Cucumbers",
    farm: "GASABO VEGGIE HUB",
    price: 990,
    unit: "kg",
    size: "pack of 4 whole",
    category: "Vegetables",
    verified: true,
    photo: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 116,
    name: "Sweet Local Strawberries Punnet",
    farm: "KIGALI BERRY VALLEY",
    price: 3600,
    unit: "box",
    size: "400g punnet",
    category: "Fruits",
    verified: true,
    photo: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop&q=80"
  }
];

const DEFAULT_DEAL_ITEMS = [
  {
    id: 201,
    name: "Juicy Red Tomatoes Batch",
    farm: "NYARUGENGE GROWERS",
    originalPrice: 2200,
    discountPrice: 1500,
    unit: "kg",
    size: "approx. 1 kg crate",
    category: "Vegetables",
    savingsPct: 32,
    sponsored: true,
    verified: true,
    photo: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 202,
    name: "Sweet Local Strawberries Crate",
    farm: "KIGALI BERRY VALLEY",
    originalPrice: 4800,
    discountPrice: 3600,
    unit: "box",
    size: "400g punnet",
    category: "Fruits",
    savingsPct: 25,
    sponsored: false,
    verified: true,
    photo: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 203,
    name: "Organic Whole Wheat Grains",
    farm: "EASTERN PLAINS MILLING",
    originalPrice: 3000,
    discountPrice: 2100,
    unit: "kg",
    size: "2 kg flour bag",
    category: "Grains",
    savingsPct: 30,
    sponsored: false,
    verified: true,
    photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 204,
    name: "Fresh Farm Cucumbers",
    farm: "GASABO VEGGIE HUB",
    originalPrice: 1500,
    discountPrice: 990,
    unit: "kg",
    size: "pack of 4 whole",
    category: "Vegetables",
    savingsPct: 34,
    sponsored: true,
    verified: true,
    photo: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 205,
    name: "Tree-Ripe Sweet Oranges",
    farm: "AKAGERA CITRUS ORCHARDS",
    originalPrice: 3200,
    discountPrice: 2400,
    unit: "kg",
    size: "approx. 1.5 kg net",
    category: "Fruits",
    savingsPct: 25,
    sponsored: false,
    verified: true,
    photo: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 206,
    name: "Artisan Whole Milk Cheese",
    farm: "VIRUNGA CREAMERY",
    originalPrice: 6500,
    discountPrice: 4900,
    unit: "block",
    size: "350g artisan block",
    category: "Dairy",
    savingsPct: 24,
    sponsored: false,
    verified: true,
    photo: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 207,
    name: "Crisp Green Lettuce Heads",
    farm: "HUYE HYDROPONICS",
    originalPrice: 1200,
    discountPrice: 850,
    unit: "head",
    size: "pack of 2 twin heads",
    category: "Vegetables",
    savingsPct: 29,
    sponsored: false,
    verified: true,
    photo: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 208,
    name: "Fresh Red Onions Crate",
    farm: "NORTHERN VALLEY FARMS",
    originalPrice: 2000,
    discountPrice: 1400,
    unit: "kg",
    size: "2 kg mesh sack",
    category: "Vegetables",
    savingsPct: 30,
    sponsored: false,
    verified: true,
    photo: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 209,
    name: "Ripe Sugar Mangoes",
    farm: "RUBAVU SUNSET ORCHARDS",
    originalPrice: 3800,
    discountPrice: 2800,
    unit: "kg",
    size: "approx. 1 kg (3-4 pcs)",
    category: "Fruits",
    savingsPct: 26,
    sponsored: false,
    verified: true,
    photo: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 210,
    name: "Fresh Mint & Basil Leaves",
    farm: "GASABO HERB ESTATE",
    originalPrice: 1100,
    discountPrice: 750,
    unit: "pack",
    size: "approx. 150g bundle",
    category: "Herbs",
    savingsPct: 31,
    sponsored: false,
    verified: true,
    photo: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 211,
    name: "Gisenyi Golden Passion Fruit",
    farm: "LAKE KIVU ORCHARDS",
    originalPrice: 4200,
    discountPrice: 3100,
    unit: "kg",
    size: "approx. 1 kg (10-12 pcs)",
    category: "Fruits",
    savingsPct: 26,
    sponsored: false,
    verified: true,
    photo: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: 212,
    name: "Highland Organic Carrots",
    farm: "NORTHERN RIDGE FARMS",
    originalPrice: 1600,
    discountPrice: 1100,
    unit: "kg",
    size: "1 kg bundle",
    category: "Vegetables",
    savingsPct: 31,
    sponsored: false,
    verified: true,
    photo: "https://images.unsplash.com/photo-1598170845058-12ef4a45753b?w=500&auto=format&fit=crop&q=80"
  }
];

export default function Landing({ onNavigate, addToCart }: LandingProps) {
  const [supplies, setSupplies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroSlide, setHeroSlide] = useState(0);

  // Dynamic Homepage Configuration state
  const [sectionsConfig, setSectionsConfig] = useState<HomepageSectionConfig[]>(DEFAULT_HOMEPAGE_CONFIG);
  const [sectionPages, setSectionPages] = useState<Record<string, number>>({});

  // Hero carousel slides
  const heroSlides = [
    {
      title: "Peak Season Organic Harvest",
      subtitle: "Directly from local Rwandan family farms. Same-day sunrise delivery.",
      tag: "WEEKLY HIGHLIGHT",
      bgImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&auto=format&fit=crop&q=80",
      ctaCategory: "Vegetables"
    },
    {
      title: "Fresh Farm Dairy & Artisan Cheese",
      subtitle: "Sourced daily from certified local dairy cooperatives.",
      tag: "DAILY FRESH",
      bgImage: "https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=1400&auto=format&fit=crop&q=80",
      ctaCategory: "Dairy"
    },
    {
      title: "Wholesale Crates & Bulk Pricing",
      subtitle: "Save up to 20% on bulk produce orders for homes & businesses.",
      tag: "BULK SPECIALS",
      bgImage: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1400&auto=format&fit=crop&q=80",
      ctaCategory: "Bulk Orders"
    }
  ];

  // Load section configuration from localStorage or DOM event
  const loadSectionConfig = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('homepage_sections_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSectionsConfig(parsed.sort((a, b) => a.order - b.order));
            return;
          }
        } catch {}
      }
    }
    setSectionsConfig(DEFAULT_HOMEPAGE_CONFIG);
  };

  useEffect(() => {
    loadSectionConfig();
    if (typeof window !== 'undefined') {
      window.addEventListener('homepage_config_updated', loadSectionConfig);
      return () => window.removeEventListener('homepage_config_updated', loadSectionConfig);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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

  // Active supplies & products
  const activeSupplies = supplies.filter((s: any) => s.status === 'accepted');

  // Helper to resolve items for a category
  const getSectionItems = (categoryTarget: string) => {
    const targetLower = categoryTarget.toLowerCase();
    
    if (targetLower === 'deals') {
      const matchedDeals = activeSupplies.filter((s: any) => s.is_discounted);
      return matchedDeals.length > 0 ? [...matchedDeals, ...DEFAULT_DEAL_ITEMS] : DEFAULT_DEAL_ITEMS;
    }
    
    if (targetLower === 'popular' || targetLower === 'all') {
      return activeSupplies.length > 0 ? [...activeSupplies, ...DEFAULT_POPULAR_ITEMS] : DEFAULT_POPULAR_ITEMS;
    }

    if (targetLower.includes('vegetable') || targetLower.includes('herb')) {
      const matchedSupplies = activeSupplies.filter((s: any) => {
        const cat = (s.product_detail?.category || s.category || '').toLowerCase();
        return cat.includes('vegetable') || cat.includes('herb');
      });
      const matchedProducts = products.filter((p: any) => {
        const cat = (p.category || '').toLowerCase();
        return cat.includes('vegetable') || cat.includes('herb');
      });
      const defaultFiltered = DEFAULT_POPULAR_ITEMS.filter(item => {
        const c = item.category?.toLowerCase() || '';
        return c.includes('vegetable') || c.includes('herb');
      });
      const combined = [...matchedSupplies, ...matchedProducts];
      return combined.length > 0 ? [...combined, ...defaultFiltered, ...DEFAULT_POPULAR_ITEMS] : (defaultFiltered.length > 0 ? defaultFiltered : DEFAULT_POPULAR_ITEMS);
    }

    const matchedSupplies = activeSupplies.filter((s: any) => {
      const cat = (s.product_detail?.category || s.category || '').toLowerCase();
      return cat.includes(targetLower);
    });
    const matchedProducts = products.filter((p: any) => {
      const cat = (p.category || '').toLowerCase();
      return cat.includes(targetLower);
    });
    const defaultFiltered = DEFAULT_POPULAR_ITEMS.filter(item => item.category?.toLowerCase().includes(targetLower));

    const combined = [...matchedSupplies, ...matchedProducts];
    return combined.length > 0 ? [...combined, ...defaultFiltered, ...DEFAULT_POPULAR_ITEMS] : (defaultFiltered.length > 0 ? defaultFiltered : DEFAULT_POPULAR_ITEMS);
  };

  if (loading) {
    return (
      <div className="bg-[#FAF7F0] text-[#1C2A1E] font-sans min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#2D5A3D] border-t-transparent"></div>
          <span className="text-xs font-semibold text-[#4A7C59]">Loading Fresh Harvests...</span>
        </div>
      </div>
    );
  }

  // Reusable Product Card Renderer
  const renderProductCard = (item: any, isDeal = false, idx = 0) => {
    const isSupply = !!item.product_detail;
    const name = isSupply ? item.product_detail?.name : item.name;
    const farm = isSupply ? (item.farmer_name || 'Harvest Hill Farm') : (item.farm || 'Local Certified Farm');
    const origPrice = isSupply ? Number(item.price) : Number(item.originalPrice || item.price * 1.3 || 2500);
    const discPrice = isSupply ? Number(item.discount_price || item.price) : Number(item.discountPrice || item.price || item.base_price || 0);
    const priceVal = isSupply ? Number(item.price) : Number(item.price || item.base_price || 0);
    const pct = item.savingsPct || (origPrice > 0 ? Math.round(((origPrice - discPrice) / origPrice) * 100) : 20);
    const imgUrl = isSupply ? (item.photo || item.product_detail?.image_url) : (item.photo || item.image_url || item.image);
    const unit = isSupply ? (item.unit || item.product_detail?.unit || 'kg') : (item.unit || 'kg');
    const sizeText = item.size || `approx. 1 ${unit}`;
    const isSponsored = item.sponsored || (isDeal && (idx === 0 || idx === 3));
    const targetProdId = item.id;

    return (
      <div 
        key={item.id}
        onClick={() => onNavigate('product-detail', undefined, targetProdId)}
        className="bg-white border border-[#E8E4DA] rounded-[12px] p-3 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all h-full cursor-pointer group relative"
      >
        <div>
          {isSponsored && (
            <span className="absolute top-2 right-2 z-10 text-[9px] font-semibold text-[#888888] bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-[#E8E4DA]">
              Sponsored
            </span>
          )}

          {/* Product Photo */}
          <div className="aspect-square rounded-[10px] overflow-hidden bg-[#FAF7F0] mb-2.5 relative">
            <img 
              src={imgUrl || "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=400&q=80"} 
              alt={name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isDeal ? (
              <span className="absolute bottom-1.5 left-1.5 bg-[#FFF0ED] text-[#D9381E] border border-[#FFC7BD] text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                Save {pct}%
              </span>
            ) : (
              <span className="absolute bottom-1.5 left-1.5 bg-[#2D5A3D]/95 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                <ShieldCheck size={9} />
                <span>Verified Farm</span>
              </span>
            )}
          </div>

          <span className="text-[9px] font-bold text-[#717971] uppercase tracking-wider block mb-0.5 truncate">
            {farm}
          </span>

          <h3 className="text-xs font-semibold text-[#1C2A1E] line-clamp-1 group-hover:text-[#2D5A3D] transition-colors leading-snug">
            {name}
          </h3>

          <p className="text-[10px] text-[#777777] font-normal mt-0.5">
            {sizeText}
          </p>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F0ECE1]">
          <div>
            {isDeal ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-extrabold text-[#D9381E]">
                    RWF {discPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#888888] line-through font-normal">
                    RWF {origPrice.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#717971]">/{unit}</span>
                </div>
              </>
            ) : (
              <div>
                <span className="text-sm font-extrabold text-[#1C2A1E]">
                  RWF {priceVal.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#717971] font-normal">/{unit}</span>
              </div>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              addToCart(item);
            }}
            className="w-7 h-7 bg-[#2D5A3D] text-white hover:bg-[#1E3E2A] rounded-lg flex items-center justify-center cursor-pointer transition-colors active:scale-95 shadow-sm"
            title="Add to cart"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
    );
  };

  const enabledSections = sectionsConfig.filter(sec => sec.enabled);

  return (
    <div className="bg-[#FAF7F0] text-[#1C2A1E] font-sans space-y-10 pb-16 min-h-screen">
      
      {/* SECTION 4: Hero Carousel + Quick Links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-4">
        <div className="relative rounded-[12px] overflow-hidden h-48 sm:h-56 md:h-60 shadow-sm border border-[#E8E4DA] bg-[#1C2A1E]">
          <img 
            src={heroSlides[heroSlide].bgImage} 
            alt={heroSlides[heroSlide].title} 
            className="w-full h-full object-cover absolute inset-0 transition-opacity duration-700 opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C2A1E]/90 via-[#2D5A3D]/70 to-transparent" />
          
          <div className="relative z-10 p-5 sm:p-8 max-w-lg text-white space-y-2 flex flex-col justify-center h-full">
            <span className="inline-block bg-[#FAF7F0] text-[#2D5A3D] font-extrabold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm w-max">
              {heroSlides[heroSlide].tag}
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold leading-tight tracking-tight text-white">
              {heroSlides[heroSlide].title}
            </h1>
            <p className="text-xs text-white/90 font-medium line-clamp-2 leading-relaxed">
              {heroSlides[heroSlide].subtitle}
            </p>
            <div className="pt-1">
              <button
                onClick={() => onNavigate('catalog', heroSlides[heroSlide].ctaCategory)}
                className="bg-[#2D5A3D] text-white hover:bg-[#1E3E2A] font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95 w-max"
              >
                <span>Shop {heroSlides[heroSlide].ctaCategory}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${heroSlide === idx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* 5 Compact Quick-Link Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            {
              label: "Peak Season",
              subtext: "This week's best",
              tag: "IN HARVEST",
              category: "Vegetables",
              image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80"
            },
            {
              label: "New This Season",
              subtext: "Just arrived",
              tag: "FRESH ARRIVAL",
              category: "Fruits",
              image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&auto=format&fit=crop&q=80"
            },
            {
              label: "Flash Deals",
              subtext: "Limited time",
              tag: "UP TO 35% OFF",
              category: "Deals",
              image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80"
            },
            {
              label: "Bulk Pricing",
              subtext: "Order in volume",
              tag: "CRATE RATES",
              category: "Bulk Orders",
              image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80"
            },
            {
              label: "Ready to Ship",
              subtext: "Fastest delivery",
              tag: "SAME-DAY DISPATCH",
              category: "Seasonal",
              image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=80"
            }
          ].map((tile, idx) => (
            <div
              key={idx}
              onClick={() => onNavigate('catalog', tile.category)}
              className="bg-white border border-[#E8E4DA] rounded-[12px] p-2.5 flex items-center gap-3 cursor-pointer hover:border-[#2D5A3D] hover:shadow-md transition-all group overflow-hidden"
            >
              <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-[#E8E4DA] bg-[#FAF7F0] relative">
                <img 
                  src={tile.image} 
                  alt={tile.label} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-extrabold text-[#2D5A3D] uppercase tracking-wider block leading-none mb-0.5">
                  {tile.tag}
                </span>
                <h4 className="text-xs font-bold text-[#1C2A1E] truncate group-hover:text-[#2D5A3D] transition-colors leading-tight">
                  {tile.label}
                </h4>
                <p className="text-[10px] text-[#717971] truncate leading-tight mt-0.5 font-medium">
                  {tile.subtext}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DYNAMIC HOMEPAGE SECTIONS CONFIGURATOR */}
      {enabledSections.map((sec) => {
        const allItems = getSectionItems(sec.category);
        const perPage = sec.itemsPerPage || 8;
        const totalPages = Math.max(1, Math.ceil(allItems.length / perPage));
        const currentPage = sectionPages[sec.id] || 0;

        const visibleItems = allItems.slice(currentPage * perPage, (currentPage + 1) * perPage);
        const isDealSection = sec.category.toLowerCase() === 'deals';

        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#E8E4DA]">
              <div>
                <h2 className="text-base sm:text-xl font-extrabold text-[#1C2A1E] tracking-tight">
                  {sec.title}
                </h2>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                {/* Pagination controls for this section */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5 bg-white border border-[#E8E4DA] rounded-xl px-2.5 py-1 shadow-sm text-xs font-bold text-[#414942]">
                    <button
                      disabled={currentPage === 0}
                      onClick={() => setSectionPages(prev => ({ ...prev, [sec.id]: Math.max(0, currentPage - 1) }))}
                      className="p-1 hover:bg-[#FAF7F0] rounded-md transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Previous page"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className="font-mono text-[11px] px-1">
                      {currentPage + 1} / {totalPages}
                    </span>
                    <button
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setSectionPages(prev => ({ ...prev, [sec.id]: Math.min(totalPages - 1, currentPage + 1) }))}
                      className="p-1 hover:bg-[#FAF7F0] rounded-md transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Next page"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}

                {/* View All link */}
                <button
                  onClick={() => onNavigate('catalog', sec.category !== 'Popular' && sec.category !== 'All' ? sec.category : undefined)}
                  className="text-xs font-bold text-[#2D5A3D] hover:underline flex items-center gap-0.5 cursor-pointer bg-white border border-[#E8E4DA] px-3 py-1.5 rounded-xl shadow-sm hover:border-[#2D5A3D]"
                >
                  <span>View all</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Product Grid (e.g. 2-row x 4-col, 3-row x 4-col, etc.) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {visibleItems.map((item: any, idx: number) => renderProductCard(item, isDealSection, idx))}
            </div>
          </section>
        );
      })}

    </div>
  );
}
