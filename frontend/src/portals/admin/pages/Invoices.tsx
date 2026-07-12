import React, { useState } from 'react';
import { Search, RefreshCw, Bell, Settings, AlertCircle, Wallet, ChevronRight, Download } from 'lucide-react';
import { Invoice } from '../types';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const mockInvoices: Invoice[] = [
  { id: 'BK-90211', client: 'Green Valley Organics', orderId: 'ORD-7721', amount: 12450.00, status: 'UNSYNCED', dueDate: 'Oct 24, 2023' },
  { id: 'BK-90212', client: 'Metro Wholesale Hub', orderId: 'ORD-7725', amount: 8210.50, status: 'SYNCED', dueDate: 'Oct 28, 2023' },
  { id: 'BK-90213', client: 'Sun-Drenched Farms', orderId: 'ORD-7729', amount: 4120.00, status: 'PENDING', dueDate: 'Nov 02, 2023' },
  { id: 'BK-90214', client: 'Alpine Distribution', orderId: 'ORD-7730', amount: 15000.00, status: 'SYNCED', dueDate: 'Nov 05, 2023' },
  { id: 'BK-90215', client: 'Urban Greens Collective', orderId: 'ORD-7735', amount: 3069.50, status: 'SYNCED', dueDate: 'Nov 10, 2023' },
  { id: 'BK-90216', client: 'Cedar Market Partners', orderId: 'ORD-7741', amount: 5775.25, status: 'PENDING', dueDate: 'Nov 12, 2023' },
  { id: 'BK-90217', client: 'Fresh Route SA', orderId: 'ORD-7744', amount: 9820.00, status: 'SYNCED', dueDate: 'Nov 15, 2023' },
  { id: 'BK-90218', client: 'North Coast Traders', orderId: 'ORD-7748', amount: 2415.75, status: 'UNSYNCED', dueDate: 'Nov 18, 2023' },
  { id: 'BK-90219', client: 'Prairie Foods Group', orderId: 'ORD-7750', amount: 10990.00, status: 'SYNCED', dueDate: 'Nov 20, 2023' },
  { id: 'BK-90220', client: 'Summit Pantry', orderId: 'ORD-7754', amount: 6890.40, status: 'PENDING', dueDate: 'Nov 23, 2023' },
];

