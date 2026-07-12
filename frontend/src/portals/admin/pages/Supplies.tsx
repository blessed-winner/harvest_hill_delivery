import React, { useState } from 'react';
import { Search, ChevronRight, Handshake, CheckCircle2, MessageSquare, Send, Archive, Check, X, RefreshCw } from 'lucide-react';
import { NegotiationMessage } from '../types';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const mockSupplies = [
  { id: '1', product: 'Organic Gala Apples', sku: 'FR-APP-GALA-02', farmer: 'Green Valley Orchards', region: 'Oregon, USA', qty: '2,400 lbs', prop: 1.42, market: 1.28, status: 'Negotiating' },
  { id: '2', product: 'Heirloom Carrots', sku: 'VG-CAR-HEIR-09', farmer: 'Rooted Earth Farm', region: 'California, USA', qty: '850 lbs', prop: 0.95, market: 0.98, status: 'Pending Review' },
  { id: '3', product: 'Raw Wildflower Honey', sku: 'PN-HON-WILD-15', farmer: 'Busy Bee Apiary', region: 'Vermont, USA', qty: '120 units', prop: 8.50, market: 8.50, status: 'Delivered' },
  { id: '4', product: 'Roma Tomatoes', sku: 'VG-TOM-ROMA-07', farmer: 'Sunrise Produce', region: 'Florida, USA', qty: '1,100 lbs', prop: 1.10, market: 1.05, status: 'Negotiating' },
  { id: '5', product: 'Baby Spinach', sku: 'VG-SPN-BABY-11', farmer: 'North Valley Farm', region: 'Texas, USA', qty: '430 lbs', prop: 2.20, market: 2.18, status: 'Pending Review' },
  { id: '6', product: 'Russet Potatoes', sku: 'VG-POT-RUSS-04', farmer: 'Prairie Root Farm', region: 'Idaho, USA', qty: '3,000 lbs', prop: 0.84, market: 0.81, status: 'Accepted' },
  { id: '7', product: 'Kale Bunches', sku: 'VG-KAL-BNCH-03', farmer: 'Cedar Crest Farm', region: 'Washington, USA', qty: '680 bunches', prop: 1.65, market: 1.59, status: 'Delivered' },
  { id: '8', product: 'Cucumber Crates', sku: 'VG-CUC-CRT-05', farmer: 'Mesa Verde Produce', region: 'Arizona, USA', qty: '1,250 lbs', prop: 1.08, market: 1.02, status: 'Negotiating' },
  { id: '9', product: 'Red Onions', sku: 'VG-ONI-RED-08', farmer: 'Prairie Root Farm', region: 'Idaho, USA', qty: '1,900 lbs', prop: 0.92, market: 0.89, status: 'Pending Review' },
  { id: '10', product: 'Butter Lettuce', sku: 'VG-LET-BUT-01', farmer: 'Riverbend Greens', region: 'Georgia, USA', qty: '240 heads', prop: 1.74, market: 1.71, status: 'Accepted' },
  { id: '11', product: 'Sweet Bell Peppers', sku: 'VG-PEP-SWE-06', farmer: 'Harvest Ridge Farm', region: 'North Carolina, USA', qty: '760 lbs', prop: 2.45, market: 2.39, status: 'Delivered' },
];

const mockMessages: NegotiationMessage[] = [
  { id: '1', sender: 'Green Valley Orchards', text: "Good morning. We're proposing a price of $1.42/lb for this batch of Organic Galas. The quality is exceptional this season due to the late rains.", timestamp: '10:42 AM', isAdmin: false },
  { id: '2', sender: 'Admin', text: 'Hi there. $1.42 is a bit higher than our current market ceiling of $1.30. Could you do $1.32 if we take the full 2,400 lbs?', timestamp: '11:15 AM', isAdmin: true },
  { id: '3', sender: 'Green Valley Orchards', text: 'We can meet halfway at $1.36. This includes immediate freight dispatch. This is our best offer for this grade.', timestamp: '11:30 AM', isAdmin: false },
];

