import React, { useState } from 'react';
import { Search, Filter, Plus, ShoppingCart, CheckCircle, Truck, Trash2, MoreVertical, Handshake, ChevronRight, X } from 'lucide-react';
import { Order } from '../../types';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const mockOrders: Order[] = [
  { id: '#HH-9421', client: 'Valley Fresh Grocers', items: 24, total: 1420.50, isNegotiated: true, status: 'SUBMITTED', date: 'Oct 24, 2023' },
  { id: '#HH-9420', client: 'Green Leaf Distribution', items: 112, total: 5890.00, isNegotiated: false, status: 'APPROVED', date: 'Oct 23, 2023' },
  { id: '#HH-9419', client: 'Sunshine Markets', items: 45, total: 2115.75, isNegotiated: true, status: 'IN DELIVERY', date: 'Oct 23, 2023' },
  { id: '#HH-9418', client: 'Root & Stem Co.', items: 8, total: 420.00, isNegotiated: false, status: 'COMPLETED', date: 'Oct 22, 2023' },
  { id: '#HH-9417', client: 'North Field Supply', items: 16, total: 980.25, isNegotiated: true, status: 'SUBMITTED', date: 'Oct 22, 2023' },
  { id: '#HH-9416', client: 'Harvest Lane Foods', items: 72, total: 3340.00, isNegotiated: false, status: 'APPROVED', date: 'Oct 21, 2023' },
  { id: '#HH-9415', client: 'Prairie Basket Co.', items: 31, total: 1525.40, isNegotiated: true, status: 'IN DELIVERY', date: 'Oct 20, 2023' },
  { id: '#HH-9414', client: 'Golden Acre Retail', items: 18, total: 760.90, isNegotiated: false, status: 'COMPLETED', date: 'Oct 20, 2023' },
  { id: '#HH-9413', client: 'Riverbend Produce', items: 52, total: 2489.30, isNegotiated: true, status: 'SUBMITTED', date: 'Oct 19, 2023' },
  { id: '#HH-9412', client: 'Summit Fresh Co.', items: 64, total: 4011.60, isNegotiated: false, status: 'APPROVED', date: 'Oct 18, 2023' },
  { id: '#HH-9411', client: 'Cedar Ridge Foods', items: 27, total: 1195.00, isNegotiated: true, status: 'IN DELIVERY', date: 'Oct 18, 2023' },
  { id: '#HH-9410', client: 'Blue Orchard Group', items: 15, total: 688.75, isNegotiated: false, status: 'COMPLETED', date: 'Oct 17, 2023' },
];

const statusSteps = [
  { label: 'Order Submitted', time: 'Oct 24, 2023 • 09:15 AM', status: 'completed' },
  { label: 'Pending Approval', time: 'Waiting for Admin verification', status: 'active' },
  { label: 'Processing & Pack', time: 'Not started', status: 'upcoming' },
  { label: 'In Delivery', time: 'Awaiting dispatch', status: 'upcoming' },
];

