import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Handshake, CheckCircle2, Archive, Check, X, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useAlert } from '../../../context/AlertContext';

interface SuppliesProps {
  searchTerm?: string;
}

export function Supplies({ searchTerm = '' }: SuppliesProps) {
  const { toast, showConfirm } = useAlert();
  const [supplies, setSupplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupply, setSelectedSupply] = useState<any | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState('All');

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

  const safeParseFloat = (val: any): number => {
    if (val === null || val === undefined) return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const statusMap: Record<string, string> = {
    'Pending Review': 'pending',
    'Accepted': 'accepted',
    'Rejected': 'rejected',
    'Delivered': 'delivered',
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
      ? (s.product_detail?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.farmer_name || s.farmer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.product_detail?.category || '').toLowerCase().includes(searchTerm.toLowerCase())
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
          <p className="text-sm text-on-surface-variant font-medium">Manage inbound stock proposals and price agreements.</p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-lg shrink-0 overflow-x-auto">
          {['All', 'Pending Review', 'Accepted', 'Rejected', 'Delivered', 'Archived'].map((t) => (
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
            <div className="p-8 text-center text-on-surface-variant font-medium animate-pulse">Loading supplies...</div>
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
                        <p className="text-sm font-bold">{s.product_detail?.name || 'Crop'}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                          Category: {s.product_detail?.category || 'General'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold">{s.farmer_name || 'Farmer'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-mono text-sm font-bold">{s.quantity} {s.unit}</p>
                      {Number(s.quantity) === 0 ? (
                        <span className="inline-block text-[9px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase mt-0.5">Out of Stock</span>
                      ) : Number(s.quantity) <= 10 ? (
                        <span className="inline-block text-[9px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded uppercase mt-0.5">Low Stock</span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-primary">${safeParseFloat(s.price || s.proposed_price).toFixed(2)}</span>
                        <span className="text-[10px] text-on-surface-variant font-bold">vs ${safeParseFloat(s.base_price || s.product_detail?.base_price).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border",
                        Number(s.quantity) === 0 ? "bg-red-100 text-red-800 border-red-200" :
                        s.status === 'pending' ? "bg-amber-100 text-amber-800 border-amber-200" :
                        s.status === 'accepted' ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                        s.status === 'rejected' ? "bg-red-100 text-red-800 border-red-200" :
                        s.status === 'delivered' ? "bg-blue-100 text-blue-800 border-blue-200" :
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

      <DetailDrawer
        isOpen={!!selectedSupply}
        onClose={() => setSelectedSupply(null)}
        title={selectedSupply?.product_detail?.name || 'Supply Details'}
        subtitle="Inbound Supply Manager"
        footer={
          selectedSupply && (
            <div className="space-y-3 w-full">
              {selectedSupply.status === 'pending' && !selectedSupply.is_archived && (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleUpdateStatus(selectedSupply.id, 'accepted')}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white rounded-lg font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer"
                  >
                    <Check className="w-5 h-5" /> Accept Proposal
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedSupply.id, 'rejected')}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-red-600 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" /> Reject Proposal
                  </button>
                </div>
              )}
              {selectedSupply.status === 'accepted' && !selectedSupply.is_archived && (
                <button 
                  onClick={() => handleUpdateStatus(selectedSupply.id, 'delivered')}
                  className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Archive className="w-5 h-5" /> Mark as Received
                </button>
              )}
              {!selectedSupply.is_archived && (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleArchiveSupply(selectedSupply.id)}
                    className="w-full py-3 bg-surface-container-highest text-primary rounded-lg font-bold hover:bg-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#c1c9c0]"
                  >
                    <Archive className="w-5 h-5" /> Archive
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
                    className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5" /> Delete
                  </button>
                </div>
              )}
              <button 
                onClick={() => setSelectedSupply(null)}
                className="w-full py-3 bg-surface-container-high text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-highest transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          )
        }
      >
        {selectedSupply && (
          <div className="space-y-6">
            <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant font-bold">Farmer</span>
                <span className="text-sm font-extrabold">{selectedSupply.farmer_name || 'Farmer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant font-bold">Location</span>
                <span className="text-sm font-extrabold text-on-surface-variant">{selectedSupply.farmer_location || 'Rwanda'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant font-bold">Quantity</span>
                <span className="text-sm font-extrabold">{selectedSupply.quantity} {selectedSupply.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant font-bold">Proposed Price</span>
                <span className="text-sm font-extrabold text-primary">${safeParseFloat(selectedSupply.price || selectedSupply.proposed_price).toFixed(2)} / {selectedSupply.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant font-bold">Market Base Price</span>
                <span className="text-sm font-extrabold text-outline">${safeParseFloat(selectedSupply.base_price || selectedSupply.product_detail?.base_price).toFixed(2)} / {selectedSupply.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant font-bold">Total Valued Price</span>
                <span className="text-sm font-extrabold text-secondary">
                  ${(safeParseFloat(selectedSupply.price || selectedSupply.proposed_price) * safeParseFloat(selectedSupply.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {selectedSupply.notes && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Farmer Notes</h4>
                <p className="p-3 bg-surface-container-low rounded-xl text-sm border border-outline-variant/30">
                  {selectedSupply.notes}
                </p>
              </div>
            )}

            {selectedSupply.photo && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Batch Photo Preview</h4>
                <div className="h-48 rounded-xl overflow-hidden border border-outline-variant/30">
                  <img src={selectedSupply.photo} className="w-full h-full object-cover" alt="Supply Batch" />
                </div>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

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
    </div>
  );
}
