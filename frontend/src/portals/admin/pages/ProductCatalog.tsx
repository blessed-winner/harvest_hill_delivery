import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, Trash2, Package, Image as ImageIcon, Sprout, Loader2, X } from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { useCurrency } from '../../../context/CurrencyContext';
import { useAlert } from '../../../context/AlertContext';

interface ProductCatalogProps {
  searchTerm?: string;
}

export function ProductCatalog({ searchTerm = '' }: ProductCatalogProps) {
  const { toast } = useAlert();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const { formatPrice } = useCurrency();

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Vegetables");
  const [formUnit, setFormUnit] = useState("kg");
  const [formPrice, setFormPrice] = useState(""); // Holds entered price
  const [formCurrencyCode, setFormCurrencyCode] = useState<'USD' | 'RWF'>('RWF'); // Custom toggle state
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
  const categories = ['All Products', 'Vegetables', 'Fruits', 'Grains', 'Animal-Based', 'Client Requests'];

  // Product Requests states
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Admin Harvest Modal state
  const [harvestProduct, setHarvestProduct] = useState<any | null>(null);
  const [harvestQty, setHarvestQty] = useState('');
  const [harvestPrice, setHarvestPrice] = useState('');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().slice(0, 10));
  const [harvestGrade, setHarvestGrade] = useState('premium');
  const [harvestNotes, setHarvestNotes] = useState('');
  const [harvestPhotos, setHarvestPhotos] = useState<File[]>([]);
  const [harvestPhotoPreviews, setHarvestPhotoPreviews] = useState<string[]>([]);
  const [isSubmittingHarvest, setIsSubmittingHarvest] = useState(false);

  // Custom Dialog Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    confirmColor?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm'
  });

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

  const loadRequests = () => {
    setIsLoadingRequests(true);
    api.productRequests.list()
      .then(res => {
        setRequests(res || []);
      })
      .catch(err => {
        console.error("Failed to load requests:", err);
      })
      .finally(() => {
        setIsLoadingRequests(false);
      });
  };

  const handleUpdateRequestStatus = async (requestId: number, newStatus: string) => {
    try {
      await api.productRequests.update(requestId, { status: newStatus });
      toast(`Request ${newStatus} successfully.`, "success");
      loadRequests();
    } catch (err: any) {
      toast(err.message || "Failed to update request status.", "error");
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this client request?")) {
      return;
    }
    try {
      await api.productRequests.delete(id);
      toast("Client request deleted successfully.", "success");
      loadRequests();
    } catch (err: any) {
      toast(err.message || "Failed to delete request.", "error");
    }
  };

  const handleCreateProductFromRequest = (req: any) => {
    setFormName(req.product_name);
    setFormCategory(req.category || 'Vegetables');
    setFormUnit(req.unit || 'kg');
    setFormPrice(req.preferred_price ? String(req.preferred_price) : '');
    setFormCurrencyCode("RWF");
    setFormIsCurrentlyNeeded(true);
    setFormUrgency("medium");
    setFormQuantityNeeded(String(req.quantity_needed));
    setImageFile(null);
    setImagePreviewUrl("");
    setErrorMessage("");
    setSelectedProduct("new");
  };

  useEffect(() => {
    if (activeCategory === 'Client Requests') {
      loadRequests();
    } else {
      loadProducts();
    }
  }, [searchTerm, activeCategory]);

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
    setFormCurrencyCode("RWF");
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
    setFormCurrencyCode("USD");
    setFormIsCurrentlyNeeded(product.is_currently_needed || false);
    setFormUrgency(product.urgency || "medium");
    setFormQuantityNeeded(product.quantity_needed ? String(product.quantity_needed) : "");
    setImageFile(null);
    setImagePreviewUrl(product.image_url || "");
    setErrorMessage("");
  };

  const handleOpenHarvestModal = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setHarvestProduct(product);
    setHarvestQty(product.quantity_needed ? String(product.quantity_needed) : '');
    setHarvestPrice(product.base_price ? String(product.base_price) : '');
    setHarvestDate(new Date().toISOString().slice(0, 10));
    setHarvestGrade('premium');
    setHarvestNotes('');
    setHarvestPhotos([]);
    setHarvestPhotoPreviews([]);
  };

  const handleHarvestPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    
    if (harvestPhotos.length + selectedFiles.length > 5) {
      toast("You can upload a maximum of 5 images per harvest batch.", "warning");
    }

    const availableSlots = 5 - harvestPhotos.length;
    const filesToAdd = selectedFiles.slice(0, availableSlots);

    const newPhotos = [...harvestPhotos, ...filesToAdd];
    setHarvestPhotos(newPhotos);

    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
    setHarvestPhotoPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveHarvestPhoto = (index: number) => {
    setHarvestPhotos(prev => prev.filter((_, i) => i !== index));
    setHarvestPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdminSubmitHarvest = async () => {
    if (!harvestProduct || !harvestQty || !harvestPrice) {
      toast("Please enter quantity and asking price", "warning");
      return;
    }
    try {
      setIsSubmittingHarvest(true);

      const payload: any = {
        product: harvestProduct.id,
        quantity: parseFloat(harvestQty),
        price: parseFloat(harvestPrice),
        available_date: harvestDate,
        quality_grade: harvestGrade,
        notes: harvestNotes,
        status: 'accepted' // Auto-accept admin farm harvest
      };

      if (harvestPhotos.length > 0) {
        payload.photoFile = harvestPhotos[0];
        payload.additionalPhotos = harvestPhotos.slice(1);
      }

      await api.supplies.create(payload);
      toast(`Harvest submission for ${harvestProduct.name} recorded successfully with ${harvestPhotos.length} image(s)!`, "success");
      setHarvestProduct(null);
      setHarvestPhotos([]);
      setHarvestPhotoPreviews([]);
      loadProducts();
    } catch (err: any) {
      console.error("Failed to submit admin harvest:", err);
      toast(err.message || "Failed to submit harvest", "error");
    } finally {
      setIsSubmittingHarvest(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!formName || !formPrice || !formQuantityNeeded) {
      setErrorMessage("Name, price and quantity needed are required.");
      return;
    }

    const priceRwf = parseFloat(formPrice);
    const qtyVal = parseFloat(formQuantityNeeded);

    // Validate bounds on the client side
    if (priceRwf <= 0) {
      setErrorMessage("Base price must be greater than zero.");
      return;
    }

    let minQtyNeeded = 1;
    let minQtyMsg = "Quantity needed must be greater than zero.";
    const lowerUnit = formUnit.toLowerCase();

    if (lowerUnit.includes('kg')) {
      minQtyNeeded = 20;
      minQtyMsg = "Quantity needed must be at least 20 kg.";
    } else if (lowerUnit.includes('litre') || lowerUnit.includes('liter') || lowerUnit === 'l') {
      minQtyNeeded = 15;
      minQtyMsg = "Quantity needed must be at least 15 litres.";
    } else if (lowerUnit.includes('crate')) {
      minQtyNeeded = 10;
      minQtyMsg = "Quantity needed must be at least 10 crates.";
    } else if (lowerUnit.includes('jar')) {
      minQtyNeeded = 10;
      minQtyMsg = "Quantity needed must be at least 10 jars.";
    } else if (lowerUnit.includes('bundle')) {
      minQtyNeeded = 10;
      minQtyMsg = "Quantity needed must be at least 10 bundles.";
    }

    if (qtyVal < minQtyNeeded) {
      setErrorMessage(minQtyMsg);
      return;
    }

    // Check duplicate name case-insensitively on client side
    const isDuplicate = products.some(p => 
      p.name.toLowerCase() === formName.toLowerCase() && 
      (!selectedProduct || p.id !== selectedProduct.id)
    );
    if (isDuplicate) {
      setErrorMessage("A product with this name already exists in the catalog.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append('name', formName);
    formData.append('category', formCategory);
    formData.append('unit', formUnit);
    formData.append('base_price', String(priceRwf));
    formData.append('is_currently_needed', String(formIsCurrentlyNeeded));
    formData.append('urgency', formUrgency);
    formData.append('quantity_needed', String(qtyVal));
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (selectedProduct === 'new') {
        await api.products.create(formData);
      } else {
        await api.products.update(selectedProduct.id, formData);
      }
      setImageFile(null);
      setImagePreviewUrl("");
      setErrorMessage("");
      setSelectedProduct(null);
      loadProducts();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Product Spec',
      message: `Are you sure you want to permanently delete the product spec for ${product.name}?`,
      confirmText: 'Delete crop',
      confirmColor: 'bg-red-600',
      onConfirm: async () => {
        try {
          await api.products.delete(product.id);
          setSelectedProduct(null);
          loadProducts();
        } catch (err: any) {
          toast(err.message || "Failed to delete product.", "error");
        }
      }
    });
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
      <div className="px-6 py-5 shrink-0 bg-white border-b border-outline-variant">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">Product Catalog</h2>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Manage crop specifications, price targets, and buyer sourcing demands.</p>
          </div>
          <button 
            onClick={handleOpenAddProduct}
            className="flex items-center justify-center px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 transition-all cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Product Spec
          </button>
        </div>

        <div className="max-w-full overflow-x-auto scrollbar-none">
          <div className="flex space-x-1 bg-surface-container-low p-1 rounded-xl w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
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
      </div>

      <div className="p-8 flex-1">
        {activeCategory === 'Client Requests' ? (
          isLoadingRequests ? (
            <div className="p-8 text-center text-on-surface-variant font-medium animate-pulse">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-on-surface-variant">
              <AlertCircle className="w-8 h-8 opacity-40 text-primary mb-2" />
              <p className="text-sm font-bold">No product requests found.</p>
              <p className="text-xs">Client requests will appear here once submitted.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl border border-outline-variant/30 shadow-sm">
              <table className="min-w-full divide-y divide-outline-variant/20">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Client</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Requested Crop</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Category</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Qty Needed</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Target Price</th>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th scope="col" className="px-6 py-4 text-center text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 bg-white">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-surface-container-low/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-on-surface">{req.client_name || 'Client'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-primary">{req.product_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-on-surface-variant">{req.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-on-surface">{parseFloat(req.quantity_needed).toLocaleString()} {req.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-emerald-700 font-bold">
                        {req.preferred_price ? `RWF ${parseFloat(req.preferred_price).toLocaleString()}` : 'Flexible'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider font-extrabold border shadow-sm inline-block",
                          req.status === 'approved' && "bg-[#bceec8] text-[#00210f] border-[#bceec8]",
                          req.status === 'pending' && "bg-amber-100 text-amber-800 border-amber-200",
                          req.status === 'fulfilled' && "bg-blue-100 text-blue-800 border-blue-200",
                          req.status === 'rejected' && "bg-red-100 text-red-800 border-red-200"
                        )}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold space-x-2">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateRequestStatus(req.id, 'approved')}
                              className="px-2.5 py-1.5 bg-[#144227] hover:bg-[#0c2a18] text-white rounded-lg transition-all cursor-pointer shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                              className="px-2.5 py-1.5 bg-[#7f1d1d] hover:bg-[#450a0a] text-white rounded-lg transition-all cursor-pointer shadow-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {req.status === 'approved' && (
                          <button
                            onClick={() => handleCreateProductFromRequest(req)}
                            className="px-2.5 py-1.5 bg-[#144227] hover:bg-[#376847] text-white rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1.5 inline-flex"
                          >
                            <Plus size={11} className="mr-1" /> Create Template
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1 inline-flex"
                          title="Delete Request"
                        >
                          <Trash2 size={11} className="mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <>
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
    
                        <div className="mt-4 pt-3 border-t border-outline-variant/30 space-y-2">
                          <div className="flex justify-between items-center text-xs">
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
    
                          <button
                            onClick={(e) => handleOpenHarvestModal(product, e)}
                            className="w-full py-2 bg-[#144227] hover:bg-[#376847] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Sprout size={14} /> Submit Harvest
                          </button>
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
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 font-semibold">{errorMessage}</p>
              </div>
            )}
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => {
                  setSelectedProduct(null);
                  setErrorMessage("");
                }}
                disabled={isSaving}
                className="flex-1 px-6 py-3 border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-high transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="flex-[2] px-6 py-3 bg-primary text-white rounded-lg font-bold shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSaving ? 'Creating...' : 'Save Product'}
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
                placeholder="e.g. Roma Tomatoes"
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
                <option value="Animal-Based">Animal-Based</option>
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
                <option value="litre">litre</option>
                <option value="crate">crate</option>
                <option value="jar">jar</option>
                <option value="bundle">bundle</option>
                <option value="dozen">dozen</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                Base Price (RWF)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="e.g. 1500" 
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm font-medium outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Quantity Needed</label>
              <input 
                type="number" 
                placeholder={(() => {
                  const u = (formUnit || 'kg').toLowerCase();
                  if (u.includes('kg')) return 'Min 20 kg';
                  if (u.includes('litre') || u.includes('liter') || u === 'l') return 'Min 15 litres';
                  if (u.includes('crate')) return 'Min 10 crates';
                  if (u.includes('jar')) return 'Min 10 jars';
                  if (u.includes('bundle')) return 'Min 10 bundles';
                  return 'Min 1 unit';
                })()}
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

      {/* Premium Confirm Dialog Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/50 transform scale-100 transition-all space-y-4">
            <h3 className="text-lg font-extrabold text-primary">{confirmDialog.title}</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold text-white shadow-md hover:opacity-90 transition-all cursor-pointer",
                  confirmDialog.confirmColor || "bg-primary"
                )}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Harvest Submission Window Modal */}
      {harvestProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-outline-variant/60 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e5e2db] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#eef7f0] text-[#144227] flex items-center justify-center shadow-sm">
                  <Sprout size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1c1c18] tracking-tight">Record Harvest Batch</h3>
                  <p className="text-xs text-[#717971] font-medium">{harvestProduct.name} • <span className="text-[#144227] font-bold">{harvestProduct.category}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setHarvestProduct(null)} 
                className="w-8 h-8 rounded-full bg-[#f6f3ec] hover:bg-[#e5e2db] text-[#414942] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Fields */}
            <div className="space-y-4">
              <div className="bg-[#f0eee7]/60 p-3 rounded-xl flex items-center justify-between text-xs text-[#414942]">
                <span className="font-semibold text-[#717971]">Supply Status:</span>
                <span className="bg-[#bceec8] text-[#00210f] font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  Auto-Accepted (Instant Live)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-[#1c1c18] uppercase tracking-wider">
                    Quantity ({harvestProduct.unit})
                  </label>
                  <input
                    type="number"
                    value={harvestQty}
                    onChange={(e) => setHarvestQty(e.target.value)}
                    placeholder={`e.g. 50 ${harvestProduct.unit}`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c9c0] focus:border-[#144227] text-xs font-semibold outline-none transition-all placeholder-[#717971]/60 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-[#1c1c18] uppercase tracking-wider">
                    Asking Price (RWF / {harvestProduct.unit})
                  </label>
                  <input
                    type="number"
                    value={harvestPrice}
                    onChange={(e) => setHarvestPrice(e.target.value)}
                    placeholder="e.g. 1200"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c9c0] focus:border-[#144227] text-xs font-semibold outline-none transition-all placeholder-[#717971]/60 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-[#1c1c18] uppercase tracking-wider">Harvest Date</label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c9c0] focus:border-[#144227] text-xs font-semibold outline-none transition-all bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-[#1c1c18] uppercase tracking-wider">Quality Grade</label>
                  <select
                    value={harvestGrade}
                    onChange={(e) => setHarvestGrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c9c0] focus:border-[#144227] text-xs font-bold outline-none transition-all bg-white cursor-pointer"
                  >
                    <option value="premium">Premium (Grade A)</option>
                    <option value="standard">Standard (Grade B)</option>
                    <option value="economy">Economy (Grade C)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#1c1c18] uppercase tracking-wider">Batch Notes & Storage Instructions</label>
                <textarea
                  rows={2}
                  value={harvestNotes}
                  onChange={(e) => setHarvestNotes(e.target.value)}
                  placeholder="Optional details e.g. Harvested from Sector A, cold storage ready..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c9c0] focus:border-[#144227] text-xs font-semibold outline-none transition-all placeholder-[#717971]/60 resize-none bg-white"
                />
              </div>

              {/* Multi-Image Upload Section */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-[#1c1c18] uppercase tracking-wider">
                    Batch Photos (Up to 5 images)
                  </label>
                  <span className="text-[10px] text-[#717971] font-mono">
                    {harvestPhotos.length}/5 photos
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {harvestPhotoPreviews.map((preview, idx) => (
                    <div key={idx} className="relative h-16 rounded-xl overflow-hidden border border-[#c1c9c0] group shadow-sm">
                      <img src={preview} className="w-full h-full object-cover" alt={`Batch photo ${idx + 1}`} />
                      <button
                        type="button"
                        onClick={() => handleRemoveHarvestPhoto(idx)}
                        className="absolute top-1 right-1 bg-red-600/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                        title="Remove image"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}

                  {harvestPhotos.length < 5 && (
                    <label className="h-16 rounded-xl border-2 border-dashed border-[#c1c9c0] hover:border-[#144227] flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#f6f3ec]/40 hover:bg-[#f6f3ec]">
                      <Plus size={16} className="text-[#144227]" />
                      <span className="text-[9px] font-bold text-[#717971] mt-0.5">Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleHarvestPhotoSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setHarvestProduct(null)}
                className="w-1/3 py-3 border border-[#c1c9c0] text-[#414942] hover:bg-[#f6f3ec] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingHarvest}
                onClick={handleAdminSubmitHarvest}
                className="w-2/3 py-3 bg-[#144227] hover:bg-[#376847] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmittingHarvest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sprout size={16} />}
                Record Batch Harvest
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
