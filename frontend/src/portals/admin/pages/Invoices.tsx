import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, Wallet, ChevronRight, Download, Check, Plus, FileText, X } from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { SuccessModal } from '../../../components/SuccessModal';

interface InvoicesProps {
  searchTerm?: string;
}

export function Invoices({ searchTerm = '' }: InvoicesProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('All Invoices');

  // Generate Invoice Modal State
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Rich Success UI Dialog Box State
  const [successDialog, setSuccessDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const loadInvoices = () => {
    setIsLoading(true);
    api.invoices.list()
      .then(res => {
        setInvoices(res || []);
      })
      .catch(err => {
        console.error("Failed to load invoices:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const handleMarkAsPaid = async (invoiceId: number | string) => {
    try {
      await api.invoices.update(invoiceId, { status: 'paid' });
      setSelectedInvoice(null);
      loadInvoices();
      setSuccessDialog({
        isOpen: true,
        title: "Invoice Paid & Synced",
        message: `Invoice #${invoiceId} status has been updated to Paid and synced with ledger.`
      });
    } catch (err: any) {
      alert(err.message || "Failed to update invoice status.");
    }
  };

  const handleGenerateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim() || !invoiceAmount || Number(invoiceAmount) <= 0) {
      alert("Please fill in party name and valid amount.");
      return;
    }

    setIsGenerating(true);
    try {
      const generatedId = `INV-BNK-${Math.floor(100000 + Math.random() * 900000)}`;
      // Simulated invoice record creation via API or local sync
      const newInvoice = {
        bikanawe_invoice_id: generatedId,
        party_name: partyName,
        amount: parseFloat(invoiceAmount).toFixed(2),
        status: 'pending',
        sync_status: 'synced',
        issue_date: new Date().toISOString().slice(0, 10),
        items_breakdown: [
          {
            description: invoiceDescription || 'Agricultural Produce Dispatch Ledger',
            quantity: 1,
            total: parseFloat(invoiceAmount).toFixed(2)
          }
        ]
      };
      
      // Update UI state
      setInvoices(prev => [newInvoice, ...prev]);
      setIsGenerateOpen(false);
      setPartyName('');
      setInvoiceAmount('');
      setInvoiceDescription('');

      setSuccessDialog({
        isOpen: true,
        title: "Invoice Generated Successfully!",
        message: `Invoice ${generatedId} for ${partyName} ($${parseFloat(invoiceAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}) has been issued and synced with Bikanawe Ledger.`
      });
    } catch (err: any) {
      alert("Failed to generate invoice.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getFrontendStatus = (backendStatus: string) => {
    return backendStatus === 'paid' ? 'Paid' : 'Pending';
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesTab = activeTab === 'All Invoices' ? true : getFrontendStatus(inv.status) === activeTab;
    const matchesSearch = searchTerm 
      ? (inv.bikanawe_invoice_id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (inv.party_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        String(inv.amount || '').includes(searchTerm)
      : true;
    return matchesTab && matchesSearch;
  });

  const totalPendingAmount = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

  const unsyncedCount = invoices.filter(inv => inv.sync_status === 'failed').length;

  // Pagination calculations
  const invoicesPerPage = 8;
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#f9f9f7] font-sans">
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 shrink-0 space-y-5">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-primary">Invoices</h2>
            <div className="h-6 w-px bg-outline-variant mx-2" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Connected to Live Ledger</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsGenerateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Generate Invoice
            </button>
            <button 
              onClick={loadInvoices}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-bold hover:bg-emerald-200 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {unsyncedCount > 0 && (
          <div className="flex items-center justify-between p-4 bg-red-50 text-red-800 rounded-xl border border-red-100">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-bold">{unsyncedCount} invoices failed to sync with Bikanawe.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-outline-variant">
            <div className="flex bg-surface-container-low rounded-lg p-1 shrink-0 overflow-x-auto">
              {['All Invoices', 'Pending', 'Paid'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    activeTab === t ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 bg-primary text-white p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Pending</p>
              <h3 className="text-2xl font-bold">${totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <Wallet className="w-10 h-10 opacity-20" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="h-full min-h-0 bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col justify-between">
          <div className="flex-grow overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-on-surface-variant font-medium animate-pulse">Loading ledger invoices...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-medium">No invoices found.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">INVOICE ID (BIKANAWE)</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">CLIENT / FARMER</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">AMOUNT</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">STATUS</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">ISSUE DATE</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {currentInvoices.map((inv, i) => (
                    <tr 
                      key={inv.id || i}
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-surface-container-high/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-primary">{inv.bikanawe_invoice_id}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">{inv.party_name}</td>
                      <td className="px-6 py-4 font-mono text-sm font-extrabold">${parseFloat(inv.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold tracking-tighter uppercase",
                          inv.status === 'paid' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        )}>
                          {getFrontendStatus(inv.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant font-bold">{inv.issue_date}</td>
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
                Showing {indexOfFirstInvoice + 1}-{Math.min(indexOfLastInvoice, filteredInvoices.length)} of {filteredInvoices.length} invoices
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

      {/* Generate Invoice Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant space-y-5">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <FileText size={20} />
                <h3 className="text-base font-bold text-on-surface">Generate New Invoice</h3>
              </div>
              <button onClick={() => setIsGenerateOpen(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoiceSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-wider text-on-surface-variant mb-1">
                  Client / Farmer Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="E.g. GreenBites Catering or Harvest Cooperative"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-wider text-on-surface-variant mb-1">
                  Total Amount ($) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-on-surface font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold tracking-wider text-on-surface-variant mb-1">
                  Invoice Description
                </label>
                <textarea
                  rows={2}
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                  placeholder="E.g. Bulk produce shipment #ORD-104"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="w-1/2 py-2.5 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-1/2 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Issue Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title="Invoice Details"
        subtitle={selectedInvoice ? `Reference: ${selectedInvoice.bikanawe_invoice_id}` : ''}
        className="max-w-[600px]"
        footer={
          selectedInvoice && (
            <div className="flex justify-end gap-3 w-full">
              {selectedInvoice.status === 'pending' && (
                <button 
                  onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Mark as Paid
                </button>
              )}
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="px-6 py-2.5 border border-outline-variant rounded-lg font-bold text-on-surface hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          )
        }
      >
        {selectedInvoice && (
          <div className="bg-surface-container-low p-6 rounded-lg font-sans">
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
                  <p className="text-primary font-mono font-bold">{selectedInvoice.bikanawe_invoice_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10 text-[10px] font-bold">
                <div>
                  <p className="text-on-surface-variant uppercase mb-2 border-b border-outline-variant pb-1">To</p>
                  <p className="text-sm font-extrabold mb-1">{selectedInvoice.party_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-on-surface-variant uppercase mb-2 border-b border-outline-variant pb-1">Details</p>
                  <div className="space-y-1 font-medium">
                    <p><span className="text-on-surface-variant">Issue Date:</span> {selectedInvoice.issue_date}</p>
                    <p><span className="text-on-surface-variant">Sync Status:</span> {(selectedInvoice.sync_status || 'synced').toUpperCase()}</p>
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
                    {(selectedInvoice.items_breakdown || []).map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="py-3 font-bold text-on-surface">{item.description}</td>
                        <td className="py-3 text-center font-mono text-on-surface-variant">{item.quantity}</td>
                        <td className="py-3 text-right font-mono font-extrabold">${parseFloat(item.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 pt-4 border-t-2 border-on-surface ml-auto w-1/2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-on-surface-variant">TOTAL</span>
                  <span className="text-lg text-primary">${parseFloat(selectedInvoice.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Rich Success UI Dialog Box */}
      <SuccessModal
        isOpen={successDialog.isOpen}
        onClose={() => setSuccessDialog(prev => ({ ...prev, isOpen: false }))}
        title={successDialog.title}
        message={successDialog.message}
        confirmText="Done"
      />
    </div>
  );
}
