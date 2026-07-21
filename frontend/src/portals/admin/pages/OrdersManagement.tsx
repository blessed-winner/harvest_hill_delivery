import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, ShoppingCart, CheckCircle, Truck, Trash2, 
  MoreVertical, Handshake, ChevronRight, X, AlertCircle, Archive, CheckSquare, Square 
} from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

interface OrdersManagementProps {
  searchTerm?: string;
}

export function OrdersManagement({ searchTerm = '' }: OrdersManagementProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('All');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const loadOrders = () => {
    setIsLoading(true);
    api.orders.list()
      .then(res => {
        setOrders(res || []);
        setSelectedIds([]);
      })
      .catch(err => {
        console.error("Failed to load orders:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab, searchTerm]);

  const handleUpdateStatus = async (orderId: number | string, newStatus: string) => {
    try {
      await api.orders.update(orderId, { status: newStatus });
      setSelectedOrder(null);
      loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to update order status.");
    }
  };

  const handleArchiveOrder = async (orderId: number | string, archiveState = true) => {
    try {
      await api.orders.update(orderId, { is_archived: archiveState });
      setSelectedOrder(null);
      loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to update archive status.");
    }
  };

  const handleDeleteOrder = async (orderId: number | string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await api.orders.delete(orderId);
      setSelectedOrder(null);
      loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to delete order.");
    }
  };

  // Bulk Operations
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected orders?`)) return;
    
    setIsProcessingBulk(true);
    try {
      await Promise.all(selectedIds.map(id => api.orders.delete(id)));
      loadOrders();
    } catch (err: any) {
      alert("Error performing bulk deletion.");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkArchive = async (archiveState = true) => {
    if (selectedIds.length === 0) return;
    setIsProcessingBulk(true);
    try {
      await Promise.all(selectedIds.map(id => api.orders.update(id, { is_archived: archiveState })));
      loadOrders();
    } catch (err: any) {
      alert("Error performing bulk archive.");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleGenerateDeliveryNote = async (order: any) => {
    try {
      await api.deliveryNotes.create({
        order: order.id,
        details: `Logistics note for Order #${order.id} shipped to ${order.delivery_address}.`,
        status: 'pending'
      });
      alert(`Delivery note for Order #${order.id} generated successfully!`);
    } catch (err: any) {
      alert(err.message || "Failed to generate delivery note.");
    }
  };

  const getFrontendStatus = (order: any) => {
    if (order.is_archived) return 'ARCHIVED';
    switch (order.status) {
      case 'pending': return 'SUBMITTED';
      case 'processing': return 'APPROVED';
      case 'shipped': return 'IN DELIVERY';
      case 'delivered': return 'COMPLETED';
      case 'cancelled': return 'CANCELLED';
      default: return String(order.status).toUpperCase();
    }
  };

  const filteredOrders = orders.filter(o => {
    const statusLabel = getFrontendStatus(o);
    const matchesTab = activeTab === 'All' 
      ? !o.is_archived 
      : activeTab === 'Archived' 
        ? o.is_archived 
        : !o.is_archived && statusLabel === activeTab.toUpperCase();

    const matchesSearch = searchTerm 
      ? String(o.id).includes(searchTerm) || 
        (o.client_detail?.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (o.client_detail?.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return matchesTab && matchesSearch;
  });

  const getOrderTotal = (order: any) => {
    if (order.total_amount && parseFloat(order.total_amount) > 0) return parseFloat(order.total_amount);
    if (order.total_price && parseFloat(order.total_price) > 0) return parseFloat(order.total_price);
    return (order.items || []).reduce((acc: number, item: any) => acc + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)), 0);
  };

  const getStatusSteps = (order: any) => {
    const s = order.status;
    return [
      { label: 'Order Submitted', time: new Date(order.created_at).toLocaleString(), status: 'completed' },
      { label: 'Pending Approval', time: s !== 'pending' ? 'Verified' : 'Awaiting verification', status: s !== 'pending' ? 'completed' : 'active' },
      { label: 'Processing & Pack', time: (s === 'shipped' || s === 'delivered') ? 'Packed' : s === 'processing' ? 'Processing' : 'Not started', status: (s === 'shipped' || s === 'delivered') ? 'completed' : s === 'processing' ? 'active' : 'upcoming' },
      { label: 'In Delivery', time: s === 'delivered' ? 'Delivered' : s === 'shipped' ? 'In Transit' : 'Not dispatched', status: s === 'delivered' ? 'completed' : s === 'shipped' ? 'active' : 'upcoming' },
    ];
  };

  // Pagination calculations
  const ordersPerPage = 8;
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Selection handlers
  const isAllSelected = currentOrders.length > 0 && currentOrders.every(o => selectedIds.includes(o.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !currentOrders.some(co => co.id === id)));
    } else {
      const currentOrderIds = currentOrders.map(o => o.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentOrderIds])));
    }
  };

  const toggleSelectOrder = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#f9f9f7]">
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 shrink-0 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-primary">Orders Management</h2>
            <p className="mt-1 text-sm text-on-surface-variant font-medium">Track submissions, approvals, and delivery progress.</p>
          </div>

          {/* Bulk Operations Toolbar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 bg-surface-container-high px-4 py-2 rounded-xl border border-outline-variant animate-fadeIn">
              <span className="text-xs font-bold text-primary">{selectedIds.length} Selected</span>
              <div className="w-[1px] h-4 bg-outline-variant" />
              {activeTab !== 'Archived' ? (
                <button
                  onClick={() => handleBulkArchive(true)}
                  disabled={isProcessingBulk}
                  className="px-3 py-1.5 bg-white border border-outline-variant hover:bg-surface-container-low text-on-surface text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Archive size={14} /> Archive Selected
                </button>
              ) : (
                <button
                  onClick={() => handleBulkArchive(false)}
                  disabled={isProcessingBulk}
                  className="px-3 py-1.5 bg-white border border-outline-variant hover:bg-surface-container-low text-on-surface text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Archive size={14} /> Unarchive Selected
                </button>
              )}
              <button
                onClick={handleBulkDelete}
                disabled={isProcessingBulk}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Filter Tabs */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl w-full sm:w-fit overflow-x-auto max-w-full scrollbar-none">
          {['All', 'Submitted', 'Approved', 'In Delivery', 'Completed', 'Archived'].map((tab) => {
            const count = tab === 'All' 
              ? orders.filter(o => !o.is_archived).length 
              : tab === 'Archived'
                ? orders.filter(o => o.is_archived).length
                : orders.filter(o => !o.is_archived && getFrontendStatus(o) === tab.toUpperCase()).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
                  activeTab === tab ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                {tab} <span className="bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded text-[10px]">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="h-full min-h-0 bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col justify-between">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center text-on-surface-variant font-medium animate-pulse">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center text-on-surface-variant">
                <AlertCircle className="w-8 h-8 opacity-40 text-primary mb-2" />
                <p className="text-sm font-bold">No orders found.</p>
                <p className="text-xs">There are no orders that match your active filters or search terms.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">
                      <button onClick={toggleSelectAll} className="cursor-pointer text-on-surface-variant hover:text-primary">
                        {isAllSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                      </button>
                    </th>
                    <th className="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Order ID</th>
                    <th className="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Client Name</th>
                    <th className="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Items</th>
                    <th className="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total</th>
                    <th className="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {currentOrders.map((order) => {
                    const frontendStatus = getFrontendStatus(order);
                    const isSelected = selectedIds.includes(order.id);
                    return (
                      <tr 
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={cn(
                          "hover:bg-surface-container-high transition-colors cursor-pointer group border-l-4",
                          selectedOrder?.id === order.id ? "bg-surface-container-high border-l-primary" : "border-l-transparent",
                          isSelected && "bg-primary/5"
                        )}
                      >
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => toggleSelectOrder(order.id, e)} className="cursor-pointer text-on-surface-variant hover:text-primary">
                            {isSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                          </button>
                        </td>
                        <td className="py-3 px-6 font-mono text-[13px] font-bold">#ORD-{order.id}</td>
                        <td className="py-3 px-6 text-sm">{order.client_detail?.business_name || order.client_detail?.user?.email || 'Client'}</td>
                        <td className="py-3 px-6 text-sm text-on-surface-variant">{(order.items || []).length} items</td>
                        <td className="py-3 px-6 font-mono text-sm font-bold">${getOrderTotal(order).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-6">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            order.is_archived ? "bg-gray-200 text-gray-700 border-gray-300" :
                            frontendStatus === 'SUBMITTED' ? "bg-primary/10 text-primary border-primary/20" :
                            frontendStatus === 'APPROVED' ? "bg-blue-100 text-blue-700 border-blue-200" :
                            frontendStatus === 'IN DELIVERY' ? "bg-amber-100 text-amber-700 border-amber-200" :
                            "bg-emerald-100 text-emerald-700 border-emerald-200"
                          )}>
                            {frontendStatus}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-xs text-on-surface-variant">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleArchiveOrder(order.id, !order.is_archived)}
                              title={order.is_archived ? "Unarchive" : "Archive"}
                              className="p-1.5 text-on-surface-variant hover:text-primary transition-colors cursor-pointer rounded"
                            >
                              <Archive size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              title="Delete"
                              className="p-1.5 text-on-surface-variant hover:text-red-600 transition-colors cursor-pointer rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                            <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors ml-1" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {!isLoading && totalPages > 1 && (
            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between shrink-0">
              <span className="text-xs text-on-surface-variant font-bold">
                Showing {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
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
      </div>

      <DetailDrawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order #ORD-${selectedOrder.id}` : ''}
        subtitle={selectedOrder ? `${selectedOrder.client_detail?.business_name || 'Client'} • ${(selectedOrder.items || []).length} Items` : ''}
        footer={
          selectedOrder && (
            <div className="space-y-3 w-full">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleGenerateDeliveryNote(selectedOrder)}
                  className="py-2.5 bg-surface-container-high text-on-surface font-bold rounded-lg hover:bg-surface-container-highest transition-colors cursor-pointer text-xs"
                >
                  Generate Delivery Note
                </button>
                {selectedOrder.status === 'pending' && !selectedOrder.is_archived && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                    className="py-2.5 bg-primary text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all cursor-pointer text-xs"
                  >
                    Approve Order
                  </button>
                )}
                {selectedOrder.status === 'processing' && !selectedOrder.is_archived && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                    className="py-2.5 bg-primary text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all cursor-pointer text-xs"
                  >
                    Ship Order
                  </button>
                )}
                {selectedOrder.status === 'shipped' && !selectedOrder.is_archived && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                    className="py-2.5 bg-primary text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all cursor-pointer text-xs"
                  >
                    Complete Order
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleArchiveOrder(selectedOrder.id, !selectedOrder.is_archived)}
                  className="py-2.5 bg-white border border-outline-variant text-on-surface rounded-lg font-bold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Archive className="w-4 h-4" /> {selectedOrder.is_archived ? 'Unarchive' : 'Archive'}
                </button>
                <button 
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 bg-surface-container-low border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-high transition-all cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-8">
            <section>
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Order Progress</h4>
              <div className="space-y-6">
                {getStatusSteps(selectedOrder).map((step, i, arr) => (
                  <div key={step.label} className="flex gap-4 relative">
                    {i < arr.length - 1 && (
                      <div className={cn(
                        "absolute left-[9px] top-6 w-[2px] h-[calc(100%+16px)]",
                        step.status === 'completed' ? "bg-primary" : "bg-outline-variant/30"
                      )} />
                    )}
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 shrink-0",
                      step.status === 'completed' ? "bg-primary border-primary text-white" :
                      step.status === 'active' ? "bg-white border-primary text-primary" :
                      "bg-white border-outline text-outline"
                    )}>
                      {step.status === 'completed' && <span className="text-[9px] font-bold">✓</span>}
                      {step.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{step.label}</p>
                      <p className="text-[10px] text-on-surface-variant">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Order Summary</h4>
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 divide-y divide-outline-variant/20">
                {(selectedOrder.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-2.5 first:pt-0 last:pb-0 text-xs">
                    <div>
                      <p className="font-bold">{item.product_detail?.name || item.product_name || `Product #${item.product}`}</p>
                      <p className="text-on-surface-variant/80 mt-0.5">{item.quantity} units • ${parseFloat(item.price).toFixed(2)}/unit</p>
                    </div>
                    <span className="font-mono font-bold">${(parseFloat(item.price) * parseFloat(item.quantity)).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 text-sm font-bold text-primary">
                  <span>Grand Total</span>
                  <span className="font-mono">${getOrderTotal(selectedOrder).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Delivery Details</h4>
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 text-xs space-y-1">
                <p><span className="font-bold text-on-surface-variant uppercase text-[10px]">Client:</span> {selectedOrder.client_detail?.business_name || 'Client'}</p>
                <p><span className="font-bold text-on-surface-variant uppercase text-[10px]">Address:</span> {selectedOrder.delivery_address || 'Not specified'}</p>
                <p><span className="font-bold text-on-surface-variant uppercase text-[10px]">Contact Email:</span> {selectedOrder.client_detail?.user?.email}</p>
              </div>
            </section>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
