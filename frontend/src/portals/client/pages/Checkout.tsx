"use client";

import { useState, useEffect } from 'react';
import { MapPin, Clock, X, ArrowRight, Leaf, Loader2, Package } from 'lucide-react';
import { clientApi, formatCurrency } from '../lib/api';

interface CheckoutProps {
  onNavigate: (screen: string) => void;
  clearCart: () => void;
}

export default function Checkout({ onNavigate, clearCart }: CheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  
  // Input fields
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('mon');
  const [selectedTime, setSelectedTime] = useState<string>('morning');
  const [deliveryDate, setDeliveryDate] = useState('');
  
  // Success state
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Generate next 4 weekdays
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 1; i <= 4; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        id: dayNames[date.getDay()].toLowerCase(),
        label: dayNames[date.getDay()],
        date: `${date.getMonth() + 1}/${date.getDate()}`
      });
    }
    return days;
  };

  const days = getNextDays();

  // Load checkout data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('checkout_data');
      if (saved) {
        const data = JSON.parse(saved);
        setCheckoutData(data);
        setDeliveryDate(data.deliveryDate || '');
      } else {
        setError('No items in checkout');
      }
    } catch (err) {
      setError('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      setError('Please enter a delivery address');
      return;
    }

    if (!checkoutData?.items || checkoutData.items.length === 0) {
      setError('Cart is empty');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Get selected day date
      const selectedDayInfo = days.find(d => d.id === selectedDay);
      const deliverySchedule = selectedDayInfo 
        ? `${selectedDayInfo.date} ${selectedTime === 'morning' ? '8:00 AM - 12:00 PM' : '1:00 PM - 5:00 PM'}`
        : '';

      // Create order payload
      const orderPayload = {
        delivery_address: `${deliveryAddress}${deliverySchedule ? ` | Delivery: ${deliverySchedule}` : ''}`,
        items: checkoutData.items.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.qty
        }))
      };

      // Submit order to backend
      await clientApi.orders.create(orderPayload);
      
      setOrderPlaced(true);
      
      // Clear cart and redirect after short delay
      setTimeout(() => {
        clearCart();
        localStorage.removeItem('checkout_data');
        onNavigate('order-history');
      }, 2500);
      
    } catch (err: any) {
      console.error('Failed to place order:', err);
      setError(err.message || 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#144227] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#717971]">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error && !checkoutData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center">
          <Package className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#1c1c18] mb-2">Unable to Load Checkout</h2>
          <p className="text-sm text-[#717971] mb-4">{error}</p>
          <button
            onClick={() => onNavigate('cart')}
            className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Steps Indicator / Top Header */}
      <div className="flex items-center justify-between border-b border-[#e5e2db] pb-4 mb-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#144227] text-white flex items-center justify-center text-xs font-bold">1</span>
            <span className="text-sm font-bold text-[#1c1c18]">Checkout</span>
          </div>
          <div className="w-12 h-[1px] bg-[#c1c9c0]" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#f0eee7] text-[#717971] flex items-center justify-center text-xs font-bold">2</span>
            <span className="text-sm font-semibold text-[#717971]">Confirmation</span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('catalog')}
          className="flex items-center gap-1 text-xs font-bold text-[#717971] hover:text-[#ba1a1a] transition-colors cursor-pointer"
        >
          <X size={16} /> Cancel
        </button>
      </div>

      {orderPlaced ? (
        <div className="max-w-md mx-auto text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-[#bceec8] text-[#00210f] rounded-full flex items-center justify-center mx-auto shadow-md">
            <Leaf className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-[#144227]">Order Placed Successfully!</h2>
          <p className="text-xs text-[#717971]">
            Your order has been confirmed. Redirecting you to order history...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column Forms (Checkout details) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Delivery Address */}
            <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-[#f0eee7] pb-3 text-[#144227]">
                <MapPin size={18} />
                <h2 className="text-sm font-bold text-[#1c1c18]">Delivery Address</h2>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Full Delivery Address</label>
                <textarea
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter complete delivery address..."
                  className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white text-[#1c1c18] font-medium"
                />
              </div>
            </div>

            {/* Delivery Schedule */}
            <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-[#f0eee7] pb-3 text-[#144227]">
                <Clock size={18} />
                <h2 className="text-sm font-bold text-[#1c1c18]">Delivery Schedule</h2>
              </div>

              {/* Day Options */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {days.map((day) => {
                  const isSelected = selectedDay === day.id;
                  return (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDay(day.id)}
                      type="button"
                      className={`border px-4 py-3 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'border-[#376847] bg-[#bceec8]/30 text-[#144227]'
                          : 'border-[#c1c9c0] hover:border-[#144227] text-[#414942]'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">{day.label}</span>
                      <span className="text-xs font-bold">{day.date}</span>
                    </button>
                  );
                })}
              </div>

              {/* Time Options */}
              <div className="space-y-3 pt-2">
                <p className="text-[9px] uppercase font-bold tracking-wider text-[#717971]">Available Time Windows</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Morning */}
                  <label className="flex items-center justify-between border border-[#c1c9c0] rounded-xl px-4 py-3 cursor-pointer group hover:border-[#144227] transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="time-window"
                        checked={selectedTime === 'morning'}
                        onChange={() => setSelectedTime('morning')}
                        className="w-4 h-4 text-[#144227] focus:ring-[#144227]"
                      />
                      <span className="text-xs font-bold text-[#1c1c18]">Morning (8:00 AM - 12:00 PM)</span>
                    </div>
                    <span className="text-[9px] font-bold tracking-wider bg-[#bceec8] text-[#00210f] px-2 py-0.5 rounded-full uppercase">Free</span>
                  </label>

                  {/* Afternoon */}
                  <label className="flex items-center justify-between border border-[#c1c9c0] rounded-xl px-4 py-3 cursor-pointer group hover:border-[#144227] transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="time-window"
                        checked={selectedTime === 'afternoon'}
                        onChange={() => setSelectedTime('afternoon')}
                        className="w-4 h-4 text-[#144227] focus:ring-[#144227]"
                      />
                      <span className="text-xs font-bold text-[#1c1c18]">Afternoon (1:00 PM - 5:00 PM)</span>
                    </div>
                    <span className="text-[9px] font-bold tracking-wider bg-[#f0eee7] text-[#414942] px-2 py-0.5 rounded-full uppercase">Standard</span>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary & Farm support card */}
          <div className="space-y-6">
            
            {/* Order Summary */}
            <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-[#1c1c18] pb-3 border-b border-[#f0eee7]">Order Summary</h2>

              {/* Items List */}
              <div className="space-y-4">
                {checkoutData?.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#f6f3ec] rounded-lg overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#717971] text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-[#1c1c18]">{item.name}</span>
                        <span className="block text-[10px] text-[#717971] mt-0.5">Qty: {item.qty} {item.unit || ''}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#1c1c18]">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="border-t border-[#f0eee7] pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#414942]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#1c1c18]">${checkoutData?.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-[#414942]">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-[#376847]">${checkoutData?.deliveryFee?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-[#414942]">
                  <span>Estimated Tax</span>
                  <span className="font-bold text-[#1c1c18]">${checkoutData?.taxes?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="border-t border-[#f0eee7] pt-4 flex justify-between text-sm font-extrabold text-[#1c1c18]">
                <span>Total</span>
                <span className="text-[#144227] text-lg">${checkoutData?.grandTotal?.toFixed(2) || '0.00'}</span>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-[#ffdad6] border border-[#ba1a1a] text-[#93000a] p-3 rounded-lg text-xs">
                  {error}
                </div>
              )}

              {/* Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={submitting || !deliveryAddress.trim()}
                className="w-full bg-[#144227] text-white py-3.5 rounded-xl font-bold text-xs hover:bg-[#376847] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:shadow-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Place Your Order <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="text-[9px] text-[#717971] leading-relaxed text-center">
                By placing your order, you agree to Harvest Hill's <a href="#" className="underline">Terms of Service</a>.
              </p>
            </div>

            {/* Farm Leaf Support info card */}
            <div className="border border-dashed border-[#c1c9c0] bg-[#f2efe7]/50 rounded-2xl p-5 flex items-start gap-3">
              <span className="text-[#376847] p-1.5 bg-white border border-[#c1c9c0] rounded-full shadow-sm">
                <Leaf size={16} />
              </span>
              <div>
                <p className="text-xs font-semibold text-[#1c1c18] leading-normal">
                  Your order supports local family farms delivering fresh produce.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
