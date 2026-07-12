"use client";

import { useState } from 'react';
import { ChevronRight, Heart, ShoppingCart, MessageSquare, Plus, Minus, ArrowLeft, Send } from 'lucide-react';

interface ProductDetailProps {
  onNavigate: (screen: string) => void;
  addToCart: () => void;
}

export default function ProductDetail({ onNavigate, addToCart }: ProductDetailProps) {
  const [qty, setQty] = useState(5);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [negotiationInput, setNegotiationInput] = useState('4.15');

  // Images list
  const images = [
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80', // main
    'https://images.unsplash.com/photo-1595855759920-86582396756a?w=800&q=80', // slice
    'https://images.unsplash.com/photo-1561131248-c52d88656e17?w=800&q=80', // basket
    'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=800&q=80', // vine
    'https://images.unsplash.com/photo-1607305387299-a3d9611cd46f?w=800&q=80'  // multi
  ];

  // Negotiation log
  const [negotiations, setNegotiations] = useState([
    {
      id: 'msg1',
      sender: 'user',
      text: 'My Offer: $4.00/lb. Ordering 100 lbs for the local gala. Can we do a volume discount?',
      time: '10:42 AM',
      name: 'Arthur (You)'
    },
    {
      id: 'msg2',
      sender: 'farmer',
      text: 'Counter: $4.25/lb -$0.25 delta. We appreciate the bulk order. $4.25 is our best price for this week\'s harvest.',
      time: '11:15 AM',
      name: 'Farmer Jo (Green Valley Farms)'
    }
  ]);

  const [isFarmerReplying, setIsFarmerReplying] = useState(false);

  const handlePropose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiationInput.trim()) return;

    const offerVal = parseFloat(negotiationInput);
    if (isNaN(offerVal)) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: `Propose Offer: $${offerVal.toFixed(2)}/lb. Quantities locked for 500 lbs contract.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      name: 'Arthur (You)'
    };

    setNegotiations((prev) => [...prev, newMsg]);
    setNegotiationInput('');

    // Simulate farmer reply
    setIsFarmerReplying(true);
    setTimeout(() => {
      let replyText = '';
      if (offerVal >= 4.20) {
        replyText = `Deal! I accept $${offerVal.toFixed(2)}/lb. Locking in the price for your 500 lbs order. Thank you!`;
      } else if (offerVal < 4.10) {
        replyText = `Counter: $4.20/lb. We cannot go below $4.20 for the heirloom variety, as it is hand-picked daily.`;
      } else {
        replyText = `Counter: $4.18/lb. Let's split the difference at $4.18/lb. How does that sound?`;
      }

      setNegotiations((prev) => [
        ...prev,
        {
          id: `msg-reply-${Date.now()}`,
          sender: 'farmer',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          name: 'Farmer Jo (Green Valley Farms)'
        }
      ]);
      setIsFarmerReplying(false);
    }, 1500);
  };

  const related = [
    {
      id: 'basil',
      badge: 'FRESH PICK',
      badgeColor: 'bg-[#bceec8] text-[#00210f]',
      name: 'Sweet Genovese Basil',
      farm: 'Green Valley Farms',
      price: '$3.00/bunch',
      img: 'https://images.unsplash.com/photo-1608797178974-15b35a61d121?w=400&q=80'
    },
    {
      id: 'cherries-small',
      badge: 'BULK OFFER',
      badgeColor: 'bg-[#ffdcc5] text-[#301400]',
      name: 'Sun-Sugar Cherries',
      farm: 'Mountain Peak Produce',
      price: '$5.50/pint',
      img: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80'
    },
    {
      id: 'shallots',
      badge: null,
      name: 'Red Ember Shallots',
      farm: 'Green Valley Farms',
      price: '$2.75/lb',
      img: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&q=80'
    },
    {
      id: 'cucumbers',
      badge: null,
      name: 'Seedless Cucumbers',
      farm: 'Riverbend Organics',
      price: '$1.50/ea',
      img: 'https://images.unsplash.com/photo-1604928141064-207ec6696804?w=400&q=80'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      
      {/* Navigation Breadcrumb */}
      <div className="text-xs text-[#717971] flex items-center gap-1.5">
        <button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors flex items-center gap-1 cursor-pointer">
          <ArrowLeft size={12} /> Marketplace
        </button>
        <ChevronRight size={12} />
        <button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors cursor-pointer">Vegetables</button>
        <ChevronRight size={12} />
        <span className="text-[#1c1c18] font-bold">Vine-Ripened Heirloom Tomatoes</span>
      </div>

      {/* Main product columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Image viewer */}
        <div className="space-y-4">
          <div className="w-full aspect-[4/3] bg-[#f6f3ec] rounded-2xl overflow-hidden border border-[#e5e2db] shadow-sm">
            <img
              src={images[activeImgIndex]}
              alt="Heirloom Tomato"
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          </div>

          {/* Thumbnails row */}
          <div className="grid grid-cols-5 gap-2.5">
            {images.map((img, index) => (
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
        </div>

        {/* Right Column: Info & Negotiation */}
        <div className="space-y-6">
          
          {/* Brand header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-[#bceec8] text-[#00210f] text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#376847] rounded-full"></span>
                Green Valley Farms • 4.9 ★
              </span>
            </div>
            
            <h1 className="text-3xl font-extrabold text-[#144227] leading-tight">
              Vine-Ripened Heirloom Tomatoes
            </h1>
            
            <p className="text-sm text-[#414942] leading-relaxed">
              Premium multi-colored varieties harvested daily at peak sweetness. Non-GMO, sustainably grown in rich mountain soil.
            </p>

            <div className="flex items-center gap-4 pt-1">
              <div className="text-2xl font-black text-[#1c1c18]">$4.50 <span className="text-xs font-bold text-[#717971]">per lb</span></div>
              <span className="bg-[#ffdcc5] text-[#301400] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <MessageSquare size={10} /> Bargainable
              </span>
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
              onClick={addToCart}
              className="flex-grow bg-[#144227] text-white py-3.5 px-6 rounded-xl font-bold text-xs hover:bg-[#376847] flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer hover:shadow-lg"
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>
          </div>

          {/* Price Negotiation Panel */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl shadow-sm overflow-hidden mt-6">
            <div className="bg-[#f6f3ec]/60 px-5 py-3 border-b border-[#e5e2db] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1c1c18] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} className="text-[#144227]" /> Price Negotiation
              </span>
              <span className="bg-[#bceec8] text-[#00210f] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                Active Offer
              </span>
            </div>

            {/* Negotiation Log */}
            <div className="p-4 space-y-4 max-h-56 overflow-y-auto custom-scrollbar bg-[#fcf9f2]/30">
              {negotiations.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className="text-[9px] font-bold text-[#717971] mb-1 px-1">{msg.name}</div>
                    <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-[#144227] text-white rounded-tr-none'
                        : 'bg-white border border-[#e5e2db] text-[#1c1c18] rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <div className="text-[8px] text-[#717971] mt-1 px-1">{msg.time}</div>
                  </div>
                );
              })}

              {isFarmerReplying && (
                <div className="flex flex-col items-start animate-pulse">
                  <div className="text-[9px] font-bold text-[#717971] mb-1 px-1">Farmer Jo is typing...</div>
                  <div className="p-3 bg-white border border-[#e5e2db] text-[#717971] rounded-2xl rounded-tl-none text-xs">
                    Reviewing offer details...
                  </div>
                </div>
              )}
            </div>

            {/* Form Propose */}
            <form onSubmit={handlePropose} className="border-t border-[#e5e2db] p-3 flex gap-2 bg-white">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-[#717971]">
                  $
                </span>
                <input
                  type="text"
                  value={negotiationInput}
                  onChange={(e) => setNegotiationInput(e.target.value)}
                  placeholder="Propose different price..."
                  className="w-full pl-6 pr-3 py-2 bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg text-xs font-semibold text-[#1c1c18] focus:outline-none focus:border-[#144227] focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                className="bg-[#376847] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#144227] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Propose <Send size={12} />
              </button>
            </form>

            <div className="bg-[#f2efe7]/50 border-t border-[#e5e2db] px-4 py-2 text-[9px] text-[#717971] font-semibold text-center">
              Typical acceptance rate for delta &lt; 5%: <span className="text-[#376847] font-bold">High</span>
            </div>
          </div>

        </div>
      </div>

      {/* From the Same Harvest Section */}
      <div className="border-t border-[#e5e2db] pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1c1c18]">From the Same Harvest</h2>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full border border-[#c1c9c0] hover:border-[#144227] flex items-center justify-center text-[#414942] hover:bg-white transition-all cursor-pointer">
              ←
            </button>
            <button className="w-8 h-8 rounded-full border border-[#c1c9c0] hover:border-[#144227] flex items-center justify-center text-[#414942] hover:bg-white transition-all cursor-pointer">
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {related.map((prod) => (
            <div
              key={prod.id}
              onClick={() => {
                setActiveImgIndex(0);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-white border border-[#e5e2db] rounded-xl p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div>
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#f6f3ec] relative">
                  <img src={prod.img} alt={prod.name} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                  {prod.badge && (
                    <span className={`absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${prod.badgeColor}`}>
                      {prod.badge}
                    </span>
                  )}
                </div>
                <p className="text-[8px] font-bold tracking-wider text-[#717971] mt-2.5 uppercase">{prod.farm}</p>
                <h3 className="text-xs font-bold text-[#1c1c18] mt-0.5 line-clamp-1 group-hover:text-[#144227] transition-colors">{prod.name}</h3>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f0eee7]">
                <span className="text-xs font-bold text-[#414942]">{prod.price}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart();
                  }}
                  className="bg-[#144227] text-white p-1.5 rounded-full hover:bg-[#376847] transition-colors cursor-pointer animate-fadeIn"
                >
                  <ShoppingCart size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
