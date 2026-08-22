"use client";

import { useState, useEffect } from 'react';
import { ChevronRight, Heart, ShoppingCart, Plus, Minus, ArrowLeft, Loader2, Package, AlertCircle, Handshake, X, Check, FileText } from 'lucide-react';
import { clientApi, apiRequest } from '../lib/api';
import { SuccessModal } from '../../../components/SuccessModal';
import { useAlert } from '../../../context/AlertContext';

const getFullImageUrl = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getCategoryFallbackImage = (category?: string, name?: string) => {
  const c = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (n.includes('potato') || n.includes('irish')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80';
  if (n.includes('tomato')) return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80';
  if (n.includes('carrot')) return 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&q=80';
  if (n.includes('onion')) return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=800&q=80';
  if (n.includes('banana') || n.includes('matooke')) return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&q=80';
  if (n.includes('apple')) return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&q=80';
  if (n.includes('milk') || n.includes('dairy')) return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80';
  if (n.includes('maize') || n.includes('corn')) return 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&q=80';
  if (n.includes('cabbage')) return 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=800&q=80';
  
  if (c.includes('fruit')) return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&q=80';
  if (c.includes('vegetable')) return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80';
  if (c.includes('dairy')) return 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80';
  if (c.includes('grain')) return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80';
  
  return 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&q=80';
};

const normalizeUrlPath = (url: string): string => {
  if (!url) return '';
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return new URL(url).pathname;
    }
  } catch (e) {}
  return url.startsWith('/') ? url : '/' + url;
};

interface ProductDetailProps {
  onNavigate: (screen: string) => void;
  addToCart: (product?: any) => void;
  productId?: number | null;
}

