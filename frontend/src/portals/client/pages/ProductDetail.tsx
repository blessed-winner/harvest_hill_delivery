"use client";

import { useState, useEffect } from 'react';
import { ChevronRight, Heart, ShoppingCart, Plus, Minus, ArrowLeft, Loader2, Package, AlertCircle } from 'lucide-react';
import { clientApi } from '../lib/api';

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

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (productId) {
          // Fetch specific product
          const fetchedProduct = await clientApi.products.get(productId);
          setProduct(fetchedProduct);
        } else {
          // Fallback: fetch first product as demo
          const products = await clientApi.products.list({ limit: '1' });
          if (products?.results && products.results.length > 0) {
            setProduct(products.results[0]);
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

  const images = product?.image_url 
    ? [product.image_url]
    : ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80'];

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      
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
            
            <h1 className="text-3xl font-extrabold text-[#144227] leading-tight">
              {product.name}
            </h1>
            
            <p className="text-sm text-[#414942] leading-relaxed">
              {product.description || 'Fresh from local farms. High quality and sustainable.'}
            </p>

            <div className="flex items-center gap-4 pt-1">
              <div className="text-2xl font-black text-[#1c1c18]">
                ${product.base_price?.toFixed(2) || '0.00'} 
                <span className="text-xs font-bold text-[#717971]"> per {product.unit || 'unit'}</span>
              </div>
              {product.quantity_needed && product.quantity_needed > 0 ? (
                <span className="bg-[#bceec8] text-[#00210f] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Available
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Check Availability
                </span>
              )}
            </div>
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#f0eee7]">
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
                // Add product to cart with quantity
                for (let i = 0; i < qty; i++) {
                  addToCart(product);
                }
                // Navigate to cart
                onNavigate('cart');
              }}
              className="flex-grow bg-[#144227] text-white py-3.5 px-6 rounded-xl font-bold text-xs hover:bg-[#376847] flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer hover:shadow-lg"
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>
          </div>

          {/* Product Info Note */}
          <div className="bg-[#f0eee7]/60 border border-[#e5e2db] rounded-xl p-4 mt-6">
            <p className="text-xs text-[#414942] leading-relaxed">
              <span className="font-bold text-[#144227]">Quality Guarantee:</span> All products are sourced from certified local farms. 
              Fresh delivery within 48 hours of order confirmation.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
