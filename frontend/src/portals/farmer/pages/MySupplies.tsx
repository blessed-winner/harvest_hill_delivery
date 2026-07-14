"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, Calendar as CalendarIcon, Eye, EyeOff, Trash2, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiRequest } from '../lib/api';

const romaTomatoesImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAYiimUpH1IFm39l3pnZTBX7tbAQR_aWtolqnXVfboxPqr8MJz9pLBe5CILjBLqm6QIz5161fz4Gh7uTafn3uQA1DyPdwhFX7WaRmQSkeRDy2KKPDZ0RGDpPcnCV09hCAdrNsXSzyDpkD27PXewpXBfJ0kb06ODeplODn-tSr2WmbjmcOb78uNKOU2Ow1kGtSp9wtTq1RJbY2ROo9SLCKoBXXoRYNi0fF7q1_-pLo9QpQlnjxNmUM8CXA';

const fallbackSupplies = [
  { id: '1', product_detail: { name: 'Roma Tomatoes', image: romaTomatoesImage }, batch: '#RT-992', quantity: '250', unit: 'kg', submitted_at: '2023-10-12T00:00:00Z', status: 'accepted', proposed_price: '5.00', is_hidden: false },
  { id: '2', product_detail: { name: 'Organic Curly Kale', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0vrzC0e6TSgZ3qUfQGwi1SBbx1Azxcwej8lQIgygqNPfj4BvtV79fCCiz3w-x380yG1ib7N9s-Ya73fkUbfLZOE-zEgN_zcgc2pQSKpEXEXmR9V3T_7g-8xs_nJgaibWJZ4cEBuiVonvwwxjgYcVeWXp6ZtmLS_t4ddMpkRpSPU_c1xPYGQBucsGiGtfTrkDNum3MTJxPYkOOh3Lei-uvm3sYRIcI_-Lm6Mf44Bo_E_qUSWgE3JbZ4g' }, batch: '#OK-451', quantity: '80', unit: 'kg', submitted_at: '2023-10-14T00:00:00Z', status: 'pending', proposed_price: '4.00', is_hidden: false },
  { id: '3', product_detail: { name: 'Farm Fresh Eggs', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxsEs4IhBMq2z7Dc30_bYvToFqv-NONJHBLanc_VQi_40AtymTuKos-Y78p_MkdZ33afM9Uye8vUSh4tvZzk1YdQmTcDeaU3iRByGcMMPLAazHOxd5checkr74FpOjjHQPktyrC_MOlMnmPi7I7ZgiBsDtE9iQC6elk8RdmZ9pQSXxXOpEhlhlgpA-LHzZyv9-8JBtTKm5Nwjqz0IS08MaA5Ef1QluLZ-_sT9llyt-ewd2Z1utcqB9pQ' }, batch: '#FE-122', quantity: '40', unit: 'doz', submitted_at: '2023-10-15T00:00:00Z', status: 'delivered', proposed_price: '6.00', is_hidden: false },
  { id: '4', product_detail: { name: 'Iceberg Lettuce', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxaIEjUGtnGXLWgWM3dQ4i0tAvOfi7RKZLGu1fGEtWVK3e05aLGKP6QyWo87_ktHPD6eeGJE0IdMO3UIr8r1xbyzKJfapEyuokusuq4sIrAitDQp5plyNJ55e8qI6GFvfmkIu88U-hcSoIGPKI245Pcr01LUYzqaqmqv4UirXitG5XKKi07SQy_JyALKzIO_wYp8GWfZTo03pmxEI5swE3ZsUPP8o2M0LbY1lhw4Qlvi2itb3_dVKCxg' }, batch: '#IL-802', quantity: '320', unit: 'kg', submitted_at: '2023-10-18T00:00:00Z', status: 'accepted', proposed_price: '1.20', is_hidden: false },
  { id: '5', product_detail: { name: 'Russet Potatoes', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB41-Vuzo9PoiMU_6JQZOXCKOLW-1IS1IInscIbXRMORY7tTrv44rIvtwhrnsLhdCuonKVd7FwSgRhoTZC4E-PnVFrYOHSFAPKKBNcd8APsOv64N3UUjF53XLXomgCACC8eAwykUHfBJfNjc8JnaM4CdDIUrDyDqE3Cu4KSlEs-hs6Wza1utfBiwoQRKnhnotV-b6enuBmfjpUJYSxR-5Bb5guV7pLUip6Uo16gWDhndBPdCrBjHVsYSw' }, batch: '#RP-402', quantity: '1200', unit: 'kg', submitted_at: '2023-10-20T00:00:00Z', status: 'negotiating', proposed_price: '0.95', is_hidden: false },
  { id: '6', product_detail: { name: 'Durum Wheat', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQYDniTVJvGnzcOZnyoyxdN10cAwuEDsM40zmbtxaMxe-Rvogvt5wvb9isBj_wDgTwDpTojDHf4_jCBFklPVWrjYvfN_P3fJ0uiFJJfs45K8-8K-IVMVCnt8QYgGExTonLEOjHe2AW3QDPkQksQZ3lZqYalgm1LOKScCsbjMko35cjhlcD8Gxb8Ro0-cQtY2h5VTWfYtT8iwBiVUlaDv-u8L-Bn2f_JBmIhRcuWdQUEjU8Qqkl6ZSA0w' }, batch: '#DW-102', quantity: '6000', unit: 'kg', submitted_at: '2023-10-22T00:00:00Z', status: 'delivered', proposed_price: '0.85', is_hidden: false },
];

export default function MySupplies() {
  const [supplies, setSupplies] = useState<any[]>([]);

  // Filter & modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [dateFilter, setDateFilter] = useState('All Dates');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getSupplyImage = (supply: any) => {
    const name = String(supply?.product_detail?.name || '').trim().toLowerCase();
    if (name.includes('roma') || name.includes('tomato')) {
      return romaTomatoesImage;
    }
    return supply?.product_detail?.image || '';
  };

  useEffect(() => {
    async function loadSupplies() {
      try {
        const data = await apiRequest("/api/supplies/");
        setSupplies((data || []).map((item: any) => ({
          ...item,
          product_detail: {
            ...item.product_detail,
            image: getSupplyImage(item),
          },
          is_hidden: false,
        })));
      } catch (err) {
        console.error("Error loading supplies:", err);
        setSupplies(fallbackSupplies);
      }
    }
    loadSupplies();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const toggleVisibility = (id: string) => {
    setSupplies(supplies.map(s => s.id === id ? { ...s, is_hidden: !s.is_hidden } : s));
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setSupplies(supplies.filter(s => s.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter, dateFilter]);

  // Filter supply array
  const filteredSupplies = supplies.filter(item => {
    const name = item.product_detail?.name || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.batch || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All Statuses' || item.status.toLowerCase() === statusFilter.toLowerCase();
    
    // category classification
    const isVeg = name.toLowerCase().includes('tomato') || 
                  name.toLowerCase().includes('kale') || 
                  name.toLowerCase().includes('lettuce') || 
                  name.toLowerCase().includes('potato');
    const isFruit = name.toLowerCase().includes('cherry') || name.toLowerCase().includes('berry');
    const isGrain = name.toLowerCase().includes('wheat') || name.toLowerCase().includes('grain');
    
    let category = 'Other';
    if (isVeg) category = 'Vegetables';
    else if (isFruit) category = 'Fruits';
    else if (isGrain) category = 'Grains';

    const matchesCategory = categoryFilter === 'All Categories' || category === categoryFilter;
    
    // Date classification
    const date = new Date(item.submitted_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const matchesDate = dateFilter === 'All Dates' ||
      (dateFilter === 'Last 7 Days' && diffDays <= 7) ||
      (dateFilter === 'Last 30 Days' && diffDays <= 30);

    return matchesSearch && matchesStatus && matchesCategory && matchesDate;
  });

  // Pagination
  const totalEntries = filteredSupplies.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const paginatedSupplies = filteredSupplies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 sm:p-6 space-y-4 sm:space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="font-sans text-xl sm:text-2xl font-extrabold text-primary">My Supplies</h1>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant custom-shadow items-stretch sm:items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 rounded-lg border border-outline-variant font-sans text-sm bg-surface-container-low focus:bg-white outline-none transition-all" 
            placeholder="Search supplies..." 
            type="text"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-outline-variant rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-surface-container-low transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-primary"
          >
            <option>All Statuses</option>
            <option>accepted</option>
            <option>pending</option>
            <option>negotiating</option>
            <option>delivered</option>
          </select>

          {/* Category Filter */}
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-outline-variant rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-surface-container-low transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-primary"
          >
            <option>All Categories</option>
            <option>Vegetables</option>
            <option>Fruits</option>
            <option>Grains</option>
            <option>Other</option>
          </select>

          {/* Date Filter */}
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-outline-variant rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-surface-container-low transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-primary"
          >
            <option>All Dates</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden custom-shadow w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Product</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Quantity</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Submitted Date</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Status</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Price</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {paginatedSupplies.map((supply) => (
                <tr 
                  key={supply.id} 
                  className={cn(
                    "hover:bg-surface-container-low transition-colors group",
                    supply.is_hidden && "opacity-40 select-none bg-surface-container-low/30"
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-outline-variant shrink-0">
                        <img src={getSupplyImage(supply)} alt={supply.product_detail?.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className={cn("font-sans font-bold text-primary", supply.is_hidden && "line-through")}>
                          {supply.product_detail?.name}
                        </p>
                        <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                          #{supply.id} {supply.is_hidden && "(Hidden)"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">{supply.quantity} {supply.unit}</td>
                  <td className="px-6 py-4 font-mono text-sm">{formatDate(supply.submitted_at)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full font-mono text-[9px] uppercase font-extrabold tracking-widest border",
                      supply.status === 'accepted' || supply.status === 'delivered' ? "bg-secondary-container text-on-secondary-container border-secondary" :
                      supply.status === 'pending' || supply.status === 'negotiating' ? "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary-container" :
                      "bg-surface-container-highest text-on-surface border-outline"
                    )}>
                      {supply.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-bold text-on-surface">${supply.proposed_price}</span>
                      {supply.status === 'accepted' && (
                        <span className="text-[9px] text-tertiary font-bold uppercase tracking-tighter">Negotiated</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleVisibility(supply.id)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                        title={supply.is_hidden ? "Show supply" : "Hide supply"}
                      >
                        {supply.is_hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(supply.id)}
                        className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete supply"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedSupplies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-on-surface-variant font-medium">
                    No supply records match the current filter selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-6 py-4 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-low">
          <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
            Showing {totalEntries > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
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

      {/* Delete confirmation dialog box */}
      <AnimatePresence>
        {deleteConfirmId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-0 m-auto w-[90vw] max-w-md h-fit bg-white z-[70] rounded-3xl border border-outline-variant shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#ffdad6] text-[#93000a] flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-sans text-lg font-extrabold text-[#1c1c18] tracking-tight">Delete Supply Record?</h3>
                  <p className="text-xs text-[#717971] leading-relaxed mt-1">
                    Are you sure you want to delete this supply record? This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-5 py-2.5 rounded-xl border-2 border-primary text-primary font-bold font-sans text-xs hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-error text-white font-bold font-sans text-xs hover:bg-[#ba1a1a]/90 transition-colors shadow-md cursor-pointer"
                >
                  Delete Record
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
