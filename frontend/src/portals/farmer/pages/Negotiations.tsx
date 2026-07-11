"use client";

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Send, CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiRequest } from '../lib/api';

export default function Negotiations() {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeNegId, setActiveNegId] = useState<string | null>(null);
  const [showListMobile, setShowListMobile] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [counterPrice, setCounterPrice] = useState("8.40");
  const [counterQty, setCounterQty] = useState("500");

  const loadNegotiations = async () => {
    try {
      const data = await apiRequest("/api/negotiations/threads/");
      setThreads(data);
      if (data.length > 0 && !activeNegId) {
        setActiveNegId(data[0].id.toString());
      }
    } catch (err) {
      console.error("Error loading negotiations:", err);
      // Mock fallback
      const fallbackThreads = [
        {
          id: 1,
          status: "open",
          price: "8.50",
          supply_detail: {
            id: 4,
            quantity: 500,
            unit: "kg",
            proposed_price: 9.00,
            status: "negotiating",
            product_detail: {
              name: "Organic Bing Cherries",
              image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDjW4LDDg9AP70u42NvTwegX0aSJNLRjt9qSwBllNwb_diw_nxtuUDtN-TcdUiA3ivCMjbYnGmgv5-wkvLzRGpmqY8xMZu-ylv5QfnxZlHwCRKBpiG5A8G9Ta0OiugntBsGuXZSmsbtb8KEUNEHV73RMwY1zZYbedheJuxMoFEmJpM5ARItKv04bj7gtmOHuBXHviExa4vDOX-yw21yRwq616WxnlapT2173nuHbJEKQ9VghPugmqtBg",
              category: "Fruits",
              unit: "kg"
            }
          },
          offers: [
            { id: 1, sender: "farmer", price: 9.00, quantity: 500, created_at: "2023-10-24T10:00:00Z" },
            { id: 2, sender: "admin", price: 8.20, quantity: 500, created_at: "2023-10-24T10:05:00Z" },
            { id: 3, sender: "farmer", price: 8.50, quantity: 500, created_at: "2023-10-24T10:10:00Z" },
            { id: 4, sender: "admin", price: 8.35, quantity: 500, created_at: "2023-10-24T10:15:00Z" }
          ]
        }
      ];
      setThreads(fallbackThreads);
      setActiveNegId("1");
    }
  };

  useEffect(() => {
    loadNegotiations();
  }, []);

  const activeThread = threads.find(t => t.id.toString() === activeNegId) || threads[0];
  const getThreadPrice = (thread: any) => {
    const lastOffer = thread?.offers?.[thread.offers.length - 1];
    return lastOffer?.price ?? thread?.supply_detail?.proposed_price ?? 0;
  };

  const handleSendOffer = async () => {
    if (!activeThread) return;
    try {
      await apiRequest(`/api/negotiations/threads/${activeThread.id}/offer/`, {
        method: "POST",
        body: JSON.stringify({
          price: parseFloat(counterPrice),
          quantity: parseFloat(counterQty)
        })
      });
      loadNegotiations();
    } catch (err) {
      console.error("Error sending offer:", err);
    }
  };

  const handleAccept = async () => {
    if (!activeThread) return;
    try {
      await apiRequest(`/api/negotiations/threads/${activeThread.id}/accept/`, {
        method: "POST"
      });
      loadNegotiations();
    } catch (err) {
      console.error("Error accepting offer:", err);
    }
  };

  // Map thread offers to chat format
  const chatHistory = activeThread?.offers?.map((offer: any) => ({
    sender: offer.sender === 'farmer' ? 'SELLER' : 'BUYER',
    initials: offer.sender === 'farmer' ? 'HH' : 'WF',
    text: offer.sender === 'farmer' 
      ? `Farmer counter-offered price: $${offer.price}/kg for ${offer.quantity} kg.`
      : `Industry proposed price: $${offer.price}/kg for ${offer.quantity} kg.`,
    price: `$${offer.price}/kg`,
    change: offer.sender === 'admin' ? '-1.7% from last' : undefined,
    time: new Date(offer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })) || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col lg:flex-row h-[calc(100vh-144px)] lg:h-[calc(100vh-64px)] overflow-hidden"
    >
      {/* Active Deal Selector Bar for Mobile */}
      {activeThread && (
        <div className="lg:hidden bg-surface-container-low border-b border-outline-variant p-3 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[9px] font-bold text-on-surface-variant uppercase tracking-widest shrink-0">Deal:</span>
            <span className="font-sans text-xs font-bold text-primary truncate">{activeThread.supply_detail?.product_detail?.name}</span>
          </div>
          <button 
            onClick={() => setShowListMobile(!showListMobile)}
            className="font-mono text-[9px] text-primary uppercase font-bold flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors shrink-0"
          >
            {showListMobile ? "Close List" : "Switch Deal"}
          </button>
        </div>
      )}

      {/* Left List */}
      <aside className={cn(
        "w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-outline-variant bg-surface-container-low overflow-y-auto custom-scrollbar transition-all duration-300",
        showListMobile ? "max-h-[250px] opacity-100" : "max-h-0 lg:max-h-none opacity-0 lg:opacity-100 overflow-hidden"
      )}>
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-1 focus:ring-primary focus:border-primary font-sans text-sm transition-all" 
              placeholder="Search negotiations..." 
              type="text"
            />
          </div>

          <div className="space-y-2">
            {threads.map((neg) => (
              <div 
                key={neg.id}
                onClick={() => {
                  setActiveNegId(neg.id.toString());
                  setShowListMobile(false);
                }}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all duration-300",
                  neg.id.toString() === activeNegId
                    ? "bg-surface-container-lowest border-primary custom-shadow" 
                    : "bg-transparent border-transparent hover:bg-surface-container-high"
                )}
              >
                <div className="flex gap-4 mb-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-outline-variant">
                    <img src={neg.supply_detail?.product_detail?.image} alt={neg.supply_detail?.product_detail?.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={cn("font-sans text-sm font-bold truncate", neg.id.toString() === activeNegId ? "text-primary" : "text-on-surface")}>
                      {neg.supply_detail?.product_detail?.name}
                    </h3>
                    <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">
                      #{neg.supply_detail?.id} - {neg.supply_detail?.quantity} {neg.supply_detail?.unit}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-primary">${getThreadPrice(neg)}/kg</span>
                  <span className={cn(
                    "px-2 py-1 rounded-full font-mono text-[8px] uppercase font-bold tracking-wider",
                    neg.status === 'open' ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-surface-container-highest text-on-surface-variant"
                  )}>
                    {neg.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat */}
      <section className="flex-1 flex flex-col bg-surface relative overflow-hidden min-w-0">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between flex-shrink-0">
          <div>
            <h4 className="font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Market Context</h4>
            <div className="flex items-center gap-3">
              <span className="font-sans text-xl font-extrabold text-primary">$8.24</span>
              <span className="flex items-center text-secondary font-bold font-mono text-[10px] uppercase">
                <TrendingUp size={14} className="mr-1" />
                +2.4% vs last week
              </span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-10">
            {[40, 55, 50, 70, 65, 85, 100].map((h, i) => (
              <div 
                key={i} 
                style={{ height: `${h}%` }} 
                className={cn("w-2 rounded-t-sm transition-all duration-500", i === 6 ? "bg-primary" : "bg-secondary-container")} 
              />
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-background custom-scrollbar">
          <div className="flex justify-center">
            <span className="px-4 py-1 bg-surface-container-high rounded-full font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Offer Timeline</span>
          </div>

          {chatHistory.map((msg: any, i: number) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: msg.sender === 'BUYER' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn("flex items-start gap-3 sm:gap-4 max-w-[90%] sm:max-w-xl", msg.sender === 'SELLER' && "ml-auto flex-row-reverse")}
            >
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 font-bold font-sans text-xs sm:text-sm",
                msg.sender === 'BUYER' ? "bg-secondary text-on-secondary" : "bg-primary text-on-primary"
              )}>
                {msg.initials}
              </div>
              <div className={cn(
                "relative p-3 sm:p-4 rounded-2xl custom-shadow border",
                msg.sender === 'BUYER' 
                  ? "bg-white border-outline-variant rounded-tl-none" 
                  : "bg-primary-container border-primary text-white rounded-tr-none"
              )}>
                <p className="font-sans text-xs sm:text-sm leading-relaxed">{msg.text}</p>
                {msg.price && (
                  <div className={cn(
                    "flex items-center gap-6 pt-3 mt-3 border-t",
                    msg.sender === 'BUYER' ? "border-outline-variant" : "border-white/20"
                  )}>
                    <div>
                      <p className={cn("font-mono text-[8px] sm:text-[9px] uppercase tracking-widest mb-0.5 opacity-70")}>Price</p>
                      <p className="font-sans text-base sm:text-lg font-bold">{msg.price}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        {activeThread?.status === 'open' && (
          <div className="p-3 sm:p-5 bg-surface-container-lowest border-t border-outline-variant flex-shrink-0 space-y-3 sm:space-y-4">
            {/* Chat Message Input */}
            <div className="flex gap-2">
              <input 
                className="flex-grow px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg sm:rounded-xl focus:ring-1 focus:ring-primary outline-none font-sans text-xs sm:text-sm" 
                placeholder="Type your message here..." 
                type="text" 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <button className="px-4 bg-secondary text-on-secondary rounded-lg sm:rounded-xl font-bold font-sans text-xs sm:text-sm flex items-center justify-center gap-1 hover:opacity-90 active:scale-[0.98] transition-all shrink-0">
                <Send size={14} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block">Propose New Terms</label>
                <div className="flex gap-2 sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-xs">$</span>
                      <input 
                        className="w-full pl-8 pr-2 py-1.5 sm:py-2.5 bg-surface-container-low border border-outline-variant rounded-lg sm:rounded-xl focus:ring-1 focus:ring-primary outline-none font-sans font-bold text-xs sm:text-sm" 
                        type="number" 
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                      />
                    </div>
                    <p className="mt-0.5 font-mono text-[8px] sm:text-[9px] text-on-surface-variant uppercase">Price / kg</p>
                  </div>
                  <div className="flex-1">
                    <input 
                      className="w-full px-3 py-1.5 sm:py-2.5 bg-surface-container-low border border-outline-variant rounded-lg sm:rounded-xl focus:ring-1 focus:ring-primary outline-none font-sans font-bold text-xs sm:text-sm" 
                      type="number" 
                      value={counterQty}
                      onChange={(e) => setCounterQty(e.target.value)}
                    />
                    <p className="mt-0.5 font-mono text-[8px] sm:text-[9px] text-on-surface-variant uppercase">Qty (kg)</p>
                  </div>
                </div>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleSendOffer}
                  className="w-full h-9 sm:h-11 md:h-12 px-4 bg-primary text-on-primary rounded-lg sm:rounded-xl font-bold font-sans text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-md sm:shadow-lg"
                >
                  <Send size={14} className="sm:size-[18px]" />
                  Send Offer
                </button>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <button 
                onClick={handleAccept}
                className="flex-1 h-9 sm:h-11 md:h-12 bg-secondary-container text-on-secondary-container border border-secondary rounded-lg sm:rounded-xl font-bold font-sans text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-3 hover:bg-secondary-container/80 transition-all active:scale-[0.98]"
              >
                <CheckCircle2 size={14} className="sm:size-[18px]" />
                Accept Offer
              </button>
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
}
