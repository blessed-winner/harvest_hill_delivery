import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Handshake, CheckCircle2, Archive, Check, X, RefreshCw, AlertCircle, Trash2, Send, Sparkles, MessageSquare, Edit3, Save } from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { api, apiRequest } from '../lib/api';
import { useAlert } from '../../../context/AlertContext';
import { ContextualNegotiationPane } from '../../common/components/ContextualNegotiationPane';

interface SuppliesProps {
  searchTerm?: string;
}

export function Supplies({ searchTerm = '' }: SuppliesProps) {
  const { toast, showConfirm } = useAlert();
  const [supplies, setSupplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupply, setSelectedSupply] = useState<any | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [activeStatusTab, setActiveStatusTab] = useState('All');
  const [showFarmerNames, setShowFarmerNames] = useState(false);

  useEffect(() => {
    api.systemSettings.get().then((res: any) => {
      if (res && res.show_farmer_names_to_clients !== undefined) {
        setShowFarmerNames(!!res.show_farmer_names_to_clients);
      }
    }).catch(() => {});
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);



  // Success acceptance modal state
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    productName: string;
  }>({
    isOpen: false,
    productName: '',
  });

  // Negotiation Agreement Form State
  const [agreedQtyInput, setAgreedQtyInput] = useState('');
  const [agreedPriceInput, setAgreedPriceInput] = useState('');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [targetProductId, setTargetProductId] = useState('');
  const [masterProducts, setMasterProducts] = useState<any[]>([]);
  const [isSubmittingAgreement, setIsSubmittingAgreement] = useState(false);

  // Admin Direct Edit Supply State
  const [editSupply, setEditSupply] = useState<any | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editUnit, setEditUnit] = useState('kg');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Contextual Negotiation Pane State
  const [activeNegotiationSupply, setActiveNegotiationSupply] = useState<any | null>(null);

  const handleOpenEditModal = (supply: any) => {
    setEditSupply(supply);
    setEditQty(String(supply.quantity || ''));
    setEditPrice(String(supply.price || supply.proposed_price || ''));
    setEditUnit(supply.unit || 'kg');
    setEditNotes(supply.notes || '');
  };

  const handleSaveAdminEdit = async () => {
    if (!editSupply) return;
    const parsedQty = parseFloat(editQty);
    const parsedPrice = parseFloat(editPrice);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast("Please enter a valid quantity greater than zero.", "warning");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast("Please enter a valid price per unit greater than zero.", "warning");
      return;
    }

    try {
      setIsSavingEdit(true);
      await apiRequest(`/api/supplies/${editSupply.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          quantity: parsedQty,
          price: parsedPrice,
          unit: editUnit,
          notes: editNotes.trim()
        })
      });

      // Also update linked Product base_price if supply is attached to a Product
      if (editSupply.product) {
        try {
          await apiRequest(`/api/products/${editSupply.product}/`, {
            method: 'PATCH',
            body: JSON.stringify({ base_price: parsedPrice })
          });
        } catch {
          // Ignore if product direct update is silent
        }
      }

      toast("Supply details & product price updated successfully!", "success");
      setEditSupply(null);
      setSelectedSupply(null);
      loadSupplies();
    } catch (err: any) {
      toast(err.message || "Failed to update supply.", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [adminThread, setAdminThread] = useState<any>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  const loadAdminThread = async (supplyId: number | string) => {
    if (!supplyId) return;
    try {
      setIsLoadingThread(true);
      const res = await apiRequest(`/api/negotiations/threads/?supply_id=${supplyId}`);
      let currentThread: any = null;
      if (Array.isArray(res)) {
        currentThread = res.find((t: any) => String(t.supply) === String(supplyId) || String(t.supply_detail?.id) === String(supplyId)) || res[0];
      } else if (res?.results) {
        currentThread = res.results.find((t: any) => String(t.supply) === String(supplyId) || String(t.supply_detail?.id) === String(supplyId)) || res.results[0];
      }
      setAdminThread(currentThread || null);

      if (currentThread && Array.isArray(currentThread.offers) && currentThread.offers.length > 0) {
        const latestOffer = currentThread.offers[currentThread.offers.length - 1];
        if (latestOffer) {
          if (latestOffer.price !== undefined && latestOffer.price !== null) {
            setAgreedPriceInput(String(latestOffer.price));
          }
          if (latestOffer.quantity !== undefined && latestOffer.quantity !== null) {
            setAgreedQtyInput(String(latestOffer.quantity));
          }
        }
      }
    } catch {
      setAdminThread(null);
    } finally {
      setIsLoadingThread(false);
    }
  };

  const handleDeleteOfferTerm = async (offerId: number) => {
    if (!adminThread || !selectedSupply) return;
    const confirmed = await showConfirm("Delete Negotiation Term", "Are you sure you want to delete this negotiation term?", { isDanger: true });
    if (!confirmed) return;
    try {
      await api.negotiations.deleteOffer(adminThread.id, offerId);
      toast("Negotiation term removed.", "success");
      loadAdminThread(selectedSupply.id);
    } catch (err: any) {
      toast(err.message || "Failed to delete term.", "error");
    }
  };

  useEffect(() => {
    if (selectedSupply?.id) {
      setAgreedQtyInput(selectedSupply.accepted_quantity ? String(selectedSupply.accepted_quantity) : String(selectedSupply.quantity || ''));
      setAgreedPriceInput(selectedSupply.agreed_price ? String(selectedSupply.agreed_price) : String(selectedSupply.price || ''));
      setTargetProductId(selectedSupply.product ? String(selectedSupply.product) : '');
      setAdminNotesInput('');
      loadAdminThread(selectedSupply.id);
    } else {
      setAdminThread(null);
    }
  }, [selectedSupply?.id]);

  useEffect(() => {
    api.products.list().then(res => setMasterProducts(res || [])).catch(() => {});
  }, []);

  const handleCounterSupply = async () => {
    if (!selectedSupply) return;
    const parsedQty = parseFloat(agreedQtyInput || '0');
    const parsedPrice = parseFloat(agreedPriceInput || '0');

    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast("Accepted quantity must be greater than zero.", "warning");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast("Agreed farmer price must be greater than zero.", "warning");
      return;
    }

    try {
      setIsSubmittingAgreement(true);
      const payload: any = {
        accepted_quantity: parsedQty,
        agreed_price: parsedPrice,
        admin_notes: adminNotesInput.trim(),
      };
      if (targetProductId) {
        payload.product_id = targetProductId;
      }

      await api.supplies.counterSupply(selectedSupply.id, payload);
      toast(`Counter-proposal (${parsedQty} ${selectedSupply.unit} @ RWF ${parsedPrice}) sent to farmer! Live notification dispatched.`, "success");
      setAdminNotesInput('');
      loadAdminThread(selectedSupply.id);
      loadSupplies();
    } catch (err: any) {
      toast(err.message || "Failed to send counter-proposal.", "error");
    } finally {
      setIsSubmittingAgreement(false);
    }
  };

  const handleAgreeSupply = async () => {
    if (!selectedSupply) return;
    const parsedQty = parseFloat(agreedQtyInput || '0');
    const parsedPrice = parseFloat(agreedPriceInput || '0');

    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast("Accepted quantity must be greater than zero.", "warning");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast("Agreed farmer price must be greater than zero.", "warning");
      return;
    }

    const prodName = selectedSupply.product_detail?.name || selectedSupply.suggested_product_name || selectedSupply.custom_product_name || 'Harvest Batch';
    const confirmed = await showConfirm(
      "Finalize B2B Agreement & Aggregate Stock",
      `Are you sure you want to accept ${parsedQty} ${selectedSupply.unit} of "${prodName}" @ ${formatCurrency(parsedPrice)}/${selectedSupply.unit} into master stock? This will finalize terms and issue notifications.`
    );
    if (!confirmed) return;

    try {
      setIsSubmittingAgreement(true);
      const payload: any = {
        accepted_quantity: parsedQty,
        agreed_price: parsedPrice,
        admin_notes: adminNotesInput.trim(),
        approve_suggested: true
      };
      if (targetProductId) {
        payload.product_id = targetProductId;
      }

      await api.supplies.agreeSupply(selectedSupply.id, payload);
      toast("Negotiated terms agreed & supply accepted into master stock!", "success");
      setSuccessModal({
        isOpen: true,
        productName: prodName,
      });
      setSelectedSupply(null);
      loadSupplies();
    } catch (err: any) {
      toast(err.message || "Failed to agree terms.", "error");
    } finally {
      setIsSubmittingAgreement(false);
    }
  };

  const safeParseFloat = (val: any): number => {
    if (val === null || val === undefined) return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (val: any) => {
    if (val === null || val === undefined || val === '') return 'RWF 0';
    let num = safeParseFloat(val);
    if (num > 0 && num < 100) {
      num = Math.round(num * 1473.97);
    }
    return `RWF ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const statusMap: Record<string, string> = {
    'Pending Review': 'pending',
    'Accepted': 'accepted',
    'Rejected': 'rejected',
  };

  const loadSupplies = () => {
    setIsLoading(true);
    api.supplies.list()
      .then(res => {
        setSupplies(res || []);
      })
      .catch(err => {
        console.error("Failed to load supplies:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadSupplies();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeStatusTab, searchTerm]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedSupply]);

  const handleUpdateStatus = async (supplyId: number | string, newStatus: string) => {
    try {
      await api.supplies.update(supplyId, { status: newStatus });
      const supplyObj = supplies.find(s => s.id === supplyId);
      setSelectedSupply(null);
      loadSupplies();
      if (newStatus === 'accepted') {
        setSuccessModal({
          isOpen: true,
          productName: supplyObj?.product_detail?.name || 'Supply',
        });
      }
    } catch (err: any) {
      toast(err.message || "Failed to update supply status.", "error");
    }
  };

  const handleArchiveSupply = async (supplyId: number | string) => {
    try {
      await api.supplies.update(supplyId, { is_archived: true });
      setSelectedSupply(null);
      loadSupplies();
    } catch (err: any) {
      toast(err.message || "Failed to archive supply.", "error");
    }
  };

  const handleBulkArchive = async () => {
    try {
      await Promise.all(selectedIds.map(id => api.supplies.update(id, { is_archived: true })));
      setSelectedIds([]);
      loadSupplies();
    } catch (err: any) {
      console.error("Bulk archive failed:", err);
      toast("Failed to archive some items.", "error");
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm(
      "Bulk Delete Supplies",
      `Are you sure you want to permanently delete the ${selectedIds.length} selected supplies?`
    );
    if (!confirmed) return;
    try {
      await Promise.all(selectedIds.map(id => api.supplies.delete(id)));
      setSelectedIds([]);
      loadSupplies();
    } catch (err: any) {
      console.error("Bulk delete failed:", err);
      toast("Failed to delete some items.", "error");
    }
  };

  const filteredSupplies = supplies.filter(s => {
    // Archived tab shows only archived items
    if (activeStatusTab === 'Archived') {
      if (!s.is_archived) return false;
    } else if (activeStatusTab === 'All') {
      if (s.is_archived) return false;
    } else {
      // Other tabs show only non-archived items
      if (s.is_archived) return false;
      const backendStatus = statusMap[activeStatusTab];
      if (s.status !== backendStatus) return false;
    }

    const matchesSearch = searchTerm 
      ? (s.product_detail?.name || s.custom_product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.farmer_name || s.farmer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.product_detail?.category || s.custom_category || '').toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesSearch;
  });

  // Pagination calculations
  const suppliesPerPage = 8;
  const indexOfLastSupply = currentPage * suppliesPerPage;
  const indexOfFirstSupply = indexOfLastSupply - suppliesPerPage;
  const currentSupplies = filteredSupplies.slice(indexOfFirstSupply, indexOfLastSupply);
  const totalPages = Math.ceil(filteredSupplies.length / suppliesPerPage);

  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 min-h-[calc(100vh-56px)] flex flex-col bg-[#f9f9f7]">
      <div className="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-primary mb-1">Supply Logs</h2>
          <p className="text-sm text-on-surface-variant font-medium">Manage inbound stock proposals and bulk deals.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-surface-container-low p-1 rounded-lg shrink-0 overflow-x-auto">
            {['All', 'Pending Review', 'Accepted', 'Rejected', 'Archived'].map((t) => (
              <button 
                key={t} 
                onClick={() => setActiveStatusTab(t)}
                className={cn(
                  "px-4 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer whitespace-nowrap",
                  activeStatusTab === t ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 bg-primary/10 border border-primary/20 rounded-xl px-5 py-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-xs font-bold text-primary font-sans">
            {selectedIds.length} items selected
          </span>
          <div className="flex gap-2">
            {activeStatusTab !== 'Archived' && (
              <button
                onClick={handleBulkArchive}
                className="px-3.5 py-1.5 bg-[#144227] text-white rounded-lg font-mono text-[10px] uppercase tracking-wider hover:opacity-90 font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Archive size={12} /> Archive
              </button>
            )}
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 bg-[#8a3333] text-white rounded-lg font-mono text-[10px] uppercase tracking-wider hover:opacity-90 font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={12} /> Delete
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3.5 py-1.5 bg-white border border-[#c1c9c0] text-[#414942] rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-surface-container-low font-bold transition-all cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-on-surface-variant">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3 opacity-80" />
              <p className="text-sm font-bold text-primary">Loading supplies...</p>
              <p className="text-xs text-on-surface-variant/70 mt-0.5">Fetching latest stock proposals</p>
            </div>
          ) : filteredSupplies.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-on-surface-variant">
              <AlertCircle className="w-8 h-8 opacity-40 text-primary mb-2" />
              <p className="text-sm font-bold">No supplies found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-outline-variant bg-surface-container-low sticky top-0 z-10">
                <tr className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  <th className="px-4 py-3 text-center w-10">
                    <input 
                      type="checkbox"
                      checked={currentSupplies.length > 0 && currentSupplies.every(s => selectedIds.includes(s.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const idsToSelect = currentSupplies.map(s => s.id);
                          setSelectedIds(prev => Array.from(new Set([...prev, ...idsToSelect])));
                        } else {
                          const idsToRemove = currentSupplies.map(s => s.id);
                          setSelectedIds(prev => prev.filter(id => !idsToRemove.includes(id)));
                        }
                      }}
                      className="rounded border-[#c1c9c0] text-primary focus:ring-primary cursor-pointer w-4 h-4"
                    />
                  </th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Farmer</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3">Proposed vs Base</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {currentSupplies.map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedSupply(s)}
                    className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-4 text-center w-10" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, s.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== s.id));
                          }
                        }}
                        className="rounded border-[#c1c9c0] text-primary focus:ring-primary cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold">{s.product_detail?.name || s.custom_product_name || 'Crop'}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant font-mono uppercase tracking-widest">
                          {s.supply_number || s.supplyNumber || `SUP-${String(s.id).slice(0, 6).toUpperCase()}`} • {s.product_detail?.category || s.custom_category || 'General'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold">{s.farmer_name || 'Farmer'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-mono text-sm font-bold">{s.quantity} {s.unit}</p>
                      {s.status === 'accepted' && s.accepted_quantity !== undefined && s.accepted_quantity !== null ? (
                        <span className="inline-block text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase mt-0.5">
                          {s.accepted_quantity} {s.unit} accepted
                        </span>
                      ) : Number(s.quantity) === 0 ? (
                        <span className="inline-block text-[9px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase mt-0.5">Out of Stock</span>
                      ) : Number(s.quantity) <= 10 ? (
                        <span className="inline-block text-[9px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded uppercase mt-0.5">Low Stock</span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-primary">{formatCurrency(s.price || s.proposed_price)}</span>
                        <span className="text-[10px] text-on-surface-variant font-bold">vs {formatCurrency(s.base_price || s.product_detail?.base_price)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border",
                        Number(s.quantity) === 0 ? "bg-red-100 text-red-800 border-red-200" :
                        s.status === 'pending' ? "bg-amber-100 text-amber-800 border-amber-200" :
                        s.status === 'accepted' ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                        s.status === 'rejected' ? "bg-red-100 text-red-800 border-red-200" :
                        "bg-surface-container-highest text-on-surface-variant"
                      )}>
                        {s.is_archived ? 'Archived' : (Number(s.quantity) === 0 ? 'Out of Stock' : s.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!isLoading && totalPages > 1 && (
          <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between shrink-0">
            <span className="text-xs text-on-surface-variant font-bold">
              Showing {indexOfFirstSupply + 1}-{Math.min(indexOfLastSupply, filteredSupplies.length)} of {filteredSupplies.length} supplies
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-bold bg-white text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-bold bg-white text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {(() => {
        const isHarvestHillSubmission = selectedSupply && (
          (selectedSupply.farmer_name || '').toLowerCase().includes('harvest hill') ||
          (selectedSupply.farmer?.farm_name || '').toLowerCase().includes('harvest hill') ||
          selectedSupply.farmer?.user?.role === 'admin'
        );
        return (
          <DetailDrawer
            isOpen={!!selectedSupply}
            onClose={() => setSelectedSupply(null)}
            title={selectedSupply?.product_detail?.name || selectedSupply?.custom_product_name || 'Supply Details'}
            subtitle="Inbound Supply Manager"
        footer={
          selectedSupply && (
            <div className="space-y-2.5 w-full font-sans text-xs">
              {selectedSupply.status === 'pending' && !selectedSupply.is_archived && (
                <div>
                  <button 
                    onClick={async () => {
                      const confirmed = await showConfirm("Reject Supply Proposal", "Are you sure you want to reject this supply proposal?");
                      if (confirmed) {
                        handleUpdateStatus(selectedSupply.id, 'rejected');
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-[#7f1d1d] text-white rounded-xl font-bold hover:bg-red-800 transition-all cursor-pointer text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <X size={15} /> Reject Proposal
                  </button>
                </div>
              )}

              {!selectedSupply.is_archived && (
                <div className="w-full">
                  {isHarvestHillSubmission ? (
                    <button 
                      type="button"
                      onClick={() => {
                        const supToEdit = selectedSupply;
                        setSelectedSupply(null);
                        handleOpenEditModal(supToEdit);
                      }}
                      className="w-full py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-[#376847] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-sm"
                    >
                      <Edit3 size={14} /> Edit Supply
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => {
                        const supToNeg = selectedSupply;
                        setSelectedSupply(null);
                        setActiveNegotiationSupply(supToNeg);
                      }}
                      className="w-full py-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold hover:bg-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                      <Handshake size={14} /> Contextual Negotiation Pane
                    </button>
                  )}
                </div>
              )}

              {!selectedSupply.is_archived && (
                <div className="grid grid-cols-2 gap-2.5">
                  <button 
                    onClick={() => handleArchiveSupply(selectedSupply.id)}
                    className="w-full py-2.5 bg-white border border-outline-variant/60 text-on-surface rounded-xl font-bold hover:bg-surface-container-high transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Archive size={14} className="text-on-surface-variant" /> Archive
                  </button>
                  <button 
                    onClick={async () => {
                      const confirmed = await showConfirm(
                        "Delete Supply",
                        "Are you sure you want to permanently delete this supply?"
                      );
                      if (confirmed) {
                        try {
                          await api.supplies.delete(selectedSupply.id);
                          setSelectedSupply(null);
                          loadSupplies();
                        } catch (err: any) {
                          toast(err.message || "Failed to delete supply.", "error");
                        }
                      }
                    }}
                    className="w-full py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
              <button 
                onClick={() => setSelectedSupply(null)}
                className="w-full py-2.5 bg-surface-container-low border border-outline-variant/30 text-on-surface-variant rounded-xl font-bold hover:bg-surface-container-high transition-all cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          )
        }
      >
        {selectedSupply && (
          <div className="space-y-5 font-sans text-xs">
            {/* Multi-Image Gallery Selector */}
            {(() => {
              const galleryImages: string[] = [];
              const seen = new Set<string>();

              const getFullImageUrl = (url?: string | null) => {
                if (!url) return '';
                if (url.startsWith('http://') || url.startsWith('https://')) return url;
                const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
              };

              const addImg = (url?: string | null) => {
                if (!url) return;
                const fullUrl = getFullImageUrl(url);
                if (fullUrl && !seen.has(fullUrl)) {
                  seen.add(fullUrl);
                  galleryImages.push(fullUrl);
                }
              };

              // Prioritize custom batch photo
              addImg(selectedSupply.photo);

              // Add additional uploaded batch photos
              if (Array.isArray(selectedSupply.images) && selectedSupply.images.length > 0) {
                selectedSupply.images.forEach((imgObj: any) => {
                  addImg(imgObj.image_url || imgObj.image);
                });
              }

              // Fall back to catalog template image ONLY if no batch photos exist
              if (galleryImages.length === 0) {
                addImg(selectedSupply.product_detail?.image_url || selectedSupply.product_detail?.image);
              }

              if (galleryImages.length === 0) return null;

              const activeImg = galleryImages[activeImageIndex] || galleryImages[0];

              return (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center px-0.5">
                    <h4 className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">
                      Harvest Photos ({galleryImages.length})
                    </h4>
                    {galleryImages.length > 1 && (
                      <span className="text-[10px] text-on-surface-variant/70 font-mono">
                        {activeImageIndex + 1} of {galleryImages.length}
                      </span>
                    )}
                  </div>

                  {/* Main Active Image Display */}
                  <div className="h-56 w-full rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container-low shadow-sm relative group">
                    <img 
                      src={activeImg} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      alt="Selected harvest batch" 
                    />
                  </div>

                  {/* Interactive Thumbnail Gallery Selector */}
                  {galleryImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {galleryImages.map((imgUrl, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={cn(
                            "w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 bg-surface-container-low",
                            activeImageIndex === index 
                              ? "border-primary ring-2 ring-primary/20 scale-105 shadow-sm" 
                              : "border-outline-variant/40 opacity-70 hover:opacity-100 hover:border-outline"
                          )}
                        >
                          <img src={imgUrl} className="w-full h-full object-cover" alt={`Thumbnail ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Custom Crop Notice Banner */}
            {!selectedSupply.product && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl space-y-1">
                <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-700" /> Custom Crop Proposal
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  This harvest was submitted as a custom proposal. You can review all details and photos above before approving or rejecting.
                </p>
              </div>
            )}

            {/* Side-by-Side / Stacked Requirement vs Farmer Submission Comparison */}
            <div className="space-y-3 font-sans">
              {/* Requirement Box */}
              {(selectedSupply.product_detail || selectedSupply.custom_product_name) && (
                <div className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#E8E4DA] space-y-2.5">
                  <div className="flex justify-between items-center pb-1.5 border-b border-[#E8E4DA]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2D5A3D]">
                      Harvest Hill Requirement
                    </span>
                    <span className="text-[10px] font-bold text-[#717971]">
                      Deadline: {selectedSupply.product_detail?.submission_deadline || 'Open'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    {/* Left Side: Crop Requirement & Target Price */}
                    <div className="space-y-3 min-w-0 pr-1">
                      <div>
                        <span className="text-[9.5px] text-[#717971] font-bold block uppercase tracking-wider mb-0.5">Crop Requirement</span>
                        <span className="font-extrabold text-[#1C2A1E] leading-snug block break-words">
                          {selectedSupply.product_detail?.name || selectedSupply.custom_product_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-[#717971] font-bold block uppercase tracking-wider mb-0.5">Reference Target Price</span>
                        <span className="font-extrabold text-[#2D5A3D] block">
                          {formatCurrency(selectedSupply.product_detail?.base_price || selectedSupply.base_price || selectedSupply.price)} / {selectedSupply.unit}
                        </span>
                      </div>
                    </div>

                    {/* Right Side: Quantity Needed & Category (Separated with border-l divider) */}
                    <div className="space-y-3 min-w-0 pl-3.5 border-l border-[#E8E4DA]">
                      <div>
                        <span className="text-[9.5px] text-[#717971] font-bold block uppercase tracking-wider mb-0.5">Quantity Needed</span>
                        <span className="font-extrabold text-[#1C2A1E] block">
                          {(() => {
                            const templateQty = parseFloat(selectedSupply.product_detail?.quantity_needed || 0);
                            const displayQty = templateQty > 0 ? templateQty : parseFloat(selectedSupply.quantity || 0);
                            return `${displayQty.toLocaleString()} ${selectedSupply.unit}`;
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-[#717971] font-bold block uppercase tracking-wider mb-0.5">Category</span>
                        <span className="font-bold text-[#1C2A1E] block">
                          {selectedSupply.product_detail?.category || selectedSupply.custom_category || 'Vegetables'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedSupply.product_detail?.quality_requirements && (
                    <div className="pt-2 border-t border-[#E8E4DA] text-[11px] text-[#414942]">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#717971] block mb-1">Quality Requirements</span>
                      <p className="whitespace-pre-line font-mono text-[10.5px] bg-white p-2.5 rounded-lg border border-[#E8E4DA]">{selectedSupply.product_detail?.quality_requirements}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Farmer Submission Box */}
              <div className="p-3.5 bg-white rounded-xl border border-outline-variant/50 space-y-2 shadow-2xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-outline-variant/30">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                    Farmer Harvest Offer
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant">
                    Submitted by {selectedSupply.farmer_name || 'Partner Farm'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9.5px] text-on-surface-variant font-bold block uppercase tracking-wider">Available Quantity</span>
                    <span className="font-extrabold text-on-surface">{selectedSupply.quantity} {selectedSupply.unit}</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-on-surface-variant font-bold block uppercase tracking-wider">Farmer Asking Price</span>
                    <span className="font-extrabold text-primary">{formatCurrency(selectedSupply.price || selectedSupply.proposed_price)} / {selectedSupply.unit}</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-on-surface-variant font-bold block uppercase tracking-wider">Harvest Date</span>
                    <span className="font-bold text-on-surface">{selectedSupply.available_date || 'Freshly Harvested'}</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-on-surface-variant font-bold block uppercase tracking-wider">Farm Location</span>
                    <span className="font-medium text-on-surface-variant">{selectedSupply.farmer_location || 'Rwanda'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* B2B Term Agreement Form vs Finalized Stats Display */}
            {isHarvestHillSubmission ? null : selectedSupply.status === 'accepted' ? (
              <div className="p-4 bg-emerald-50/90 rounded-2xl border border-emerald-300/80 space-y-3 font-sans shadow-xs">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-700" /> Finalized B2B Terms & Stock Aggregated
                  </span>
                  <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase">
                    Deal Closed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                    <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Accepted Quantity</p>
                    <p className="text-sm font-extrabold text-emerald-950 mt-0.5">{selectedSupply.accepted_quantity || selectedSupply.quantity} {selectedSupply.unit}</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                    <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Agreed Farmer Price</p>
                    <p className="text-sm font-extrabold text-primary mt-0.5">{formatCurrency(selectedSupply.agreed_price || selectedSupply.price)} / {selectedSupply.unit}</p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 flex justify-between items-center shadow-2xs">
                  <span className="text-xs font-bold text-emerald-900">Total Batch Payout Value</span>
                  <span className="text-sm font-black text-secondary">
                    {formatCurrency((selectedSupply.accepted_quantity || selectedSupply.quantity) * (selectedSupply.agreed_price || selectedSupply.price))}
                  </span>
                </div>

                {selectedSupply.notes && (
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-800">Finalized Terms & Notes</p>
                    <p className="leading-relaxed font-medium">{selectedSupply.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <Handshake size={14} className="text-emerald-700" /> Negotiate Terms & Aggregate Inventory
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Harvest Hill Admin Tool
                  </span>
                </div>

                {/* Interactive Admin Negotiation Chat & Terms History Window */}
                <div className="space-y-2 font-sans">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-emerald-700" /> Negotiation Chat & Terms History
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {adminThread?.offers?.length || 0} Message{(adminThread?.offers?.length || 0) === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-3 bg-white/95 rounded-xl border border-emerald-300/80 space-y-2.5 shadow-2xs">
                    {isLoadingThread ? (
                      <div className="py-6 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
                        <RefreshCw size={14} className="animate-spin text-emerald-700" /> Loading negotiation chat...
                      </div>
                    ) : adminThread?.offers && adminThread.offers.length > 0 ? (
                      adminThread.offers.map((offer: any, idx: number) => {
                        const isFarmer = offer.sender === 'farmer';
                        return (
                          <div 
                            key={offer.id || idx}
                            className={cn(
                              "p-3 rounded-xl border text-xs font-sans space-y-1.5 relative group transition-all",
                              isFarmer 
                                ? "bg-amber-50/90 border-amber-200/90 text-amber-950" 
                                : "bg-emerald-50/90 border-emerald-200/90 text-emerald-950"
                            )}
                          >
                            {/* Hover Trash Delete Option */}
                            <button
                              type="button"
                              onClick={() => handleDeleteOfferTerm(offer.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-30 p-1 bg-red-100 text-red-700 rounded-full border border-red-200 hover:bg-red-200 cursor-pointer shadow-md"
                              title="Delete negotiation term"
                            >
                              <Trash2 size={11} />
                            </button>

                            {/* Header Row */}
                            <div className="flex items-center justify-between border-b border-black/5 pb-1">
                              <span className="text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                                <span className={cn(
                                  "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-bold text-white shadow-2xs",
                                  isFarmer ? "bg-amber-700" : "bg-emerald-800"
                                )}>
                                  {isFarmer ? 'FM' : 'HH'}
                                </span>
                                <span className="font-extrabold">{isFarmer ? (offer.sender_name || 'Farmer') : 'Harvest Hill Delivery'}</span>
                              </span>
                              <span className="text-[8px] font-mono opacity-70 pr-5">
                                {offer.created_at ? new Date(offer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                              </span>
                            </div>

                            {/* Proposed Specs */}
                            <div className="flex items-center gap-4 bg-white/80 p-2 rounded-lg border border-black/5 font-mono text-xs">
                              <div>
                                <p className="text-[8px] font-extrabold text-emerald-900 uppercase">Proposed Price</p>
                                <p className="font-black text-emerald-950">{formatCurrency(offer.price)} / {selectedSupply.unit}</p>
                              </div>
                              <div className="h-5 w-px bg-black/10" />
                              <div>
                                <p className="text-[8px] font-extrabold text-emerald-900 uppercase">Proposed Qty</p>
                                <p className="font-black text-emerald-950">{offer.quantity} {selectedSupply.unit}</p>
                              </div>
                            </div>

                            {/* Custom Terms or Notes */}
                            {(offer.terms || offer.message) && (
                              <p className="text-[11px] font-medium leading-relaxed bg-white/60 p-2 rounded-lg border border-black/5 text-emerald-950">
                                {offer.terms || offer.message}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 text-xs space-y-1">
                        <span className="text-[9px] font-extrabold text-amber-900 uppercase tracking-wider block">Farmer Submission Notes</span>
                        <p className="text-amber-950 font-medium leading-relaxed">
                          {selectedSupply.notes || "No custom notes submitted with initial harvest."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                      Submitted Qty ({selectedSupply.unit})
                    </label>
                    <div className="px-3 py-2 bg-emerald-100/50 rounded-xl font-bold text-xs text-emerald-950 border border-emerald-200">
                      {selectedSupply.quantity} {selectedSupply.unit}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                      Agreed Accepted Qty ({selectedSupply.unit})
                    </label>
                    <input 
                      type="number" 
                      value={agreedQtyInput} 
                      onChange={(e) => setAgreedQtyInput(e.target.value)}
                      placeholder={`e.g. ${selectedSupply.quantity}`}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 font-bold text-xs outline-none focus:border-emerald-700 text-emerald-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                      Proposed Price
                    </label>
                    <div className="px-3 py-2 bg-emerald-100/50 rounded-xl font-bold text-xs text-emerald-950 border border-emerald-200">
                      {formatCurrency(selectedSupply.price)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                      Agreed Farmer Price (RWF)
                    </label>
                    <input 
                      type="number" 
                      value={agreedPriceInput} 
                      onChange={(e) => setAgreedPriceInput(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 font-bold text-xs outline-none focus:border-emerald-700 text-emerald-950"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[9px] font-extrabold uppercase text-emerald-950">Target Master Product</label>
                  <select
                    value={targetProductId}
                    onChange={(e) => setTargetProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 font-bold text-xs outline-none focus:border-emerald-700 text-emerald-950 cursor-pointer"
                  >
                    <option value="">
                      {selectedSupply.is_suggested_product || !selectedSupply.product
                        ? `[Approve Suggested Master Product: "${selectedSupply.suggested_product_name || selectedSupply.custom_product_name}"]`
                        : `-- Select Existing Master Product Template --`}
                    </option>
                    {masterProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category} - {formatCurrency(p.base_price)}/{p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Custom Terms / Admin Notes Text Field */}
                <div className="space-y-1 pt-1">
                  <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                    Optional Custom Terms / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="Add optional delivery or payment terms..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-medium outline-none focus:border-emerald-700 text-emerald-950 resize-none placeholder:text-emerald-900/40"
                  />
                </div>

                {/* Validation Warning Feedback */}
                {(() => {
                  const parsedQty = parseFloat(agreedQtyInput || '0');
                  const parsedPrice = parseFloat(agreedPriceInput || '0');
                  const isInvalid = isNaN(parsedQty) || parsedQty <= 0 || isNaN(parsedPrice) || parsedPrice <= 0;

                  if (isInvalid) {
                    return (
                      <div className="p-2 rounded-lg bg-red-100 border border-red-300 text-[10px] font-bold text-red-800 text-center">
                        Accepted quantity and agreed farmer price must both be greater than 0.
                      </div>
                    );
                  }
                  return null;
                })()}

                {(() => {
                  const parsedQty = parseFloat(agreedQtyInput || '0');
                  const parsedPrice = parseFloat(agreedPriceInput || '0');
                  const isInvalid = isNaN(parsedQty) || parsedQty <= 0 || isNaN(parsedPrice) || parsedPrice <= 0;

                  const latestOffer = adminThread?.offers && adminThread.offers.length > 0
                    ? adminThread.offers[adminThread.offers.length - 1]
                    : null;

                  const origQty = latestOffer
                    ? parseFloat(String(latestOffer.quantity))
                    : parseFloat(String(selectedSupply.accepted_quantity ?? selectedSupply.quantity ?? '0'));

                  const origPrice = latestOffer
                    ? parseFloat(String(latestOffer.price))
                    : parseFloat(String(selectedSupply.agreed_price ?? (selectedSupply.proposed_price || selectedSupply.price || '0')));

                  const isQtyChanged = Math.abs(parsedQty - origQty) > 0.001;
                  const isPriceChanged = Math.abs(parsedPrice - origPrice) > 0.001;
                  const isNotesEntered = adminNotesInput.trim().length > 0;
                  const isProductSelected = !!targetProductId && String(targetProductId) !== String(selectedSupply.product || '');

                  const isTermsUpdated = isQtyChanged || isPriceChanged || isNotesEntered || isProductSelected;
                  const isCounterDisabled = isSubmittingAgreement || isInvalid || !isTermsUpdated;

                  return (
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isCounterDisabled}
                        onClick={handleCounterSupply}
                        className="flex-1 py-3 bg-[#2c5234] hover:bg-[#1e3a29] text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title={
                          isInvalid
                            ? "Accepted quantity and agreed price must both be greater than 0"
                            : !isTermsUpdated
                            ? "Modify price, quantity, custom notes, or target product to enable counter button"
                            : "Send counter-proposal terms to farmer"
                        }
                      >
                        <Send size={15} /> Counter
                      </button>
                      <button
                        type="button"
                        disabled={isSubmittingAgreement || isInvalid}
                        onClick={handleAgreeSupply}
                        className="flex-1 py-3 bg-[#144227] hover:bg-[#0f2e1b] text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title={isInvalid ? "Accepted quantity and agreed price must both be greater than 0" : "Accept terms and finalize harvest into master stock"}
                      >
                        <CheckCircle2 size={15} /> Accept
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20">
              <span className="text-xs text-on-surface-variant font-bold">Total Valued Batch Price</span>
              <span className="text-sm font-black text-secondary">
                {formatCurrency(safeParseFloat(selectedSupply.price || selectedSupply.proposed_price) * safeParseFloat(selectedSupply.quantity))}
              </span>
            </div>
          </div>
        )}
      </DetailDrawer>
    );
  })()}

      {/* Success Modal Pop-up */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/50 transform scale-100 transition-all space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-700">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-extrabold text-[#144227]">
              Proposal Accepted!
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              The supply proposal for <strong className="text-primary">{successModal.productName}</strong> has been accepted successfully.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setSuccessModal({ isOpen: false, productName: '' })}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold font-sans text-base hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Direct Edit Supply Modal */}
      {editSupply && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/60 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-on-surface">Edit Harvest / Supply Listing</h3>
                <p className="text-xs text-on-surface-variant font-medium">Harvest Hill Admin Direct Supply Manager</p>
              </div>
              <button
                type="button"
                onClick={() => setEditSupply(null)}
                className="p-1.5 rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-on-surface-variant">Quantity</label>
                  <input
                    type="number"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl font-bold text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-on-surface-variant">Unit</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl font-bold text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-on-surface-variant">Price per Unit (RWF)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl font-bold text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-on-surface-variant">Notes / Admin Terms</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Enter supply notes or delivery terms..."
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-medium text-on-surface outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-outline-variant/30">
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveAdminEdit}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-[#376847] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Save size={15} /> {isSavingEdit ? "Saving..." : "Save Supply Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditSupply(null)}
                className="px-5 py-3 bg-surface-container-low border border-outline-variant/40 text-on-surface-variant rounded-xl font-bold text-xs hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Negotiation Pane */}
      <ContextualNegotiationPane
        isOpen={!!activeNegotiationSupply}
        onClose={() => setActiveNegotiationSupply(null)}
        contextType="FARMER"
        supply={activeNegotiationSupply}
        currentUserRole="admin"
        onNegotiationUpdated={() => loadSupplies()}
      />
    </div>
  );
}
