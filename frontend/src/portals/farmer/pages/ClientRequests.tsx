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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => (
            <motion.div
              key={req.id}
              whileHover={{ y: -4 }}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between custom-shadow relative group"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex justify-between items-start gap-2">
                  <span className="bg-[#bceec8] text-[#00210f] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                    {req.category || 'Product'}
                  </span>
                  <span className="font-mono text-[9px] text-on-surface-variant font-medium">
                    Requested {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Main details */}
                <div>
                  <h3 className="font-sans text-base font-extrabold text-on-surface group-hover:text-primary transition-colors">
                    {req.product_name}
                  </h3>
                  {req.client_name && (
                    <p className="text-[10px] font-mono uppercase text-[#717971] tracking-wider mt-0.5">
                      Client: {req.client_name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 py-1.5 border-y border-outline-variant bg-[#fcf9f2]/40 rounded-lg px-2">
                  <div>
                    <span className="block text-[8px] font-bold text-on-surface-variant uppercase tracking-wider">Volume Needed</span>
                    <span className="font-mono text-xs font-bold text-on-surface">
                      {parseFloat(String(req.quantity_needed)).toLocaleString()} {req.unit}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-on-surface-variant uppercase tracking-wider">Preferred Price</span>
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      {req.preferred_price ? `RWF ${parseFloat(String(req.preferred_price)).toLocaleString()}/${req.unit}` : 'Flexible'}
                    </span>
                  </div>
                </div>

                {req.notes && (
                  <p className="text-[11px] text-on-surface-variant italic leading-relaxed border-l-2 border-primary/20 pl-2">
                    "{req.notes}"
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-auto">
                <button
                  onClick={() => onViewChange('submit', {
                    id: `req-${req.id}`,
                    name: req.product_name,
                    category: req.category,
                    unit: req.unit,
                    quantity_needed: req.quantity_needed,
                    base_price: req.preferred_price || undefined,
                  })}
                  className="w-full bg-[#144227] text-white font-mono text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-98"
                >
                  Supply This Demand
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
