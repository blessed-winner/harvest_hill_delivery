import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Handshake, CheckCircle2, Archive, Check, X, RefreshCw } from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export function Supplies() {
  const [supplies, setSupplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupply, setSelectedSupply] = useState<any | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState('Pending Review');

  const statusMap: Record<string, string> = {
    'Pending Review': 'pending',
    'Accepted': 'accepted',
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

  const handleUpdateStatus = async (supplyId: number | string, newStatus: string) => {
    try {
      await api.supplies.update(supplyId, { status: newStatus });
      setSelectedSupply(null);
      loadSupplies();
    } catch (err: any) {
      alert(err.message || "Failed to update supply status.");
    }
  };

  const filteredSupplies = supplies.filter(s => {
    const backendStatus = statusMap[activeStatusTab];
    return s.status === backendStatus;
  });

  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 min-h-[calc(100vh-56px)] flex flex-col bg-[#f9f9f7]">
      <div className="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-primary mb-1">Supply Logs</h2>
          <p className="text-sm text-on-surface-variant font-medium">Manage inbound stock proposals and price agreements.</p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-lg">
          {['Pending Review', 'Accepted', 'Delivered'].map((t) => (
            <button 
              key={t} 
              onClick={() => setActiveStatusTab(t)}
              className={cn(
                "px-4 py-1.5 rounded-md font-bold text-xs transition-all",
                activeStatusTab === t ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant font-medium">Loading supplies...</div>
          ) : filteredSupplies.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-medium">No supplies found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-outline-variant bg-surface-container-low sticky top-0 z-10">
                <tr className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Farmer</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3">Proposed vs Base</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filteredSupplies.map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedSupply(s)}
                    className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold">{s.product_detail?.name || 'Crop'}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                          Category: {s.product_detail?.category || 'General'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold">{s.farmer_name || s.farmer || 'Farmer'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-mono text-sm font-bold">{s.quantity} {s.unit}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-primary">${parseFloat(s.price).toFixed(2)}</span>
                        <span className="text-[10px] text-on-surface-variant font-bold">vs ${parseFloat(s.base_price || 0).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                        s.status === 'pending' ? "bg-amber-100 text-amber-800" :
                        s.status === 'delivered' ? "bg-emerald-100 text-emerald-800" :
                        "bg-surface-container-highest text-on-surface-variant"
                      )}>
                        {s.status}
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
      </div>

      <DetailDrawer
        isOpen={!!selectedSupply}
        onClose={() => setSelectedSupply(null)}
        title={selectedSupply?.product_detail?.name || 'Supply Details'}
        subtitle="Inbound Supply Manager"
        footer={
          selectedSupply && (
            <div className="space-y-3 w-full">
              {selectedSupply.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleUpdateStatus(selectedSupply.id, 'accepted')}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white rounded-lg font-bold shadow-sm hover:opacity-90 transition-all"
                  >
                    <Check className="w-5 h-5" /> Accept Proposal
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedSupply.id, 'cancelled')}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-red-600 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-all"
                  >
                    <X className="w-5 h-5" /> Reject Proposal
                  </button>
                </div>
              )}
              {selectedSupply.status === 'accepted' && (
                <button 
                  onClick={() => handleUpdateStatus(selectedSupply.id, 'delivered')}
                  className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Archive className="w-5 h-5" /> Mark as Received
                </button>
              )}
              <button 
                onClick={() => setSelectedSupply(null)}
                className="w-full py-3 bg-surface-container-high text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-highest transition-all"
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
                <span className="text-xs text-on-surface-variant font-bold">Quantity</span>
                <span className="text-sm font-extrabold">{selectedSupply.quantity} {selectedSupply.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant font-bold">Proposed Price</span>
                <span className="text-sm font-extrabold text-primary">${parseFloat(selectedSupply.price).toFixed(2)} / {selectedSupply.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant font-bold">Market Base Price</span>
                <span className="text-sm font-extrabold text-outline">${parseFloat(selectedSupply.base_price || 0).toFixed(2)} / {selectedSupply.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant font-bold">Total Valued Price</span>
                <span className="text-sm font-extrabold text-secondary">
                  ${(parseFloat(selectedSupply.price) * parseFloat(selectedSupply.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    </div>
  );
}
