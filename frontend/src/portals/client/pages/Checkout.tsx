"use client";

import { useState } from 'react';
import { MapPin, Clock, CreditCard, ChevronRight, X, ArrowRight, Leaf, Trash2 } from 'lucide-react';

interface CheckoutProps {
  onNavigate: (screen: string) => void;
  clearCart: () => void;
}

export default function Checkout({ onNavigate, clearCart }: CheckoutProps) {
  // Input fields
  const [name, setName] = useState('Jane Doe');
  const [phone, setPhone] = useState('+1 (555) 012-3456');
  const [street, setStreet] = useState('123 Farmview Lane');
  const [city, setCity] = useState('Greenfield');
  const [state, setState] = useState('CA');
  const [zip, setZip] = useState('90210');

  // Schedule States
  const [selectedDay, setSelectedDay] = useState('tomorrow');
  const [selectedTime, setSelectedTime] = useState('morning');

  // Payment State
  const [paymentSaved, setPaymentSaved] = useState(true);

  // Success dialog/state
  const [orderPlaced, setOrderPlaced] = useState(false);

  const days = [
    { id: 'tomorrow', label: 'Tomorrow', date: 'Oct 24' },
    { id: 'friday', label: 'Friday', date: 'Oct 25' },
    { id: 'saturday', label: 'Saturday', date: 'Oct 26' },
    { id: 'monday', label: 'Monday', date: 'Oct 28' },
  ];

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    setTimeout(() => {
      clearCart();
      onNavigate('delivery-note');
    }, 2500);
  };

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
          <h2 className="text-2xl font-bold text-[#144227]">Placing Your Order...</h2>
          <p className="text-xs text-[#717971]">
            We are confirming details with Greenfield local suppliers. Sending you to the Delivery Note Confirmation...
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white text-[#1c1c18] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white text-[#1c1c18] font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Street Address</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white text-[#1c1c18] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white text-[#1c1c18] font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white text-[#1c1c18] font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Zip Code</label>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white text-[#1c1c18] font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Schedule */}
            <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-[#f0eee7] pb-3 text-[#144227]">
                <Clock size={18} />
                <h2 className="text-sm font-bold text-[#1c1c18]">Delivery Schedule</h2>
              </div>

              {/* Day Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {days.map((day) => {
                  const isSelected = selectedDay === day.id;
                  return (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDay(day.id)}
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
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        selectedTime === 'morning' ? 'border-[#144227] bg-[#144227]' : 'border-[#c1c9c0] group-hover:border-[#144227]'
                      }`}>
                        {selectedTime === 'morning' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
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
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        selectedTime === 'afternoon' ? 'border-[#144227] bg-[#144227]' : 'border-[#c1c9c0] group-hover:border-[#144227]'
                      }`}>
                        {selectedTime === 'afternoon' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-xs font-bold text-[#1c1c18]">Afternoon (1:00 PM - 5:00 PM)</span>
                    </div>
                    <span className="text-[9px] font-bold tracking-wider bg-[#f0eee7] text-[#414942] px-2 py-0.5 rounded-full uppercase">$5.00</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-[#f0eee7] pb-3 text-[#144227]">
                <CreditCard size={18} />
                <h2 className="text-sm font-bold text-[#1c1c18]">Payment Method</h2>
              </div>

              <div className="space-y-4">
                {paymentSaved ? (
                  <div className="bg-[#bceec8]/30 border border-[#bceec8] rounded-xl px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white border border-[#c1c9c0] rounded-lg text-[#144227] font-bold text-xs shadow-sm tracking-widest">
                        VISA
                      </div>
                      <div>
                        <span className="block text-xs font-extrabold text-[#1c1c18]">•••• •••• •••• 4242</span>
                        <span className="block text-[9px] text-[#717971] uppercase mt-0.5 font-bold">Expires 12/26</span>
                      </div>
                    </div>
                    <button
                      onClick={() => alert("Edit payment mode details...")}
                      className="text-xs font-bold text-[#144227] hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-[#717971] italic text-center py-4">No active payment methods.</div>
                )}

                <button
                  onClick={() => alert("Add payment modal...")}
                  className="w-full py-4 border-2 border-dashed border-[#c1c9c0] hover:border-[#144227] rounded-xl text-center text-xs font-bold text-[#414942] hover:text-[#144227] transition-all cursor-pointer bg-white"
                >
                  + Add New Payment Method
                </button>
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
                
                {/* Item 1 */}
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#f6f3ec] rounded-lg overflow-hidden flex-shrink-0">
                      <img src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&q=80" alt="Fuji Apples" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#1c1c18]">Organic Fuji Apples</span>
                      <span className="block text-[10px] text-[#717971] mt-0.5">Qty: 2 lbs</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#1c1c18]">$8.50</span>
                </div>

                {/* Item 2 */}
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#f6f3ec] rounded-lg overflow-hidden flex-shrink-0">
                      <img src="https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&q=80" alt="Kale" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#1c1c18]">Lacinato Kale</span>
                      <span className="block text-[10px] text-[#717971] mt-0.5">Qty: 1 Bunch</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#1c1c18]">$3.75</span>
                </div>

              </div>

              {/* Calculations */}
              <div className="border-t border-[#f0eee7] pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#414942]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#1c1c18]">$12.25</span>
                </div>
                <div className="flex justify-between text-[#414942]">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-[#376847]">FREE</span>
                </div>
                <div className="flex justify-between text-[#414942]">
                  <span>Estimated Tax</span>
                  <span className="font-bold text-[#1c1c18]">$0.98</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="border-t border-[#f0eee7] pt-4 flex justify-between text-sm font-extrabold text-[#1c1c18]">
                <span>Total</span>
                <span className="text-[#144227] text-lg">$13.23</span>
              </div>

              {/* Order Button */}
              <button
                onClick={handlePlaceOrder}
                className="w-full bg-[#144227] text-white py-3.5 rounded-xl font-bold text-xs hover:bg-[#376847] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:shadow-lg mt-2"
              >
                Place Your Order <ArrowRight size={16} />
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
                  Your order supports <span className="font-bold text-[#144227]">3 local family farms</span> in the Greenfield valley.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
