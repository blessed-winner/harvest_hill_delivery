"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2, Package } from 'lucide-react';
import { clientApi } from '../lib/api';

interface OrderHistoryProps {
  onNavigate: (screen: string) => void;
}

export default function OrderHistory({ onNavigate }: OrderHistoryProps) {
  const [activeFilter, setActiveFilter] = useState('All Orders');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = ['All Orders', 'pending', 'approved', 'shipped', 'delivered', 'cancelled'];

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const status = activeFilter === 'All Orders' ? undefined : activeFilter;
        const response = await clientApi.orders.list(status);
        setOrders(response || []);
      } catch (err: any) {
        console.error('Failed to fetch orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [activeFilter]);

  const handleToggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'delivered') return 'bg-[#f0eee7] text-[#414942]';
    if (statusLower === 'shipped' || statusLower === 'approved') return 'bg-[#bceec8] text-[#00210f]';
    if (statusLower === 'pending') return 'bg-[#ffdcc5] text-[#301400]';
    if (statusLower === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-[#f0eee7] text-[#414942]';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight font-sans">Order History</h1>
        <p className="text-xs text-[#717971] mt-0.5">Manage your recent farm-to-table procurement and track shipments.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e2db] pb-4">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer capitalize ${
                isActive
                  ? 'bg-[#144227] text-white shadow-sm'
                  : 'bg-[#f0eee7]/60 text-[#414942] hover:bg-[#f0eee7] hover:text-[#144227]'
              }`}
            >
              {filter === 'All Orders' ? filter : filter}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#144227] animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#717971]">Loading orders...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center shadow-sm">
          <Package className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1c1c18] mb-2">Unable to Load Orders</h3>
          <p className="text-sm text-[#717971] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center shadow-sm">
          <Package className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1c1c18] mb-2">No Orders Found</h3>
          <p className="text-sm text-[#717971] mb-4">
            {activeFilter === 'All Orders' 
              ? "You haven't placed any orders yet" 
              : `No orders found for status "${activeFilter}"`}
          </p>
          <button
            onClick={() => onNavigate('catalog')}
            className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-4">
        {orders.map((order: any) => {
          const isExpanded = expandedOrder === order.id;
          const statusColor = getStatusColor(order.status);
          const itemCount = order.items?.length || 0;
          const totalAmount = order.total_amount || 0;
          
          return (
            <div
              key={order.id}
              className="bg-white border border-[#e5e2db] rounded-2xl shadow-sm overflow-hidden transition-all duration-200"
            >
              
              {/* Order Row Header */}
              <div
                onClick={() => handleToggleExpand(order.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-[#fcf9f2]/40"
              >
                
                {/* Left side: Order metadata */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#f6f3ec] rounded-xl overflow-hidden flex-shrink-0 border border-[#e5e2db] flex items-center justify-center">
                    <Package className="w-8 h-8 text-[#144227]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[10px] font-bold text-[#717971] font-mono">Order #{order.id}</span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor}`}>
                        {order.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-[#1c1c18] mt-1">
                      {order.delivery_address || 'Order'}
                    </h3>
                    <p className="text-[10px] text-[#717971] font-medium mt-0.5">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'} • 
                      {itemCount} Items • 
                      <span className="font-bold text-[#1c1c18]"> ${totalAmount.toFixed(2)}</span>
                    </p>
                  </div>
                </div>

                {/* Right side: Caret */}
                <div className="self-end md:self-auto text-right text-[#717971]">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

              </div>

              {/* Expandable Order Details Drawer */}
              {isExpanded && order.items && (
                <div className="bg-[#fcf9f2]/30 border-t border-[#f0eee7] px-5 py-4 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#f0eee7] pb-2">
                    <span className="text-[10px] font-bold text-[#717971] uppercase tracking-wider">Item Breakdown</span>
                  </div>
                  
                  <div className="space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-[#414942]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#376847] rounded-full" />
                          <span className="font-bold text-[#1c1c18]">{item.product_name || item.product_id}</span>
                        </div>
                        <div className="flex gap-10">
                          <span className="text-[#717971] font-semibold">Qty: {item.quantity}</span>
                          <span className="font-bold text-[#1c1c18]">
                            ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-[#f0eee7] pt-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#1c1c18]">Total Amount</span>
                    <span className="text-base font-bold text-[#144227]">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
      )}

    </div>
  );
}
