"use client";

import { useState } from 'react';
import { ChevronRight, Search, FileDown, Printer, Share2, FileText, ChevronLeft, X, CheckCircle, Clock } from 'lucide-react';

interface InvoicesProps {
  onNavigate: (screen: string) => void;
}

export default function Invoices({ onNavigate }: InvoicesProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('#INV-2024-0892');
  const [searchQuery, setSearchQuery] = useState('');

  const invoices = [
    {
      id: '#INV-2024-0892',
      order: 'Summer Heirloom Bundle',
      orderId: 'ORD-9921-X',
      date: 'Oct 12, 2023',
      amount: 1420.50,
      status: 'PAID',
      billTo: 'Green Plate Catering',
      billToAddr: '722 Market St, Suite 400, San Francisco, CA 94103',
      billToEmail: 'accounting@greenplate.io',
      items: [
        { desc: 'Organic Heirloom Tomatoes', qty: '200 lbs', rate: 4.50, amount: 900.00 },
        { desc: 'Baby Spinach Bunches', qty: '100 units', rate: 2.75, amount: 275.00 },
        { desc: 'Cold Storage Shipping', qty: '1', rate: 145.50, amount: 145.50 }
      ],
      subtotal: 1320.50,
      processing: 100.00
    },
    {
      id: '#INV-2024-0893',
      order: 'Bulk Organic Grains',
      orderId: 'ORD-9945-S',
      date: 'Oct 14, 2023',
      amount: 3210.00,
      status: 'PENDING',
      billTo: 'Grains & Oats Bakery',
      billToAddr: '58 Baker Avenue, Oakland, CA 94602',
      billToEmail: 'billing@grainsoats.co',
      items: [
        { desc: 'Red Winter Wheat Bulk', qty: '800 lbs', rate: 2.50, amount: 2000.00 },
        { desc: 'Organic Rolled Oats', qty: '500 lbs', rate: 2.10, amount: 1050.00 },
        { desc: 'Freight Dry Shipping', qty: '1', rate: 160.00, amount: 160.00 }
      ],
      subtotal: 3210.00, // Processing is zero for pending or included
      processing: 0.00
    },
    {
      id: '#INV-2024-0894',
      order: 'Artisan Dairy Selection',
      orderId: 'ORD-9988-K',
      date: 'Oct 15, 2023',
      amount: 845.20,
      status: 'PAID',
      billTo: 'Green Plate Catering',
      billToAddr: '722 Market St, Suite 400, San Francisco, CA 94103',
      billToEmail: 'accounting@greenplate.io',
      items: [
        { desc: 'Aged Sharp Cheddar Blocks', qty: '40 blocks', rate: 8.75, amount: 350.00 },
        { desc: 'Grass-fed Salted Butter', qty: '60 lbs', rate: 6.50, amount: 390.00 },
        { desc: 'Refrigerated Shipping', qty: '1', rate: 105.20, amount: 105.20 }
      ],
      subtotal: 845.20,
      processing: 0.00
    },
    {
      id: '#INV-2024-0895',
      order: 'Spring Root Harvest',
      orderId: 'ORD-1002-L',
      date: 'Oct 16, 2023',
      amount: 2100.00,
      status: 'PENDING',
      billTo: 'Urban Greens Café',
      billToAddr: '109 Valencia St, San Francisco, CA 94103',
      billToEmail: 'finance@urbangreens.com',
      items: [
        { desc: 'Rainbow Carrots Multi-pack', qty: '300 lbs', rate: 3.10, amount: 930.00 },
        { desc: 'Red Ember Shallots Bulk', qty: '400 lbs', rate: 2.75, amount: 1100.00 },
        { desc: 'Standard Logistics fee', qty: '1', rate: 70.00, amount: 70.00 }
      ],
      subtotal: 2100.00,
      processing: 0.00
    }
  ];

  // Find active selected invoice details
  const activeInvoice = invoices.find(inv => inv.id === selectedInvoiceId) || invoices[0];

  const filteredInvoices = invoices.filter(inv =>
    inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.order.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.orderId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-x-hidden">
      
      {/* Breadcrumbs */}
      <div className="text-xs text-[#717971] flex items-center gap-1.5">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer">Account</button>
        <ChevronRight size={12} />
        <span className="text-[#1c1c18] font-bold">Invoices</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight">Billing & Invoices</h1>
        <p className="text-xs text-[#717971] mt-0.5">Review and manage your farm-to-table procurement history.</p>
      </div>

      {/* Split Layout: Left Table, Right Preview Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* Left Table Section */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Controls row */}
          <div className="flex items-center gap-3 justify-between">
            <div className="relative flex-grow max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#717971]">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID or Order..."
                className="w-full pl-9 pr-4 py-2 border border-[#c1c9c0] bg-white rounded-lg text-xs placeholder-[#717971] focus:outline-none focus:border-[#144227] focus:ring-1 focus:ring-[#144227]"
              />
            </div>
            
            <button
              onClick={() => alert("Exporting all invoices...")}
              className="bg-[#144227] text-white hover:bg-[#376847] px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown size={14} /> Export All
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f6f3ec]/60 border-b border-[#e5e2db] text-[9px] uppercase font-extrabold tracking-wider text-[#717971]">
                    <th className="px-3 py-3">Invoice ID</th>
                    <th className="px-3 py-3 hidden sm:table-cell">Related Order</th>
                    <th className="px-3 py-3 hidden md:table-cell">Issue Date</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0eee7] text-xs">
                  {filteredInvoices.map((inv) => {
                    const isSelected = selectedInvoiceId === inv.id;
                    const isPaid = inv.status === 'PAID';
                    
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className={`hover:bg-[#f2efe7]/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#bceec8]/10' : ''
                        }`}
                      >
                        <td className="px-3 py-3 font-bold text-[#1c1c18]">{inv.id}</td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="block font-bold text-[#1c1c18]">{inv.order}</span>
                          <span className="block text-[10px] text-[#717971] font-mono mt-0.5">{inv.orderId}</span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell text-[#414942] font-semibold">{inv.date}</td>
                        <td className="px-3 py-3 font-extrabold text-[#1c1c18]">${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-[#bceec8] text-[#00210f]'
                              : 'bg-[#ffdcc5] text-[#301400]'
                          }`}>
                            {isPaid ? <CheckCircle size={10} /> : <Clock size={10} />}
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoiceId(inv.id);
                            }}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isSelected
                                ? 'bg-[#144227] text-white border-[#144227]'
                                : 'border-[#c1c9c0] text-[#717971] hover:bg-white hover:text-[#144227]'
                            }`}
                          >
                            <FileText size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-xs text-[#717971] italic">
                        No invoices found matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Count Row */}
            <div className="bg-[#f6f3ec]/30 border-t border-[#e5e2db] px-5 py-4 flex items-center justify-between text-xs text-[#717971]">
              <span>Showing {filteredInvoices.length} of 128 invoices</span>
              
              <div className="flex items-center gap-1.5">
                <button className="p-1 border border-[#c1c9c0] rounded hover:bg-white disabled:opacity-40" disabled>
                  <ChevronLeft size={14} />
                </button>
                <span className="font-bold text-[#1c1c18] px-2 text-[11px]">1 / 32</span>
                <button className="p-1 border border-[#c1c9c0] rounded hover:bg-white">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Preview Drawer Card */}
        <div className="bg-white border border-[#e5e2db] rounded-2xl shadow-md overflow-hidden sticky top-24">
          
          {/* Header Action Bar */}
          <div className="bg-[#f6f3ec]/60 border-b border-[#e5e2db] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1c1c18]">Invoice Preview</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => alert("Printing invoice...")} className="p-1.5 bg-white border border-[#c1c9c0] hover:bg-[#fcf9f2] rounded-lg text-[#717971] transition-colors" title="Print">
                <Printer size={14} />
              </button>
              <button onClick={() => alert("Sharing link...")} className="p-1.5 bg-white border border-[#c1c9c0] hover:bg-[#fcf9f2] rounded-lg text-[#717971] transition-colors" title="Share">
                <Share2 size={14} />
              </button>
              <button
                onClick={() => alert("Downloading PDF...")}
                className="bg-[#144227] text-white hover:bg-[#376847] px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <FileDown size={12} /> PDF
              </button>
            </div>
          </div>

          {/* Invoice Page Sheet */}
          <div className="p-6 font-sans space-y-6 text-[#1c1c18]">
            
            {/* Header info */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-lg font-black text-[#144227]">Harvest Hill</h3>
                <p className="text-[9px] uppercase font-bold tracking-widest text-[#717971] mt-0.5">Freshly Cultivated Supply Chain</p>
              </div>
              <div className="text-right">
                <span className="block text-xs uppercase font-extrabold text-[#717971]">INVOICE</span>
                <span className="block text-xs font-mono font-bold text-[#1c1c18]">{activeInvoice.id}</span>
              </div>
            </div>

            {/* Address Row */}
            <div className="grid grid-cols-2 gap-4 text-[10px] pt-4 border-t border-[#f0eee7]">
              <div>
                <span className="block font-bold uppercase tracking-wider text-[#717971] mb-1">From:</span>
                <p className="font-bold text-[#1c1c18]">Harvest Hill Supply Co.</p>
                <p className="text-[#414942] leading-relaxed mt-0.5">
                  482 Orchard Lane<br />
                  Napa Valley, CA 94558<br />
                  billing@harvestnapa.com
                </p>
              </div>
              <div>
                <span className="block font-bold uppercase tracking-wider text-[#717971] mb-1">Bill To:</span>
                <p className="font-bold text-[#144227]">{activeInvoice.billTo}</p>
                <p className="text-[#414942] leading-relaxed mt-0.5">
                  {activeInvoice.billToAddr}<br />
                  {activeInvoice.billToEmail}
                </p>
              </div>
            </div>

            {/* Items table */}
            <div className="pt-4 border-t border-[#f0eee7]">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-[#c1c9c0] text-[#717971] font-bold uppercase tracking-wider">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center w-16">Qty</th>
                    <th className="py-2 text-right w-20">Rate</th>
                    <th className="py-2 text-right w-20">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0eee7]">
                  {activeInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-bold text-[#1c1c18]">{item.desc}</td>
                      <td className="py-2 text-center font-semibold text-[#414942]">{item.qty}</td>
                      <td className="py-2 text-right text-[#414942]">${item.rate.toFixed(2)}</td>
                      <td className="py-2 text-right font-bold text-[#1c1c18]">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Totals */}
            <div className="border-t border-[#c1c9c0] pt-4 space-y-2 text-[10px] text-right ml-auto max-w-[200px]">
              <div className="flex justify-between text-[#414942]">
                <span>Subtotal</span>
                <span className="font-bold text-[#1c1c18]">${activeInvoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              
              {activeInvoice.processing > 0 && (
                <div className="flex justify-between text-[#414942]">
                  <span>Processing (0.5%)</span>
                  <span className="font-bold text-[#1c1c18]">${activeInvoice.processing.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="border-t border-[#f0eee7] pt-2 flex justify-between text-xs font-black text-[#1c1c18]">
                <span>Total</span>
                <span className="text-[#144227] text-sm">${activeInvoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="bg-[#fcf9f2] rounded-xl p-3 border border-[#e5e2db] text-[9px] text-[#717971] leading-relaxed">
              <span className="block font-bold uppercase tracking-wider text-[#1c1c18] mb-1">Terms & Conditions</span>
              Please make all checks payable to <span className="font-bold text-[#144227]">Harvest Hill Supply Co.</span> Payment is due within 30 days of the invoice issue date.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
