import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, ShoppingCart, CheckCircle, Truck, Trash2, MoreVertical, Handshake, ChevronRight, X } from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';

export function OrdersManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('All');

  const statusMap: Record<string, string> = {
    'SUBMITTED': 'pending',
    'APPROVED': 'processing',
    'IN DELIVERY': 'shipped',
    'COMPLETED': 'delivered',
  };

  const loadOrders = () => {
    setIsLoading(true);
    api.orders.list()
      .then(res => {
        setOrders(res || []);
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

  const handleUpdateStatus = async (orderId: number | string, newStatus: string) => {
    try {
      await api.orders.update(orderId, { status: newStatus });
      setSelectedOrder(null);
      loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to update order status.");
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

  const getFrontendStatus = (backendStatus: string) => {
    switch (backendStatus) {
      case 'pending': return 'SUBMITTED';
      case 'processing': return 'APPROVED';
      case 'shipped': return 'IN DELIVERY';
      case 'delivered': return 'COMPLETED';
      case 'cancelled': return 'CANCELLED';
      default: return backendStatus.toUpperCase();
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'All') return true;
    return getFrontendStatus(o.status) === activeTab.toUpperCase();
  });

  const getOrderTotal = (order: any) => {
    return (order.items || []).reduce((acc: number, item: any) => acc + (parseFloat(item.price) * parseFloat(item.quantity)), 0);
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#f9f9f7]">
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 shrink-0 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-primary">Orders Management</h2>
            <p className="mt-1 text-sm text-on-surface-variant font-medium">Track submissions, approvals, and delivery progress.</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl w-fit">
          {['All', 'Submitted', 'Approved', 'In Delivery', 'Completed'].map((tab) => {
            const count = tab === 'All' ? orders.length : orders.filter(o => getFrontendStatus(o.status) === tab.toUpperCase()).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all",
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
        <div className="h-full min-h-0 bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center text-on-surface-variant font-medium">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-medium">No orders found.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Order ID</th>
                    <th className="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Client Name</th>
                    <th className="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Items</th>
                    <th className="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total</th>
                    <th className="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="py-3 px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filteredOrders.map((order) => {
                    const frontendStatus = getFrontendStatus(order.status);
                    return (
                      <tr 
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={cn(
                          "hover:bg-surface-container-high transition-colors cursor-pointer group border-l-4",
                          selectedOrder?.id === order.id ? "bg-surface-container-high border-l-primary" : "border-l-transparent"
                        )}
                      >
                        <td className="py-3 px-6 font-mono text-[13px] font-bold">#ORD-{order.id}</td>
                        <td className="py-3 px-6 text-sm">{order.client_detail?.business_name || order.client_detail?.user?.email || 'Client'}</td>
                        <td className="py-3 px-6 text-sm text-on-surface-variant">{(order.items || []).length} items</td>
                        <td className="py-3 px-6 font-mono text-sm font-bold">${getOrderTotal(order).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-6">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            frontendStatus === 'SUBMITTED' ? "bg-primary/10 text-primary border-primary/20" :
                            frontendStatus === 'APPROVED' ? "bg-blue-100 text-blue-700 border-blue-200" :
                            frontendStatus === 'IN DELIVERY' ? "bg-amber-100 text-amber-700 border-amber-200" :
                            "bg-gray-100 text-gray-700 border-gray-200"
                          )}>
                            {frontendStatus}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-xs text-on-surface-variant">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-6 text-right">
                          <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
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
                  className="py-3 bg-surface-container-high text-on-surface font-bold rounded-lg hover:bg-surface-container-highest transition-colors"
                >
                  Generate Delivery Note
                </button>
                {selectedOrder.status === 'pending' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                    className="py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all"
                  >
                    Approve Order
                  </button>
                )}
                {selectedOrder.status === 'processing' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                    className="py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all"
                  >
                    Ship Order
                  </button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                    className="py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all"
                  >
                    Complete Order
                  </button>
                )}
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-full py-3 bg-surface-container-low border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-high transition-all"
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
                        "absolute left-[11px] top-6 w-[2px] h-6",
                        step.status === 'completed' ? "bg-primary" : "bg-outline-variant"
                      )} />
                    )}
                    <div className={cn(
                      "z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                      step.status === 'completed' ? "bg-primary text-white" :
                      step.status === 'active' ? "border-2 border-primary bg-white" : "bg-surface-container-high"
                    )}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 fill-white text-primary" />
                      ) : step.status === 'active' ? (
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 bg-on-surface-variant/30 rounded-full" />
                      )}
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm font-bold",
                        step.status === 'upcoming' ? "text-on-surface-variant/50" : "text-on-surface"
                      )}>{step.label}</p>
                      <p className={cn(
                        "text-xs mt-0.5",
                        step.status === 'upcoming' ? "text-on-surface-variant/40" : "text-on-surface-variant"
                      )}>{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Itemized Breakdown</h4>
              </div>
              <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/30">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-outline-variant/30 bg-white/50">
                    <tr>
                      <th className="p-3 text-on-surface-variant/60 uppercase font-bold">Item</th>
                      <th className="p-3 text-on-surface-variant/60 uppercase font-bold text-right">Qty</th>
                      <th className="p-3 text-on-surface-variant/60 uppercase font-bold text-right">Negot.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {(selectedOrder.items || []).map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="p-3 font-medium">{item.product_detail?.name || 'Crop'}</td>
                        <td className="p-3 text-right font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono font-bold text-primary">${parseFloat(item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-surface-container-high/50 font-bold border-t border-outline-variant">
                    <tr>
                      <td className="p-3 text-right" colSpan={2}>Final Total</td>
                      <td className="p-3 text-right font-mono text-base">${getOrderTotal(selectedOrder).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-start gap-4 shadow-sm">
              <div>
                <h5 className="text-sm font-bold">{selectedOrder.client_detail?.business_name || 'Client Business'}</h5>
                <p className="text-xs text-on-surface-variant">{selectedOrder.client_detail?.phone || 'No phone set'}</p>
                <p className="text-xs text-on-surface-variant mt-1">Delivery Address: {selectedOrder.delivery_address}</p>
              </div>
            </section>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
