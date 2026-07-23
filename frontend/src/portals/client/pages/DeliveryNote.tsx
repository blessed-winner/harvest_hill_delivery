"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, Calendar, AlertCircle, Loader2, Package, 
  PenTool, RotateCcw, X, Check, FileText, AlertTriangle, ShieldCheck, Eye, Trash2, CloudUpload 
} from 'lucide-react';
import { clientApi } from '../lib/api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useAlert } from '../../../context/AlertContext';

interface DeliveryNoteProps {
  onNavigate: (screen: string) => void;
}

export default function DeliveryNote({ onNavigate }: DeliveryNoteProps) {
  const { toast } = useAlert();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active Modals state
  const [selectedItem, setSelectedItem] = useState<{ order?: any; note?: any } | null>(null);
  const [modalMode, setModalMode] = useState<'sign' | 'dispute' | 'view' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Deletion Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ noteId?: string | number; orderId?: string | number } | null>(null);

  // Signature image file state
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [clientPhone, setClientPhone] = useState('');

  // Form inputs
  const [receiverName, setReceiverName] = useState('');
  const [comments, setComments] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  // Load delivered orders, existing delivery notes, and client profile info
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [deliveredOrders, notesData, profileData] = await Promise.all([
        clientApi.orders.list('delivered').catch(() => []),
        clientApi.deliveryNotes.list().catch(() => []),
        clientApi.profile.get().catch(() => null)
      ]);
      setOrders(deliveredOrders || []);
      setDeliveryNotes(notesData || []);
      
      if (profileData) {
        const cp = profileData.profile || {};
        const ph = cp.phone || cp.phone_number || '';
        setClientPhone(ph);
        
        const name = profileData.first_name || profileData.last_name
          ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
          : cp.business_name || profileData.username || '';
        if (name) {
          setReceiverName(name);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch delivery data:', err);
      setError(err.message || 'Failed to load delivery notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Modal actions
  const handleOpenSignModal = (item: { order: any; note?: any }) => {
    setSelectedItem(item);
    setModalMode('sign');
    const savedSig = localStorage.getItem('saved_signature');
    setSignaturePreview(savedSig || null);
    setComments('');
  };

  const handleOpenDisputeModal = (item: { order: any; note?: any }) => {
    setSelectedItem(item);
    setModalMode('dispute');
    setDisputeReason('');
    setComments('');
  };

  const handleOpenViewModal = (item: { order?: any; note: any }) => {
    setSelectedItem(item);
    setModalMode('view');
  };

  const closeModal = () => {
    setSelectedItem(null);
    setModalMode(null);
    setSubmitting(false);
  };

  // Confirm Client Soft Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.noteId) {
        await clientApi.deliveryNotes.update(deleteTarget.noteId, { is_deleted_by_client: true });
      } else if (deleteTarget.orderId) {
        await clientApi.orders.update(deleteTarget.orderId, { is_deleted_by_client: true });
      }
      fetchData();
    } catch (err) {
      console.error('Failed to delete delivery note:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  // Submit Sign & Confirm Delivery Note
  const handleSubmitSignature = async () => {
    if (!receiverName.trim()) {
      toast('Please enter recipient name', 'warning');
      return;
    }
    if (!signaturePreview) {
      toast('Please upload a digital signature image file', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const orderId = selectedItem?.order?.id;
      const existingNote = selectedItem?.note;

      const payload = {
        order: orderId,
        status: 'confirmed',
        signed_by: receiverName,
        signature_data: signaturePreview,
        details: comments || `Delivery confirmed & signed by ${receiverName}`
      };

      if (existingNote?.id) {
        await clientApi.deliveryNotes.update(existingNote.id, payload);
      } else {
        await clientApi.deliveryNotes.create(payload);
      }

      await fetchData();
      closeModal();
    } catch (err: any) {
      console.error('Failed to submit signature:', err);
      toast(err.message || 'Failed to submit delivery note signature', 'error');
      setSubmitting(false);
    }
  };

  // Submit Dispute for Delivery Note
  const handleSubmitDispute = async () => {
    if (!disputeReason.trim()) {
      toast('Please enter a reason for the dispute', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const orderId = selectedItem?.order?.id;
      const existingNote = selectedItem?.note;
      const contactInfo = `[Client: ${receiverName || selectedItem?.order?.client_detail?.business_name || 'Client'}${clientPhone ? ` | Phone: ${clientPhone}` : ''}]`;
      const fullDetails = `Dispute Raised: ${disputeReason} ${contactInfo}${comments ? ` | Notes: ${comments}` : ''}`;

      const payload = {
        order: orderId,
        status: 'discrepancy',
        dispute_reason: disputeReason,
        details: fullDetails
      };

      if (existingNote?.id) {
        await clientApi.deliveryNotes.update(existingNote.id, payload);
      } else {
        await clientApi.deliveryNotes.create(payload);
      }

      await fetchData();
      closeModal();
    } catch (err: any) {
      console.error('Failed to submit dispute:', err);
      toast(err.message || 'Failed to submit delivery note dispute', 'error');
      setSubmitting(false);
    }
  };

  // Combine delivered orders with existing notes, filtering out client-deleted notes
  const combinedItems = orders
    .filter(order => !order.is_deleted_by_client)
    .map(order => {
      const linkedNote = deliveryNotes.find(n => (n.order === order.id || n.order_detail?.id === order.id) && !n.is_deleted_by_client);
      return {
        order,
        note: linkedNote
      };
    });

  deliveryNotes.forEach(note => {
    if (note.order && !note.is_deleted_by_client && !combinedItems.some(ci => ci.order?.id === note.order)) {
      combinedItems.push({ order: note.order_detail, note });
    }
  });

  // Filter items by status tabs
  const filteredItems = combinedItems.filter(({ note }) => {
    const status = note?.status || 'pending';
    if (activeTab === 'All') return true;
    if (activeTab === 'Confirmed') return status === 'confirmed';
    if (activeTab === 'Disputed') return status === 'discrepancy';
    if (activeTab === 'Pending') return status === 'pending';
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#144227] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#717971]">Loading delivery notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Breadcrumbs */}
      <div className="text-xs text-[#717971] flex items-center gap-1.5">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer">Orders</button>
        <ChevronRight size={12} />
        <span className="text-[#1c1c18] font-bold">Delivery Notes & Signatures</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e2db] pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight">Delivery Notes & Signatures</h1>
          <p className="text-xs text-[#717971] mt-1">Review delivered shipments, sign delivery receipts, and track discrepancy disputes.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e5e2db] pb-3">
        {['All', 'Confirmed', 'Disputed', 'Pending'].map((tab) => {
          const count = combinedItems.filter(({ note }) => {
            const status = note?.status || 'pending';
            if (tab === 'All') return true;
            if (tab === 'Confirmed') return status === 'confirmed';
            if (tab === 'Disputed') return status === 'discrepancy';
            if (tab === 'Pending') return status === 'pending';
            return true;
          }).length;

          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#144227] text-white shadow-sm'
                  : 'bg-[#f0eee7]/60 text-[#414942] hover:bg-[#f0eee7] hover:text-[#144227]'
              }`}
            >
              {tab}
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#c1c9c0]/30 text-[#414942]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center">
          <AlertCircle className="w-16 h-16 text-[#ba1a1a] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#1c1c18] mb-2">Unable to Load Delivery Notes</h2>
          <p className="text-sm text-[#717971] mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {!error && filteredItems.length === 0 && (
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center shadow-sm">
          <Package className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#1c1c18] mb-2">No Delivery Notes Found</h2>
          <p className="text-sm text-[#717971] mb-4">
            No delivery notes found matching active filter status "{activeTab}".
          </p>
          <button
            onClick={() => setActiveTab('All')}
            className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {!error && filteredItems.length > 0 && (
        <div className="bg-white border border-[#e5e2db] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f6f3ec]/60 border-b border-[#e5e2db] text-[9px] uppercase font-extrabold tracking-wider text-[#717971]">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Delivery Date</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Recipient / Notes</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee7] text-xs">
                {paginatedItems.map(({ order, note }, idx) => {
                  const status = note?.status || 'pending';
                  const isConfirmed = status === 'confirmed';
                  const isDisputed = status === 'discrepancy';

                  return (
                    <tr key={note?.id || order?.id || idx} className="hover:bg-[#f2efe7]/40 transition-colors">
                      <td className="px-6 py-4 font-extrabold text-[#1c1c18]">
                        #{order?.id || note?.order || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-[#414942] font-medium">
                        {order?.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : (note?.created_at ? new Date(note.created_at).toLocaleDateString('en-US') : 'N/A')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-[#1c1c18]">{order?.items?.length || 1} item(s)</span>
                      </td>
                      <td className="px-6 py-4">
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1.5 bg-[#bceec8] text-[#00210f] text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
                            <ShieldCheck size={12} /> Confirmed & Signed
                          </span>
                        )}
                        {isDisputed && (
                          <span className="inline-flex items-center gap-1.5 bg-[#ffdad6] text-[#93000a] text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
                            <AlertTriangle size={12} /> Disputed
                          </span>
                        )}
                        {!isConfirmed && !isDisputed && (
                          <span className="inline-flex items-center gap-1.5 bg-[#fff8e1] text-[#b78103] text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
                            <PenTool size={12} /> Pending Signature
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-[#717971]">
                        {note?.signed_by && <span className="font-bold text-[#1c1c18] block">Signed by: {note.signed_by}</span>}
                        {note?.dispute_reason && <span className="font-semibold text-[#ba1a1a] block truncate">Reason: {note.dispute_reason}</span>}
                        {!note?.signed_by && !note?.dispute_reason && (note?.details || 'Awaiting delivery confirmation')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isConfirmed || isDisputed ? (
                            <button
                              onClick={() => handleOpenViewModal({ order, note })}
                              className="px-3 py-1.5 bg-[#f6f3ec] hover:bg-[#e5e2db] text-[#144227] font-bold rounded-lg transition-all flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <Eye size={14} /> View Details
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenSignModal({ order, note })}
                                className="px-3 py-1.5 bg-[#144227] hover:bg-[#376847] text-white font-bold rounded-lg transition-all flex items-center gap-1 text-xs cursor-pointer shadow-sm"
                              >
                                <PenTool size={14} /> Sign Note
                              </button>
                              <button
                                onClick={() => handleOpenDisputeModal({ order, note })}
                                className="px-3 py-1.5 border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/40 font-bold rounded-lg transition-all flex items-center gap-1 text-xs cursor-pointer"
                              >
                                <AlertTriangle size={14} /> Dispute
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteTarget({ noteId: note?.id, orderId: order?.id })}
                            className="p-1.5 text-[#717971] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/30 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-[#f6f3ec]/30 border-t border-[#e5e2db] px-6 py-4 flex items-center justify-between text-xs text-[#717971]">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-[#c1c9c0] rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
              >
                Previous
              </button>
              <span className="font-bold text-[#1c1c18] px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-[#c1c9c0] rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SIGN DELIVERY NOTE ────────────────────────────────────────── */}
      {modalMode === 'sign' && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e5e2db] space-y-5">
            <div className="flex items-center justify-between border-b border-[#e5e2db] pb-3">
              <div className="flex items-center gap-2 text-[#144227]">
                <PenTool size={20} />
                <h3 className="text-base font-bold text-[#1c1c18]">Sign Delivery Note #{selectedItem.order?.id}</h3>
              </div>
              <button onClick={closeModal} className="text-[#717971] hover:text-[#1c1c18] cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-wider text-[#717971] mb-1">
                  Recipient Name <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Enter full name of recipient..."
                  className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] text-[#1c1c18] font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-wider text-[#717971] mb-1">
                  Upload Official Digital Signature <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="border-2 border-dashed border-[#c1c9c0] rounded-xl p-4 bg-[#f9f8f5] text-center relative hover:border-[#144227] transition-all">
                  {signaturePreview ? (
                    <div className="space-y-2">
                      <div className="bg-white p-2 border border-[#c1c9c0] rounded-lg inline-block shadow-inner max-h-36">
                        <img src={signaturePreview} alt="Signature Preview" className="max-h-28 object-contain mx-auto" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSignaturePreview(null)}
                        className="text-[10px] font-bold text-[#ba1a1a] hover:underline block mx-auto cursor-pointer"
                      >
                        Remove / Re-upload Signature
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block space-y-2 py-4">
                      <CloudUpload size={28} className="text-[#144227] mx-auto opacity-70" />
                      <span className="block text-xs font-bold text-[#144227]">Click to upload signature image file</span>
                      <span className="block text-[10px] text-[#717971]">PNG, JPG, or SVG scanned signature graphic</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setSignaturePreview(ev.target?.result as string);
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-wider text-[#717971] mb-1">
                  Delivery Notes / Comments (Optional)
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="E.g. Package inspected, all items in good condition."
                  className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#144227] text-[#1c1c18] font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="w-1/2 py-3 border border-[#c1c9c0] rounded-xl text-xs font-bold text-[#414942] hover:bg-[#f6f3ec] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitSignature}
                className="w-1/2 py-3 bg-[#144227] hover:bg-[#376847] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} />}
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: FILE DISPUTE ─────────────────────────────────────────────── */}
      {modalMode === 'dispute' && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e5e2db] space-y-5">
            <div className="flex items-center justify-between border-b border-[#e5e2db] pb-3">
              <div className="flex items-center gap-2 text-[#ba1a1a]">
                <AlertTriangle size={20} />
                <h3 className="text-base font-bold text-[#1c1c18]">Raise Dispute for Order #{selectedItem.order?.id}</h3>
              </div>
              <button onClick={closeModal} className="text-[#717971] hover:text-[#1c1c18] cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-[#717971]">
                Please describe the issue with this delivery (e.g. damaged produce, incorrect quantity, missing items, or temperature issues).
              </p>

              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-wider text-[#717971] mb-1">
                  Dispute Reason / Details <span className="text-[#ba1a1a]">*</span>
                </label>
                <textarea
                  rows={4}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Provide detailed description of the discrepancy..."
                  className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ba1a1a] text-[#1c1c18] font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-wider text-[#717971] mb-1">
                  Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Contact person or reference code..."
                  className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#144227] text-[#1c1c18] font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="w-1/2 py-3 border border-[#c1c9c0] rounded-xl text-xs font-bold text-[#414942] hover:bg-[#f6f3ec] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitDispute}
                className="w-1/2 py-3 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle size={16} />}
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW DETAILS ─────────────────────────────────────────────── */}
      {modalMode === 'view' && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e5e2db] space-y-5">
            <div className="flex items-center justify-between border-b border-[#e5e2db] pb-3">
              <div className="flex items-center gap-2 text-[#144227]">
                <FileText size={20} />
                <h3 className="text-base font-bold text-[#1c1c18]">Delivery Note Details #{selectedItem.note?.id || selectedItem.order?.id}</h3>
              </div>
              <button onClick={closeModal} className="text-[#717971] hover:text-[#1c1c18] cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#f6f3ec]/60 p-4 rounded-xl space-y-2 border border-[#e5e2db]">
                <div className="flex justify-between text-xs">
                  <span className="text-[#717971]">Status</span>
                  <span className="font-bold uppercase text-[#144227]">{selectedItem.note?.status || 'delivered'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#717971]">Details</span>
                  <span className="font-semibold text-[#1c1c18]">{selectedItem.note?.details || 'N/A'}</span>
                </div>
              </div>

              {selectedItem.note?.signed_by && (
                <div className="bg-[#f6f3ec]/60 p-4 rounded-xl space-y-3 border border-[#e5e2db]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#717971] block">Signature & Recipient</span>
                  <div className="text-xs font-bold text-[#1c1c18]">Recipient: <span className="text-[#144227]">{selectedItem.note.signed_by}</span></div>
                  {selectedItem.note.signature_data && (
                    <div className="bg-white p-2 border border-[#c1c9c0] rounded-lg inline-block shadow-inner">
                      <img src={selectedItem.note.signature_data} alt="Signature" className="max-h-24 object-contain" />
                    </div>
                  )}
                </div>
              )}

              {selectedItem.note?.dispute_reason && (
                <div className="bg-[#ffdad6]/40 border border-[#ba1a1a]/30 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#93000a] block">Dispute Reason</span>
                  <p className="text-xs font-bold text-[#ba1a1a]">{selectedItem.note.dispute_reason}</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="w-full py-3 bg-[#144227] text-white rounded-xl text-xs font-bold hover:bg-[#376847] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom UI Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Delivery Note"
        message="Are you sure you want to delete this delivery note? It will be removed from your list."
        confirmText="Delete Note"
        cancelText="Cancel"
      />

    </div>
  );
}
