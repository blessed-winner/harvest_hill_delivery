"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Download, FileText, X, Printer, ChevronLeft, ChevronRight, Sprout } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useCurrency } from '../../../context/CurrencyContext';

type InvoiceRow = {
  id: string;
  supply: string;
  date: string;
  amount: string;
  status: 'PAID' | 'PENDING';
  supplyDetail?: any;
  raw?: any;
};

// Removed fallbackInvoices mock data

export default function Invoices() {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { formatPrice } = useCurrency();
  const [summary, setSummary] = useState({
    totalEarned: '$0.00',
    pendingPayments: '$0.00',
    outstandingCount: 0,
    lastPayment: '$0.00',
    lastPaymentDate: '—',
    earnedChangePercentage: 0,
  });

  // Interactive filters
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [amountFilter, setAmountFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    let mounted = true;

    async function loadInvoices() {
      setIsLoading(true);
      try {
        const [data, totals] = await Promise.all([api.invoices(), api.invoiceSummary()]);

        if (!mounted) return;

        const rows = (data || []).map((invoice: any) => ({
          id: invoice.bikanawe_invoice_id || `#HH-INV-${String(invoice.id).padStart(6, '0')}`,
          supply: invoice.supply_detail?.product_detail?.name || invoice.supply_detail?.product?.name || `Supply #${invoice.supply}`,
          date: invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          amount: formatPrice(invoice.amount),
          status: String(invoice.status).toUpperCase() === 'PAID' ? 'PAID' : 'PENDING',
          supplyDetail: invoice.supply_detail,
          raw: invoice,
        }));

        setInvoices(rows);

        setSummary({
          totalEarned: formatPrice(totals?.total_earned ?? 0),
          pendingPayments: formatPrice(totals?.pending ?? 0),
          outstandingCount: rows.filter((invoice: any) => invoice.status === 'PENDING').length,
          lastPayment: formatPrice(totals?.last_payment ?? 0),
          lastPaymentDate: rows.find((invoice: any) => invoice.status === 'PAID')?.date || '—',
          earnedChangePercentage: totals?.earned_change_percentage ?? 0,
        });
      } catch (error) {
        console.error('Failed to load invoices:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadInvoices();

    return () => {
      mounted = false;
    };
  }, []);

  // Filter calculations
  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const cleanAmount = Number(inv.amount.replace(/[^0-9.-]+/g, ""));
    const matchesAmount = amountFilter === 'All' ||
      (amountFilter === 'Under $1,500' && cleanAmount < 1500) ||
      (amountFilter === 'Over $1,500' && cleanAmount >= 1500);

    // date filtering
    const dateVal = new Date(inv.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateVal.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const matchesDate = dateFilter === 'All' ||
      (dateFilter === 'Last 7 Days' && diffDays <= 7) ||
      (dateFilter === 'Last 30 Days' && diffDays <= 30) ||
      (dateFilter === 'Last 6 Months' && diffDays <= 180) ||
      (dateFilter === 'Last Year' && diffDays <= 365);

    return matchesStatus && matchesAmount && matchesDate;
  });

  // Reset page number on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, amountFilter, dateFilter]);

  // Pagination
  const totalEntries = filteredInvoices.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    const headers = "Invoice ID,Related Supply,Issue Date,Amount,Status\n";
    const rows = filteredInvoices.map(inv => 
      `"${inv.id}","${inv.supply}","${inv.date}","${inv.amount}","${inv.status}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-sans text-xl sm:text-2xl font-extrabold text-primary">Invoices & Payments</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-xl border border-outline-variant custom-shadow flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <FileText size={160} className="text-primary" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Total Earned</p>
            <h3 className="font-sans text-2xl font-extrabold text-primary">{summary.totalEarned}</h3>
          </div>
          {summary.earnedChangePercentage !== 0 && (
            <div className="mt-6 flex items-center text-secondary text-xs font-bold font-sans">
              <span className="bg-secondary/10 px-2 py-1 rounded-lg">
                {summary.earnedChangePercentage > 0 ? `+${summary.earnedChangePercentage}%` : `${summary.earnedChangePercentage}%`} from last month
              </span>
            </div>
          )}
        </div>

        <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-xl border border-outline-variant custom-shadow flex flex-col justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Pending Payments</p>
            <h3 className="font-sans text-2xl font-extrabold text-tertiary">{summary.pendingPayments}</h3>
          </div>
          <div className="mt-6">
            <p className="font-mono text-[10px] text-on-surface-variant mt-2 uppercase tracking-tight">{summary.outstandingCount} Invoices Outstanding</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-xl border border-outline-variant custom-shadow flex flex-col justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Last Payment</p>
            <h3 className="font-sans text-2xl font-extrabold text-on-surface">{summary.lastPayment}</h3>
          </div>
          <div className="mt-6 flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileText size={16} />
             </div>
             <p className="font-sans text-xs text-on-surface-variant">Received {summary.lastPaymentDate}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant custom-shadow overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b border-outline-variant flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center bg-surface-container-low relative">
          <h4 className="font-sans text-base font-bold text-primary">Recent Invoices</h4>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer",
                showFiltersMenu ? "bg-primary border-primary text-white" : "bg-white border-outline-variant text-primary hover:bg-surface-container-low"
              )}
            >
              <Filter size={14} /> Filter
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-mono text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity active:scale-95 shadow-md cursor-pointer"
            >
              <Download size={14} /> Export Filtered
            </button>
          </div>

          {/* Real working dropdown filters */}
          {showFiltersMenu && (
            <div className="absolute right-6 top-full mt-2 w-72 bg-white border border-outline-variant rounded-2xl shadow-xl z-30 p-4 space-y-4">
              <div className="space-y-2">
                <label className="block font-mono text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Payment Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {['All', 'PAID', 'PENDING'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "py-1.5 rounded-lg font-sans text-xs font-bold border transition-all cursor-pointer",
                        statusFilter === status
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-[#c1c9c0] text-[#414942]"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Invoice Amount</label>
                <div className="flex flex-col gap-1.5">
                  {['All', 'Under $1,500', 'Over $1,500'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountFilter(amt)}
                      className={cn(
                        "py-1.5 px-3 rounded-lg font-sans text-xs font-bold border text-left transition-all cursor-pointer",
                        amountFilter === amt
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-[#c1c9c0] text-[#414942]"
                      )}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Issue Date Range</label>
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#c1c9c0] text-[#414942] rounded-lg font-sans text-xs font-bold focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                >
                  <option>All</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                </select>
              </div>

              <div className="pt-2 border-t border-outline-variant flex justify-between">
                <button 
                  onClick={() => {
                    setStatusFilter('All');
                    setAmountFilter('All');
                    setDateFilter('All');
                  }}
                  className="text-[10px] font-mono uppercase font-bold text-on-surface-variant hover:text-[#1c1c18]"
                >
                  Reset
                </button>
                <button 
                  onClick={() => setShowFiltersMenu(false)}
                  className="text-[10px] font-mono uppercase font-bold text-primary hover:underline"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-surface-container-lowest">
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">Invoice ID</th>
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">Related Supply</th>
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">Issue Date</th>
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">Amount</th>
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">Status</th>
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-surface-container-high rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
                        <Sprout size={22} className="text-outline" />
                      </div>
                      <p className="font-sans text-sm font-bold text-on-surface-variant">
                        {statusFilter !== 'All' || amountFilter !== 'All' || dateFilter !== 'All' ? 'No invoices match the selected filters.' : 'No invoices yet — accepted supplies will generate invoices here.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedInvoices.map((invoice) => (
                <tr 
                  key={invoice.id} 
                  className="hover:bg-surface-container-low transition-colors cursor-pointer group" 
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <td className="px-6 py-4 font-mono text-xs text-primary font-bold">{invoice.id}</td>
                  <td className="px-6 py-4 font-sans text-sm text-on-surface">{invoice.supply}</td>
                  <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{invoice.date}</td>
                  <td className="px-6 py-4 font-mono text-sm font-bold text-on-surface">{invoice.amount}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full font-mono text-[8px] uppercase font-extrabold tracking-widest border",
                      invoice.status === 'PAID' ? "bg-secondary-container text-on-secondary-container border-secondary" : "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary-container"
                    )}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                      <FileText size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Real working Pagination */}
        <div className="px-4 sm:px-6 py-4 border-t border-outline-variant flex flex-col sm:flex-row gap-3 justify-between items-center bg-surface-container-low">
          <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
            Showing {totalEntries > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} invoices
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-8 h-8 rounded-lg font-mono text-xs flex items-center justify-center transition-all cursor-pointer",
                  currentPage === page 
                    ? "bg-primary text-on-primary shadow-md font-bold" 
                    : "border border-outline-variant bg-white hover:bg-surface-container-high text-on-surface-variant"
                )}
              >
                {page}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedInvoice && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoice(null)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[640px] bg-white z-[70] shadow-2xl overflow-y-auto flex flex-col custom-scrollbar"
            >
              <div className="p-4 sm:p-6 border-b border-outline-variant flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-surface-container-low rounded-full cursor-pointer">
                    <X size={20} />
                  </button>
                  <h5 className="font-sans text-lg sm:text-xl font-extrabold text-on-surface">Invoice Preview</h5>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-surface-container-low transition-colors cursor-pointer">
                    <Printer size={14} /> Print
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-mono text-[10px] uppercase tracking-wider hover:opacity-90 shadow-md cursor-pointer">
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8 md:p-12 min-h-full flex flex-col bg-white" style={{ backgroundImage: 'radial-gradient(#e5e0d5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-10 sm:mb-16">
                  <div className="space-y-4">
                    <div className="flex items-center text-primary font-extrabold text-2xl sm:text-3xl gap-2">
                      <Sprout size={32} />
                      Harvest Hill
                    </div>
                    <div className="font-mono text-[10px] text-on-surface-variant uppercase space-y-1">
                      <p>Harvest Hill Logistics Hub</p>
                      <p>452 Agriculture Lane, Green Valley</p>
                      <p>support@harvesthill.com</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl sm:text-5xl font-black text-on-surface uppercase tracking-tighter opacity-10">INVOICE</h1>
                    <p className="font-mono text-xs text-primary font-bold mt-2">{selectedInvoice.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 mb-10 sm:mb-16">
                  <div>
                    <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest mb-2 font-bold">Billed To</p>
                    <p className="font-sans font-extrabold text-lg text-on-surface">Harvest Hill Farmer Account</p>
                    <p className="text-on-surface-variant text-sm font-sans mt-1">Loaded from local mock data</p>
                    <p className="text-on-surface-variant text-sm font-sans">Connected invoice record</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest mb-2 font-bold">Payment Details</p>
                    <p className="text-sm text-on-surface font-sans">
                      <span className="font-bold opacity-60">Issue Date:</span> {selectedInvoice.date}
                    </p>
                    <p className="text-sm text-on-surface font-sans">
                      <span className="font-bold opacity-60">Due Date:</span> {selectedInvoice.status === 'PAID' ? 'Settled' : 'Pending'}
                    </p>
                    <p className="text-sm text-on-surface font-sans">
                      <span className="font-bold opacity-60">Status:</span> <span className="text-secondary font-black">{selectedInvoice.status}</span>
                    </p>
                  </div>
                </div>

                <div className="flex-grow overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b-2 border-primary">
                        <th className="py-4 font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Description</th>
                        <th className="py-4 font-mono text-[10px] text-on-surface-variant uppercase tracking-widest text-center">Qty</th>
                        <th className="py-4 font-mono text-[10px] text-on-surface-variant uppercase tracking-widest text-right">Rate</th>
                        <th className="py-4 font-mono text-[10px] text-on-surface-variant uppercase tracking-widest text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {[
                        { desc: selectedInvoice.supply, sub: 'Linked supply record', qty: 1, rate: Number(selectedInvoice.raw?.amount || 0) || Number((selectedInvoice.amount || "0").replace(/[^0-9.-]+/g, "")) },
                      ].map((item, i) => (
                        <tr key={i}>
                          <td className="py-6">
                            <p className="font-sans font-bold text-on-surface">{item.desc}</p>
                            <p className="font-mono text-[9px] text-on-surface-variant mt-1">{item.sub}</p>
                          </td>
                          <td className="py-6 text-center font-mono text-sm">{item.qty}</td>
                          <td className="py-6 text-right font-mono text-sm">{formatPrice(item.rate)}</td>
                          <td className="py-6 text-right font-mono text-sm font-bold">{formatPrice(item.qty * item.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-16 pt-8 border-t border-outline flex justify-end">
                  <div className="w-64 space-y-3">
                    <div className="flex justify-between text-on-surface-variant font-mono text-xs">
                      <span>Subtotal:</span>
                      <span>{selectedInvoice.amount}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant font-mono text-xs">
                      <span>Tax (0%):</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between text-2xl font-black text-primary pt-4 border-t-2 border-primary">
                      <span>Total:</span>
                      <span>{selectedInvoice.amount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-16">
                  <p className="text-[10px] text-on-surface-variant text-center border-t border-outline-variant pt-8 italic font-sans leading-relaxed">
                    Thank you for your business. Payments should be made via bank transfer or the Harvest Hill portal. 
                    Please quote invoice number on all correspondence.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
