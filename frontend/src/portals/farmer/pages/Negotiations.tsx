"use client";

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Send, CheckCircle2, TrendingUp, Handshake, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiRequest, api } from '../lib/api';
import { useAlert } from '../../../context/AlertContext';

export default function Negotiations() {
  const { toast, showConfirm } = useAlert();
  const [threads, setThreads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNegId, setActiveNegId] = useState<string | null>(null);
  const [showListMobile, setShowListMobile] = useState(false);
  const [counterMessage, setCounterMessage] = useState("");
  const [counterPrice, setCounterPrice] = useState("");
  const [counterQty, setCounterQty] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const formatRwf = (val: any) => {
    if (val === null || val === undefined || val === '') return 'RWF 0';
    let num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return 'RWF 0';
    if (num > 0 && num < 100) {
      num = Math.round(num * 1473.97);
    }
    return `RWF ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editMsg, setEditMsg] = useState('');

  const handleDeleteNegotiation = async (threadId: number) => {
    const confirmed = await showConfirm(
      "Delete Negotiation",
      "Are you sure you want to delete this negotiation? This will reset all proposed terms."
    );
    if (!confirmed) return;
    try {
      await apiRequest(`/api/negotiations/threads/${threadId}/`, {
        method: 'DELETE'
      });
      setActiveNegId(null);
      loadNegotiations();
      toast("Negotiation deleted successfully.", "success");
    } catch (err) {
      console.error("Failed to delete negotiation:", err);
    }
  };

  const handleEditOfferSubmit = async (threadId: number, offerId: number) => {
    try {
      await apiRequest(`/api/negotiations/threads/${threadId}/edit_offer/`, {
        method: 'POST',
        body: JSON.stringify({
          offer_id: offerId,
          price: parseFloat(editPrice),
          quantity: parseFloat(editQty),
          message: editMsg
        })
      });
      setEditingOfferId(null);
      loadNegotiations();
      toast("Offer updated successfully!", "success");
    } catch (err) {
      console.error("Failed to update offer:", err);
      toast("Failed to update offer.", "error");
    }
  };

  const loadNegotiations = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("/api/negotiations/threads/");
      setThreads(data || []);
      if ((data || []).length > 0 && !activeNegId) {
        setActiveNegId(data[0].id.toString());
      }
    } catch (err) {
      console.error("Error loading negotiations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNegotiations();
  }, []);

  const activeThread = threads.find(t => t.id.toString() === activeNegId) || threads[0];

  useEffect(() => {
    if (activeThread?.supply_detail) {
      const supply = activeThread.supply_detail;
      const targetQty = supply.accepted_quantity !== null && supply.accepted_quantity !== undefined 
        ? supply.accepted_quantity 
        : supply.quantity;
      const targetPrice = supply.agreed_price !== null && supply.agreed_price !== undefined
        ? supply.agreed_price
        : (supply.proposed_price || supply.price || 0);

      let normPrice = Number(targetPrice);
      if (normPrice > 0 && normPrice < 100) {
        normPrice = Math.round(normPrice * 1473.97);
      }
      setCounterPrice(normPrice ? String(normPrice) : '');
      setCounterQty(targetQty ? String(targetQty) : '');
    }
  }, [activeNegId, activeThread?.supply_detail?.accepted_quantity, activeThread?.supply_detail?.agreed_price]);

  const getOriginalFarmerPrice = (thread: any) => {
    return thread?.supply_detail?.proposed_price ?? thread?.supply_detail?.price ?? 0;
  };

  const handleDeleteOffer = async (offerId: string | number) => {
    if (!activeThread) return;
    const confirmed = await showConfirm("Delete Negotiation Term", "Are you sure you want to delete this negotiation term?");
    if (!confirmed) return;
    try {
      await api.negotiations.deleteOffer(activeThread.id, offerId);
      toast("Negotiation term deleted.", "success");
      loadNegotiations();
    } catch (err: any) {
      toast(err.message || "Failed to delete term.", "error");
    }
  };

  const handleSendOffer = async () => {
    if (!activeThread) return;
    const parsedPrice = parseFloat(counterPrice);
    const parsedQty = parseFloat(counterQty);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast("Please enter a valid counter price.", "warning");
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast("Please enter a valid counter quantity.", "warning");
      return;
    }
    try {
      await apiRequest(`/api/negotiations/threads/${activeThread.id}/offer/`, {
        method: "POST",
        body: JSON.stringify({
          price: parsedPrice,
          quantity: parsedQty,
          message: counterMessage
        })
      });
      setCounterMessage("");
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
  const chatHistory = activeThread?.offers?.map((offer: any) => {
    const isFarmerSender = offer.sender === 'farmer' || offer.sender_role === 'farmer';
    const isClientSender = offer.sender === 'client' || offer.sender_role === 'client';
    const initials = isFarmerSender ? 'FM' : (isClientSender ? 'CL' : 'HH');
    const senderRoleLabel = isFarmerSender ? 'Farmer' : (isClientSender ? 'Client' : 'Harvest Hill Delivery');
    const isOffer = offer.is_offer !== false;

    return {
      id: offer.id,
      sender: isFarmerSender ? 'SELLER' : 'BUYER',
      initials,
      is_offer: isOffer,
      text: offer.message || (isOffer 
        ? `${senderRoleLabel} proposed negotiation terms`
        : ''),
      price: isOffer ? `${formatRwf(offer.price)} / ${activeThread?.supply_detail?.unit || 'kg'}` : null,
      raw_price: offer.price,
      quantity: offer.quantity,
      message: offer.message,
      time: offer.created_at ? new Date(offer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
    };
  }) || [];

  const filteredThreads = threads.filter((neg: any) => {
    const name = String(neg.supply_detail?.product_detail?.name || '').toLowerCase();
    const idStr = String(neg.supply_detail?.id || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || idStr.includes(query);
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col lg:flex-row h-full overflow-hidden"
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-outline-variant animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-surface-container-high rounded w-3/4" />
                      <div className="h-2 bg-surface-container-high rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredThreads.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-surface-container mx-auto flex items-center justify-center mb-3">
                  <Handshake size={18} className="text-outline" />
                </div>
                <p className="font-sans text-xs font-bold text-on-surface-variant">No negotiations yet</p>
                <p className="font-mono text-[9px] text-on-surface-variant/70 mt-1">Submit a harvest to start one</p>
              </div>
            ) : filteredThreads.map((neg) => {
              const displaySupplyId = neg.supply_detail?.supply_number || neg.supply_detail?.supplyNumber || (neg.supply_detail?.id ? (isNaN(Number(neg.supply_detail.id)) ? 'SUP-000001' : `SUP-${String(neg.supply_detail.id).padStart(6, '0')}`) : 'SUP-000001');

              return (
                <div 
                  key={neg.id}
                  onClick={() => {
                    setActiveNegId(neg.id.toString());
                    setShowListMobile(false);
                  }}
                  className={cn(
                    "p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 group relative font-sans space-y-2.5",
                    neg.id.toString() === activeNegId
                      ? "bg-white border-[#2D5A3D] ring-2 ring-[#2D5A3D]/15 shadow-sm" 
                      : "bg-white/80 border-[#E8E4DA] hover:border-[#2D5A3D]/40 hover:bg-white"
                  )}
                >
                  {/* Top Row: Sequential Supply ID & Status Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[9.5px] font-black text-[#2D5A3D] bg-[#FAF7F0] px-2 py-0.5 rounded-md border border-[#E8E4DA] tracking-wider uppercase">
                      {displaySupplyId}
                    </span>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full font-mono text-[8.5px] uppercase font-black tracking-wider border shadow-2xs",
                      neg.status === 'open' || neg.status === 'pending'
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-emerald-100 text-emerald-900 border-emerald-300"
                    )}>
                      {neg.status || 'Active'}
                    </span>
                  </div>

                  {/* Crop Name & Category */}
                  <div>
                    <h3 className={cn(
                      "font-extrabold text-sm leading-snug group-hover:text-[#2D5A3D] transition-colors break-words",
                      neg.id.toString() === activeNegId ? "text-[#1C2A1E]" : "text-[#2C3E30]"
                    )}>
                      {neg.supply_detail?.product_detail?.name || neg.supply_detail?.custom_product_name || 'Harvest Supply'}
                    </h3>
                    <p className="text-[10.5px] font-bold text-[#717971] mt-0.5">
                      Category: <span className="text-[#1C2A1E] font-extrabold">{neg.supply_detail?.product_detail?.category || neg.supply_detail?.custom_category || 'Vegetables'}</span>
                    </p>
                  </div>

                  {/* Quantity & Proposed Price Specs */}
                  <div className="flex justify-between items-center pt-2 border-t border-[#F0ECE1] text-xs">
                    <div>
                      <span className="text-[9px] font-extrabold text-[#717971] uppercase tracking-wider block">Quantity</span>
                      <span className="font-extrabold text-[#1C2A1E]">
                        {neg.supply_detail?.quantity} {neg.supply_detail?.unit || 'kg'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-extrabold text-[#717971] uppercase tracking-wider block">Proposed Price</span>
                      <span className="font-extrabold text-[#2D5A3D]">
                        {formatRwf(getOriginalFarmerPrice(neg))}/{neg.supply_detail?.unit || 'kg'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Chat */}
      <section className="flex-1 flex flex-col bg-surface relative overflow-hidden min-w-0">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between flex-shrink-0">
          <div>
            <h4 className="font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              {activeThread ? `Market Context: ${activeThread.supply_detail?.product_detail?.name || 'Product'}` : 'Market Context'}
            </h4>
          </div>
          <div className="flex items-center gap-4">
            {activeThread && (
              <button 
                onClick={() => handleDeleteNegotiation(activeThread.id)}
                className="text-red-600 hover:text-red-700 font-bold font-sans text-xs underline cursor-pointer"
              >
                Delete Chat
              </button>
            )}
            <div className="flex items-end gap-1 h-10">
              {activeThread ? (
                [40, 55, 50, 70, 65, 85, 100].map((h, i) => (
                  <div 
                    key={i} 
                    style={{ height: `${h}%` }} 
                    className={cn("w-2 rounded-t-sm transition-all duration-500", i === 6 ? "bg-primary" : "bg-secondary-container")} 
                  />
                ))
              ) : (
                [10, 10, 10, 10, 10, 10, 10].map((h, i) => (
                  <div 
                    key={i} 
                    style={{ height: `${h}%` }} 
                    className="w-2 rounded-t-sm bg-surface-container-high transition-all" 
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {!activeThread ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
              <Handshake size={28} className="text-outline" />
            </div>
            <p className="font-sans text-sm font-bold text-on-surface">
              {isLoading ? 'Loading negotiations...' : 'No active negotiations'}
            </p>
            <p className="font-sans text-xs text-on-surface-variant max-w-xs">
              {isLoading
                ? 'Fetching your negotiation threads from the server.'
                : 'When you submit a harvest and Harvest Hill opens a negotiation, it will appear here.'}
            </p>
          </div>
        ) : (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-background custom-scrollbar">
          <div className="flex justify-center">
            <span className="px-4 py-1 bg-surface-container-high rounded-full font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Offer Timeline</span>
          </div>

          {chatHistory.map((msg: any, i: number) => {
            const isMe = msg.sender === 'SELLER';
            const isEditingThis = editingOfferId === msg.id;

            if (isEditingThis) {
              return (
                <div key={i} className={cn("flex items-start gap-3 sm:gap-4 max-w-[90%] sm:max-w-xl", isMe && "ml-auto flex-row-reverse")}>
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 font-bold font-sans text-xs sm:text-sm bg-primary text-on-primary"
                  )}>
                    {msg.initials}
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-outline-variant space-y-2 w-full custom-shadow">
                    <div>
                      <label className="block text-[8px] uppercase tracking-wider font-bold mb-0.5 text-primary">Price</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={editPrice} 
                        onChange={(e) => setEditPrice(e.target.value)} 
                        className="w-full px-2 py-1 border rounded text-xs outline-none font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-wider font-bold mb-0.5 text-primary">Quantity</label>
                      <input 
                        type="number" 
                        value={editQty} 
                        onChange={(e) => setEditQty(e.target.value)} 
                        className="w-full px-2 py-1 border rounded text-xs outline-none font-bold" 
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
                    {(() => {
                      const isOfferDirty = (
                        String(editPrice) !== String(msg.raw_price || '') ||
                        String(editQty) !== String(msg.quantity || '') ||
                        String(editMsg) !== String(msg.message || '')
                      );

                      return (
                        <div className="flex gap-2 justify-end pt-1">
                          <button onClick={() => setEditingOfferId(null)} className="px-2.5 py-1 text-[10px] border rounded hover:bg-surface-container-low cursor-pointer">Cancel</button>
                          <button 
                            onClick={() => handleEditOfferSubmit(activeThread.id, msg.id)} 
                            disabled={!isOfferDirty}
                            className="px-2.5 py-1 text-[10px] bg-[#144227] text-white rounded hover:opacity-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={!isOfferDirty ? "No changes made to offer" : "Save offer changes"}
                          >
                            Save
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            }

            return (
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
                  "relative group p-3 sm:p-4 rounded-2xl custom-shadow border",
                  msg.sender === 'BUYER' 
                    ? "bg-white border-outline-variant rounded-tl-none text-on-surface" 
                    : "bg-primary-container border-primary text-white rounded-tr-none"
                )}>
                  {/* Hover Trash Delete Option for Negotiation Terms */}
                  {activeThread.status !== 'accepted' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteOffer(msg.id)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-30 p-1.5 rounded-full shadow-md cursor-pointer border",
                        msg.sender === 'BUYER' 
                          ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" 
                          : "bg-red-900/90 text-red-100 border-red-700 hover:bg-red-950"
                      )}
                      title="Delete negotiation term"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <p className="font-sans text-xs sm:text-sm leading-relaxed">{msg.text || msg.message}</p>
                  {msg.is_offer && msg.price && (
                    <div className={cn(
                      "flex items-center gap-6 pt-3 mt-3 border-t",
                      msg.sender === 'BUYER' ? "border-outline-variant" : "border-white/20"
                    )}>
                      <div>
                        <p className={cn("font-mono text-[8px] sm:text-[9px] uppercase tracking-widest mb-0.5 opacity-70")}>Proposed Price</p>
                        <p className="font-sans text-sm sm:text-base font-bold">{msg.price}</p>
                      </div>
                      {msg.quantity && (
                        <div>
                          <p className={cn("font-mono text-[8px] sm:text-[9px] uppercase tracking-widest mb-0.5 opacity-70")}>Accepted / Counter Qty</p>
                          <p className="font-sans text-sm sm:text-base font-bold">{msg.quantity} {activeThread?.supply_detail?.unit || 'kg'}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {isMe && activeThread.status !== 'accepted' && (
                    <button 
                      onClick={() => {
                        setEditingOfferId(msg.id);
                        setEditPrice(String(msg.raw_price));
                        setEditQty(String(msg.quantity));
                        setEditMsg(msg.message || '');
                      }} 
                      className="mt-2 text-[9px] underline block text-white/80 hover:text-white cursor-pointer"
                    >
                      Edit Terms
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        )}

        {/* Controls vs Accepted Stats Bar */}
        {activeThread?.status === 'accepted' || activeThread?.supply_detail?.status === 'accepted' ? (
          <div className="p-4 bg-emerald-50/90 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-950 flex-shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-700 shrink-0" />
              <div>
                <p className="font-sans text-xs font-extrabold uppercase tracking-wider text-emerald-900">Finalized B2B Deal</p>
                <p className="font-sans text-xs text-emerald-800 font-medium">Terms harmonized and harvest accepted into master stock.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-xl border border-emerald-200 shadow-2xs">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-emerald-800 font-bold">Agreed Price</p>
                <p className="font-sans text-sm font-extrabold text-primary">{formatRwf(activeThread?.supply_detail?.agreed_price || activeThread?.supply_detail?.price)} / {activeThread?.supply_detail?.unit || 'kg'}</p>
              </div>
              <div className="h-6 w-px bg-emerald-200" />
              <div>
                <p className="font-mono text-[8px] uppercase tracking-wider text-emerald-800 font-bold">Accepted Qty</p>
                <p className="font-sans text-sm font-extrabold text-emerald-950">{activeThread?.supply_detail?.accepted_quantity || activeThread?.supply_detail?.quantity} {activeThread?.supply_detail?.unit || 'kg'}</p>
              </div>
            </div>
          </div>
        ) : activeThread?.status === 'open' && (
          <div className="p-3 sm:p-5 bg-surface-container-lowest border-t border-outline-variant flex-shrink-0 space-y-3 sm:space-y-4">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="font-sans text-xs tracking-wide text-primary font-bold block">
                    Propose New Terms <span className="text-[10px] text-on-surface-variant font-medium">(Original Price: {formatRwf(activeThread?.supply_detail?.proposed_price || activeThread?.supply_detail?.price || 0)} / {activeThread?.supply_detail?.unit || 'kg'})</span>
                  </label>
                  <div className="flex gap-2 sm:gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-xs">RWF</span>
                        <input 
                          className="w-full pl-12 pr-2 py-1.5 sm:py-2.5 bg-surface-container-low border border-outline-variant rounded-lg sm:rounded-xl focus:ring-1 focus:ring-primary outline-none font-sans font-bold text-xs sm:text-sm" 
                          type="number" 
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                        />
                      </div>
                      <p className="mt-0.5 font-mono text-[8px] sm:text-[9px] text-on-surface-variant uppercase">Price (RWF) / {activeThread?.supply_detail?.unit || 'kg'}</p>
                    </div>
                    <div className="flex-1">
                      <input 
                        className="w-full px-3 py-1.5 sm:py-2.5 bg-surface-container-low border border-outline-variant rounded-lg sm:rounded-xl focus:ring-1 focus:ring-primary outline-none font-sans font-bold text-xs sm:text-sm" 
                        type="number" 
                        value={counterQty}
                        onChange={(e) => setCounterQty(e.target.value)}
                      />
                      <p className="mt-0.5 font-mono text-[8px] sm:text-[9px] text-on-surface-variant uppercase">Qty ({activeThread?.supply_detail?.unit || 'kg'})</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                <div className="flex-grow space-y-1.5">
                  <label className="font-sans text-xs tracking-wide text-primary font-bold block">Offer Message / Custom Terms</label>
                  <input 
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg sm:rounded-xl focus:ring-1 focus:ring-primary outline-none font-sans text-xs sm:text-sm" 
                    placeholder="Type custom terms or notes to send with offer..." 
                    type="text" 
                    value={counterMessage}
                    onChange={(e) => setCounterMessage(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleSendOffer}
                    className="w-full h-9 sm:h-11 md:h-12 px-4 bg-primary text-on-primary rounded-lg sm:rounded-xl font-bold font-sans text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-md sm:shadow-lg cursor-pointer"
                  >
                    <Send size={14} className="sm:size-[18px]" />
                    Send Offer
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-4 pt-1.5">
              <button 
                onClick={handleAccept}
                className="flex-1 h-9 sm:h-11 md:h-12 bg-secondary-container text-on-secondary-container border border-secondary rounded-lg sm:rounded-xl font-bold font-sans text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-3 hover:bg-secondary-container/80 transition-all active:scale-[0.98] cursor-pointer"
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
