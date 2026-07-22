"use client";

import { useState, useEffect } from 'react';
import { Grid, List, ChevronRight, ArrowUpDown, ChevronLeft, ArrowRight, ShoppingCart, Loader2, Package } from 'lucide-react';
import { clientApi } from '../lib/api';

interface CatalogProps {
  onNavigate: (screen: string, category?: string, productId?: number) => void;
  addToCart: (product?: any) => void;
  initialCategory?: string;
}

export default function Catalog({ onNavigate, addToCart, initialCategory }: CatalogProps) {
  // State
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Filters
  const [organicOnly, setOrganicOnly] = useState(false);
  const [inSeason, setInSeason] = useState(false);
  const [bulkAvailable, setBulkAvailable] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [sortBy, setSortBy] = useState('name');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [farmerFilter, setFarmerFilter] = useState<string | null>(null);
  const [topFarmer, setTopFarmer] = useState<any>(null);

  // Check for farmer filter from sessionStorage (set by Farmer of the Month)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFarmerFilter = sessionStorage.getItem('catalog_farmer_filter');
      if (savedFarmerFilter) {
        setFarmerFilter(savedFarmerFilter);
        sessionStorage.removeItem('catalog_farmer_filter'); // Clear after using
      }
    }
  }, []);

  // Fetch top farmer for Farmer of the Month banner
  useEffect(() => {
    const fetchTopFarmer = async () => {
      try {
        const farmerResp = await clientApi.dashboardTopFarmer();
        setTopFarmer(farmerResp?.farmer);
      } catch (err) {
        console.error('Failed to fetch top farmer:', err);
      }
    };
    fetchTopFarmer();
  }, []);

  // Update category when initialCategory prop changes
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params: Record<string, string> = {};
        if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
        if (searchQuery) params.search = searchQuery;
        if (inSeason) params.urgency = 'high'; // Filter by high urgency for in-season products
        if (sortBy) params.ordering = sortBy;
        if (farmerFilter) params.farmer = farmerFilter;
        
        const response = await clientApi.products.list(params);
        let fetchedProducts = response?.results || [];
        
        // Apply client-side filters
        if (organicOnly) {
          fetchedProducts = fetchedProducts.filter((p: any) => 
            p.product_detail?.name?.toLowerCase().includes('organic') || p.notes?.toLowerCase().includes('organic')
          );
        }
        if (bulkAvailable) {
          fetchedProducts = fetchedProducts.filter((p: any) => parseFloat(p.quantity || 0) >= 100);
        }
        
        setProducts(fetchedProducts);
        setTotalCount(fetchedProducts.length);
        setCurrentPage(1); // Reset to first page on filter change
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchQuery, inSeason, sortBy, organicOnly, bulkAvailable, farmerFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Breadcrumbs */}
      <div className="text-xs text-[#717971] flex items-center gap-1.5 mb-4">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer">Home</button>
        <ChevronRight size={12} />
        <button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors cursor-pointer">Catalog</button>
        <ChevronRight size={12} />
        <span className="text-[#1c1c18] font-bold">Fruits & Orchards</span>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight">Product Catalog</h1>
        <p className="text-xs text-[#717971] mt-1">
          {loading ? 'Loading...' : farmerFilter 
            ? `Showing ${products.length} products from ${farmerFilter}` 
            : `Showing ${products.length} products from certified local suppliers`}
        </p>
        {farmerFilter && (
          <div className="mt-3 inline-flex items-center gap-2 bg-[#144227] text-white text-xs font-bold px-3 py-1.5 rounded-lg">
            <span>Filtered by: {farmerFilter}</span>
            <button
              onClick={() => setFarmerFilter(null)}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar Filters */}
        <div className="space-y-6">
          
          {/* Categories card */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#1c1c18] uppercase tracking-wider">Categories</h3>
            
            <div className="space-y-3">
              {[
                { id: 'all', label: 'All Products', count: products.length },
                { id: 'Fruits', label: 'Fruits', count: 0 },
                { id: 'Vegetables', label: 'Vegetables', count: 0 },
                { id: 'Dairy', label: 'Dairy', count: 0 },
                { id: 'Grains', label: 'Grains', count: 0 },
              ].map((cat) => (
                <label key={cat.id} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat.id}
                      onChange={() => setSelectedCategory(cat.id)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-[#144227] border-[#144227] text-white'
                        : 'border-[#c1c9c0] bg-white group-hover:border-[#144227]'
                    }`}>
                      {selectedCategory === cat.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-xs text-[#414942] font-semibold group-hover:text-[#144227]">{cat.label}</span>
                  </div>
                  <span className="text-[10px] text-[#717971] bg-[#f0eee7] px-1.5 py-0.5 rounded-full font-bold">
                    {cat.id === 'all' ? products.length : cat.count}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Toggle Switches card */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="space-y-4">
              
              {/* Toggle 1: In Season */}
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setInSeason(!inSeason)}>
                <div>
                  <span className="block text-xs font-bold text-[#1c1c18]">In Season</span>
                  <span className="block text-[10px] text-[#717971]">Harvested recently</span>
                </div>
                <button
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                    inSeason ? 'bg-[#9ed0ab]' : 'bg-[#e5e2db]'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white shadow absolute transition-all ${
                    inSeason ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Toggle 2: Bulk */}
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setBulkAvailable(!bulkAvailable)}>
                <div>
                  <span className="block text-xs font-bold text-[#1c1c18]">Bulk Available</span>
                  <span className="block text-[10px] text-[#717971]">Wholesale pricing</span>
                </div>
                <button
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                    bulkAvailable ? 'bg-[#9ed0ab]' : 'bg-[#e5e2db]'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white shadow absolute transition-all ${
                    bulkAvailable ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

            </div>
          </div>

          {/* Farmer of the Month Card (Visible from 20th of the month onwards) */}
          {topFarmer && new Date().getDate() >= 20 && (
            <div className="bg-[#144227] text-white rounded-2xl p-5 shadow-sm space-y-4">
              <span className="inline-block bg-[#376847] text-[#bceec8] text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
                Farmer of the Month
              </span>
              <div>
                <h4 className="text-lg font-bold">{topFarmer.name}</h4>
                <p className="text-xs text-white/80 leading-relaxed mt-1">
                  Top performing supplier this month based on demand fulfillment.
                </p>
              </div>
              <button
                onClick={() => {
                  setFarmerFilter(topFarmer.farmer_name);
                  setSelectedCategory('all');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-[#9ed0ab] hover:underline underline-offset-4 cursor-pointer"
              >
                Browse Collection <ArrowRight size={14} />
              </button>
            </div>
          )}

        </div>

        {/* Right Product Grid */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Controls Bar (Sort By & Layout mode) */}
          <div className="flex items-center justify-between bg-white border border-[#e5e2db] rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#414942]">
              <ArrowUpDown size={14} className="text-[#717971]" />
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-[#144227] focus:outline-none cursor-pointer border-none p-0 ml-1 focus:ring-0"
              >
                <option value="name">Name (A-Z)</option>
                <option value="-name">Name (Z-A)</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
              </select>
            </div>

            <div className="flex items-center gap-1 border-l border-[#f0eee7] pl-3">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-md cursor-pointer ${
                  layoutMode === 'grid' ? 'bg-[#f0eee7] text-[#144227]' : 'text-[#717971] hover:bg-[#fcf9f2]'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 rounded-md cursor-pointer ${
                  layoutMode === 'list' ? 'bg-[#f0eee7] text-[#144227]' : 'text-[#717971] hover:bg-[#fcf9f2]'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-[#144227] animate-spin mx-auto mb-4" />
                <p className="text-sm text-[#717971]">Loading products...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center">
              <Package className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#1c1c18] mb-2">Unable to Load Products</h3>
              <p className="text-sm text-[#717971] mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center">
              <Package className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#1c1c18] mb-2">No Products Found</h3>
              <p className="text-sm text-[#717971] mb-4">Try adjusting your filters or search criteria</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setOrganicOnly(false);
                  setInSeason(false);
                  setBulkAvailable(false);
                  setFarmerFilter(null);
                }}
                className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={
              layoutMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                : "space-y-4"
            }>
              {products
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((prod: any) => {
                // Map supply fields to product fields for display
                const product = {
                  id: prod.id,
                  product_id: prod.product, // Store the actual product ID for orders
                  name: prod.product_detail?.name || prod.name,
                  category: prod.product_detail?.category || prod.category,
                  urgency: prod.product_detail?.urgency || prod.urgency,
                  unit: prod.unit,
                  price: prod.price,
                  image_url: prod.photo || prod.product_detail?.image_url,
                  farmer_name: prod.farmer_name,
                  quantity: prod.quantity
                };
                
                const urgencyBadge = product.urgency === 'high' ? 'SEASONAL' : product.urgency === 'medium' ? 'LIMITED' : null;
                const badgeColor = product.urgency === 'high' ? 'bg-[#9ed0ab] text-[#00210f]' : 'bg-[#ffdcc5] text-[#301400]';
                
                return (
                  <div
                    key={product.id}
                    onClick={() => onNavigate('product-detail', undefined, product.id)}
                    className={`bg-white border border-[#e5e2db] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex ${
                      layoutMode === 'grid' ? 'flex-col justify-between max-w-[260px] w-full mx-auto' : 'flex-row items-center p-4 gap-4'
                    }`}
                  >
                    {/* Product Image */}
                    <div 
                      className={`relative bg-[#f6f3ec] overflow-hidden ${
                        layoutMode === 'grid' ? 'w-full' : 'w-24 h-24 rounded-lg'
                      }`}
                      style={layoutMode === 'grid' ? { aspectRatio: '26 / 24' } : undefined}
                    >
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                      {urgencyBadge && (
                        <span className={`absolute top-2.5 left-2.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-sm ${badgeColor}`}>
                          {urgencyBadge}
                        </span>
                      )}
                    </div>

                    {/* Content Panel */}
                    <div className={`flex-grow flex flex-col justify-between ${
                      layoutMode === 'grid' ? 'p-3.5' : 'p-0'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="block text-[8px] font-bold tracking-wider text-[#717971] uppercase">
                            {product.category || 'Product'}
                          </span>
                          {product.quantity != null && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                              parseFloat(product.quantity) > 50
                                ? 'bg-[#bceec8] text-[#00210f]'
                                : parseFloat(product.quantity) > 10
                                  ? 'bg-[#ffdcc5] text-[#301400]'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {parseFloat(product.quantity).toFixed(0)} {product.unit || 'kg'}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-[#1c1c18] mt-0.5 group-hover:text-[#144227] transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </div>

                      <div className={`flex items-center justify-between border-t border-[#f0eee7] ${
                        layoutMode === 'grid' ? 'mt-2.5 pt-2' : 'mt-2 pt-2'
                      }`}>
                        <div>
                          <span className="block text-xs font-bold text-[#144227]">
                            ${parseFloat(product.price || 0).toFixed(2)}
                          </span>
                          <span className="block text-[8px] text-[#717971] uppercase font-semibold">
                            per {product.unit || 'unit'}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="bg-[#144227] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#376847] transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <ShoppingCart size={11} /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && products.length > 0 && totalCount > itemsPerPage && (
            <div className="flex items-center justify-center gap-1.5 pt-4">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-[#c1c9c0] rounded-lg hover:bg-white text-[#414942] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Dynamic page buttons */}
              {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => i + 1)
                .filter(page => {
                  // Show first page, last page, current page, and pages around current
                  const totalPages = Math.ceil(totalCount / itemsPerPage);
                  return page === 1 || 
                         page === totalPages || 
                         Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, array) => {
                  // Add ellipsis between non-consecutive pages
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;
                  
                  return (
                    <div key={page} className="flex items-center gap-1.5">
                      {showEllipsis && <span className="text-xs text-[#717971] px-1">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                          currentPage === page
                            ? 'bg-[#144227] text-white'
                            : 'border border-[#c1c9c0] hover:bg-white text-[#414942] cursor-pointer'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
              
              <button 
                onClick={() => setCurrentPage(Math.min(Math.ceil(totalCount / itemsPerPage), currentPage + 1))}
                disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                className="p-2 border border-[#c1c9c0] rounded-lg hover:bg-white text-[#414942] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
