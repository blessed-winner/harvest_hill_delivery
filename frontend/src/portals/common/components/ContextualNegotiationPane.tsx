"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Send, Handshake, CheckCircle2, AlertCircle, ArrowLeft, 
  Trash2, Plus, CornerDownRight, ShieldCheck, Sparkles, Clock, RefreshCw, FileText
} from 'lucide-react';
import { cn } from '../../admin/lib/utils';
import { formatCurrency, apiRequest } from '../../admin/lib/api';
import { useAlert } from '../../../context/AlertContext';

interface ContextualNegotiationPaneProps {
  isOpen: boolean;
  onClose: () => void;
  contextType: 'FARMER' | 'CLIENT';
  supply: any; // Supply or Product/Harvest object
  currentUserRole?: 'admin' | 'farmer' | 'client';
  onNegotiationUpdated?: () => void;
}

export function ContextualNegotiationPane({
  isOpen,
  onClose,
  contextType,
  supply,
  currentUserRole = 'farmer',
  onNegotiationUpdated
}: ContextualNegotiationPaneProps) {
  const { toast, showConfirm } = useAlert();
  const [thread, setThread] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  
  // Offer Form Expander State
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [counterTargetOffer, setCounterTargetOffer] = useState<any | null>(null);
  const [offerQty, setOfferQty] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerTerms, setOfferTerms] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const timelineEndRef = useRef<HTMLDivElement>(null);

  // Derive supply ID and product metadata
  const supplyId = supply?.id;
  const productName = supply?.product_detail?.name || supply?.suggested_product_name || supply?.custom_product_name || 'Produce Listing';
  const availableQty = supply?.quantity || 0;
  const unit = supply?.unit || 'kg';
  const askingPrice = supply?.proposed_price || supply?.price || supply?.base_price || 0;
  const harvestNumber = supply?.supply_number || supply?.supplyNumber || (supplyId ? (isNaN(Number(supplyId)) ? 'SUP-000001' : `SUP-${String(supplyId).padStart(6, '0')}`) : 'SUP-000001');
  const farmerName = supply?.farmer_name || 'Harvest Hill Supplier';

  const loadThread = async () => {
    if (!supplyId) return;
    try {
      setIsLoading(true);
      // Fetch threads for this supply
      const res = await apiRequest(`/api/negotiations/threads/?supply_id=${supplyId}`);
      let currentThread = null;
      if (Array.isArray(res)) {
        currentThread = res.find((t: any) => String(t.supply) === String(supplyId) || String(t.supply_detail?.id) === String(supplyId)) || res[0];
      } else if (res.results && Array.isArray(res.results)) {
        currentThread = res.results.find((t: any) => String(t.supply) === String(supplyId) || String(t.supply_detail?.id) === String(supplyId)) || res.results[0];
      }

      if (!currentThread) {
        // If thread doesn't exist yet, attempt to create/get thread
        try {
          currentThread = await apiRequest('/api/negotiations/threads/', {
            method: 'POST',
            body: JSON.stringify({ supply: supplyId })
          });
        } catch {
          currentThread = null;
        }
      }

      setThread(currentThread);
    } catch (err) {
      console.error("Failed to load negotiation thread:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && supplyId) {
      loadThread();
    }
  }, [isOpen, supplyId]);

  useEffect(() => {
    if (thread) {
      // Auto-scroll timeline to latest message
      timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });

      // Pre-fill baseline offer form values from supply or active offer
      const activeOffer = getActiveOffer(thread);
      const defaultQty = activeOffer ? activeOffer.quantity : (supply?.accepted_quantity || supply?.quantity || '');
      const defaultPrice = activeOffer ? activeOffer.price : (supply?.agreed_price || supply?.price || supply?.proposed_price || '');
      
      let normPrice = Number(defaultPrice);
      if (normPrice > 0 && normPrice < 100) {
        normPrice = Math.round(normPrice * 1473.97);
      }

      if (!offerQty) setOfferQty(String(defaultQty));
      if (!offerPrice) setOfferPrice(normPrice ? String(normPrice) : '');
    }
  }, [thread]);

  if (!isOpen) return null;

  // Extract active/latest structured offer from thread
  function getActiveOffer(t: any) {
    if (!t || !t.offers) return null;
    return t.offers.filter((o: any) => o.is_offer).slice(-1)[0] || null;
  }

  const activeOffer = getActiveOffer(thread);
  const isAccepted = thread?.status === 'accepted' || supply?.status === 'accepted';
  const isDeclined = thread?.status === 'DECLINED' || supply?.status === 'rejected';

  // Handle sending normal text message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !thread) return;
    try {
      setIsSubmitting(true);
      await apiRequest(`/api/negotiations/threads/${thread.id}/offer/`, {
        method: 'POST',
        body: JSON.stringify({
          is_offer: false,
          message: messageText.trim(),
          price: activeOffer ? activeOffer.price : askingPrice,
          quantity: activeOffer ? activeOffer.quantity : availableQty
        })
      });
      setMessageText('');
      await loadThread();
      if (onNegotiationUpdated) onNegotiationUpdated();
    } catch (err: any) {
      toast(err.message || "Couldn't send your message. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle sending structured offer (or counter offer)
  const handleSendOffer = async () => {
    if (!thread) return;
    const parsedQty = parseFloat(offerQty);
    const parsedPrice = parseFloat(offerPrice);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast("Please enter a valid quantity greater than zero.", "warning");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast("Please enter a valid price per unit greater than zero.", "warning");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest(`/api/negotiations/threads/${thread.id}/offer/`, {
        method: 'POST',
        body: JSON.stringify({
          is_offer: true,
          quantity: parsedQty,
          price: parsedPrice,
          terms: offerTerms.trim(),
          message: messageText.trim(),
          parent_offer_id: counterTargetOffer ? counterTargetOffer.id : (activeOffer ? activeOffer.id : null)
        })
      });
      setShowOfferForm(false);
      setCounterTargetOffer(null);
      setMessageText('');
      toast(counterTargetOffer ? "Counter-offer sent successfully!" : "Structured offer sent successfully!", "success");
      await loadThread();
      if (onNegotiationUpdated) onNegotiationUpdated();
    } catch (err: any) {
      toast(err.message || "Couldn't send your offer. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open counter offer form pre-filled with target offer values
  const handleInitiateCounter = (targetOffer: any) => {
    setCounterTargetOffer(targetOffer);
    setOfferQty(String(targetOffer.quantity));
    setOfferPrice(String(targetOffer.price));
    setOfferTerms(targetOffer.terms || '');
    setShowOfferForm(true);
  };

  // Accept active offer
  const handleAcceptOffer = async (targetOffer?: any) => {
    if (!thread) return;
    const offerToAccept = targetOffer || activeOffer;
    const qty = offerToAccept ? offerToAccept.quantity : availableQty;
    const price = offerToAccept ? offerToAccept.price : askingPrice;

    const confirmed = await showConfirm(
      "Confirm Agreement & Finalize Terms",
      `Are you sure you want to accept ${qty} ${unit} of "${productName}" @ ${formatCurrency(price)}/${unit}? This will finalize terms and issue notifications.`
    );
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      await apiRequest(`/api/negotiations/threads/${thread.id}/accept/`, {
        method: 'POST',
        body: JSON.stringify({ offer_id: offerToAccept?.id })
      });
      toast("Agreement reached and terms finalized!", "success");
      await loadThread();
      if (onNegotiationUpdated) onNegotiationUpdated();
    } catch (err: any) {
      toast(err.message || "Failed to accept offer.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Decline active offer
  const handleDeclineOffer = async (targetOffer?: any) => {
    if (!thread) return;
    const confirmed = await showConfirm("Decline Negotiation Offer", "Are you sure you want to decline this negotiation offer?");
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      await apiRequest(`/api/negotiations/threads/${thread.id}/decline/`, {
        method: 'POST',
        body: JSON.stringify({ offer_id: targetOffer?.id || activeOffer?.id })
      });
      toast("Offer declined.", "info");
      await loadThread();
      if (onNegotiationUpdated) onNegotiationUpdated();
    } catch (err: any) {
      toast(err.message || "Failed to decline offer.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete offer item (Dual-Tier Deletion Rule)
  const handleDeleteItem = async (offerId: string) => {
    if (!thread) return;
    const confirmed = await showConfirm("Delete Negotiation Term", "Are you sure you want to delete this negotiation term?");
    if (!confirmed) return;

    try {
      await apiRequest(`/api/negotiations/threads/${thread.id}/delete-offer/`, {
        method: 'POST',
        body: JSON.stringify({ offer_id: offerId })
      });
      toast("Negotiation term removed.", "success");
      await loadThread();
      if (onNegotiationUpdated) onNegotiationUpdated();
    } catch (err: any) {
      toast(err.message || "Failed to delete term.", "error");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end font-sans">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="w-full sm:max-w-xl md:max-w-2xl h-full bg-surface shadow-2xl flex flex-col relative"
        >
          {/* Header Bar */}
          <div className="px-4 sm:px-6 py-4 bg-surface-container-lowest border-b border-outline-variant/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                title="Close negotiation pane"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-on-surface leading-snug">{productName}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/40">
                    {harvestNumber}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">
                  {availableQty} {unit} available · Asking: {formatCurrency(askingPrice)} / {unit}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer hidden sm:block"
            >
              <X size={18} />
            </button>
          </div>

          {/* Context Banner */}
          <div className="px-4 sm:px-6 py-2.5 bg-emerald-900 text-white text-xs font-bold flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Handshake size={15} className="text-emerald-300" />
              <span>
                {contextType === 'FARMER' 
                  ? `Procurement Negotiation: Harvest Hill ↔ Farmer (${farmerName})`
                  : `Sales Negotiation: Client ↔ Harvest Hill Delivery`}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-800 border border-emerald-700 px-2 py-0.5 rounded-full">
              {isAccepted ? 'Finalized' : isDeclined ? 'Declined' : 'Active Negotiation'}
            </span>
          </div>

          {/* Current Active Offer Highlight Bar */}
          {activeOffer && !isAccepted && (
            <div className="px-4 sm:px-6 py-3 bg-emerald-50/90 border-b border-emerald-200 flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                  <Clock size={12} className="text-emerald-700" /> Current Active Offer
                </p>
                <p className="text-xs font-extrabold text-emerald-950">
                  {formatCurrency(activeOffer.price)} / {unit} · {activeOffer.quantity} {unit}
                  <span className="text-secondary font-black ml-2">Total: {formatCurrency(activeOffer.total)}</span>
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                ● Awaiting Response
              </span>
            </div>
          )}

          {/* Agreement Reached Banner */}
          {isAccepted && (
            <div className="p-4 bg-emerald-900 text-white space-y-2 shrink-0 font-sans shadow-md">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-400" /> AGREEMENT REACHED
                </span>
                <span className="text-[10px] font-bold uppercase bg-emerald-800 border border-emerald-700 px-2.5 py-0.5 rounded-full">
                  Verified Deal
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-emerald-950/60 p-2 rounded-xl border border-emerald-800">
                  <p className="text-[9px] text-emerald-300 font-bold uppercase">Agreed Qty</p>
                  <p className="text-sm font-extrabold text-white mt-0.5">{supply?.accepted_quantity || (activeOffer ? activeOffer.quantity : availableQty)} {unit}</p>
                </div>
                <div className="bg-emerald-950/60 p-2 rounded-xl border border-emerald-800">
                  <p className="text-[9px] text-emerald-300 font-bold uppercase">Agreed Price</p>
                  <p className="text-sm font-extrabold text-white mt-0.5">{formatCurrency(supply?.agreed_price || (activeOffer ? activeOffer.price : askingPrice))} / {unit}</p>
                </div>
                <div className="bg-emerald-950/60 p-2 rounded-xl border border-emerald-800">
                  <p className="text-[9px] text-emerald-300 font-bold uppercase">Total Payout</p>
                  <p className="text-sm font-extrabold text-secondary mt-0.5">
                    {formatCurrency((supply?.accepted_quantity || availableQty) * (supply?.agreed_price || askingPrice))}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-emerald-200 text-center font-medium">
                Agreed by Harvest Hill Delivery and {contextType === 'FARMER' ? farmerName : 'Client'}.
              </p>
            </div>
          )}

          {/* Conversation & Structured Offers Timeline */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-surface-container-lowest">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-on-surface-variant font-bold text-xs gap-2">
                <RefreshCw size={16} className="animate-spin text-primary" /> Loading negotiation timeline...
              </div>
            ) : !thread || !thread.offers || thread.offers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-surface-container-low/40 rounded-2xl border border-outline-variant/30 space-y-2 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                  <Handshake size={24} />
                </div>
                <h4 className="font-extrabold text-sm text-on-surface">Start the Conversation</h4>
                <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                  Discuss quantity, pricing, delivery, or terms directly with Harvest Hill Delivery. Ask a question or make a structured offer below.
                </p>
              </div>
            ) : (
              thread.offers.map((item: any, idx: number) => {
                const isMe = (currentUserRole === 'farmer' && item.sender === 'farmer') ||
                             (currentUserRole === 'admin' && item.sender === 'admin') ||
                             (currentUserRole === 'client' && item.sender === 'client');

                // Render Lightweight Text Message
                if (!item.is_offer) {
                  return (
                    <motion.div
                      key={item.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex items-start gap-3 max-w-[85%]", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-mono shadow-2xs",
                        isMe ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"
                      )}>
                        {item.sender === 'farmer' ? 'FM' : item.sender === 'client' ? 'CL' : 'HH'}
                      </div>

                      <div className="relative group">
                        <div className={cn(
                          "p-3.5 rounded-2xl text-xs leading-relaxed border shadow-2xs",
                          isMe
                            ? "bg-primary-container text-white border-primary rounded-tr-none"
                            : "bg-white text-on-surface border-outline-variant/60 rounded-tl-none"
                        )}>
                          <p className="font-medium">{item.message}</p>
                          <span className={cn("block text-[8px] font-mono text-right mt-1.5 opacity-70")}>
                            {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>

                        {/* Hover Trash Delete Button (Dual-Tier Deletion) */}
                        {!isAccepted && (
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 p-1 bg-red-100 text-red-700 rounded-full border border-red-200 hover:bg-red-200 cursor-pointer shadow-md"
                            title="Delete message term"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                }

                // Render Structured Offer Card
                return (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("w-full max-w-md mx-auto my-2 relative group font-sans")}
                  >
                    <div className={cn(
                      "p-4 rounded-2xl border shadow-md space-y-3 relative overflow-hidden",
                      item.offer_status === 'ACCEPTED' ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20" :
                      item.offer_status === 'DECLINED' ? "bg-red-50/80 border-red-200" :
                      item.offer_status === 'COUNTERED' ? "bg-amber-50/80 border-amber-200/80" :
                      "bg-white border-primary/30"
                    )}>
                      {/* Card Header */}
                      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
                          <FileText size={14} /> {item.parent_offer ? 'COUNTER OFFER' : 'STRUCTURED OFFER'}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border",
                          item.offer_status === 'ACCEPTED' ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                          item.offer_status === 'DECLINED' ? "bg-red-100 text-red-800 border-red-300" :
                          item.offer_status === 'COUNTERED' ? "bg-amber-100 text-amber-800 border-amber-300" :
                          "bg-primary/10 text-primary border-primary/20"
                        )}>
                          {item.offer_status || 'PENDING'}
                        </span>
                      </div>

                      {/* Itemized Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                        <div className="bg-surface-container-low/60 p-2.5 rounded-xl border border-outline-variant/20">
                          <p className="text-[8px] font-extrabold uppercase tracking-wider text-on-surface-variant">Quantity</p>
                          <p className="text-sm font-extrabold text-on-surface mt-0.5">{item.quantity} {unit}</p>
                        </div>
                        <div className="bg-surface-container-low/60 p-2.5 rounded-xl border border-outline-variant/20">
                          <p className="text-[8px] font-extrabold uppercase tracking-wider text-on-surface-variant">Price per Unit</p>
                          <p className="text-sm font-extrabold text-primary mt-0.5">{formatCurrency(item.price)} / {unit}</p>
                        </div>
                      </div>

                      <div className="bg-primary/5 p-2.5 rounded-xl border border-primary/15 flex justify-between items-center">
                        <span className="text-xs font-bold text-on-surface-variant">Total Calculated Value</span>
                        <span className="text-sm font-black text-secondary">{formatCurrency(item.total)}</span>
                      </div>

                      {item.terms && (
                        <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30 text-xs space-y-0.5">
                          <p className="text-[8px] font-extrabold uppercase tracking-wider text-on-surface-variant">Terms & Requirements</p>
                          <p className="text-on-surface font-medium leading-relaxed">{item.terms}</p>
                        </div>
                      )}

                      {item.message && (
                        <p className="text-xs italic text-on-surface-variant font-medium bg-surface-container-low/40 p-2 rounded-lg">
                          "{item.message}"
                        </p>
                      )}

                      {/* Action Buttons for Pending Offer */}
                      {item.offer_status === 'PENDING' && !isAccepted && !isMe && (
                        <div className="flex gap-2 pt-1 border-t border-outline-variant/20">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleAcceptOffer(item)}
                            className="flex-1 py-2 bg-[#144227] hover:bg-[#0f2e1b] text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 size={13} /> Accept
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleInitiateCounter(item)}
                            className="flex-1 py-2 bg-[#2c5234] hover:bg-[#1e3a29] text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <CornerDownRight size={13} /> Counter
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleDeclineOffer(item)}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-xs transition-all border border-red-200 cursor-pointer disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {/* Hover Trash Delete Option */}
                      {!isAccepted && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-700 rounded-full border border-red-200 hover:bg-red-200 cursor-pointer shadow-md"
                          title="Delete offer term"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={timelineEndRef} />
          </div>

          {/* Footer Controls & Structured Offer Form Expander */}
          <div className="p-4 sm:p-5 bg-surface border-t border-outline-variant/60 shrink-0 space-y-3">
            {isAccepted ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-center font-bold text-xs">
                ✓ Negotiation finalized & agreement reached. Further price edits are locked.
              </div>
            ) : (
              <>
                {/* Expander Structured Offer Form */}
                <AnimatePresence>
                  {showOfferForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-emerald-50/90 rounded-2xl border border-emerald-300/80 space-y-3 font-sans overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                          <Plus size={14} className="text-emerald-700" /> {counterTargetOffer ? 'Create Counter Offer' : 'Structured Offer Form'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowOfferForm(false)}
                          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                            Quantity ({unit})
                          </label>
                          <input
                            type="number"
                            value={offerQty}
                            onChange={(e) => setOfferQty(e.target.value)}
                            placeholder={`e.g. ${availableQty}`}
                            className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-xs text-emerald-950 outline-none focus:border-emerald-700"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                            Price per Unit (RWF)
                          </label>
                          <input
                            type="number"
                            value={offerPrice}
                            onChange={(e) => setOfferPrice(e.target.value)}
                            placeholder="e.g. 1000"
                            className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-xs text-emerald-950 outline-none focus:border-emerald-700"
                          />
                        </div>
                      </div>

                      {/* Live Calculated Total Display */}
                      {(() => {
                        const q = parseFloat(offerQty || '0');
                        const p = parseFloat(offerPrice || '0');
                        const tot = (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) ? q * p : 0;
                        return (
                          <div className="bg-white p-2.5 rounded-xl border border-emerald-300 flex justify-between items-center text-xs">
                            <span className="font-bold text-emerald-900">Calculated Offer Total:</span>
                            <span className="font-extrabold text-secondary text-sm">{formatCurrency(tot)}</span>
                          </div>
                        );
                      })()}

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                          Terms & Delivery Requirements
                        </label>
                        <textarea
                          rows={2}
                          value={offerTerms}
                          onChange={(e) => setOfferTerms(e.target.value)}
                          placeholder="e.g. Delivery to Kigali on Friday morning, Grade A inspection..."
                          className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-medium text-emerald-950 outline-none focus:border-emerald-700 resize-none"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSendOffer}
                        className="w-full py-3 bg-[#144227] hover:bg-[#0f2e1b] text-white rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send size={14} /> {counterTargetOffer ? 'Send Counter Offer' : 'Send Structured Offer'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Normal Message Text Input & Action Row */}
                <div className="space-y-2">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message or discuss terms..."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-on-surface-variant/50"
                    />
                  </div>

                  <div className="flex gap-2 justify-between items-center">
                    <button
                      type="button"
                      disabled={isSubmitting || !messageText.trim()}
                      onClick={handleSendMessage}
                      className="py-2.5 px-4 bg-primary text-on-primary rounded-xl font-bold text-xs transition-all hover:opacity-90 active:scale-[0.98] flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Send size={14} /> Send message
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCounterTargetOffer(null);
                        setShowOfferForm(prev => !prev);
                      }}
                      className="py-2.5 px-4 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-extrabold text-xs transition-all hover:bg-emerald-200 active:scale-[0.98] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus size={14} /> {showOfferForm ? 'Close offer form' : '+ Make offer'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
