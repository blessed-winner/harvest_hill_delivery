"use client";

import { useState, useEffect } from 'react';
import { ChevronRight, Search, FileDown, Printer, Share2, FileText, ChevronLeft, Loader2, Package } from 'lucide-react';
import { clientApi, formatCurrency } from '../lib/api';

interface InvoicesProps {
  onNavigate: (screen: string) => void;
}

export default function Invoices({ onNavigate }: InvoicesProps) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load orders (invoices are based on completed/delivered orders)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await clientApi.orders.list();
        // Filter for orders that would have invoices (completed, delivered, cancelled)
        const invoiceOrders = data.filter((order: any) => 
          ['completed', 'delivered', 'cancelled'].includes(order.status)
        );
        setOrders(invoiceOrders || []);
        if (invoiceOrders.length > 0) {
          setSelectedOrderId(invoiceOrders[0].id);
        }
      } catch (err: any) {
        console.error('Failed to fetch invoices:', err);
        setError(err.message || 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter and pagination
  const filteredOrders = orders.filter(order =>
    String(order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Find active selected order details
  const activeOrder = orders.find(order => order.id === selectedOrderId) || orders[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return { bg: 'bg-[#bceec8]', text: 'text-[#00210f]', label: 'PAID' };
      case 'pending':
        return { bg: 'bg-[#ffdcc5]', text: 'text-[#301400]', label: 'PENDING' };
      case 'cancelled':
        return { bg: 'bg-[#f0eee7]', text: 'text-[#717971]', label: 'CANCELLED' };
      default:
        return { bg: 'bg-[#f0eee7]', text: 'text-[#717971]', label: status.toUpperCase() };
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#144227] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#717971]">Loading invoices...</p>
        </div>
      </div>
    );
  }

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
        <p className="text-xs text-[#717971] mt-0.5">Review and manage your order invoices.</p>
      </div>

      {error && (
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center">
          <Package className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#1c1c18] mb-2">Unable to Load Invoices</h2>
          <p className="text-sm text-[#717971] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!error && orders.length === 0 && (
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center">
          <FileText className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#1c1c18] mb-2">No Invoices Yet</h2>
          <p className="text-sm text-[#717971] mb-4">
            You don't have any invoices yet. Invoices will appear here once orders are completed.
          </p>
          <button
            onClick={() => onNavigate('catalog')}
            className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
          >
            Browse Products
          </button>
        </div>
      )}

      {!error && orders.length > 0 && (
        <>
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
                  {paginatedOrders.map((order) => {
                    const isSelected = selectedOrderId === order.id;
                    const statusBadge = getStatusBadge(order.status);
                    
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`hover:bg-[#f2efe7]/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#bceec8]/10' : ''
                        }`}
                      >
                        <td className="px-3 py-3 font-bold text-[#1c1c18]">#{order.id}</td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="block font-bold text-[#1c1c18]">{order.items?.length || 0} items</span>
                          <span className="block text-[10px] text-[#717971] font-mono mt-0.5">Order #{order.id}</span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell text-[#414942] font-semibold">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'N/A'}
                        </td>
                        <td className="px-3 py-3 font-extrabold text-[#1c1c18]">
                          {formatCurrency(order.total_price)}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(order.id);
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
                  
                  {paginatedOrders.length === 0 && (
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
              <span>Showing {paginatedOrders.length} of {filteredOrders.length} invoices</span>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 border border-[#c1c9c0] rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="font-bold text-[#1c1c18] px-2 text-[11px]">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1 border border-[#c1c9c0] rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
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
                onClick={() => {
                  // Create printable invoice
                  const printWindow = window.open('', '_blank');
                  if (printWindow && activeOrder) {
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Invoice #${activeOrder.id}</title>
                        <style>
                          body { font-family: Arial, sans-serif; padding: 40px; color: #1c1c18; }
                          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                          .company { font-size: 24px; font-weight: bold; color: #144227; }
                          .invoice-label { text-transform: uppercase; font-size: 12px; color: #717971; }
                          .invoice-id { font-size: 14px; font-weight: bold; }
                          .section { margin: 20px 0; }
                          .section-title { font-size: 10px; text-transform: uppercase; color: #717971; margin-bottom: 10px; }
                          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #f0eee7; }
                          th { font-size: 10px; text-transform: uppercase; color: #717971; }
                          td { font-size: 12px; }
                          .total-row { font-weight: bold; font-size: 14px; }
                          .terms { background: #fcf9f2; padding: 15px; border-radius: 8px; font-size: 10px; margin-top: 30px; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <div>
                            <div class="company">Harvest Hill</div>
                            <div style="font-size: 10px; color: #717971;">Fresh Farm Delivery Platform</div>
                          </div>
                          <div style="text-align: right;">
                            <div class="invoice-label">INVOICE</div>
                            <div class="invoice-id">#${activeOrder.id}</div>
                          </div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; margin: 30px 0;">
                          <div class="section">
                            <div class="section-title">From:</div>
                            <div style="font-weight: bold;">Harvest Hill Supply Co.</div>
                            <div style="font-size: 11px; color: #414942; line-height: 1.6;">
                              Fresh Farm Platform<br/>
                              Online Marketplace<br/>
                              support@harvesthill.com
                            </div>
                          </div>
                          <div class="section" style="text-align: right;">
                            <div class="section-title">Bill To:</div>
                            <div style="font-weight: bold; color: #144227;">Client</div>
                            <div style="font-size: 11px; color: #414942; line-height: 1.6;">
                              ${(activeOrder.delivery_address || 'Address not provided').replace(/\n/g, '<br/>')}<br/>
                              Order Date: ${activeOrder.created_at ? new Date(activeOrder.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        <table>
                          <thead>
                            <tr>
                              <th>Item Description</th>
                              <th style="text-align: center;">Qty</th>
                              <th style="text-align: right;">Rate</th>
                              <th style="text-align: right;">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${(activeOrder.items || []).map((item: any) => `
                              <tr>
                                <td>${item.product_name || 'Product'}</td>
                                <td style="text-align: center;">${item.quantity}</td>
                                <td style="text-align: right;">$${(item.price || 0).toFixed(2)}</td>
                                <td style="text-align: right;">$${((item.price || 0) * item.quantity).toFixed(2)}</td>
                              </tr>
                            `).join('')}
                            <tr class="total-row">
                              <td colspan="3" style="text-align: right;">Total</td>
                              <td style="text-align: right; color: #144227;">$${(activeOrder.total_price || 0).toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                        
                        <div class="terms">
                          <div style="font-weight: bold; margin-bottom: 5px;">Terms & Conditions</div>
                          Payment is processed at the time of order. All sales are final. For questions about your order, please contact support.
                        </div>
                      </body>
                      </html>
                    `);
                    printWindow.document.close();
                    setTimeout(() => {
                      printWindow.print();
                    }, 250);
                  }
                }}
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
                <p className="text-[9px] uppercase font-bold tracking-widest text-[#717971] mt-0.5">Fresh Farm Delivery Platform</p>
              </div>
              <div className="text-right">
                <span className="block text-xs uppercase font-extrabold text-[#717971]">INVOICE</span>
                <span className="block text-xs font-mono font-bold text-[#1c1c18]">#{activeOrder?.id || 'N/A'}</span>
              </div>
            </div>

            {/* Address Row */}
            <div className="grid grid-cols-2 gap-4 text-[10px] pt-4 border-t border-[#f0eee7]">
              <div>
                <span className="block font-bold uppercase tracking-wider text-[#717971] mb-1">From:</span>
                <p className="font-bold text-[#1c1c18]">Harvest Hill Supply Co.</p>
                <p className="text-[#414942] leading-relaxed mt-0.5">
                  Fresh Farm Platform<br />
                  Online Marketplace<br />
                  support@harvesthill.com
                </p>
              </div>
              <div>
                <span className="block font-bold uppercase tracking-wider text-[#717971] mb-1">Bill To:</span>
                <p className="font-bold text-[#144227]">Client</p>
                <p className="text-[#414942] leading-relaxed mt-0.5">
                  {activeOrder?.delivery_address || 'Address not provided'}<br />
                  Order Date: {activeOrder?.created_at ? new Date(activeOrder.created_at).toLocaleDateString() : 'N/A'}
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
                  {activeOrder?.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 font-bold text-[#1c1c18]">{item.product_name || 'Product'}</td>
                      <td className="py-2 text-center font-semibold text-[#414942]">{item.quantity}</td>
                      <td className="py-2 text-right text-[#414942]">{formatCurrency(item.price)}</td>
                      <td className="py-2 text-right font-bold text-[#1c1c18]">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Totals */}
            <div className="border-t border-[#c1c9c0] pt-4 space-y-2 text-[10px] text-right ml-auto max-w-[200px]">
              <div className="flex justify-between text-[#414942]">
                <span>Subtotal</span>
                <span className="font-bold text-[#1c1c18]">{formatCurrency(activeOrder?.total_price)}</span>
              </div>

              <div className="border-t border-[#f0eee7] pt-2 flex justify-between text-xs font-black text-[#1c1c18]">
                <span>Total</span>
                <span className="text-[#144227] text-sm">{formatCurrency(activeOrder?.total_price)}</span>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="bg-[#fcf9f2] rounded-xl p-3 border border-[#e5e2db] text-[9px] text-[#717971] leading-relaxed">
              <span className="block font-bold uppercase tracking-wider text-[#1c1c18] mb-1">Terms & Conditions</span>
              Payment is processed at the time of order. All sales are final. For questions about your order, please contact support.
            </div>

          </div>

        </div>

        </div>
        </>
      )}

    </div>
  );
}
