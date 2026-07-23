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
        
        if (productId) {
          // Fetch specific supply (acting as product)
          const fetchedSupply = await clientApi.products.get(productId);
          
          const imagesList: string[] = [];
          const seenPaths = new Set<string>();

          const addImage = (url: string | null | undefined) => {
            if (!url) return;
            const normalized = normalizeUrlPath(url);
            if (!seenPaths.has(normalized)) {
              seenPaths.add(normalized);
              imagesList.push(getFullImageUrl(url));
            }
          };

          if (fetchedSupply.photo) {
            addImage(fetchedSupply.photo);
          }
          
          if (Array.isArray(fetchedSupply.images)) {
            fetchedSupply.images.forEach((imgObj: any) => {
              const url = imgObj.image_url || imgObj.image;
              if (url) addImage(url);
            });
          }
          
          if (imagesList.length === 0 && fetchedSupply.product_detail?.image_url) {
            addImage(fetchedSupply.product_detail.image_url);
          }
          
          const mappedProduct = {
            id: fetchedSupply.id,
            product_id: fetchedSupply.product, // Store the actual product ID for orders
            name: fetchedSupply.product_detail?.name || fetchedSupply.name,
            category: fetchedSupply.product_detail?.category || fetchedSupply.category,
            urgency: fetchedSupply.product_detail?.urgency || fetchedSupply.urgency,
            unit: fetchedSupply.unit,
            price: fetchedSupply.price,
            status: fetchedSupply.status, // Include supply status
            image_url: fetchedSupply.photo 
              ? getFullImageUrl(fetchedSupply.photo) 
              : (fetchedSupply.product_detail?.image_url ? getFullImageUrl(fetchedSupply.product_detail.image_url) : ''),
            images: imagesList.length > 0 ? imagesList : undefined,
            farmer_name: fetchedSupply.farmer_name,
            farmer_location: fetchedSupply.farmer_location,
            quantity: fetchedSupply.quantity,
            quality_grade: fetchedSupply.quality_grade,
            notes: fetchedSupply.notes,
            available_date: fetchedSupply.available_date
          };
          setProduct(mappedProduct);
          setProposedPrice(fetchedSupply.price ? String(fetchedSupply.price) : '');
        } else {
          // Fallback: fetch first product as demo
          const products = await clientApi.products.list({ limit: '1' });
          if (products?.results && products.results.length > 0) {
            const fetchedSupply = products.results[0];
            
            const imagesList: string[] = [];
            const seenPaths = new Set<string>();

            const addImage = (url: string | null | undefined) => {
              if (!url) return;
              const normalized = normalizeUrlPath(url);
              if (!seenPaths.has(normalized)) {
                seenPaths.add(normalized);
                imagesList.push(getFullImageUrl(url));
              }
            };

            if (fetchedSupply.photo) {
              addImage(fetchedSupply.photo);
            }
            
            if (Array.isArray(fetchedSupply.images)) {
              fetchedSupply.images.forEach((imgObj: any) => {
                const url = imgObj.image_url || imgObj.image;
                if (url) addImage(url);
              });
            }
            
            if (imagesList.length === 0 && fetchedSupply.product_detail?.image_url) {
              addImage(fetchedSupply.product_detail.image_url);
            }

            const mappedProduct = {
              id: fetchedSupply.id,
              product_id: fetchedSupply.product,
              name: fetchedSupply.product_detail?.name || fetchedSupply.name,
              category: fetchedSupply.product_detail?.category || fetchedSupply.category,
              urgency: fetchedSupply.product_detail?.urgency || fetchedSupply.urgency,
              unit: fetchedSupply.unit,
              price: fetchedSupply.price,
              status: fetchedSupply.status, // Include supply status
              image_url: fetchedSupply.photo 
                ? getFullImageUrl(fetchedSupply.photo) 
                : (fetchedSupply.product_detail?.image_url ? getFullImageUrl(fetchedSupply.product_detail.image_url) : ''),
              images: imagesList.length > 0 ? imagesList : undefined,
              farmer_name: fetchedSupply.farmer_name,
              quantity: fetchedSupply.quantity
            };
            setProduct(mappedProduct);
            setProposedPrice(fetchedSupply.price ? String(fetchedSupply.price) : '');
          } else {
            setError('Product not found');
          }
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
        const threads = await apiRequest('/api/negotiations/threads/');
        const thread = threads.find((t: any) => t.supply_detail?.id === Number(productId));
        if (thread && thread.status === 'accepted') {
          const lastOffer = thread.offers?.[thread.offers.length - 1];
          const price = lastOffer ? lastOffer.price : thread.supply_detail?.proposed_price;
          setNegotiatedPrice(Number(price));
        } else {
          setNegotiatedPrice(null);
        }
      } catch (err) {
        console.error("Error checking negotiated price:", err);
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
    : (product?.image_url ? [product.image_url] : ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80']);

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
            className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 font-sans">
      
      {/* Navigation Breadcrumb */}
      <div className="text-xs text-[#717971] flex items-center gap-1.5">
        <button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors flex items-center gap-1 cursor-pointer">
          <ArrowLeft size={12} /> Marketplace
        </button>
        <ChevronRight size={12} />
        <button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors cursor-pointer">
          {product.category || 'Products'}
        </button>
        <ChevronRight size={12} />
        <span className="text-[#1c1c18] font-bold">{product.name}</span>
      </div>

      {/* Main product columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Image viewer */}
        <div className="space-y-4">
          <div className="w-full aspect-[4/3] bg-[#f6f3ec] rounded-2xl overflow-hidden border border-[#e5e2db] shadow-sm">
            <img
              src={images[activeImgIndex]}
              alt={product.name}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          </div>

          {/* Thumbnails row */}
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2.5">
              {images.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setActiveImgIndex(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 bg-[#f6f3ec] transition-all cursor-pointer ${
                    activeImgIndex === index ? 'border-[#144227] scale-102 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
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

            <div className="flex items-center gap-4 pt-1">
              <div className="text-2xl font-black text-[#1c1c18] flex items-baseline gap-2">
                {negotiatedPrice !== null ? (
                  <>
                    <span className="line-through text-red-600">${parseFloat(product.price || 0).toFixed(2)}</span>
                    <span className="text-emerald-700 font-extrabold text-2xl">${negotiatedPrice.toFixed(2)}</span>
                  </>
                ) : (
                  <span>${parseFloat(product.price || 0).toFixed(2)}</span>
                )}
                <span className="text-xs font-bold text-[#717971]"> per {product.unit || 'unit'}</span>
              </div>
              {product.quantity && product.quantity > 0 ? (
                <span className="bg-[#bceec8] text-[#00210f] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Available: {product.quantity} {product.unit}
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Check Availability
                </span>
              )}
            </div>
          </div>

          {/* Action Row: Qty Selector, Add to Cart & Negotiate Price */}
          <div className="space-y-3 pt-3 border-t border-[#f0eee7]">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[#c1c9c0] bg-white rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-3 text-[#414942] hover:bg-[#fcf9f2] transition-colors cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <span className="px-4 py-2 font-extrabold text-sm text-[#1c1c18] min-w-[40px] text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="p-3 text-[#414942] hover:bg-[#fcf9f2] transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={() => {
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

            {/* Price Negotiation Trigger Button - Only show for pending/negotiating supplies */}
            {product.status !== 'accepted' && (
              <button
                onClick={() => setIsNegotiating(true)}
                className="w-full bg-white border border-[#144227] text-[#144227] hover:bg-[#f6f3ec] py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Handshake size={16} /> Propose Price Negotiation / Bulk Deal
              </button>
            )}
          </div>

          {/* Product Info Guarantee Note */}
          <div className="bg-[#f0eee7]/60 border border-[#e5e2db] rounded-xl p-4 mt-6">
            <p className="text-xs text-[#414942] leading-relaxed">
              <span className="font-bold text-[#144227]">Quality Guarantee:</span> Sourced from verified local producers. {product.status !== 'accepted' && 'Price negotiations are subject to bulk order quantities and supplier confirmation.'}
            </p>
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
                          Your Proposed Price ($ per {product.unit || 'unit'})
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
                          Proposed Volume ({product.unit || 'units'})
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

    </div>
  );
}
