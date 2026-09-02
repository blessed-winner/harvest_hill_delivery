"use client";

import { useState, useEffect } from 'react';
import { Trash2, ChevronRight, Calendar, ArrowRight, ShieldCheck, HeartHandshake, Headphones, Loader2, Package } from 'lucide-react';
import { clientApi, getCartStorageKey } from '../lib/api';
import { useAlert } from '../../../context/AlertContext';

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
  let val = 0;
  if (typeof price === 'number') val = isNaN(price) ? 0 : price;
  else if (typeof price === 'string') {
    const parsed = parseFloat(price.replace(/[^0-9.]/g, ''));
    val = isNaN(parsed) ? 0 : parsed;
  }
  if (val > 0 && val < 100) return Math.round(val * 1473.97);
  return val;
};

export default function Cart({ onNavigate, cartCount, setCartCount }: CartProps) {
  const { showAlert } = useAlert();
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Load cart from user-scoped localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const cartKey = getCartStorageKey();
        const savedCart = localStorage.getItem(cartKey);
        if (savedCart) {
          const parsedItems = JSON.parse(savedCart);
          // Ensure all prices are numbers
          const validatedItems = parsedItems.map((item: any) => ({
            ...item,
            price: parsePrice(item.price),
            qty: typeof item.qty === 'string' ? parseInt(item.qty, 10) : (item.qty || 1)
          }));
          setItems(validatedItems);
          setCartCount(validatedItems.length);
        }
        
        // Set default delivery date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDeliveryDate(tomorrow.toISOString().split('T')[0]);
      } catch (err) {
        console.error('Failed to load cart:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [setCartCount]);

  // Save cart to user-scoped localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(getCartStorageKey(), JSON.stringify(items));
    }
  }, [items, loading]);

  // Update item quantities
  const updateQty = (id: string, delta: number) => {
    let limitWarning: { name: string; maxAvailable: number; unit: string } | null = null;

    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const maxAvailable = parseFloat((item as any).available_quantity || 9999);
          const targetQty = item.qty + delta;
          if (targetQty > maxAvailable) {
            limitWarning = { name: item.name, maxAvailable, unit: item.unit || 'kg' };
            return { ...item, qty: maxAvailable };
          }
          const newQty = Math.max(1, targetQty);
          return { ...item, qty: newQty };
        }
        return item;
      });
      
      setCartCount(updated.length);
      return updated;
    });

    if (limitWarning) {
      const { name, maxAvailable, unit } = limitWarning;
      showAlert("Stock Limit Reached", `Maximum available stock for "${name}" is ${maxAvailable} ${unit}.`, "warning");
    }
  };

  // Direct manual quantity input handler
  const handleManualQtyChange = (id: string, rawVal: string) => {
    const parsed = parseInt(rawVal, 10);
    let limitWarning: { name: string; maxAvailable: number; unit: string } | null = null;

    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const maxAvailable = parseFloat((item as any).available_quantity || 9999);
          let validQty = isNaN(parsed) ? 1 : Math.max(1, parsed);
          if (validQty > maxAvailable) {
            limitWarning = { name: item.name, maxAvailable, unit: item.unit || 'kg' };
            validQty = maxAvailable;
          }
          return { ...item, qty: validQty };
        }
        return item;
      });
      setCartCount(updated.length);
      return updated;
    });

    if (limitWarning) {
      const { name, maxAvailable, unit } = limitWarning;
      showAlert("Stock Limit Reached", `Maximum available stock for "${name}" is ${maxAvailable} ${unit}.`, "warning");
    }
  };

  // Remove item
  const removeItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    setCartCount(updated.length);
  };

  // Clear entire cart
  const clearCart = () => {
    setItems([]);
    setCartCount(0);
    localStorage.removeItem(getCartStorageKey());
  };

  // Calculate item unit price
  const getItemUnitPrice = (item: any) => {
    return parsePrice(item.price);
  };

  // Calculate totals in RWF
  const subtotal = items.reduce((sum, item) => sum + (getItemUnitPrice(item) * item.qty), 0);
  const grandTotal = subtotal;

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
                <div className="w-20 h-20 bg-[#f6f3ec] rounded-xl overflow-hidden flex-shrink-0 border border-[#e5e2db] flex items-center justify-center">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Package className="w-8 h-8 text-[#717971] opacity-40" />
                  )}
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
                      <span className="text-[9px] text-[#717971] mt-1 block">{item.unit ? `per ${item.unit}` : 'per kg'}</span>
                    </div>

                    {/* Price on right */}
                    <div className="text-right">
                      <span className="block text-sm font-black text-[#1c1c18]">
                        RWF {parsePrice(item.price).toLocaleString()}
                      </span>
                      <span className="block text-[9px] text-[#717971] uppercase mt-0.5 font-bold">
                        per {item.unit || 'kg'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom part: Qty selectors & Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0eee7]">
                    <div className="flex items-center border border-[#c1c9c0] bg-white rounded-xl overflow-hidden shadow-sm hover:border-[#144227] transition-all">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, -1)}
                        className="px-2.5 py-1 text-[#414942] hover:bg-[#f6f3ec] transition-colors cursor-pointer font-bold text-sm select-none"
                        title="Decrease quantity"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) => handleManualQtyChange(item.id, e.target.value)}
                        onBlur={(e) => {
                          if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                            handleManualQtyChange(item.id, '1');
                          }
                        }}
                        className="w-14 py-1 font-extrabold text-xs text-[#1c1c18] text-center bg-transparent border-x border-[#e5e2db] focus:outline-none focus:bg-[#f6f3ec]/40 font-mono"
                        title="Enter quantity manually"
                      />
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, 1)}
                        className="px-2.5 py-1 text-[#414942] hover:bg-[#f6f3ec] transition-colors cursor-pointer font-bold text-sm select-none"
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#1c1c18]">
                        RWF {(parsePrice(item.price) * item.qty).toLocaleString()}
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
                  <span className="font-bold text-[#1c1c18]">RWF {subtotal.toLocaleString()}</span>
                </div>

                <div className="bg-[#f0eee7]/80 p-3 rounded-xl border border-[#e5e2db] space-y-1 mt-2">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#144227]">
                    Transport Fee & Tax Assessment
                  </span>
                  <p className="text-[11px] text-[#414942] leading-relaxed">
                    Transport fee & tax will be calculated and attached by the Admin based on your delivery address upon order review. Once approved, the exact transport fee, tax, and final total payment will be attached to your order summary.
                  </p>
                </div>
              </div>

              {/* Grand Total */}
              <div className="border-t border-[#f0eee7] pt-4 flex justify-between items-baseline text-sm font-extrabold text-[#1c1c18]">
                <span>Items Subtotal</span>
                <span className="text-[#144227] text-2xl font-black">RWF {grandTotal.toLocaleString()}</span>
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
                      deliveryFee: 0,
                      taxes: 0,
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
