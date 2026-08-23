"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Handshake, 
  Search, 
  Filter, 
  MessageSquare, 
  Check, 
  X, 
  Send, 
  Clock, 
  DollarSign, 
  Package, 
  User as UserIcon, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAlert } from '../../../context/AlertContext';

const formatCurrency = (amount: number | string | null | undefined) => {
  const num = Number(amount || 0);
  return `RWF ${num.toLocaleString('en-US')}`;
};

export function ClientNegotiations() {
  const { toast, showConfirm } = useAlert();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ACCEPTED' | 'DECLINED'>('ALL');

  // Drawer / Negotiation Active State
  const [activeThread, setActiveThread] = useState<any | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQty, setCounterQty] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch B2B Client Negotiations
  const fetchClientNegotiations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('/api/negotiations/threads/');
      const allThreads = Array.isArray(res) ? res : (res?.results || []);
      
      // Filter exclusively for Client Negotiations (threads where buyer is set or buyer is role='client')
      const clientThreads = allThreads.filter((t: any) => {
        if (!t.buyer_detail && !t.buyer) return false;
        // Exclude internal farmer sourcing threads where buyer is not a client
        return t.buyer_detail?.role === 'client' || !!t.buyer_detail;
      });

      setThreads(clientThreads);
    } catch (err: any) {
      console.error("Failed to load client negotiations:", err);
      setError(err.message || "Failed to load client negotiations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientNegotiations();
  }, []);

  // Filtered threads list
  const filteredThreads = useMemo(() => {
    return threads.filter(t => {
      const buyerName = (t.buyer_detail?.name || t.buyer_detail?.email || '').toLowerCase();
      const buyerCompany = (t.buyer_detail?.company || '').toLowerCase();
      const prodName = (t.supply_detail?.product_detail?.name || t.supply_detail?.custom_product_name || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || buyerName.includes(q) || buyerCompany.includes(q) || prodName.includes(q);

      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = t.status !== 'accepted' && t.status !== 'DECLINED';
      } else if (statusFilter === 'ACCEPTED') {
        matchesStatus = t.status === 'accepted';
      } else if (statusFilter === 'DECLINED') {
        matchesStatus = t.status === 'DECLINED';
      }

      return matchesSearch && matchesStatus;
    });
  }, [threads, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = threads.length;
    const active = threads.filter(t => t.status !== 'accepted' && t.status !== 'DECLINED').length;
    const accepted = threads.filter(t => t.status === 'accepted').length;
    const declined = threads.filter(t => t.status === 'DECLINED').length;
    return { total, active, accepted, declined };
  }, [threads]);

  // Open negotiation detail modal
  const handleOpenModal = (thread: any) => {
    setActiveThread(thread);
    const lastOffer = thread.offers?.[thread.offers.length - 1];
    const defaultPrice = lastOffer ? lastOffer.price : (thread.price || thread.supply_detail?.proposed_price || 0);
    const defaultQty = lastOffer ? lastOffer.quantity : (thread.supply_detail?.quantity || 100);
    setCounterPrice(String(defaultPrice));
    setCounterQty(String(defaultQty));
    setCounterMessage('');
  };

  // Submit Counter-Offer from Harvest Hill Admin
  const handleSendCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread) return;

    const p = parseFloat(counterPrice);
    const q = parseFloat(counterQty);
    if (isNaN(p) || p <= 0) {
      toast("Please enter a valid price.", "warning");
      return;
    }
    if (isNaN(q) || q <= 0) {
      toast("Please enter a valid quantity.", "warning");
      return;
    }

    try {
      setSubmittingAction(true);
      const res = await apiRequest(`/api/negotiations/threads/${activeThread.id}/offer/`, {
        method: 'POST',
        body: JSON.stringify({
          price: p,
          quantity: q,
          message: counterMessage,
          is_offer: true
        })
      });

      setActiveThread(res);
      setCounterMessage('');
      toast("Counter-offer submitted to client successfully!", "success");
      fetchClientNegotiations();
    } catch (err: any) {
      console.error("Failed to send counter offer:", err);
      toast(err.message || "Failed to submit counter offer.", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Accept Client Proposal
  const handleAcceptProposal = async () => {
    if (!activeThread) return;
    const confirmed = await showConfirm(
      "Accept Client Deal",
      `Are you sure you want to accept this negotiation deal for ${activeThread.buyer_detail?.name || 'Client'}? This will finalize agreed pricing terms.`
    );
    if (!confirmed) return;

    try {
      setSubmittingAction(true);
      const res = await apiRequest(`/api/negotiations/threads/${activeThread.id}/accept/`, {
        method: 'POST'
      });
      setActiveThread(res);
      toast("Negotiation deal finalized and accepted!", "success");
      fetchClientNegotiations();
    } catch (err: any) {
      console.error("Failed to accept deal:", err);
      toast(err.message || "Failed to accept deal.", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Decline Client Proposal
  const handleDeclineProposal = async () => {
    if (!activeThread) return;
    const confirmed = await showConfirm(
      "Decline Negotiation",
      "Are you sure you want to decline this client negotiation?"
    );
    if (!confirmed) return;

    try {
      setSubmittingAction(true);
      const res = await apiRequest(`/api/negotiations/threads/${activeThread.id}/decline/`, {
        method: 'POST'
      });
      setActiveThread(res);
      toast("Negotiation declined.", "info");
      fetchClientNegotiations();
    } catch (err: any) {
      console.error("Failed to decline negotiation:", err);
      toast(err.message || "Failed to decline negotiation.", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Delete Negotiation Thread
  const handleDeleteThread = async (threadId: string) => {
    const confirmed = await showConfirm(
      "Delete Negotiation Thread",
      "Are you sure you want to delete this negotiation thread from your view?"
    );
    if (!confirmed) return;

    try {
      await apiRequest(`/api/negotiations/threads/${threadId}/`, {
        method: 'DELETE'
      });
      if (activeThread?.id === threadId) {
        setActiveThread(null);
      }
      toast("Negotiation thread removed.", "success");
      fetchClientNegotiations();
    } catch (err: any) {
      console.error("Failed to delete thread:", err);
      toast("Failed to delete negotiation thread.", "error");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-outline-variant/50 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Handshake size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-on-surface">Client B2B Deals & Price Negotiations</h1>
              <p className="text-xs text-on-surface-variant font-medium">Review and respond to client price negotiation proposals for wholesale produce</p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchClientNegotiations}
          className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Deals
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-outline-variant/40 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant block mb-1">Total Client Deals</span>
          <span className="text-2xl font-black text-on-surface">{stats.total}</span>
        </div>
        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block mb-1">Active Negotiations</span>
          <span className="text-2xl font-black text-amber-950">{stats.active}</span>
        </div>
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 block mb-1">Finalized Agreements</span>
          <span className="text-2xl font-black text-emerald-950">{stats.accepted}</span>
        </div>
        <div className="bg-red-50/70 p-4 rounded-xl border border-red-200 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-900 block mb-1">Declined Proposals</span>
          <span className="text-2xl font-black text-red-950">{stats.declined}</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-outline-variant/40 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60" />
          <input
            type="text"
            placeholder="Search by client name, email, company, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'ACCEPTED', 'DECLINED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === st 
                  ? 'bg-primary text-white shadow-2xs' 
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30'
              }`}
            >
              {st === 'ALL' ? 'All Deals' : st === 'ACTIVE' ? 'Active' : st === 'ACCEPTED' ? 'Accepted' : 'Declined'}
            </button>
          ))}
        </div>
      </div>

      {/* Client Negotiations Table */}
      <div className="bg-white rounded-2xl border border-outline-variant/50 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={32} className="text-primary animate-spin mx-auto mb-3" />
            <p className="text-xs text-on-surface-variant font-medium">Loading B2B client negotiations...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
            <p className="text-xs text-red-600 font-bold mb-2">{error}</p>
            <button onClick={fetchClientNegotiations} className="text-xs font-bold text-primary hover:underline">Retry</button>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="py-16 text-center">
            <Handshake size={36} className="text-on-surface-variant opacity-30 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-on-surface">No Client Negotiations Found</h3>
            <p className="text-xs text-on-surface-variant mt-1">There are no client B2B negotiation proposals matching your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/40 text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                  <th className="py-3.5 px-4">Client Buyer</th>
                  <th className="py-3.5 px-4">Target Product</th>
                  <th className="py-3.5 px-4">Proposed Terms</th>
                  <th className="py-3.5 px-4">Master Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredThreads.map((thread) => {
                  const buyer = thread.buyer_detail || {};
                  const prod = thread.supply_detail?.product_detail || {};
                  const lastOffer = thread.offers?.[thread.offers.length - 1];

                  const clientPrice = lastOffer ? lastOffer.price : (thread.price || thread.supply_detail?.proposed_price);
                  const clientQty = lastOffer ? lastOffer.quantity : thread.supply_detail?.quantity;
                  const unitStr = thread.supply_detail?.unit || prod.unit || 'kg';

                  const isAccepted = thread.status === 'accepted';
                  const isDeclined = thread.status === 'DECLINED';

                  return (
                    <tr key={thread.id} className="hover:bg-surface-container-low/50 transition-colors">
                      
                      {/* Client info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {buyer.name ? buyer.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <span className="font-extrabold text-on-surface block">{buyer.name || 'Client User'}</span>
                            <span className="text-[10px] text-on-surface-variant block font-medium">{buyer.email || 'Client'}</span>
                            {buyer.company && (
                              <span className="text-[9.5px] font-bold text-primary flex items-center gap-1 mt-0.5">
                                <Building2 size={10} /> {buyer.company}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Product info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {prod.image_url || prod.image ? (
                            <img src={prod.image_url || prod.image} alt={prod.name} className="w-9 h-9 rounded-lg object-cover border border-outline-variant/40 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                              <Package size={16} />
                            </div>
                          )}
                          <div>
                            <span className="font-extrabold text-on-surface block">{prod.name || thread.supply_detail?.custom_product_name || 'Produce Item'}</span>
                            <span className="text-[10px] text-on-surface-variant block">{prod.category || 'Produce'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Proposed terms */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-emerald-800 block">{formatCurrency(clientPrice)} / {unitStr}</span>
                          <span className="text-[10.5px] text-on-surface-variant font-bold block">Qty: {clientQty} {unitStr}</span>
                        </div>
                      </td>

                      {/* Master catalog price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-on-surface-variant">
                        {formatCurrency(prod.price || prod.base_price || thread.supply_detail?.base_price)} / {unitStr}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isAccepted ? (
                          <span className="px-2.5 py-1 rounded-full text-[9.5px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 size={11} /> AGREED
                          </span>
                        ) : isDeclined ? (
                          <span className="px-2.5 py-1 rounded-full text-[9.5px] font-extrabold bg-red-100 text-red-900 border border-red-300 inline-flex items-center gap-1">
                            <X size={11} /> DECLINED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[9.5px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                            <Clock size={11} /> IN NEGOTIATION
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(thread)}
                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-[#376847] transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <Handshake size={13} /> View & Respond
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteThread(thread.id)}
                            className="p-1.5 text-on-surface-variant hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete thread"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CLIENT NEGOTIATION DETAIL MODAL / DRAWER ──────────────────────── */}
      {activeThread && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-outline-variant/40 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Handshake size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">Client B2B Negotiation</h3>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Client: <span className="font-bold text-on-surface">{activeThread.buyer_detail?.name || 'Client'}</span> ({activeThread.buyer_detail?.email})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveThread(null)}
                className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Product Summary Header Card */}
            <div className="mt-4 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {activeThread.supply_detail?.product_detail?.image_url ? (
                  <img src={activeThread.supply_detail.product_detail.image_url} alt="Product" className="w-10 h-10 rounded-lg object-cover border border-outline-variant/40" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-on-surface-variant">
                    <Package size={18} />
                  </div>
                )}
                <div>
                  <span className="font-extrabold text-on-surface text-xs block">
                    {activeThread.supply_detail?.product_detail?.name || activeThread.supply_detail?.custom_product_name || 'Produce Item'}
                  </span>
                  <span className="text-[10.5px] text-on-surface-variant font-medium block">
                    Master Selling Price: <span className="font-bold text-primary">{formatCurrency(activeThread.supply_detail?.product_detail?.price || activeThread.supply_detail?.base_price)}</span>
                  </span>
                </div>
              </div>
              <div>
                {activeThread.status === 'accepted' ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-bold text-[10px]">AGREED</span>
                ) : activeThread.status === 'DECLINED' ? (
                  <span className="px-2.5 py-1 bg-red-100 text-red-900 border border-red-300 rounded-full font-bold text-[10px]">DECLINED</span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-bold text-[10px]">IN PROGRESS</span>
                )}
              </div>
            </div>

            {/* Conversation Timeline Stream */}
            <div className="flex-1 overflow-y-auto py-4 my-2 space-y-3 pr-1 scrollbar-thin">
              {activeThread.offers && activeThread.offers.length > 0 ? (
                activeThread.offers.map((of: any, idx: number) => {
                  const isAdmin = of.sender === 'admin';
                  return (
                    <div key={idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-2xl max-w-[85%] text-xs border ${
                        isAdmin 
                          ? 'bg-primary text-white border-primary rounded-tr-xs' 
                          : 'bg-surface-container-low text-on-surface border-outline-variant/40 rounded-tl-xs shadow-2xs'
                      }`}>
                        <div className="flex items-center justify-between gap-4 border-b pb-1.5 mb-1.5 border-current/20 text-[10px]">
                          <span className="font-extrabold uppercase tracking-wider">{isAdmin ? 'Harvest Hill Delivery (Admin)' : (of.sender_name || 'Client Buyer')}</span>
                          <span className="opacity-75 font-mono">{of.created_at ? new Date(of.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-sm">
                            RWF {Number(of.price).toLocaleString()} / {activeThread.supply_detail?.unit || 'kg'}
                          </p>
                          <p className="text-[11px] opacity-90 font-bold">
                            Quantity: {of.quantity} {activeThread.supply_detail?.unit || 'kg'} (Total: {formatCurrency(of.total)})
                          </p>
                          {of.message && (
                            <p className="mt-1.5 text-xs opacity-95 leading-relaxed font-medium bg-black/10 p-2 rounded-lg">
                              "{of.message}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-on-surface-variant text-xs font-medium">
                  No previous negotiation offers logged. Submit a counter-offer below.
                </div>
              )}
            </div>

            {/* Admin Response Form */}
            {activeThread.status !== 'accepted' && activeThread.status !== 'DECLINED' && (
              <form onSubmit={handleSendCounterOffer} className="pt-3 border-t border-outline-variant/40 space-y-3 shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-extrabold text-on-surface-variant tracking-wider mb-1">
                      Counter Price (RWF per {activeThread.supply_detail?.unit || 'kg'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs font-extrabold text-on-surface focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-extrabold text-on-surface-variant tracking-wider mb-1">
                      Counter Volume ({activeThread.supply_detail?.unit || 'kg'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={counterQty}
                      onChange={(e) => setCounterQty(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs font-extrabold text-on-surface focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-on-surface-variant tracking-wider mb-1">
                    Notes / Admin Counter Message
                  </label>
                  <input
                    type="text"
                    placeholder="Enter message to client..."
                    value={counterMessage}
                    onChange={(e) => setCounterMessage(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAcceptProposal}
                    disabled={submittingAction}
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} /> Accept Client Terms
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="flex-1 py-2.5 bg-primary hover:bg-[#376847] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send size={14} /> Send Counter Offer
                  </button>
                  <button
                    type="button"
                    onClick={handleDeclineProposal}
                    disabled={submittingAction}
                    className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