export default function ProductDetail({ onNavigate, addToCart, productId }: ProductDetailProps) {
  const { toast, showConfirm } = useAlert();
  const [qty, setQty] = useState(1);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Price Negotiation Modal State
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [negotiationQty, setNegotiationQty] = useState('100');
  const [negotiationNotes, setNegotiationNotes] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // Success UI Modal State
  const [successDialog, setSuccessDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let fetchedSupply: any = null;

        if (productId) {
          try {
            fetchedSupply = await clientApi.products.get(productId);
          } catch (err) {
            console.warn(`Product ID ${productId} not found directly, trying catalog search...`);
          }
        }

        if (!fetchedSupply) {
          const productsRes = await clientApi.products.list({ limit: '50' });
          const itemsList = productsRes?.results || productsRes || [];
          if (itemsList.length > 0) {
            fetchedSupply = itemsList.find((p: any) => 
              String(p.id) === String(productId) || String(p.product) === String(productId)
            ) || itemsList[0];
          }
        }

        if (fetchedSupply) {
          const prodName = fetchedSupply.name || fetchedSupply.product_detail?.name || 'Fresh Produce';
          const prodCat = fetchedSupply.category || fetchedSupply.product_detail?.category || 'Produce';
          const rawImg = fetchedSupply.product_detail?.image_url || fetchedSupply.product_detail?.image || fetchedSupply.image_url || fetchedSupply.image;
          let mainImageUrl = getFullImageUrl(rawImg);

          const imagesList: string[] = mainImageUrl ? [mainImageUrl] : [];

          const hasActiveDeal = !!(
            fetchedSupply.has_active_discount ||
            fetchedSupply.hasActiveDiscount ||
            fetchedSupply.is_discounted ||
            fetchedSupply.active_deal ||
            fetchedSupply.activeDeal ||
            (fetchedSupply.effective_price && Number(fetchedSupply.effective_price) < Number(fetchedSupply.price || fetchedSupply.base_price || 0)) ||
            (fetchedSupply.discountedPrice && Number(fetchedSupply.discountedPrice) < Number(fetchedSupply.originalPrice || 0))
          );

          const origPriceVal = Number(
            fetchedSupply.originalPrice ||
            fetchedSupply.price ||
            fetchedSupply.base_price ||
            fetchedSupply.offered_price ||
            fetchedSupply.product_detail?.base_price ||
            fetchedSupply.product_detail?.price ||
            0
          );

          const discPriceVal = hasActiveDeal
            ? Number(
                fetchedSupply.discountedPrice ||
                fetchedSupply.effective_price ||
                fetchedSupply.discount_price ||
                origPriceVal
              )
            : origPriceVal;

          const isDiscountedItem = hasActiveDeal && origPriceVal > discPriceVal;

          const finalOrigPrice = (isDiscountedItem && origPriceVal <= discPriceVal)
            ? (discPriceVal > 0 ? Math.round(discPriceVal * 1.25) : origPriceVal)
            : origPriceVal;

          const rawPct = fetchedSupply.discountPercentage ?? fetchedSupply.discount_percentage ?? (
            isDiscountedItem && finalOrigPrice > discPriceVal ? ((finalOrigPrice - discPriceVal) / finalOrigPrice) * 100 : 0
          );

          const discountPct = Number(rawPct) > 0 
            ? (Number(rawPct) % 1 !== 0 ? (Math.round(Number(rawPct) * 10) / 10).toString() : Math.round(Number(rawPct)).toString()) 
            : '0';

          const mappedProduct = {
            id: fetchedSupply.id,
            product_id: fetchedSupply.id,
            name: fetchedSupply.name || fetchedSupply.product_detail?.name || 'Fresh Produce',
            category: fetchedSupply.category || fetchedSupply.product_detail?.category || 'Produce',
            urgency: fetchedSupply.urgency || fetchedSupply.product_detail?.urgency || 'medium',
            unit: fetchedSupply.unit || fetchedSupply.product_detail?.unit || 'kg',
            price: isDiscountedItem ? discPriceVal : origPriceVal,
            original_price: finalOrigPrice,
            discount_price: discPriceVal,
            discount_percentage: discountPct,
            is_discounted: isDiscountedItem,
            active_deal: fetchedSupply.active_deal || fetchedSupply.activeDeal,
            status: fetchedSupply.status || 'available',
            image_url: mainImageUrl,
            images: imagesList,
            farmer_name: fetchedSupply.farmer_name || 'Harvest Hill Partner Farms',
            farmer_location: fetchedSupply.farmer_location || 'Local Region',
            quantity: fetchedSupply.total_available_quantity ?? fetchedSupply.quantity ?? 0,
            quality_grade: fetchedSupply.quality_grade || 'Grade A',
            notes: fetchedSupply.description || fetchedSupply.notes || 'Fresh wholesale produce sustainably sourced from verified local partner farms.',
            supplier_notes: (fetchedSupply.notes && fetchedSupply.notes.trim() !== '') ? fetchedSupply.notes.trim() : null,
            available_date: fetchedSupply.available_date,
            rating: fetchedSupply.rating || 5.0,
            rating_count: fetchedSupply.rating_count || 1
          };
          setProduct(mappedProduct);
          setProposedPrice(discPriceVal ? String(discPriceVal) : '');
        } else {
          setError('Product details currently unavailable.');
        }
      } catch (err: any) {
        console.error('Failed to fetch product:', err);
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const [showSupplierNotesModal, setShowSupplierNotesModal] = useState(false);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [negotiatedPrice, setNegotiatedPrice] = useState<number | null>(null);

  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editMsg, setEditMsg] = useState('');

  useEffect(() => {
    const checkNegotiatedPrice = async () => {
      if (!productId) return;
      try {
        const threads = await apiRequest('/api/negotiations/threads/').catch(() => null);
        if (Array.isArray(threads)) {
          const thread = threads.find((t: any) => t.supply_detail?.id === Number(productId));
          if (thread && thread.status === 'accepted') {
            const lastOffer = thread.offers?.[thread.offers.length - 1];
            const price = lastOffer ? lastOffer.price : thread.supply_detail?.proposed_price;
            setNegotiatedPrice(Number(price));
          } else {
            setNegotiatedPrice(null);
          }
        }
      } catch (err) {
        // Silence unauthenticated 401 error for guest detail views
      }
    };
    checkNegotiatedPrice();
  }, [productId, isNegotiating, activeThread]);

  const handleDeleteNegotiation = async () => {
    if (!activeThread) return;
    const confirmed = await showConfirm(
      "Delete Negotiation",
      "Are you sure you want to delete this negotiation? This will reset all proposed terms."
    );
    if (!confirmed) return;
    try {
      await apiRequest(`/api/negotiations/threads/${activeThread.id}/`, {
        method: 'DELETE'
      });
      setActiveThread(null);
      setIsNegotiating(false);
      toast("Negotiation deleted successfully.", "success");
    } catch (err) {
      console.error("Failed to delete negotiation:", err);
    }
  };

  const handleEditOfferSubmit = async (offerId: number) => {
    if (!activeThread) return;
    try {
      const res = await apiRequest(`/api/negotiations/threads/${activeThread.id}/edit_offer/`, {
        method: 'POST',
        body: JSON.stringify({
          offer_id: offerId,
          price: parseFloat(editPrice),
          quantity: parseFloat(editQty),
          message: editMsg
        })
      });
      setEditingOfferId(null);
      setActiveThread(res);
      toast("Offer updated successfully!", "success");
    } catch (err) {
      console.error("Failed to update offer:", err);
      toast("Failed to update offer.", "error");
    }
  };

  const loadNegotiationThread = async () => {
    if (!product?.id) return;
    setLoadingThread(true);
    try {
      const threads = await apiRequest('/api/negotiations/threads/');
      let thread = threads.find((t: any) => t.supply_detail?.id === product.id);
      if (!thread) {
        thread = await apiRequest('/api/negotiations/threads/', {
          method: 'POST',
          body: JSON.stringify({ supply: product.id })
        });
      }
      setActiveThread(thread);
      setProposedPrice(String(thread.price || product.price));
      setNegotiationQty(String(thread.supply_detail?.quantity || product.quantity));
    } catch (err) {
      console.error("Failed to load/create negotiation thread:", err);
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    if (isNegotiating && product?.id) {
      loadNegotiationThread();
    }
  }, [isNegotiating, product?.id]);



  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread) return;
    setIsSubmittingProposal(true);
    const parsedPrice = parseFloat(proposedPrice);
    const parsedQty = parseFloat(negotiationQty);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast("Please enter a valid proposed price.", "warning");
      setIsSubmittingProposal(false);
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast("Please enter a valid proposed quantity.", "warning");
      setIsSubmittingProposal(false);
      return;
    }
    try {
      const res = await apiRequest(`/api/negotiations/threads/${activeThread.id}/offer/`, {
        method: 'POST',
        body: JSON.stringify({
          price: parsedPrice,
          quantity: parsedQty,
          message: negotiationNotes
        })
      });
      setNegotiationNotes('');
      setActiveThread(res);
    } catch (err) {
      console.error("Failed to send offer:", err);
      toast("Failed to send counter proposal.", "error");
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!activeThread) return;
    try {
      const res = await apiRequest(`/api/negotiations/threads/${activeThread.id}/accept/`, {
        method: 'POST'
      });
      setActiveThread(res);
      toast("Agreement finalized successfully!", "success");
    } catch (err) {
      console.error("Failed to accept offer:", err);
    }
  };

  const images = product?.images && product.images.length > 0 
    ? product.images 
    : (product?.image_url ? [product.image_url] : []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#144227] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#717971]">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center">
          <Package className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#1c1c18] mb-2">Product Not Found</h2>
          <p className="text-sm text-[#717971] mb-4">{error || 'Unable to load product details'}</p>
          <button
            onClick={() => onNavigate('catalog')}
            className="bg-[#144227] text-[#white] text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Breadcrumbs */}
      <div className="text-xs text-[#717971] flex items-center gap-1.5">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer">Home</button>
        <ChevronRight size={12} />
        <button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors cursor-pointer">Catalog</button>
        <ChevronRight size={12} />
        <span className="text-[#1c1c18] font-bold">{product.name}</span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-8 border border-[#e5e2db] shadow-sm">
        
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          {(() => {
            const currentImg = product.images?.[activeImgIndex] || product.image_url || null;
            return (
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#f6f3ec] border border-[#e5e2db] relative group shadow-inner flex items-center justify-center">
                {currentImg ? (
                  <img 
                    src={currentImg} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#717971] bg-[#FAF7F0] p-6 text-center">
                    <Package className="w-12 h-12 opacity-30 mb-2 text-[#717971]" />
                    <span className="text-xs font-semibold">No Product Image</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Gallery Thumbnails */}
          {product.images && product.images.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImgIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-[#f6f3ec] ${
                    activeImgIndex === idx ? 'border-[#144227] scale-105 shadow-sm' : 'border-[#e5e2db] opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Info & Actions */}
        <div className="space-y-6">
          
          {/* Product header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {(product.is_discounted || (product.original_price && Number(product.original_price) > Number(product.price))) && (
                <span className="bg-[#FFF0ED] text-[#D9381E] border border-[#FFC7BD] text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm">
                  SAVE {Number(product.discount_percentage) > 0 ? product.discount_percentage : Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)}% (FRESH DEAL)
                </span>
              )}
              {product.urgency === 'HIGH' && (
                <span className="bg-[#bceec8] text-[#00210f] text-[10px] font-extrabold px-3 py-1 rounded-full">
                  SEASONAL
                </span>
              )}
              <span className="bg-[#f0eee7] text-[#414942] text-[10px] font-extrabold px-3 py-1 rounded-full">
                {product.category || 'Product'}
              </span>
            </div>
            
            <h1 className="text-3xl font-extrabold text-[#144227] leading-tight font-sans">
              {product.name}
            </h1>
            
            <p className="text-sm text-[#414942] leading-relaxed">
              {product.notes || 'Fresh from local farms. High quality and sustainable wholesale produce.'}
            </p>

            <div className="pt-1 space-y-1.5">
              {negotiatedPrice !== null ? (
                <div className="flex items-baseline gap-2">
                  <span className="line-through text-[#717971] text-xs font-semibold">RWF {Number(product.original_price || product.price || 0).toLocaleString()} / {product.unit || 'kg'}</span>
                  <span className="text-emerald-700 font-extrabold text-2xl">RWF {negotiatedPrice.toLocaleString()} / {product.unit || 'kg'}</span>
                </div>
              ) : (product.is_discounted || (product.original_price && Number(product.original_price) > Number(product.price))) ? (
                <div className="space-y-1">
                  <span className="line-through text-[#717971] text-xs font-bold block">
                    RWF {Number(product.original_price).toLocaleString()} / {product.unit || 'kg'}
                  </span>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[#D9381E] font-black text-3xl">
                      RWF {Number(product.price).toLocaleString()} / {product.unit || 'kg'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#1c1c18]">
                    RWF {Number(product.price || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-[#717971]">per {product.unit || 'kg'}</span>
                </div>
              )}

              <div className="pt-1">
                {product.quantity && product.quantity > 0 ? (
                  <span className="bg-[#bceec8] text-[#00210f] text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full inline-block">
                    AVAILABLE: {product.quantity} {product.unit ? String(product.unit).toUpperCase() : 'KG'}
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full inline-block">
                    CHECK AVAILABILITY
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Row: Qty Selector, Add to Cart & Negotiate Price */}
          <div className="space-y-3 pt-3 border-t border-[#f0eee7]">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[#c1c9c0] bg-white rounded-xl overflow-hidden shadow-sm hover:border-[#144227] transition-all">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-3 text-[#414942] hover:bg-[#fcf9f2] transition-colors cursor-pointer select-none"
                  title="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    const maxAvailable = parseFloat(product?.quantity || product?.available_quantity || 9999);
                    if (!isNaN(parsed)) {
                      if (parsed > maxAvailable) {
                        toast(`Maximum available stock is ${maxAvailable} ${product?.unit || 'kg'}`, 'warning');
                        setQty(maxAvailable);
                      } else {
                        setQty(Math.max(1, parsed));
                      }
                    } else {
                      setQty(1);
                    }
                  }}
                  className="w-16 py-2 font-extrabold text-sm text-[#1c1c18] text-center bg-transparent border-x border-[#e5e2db] focus:outline-none focus:bg-[#fcf9f2] font-mono"
                  title="Enter quantity manually"
                />
                <button
                  type="button"
                  onClick={() => {
                    const maxAvailable = parseFloat(product?.quantity || product?.available_quantity || 9999);
                    if (qty + 1 > maxAvailable) {
                      toast(`Maximum available stock for ${product?.name || 'this product'} is ${maxAvailable} ${product?.unit || 'kg'}`, 'warning');
                      return;
                    }
                    setQty(qty + 1);
                  }}
                  className="p-3 text-[#414942] hover:bg-[#fcf9f2] transition-colors cursor-pointer select-none"
                  title="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={() => {
                  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
                  if (!token) {
                    const prodId = product?.id || product?.product_id;
                    if (prodId) {
                      localStorage.setItem('guest_intent_product_id', String(prodId));
                      localStorage.setItem('guest_intent_timestamp', String(Date.now()));
                    }
                    window.location.href = '/login';
                    return;
                  }
                  const maxAvailable = parseFloat(product?.quantity || product?.available_quantity || 9999);
                  if (qty > maxAvailable) {
                    toast(`Cannot order ${qty} ${product?.unit || 'kg'}. Maximum available stock is ${maxAvailable} ${product?.unit || 'kg'}.`, 'warning');
                    setQty(maxAvailable);
                    return;
                  }
                  for (let i = 0; i < qty; i++) {
                    addToCart(product);
                  }
                  onNavigate('cart');
                }}
                className="flex-1 bg-[#144227] text-white py-3.5 px-6 rounded-xl font-bold text-xs hover:bg-[#376847] flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer hover:shadow-lg"
              >
                <ShoppingCart size={16} /> Add to Cart
              </button>
            </div>

            {/* Price Negotiation Trigger Button - Always Present */}
            <button
              onClick={() => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
                if (!token) {
                  const prodId = product?.id || product?.product_id;
                  if (prodId) {
                    localStorage.setItem('guest_intent_product_id', String(prodId));
                    localStorage.setItem('guest_intent_timestamp', String(Date.now()));
                  }
                  window.location.href = '/login';
                  return;
                }
                setIsNegotiating(true);
              }}
              className="w-full bg-white border border-[#144227] text-[#144227] hover:bg-[#f6f3ec] py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Handshake size={16} /> 
              {activeThread?.status === 'accepted' ? 'View Finalized Price Negotiation' : 'Propose Price Negotiation / Bulk Deal'}
            </button>
          </div>

          {/* Product Info Guarantee Note & Supplier Notes Link */}
          <div className="bg-[#f0eee7]/60 border border-[#e5e2db] rounded-xl p-4 mt-6 space-y-2">
            <p className="text-xs text-[#414942] leading-relaxed">
              <span className="font-bold text-[#144227]">Quality Guarantee:</span> Sourced from verified local producers. {product.status !== 'accepted' && 'Price negotiations are subject to bulk order quantities and supplier confirmation.'}
            </p>

            {product.supplier_notes && (
              <div className="pt-1.5 border-t border-[#e5e2db]/60 flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#717971]">Harvest & Delivery Notes</span>
                <button
                  type="button"
                  onClick={() => setShowSupplierNotesModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#144227] text-[#144227] hover:text-white font-extrabold text-[11px] transition-all cursor-pointer border border-[#144227]/30 shadow-2xs"
                >
                  <FileText size={13} />
                  <span>View Supplier Notes</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── PRICE NEGOTIATION MODAL DIALOG ──────────────────────────────────── */}
      {isNegotiating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e5e2db] flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-[#e5e2db] pb-3 shrink-0">
              <div className="flex items-center gap-2 text-[#144227] font-bold">
                <Handshake size={20} />
                <h3 className="text-base font-bold text-[#1c1c18]">Negotiate Price for {product.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                {activeThread && (
                  <button 
                    onClick={handleDeleteNegotiation} 
                    className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    title="Delete this negotiation"
                  >
                    Delete Chat
                  </button>
                )}
                <button onClick={() => setIsNegotiating(false)} className="text-[#717971] hover:text-[#1c1c18] cursor-pointer">
                  <X size={18} />
                </button>
              </div>
            </div>

            {loadingThread ? (
              <div className="flex-grow flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#144227] animate-spin" />
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin flex flex-col justify-between">
                {activeThread?.status === 'accepted' && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 mb-1">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>The farmer has accepted the terms. Agreement finalized!</span>
                  </div>
                )}

                {/* Timeline / Counter proposals list */}
                <div className="space-y-3 max-h-[260px] overflow-y-auto p-2 bg-[#fcf9f2] rounded-xl border border-[#e5e2db]">
                  {activeThread?.offers?.length > 0 ? (
                    activeThread.offers.map((offer: any, i: number) => {
                      const isMe = offer.sender === 'client';
                      const isEditingThis = editingOfferId === offer.id;
                      
                      if (isEditingThis) {
                        return (
                          <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full space-y-1.5`}>
                            <div className="bg-white p-3 rounded-xl border border-[#e5e2db] space-y-2 w-full max-w-[85%]">
                              <div>
                                <label className="block text-[8px] uppercase tracking-wider font-bold mb-0.5 text-primary">Price</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={editPrice} 
                                  onChange={(e) => setEditPrice(e.target.value)} 
                                  className="w-full px-2 py-1 border rounded text-xs outline-none" 
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] uppercase tracking-wider font-bold mb-0.5 text-primary">Quantity</label>
                                <input 
                                  type="number" 
                                  value={editQty} 
                                  onChange={(e) => setEditQty(e.target.value)} 
                                  className="w-full px-2 py-1 border rounded text-xs outline-none" 
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] uppercase tracking-wider font-bold mb-0.5 text-primary">Message / Terms</label>
                                <input 
                                  type="text" 
                                  value={editMsg} 
                                  onChange={(e) => setEditMsg(e.target.value)} 
                                  className="w-full px-2 py-1 border rounded text-xs outline-none" 
                                />
                              </div>
                              <div className="flex gap-2 justify-end pt-1">
                                <button onClick={() => setEditingOfferId(null)} className="px-2.5 py-1 text-[10px] border rounded hover:bg-surface-container-low cursor-pointer">Cancel</button>
                                <button onClick={() => handleEditOfferSubmit(offer.id)} className="px-2.5 py-1 text-[10px] bg-[#144227] text-white rounded hover:opacity-90 cursor-pointer">Save</button>
                              </div>
                            </div>
                            <span className="text-[9px] text-[#717971] mt-0.5 px-1">Editing...</span>
                          </div>
                        );
                      }

                      return (
                        <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-xl max-w-[85%] text-xs border ${
                            isMe ? 'bg-[#144227] text-white border-[#144227]' : 'bg-white text-[#1c1c18] border-[#e5e2db]'
                          }`}>
                            <p className="font-semibold">{offer.message || `Proposing $${offer.price}/kg for ${offer.quantity} kg.`}</p>
                            {offer.message && (
                              <p className="mt-1 text-[10px] opacity-75 font-semibold">Terms: ${offer.price} | Qty: {offer.quantity}</p>
                            )}
                            {!offer.message && (
                              <p className="mt-1 text-[10px] opacity-75">Price: ${offer.price} | Qty: {offer.quantity}</p>
                            )}
                            {isMe && activeThread?.status !== 'accepted' && (
                              <button 
                                onClick={() => {
                                  setEditingOfferId(offer.id);
                                  setEditPrice(String(offer.price));
                                  setEditQty(String(offer.quantity));
                                  setEditMsg(offer.message || '');
                                }} 
                                className="mt-1.5 text-[9px] underline block text-white/80 hover:text-white cursor-pointer"
                              >
                                Edit Offer Terms
                              </button>
                            )}
                          </div>
                          <span className="text-[9px] text-[#717971] mt-0.5 px-1">{isMe ? 'You' : 'Farmer'}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-[#717971] text-center py-6">No counter-proposals yet. Start the negotiation below!</p>
                  )}
                </div>

                {activeThread?.status !== 'accepted' && (
                  <form onSubmit={handleSendOffer} className="space-y-3 pt-3 border-t border-[#f0eee7]">
                    <h4 className="text-xs font-bold text-[#1c1c18]">Propose Counter Offer Terms</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-extrabold tracking-wider text-[#717971] mb-1">
                          Your Proposed Price (RWF per {product.unit || 'kg'})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={proposedPrice}
                          onChange={(e) => setProposedPrice(e.target.value)}
                          className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-xl px-4 py-2 text-xs font-bold text-[#1c1c18] focus:outline-none focus:border-[#144227]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-extrabold tracking-wider text-[#717971] mb-1">
                          Proposed Volume ({product.unit || 'kg'})
                        </label>
                        <input
                          type="number"
                          required
                          value={negotiationQty}
                          onChange={(e) => setNegotiationQty(e.target.value)}
                          className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-xl px-4 py-2 text-xs font-bold text-[#1c1c18] focus:outline-none focus:border-[#144227]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-extrabold tracking-wider text-[#717971] mb-1">
                        Offer Message / Custom Terms
                      </label>
                      <input
                        type="text"
                        value={negotiationNotes}
                        onChange={(e) => setNegotiationNotes(e.target.value)}
                        placeholder="Optional details or terms..."
                        className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-xl px-4 py-2 text-xs text-[#1c1c18] focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingProposal}
                        className="flex-grow py-2.5 bg-[#144227] text-white rounded-xl text-xs font-bold hover:bg-[#376847] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isSubmittingProposal ? "Submitting..." : "Send Proposal Terms"}
                      </button>
                      {activeThread?.status === 'open' && (
                        <button
                          type="button"
                          onClick={handleAcceptOffer}
                          className="flex-grow py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          Accept Farmer Terms
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Dialog Box */}
      <SuccessModal
        isOpen={successDialog.isOpen}
        onClose={() => setSuccessDialog(prev => ({ ...prev, isOpen: false }))}
        title={successDialog.title}
        message={successDialog.message}
        confirmText="Done"
      />

      {/* ── SUPPLIER NOTES MODAL ────────────────────────────────────────────── */}
      {showSupplierNotesModal && product?.supplier_notes && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e5e2db] space-y-4 font-sans text-left relative">
            <div className="flex items-center justify-between border-b border-[#f0eee7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#144227]/10 text-[#144227] flex items-center justify-center font-bold shadow-2xs">
                  <FileText size={20} />
                </div>
                <div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-200 font-mono">
                    Verified Supplier Notes
                  </span>
                  <h3 className="text-base font-extrabold text-[#1c1c18] mt-0.5">
                    {product.name}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setShowSupplierNotesModal(false)}
                className="p-1.5 rounded-xl text-[#717971] hover:bg-[#f6f3ec] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-[#fcf9f2] rounded-2xl border border-[#e5e2db] space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#e5e2db] pb-2 text-[10.5px]">
                <span className="font-extrabold text-[#144227] uppercase tracking-wider">Source Origin</span>
                <span className="font-bold text-[#414942]">{product.farmer_name || 'Harvest Hill Delivery'}</span>
              </div>

              <div className="pt-1">
                <p className="text-[9.5px] font-bold text-[#717971] uppercase tracking-wider mb-1">Supplier Notes & Handling Instructions</p>
                <p className="text-[#1c1c18] font-medium leading-relaxed whitespace-pre-line text-xs">
                  {product.supplier_notes}
                </p>
              </div>
            </div>

            <div className="pt-1 text-right">
              <button
                type="button"
                onClick={() => setShowSupplierNotesModal(false)}
                className="w-full py-2.5 bg-[#144227] text-white rounded-xl font-bold text-xs hover:bg-[#376847] transition-all cursor-pointer shadow-sm text-center"
              >
                Close Notes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
