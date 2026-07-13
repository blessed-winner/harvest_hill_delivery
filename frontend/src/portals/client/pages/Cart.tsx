"use client";

import { useState } from 'react';
import { Trash2, MessageSquare, ChevronRight, Calendar, ArrowRight, ShieldCheck, HeartHandshake, Headphones } from 'lucide-react';

interface CartProps {
  onNavigate: (screen: string) => void;
  cartCount: number;
  setCartCount: (count: number) => void;
}

export default function Cart({ onNavigate, cartCount, setCartCount }: CartProps) {
  // Cart items state
  const [items, setItems] = useState([
    {
      id: 'kale',
      vendor: 'Meadow Green Farms',
      vendorBadge: 'PREMIUM PARTNER',
      brand: 'ROOT VEGETABLES & GREENS',
      name: 'Organic Dino Kale (Bulk Case)',
      sku: 'SKU: HG-3422-K',
      qualityBadge: 'Quality A+',
      price: 124.50,
      originalPrice: 140.00,
      negotiated: true,
      qty: 2,
      img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&q=80'
    },
    {
      id: 'potatoes',
      vendor: 'Meadow Green Farms',
      vendorBadge: 'PREMIUM PARTNER',
      brand: 'ROOT VEGETABLES',
      name: 'Gold Yukon Heirloom Potatoes',
      sku: 'SKU: HG-9921-P',
      qualityBadge: 'Quality A',
      price: 45.00,
      unit: '50lb Sack',
      negotiated: false,
      qty: 5,
      img: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&q=80'
    },
    {
      id: 'milk',
      vendor: 'Hillside Dairy',
      vendorBadge: null,
      brand: 'DAIRY & POULTRY',
      name: 'Artisan Grass-Fed Whole Milk',
      sku: 'SKU: HD-102-M',
      qualityBadge: 'Pasture Raised',
      price: 82.00,
      originalPrice: 95.00,
      negotiated: true,
      qty: 10,
      img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80'
    }
  ]);

  const [deliveryDate, setDeliveryDate] = useState('2024-05-24');

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
      
      // Update global cart counter
      const totalQty = updated.reduce((sum, item) => sum + item.qty, 0);
      setCartCount(totalQty);
      return updated;
    });
  };

  // Remove item
  const removeItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    
    // Update global cart counter
    const totalQty = updated.reduce((sum, item) => sum + item.qty, 0);
    setCartCount(totalQty);
  };

  // Math Calculations
  const subtotal = items.reduce((sum, item) => {
    // Original prices sum
    const base = item.originalPrice || item.price;
    return sum + (base * item.qty);
  }, 0);

  const savings = items.reduce((sum, item) => {
    if (item.negotiated && item.originalPrice) {
      return sum + ((item.originalPrice - item.price) * item.qty);
    }
    return sum;
  }, 0);

  const deliveryFee = items.length > 0 ? 12.00 : 0.00;
  const taxes = items.length > 0 ? 4.45 : 0.00;
  const grandTotal = subtotal - savings + deliveryFee + taxes;

  // Group items by vendor
  const vendors = Array.from(new Set(items.map(item => item.vendor)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight font-sans">Your Harvest Cart</h1>
        <p className="text-xs text-[#717971] mt-0.5">Manage your wholesale orders and negotiate directly with suppliers.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto">
          <Trash2 className="w-12 h-12 text-[#717971] mx-auto opacity-40" />
          <h2 className="text-xl font-bold text-[#144227]">Your cart is empty</h2>
          <p className="text-xs text-[#717971]">Add some fresh local crops to your cart from our catalog to get started.</p>
          <button
            onClick={() => onNavigate('catalog')}
            className="bg-[#144227] text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-[#376847] transition-all cursor-pointer inline-block"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Vendor Grouped Items */}
          <div className="lg:col-span-2 space-y-6">
            
            {vendors.map((vendorName) => {
              const vendorItems = items.filter(item => item.vendor === vendorName);
              const hasBadge = vendorItems[0]?.vendorBadge;
              
              return (
                <div key={vendorName} className="space-y-3">
                  {/* Vendor Heading Card */}
                  <div className="flex items-center justify-between border-b border-[#e5e2db] pb-2 text-[#1c1c18]">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-extrabold text-[#1c1c18]">{vendorName}</h3>
                      {hasBadge && (
                        <span className="bg-[#bceec8] text-[#00210f] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                          {hasBadge}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onNavigate('catalog')}
                      className="text-xs font-bold text-[#144227] hover:underline cursor-pointer"
                    >
                      View Profile
                    </button>
                  </div>

                  {/* Vendor Items Grid */}
                  <div className="space-y-4">
                    {vendorItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-[#e5e2db] rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Image */}
                        <div className="w-20 h-20 bg-[#f6f3ec] rounded-xl overflow-hidden flex-shrink-0 border border-[#e5e2db]">
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Details Panel */}
                        <div className="flex-grow flex flex-col justify-between py-0.5">
                          
                          {/* Top part: Brand & Title */}
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="block text-[8px] font-bold text-[#717971] tracking-widest uppercase">{item.brand}</span>
                              <h4 className="text-xs font-extrabold text-[#1c1c18] mt-0.5">{item.name}</h4>
                              
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[9px] font-mono text-[#717971]">{item.sku}</span>
                                <span className="bg-[#f0eee7] text-[#414942] text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <ShieldCheck size={9} className="text-[#376847]" /> {item.qualityBadge}
                                </span>
                              </div>
                            </div>

                            {/* Price on right */}
                            <div className="text-right">
                              <span className="block text-sm font-black text-[#1c1c18]">
                                ${item.price.toFixed(2)}
                              </span>
                              
                              {item.originalPrice && (
                                <span className="block text-[10px] text-[#717971] line-through mt-0.5">
                                  ${item.originalPrice.toFixed(2)}
                                </span>
                              )}

                              {item.unit && (
                                <span className="block text-[9px] text-[#717971] uppercase mt-0.5 font-bold">
                                  {item.unit}
                                </span>
                              )}
                              
                              {item.negotiated && (
                                <span className="inline-block text-[8px] font-bold text-[#376847] bg-[#bceec8] px-1 rounded mt-1">
                                  Negotiated
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Bottom part: Qty selectors & Action buttons */}
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

                            <div className="flex items-center gap-3 text-xs text-[#717971]">
                              {item.negotiated && (
                                <button
                                  onClick={() => onNavigate('product-detail')}
                                  className="flex items-center gap-1 font-bold text-[#144227] hover:underline cursor-pointer"
                                >
                                  <MessageSquare size={13} /> Re-negotiate
                                </button>
                              )}
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
                </div>
              );
            })}

          </div>

          {/* Right Column: Order Summary & Help */}
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
                
                {savings > 0 && (
                  <div className="flex justify-between text-[#376847]">
                    <span className="flex items-center gap-1 font-semibold">
                      <HeartHandshake size={14} /> Supplier Savings
                    </span>
                    <span className="font-extrabold">-${savings.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-[#1c1c18]">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Taxes</span>
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
                  onClick={() => onNavigate('checkout')}
                  className="w-full bg-[#144227] text-white py-3.5 rounded-xl font-bold text-xs hover:bg-[#376847] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:shadow-lg"
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </button>

                <button
                  onClick={() => alert("Cart saved as Draft Quote.")}
                  className="w-full bg-white border border-[#144227] text-[#144227] hover:bg-[#144227]/5 py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Save as Draft Quote
                </button>
              </div>

              <div className="flex items-center justify-center gap-1 text-[9px] text-[#717971] font-semibold border-t border-[#f0eee7] pt-3">
                <ShieldCheck size={12} className="text-[#376847]" /> Secure 256-bit SSL encrypted checkout
              </div>
            </div>

            {/* Procurement Help Card */}
            <div className="bg-[#144227] text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-white/10 rounded-lg text-[#bceec8]"><Headphones size={18} /></span>
                <h4 className="text-xs font-bold text-[#bceec8]">Need procurement help?</h4>
              </div>
              <p className="text-[10px] text-white/80 leading-relaxed">
                Our farm specialists can help you finalize pricing or find seasonal substitutions.
              </p>
              <button
                onClick={() => alert("Connecting to farm specialist chat...")}
                className="text-[10px] font-bold text-[#9ed0ab] hover:underline underline-offset-2 cursor-pointer"
              >
                Talk to an Expert
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
