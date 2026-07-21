"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, Calendar, AlertCircle, Loader2, Package, 
  PenTool, RotateCcw, X, Check, FileText, AlertTriangle, ShieldCheck, Eye 
} from 'lucide-react';
import { clientApi } from '../lib/api';

interface DeliveryNoteProps {
  onNavigate: (screen: string) => void;
}

export default function DeliveryNote({ onNavigate }: DeliveryNoteProps) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Active Modals state
  const [selectedItem, setSelectedItem] = useState<{ order?: any; note?: any } | null>(null);
  const [modalMode, setModalMode] = useState<'sign' | 'dispute' | 'view' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Signature canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Form inputs
  const [receiverName, setReceiverName] = useState('');
  const [comments, setComments] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  // Load delivered orders and existing delivery notes
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [deliveredOrders, notesData] = await Promise.all([
        clientApi.orders.list('delivered').catch(() => []),
        clientApi.deliveryNotes.list().catch(() => [])
      ]);
      setOrders(deliveredOrders || []);
      setDeliveryNotes(notesData || []);
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

  // Initialize Canvas settings when modal opens for signing
  useEffect(() => {
    if (modalMode !== 'sign') return;

    // Small delay to ensure modal DOM is mounted
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#144227'; // Harvest dark green ink
    }, 50);

    return () => clearTimeout(timer);
  }, [modalMode]);

  // Canvas drawing handlers
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  // Open modal handlers
  const handleOpenSignModal = (item: { order: any; note?: any }) => {
    setSelectedItem(item);
    setModalMode('sign');
    setReceiverName('');
    setComments('');
    setHasSigned(false);
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

  // Submit Sign & Confirm Delivery Note
  const handleSubmitSignature = async () => {
    if (!receiverName.trim()) {
      alert('Please enter recipient name');
      return;
    }
    if (!hasSigned || !canvasRef.current) {
      alert('Please provide a signature on the signature pad');
      return;
    }

    try {
      setSubmitting(true);
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      const orderId = selectedItem?.order?.id;
      const existingNote = selectedItem?.note;

      const payload = {
        order: orderId,
        status: 'confirmed',
        signed_by: receiverName,
        signature_data: signatureDataUrl,
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
      alert(err.message || 'Failed to submit delivery note signature');
      setSubmitting(false);
    }
  };

  // Submit Dispute for Delivery Note
  const handleSubmitDispute = async () => {
    if (!disputeReason.trim()) {
      alert('Please enter a reason for the dispute');
      return;
    }

    try {
      setSubmitting(true);
      const orderId = selectedItem?.order?.id;
      const existingNote = selectedItem?.note;

      const payload = {
        order: orderId,
        status: 'discrepancy',
        dispute_reason: disputeReason,
        details: comments || `Dispute raised: ${disputeReason}`
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
      alert(err.message || 'Failed to submit delivery note dispute');
      setSubmitting(false);
    }
  };

  // Combine delivered orders with existing notes
  const combinedItems = orders.map(order => {
    const linkedNote = deliveryNotes.find(n => n.order === order.id || n.order_detail?.id === order.id);
    return {
      order,
      note: linkedNote
    };
  });

  // Include orphan delivery notes if any
  deliveryNotes.forEach(note => {
    if (note.order && !combinedItems.some(ci => ci.order?.id === note.order)) {
      combinedItems.push({ order: note.order_detail, note });
    }
  });

  // Pagination
  const totalPages = Math.ceil(combinedItems.length / itemsPerPage) || 1;
  const paginatedItems = combinedItems.slice(
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
          <p className="text-xs text-[#717971] mt-1">Review delivered shipments, sign delivery receipts, and submit discrepancy disputes.</p>
        </div>
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

      {!error && combinedItems.length === 0 && (
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center shadow-sm">
          <Package className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#1c1c18] mb-2">No Delivered Orders Requiring Signature</h2>
          <p className="text-sm text-[#717971] mb-4">
            You don't have any delivered orders yet. Delivery notes will appear here once orders are delivered.
          </p>
          <button
            onClick={() => onNavigate('catalog')}
            className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors cursor-pointer"
          >
            Browse Catalog
          </button>
        </div>
      )}

      {!error && combinedItems.length > 0 && (
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
              {Math.min(currentPage * itemsPerPage, combinedItems.length)} of {combinedItems.length} items
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] uppercase font-extrabold tracking-wider text-[#717971]">
                    Digital Signature Pad <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[10px] font-bold text-[#ba1a1a] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={10} /> Clear Pad
                  </button>
                </div>
                
                <div className="border-2 border-dashed border-[#c1c9c0] rounded-xl p-1 bg-[#f9f8f5] relative flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 bg-white rounded-lg cursor-crosshair touch-none"
                  />
                  {!hasSigned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-[#717971]/60 font-medium">
                      Draw your signature here with mouse or touch...
                    </div>
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

    </div>
  );
}
