import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Plus, ChevronRight, ChevronLeft,
  ShieldCheck, ArrowUpRight, Grid, Sparkles, Tag, Package, Zap, Leaf, Sprout, AlertCircle, Store
} from 'lucide-react';
import { clientApi } from '../portals/client/lib/api';
import { DEFAULT_HOMEPAGE_CONFIG, HomepageSectionConfig } from '../portals/admin/pages/HomepageCustomizer';
import { cn } from '../portals/farmer/lib/utils';

interface LandingProps {
  onNavigate: (screen: string, category?: string, productId?: number, search?: string) => void;
  addToCart: (product?: any) => void;
}

export default function Landing({ onNavigate, addToCart }: LandingProps) {
  const [supplies, setSupplies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [popularProduct, setPopularProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      bgImage: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=1400&auto=format&fit=crop&q=80",
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
        setError(null);
        
        let prodRes: any = null;
        let suppRes: any = null;

        try {
          prodRes = await clientApi.products.list();
        } catch (err: any) {
          console.error("Products API error:", err);
          setError("Failed to connect to the marketplace API. Please check your server or connection.");
          return;
        }

        try {
          suppRes = await clientApi.supplies.list();
        } catch (err) {
          // Optional background supplies fetch
        }

        clientApi.popularProduct().then(popRes => {
          if (popRes?.product) {
            setPopularProduct({
              ...popRes.product,
              total_purchased: popRes.total_purchased,
              order_count: popRes.order_count
            });
          }
        }).catch(() => {});

        const prodList = prodRes?.results || (Array.isArray(prodRes) ? prodRes : []);
        const suppList = suppRes?.results || (Array.isArray(suppRes) ? suppRes : []);

        setProducts(prodList);
        setSupplies(suppList);
      } catch (err: any) {
        console.error("Failed to fetch landing data:", err);
        setError("Unable to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Helper to aggregate active accepted supplies and products into single Master Product cards
  const aggregateMasterProducts = (suppliesList: any[], productList: any[]) => {
    const map = new Map<string, any>();

    for (const s of suppliesList) {
      if (s.status !== 'accepted' && s.status !== 'open') continue;

      const prodName = (s.product_detail?.name || s.name || s.custom_product_name || s.suggested_product_name || 'Produce').trim();
      if (!prodName) continue;

      const key = prodName.toLowerCase();

      let qty = 0;
      if (s.accepted_quantity !== undefined && s.accepted_quantity !== null) {
        qty = parseFloat(String(s.accepted_quantity));
      } else if (s.quantity !== undefined && s.quantity !== null) {
        qty = parseFloat(String(s.quantity));
      } else if (s.total_available_quantity !== undefined && s.total_available_quantity !== null) {
        qty = parseFloat(String(s.total_available_quantity));
      }

      const hasActiveDeal = !!(
        s.is_discounted ||
        s.has_active_discount ||
        s.hasActiveDiscount ||
        s.active_deal ||
        s.activeDeal ||
        s.product_detail?.is_discounted ||
        s.product_detail?.has_active_discount ||
        s.product_detail?.hasActiveDiscount ||
        s.product_detail?.active_deal ||
        s.product_detail?.activeDeal
      );

      const origPrice = parseFloat(String(s.product_detail?.price || s.product_detail?.base_price || s.price || s.base_price || s.offered_price || 0));
      const discPriceVal = parseFloat(String(s.product_detail?.effective_price || s.product_detail?.discount_price || s.effective_price || s.discount_price || s.discountedPrice || 0));
      const isDisc = hasActiveDeal || (discPriceVal > 0 && origPrice > 0 && discPriceVal < origPrice);
      const discPrice = isDisc ? (discPriceVal > 0 ? discPriceVal : origPrice) : null;
      const effectivePrice = isDisc && discPrice ? discPrice : origPrice;

      const rawImg = s.product_detail?.image_url || s.product_detail?.image;
      let imageUrl = rawImg;
      if (imageUrl && typeof imageUrl === 'string') {
        if (imageUrl.includes('media/http')) imageUrl = 'https://' + imageUrl.split('http')[1];
        else if (imageUrl.includes('media/https')) imageUrl = 'https://' + imageUrl.split('https')[1];
      }

      if (map.has(key)) {
        const existing = map.get(key);
        existing.quantity += qty;
        existing.total_available_quantity += qty;

        if (!existing.is_discounted && isDisc) {
          existing.is_discounted = true;
          existing.has_active_discount = true;
          existing.discount_price = discPrice;
          existing.effective_price = effectivePrice;
          existing.discount_percentage = s.discount_percentage || (isDisc && discPrice !== null && origPrice > discPrice ? ((origPrice - discPrice) / origPrice) * 100 : 0);
        }

        if (!existing.image_url && imageUrl) {
          existing.image_url = imageUrl;
          existing.photo = imageUrl;
        }
      } else {
        map.set(key, {
          id: s.product || s.id,
          product_id: s.product || s.id,
          name: prodName,
          category: s.product_detail?.category || s.category || 'Vegetables',
          urgency: s.product_detail?.urgency || s.urgency || 'medium',
          unit: s.unit || s.product_detail?.unit || 'kg',
          price: origPrice,
          base_price: origPrice,
          discount_price: discPrice,
          effective_price: effectivePrice,
          discount_percentage: s.discount_percentage || (isDisc && discPrice !== null && origPrice > discPrice ? ((origPrice - discPrice) / origPrice) * 100 : 0),
          is_discounted: isDisc,
          has_active_discount: isDisc,
          quantity: qty,
          total_available_quantity: qty,
          image_url: imageUrl,
          photo: imageUrl,
          farmer_name: "Harvest Hill Delivery",
          farmer_location: "Kigali, Rwanda",
          quality_grade: s.quality_grade || "Grade A",
          status: "accepted",
          raw_item: s
        });
      }
    }

    for (const p of productList) {
      const prodName = (p.name || '').trim();
      if (!prodName) continue;

      const key = prodName.toLowerCase();
      const qty = parseFloat(String(p.total_available_quantity || p.quantity || 0));

      const hasActiveDeal = !!(
        p.is_discounted ||
        p.has_active_discount ||
        p.hasActiveDiscount ||
        p.active_deal ||
        p.activeDeal
      );

      const origPrice = parseFloat(String(p.price || p.base_price || p.offered_price || 0));
      const discPriceVal = parseFloat(String(p.effective_price || p.discount_price || p.discountedPrice || 0));
      const isDisc = hasActiveDeal || (discPriceVal > 0 && origPrice > 0 && discPriceVal < origPrice);
      const discPrice = isDisc ? (discPriceVal > 0 ? discPriceVal : origPrice) : null;
      const effectivePrice = isDisc && discPrice ? discPrice : origPrice;

      if (map.has(key)) {
        const existing = map.get(key);
        if (qty > existing.total_available_quantity) {
          existing.quantity = qty;
          existing.total_available_quantity = qty;
        }
        if (!existing.is_discounted && isDisc) {
          existing.is_discounted = true;
          existing.has_active_discount = true;
          existing.discount_price = discPrice;
          existing.effective_price = effectivePrice;
          existing.discount_percentage = p.discount_percentage || (isDisc && discPrice !== null && origPrice > discPrice ? ((origPrice - discPrice) / origPrice) * 100 : 0);
        }
      } else if (qty > 0 || (p.status || 'open') === 'open') {
        const rawImg = p.image_url || p.image;
        let imageUrl = rawImg;
        if (imageUrl && typeof imageUrl === 'string') {
          if (imageUrl.includes('media/http')) imageUrl = 'https://' + imageUrl.split('http')[1];
          else if (imageUrl.includes('media/https')) imageUrl = 'https://' + imageUrl.split('https')[1];
        }

        map.set(key, {
          id: p.id,
          product_id: p.id,
          name: prodName,
          category: p.category || 'Vegetables',
          urgency: p.urgency || 'medium',
          unit: p.unit || 'kg',
          price: origPrice,
          base_price: origPrice,
          discount_price: discPrice,
          effective_price: effectivePrice,
          discount_percentage: p.discount_percentage || (isDisc && discPrice !== null && origPrice > discPrice ? ((origPrice - discPrice) / origPrice) * 100 : 0),
          is_discounted: isDisc,
          has_active_discount: isDisc,
          quantity: qty,
          total_available_quantity: qty,
          image_url: imageUrl,
          photo: imageUrl,
          farmer_name: "Harvest Hill Delivery",
          farmer_location: "Kigali, Rwanda",
          quality_grade: "Grade A",
          status: "accepted",
          raw_item: p
        });
      }
    }

    return Array.from(map.values());
  };

  const activeMasterProducts = aggregateMasterProducts(supplies, products);
  const activeSupplies = activeMasterProducts;

  // Helper to resolve unique items for a category
  const getSectionItems = (categoryTarget: string) => {
    const targetLower = categoryTarget.toLowerCase();
    const masterItems = activeMasterProducts;

    if (masterItems.length === 0) {
      return [];
    }

    if (targetLower === 'deals') {
      const matchedDeals = masterItems.filter((s: any) => s.is_discounted || s.has_active_discount || s.hasActiveDiscount);
      if (matchedDeals.length > 0) return matchedDeals;
      return [];
    }
    
    if (targetLower === 'popular' || targetLower === 'all') {
      return [...masterItems].sort((a: any, b: any) => {
        const purA = Number(a.total_purchased || a.sales_count || a.order_count || (a.is_discounted ? 100 : 0));
        const purB = Number(b.total_purchased || b.sales_count || b.order_count || (b.is_discounted ? 100 : 0));
        return purB - purA;
      });
    }

    if (targetLower.includes('vegetable') || targetLower.includes('herb')) {
      return masterItems.filter((p: any) => {
        const cat = (p.category || '').toLowerCase();
        return cat.includes('vegetable') || cat.includes('herb');
      });
    }

    if (targetLower.includes('dairy') || targetLower.includes('animal')) {
      return masterItems.filter((p: any) => {
        const cat = (p.category || '').toLowerCase();
        return cat.includes('dairy') || cat.includes('animal') || cat.includes('egg') || cat.includes('milk');
      });
    }

    return masterItems.filter((p: any) => {
      const cat = (p.category || '').toLowerCase();
      return cat.includes(targetLower);
    });
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

  // Reusable Product Card Renderer for real database products
  const renderProductCard = (item: any, isDeal = false, idx = 0, secId = '') => {
    const isSupply = !!item.product_detail;
    const name = isSupply ? item.product_detail?.name : item.name;
    const farm = isSupply ? (item.farmer_name || 'Harvest Hill Partner Farm') : 'Harvest Hill Certified Partner Farm';
    
    const isDiscountedItem = !!(
      item.is_discounted ||
      item.has_active_discount ||
      item.hasActiveDiscount ||
      item.active_deal ||
      item.activeDeal ||
      isDeal
    );
    const origPrice = Number(item.base_price || item.price || item.originalPrice || 0);
    const discPrice = isDiscountedItem
      ? Number(item.discount_price || item.effective_price || item.discountedPrice || (origPrice > 0 ? origPrice : 0))
      : origPrice;

    const finalOrigPrice = (isDiscountedItem && origPrice <= discPrice)
      ? (discPrice > 0 ? Math.round(discPrice * 1.25) : origPrice)
      : origPrice;

    const rawPct = item.discount_percentage != null && Number(item.discount_percentage) > 0
      ? Number(item.discount_percentage)
      : (isDiscountedItem && finalOrigPrice > discPrice ? ((finalOrigPrice - discPrice) / finalOrigPrice) * 100 : 0);

    const pct = rawPct > 0 ? (rawPct % 1 !== 0 ? rawPct.toFixed(1) : Math.round(rawPct)) : 0;

    const rawImg = item.product_detail?.image_url || item.product_detail?.image || item.image_url || item.image;
    const imgUrl = rawImg && typeof rawImg === 'string' && rawImg.includes('media/http')
      ? 'https://' + rawImg.split('http')[1]
      : (rawImg && typeof rawImg === 'string' && rawImg.includes('media/https') ? 'https://' + rawImg.split('https')[1] : rawImg);
    const unit = isSupply ? (item.unit || item.product_detail?.unit || 'kg') : (item.unit || 'kg');
    const liveQuantity = isSupply 
      ? (item.quantity != null ? item.quantity : item.total_available_quantity) 
      : (item.total_available_quantity != null ? item.total_available_quantity : item.quantity);
    const displayQuantity = liveQuantity != null && !isNaN(Number(liveQuantity)) ? parseFloat(String(liveQuantity)).toLocaleString() : '0';
    const sizeText = `${displayQuantity} ${unit} live stock`;
    const isSponsored = item.sponsored || (isDeal && (idx === 0 || idx === 3));
    const targetProdId = item.id;
    const cardKey = `${secId || 'sec'}-${item.id || idx}-${idx}`;

    return (
      <div 
        key={cardKey}
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
          <div className="aspect-square rounded-[10px] overflow-hidden bg-[#FAF7F0] mb-2.5 relative flex items-center justify-center">
            {imgUrl ? (
              <img 
                src={imgUrl} 
                alt={name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#717971] bg-[#FAF7F0] p-4 text-center">
                <Package className="w-10 h-10 opacity-40 mb-1" />
                <span className="text-[9px] font-semibold">No Image</span>
              </div>
            )}
            {isDiscountedItem && Number(pct) > 0 ? (
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
            {isDiscountedItem ? (
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
                  RWF {discPrice.toLocaleString()}
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
      
      {/* SECTION: Hero Carousel + Quick Links */}
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

      {/* SECTION: Popular Product of the Month Banner (Only rendered if actual purchase volume > 0) */}
      {popularProduct && popularProduct.total_purchased > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#1C2A1E] via-[#2D5A3D] to-[#1C2A1E] text-white rounded-[16px] p-5 sm:p-6 shadow-md border border-[#376847] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {(popularProduct.image_url || popularProduct.image) ? (
                <img
                  src={popularProduct.image_url || popularProduct.image}
                  alt={popularProduct.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-white/20 shadow-md shrink-0 bg-white/10"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border-2 border-white/20">
                  <Package className="w-10 h-10 text-white/50" />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#FAF7F0] text-[#2D5A3D] text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-2xs">
                    🔥 POPULAR PRODUCT OF THE MONTH
                  </span>
                  {popularProduct.total_purchased > 0 && (
                    <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full">
                      {popularProduct.total_purchased.toLocaleString()} {popularProduct.unit || 'kg'} purchased
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {popularProduct.name}
                </h3>
                <p className="text-xs text-white/80 font-medium max-w-xl">
                  Harvest Hill's #1 ordered item this month based on customer demand fulfillment and market volume.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('catalog', undefined, popularProduct.id, popularProduct.name)}
              className="bg-white text-[#2D5A3D] hover:bg-[#FAF7F0] font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 self-stretch md:self-auto justify-center"
            >
              <span>View Product in Catalog</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* SECTION: Product Section with Dynamic Inventory States */}
      {error ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#E8E4DA] rounded-[16px] p-8 text-center max-w-md mx-auto shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-[#1C2A1E]">Unable to Load Marketplace</h3>
              <p className="text-xs text-[#717971]">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#2D5A3D] text-white hover:bg-[#1E3E2A] font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Retry Loading
            </button>
          </div>
        </section>
      ) : activeSupplies.length === 0 ? (
        /* STATE 1 — No Active Supplies (activeSupplies.length === 0) */
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#E8E4DA] rounded-[16px] p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-sm space-y-5 my-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF7F0] border border-[#E8E4DA] flex items-center justify-center mx-auto text-[#2D5A3D]">
              <Store size={30} />
            </div>
            
            <div className="space-y-2">
              <span className="bg-[#FAF7F0] text-[#2D5A3D] border border-[#E8E4DA] text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full inline-block">
                Marketplace Onboarding
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C2A1E]">
                Fresh harvests are coming soon
              </h2>
              <p className="text-sm text-[#717971] max-w-lg mx-auto leading-relaxed">
                We're getting local sellers and fresh harvest batches onboarded. Check back soon to discover live harvest submissions.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('catalog')}
                className="bg-[#2D5A3D] text-white hover:bg-[#1E3E2A] font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>Browse Categories</span>
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/signup?role=supplier';
                  }
                }}
                className="bg-white text-[#2D5A3D] border border-[#E8E4DA] hover:border-[#2D5A3D] font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>Become a Seller</span>
              </button>
            </div>
          </div>
        </section>
      ) : activeSupplies.length <= 5 ? (
        /* STATE 2 — Few Active Harvest Submissions (1 <= activeSupplies.length <= 5) */
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E8E4DA]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-extrabold text-[#1C2A1E] tracking-tight">
                  Available Harvests Now
                </h2>
                <span className="bg-[#2D5A3D] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  {activeSupplies.length} {activeSupplies.length === 1 ? 'Harvest' : 'Harvests'}
                </span>
              </div>
              <p className="text-xs text-[#717971] font-medium mt-0.5">
                Fresh harvest submissions are verified and added regularly.
              </p>
            </div>

            <button
              onClick={() => onNavigate('catalog')}
              className="text-xs font-bold text-[#2D5A3D] hover:underline flex items-center gap-0.5 cursor-pointer bg-white border border-[#E8E4DA] px-3 py-1.5 rounded-xl shadow-sm hover:border-[#2D5A3D] self-start sm:self-auto"
            >
              <span>Explore Catalog</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Adaptive grid layout based on actual active supply count */}
          <div className={cn(
            "grid gap-4",
            activeSupplies.length === 1 && "grid-cols-1 max-w-xs mx-auto",
            activeSupplies.length === 2 && "grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto",
            activeSupplies.length === 3 && "grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto",
            activeSupplies.length === 4 && "grid-cols-2 sm:grid-cols-4 max-w-5xl mx-auto",
            activeSupplies.length === 5 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 max-w-6xl mx-auto"
          )}>
            {activeSupplies.map((item: any, idx: number) => renderProductCard(item, !!item.is_discounted, idx, 'few-products'))}
          </div>
        </section>
      ) : (
        /* STATE 3 — Many Products (products.length > 5) */
        enabledSections.map((sec) => {
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

              {/* Product Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {visibleItems.map((item: any, idx: number) => renderProductCard(item, isDealSection, idx, sec.id))}
              </div>
            </section>
          );
        })
      )}

    </div>
  );
}
