import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, AlertCircle, Trash2, Package, ArrowRight, X, Image as ImageIcon } from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { api } from '../lib/api';

interface ProductCatalogProps {
  searchTerm?: string;
}

export function ProductCatalog({ searchTerm = '' }: ProductCatalogProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Vegetables");
  const [formUnit, setFormUnit] = useState("kg");
  const [formPrice, setFormPrice] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formIsCurrentlyNeeded, setFormIsCurrentlyNeeded] = useState(false);
  const [formUrgency, setFormUrgency] = useState("medium");
  const [formQuantityNeeded, setFormQuantityNeeded] = useState("");

  const [activeCategory, setActiveCategory] = useState('All Products');
  const categories = ['All Products', 'Vegetables', 'Fruits', 'Grains', 'Dairy'];

  const loadProducts = () => {
    setIsLoading(true);
    const params: Record<string, string> = {};
    if (searchTerm) params.search = searchTerm;
    api.products.list(params)
      .then(res => {
        setProducts(res || []);
      })
      .catch(err => {
        console.error("Failed to load products:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm]);

  const handleToggleNeeded = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.products.update(product.id, { is_currently_needed: !product.is_currently_needed });
      loadProducts();
    } catch (err) {
      console.error("Failed to toggle needed status:", err);
    }
  };

  const handleOpenAddProduct = () => {
    setFormName("");
    setFormCategory("Vegetables");
    setFormUnit("kg");
    setFormPrice("");
    setFormImage("");
    setFormIsCurrentlyNeeded(false);
    setFormUrgency("medium");
    setFormQuantityNeeded("");
    setSelectedProduct("new");
  };

  const handleOpenEditProduct = (product: any) => {
    setSelectedProduct(product);
    setFormName(product.name || "");
    setFormCategory(product.category || "Vegetables");
    setFormUnit(product.unit || "kg");
    setFormPrice(product.base_price ? String(product.base_price) : "");
    setFormImage(product.image || "");
    setFormIsCurrentlyNeeded(product.is_currently_needed || false);
    setFormUrgency(product.urgency || "medium");
    setFormQuantityNeeded(product.quantity_needed ? String(product.quantity_needed) : "");
  };

  const handleSaveProduct = async () => {
    if (!formName || !formPrice) {
      alert("Name and price are required.");
      return;
    }

    const payload: any = {
      name: formName,
      category: formCategory,
      unit: formUnit,
      base_price: parseFloat(formPrice),
      is_currently_needed: formIsCurrentlyNeeded,
      urgency: formUrgency,
      quantity_needed: formQuantityNeeded ? parseFloat(formQuantityNeeded) : 0,
    };

    if (formImage) {
      payload.image = formImage;
    }

    try {
      if (selectedProduct === 'new') {
        await api.products.create(payload);
      } else {
        await api.products.update(selectedProduct.id, payload);
      }
      setSelectedProduct(null);
      loadProducts();
    } catch (err: any) {
      alert(err.message || "Failed to save product.");
    }
  };

  const handleDeleteProduct = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;
    try {
      await api.products.delete(product.id);
      setSelectedProduct(null);
      loadProducts();
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All Products' || p.category === activeCategory;
    const matchesSearch = searchTerm 
      ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

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
            onClick={handleOpenAddProduct}
            className="flex items-center px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-on-surface-variant font-medium">Loading catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant font-medium">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={product.id}
                onClick={() => handleOpenEditProduct(product)}
                className="group bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden bg-surface-container-low flex items-center justify-center">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      alt={product.name} 
                    />
                  ) : (
                    <Package className="w-12 h-12 text-outline-variant" />
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center shadow-sm">
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-2",
                      product.is_currently_needed ? "bg-green-600" : "bg-outline"
                    )} />
                    <span className="text-[10px] font-bold text-on-surface uppercase tracking-tighter">
                      {product.is_currently_needed ? 'Needed' : 'Normal'}
                    </span>
                  </div>
                  {product.is_currently_needed && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {product.urgency || 'Medium'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">{product.category}</p>
                      <h3 className="font-bold text-on-surface text-base">{product.name}</h3>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteProduct(product, e)}
                      className="p-1.5 text-outline hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-outline-variant/20">
                    <div>
                      <span className="text-on-surface-variant text-[10px] font-bold uppercase">Base Price</span>
                      <p className="text-xl font-bold text-primary">
                        ${parseFloat(product.base_price).toFixed(2)} <span className="text-xs font-medium text-on-surface-variant">/ {product.unit}</span>
                      </p>
                    </div>
                    <div 
                      onClick={(e) => handleToggleNeeded(product, e)}
                      className={cn(
                        "w-10 h-5 rounded-full p-1 transition-colors cursor-pointer",
                        product.is_currently_needed ? "bg-primary" : "bg-outline-variant"
                      )}
                    >
                      <div className={cn(
                        "w-3 h-3 bg-white rounded-full transition-all",
                        product.is_currently_needed ? "translate-x-5" : "translate-x-0"
                      )} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <DetailDrawer
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct === 'new' ? "Add New Product" : "Edit Product Specifications"}
        subtitle="Configure product metrics, base pricing, and market urgency levels"
        footer={
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="flex-1 px-6 py-3 border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-high transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveProduct}
              className="flex-[2] px-6 py-3 bg-primary text-white rounded-lg font-bold shadow-md hover:opacity-90 transition-all"
            >
              Save Product
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Product Image URL</label>
            <input 
              type="text" 
              placeholder="e.g. https://images.unsplash.com/photo-..."
              value={formImage}
              onChange={(e) => setFormImage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-medium outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Product Name</label>
              <input 
                type="text" 
                placeholder="e.g. Organic Blueberries"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-medium outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Category</label>
              <select 
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-medium outline-none"
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Dairy">Dairy</option>
                <option value="Grains">Grains</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Unit</label>
              <select 
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-medium outline-none"
              >
                <option value="kg">kg</option>
                <option value="crate">crate</option>
                <option value="jar">jar</option>
                <option value="bundle">bundle</option>
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
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-medium outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Quantity Needed</label>
              <input 
                type="number" 
                placeholder="0.00"
                value={formQuantityNeeded}
                onChange={(e) => setFormQuantityNeeded(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-medium outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-surface-container-low rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Currently Needed</span>
              <AlertCircle className="w-4 h-4 text-on-surface-variant/40" />
            </div>
            <div 
              onClick={() => setFormIsCurrentlyNeeded(!formIsCurrentlyNeeded)}
              className={cn(
                "w-10 h-5 rounded-full p-1 transition-colors cursor-pointer",
                formIsCurrentlyNeeded ? "bg-primary" : "bg-outline-variant"
              )}
            >
              <div className={cn(
                "w-3 h-3 bg-white rounded-full transition-all",
                formIsCurrentlyNeeded ? "translate-x-5" : "translate-x-0"
              )} />
            </div>
          </div>

          {formIsCurrentlyNeeded && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Urgency Level</label>
              <select 
                value={formUrgency}
                onChange={(e) => setFormUrgency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-medium outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}
        </div>
      </DetailDrawer>
    </div>
  );
}
