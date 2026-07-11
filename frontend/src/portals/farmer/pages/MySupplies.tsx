"use client";

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ChevronDown, Calendar as CalendarIcon, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiRequest } from '../lib/api';

export default function MySupplies() {
  const [supplies, setSupplies] = useState<any[]>([]);

  useEffect(() => {
    async function loadSupplies() {
      try {
        const data = await apiRequest("/api/supplies/");
        setSupplies(data);
      } catch (err) {
        console.error("Error loading supplies:", err);
        // Offline Mock Fallbacks
        setSupplies([
          { id: '1', product_detail: { name: 'Heirloom Tomatoes', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRey3ni57-r0mdsoqUUDjHnVzK-ot3jGZRlwrVWdgcfcTfcNBLWLlKAcIA9CueOunIO19QIG1pwBC5ulTFRIYHeThaIS8QZw5X7AFoMWGshdk25Hvxc5CPZDsrXHFuAiiXX8NL1XE6xYpQcUOvZ25DcyOKJscCaZ4TWnprMyVujMqYG5lUz-7rNm9nvTO7eH_vr2p_bOpFx4_g9rnGphbCqQOgj-6PK_2B9dFcJ5ATMmfuuwFpIh8bIg' }, batch: '#HT-992', quantity: '250', unit: 'kg', submitted_at: '2023-10-12T00:00:00Z', status: 'accepted', proposed_price: '5.00' },
          { id: '2', product_detail: { name: 'Organic Curly Kale', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0vrzC0e6TSgZ3qUfQGwi1SBbx1Azxcwej8lQIgygqNPfj4BvtV79fCCiz3w-x380yG1ib7N9s-Ya73fkUbfLZOE-zEgN_zcgc2pQSKpEXEXmR9V3T_7g-8xs_nJgaibWJZ4cEBuiVonvwwxjgYcVeWXp6ZtmLS_t4ddMpkRpSPU_c1xPYGQBucsGiGtfTrkDNum3MTJxPYkOOh3Lei-uvm3sYRIcI_-Lm6Mf44Bo_E_qUSWgE3JbZ4g' }, batch: '#OK-451', quantity: '80', unit: 'kg', submitted_at: '2023-10-14T00:00:00Z', status: 'pending', proposed_price: '4.00' },
          { id: '3', product_detail: { name: 'Farm Fresh Eggs', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxsEs4IhBMq2z7Dc30_bYvToFqv-NONJHBLanc_VQi_40AtymTuKos-Y78p_MkdZ33afM9Uye8vUSh4tvZzk1YdQmTcDeaU3iRByGcMMPLAazHOxd5checkr74FpOjjHQPktyrC_MOlMnmPi7I7ZgiBsDtE9iQC6elk8RdmZ9pQSXxXOpEhlhlgpA-LHzZyv9-8JBtTKm5Nwjqz0IS08MaA5Ef1QluLZ-_sT9llyt-ewd2Z1utcqB9pQ' }, batch: '#FE-122', quantity: '40', unit: 'doz', submitted_at: '2023-10-15T00:00:00Z', status: 'delivered', proposed_price: '6.00' },
        ]);
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 sm:p-6 space-y-4 sm:space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="font-sans text-xl sm:text-2xl font-extrabold text-primary">My Supplies</h1>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant custom-shadow items-stretch sm:items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
          <input 
            className="w-full pl-11 pr-4 py-2 rounded-lg border border-outline-variant font-sans text-sm bg-surface-container-low" 
            placeholder="Search supplies..." 
            type="text"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All Statuses', 'All Categories'].map((filter) => (
            <button key={filter} className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-surface-container-low transition-colors">
              {filter}
              <ChevronDown size={14} />
            </button>
          ))}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-surface-container-low transition-colors">
            <CalendarIcon size={14} />
            Date Range
          </button>
        </div>
      </div>

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
              {supplies.map((supply) => (
                <tr key={supply.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-outline-variant shrink-0">
                        <img src={supply.product_detail?.image} alt={supply.product_detail?.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-sans font-bold text-primary">{supply.product_detail?.name}</p>
                        <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">#{supply.id}</p>
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
                      <button className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-6 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-low">
          <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Showing 1 to {supplies.length} entries</p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-all">
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 rounded-lg font-mono text-xs flex items-center justify-center transition-all bg-primary text-on-primary shadow-md">1</button>
            <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
