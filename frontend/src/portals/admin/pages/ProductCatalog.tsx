import React, { useState } from 'react';
import { Search, Plus, MoreVertical, AlertCircle, Calendar, Package, ArrowRight, X, Image as ImageIcon } from 'lucide-react';
import { Product } from '../types';
import { DetailDrawer } from './DetailDrawer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const mockProducts: Product[] = [
  {
    id: 'FR-APP-GALA-02',
    name: 'Heirloom Tomatoes',
    category: 'Vegetables',
    price: 4.50,
    unit: 'kg',
    status: 'active',
    season: 'Summer',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400',
    isPriority: true
  },
  {
    id: 'FR-APP-HNY-01',
    name: 'Honeycrisp Apple',
    category: 'Fruits',
    price: 125.00,
    unit: 'crate',
    status: 'active',
    season: 'Autumn',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bccb?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'VG-ASP-WHT-01',
    name: 'White Asparagus',
    category: 'Vegetables',
    price: 8.20,
    unit: 'kg',
    status: 'inactive',
    season: 'Spring',
    image: 'https://images.unsplash.com/photo-1515471204579-47dad4368482?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'PN-HON-WILD-15',
    name: 'Wildflower Honey',
    category: 'Supplies',
    price: 12.00,
    unit: 'jar',
    status: 'active',
    season: 'Year-Round',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400',
    isPriority: true
  }
];

export function ProductCatalog() {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Products');

  const categories = ['All Products', 'Vegetables', 'Fruits', 'Grains', 'Dairy'];

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 shrink-0 bg-white">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-on-surface mb-4">Product Catalog</h2>
            <div className="flex space-x-1 bg-surface-container-low p-1 rounded-xl w-fit">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                    activeCategory === cat 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setIsAddingProduct(true)}
            className="flex items-center px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockProducts.filter(p => activeCategory === 'All Products' || p.category === activeCategory).map((product, i) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={product.id}
              className={cn(
                "group bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
                product.status === 'inactive' && "opacity-75 grayscale-[0.3]"
              )}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={product.image} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  alt={product.name} 
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center shadow-sm">
                  <div className={cn(
                    "w-2 h-2 rounded-full mr-2",
                    product.status === 'active' ? "bg-green-600" : "bg-outline"
                  )} />
                  <span className="text-[10px] font-bold text-on-surface uppercase tracking-tighter">{product.status}</span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {product.season}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">{product.category}</p>
                    <h3 className="font-bold text-on-surface text-base">{product.name}</h3>
                  </div>
                  {product.isPriority && (
                    <AlertCircle className="w-4 h-4 text-primary fill-primary/10" />
                  )}
                </div>
                
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-outline-variant/20">
                  <div>
                    <span className="text-on-surface-variant text-[10px] font-bold uppercase">Base Price</span>
                    <p className="text-xl font-bold text-primary">
                      ${product.price.toFixed(2)} <span className="text-xs font-medium text-on-surface-variant">/ {product.unit}</span>
                    </p>
                  </div>
                  <div className={cn(
                    "w-10 h-5 rounded-full p-1 transition-colors cursor-pointer",
                    product.status === 'active' ? "bg-primary" : "bg-outline-variant"
                  )}>
                    <div className={cn(
                      "w-3 h-3 bg-white rounded-full transition-all",
                      product.status === 'active' ? "translate-x-5" : "translate-x-0"
                    )} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <DetailDrawer
        isOpen={isAddingProduct}
        onClose={() => setIsAddingProduct(false)}
        title="Add New Product"
        subtitle="Configure product specifications and inventory status"
        footer={
          <div className="flex gap-3">
            <button 
              onClick={() => setIsAddingProduct(false)}
              className="flex-1 px-6 py-3 border border-primary text-primary rounded-lg font-bold hover:bg-primary/5 transition-all"
            >
              Cancel
            </button>
            <button className="flex-[2] px-6 py-3 bg-primary text-white rounded-lg font-bold shadow-md hover:opacity-90 transition-all">
              Save Product
            </button>
          </div>
        }
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Product Thumbnail</label>
            <div className="w-full h-48 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group">
              <ImageIcon className="w-8 h-8 text-outline mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-bold text-on-surface-variant">Click or drag to upload high-res image</p>
              <p className="text-[10px] text-outline font-bold mt-1">JPEG, PNG up to 10MB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Product Name</label>
              <input 
                type="text" 
                placeholder="e.g. Organic Blueberries"
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Category</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary text-sm font-medium">
                <option>Vegetables</option>
                <option>Fruits</option>
                <option>Dairy</option>
                <option>Grains</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Unit</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary text-sm font-medium">
                <option>kg</option>
                <option>crate</option>
                <option>jar</option>
                <option>bundle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Base Price ($)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                step="0.01"
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Seasonal Range</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary text-sm font-medium">
                <option>Year-Round</option>
                <option>Spring</option>
                <option>Summer</option>
                <option>Autumn</option>
                <option>Winter</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-surface-container-low rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Currently Needed</span>
              <AlertCircle className="w-4 h-4 text-on-surface-variant/40" />
            </div>
            <div className="w-10 h-5 bg-outline-variant rounded-full p-1">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </DetailDrawer>
    </div>
  );
}