export function Supplies() {
  const [selectedSupply, setSelectedSupply] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(mockSupplies.length / pageSize));
  const pagedSupplies = mockSupplies.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 min-h-[calc(100vh-56px)] flex flex-col bg-[#f9f9f7]">
      <div className="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-primary mb-1">Supply Negotiations</h2>
          <p className="text-sm text-on-surface-variant font-medium">Manage inbound stock proposals and price agreements.</p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-lg">
          {['Pending Review', 'Negotiating', 'Accepted', 'Delivered'].map((t, i) => (
            <button key={t} className={cn(
              "px-4 py-1.5 rounded-md font-bold text-xs transition-all",
              i === 1 ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
            )}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-outline-variant bg-surface-container-low sticky top-0 z-10">
              <tr className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-outline-variant text-primary" /></th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3">Proposed vs Market</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {pagedSupplies.map((s) => (
                <tr 
                  key={s.id} 
                  onClick={() => setSelectedSupply(s)}
                  className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded border-outline-variant text-primary" /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant">
                        <MessageSquare className="w-5 h-5 text-on-surface-variant/40" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{s.product}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">{s.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold">{s.farmer}</p>
                    <p className="text-[10px] text-on-surface-variant font-bold">{s.region}</p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="font-mono text-sm font-bold">{s.qty}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">${s.prop.toFixed(2)}</span>
                      <span className="text-[10px] text-on-surface-variant font-bold">vs ${s.market.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                      s.status === 'Negotiating' ? "bg-amber-100 text-amber-800" :
                      s.status === 'Delivered' ? "bg-emerald-100 text-emerald-800" :
                      "bg-surface-container-highest text-on-surface-variant"
                    )}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-surface-container-low border-t border-outline-variant">
          <p className="text-xs text-on-surface-variant font-mono">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, mockSupplies.length)} of {mockSupplies.length} proposals
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

      <DetailDrawer
        isOpen={!!selectedSupply}
        onClose={() => setSelectedSupply(null)}
        title={selectedSupply?.product || ''}
        subtitle="Supply Negotiation Hub"
        footer={
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white rounded-lg font-bold shadow-sm hover:opacity-90 transition-all">
                <Check className="w-5 h-5" /> Accept $1.36
              </button>
              <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-red-600 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-all">
                <X className="w-5 h-5" /> Reject Offer
              </button>
            </div>
            <button className="w-full py-3 bg-surface-container-high text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2">
              <Archive className="w-5 h-5" /> Mark as Received
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {mockMessages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex flex-col max-w-[85%]",
              msg.isAdmin ? "items-end self-end ml-auto" : "items-start"
            )}>
              <div className="flex items-center gap-2 mb-1.5">
                {!msg.isAdmin && <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{msg.sender}</span>}
                <span className="text-[10px] text-on-surface-variant/70 font-bold">{msg.timestamp}</span>
                {msg.isAdmin && <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Admin (You)</span>}
              </div>
              <div className={cn(
                "p-3 shadow-sm text-sm font-medium",
                msg.isAdmin 
                  ? "bg-primary text-white rounded-l-xl rounded-br-xl" 
                  : "bg-white border border-outline-variant text-on-surface rounded-r-xl rounded-bl-xl"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
          
          <div className="flex justify-center py-4">
            <div className="bg-surface-container-highest px-3 py-1 rounded-full text-[9px] font-extrabold text-on-surface-variant uppercase tracking-widest">
              Price Revision Proposed: $1.36 / lb
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant">
            <div className="relative">
              <textarea 
                className="w-full resize-none border-outline-variant rounded-lg text-sm font-medium focus:ring-primary focus:border-primary p-3 pr-12"
                placeholder="Write a counter-offer or message..."
                rows={2}
              />
              <button className="absolute right-2 bottom-2 p-2 bg-primary text-white rounded-lg hover:bg-primary-container transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </DetailDrawer>
    </div>
  );
}
