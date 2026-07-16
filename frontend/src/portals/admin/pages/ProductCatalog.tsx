import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, Trash2, Package, Image as ImageIcon } from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { useCurrency } from '../../../context/CurrencyContext';

interface ProductCatalogProps {
  searchTerm?: string;
}

export function ProductCatalog({ searchTerm = '' }: ProductCatalogProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const { formatPrice } = useCurrency();

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Vegetables");
  const [formUnit, setFormUnit] = useState("kg");
  const [formPrice, setFormPrice] = useState("");
  const [formIsCurrentlyNeeded, setFormIsCurrentlyNeeded] = useState(false);
  const [formUrgency, setFormUrgency] = useState("medium");
  const [formQuantityNeeded, setFormQuantityNeeded] = useState("");

  // File Upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");

  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [activeCategory, setActiveCategory] = useState('All Products');
  const categories = ['All Products', 'Vegetables', 'Fruits', 'Grains', 'Dairy'];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchTerm]);

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
    setFormIsCurrentlyNeeded(false);
    setFormUrgency("medium");
    setFormQuantityNeeded("");
    setImageFile(null);
    setImagePreviewUrl("");
    setErrorMessage("");
    setSelectedProduct("new");
  };

  const handleOpenEditProduct = (product: any) => {
    setSelectedProduct(product);
    setFormName(product.name || "");
    setFormCategory(product.category || "Vegetables");
    setFormUnit(product.unit || "kg");
    setFormPrice(product.base_price ? String(product.base_price) : "");
    setFormIsCurrentlyNeeded(product.is_currently_needed || false);
    setFormUrgency(product.urgency || "medium");
    setFormQuantityNeeded(product.quantity_needed ? String(product.quantity_needed) : "");
    setImageFile(null);
    // Use the Cloudinary image_url for display preview
    setImagePreviewUrl(product.image_url || "");
    setErrorMessage("");
  };

  const handleSaveProduct = async () => {
    if (!formName || !formPrice) {
      setErrorMessage("Name and price are required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append('name', formName);
    formData.append('category', formCategory);
    formData.append('unit', formUnit);
    formData.append('base_price', String(parseFloat(formPrice)));
    formData.append('is_currently_needed', String(formIsCurrentlyNeeded));
    formData.append('urgency', formUrgency);
    formData.append('quantity_needed', formQuantityNeeded ? String(parseFloat(formQuantityNeeded)) : '0');
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (selectedProduct === 'new') {
        await api.products.create(formData);
      } else {
        await api.products.update(selectedProduct.id, formData);
      }
      // Clear the form state
      setImageFile(null);
      setImagePreviewUrl("");
      setErrorMessage("");
      setSelectedProduct(null);
      // Reload products to get fresh data including new image URLs
      loadProducts();
    } catch (err: any) {
      // Handle duplicate validation error
      const errMsg = err.message || "Failed to save product.";
      if (errMsg.includes("already exists") || errMsg.includes("duplicate")) {
        setErrorMessage("This product already exists with the same details. Please modify at least one field.");
      } else {
        setErrorMessage(errMsg);
      }
    } finally {
      setIsSaving(false);
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

  const getUrgencyBadgeClass = (urgency: string) => {
    const u = (urgency || '').toLowerCase();
    switch (u) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'steady': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Pagination calculations
  const productsPerPage = 8;
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="flex flex-col h-full bg-[#f9f9f7] pb-10">
      <div className="p-8 shrink-0 bg-white border-b border-outline-variant">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-on-surface mb-4">Product Catalog</h2>
            <div className="flex space-x-1 bg-surface-container-low p-1 rounded-xl w-fit">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer",
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
            className="flex items-center px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </button>
        </div>
      </div>

      <div className="p-8 flex-1">
        {isLoading ? (
          <div className="p-8 text-center text-on-surface-variant font-medium animate-pulse">Loading catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center text-on-surface-variant">
            <AlertCircle className="w-8 h-8 opacity-40 text-primary mb-2" />
            <p className="text-sm font-bold">No products found.</p>
            <p className="text-xs">Add new crops or change categories.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentProducts.map((product, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={product.id}
                  onClick={() => handleOpenEditProduct(product)}
                  className="group bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden bg-surface-container-low flex items-center justify-center">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        alt={product.name} 
                      />
                    ) : (
                      <Package className="w-12 h-12 text-outline-variant" />
                    )}
                    
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center shadow-sm">
                      <div className={cn(
                        "w-2 h-2 rounded-full mr-2",
                        product.is_currently_needed ? "bg-green-600 animate-pulse" : "bg-outline"
                      )} />
                      <span className="text-[10px] font-bold text-on-surface uppercase tracking-tighter">
                        {product.is_currently_needed ? 'Needed' : 'Normal'}
                      </span>
                    </div>

                    {product.is_currently_needed && (
                      <div className="absolute top-3 right-3">
                        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm", getUrgencyBadgeClass(product.urgency))}>
                          {product.urgency || 'Medium'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm truncate pr-2">{product.name}</h3>
                      <button 
                        onClick={(e) => handleDeleteProduct(product, e)}
                        className="p-1 text-on-surface-variant hover:text-red-600 rounded-full hover:bg-surface-container transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Base Price</p>
                        <p className="font-mono text-sm font-bold text-primary">{formatPrice(product.base_price)} / {product.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Qty Needed</p>
                        <p className="font-mono text-sm font-bold text-on-surface">{parseFloat(product.quantity_needed).toLocaleString()} {product.unit}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant/30 flex justify-between items-center text-xs">
                      <p className="text-on-surface-variant/80 font-medium">Toggle Requirement</p>
                      <div 
                        onClick={(e) => handleToggleNeeded(product, e)}
                        className={cn(
                          "w-10 h-5 rounded-full p-1 transition-colors cursor-pointer",
                          product.is_currently_needed ? "bg-primary" : "bg-outline-variant"
                        )}
                      >
                        <div className={cn(
                          "w-3 h-3 bg-white rounded-full transition-all shadow-sm",
                          product.is_currently_needed ? "translate-x-5" : "translate-x-0"
                        )} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 px-6 py-4 bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-bold">
                  Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} crops
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
          </>
        )}
      </div>

      <DetailDrawer
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct === 'new' ? "Add New Product" : "Edit Product Specifications"}
        subtitle="Configure product metrics, base pricing, and market urgency levels"
        footer={
          <div className="w-full space-y-3">
            {errorMessage && (
              <div className="px-4 py-3 bg-error/10 border border-error/30 rounded-lg">
                <p className="text-sm text-error font-medium">{errorMessage}</p>
              </div>
            )}
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => {
                  setSelectedProduct(null);
                  setErrorMessage("");
                }}
                disabled={isSaving}
                className="flex-1 px-6 py-3 border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-high transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="flex-[2] px-6 py-3 bg-primary text-white rounded-lg font-bold shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Product'
                )}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* File Upload Preview Panel */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Product Photo</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-outline-variant border-dashed rounded-xl hover:border-primary/50 transition-colors bg-surface-container-low/50 relative overflow-hidden group min-h-[180px] items-center">
              {imagePreviewUrl ? (
                <div className="w-full h-full relative">
                  <img src={imagePreviewUrl} className="w-full h-full object-cover rounded-lg" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
                    <p className="text-white text-xs font-bold">Click to change image</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreviewUrl("");
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                    >
                      Remove Image
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-1 text-center w-full">
                  <ImageIcon className="mx-auto h-12 w-12 text-outline-variant" />
                  <div className="flex text-sm text-on-surface-variant justify-center mt-2">
                    <label className="relative cursor-pointer bg-transparent rounded-md font-semibold text-primary hover:text-primary-container focus-within:outline-none">
                      <span>Upload an image file</span>
                    </label>
                  </div>
                  <p className="text-xs text-on-surface-variant/70">PNG, JPG, GIF up to 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              )}
            </div>
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
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-medium outline-none bg-white"
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
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-medium outline-none bg-white"
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
                "w-3 h-3 bg-white rounded-full transition-all shadow-sm",
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
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-medium outline-none bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="steady">Steady</option>
              </select>
            </div>
          )}
        </div>
      </DetailDrawer>
    </div>
  );
}
