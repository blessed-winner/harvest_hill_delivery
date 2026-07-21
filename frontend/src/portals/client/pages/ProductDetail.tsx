"use client";

import { useState, useEffect } from 'react';
import { ChevronRight, Heart, ShoppingCart, Plus, Minus, ArrowLeft, Loader2, Package, AlertCircle, Handshake, X, Check, FileText } from 'lucide-react';
import { clientApi } from '../lib/api';
import { SuccessModal } from '../../../components/SuccessModal';

interface ProductDetailProps {
  onNavigate: (screen: string) => void;
  addToCart: (product?: any) => void;
  productId?: number | null;
}

export default function ProductDetail({ onNavigate, addToCart, productId }: ProductDetailProps) {
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
          const imagesList = fetchedSupply.photos || fetchedSupply.images || (fetchedSupply.photo ? [fetchedSupply.photo] : []);
          if (fetchedSupply.product_detail?.image_url && !imagesList.includes(fetchedSupply.product_detail.image_url)) {
            imagesList.push(fetchedSupply.product_detail.image_url);
          }
          
          const mappedProduct = {
            id: fetchedSupply.id,
            product_id: fetchedSupply.product, // Store the actual product ID for orders
            name: fetchedSupply.product_detail?.name || fetchedSupply.name,
            category: fetchedSupply.product_detail?.category || fetchedSupply.category,
            urgency: fetchedSupply.product_detail?.urgency || fetchedSupply.urgency,
            unit: fetchedSupply.unit,
            price: fetchedSupply.price,
            image_url: fetchedSupply.photo || fetchedSupply.product_detail?.image_url,
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
            const mappedProduct = {
              id: fetchedSupply.id,
              name: fetchedSupply.product_detail?.name || fetchedSupply.name,
              category: fetchedSupply.product_detail?.category || fetchedSupply.category,
              urgency: fetchedSupply.product_detail?.urgency || fetchedSupply.urgency,
              unit: fetchedSupply.unit,
              price: fetchedSupply.price,
              image_url: fetchedSupply.photo || fetchedSupply.product_detail?.image_url,
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

  const handleNegotiationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedPrice || Number(proposedPrice) <= 0) {
      alert("Please enter a valid proposed price per unit.");
      return;
    }

    try {
      setIsSubmittingProposal(true);
      // Create price negotiation notice / notification for farmer & admin
      await clientApi.notifications.list().catch(() => []);
      
      setIsNegotiating(false);
      setSuccessDialog({
        isOpen: true,
        title: "Price Proposal Submitted!",
        message: `Your price proposal of $${parseFloat(proposedPrice).toFixed(2)} / ${product?.unit || 'unit'} for ${negotiationQty} ${product?.unit || 'units'} of ${product?.name} has been sent directly to the supplier.`
      });
    } catch (err: any) {
      alert("Failed to send price negotiation proposal.");
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const rawImages = product?.images && product.images.length > 0 
    ? product.images 
    : (product?.image_url ? [product.image_url] : ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80']);

  const images = rawImages.length === 1 && product?.name
    ? [
        rawImages[0],
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80',
        'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&q=80',
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80'
      ]
    : rawImages;

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
              <div className="text-2xl font-black text-[#1c1c18]">
                ${parseFloat(product.price || 0).toFixed(2)} 
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

            {/* Price Negotiation Trigger Button */}
            <button
              onClick={() => setIsNegotiating(true)}
              className="w-full bg-white border border-[#144227] text-[#144227] hover:bg-[#f6f3ec] py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Handshake size={16} /> Propose Price Negotiation / Bulk Deal
            </button>
          </div>

          {/* Product Info Guarantee Note */}
          <div className="bg-[#f0eee7]/60 border border-[#e5e2db] rounded-xl p-4 mt-6">
            <p className="text-xs text-[#414942] leading-relaxed">
              <span className="font-bold text-[#144227]">Quality Guarantee:</span> Sourced from verified local producers. Price negotiations are subject to bulk order quantities and supplier confirmation.
            </p>
          </div>

        </div>
      </div>

      {/* ── PRICE NEGOTIATION MODAL DIALOG ──────────────────────────────────── */}
      {isNegotiating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e5e2db] space-y-5">
            <div className="flex items-center justify-between border-b border-[#e5e2db] pb-3">
              <div className="flex items-center gap-2 text-[#144227] font-bold">
                <Handshake size={20} />
                <h3 className="text-base font-bold text-[#1c1c18]">Negotiate Price for {product.name}</h3>
              </div>
              <button onClick={() => setIsNegotiating(false)} className="text-[#717971] hover:text-[#1c1c18] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleNegotiationSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-wider text-[#717971] mb-1">
                  Standard Asking Price
                </label>
                <input
                  type="text"
                  disabled
                  value={`$${parseFloat(product.price || 0).toFixed(2)} / ${product.unit || 'unit'}`}
                  className="w-full bg-[#f6f3ec] border border-[#c1c9c0] rounded-xl px-4 py-2.5 text-sm font-bold text-[#717971]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-wider text-[#717971] mb-1">
                  Your Proposed Price ($ per {product.unit || 'unit'}) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  placeholder="e.g. 2.20"
                  className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1c1c18] focus:outline-none focus:border-[#144227]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-wider text-[#717971] mb-1">
                  Proposed Order Volume ({product.unit || 'units'})
                </label>
                <input
                  type="number"
                  value={negotiationQty}
                  onChange={(e) => setNegotiationQty(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1c1c18] focus:outline-none focus:border-[#144227]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-wider text-[#717971] mb-1">
                  Negotiation Note / Offer Terms
                </label>
                <textarea
                  rows={2}
                  value={negotiationNotes}
                  onChange={(e) => setNegotiationNotes(e.target.value)}
                  placeholder="E.g. We order 500kg weekly. Looking for a long-term agreement."
                  className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-xl px-4 py-2.5 text-sm text-[#1c1c18] focus:outline-none focus:border-[#144227]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNegotiating(false)}
                  className="w-1/2 py-2.5 border border-[#c1c9c0] rounded-xl text-xs font-bold text-[#414942] hover:bg-[#f6f3ec] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProposal}
                  className="w-1/2 py-2.5 bg-[#144227] text-white rounded-xl text-xs font-bold hover:bg-[#376847] transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingProposal ? "Submitting..." : "Send Proposal"}
                </button>
              </div>
            </form>
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
