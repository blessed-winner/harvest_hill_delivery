"use client";

import { useState, useEffect } from 'react';
import { Trash2, ChevronRight, Calendar, ArrowRight, ShieldCheck, HeartHandshake, Headphones, Loader2, Package } from 'lucide-react';
import { clientApi } from '../lib/api';

interface CartProps {
  onNavigate: (screen: string) => void;
  cartCount: number;
  setCartCount: (count: number) => void;
}

interface CartItem {
  id: string;
  product_id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  qty: number;
  image_url?: string;
}

const parsePrice = (price: any): number => {
  if (typeof price === 'number') return isNaN(price) ? 0 : price;
  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export default function Cart({ onNavigate, cartCount, setCartCount }: CartProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart_items');
        if (savedCart) {
          const parsedItems = JSON.parse(savedCart);
          // Ensure all prices are numbers
          const validatedItems = parsedItems.map((item: any) => ({
            ...item,
            price: parsePrice(item.price),
            qty: typeof item.qty === 'string' ? parseInt(item.qty, 10) : (item.qty || 1)
          }));
          setItems(validatedItems);
          const totalQty = validatedItems.reduce((sum: number, item: CartItem) => sum + item.qty, 0);
          setCartCount(totalQty);
        }
        
        // Set default delivery date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDeliveryDate(tomorrow.toISOString().split('T')[0]);
      } catch (err) {
        console.error('Failed to load cart:', err);
      } fontally: () => {
        setLoading(false);
      }
    };

    loadCart();
  }, [setCartCount]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('cart_items', JSON.stringify(items));
    }
  }, [items, loading]);

  // Update item quantities
  const updateQty = (id: string, delta: number) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      });
      
      const totalQty = updated.reduce((sum, item) => sum + item.qty, 0);
      setCartCount(totalQty);
      return updated;
    });
  };

  // Remove item
  const removeItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    
    const totalQty = updated.reduce((sum, item) => sum + item.qty, 0);
    setCartCount(totalQty);
  };

  // Clear entire cart
  const clearCart = () => {
    setItems([]);
    setCartCount(0);
    localStorage.removeItem('cart_items');
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (parsePrice(item.price) * item.qty), 0);
  const deliveryFee = items.length > 0 ? 12.00 : 0.00;
  const taxes = subtotal * 0.08; // 8% tax
  const grandTotal = subtotal + deliveryFee + taxes;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#144227] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#717971]">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight font-sans">Your Harvest Cart</h1>
        <p className="text-xs text-[#717971] mt-0.5">Manage your wholesale orders and negotiate directly with suppliers.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto">
          <Package className="w-12 h-12 text-[#717971] mx-auto opacity-40" />
          <h2 className="text-xl font-bold text-[#144227]">Your cart is empty</h2>
          <p className="text-xs text-[#717971]">Add some fresh local products to your cart from our catalog to get started.</p>
          <button
            onClick={() => onNavigate('catalog')}
            className="bg-[#144227] text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-[#376847] transition-all cursor-pointer inline-block"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#e5e2db] rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="w-20 h-20 bg-[#f6f3ec] rounded-xl overflow-hidden flex-shrink-0 border border-[#e5e2db]">
                  <img 
                    src={item.image_url || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=200&q=80'} 
                    alt={item.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>

                {/* Details Panel */}
                <div className="flex-grow flex flex-col justify-between py-0.5">
                  
                  {/* Top part: Category & Title */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="block text-[8px] font-bold text-[#717971] tracking-widest uppercase">
                        {item.category || 'Product'}
                      </span>
                      <h4 className="text-xs font-extrabold text-[#1c1c18] mt-0.5">{item.name}</h4>
                      <span className="text-[9px] text-[#717971] mt-1 block">{item.unit || 'per unit'}</span>
                    </div>

                    {/* Price on right */}
                    <div className="text-right">
                      <span className="block text-sm font-black text-[#1c1c18]">
                        ${parsePrice(item.price).toFixed(2)}
                      </span>
                      <span className="block text-[9px] text-[#717971] uppercase mt-0.5 font-bold">
                        per {item.unit || 'unit'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom part: Qty selectors & Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0eee7]">
                    <div className="flex items-center border border-[#c1c9c0] bg-white rounded-lg overflow-hidden scale-90 origin-left">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="px-2 py-1 text-[#414942] hover:bg-[#fcf9f2] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 font-extrabold text-xs text-[#1c1c18] min-w-[24px] text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="px-2 py-1 text-[#414942] hover:bg-[#fcf9f2] cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#1c1c18]">
                        ${(parsePrice(item.price) * item.qty).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#ba1a1a] hover:bg-[#ffdad6]/20 p-1.5 rounded-full transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6">
            
            {/* Order Summary card */}
            <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-[#1c1c18] pb-3 border-b border-[#f0eee7] flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#144227]" /> Order Summary
              </h2>

              <div className="space-y-2.5 text-xs text-[#414942]">
                <div className="flex justify-between">
                  <span>Subtotal ({cartCount} items)</span>
                  <span className="font-bold text-[#1c1c18]">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-[#1c1c18]">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Taxes (8%)</span>
                  <span className="font-bold text-[#1c1c18]">${taxes.toFixed(2)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="border-t border-[#f0eee7] pt-4 flex justify-between items-baseline text-sm font-extrabold text-[#1c1c18]">
                <span>Total Amount</span>
                <span className="text-[#144227] text-2xl font-black">${grandTotal.toFixed(2)}</span>
              </div>

              {/* Delivery Date Picker */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971]">Preferred Delivery Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none focus:border-[#144227] focus:bg-white text-[#1c1c18]"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#717971]">
                    <Calendar size={14} />
                  </span>
                </div>
                <span className="block text-[9px] text-[#717971] leading-relaxed">
                  * Deliveries are consolidated by region for freshness.
                </span>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    localStorage.setItem('checkout_data', JSON.stringify({
                      items,
                      deliveryDate,
                      subtotal,
                      deliveryFee,
                      taxes,
                      grandTotal
                    }));
                    onNavigate('checkout');
                  }}
                  className="w-full bg-[#144227] text-white py-3.5 rounded-xl font-bold text-xs hover:bg-[#376847] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:shadow-lg"
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </button>

                <button
                  onClick={clearCart}
                  className="w-full bg-white border border-[#e5e2db] text-[#717971] hover:bg-[#f0eee7] py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Clear Cart
                </button>
              </div>

              <div className="flex items-center justify-center gap-1 text-[9px] text-[#717971] font-semibold border-t border-[#f0eee7] pt-3">
                <ShieldCheck size={12} className="text-[#376847]" /> Secure 256-bit SSL encrypted checkout
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