export function Invoices() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(mockInvoices.length / pageSize));
  const pagedInvoices = mockInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#f9f9f7]">
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 shrink-0 space-y-5">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-primary">Invoices</h2>
            <div className="h-6 w-px bg-outline-variant mx-2" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Local demo refreshed 2m ago</span>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-bold hover:bg-emerald-200 transition-all">
            <RefreshCw className="w-4 h-4" /> Sync Now
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-red-50 text-red-800 rounded-xl border border-red-100">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-bold">3 invoices are flagged in the local demo ledger.</p>
          </div>
          <button className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-sm">
            Retry Sync
          </button>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-outline-variant">
            <div className="flex bg-surface-container-low rounded-lg p-1 shrink-0">
              {['All Invoices', 'Pending', 'Overdue', 'Paid'].map((t, i) => (
                <button 
                  key={t}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                    i === 0 ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
              <input 
                type="text" 
                placeholder="Search ID, Client or Order..."
                className="w-full h-10 pl-10 pr-4 bg-transparent border-none focus:ring-0 text-sm font-medium"
              />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 bg-primary text-white p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Pending</p>
              <h3 className="text-2xl font-bold">$42,850.00</h3>
            </div>
            <Wallet className="w-10 h-10 opacity-20" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="h-full min-h-0 bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">INVOICE ID (BIKANAWE)</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">CLIENT</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">RELATED ORDER</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">AMOUNT</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">STATUS</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">DUE DATE</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {pagedInvoices.map((inv) => (
                  <tr 
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-surface-container-high/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-primary">#{inv.id}</span>
                        {inv.status === 'UNSYNCED' && <RefreshCw className="w-3.5 h-3.5 text-red-500 animate-spin-slow" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{inv.client}</td>
                    <td className="px-6 py-4 font-mono text-[13px] text-on-surface-variant">{inv.orderId}</td>
                    <td className="px-6 py-4 font-mono text-sm font-extrabold">${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold tracking-tighter uppercase",
                        inv.status === 'SYNCED' ? "bg-emerald-100 text-emerald-800" :
                        inv.status === 'UNSYNCED' ? "bg-red-100 text-red-800" :
                        "bg-amber-100 text-amber-800"
                      )}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant font-bold">{inv.dueDate}</td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-surface-container-low border-t border-outline-variant">
            <p className="text-xs text-on-surface-variant font-mono">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, mockInvoices.length)} of {mockInvoices.length} invoices
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
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title="Invoice Details"
        subtitle={selectedInvoice ? `Reference: ${selectedInvoice.id}` : ''}
        className="max-w-[600px]"
        footer={
          <div className="flex justify-end gap-3">
            <button className="px-6 py-2.5 border border-outline-variant rounded-lg font-bold text-on-surface hover:bg-surface-container-high transition-all">Cancel</button>
            <button className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button className="px-6 py-2.5 bg-emerald-100 text-emerald-800 rounded-lg font-bold hover:bg-emerald-200 transition-all">Save Changes</button>
          </div>
        }
      >
        {selectedInvoice && (
          <div className="bg-surface-container-low p-6 rounded-lg">
            <div className="bg-white aspect-[1/1.414] p-8 shadow-md border border-outline-variant/30 flex flex-col font-sans">
              <div className="flex justify-between mb-10">
                <div>
                  <h3 className="text-xl font-extrabold text-primary tracking-tighter mb-1">HARVEST HILL</h3>
                  <div className="text-[9px] text-on-surface-variant leading-tight uppercase font-bold tracking-wider">
                    128 Supply Chain Way<br/>ZA 2000 • VAT: 4880231944
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-extrabold text-on-surface tracking-tighter">INVOICE</h2>
                  <p className="text-primary font-mono font-bold">#{selectedInvoice.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10 text-[10px] font-bold">
                <div>
                  <p className="text-on-surface-variant uppercase mb-2 border-b border-outline-variant pb-1">Bill To</p>
                  <p className="text-sm font-extrabold mb-1">{selectedInvoice.client}</p>
                  <p className="text-on-surface-variant font-medium">45 Industrial Ave, Suite 12<br/>Cape Town, 8001</p>
                </div>
                <div className="text-right">
                  <p className="text-on-surface-variant uppercase mb-2 border-b border-outline-variant pb-1">Details</p>
                  <div className="space-y-1 font-medium">
                    <p><span className="text-on-surface-variant">Issue Date:</span> Oct 10, 2023</p>
                    <p><span className="text-on-surface-variant">Due Date:</span> {selectedInvoice.dueDate}</p>
                    <p><span className="text-on-surface-variant">Order ID:</span> {selectedInvoice.orderId}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <table className="w-full text-left text-[10px]">
                  <thead className="border-b-2 border-primary text-primary">
                    <tr>
                      <th className="py-2 font-extrabold">DESCRIPTION</th>
                      <th className="py-2 text-center font-extrabold">QTY</th>
                      <th className="py-2 text-right font-extrabold">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {[
                      { d: 'Bulk Fresh Produce Supply - Grade A', q: '500 kg', t: 9000 },
                      { d: 'Logistics & Refrigerated Transport', q: '1 unit', t: 2500 },
                      { d: 'Eco-Friendly Packaging Surcharge', q: '50 units', t: 950 },
                    ].map((item, i) => (
                      <tr key={i}>
                        <td className="py-3 font-bold text-on-surface">{item.d}</td>
                        <td className="py-3 text-center font-mono text-on-surface-variant">{item.q}</td>
                        <td className="py-3 text-right font-mono font-extrabold">${item.t.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 pt-4 border-t-2 border-on-surface ml-auto w-1/2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-on-surface-variant">TOTAL DUE</span>
                  <span className="text-lg text-primary">${selectedInvoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="mt-12 text-[8px] text-on-surface-variant font-bold text-center border-t border-outline-variant/20 pt-4 uppercase tracking-widest">
                Generated in the local demo ledger.
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