export function OrdersManagement() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(['#HH-9421', '#HH-9420', '#HH-9419']);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const totalPages = Math.max(1, Math.ceil(mockOrders.length / pageSize));
  const pagedOrders = mockOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allVisibleSelected = pagedOrders.length > 0 && pagedOrders.every(order => selectedIds.includes(order.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#f9f9f7]">
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 shrink-0 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-primary">Orders Management</h2>
            <p className="mt-1 text-sm text-on-surface-variant font-medium">Track submissions, approvals, and delivery progress.</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm font-bold hover:bg-surface-container-low transition-colors">
              <Filter className="w-4 h-4" /> Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-all">
              <Plus className="w-4 h-4" /> New Order
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl w-fit">
          {[
            { l: 'All', c: 128 },
            { l: 'Submitted', c: 12 },
            { l: 'Approved', c: 45 },
            { l: 'In Delivery', c: 68 },
            { l: 'Completed', c: 2104 },
          ].map((tab, i) => (
            <button
              key={tab.l}
              className={cn(
                "px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all",
                i === 0 ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {tab.l} <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px]",
                i === 0 ? "bg-primary/10 text-primary" : "bg-surface-container-highest text-on-surface-variant"
              )}>{tab.c.toLocaleString()}</span>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-primary-container text-on-primary-container px-4 py-3 rounded-lg mb-4 flex items-center justify-between shadow-sm border border-primary/20"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={true}
                    onChange={() => setSelectedIds([])}
                    className="w-4 h-4 rounded border-on-primary-container text-primary focus:ring-primary/40 bg-transparent"
                  />
                  <span className="text-sm font-bold">{selectedIds.length} orders selected</span>
                </div>
                <div className="h-4 w-px bg-on-primary-container/30" />
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1.5 hover:bg-on-primary-container/10 px-2 py-1 rounded transition-colors text-sm font-bold">
                    <CheckCircle className="w-4 h-4" /> Bulk Approve
                  </button>
                  <button className="flex items-center gap-1.5 hover:bg-on-primary-container/10 px-2 py-1 rounded transition-colors text-sm font-bold">
                    <Truck className="w-4 h-4" /> Ship Selected
                  </button>
                  <button className="flex items-center gap-1.5 hover:bg-on-primary-container/10 px-2 py-1 rounded transition-colors text-sm font-bold text-red-700">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold uppercase tracking-wider hover:underline"
              >
                Cancel selection
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="h-full min-h-0 bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input 
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(e) => setSelectedIds(e.target.checked ? Array.from(new Set([...selectedIds, ...pagedOrders.map(o => o.id)])) : selectedIds.filter(id => !pagedOrders.some(order => order.id === id)))}
                      className="w-4 h-4 rounded border-outline text-primary" 
                    />
                  </th>
                  <th className="py-3 px-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Order ID</th>
                  <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Client Name</th>
                  <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Items</th>
                  <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total</th>
                  <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Negotiated</th>
                  <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {pagedOrders.map((order) => (
                  <tr 
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={cn(
                      "hover:bg-surface-container-high transition-colors cursor-pointer group border-l-4",
                      selectedOrder?.id === order.id ? "bg-surface-container-high border-l-primary" : "border-l-transparent"
                    )}
                  >
                    <td className="py-3 px-4" onClick={(e) => { e.stopPropagation(); toggleSelect(order.id); }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(order.id)}
                        className="w-4 h-4 rounded border-outline text-primary" 
                        readOnly
                      />
                    </td>
                    <td className="py-3 px-2 font-mono text-[13px] font-bold">{order.id}</td>
                    <td className="py-3 px-4 text-sm">{order.client}</td>
                    <td className="py-3 px-4 text-sm text-on-surface-variant">{order.items} items</td>
                    <td className="py-3 px-4 font-mono text-sm font-bold">${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4">
                      {order.isNegotiated ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 w-fit">
                          <Handshake className="w-3 h-3 fill-emerald-800" /> YES
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/40 text-[10px] font-bold px-2 py-0.5 rounded-full border border-outline-variant/30 w-fit block">
                          NO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        order.status === 'SUBMITTED' ? "bg-primary/10 text-primary border-primary/20" :
                        order.status === 'APPROVED' ? "bg-blue-100 text-blue-700 border-blue-200" :
                        order.status === 'IN DELIVERY' ? "bg-amber-100 text-amber-700 border-amber-200" :
                        "bg-gray-100 text-gray-700 border-gray-200"
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant">{order.date}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-surface-container-low border-t border-outline-variant">
            <p className="text-xs text-on-surface-variant font-mono">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, mockOrders.length)} of {mockOrders.length} orders
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-outline-variant bg-white disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                    currentPage === page ? "bg-primary text-white border-primary" : "bg-white border-outline-variant hover:bg-surface-container-high"
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-outline-variant bg-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <DetailDrawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order ${selectedOrder.id}` : ''}
        subtitle={selectedOrder ? `${selectedOrder.client} • ${selectedOrder.items} Items` : ''}
        footer={
          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-surface-container-high text-on-surface font-bold rounded-lg hover:bg-surface-container-highest transition-colors">
              Generate Delivery Note
            </button>
            <button className="flex-1 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary/90 transition-all">
              Approve Order
            </button>
          </div>
        }
      >
        <div className="space-y-8">
          <section>
            <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Order Progress</h4>
            <div className="space-y-6">
              {statusSteps.map((step, i) => (
                <div key={step.label} className="flex gap-4 relative">
                  {i < statusSteps.length - 1 && (
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
              <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Negotiated Rates Applied</span>
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
                  {[
                    { name: 'Premium Honey Crisp Apples (Crate)', qty: 12, base: 45, neg: 38.50 },
                    { name: 'Organic Baby Spinach (Bulk Bag)', qty: 8, base: 18.25, neg: 15.00 },
                    { name: 'Artisanal Sourdough Loaf', qty: 4, base: 6.25, neg: 6.25 },
                  ].map((item, i) => (
                    <tr key={i}>
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3 text-right font-mono">{item.qty}</td>
                      <td className="p-3 text-right">
                        <div className="font-mono font-bold text-primary">${item.neg.toFixed(2)}</div>
                        {item.neg < item.base && (
                          <div className="text-[10px] text-on-surface-variant/50 line-through">${item.base.toFixed(2)}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-surface-container-high/50 font-bold border-t border-outline-variant">
                  <tr>
                    <td className="p-3 text-right" colSpan={2}>Final Total</td>
                    <td className="p-3 text-right font-mono text-base">$1,420.50</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-start gap-4 shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&q=80&w=200" 
              className="w-16 h-16 rounded-lg object-cover" 
              alt="Farm" 
            />
            <div>
              <h5 className="text-sm font-bold">Valley Fresh Grocers</h5>
              <p className="text-xs text-on-surface-variant">Tier 2 Enterprise Client</p>
              <button className="mt-3 flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-tight hover:underline">
                View Route Map
              </button>
            </div>
          </section>
        </div>
      </DetailDrawer>
    </div>
  );
}
