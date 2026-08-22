"use client";

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, SlidersHorizontal, ArrowRight, Package, Inbox, Leaf, HelpCircle, BadgeAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useAlert } from '../../../context/AlertContext';

type ClientRequest = {
  id: number;
  product_name: string;
  category: string;
  quantity_needed: string | number;
  unit: string;
  preferred_price?: string | number | null;
  notes?: string;
  client_name?: string;
  created_at: string;
};

interface ClientRequestsProps {
  onViewChange: (view: any, extraData?: any) => void;
}

export default function ClientRequests({ onViewChange }: ClientRequestsProps) {
  const { toast } = useAlert();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  useEffect(() => {
    async function loadRequests() {
      setIsLoading(true);
      try {
        const data = await api.clientRequests();
        setRequests(data || []);
      } catch (error) {
        console.error('Failed to load client requests:', error);
        toast('Could not load client requests at this time.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadRequests();
  }, [toast]);

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (req.notes && req.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All Categories' || req.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All Categories', 'Vegetables', 'Fruits', 'Grains', 'Animal-Based'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="font-sans text-xl sm:text-2xl font-extrabold text-on-surface">
          Client Product Requests
        </h1>
        <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1">
          Review custom crop and volume requests posted by verified buyers and approved by admin.
        </p>
      </div>

      {/* Info card */}
      <div className="bg-[#fcf9f2] border border-[#e5e2db] rounded-xl p-4 flex gap-3 items-start">
        <BadgeAlert className="text-[#144227] shrink-0 mt-0.5" size={20} />
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#144227]">Guaranteed Placement</p>
          <p className="text-[11px] text-[#414942] leading-relaxed">
            These requests represent pre-committed buyer demand. Submitting a matching harvest will directly notify the buyer and accelerate negotiation closure.
          </p>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" size={16} />
          <input
            type="text"
            placeholder="Search requested crops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-outline-variant bg-surface-container-lowest rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-full font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer whitespace-nowrap",
                selectedCategory === cat
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="w-24 h-4 bg-surface-container-high rounded" />
                <div className="w-16 h-3 bg-surface-container-high rounded-full" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-6 w-32 bg-surface-container-high rounded" />
                <div className="h-3 w-40 bg-surface-container-high rounded" />
              </div>
              <div className="h-9 w-full bg-surface-container-high rounded-lg mt-4" />
            </div>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center custom-shadow">
          <Inbox className="w-12 h-12 text-outline mx-auto mb-4" />
          <h3 className="font-sans text-sm font-bold text-on-surface">No matching requests</h3>
          <p className="font-sans text-xs text-on-surface-variant max-w-[280px] mx-auto mt-1">
            {searchQuery || selectedCategory !== 'All Categories'
              ? 'Try modifying your filters or search keywords.'
              : 'There are currently no open buyer requests matching this criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredRequests.map((req, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              key={req.id}
              className="group bg-white rounded-2xl p-4 border border-[#E8E4DA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer relative hover:-translate-y-0.5"
            >
              <div>
                {/* Card Top Pill Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="bg-[#FAF7F0] text-[#2D5A3D] text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-md border border-[#E8E4DA] uppercase tracking-wider">
                    {req.category || 'Vegetables'}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-2xs bg-emerald-100 text-emerald-900 border-emerald-300">
                    Open Demand
                  </span>
                </div>

                {/* Requirement Title */}
                <h3 className="font-extrabold text-base text-[#1C2A1E] group-hover:text-[#2D5A3D] transition-colors mb-1 leading-tight">
                  {req.product_name}
                </h3>

                {req.client_name && (
                  <p className="text-[10px] font-mono uppercase text-[#717971] tracking-wider mb-2">
                    Verified Buyer: <strong className="text-[#1C2A1E]">{req.client_name}</strong>
                  </p>
                )}

                {/* Requirement Spec Box - Vertical Hierarchy */}
                <div className="space-y-2.5 bg-[#FAF7F0]/80 p-3.5 rounded-xl border border-[#F0ECE1] my-2 text-xs">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Quantity Needed</p>
                    <p className="text-sm font-extrabold text-[#1C2A1E] font-mono mt-0.5">
                      {parseFloat(String(req.quantity_needed)).toLocaleString()} {req.unit || 'kg'}
                    </p>
                  </div>

                  <div className="py-2 border-y border-[#E8E4DA]/60 my-1 space-y-0.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Pricing Model</p>
                    {req.preferred_price ? (
                      <div>
                        <p className="text-[11px] font-medium text-[#717971]">Preferred Target Price</p>
                        <p className="text-base font-black text-[#2D5A3D] font-mono mt-0.5">
                          RWF {parseFloat(String(req.preferred_price)).toLocaleString()} / {req.unit || 'kg'}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[11px] font-medium text-[#717971]">Farmer Proposes Price</p>
                        <p className="text-xs font-semibold text-[#4A473D] mt-0.5">
                          Open for asking price submission
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Requested Date</p>
                    <p className="text-xs font-bold text-[#1C2A1E] mt-0.5">
                      {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {req.notes && (
                    <div className="pt-1.5 border-t border-[#E8E4DA]">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Buyer Notes</p>
                      <p className="text-xs font-medium text-[#4A473D] italic mt-0.5 leading-relaxed">
                        "{req.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Action CTA */}
              <div className="pt-3 border-t border-[#F4F1E8] mt-2">
                <button
                  type="button"
                  onClick={() => onViewChange('submit', {
                    id: `req-${req.id}`,
                    name: req.product_name,
                    category: req.category,
                    unit: req.unit,
                    quantity_needed: req.quantity_needed,
                    base_price: req.preferred_price || undefined,
                  })}
                  className="py-2.5 px-4 bg-[#2D5A3D] hover:bg-[#1E3E2A] text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer w-full active:scale-[0.98]"
                >
                  <span>Supply This Demand</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
