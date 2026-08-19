import React, { useState, useEffect, useMemo } from 'react';
import { Plus, AlertCircle, Trash2, Package, Image as ImageIcon, Sprout, Loader2, X, Handshake, Calendar, ShieldCheck, FileText, CheckCircle2, Clock, Tag, Info } from 'lucide-react';
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
  const [formPricingMode, setFormPricingMode] = useState<string>("harvest_hill_offers");
  const [formOfferedPrice, setFormOfferedPrice] = useState<string>("");
  const [formPrice, setFormPrice] = useState(""); // Holds entered reference price
  const [formQuantityNeeded, setFormQuantityNeeded] = useState("");
  const [formStatus, setFormStatus] = useState<string>("open");
  const [formQualityRequirements, setFormQualityRequirements] = useState<string>("");
  const [formSubmissionDeadline, setFormSubmissionDeadline] = useState<string>("");
  const [formPreferredPeriod, setFormPreferredPeriod] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");

  // Status Filter Tabs
  const [activeStatusTab, setActiveStatusTab] = useState<string>('all');

  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Vegetables', 'Fruits', 'Herbs', 'Grains', 'Animal-Based', 'Client Requests'];

  // Product Requests states
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Admin Harvest Modal state
  const [harvestProduct, setHarvestProduct] = useState<any | null>(null);
  const [harvestQty, setHarvestQty] = useState('');
  const [harvestPrice, setHarvestPrice] = useState('');
  const [harvestBulkMinQty, setHarvestBulkMinQty] = useState('');
  const [harvestBulkPrice, setHarvestBulkPrice] = useState('');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().slice(0, 10));
  const [harvestGrade, setHarvestGrade] = useState('premium');
  const [harvestNotes, setHarvestNotes] = useState('');
  const [harvestPhotos, setHarvestPhotos] = useState<File[]>([]);
  const [harvestPhotoPreviews, setHarvestPhotoPreviews] = useState<string[]>([]);
  const [isSubmittingHarvest, setIsSubmittingHarvest] = useState(false);

  // Delegate Discount Modal state
  const [discountProduct, setDiscountProduct] = useState<any | null>(null);
  const [discountIsActive, setDiscountIsActive] = useState(false);
  const [discountPriceInput, setDiscountPriceInput] = useState('');
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);

  // Master Product Sourcing & Negotiation History Drawer state
  const [historyProduct, setHistoryProduct] = useState<any | null>(null);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

  const handleSaveDiscount = async () => {
    if (!discountProduct) return;
    try {
      setIsSavingDiscount(true);
      const payload: any = {
        is_discounted: discountIsActive,
        discount_price: discountIsActive && discountPriceInput ? parseFloat(discountPriceInput) : null,
      };
      await api.products.update(discountProduct.id, payload);
      toast(`Special fresh discount updated for ${discountProduct.name}!`, "success");
      setDiscountProduct(null);
      loadProducts();
    } catch (err: any) {
      toast(err.message || "Failed to update discount.", "error");
    } finally {
      setIsSavingDiscount(false);
    }
  };

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
    if (activeStatusTab !== 'all') params.status = activeStatusTab;
    api.products.list(params)
      .then(res => {
        setProducts(res || []);
      })
      .catch(err => {
        console.error("Failed to load product requirements:", err);
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
    setFormPricingMode('harvest_hill_offers');
    setFormOfferedPrice(req.preferred_price ? String(req.preferred_price) : '');
    setFormPrice(req.preferred_price ? String(req.preferred_price) : '');
    setFormQuantityNeeded(String(req.quantity_needed));
    setFormStatus('open');
    setFormQualityRequirements("");
    setFormSubmissionDeadline("");
    setFormPreferredPeriod("");
    setFormDescription(req.notes || "");
    setErrorMessage("");
    setSelectedProduct("new");
  };

  useEffect(() => {
    if (activeCategory === 'Client Requests') {
      loadRequests();
    } else {
      loadProducts();
    }
  }, [searchTerm, activeCategory, activeStatusTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchTerm]);

  const handleToggleNeeded = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const todayStr = new Date().toISOString().slice(0, 10);
    const isPastDeadline = product.submission_deadline && product.submission_deadline < todayStr;

    // If attempting to open/activate a requirement whose deadline has passed, open edit modal and prompt admin to update date!
    if ((!product.is_currently_needed || product.status !== 'open') && isPastDeadline) {
      toast(`Submission deadline for "${product.name}" (${product.submission_deadline}) has passed. Please update the deadline date to activate it.`, "warning");
      handleOpenEditProduct(product);
      return;
    }

    try {
      await api.products.update(product.id, { is_currently_needed: !product.is_currently_needed });
      toast(`Market demand status for ${product.name} updated!`, "success");
      loadProducts();
    } catch (err: any) {
      console.error("Failed to toggle needed status:", err);
      toast(err.message || "Failed to toggle market demand status.", "warning");
    }
  };

  const handleOpenAddProduct = () => {
    setFormName("");
    setFormCategory("Vegetables");
    setFormUnit("kg");
    setFormPricingMode("harvest_hill_offers");
    setFormOfferedPrice("");
    setFormPrice("");
    setFormQuantityNeeded("");
    setFormStatus("open");
    setFormQualityRequirements("");
    setFormSubmissionDeadline("");
    setFormPreferredPeriod("");
    setFormDescription("");
    setErrorMessage("");
    setSelectedProduct("new");
  };

  const handleOpenEditProduct = (product: any) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setSelectedProduct(product);
    setFormName(product.name || "");
    setFormCategory(product.category || "Vegetables");
    setFormUnit(product.unit || "kg");
    const pm = product.pricing_mode || (product.offered_price || product.base_price ? 'harvest_hill_offers' : 'farmer_proposes');
    setFormPricingMode(pm);
    const pVal = (product.offered_price !== null && product.offered_price !== undefined) 
      ? String(product.offered_price) 
      : (product.base_price ? String(product.base_price) : "");
    setFormOfferedPrice(pVal);
    setFormPrice(pVal);
    setFormQuantityNeeded(product.quantity_needed ? String(product.quantity_needed) : "");
    
    // Auto-open status if deadline is in future or today
    const isFutureDeadline = product.submission_deadline && product.submission_deadline >= todayStr;
    setFormStatus(isFutureDeadline ? "open" : (product.status || "open"));
    
    setFormQualityRequirements(product.quality_requirements || "");
    setFormSubmissionDeadline(product.submission_deadline || "");
    setFormPreferredPeriod(product.preferred_harvest_period || "");
    setFormDescription(product.description || "");
    setErrorMessage("");
  };

  const isFormDirty = useMemo(() => {
    if (!selectedProduct) return false;
    if (selectedProduct === 'new') {
      return !!formName.trim();
    }

    const norm = (v: any) => (v === null || v === undefined ? '' : String(v).trim());
    const todayStr = new Date().toISOString().slice(0, 10);
    const isFutureDeadline = selectedProduct.submission_deadline && selectedProduct.submission_deadline >= todayStr;
    const initialStatus = isFutureDeadline ? 'open' : norm(selectedProduct.status || 'open');

    const nameChanged = norm(formName) !== norm(selectedProduct.name);
    const catChanged = norm(formCategory) !== norm(selectedProduct.category || 'Vegetables');
    const unitChanged = norm(formUnit) !== norm(selectedProduct.unit || 'kg');
    const priceChanged = norm(formPrice) !== norm(selectedProduct.base_price);
    const qtyChanged = norm(formQuantityNeeded) !== norm(selectedProduct.quantity_needed);
    const statusChanged = norm(formStatus) !== initialStatus;
    const qualityChanged = norm(formQualityRequirements) !== norm(selectedProduct.quality_requirements);
    const deadlineChanged = norm(formSubmissionDeadline) !== norm(selectedProduct.submission_deadline);
    const periodChanged = norm(formPreferredPeriod) !== norm(selectedProduct.preferred_harvest_period);
    const descChanged = norm(formDescription) !== norm(selectedProduct.description);

    return (
      nameChanged ||
      catChanged ||
      unitChanged ||
      priceChanged ||
      qtyChanged ||
      statusChanged ||
      qualityChanged ||
      deadlineChanged ||
      periodChanged ||
      descChanged
    );
  }, [
    selectedProduct,
    formName,
    formCategory,
    formUnit,
    formPrice,
    formQuantityNeeded,
    formStatus,
    formQualityRequirements,
    formSubmissionDeadline,
    formPreferredPeriod,
    formDescription
  ]);

  const handleOpenHarvestModal = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setHarvestProduct(product);
    setHarvestQty(product.quantity_needed ? String(product.quantity_needed) : '');
    setHarvestPrice(product.base_price ? String(product.base_price) : '');
    setHarvestBulkMinQty('');
    setHarvestBulkPrice('');
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

      if (harvestBulkMinQty && harvestBulkPrice) {
        payload.bulk_min_qty = parseFloat(harvestBulkMinQty);
        payload.bulk_price = parseFloat(harvestBulkPrice);
      }

      if (harvestPhotos.length > 0) {
        payload.photo = harvestPhotos[0];
        payload.images = harvestPhotos;
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
    if (!formName || !formQuantityNeeded) {
      setErrorMessage("Requirement name and quantity needed are required.");
      return;
    }

    if (formPricingMode === 'harvest_hill_offers' && (!formOfferedPrice || parseFloat(formOfferedPrice) <= 0)) {
      setErrorMessage("Offered price must be greater than zero when Harvest Hill offers the price.");
      return;
    }

    const qtyVal = parseFloat(formQuantityNeeded);
    if (qtyVal <= 0) {
      setErrorMessage("Quantity needed must be greater than zero.");
      return;
    }

    const isDuplicate = products.some(p => 
      p.name.toLowerCase() === formName.toLowerCase() && 
      (!selectedProduct || p.id !== selectedProduct.id)
    );
    if (isDuplicate) {
      setErrorMessage("A requirement with this name already exists.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const todayStr = new Date().toISOString().slice(0, 10);
    let finalStatus = formStatus;
    if (formSubmissionDeadline && formSubmissionDeadline >= todayStr && formStatus === 'closed') {
      finalStatus = 'open';
    }

    const payload: any = {
      name: formName.trim(),
      category: formCategory,
      unit: formUnit,
      pricing_mode: formPricingMode,
      offered_price: formPricingMode === 'harvest_hill_offers' ? parseFloat(formOfferedPrice) : null,
      base_price: formPricingMode === 'harvest_hill_offers' ? parseFloat(formOfferedPrice) : 0,
      quantity_needed: qtyVal,
      status: finalStatus,
      quality_requirements: formQualityRequirements.trim(),
      submission_deadline: formSubmissionDeadline || null,
      preferred_harvest_period: formPreferredPeriod.trim(),
      description: formDescription.trim(),
    };

    try {
      if (selectedProduct === 'new') {
        await api.products.create(payload);
        toast(`Requirement for "${formName}" created successfully!`, "success");
      } else {
        await api.products.update(selectedProduct.id, payload);
        toast(`Requirement for "${formName}" updated successfully!`, "success");
      }
      setErrorMessage("");
      setSelectedProduct(null);
      loadProducts();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save requirement.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrArchiveProduct = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const submissionCount = product.submission_count || product.sourcing_history_count || 0;

    if (submissionCount > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Archive this requirement?',
        message: `Farmers have already submitted ${submissionCount} harvest offer(s) against "${product.name}". Archiving will remove it from active administration while preserving the requirement and submission history.`,
        confirmText: 'Archive requirement',
        confirmColor: 'bg-amber-700 hover:bg-amber-800',
        onConfirm: async () => {
          try {
            await api.products.update(product.id, { status: 'archived' });
            toast(`Requirement for "${product.name}" archived successfully.`, "success");
            setSelectedProduct(null);
            loadProducts();
          } catch (err: any) {
            toast(err.message || "Failed to archive requirement.", "error");
          }
        }
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: 'Delete this requirement?',
        message: `No farmer submissions are associated with "${product.name}". This action cannot be undone.`,
        confirmText: 'Delete requirement',
        confirmColor: 'bg-red-600 hover:bg-red-700',
        onConfirm: async () => {
          try {
            await api.products.delete(product.id);
            toast(`Requirement for "${product.name}" deleted permanently.`, "success");
            setSelectedProduct(null);
            loadProducts();
          } catch (err: any) {
            toast(err.message || "Failed to delete requirement.", "error");
          }
        }
      });
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
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
            <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">Harvest Hill Requirements</h2>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Manage crop requirement specs, target reference prices, and farmer harvest submission deadlines.</p>
          </div>
          <button 
            onClick={handleOpenAddProduct}
            className="flex items-center justify-center px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 transition-all cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create Requirement
          </button>
        </div>

        {/* Combined Filter Bar: Status Select + Category Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-center max-w-full overflow-x-auto scrollbar-none pb-1">
          <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-xl w-max border border-outline-variant/30">
            {/* Status Dropdown inside the category filter container */}
            <select
              value={activeStatusTab}
              onChange={(e) => setActiveStatusTab(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-white border border-outline-variant/60 text-primary uppercase tracking-wider outline-none cursor-pointer shadow-2xs hover:border-primary/50 transition-colors mr-1"
            >
              <option value="all">Status: All</option>
              <option value="open">Status: Open</option>
              <option value="draft">Status: Draft</option>
              <option value="closed">Status: Closed</option>
              <option value="archived">Status: Archived</option>
            </select>

            {/* Category Tabs */}
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
                            <Plus size={11} className="mr-1" /> Create Requirement
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
              <div className="p-8 text-center text-on-surface-variant font-medium animate-pulse">Loading requirements...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center text-on-surface-variant bg-white border border-[#E8E4DA] rounded-2xl max-w-lg mx-auto space-y-3">
                <AlertCircle className="w-10 h-10 opacity-40 text-primary" />
                <div className="space-y-1">
                  <p className="text-base font-extrabold text-[#1C2A1E]">No Product Requirements Found</p>
                  <p className="text-xs text-[#717971]">There are no requirements matching the selected status or category filters.</p>
                </div>
                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 bg-[#2D5A3D] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#1E3E2A] transition-all cursor-pointer"
                >
                  + Create First Requirement
                </button>
              </div>
            ) : (
              <>
                {/* Text-driven Product Requirement Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {currentProducts.map((product, i) => {
                    const st = (product.status || 'open').toLowerCase();
                    const isOpen = st === 'open';
                    const isDraft = st === 'draft';
                    const isClosed = st === 'closed';
                    const isArchived = st === 'archived';
                    const subCount = product.submission_count || product.sourcing_history_count || 0;

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        key={product.id}
                        onClick={() => handleOpenEditProduct(product)}
                        className="group bg-white rounded-2xl p-4 border border-[#E8E4DA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer relative hover:-translate-y-0.5"
                      >
                        <div>
                          {/* Card Top Pill Header */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="bg-[#FAF7F0] text-[#2D5A3D] text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-md border border-[#E8E4DA] uppercase tracking-wider">
                              {product.category || 'Vegetables'}
                            </span>

                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-2xs",
                              isOpen && "bg-emerald-100 text-emerald-900 border-emerald-300",
                              isDraft && "bg-amber-100 text-amber-900 border-amber-300",
                              isClosed && "bg-gray-100 text-gray-700 border-gray-300",
                              isArchived && "bg-purple-100 text-purple-900 border-purple-300"
                            )}>
                              {st}
                            </span>
                          </div>

                          {/* Requirement Title */}
                          <h3 className="font-extrabold text-base text-[#1C2A1E] group-hover:text-[#2D5A3D] transition-colors mb-2 leading-tight">
                            {product.name}
                          </h3>

                          {/* Requirement Spec Box */}
                          <div className="space-y-2 bg-[#FAF7F0]/80 p-3 rounded-xl border border-[#F0ECE1] my-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Quantity Needed:</span>
                              <span className="font-extrabold text-[#1C2A1E]">
                                {parseFloat(product.quantity_needed || 0).toLocaleString()} {product.unit || 'kg'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Pricing Mode:</span>
                              {product.pricing_mode === 'farmer_proposes' ? (
                                <span className="font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                                  Farmer Proposes
                                </span>
                              ) : (
                                <span className="font-extrabold text-[#2D5A3D]">
                                  Harvest Hill: RWF {parseFloat(product.offered_price || product.base_price || 0).toLocaleString()}/{product.unit || 'kg'}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Submit By:</span>
                              <span className="font-bold text-[#1C2A1E]">
                                {product.submission_deadline ? product.submission_deadline : 'No deadline'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-[#E8E4DA]">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Farmer Offers:</span>
                              <span className="font-extrabold text-[#2D5A3D] bg-[#2D5A3D]/10 px-2 py-0.5 rounded-full text-[10px]">
                                {subCount} {subCount === 1 ? 'submission' : 'submissions'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions Bar */}
                        <div className="flex items-center justify-between gap-1.5 pt-3 border-t border-[#F4F1E8] mt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHistoryProduct(product);
                            }}
                            className="py-1.5 px-2 bg-[#F5F3ED] hover:bg-[#EBE7DC] text-[#4A473D] border border-[#E3DFC2] rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer flex-1"
                            title="Requirement Audit & Submissions History"
                          >
                            <Handshake size={11} /> History
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenHarvestModal(product, e)}
                            className="py-1.5 px-2 bg-[#2D5A3D] hover:bg-[#1E3E2A] text-white rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer flex-1"
                            title="Record Admin Internal Harvest Batch"
                          >
                            <Sprout size={11} /> Harvest
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteOrArchiveProduct(product, e)}
                            className="py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                            title={subCount > 0 ? "Archive Requirement" : "Delete Requirement"}
                          >
                            <Trash2 size={11} />
                            {subCount > 0 ? 'Archive' : 'Delete'}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
    
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 px-6 py-4 bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant font-bold">
                      Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} requirements
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
        title={selectedProduct === 'new' ? "New Product Requirement" : "Edit Product Requirement"}
        subtitle="Specify crop demand specs, target reference price, and submission deadline for local farmers."
        footer={
          <div className="w-full space-y-3">
            {errorMessage && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <p className="text-xs text-red-700 font-semibold">{errorMessage}</p>
              </div>
            )}
            <div className="flex gap-3 w-full">
              <button 
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setErrorMessage("");
                }}
                disabled={isSaving}
                className="flex-1 px-5 py-3 border border-outline-variant/70 text-on-surface-variant rounded-xl font-bold hover:bg-surface-container-high transition-all cursor-pointer disabled:opacity-50 text-xs"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveProduct}
                disabled={isSaving || !isFormDirty || (formStatus === 'open' && !!formSubmissionDeadline && formSubmissionDeadline < new Date().toISOString().slice(0, 10))}
                title={formStatus === 'open' && !!formSubmissionDeadline && formSubmissionDeadline < new Date().toISOString().slice(0, 10) ? "Cannot activate requirement with an expired deadline" : undefined}
                className="flex-[2] px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-[#376847] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{selectedProduct === 'new' ? 'Create Requirement' : 'Update Requirement'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 font-sans">
          {/* Section 1: Basic Specifications Card */}
          <div className="p-4 bg-white rounded-2xl border border-outline-variant/40 space-y-4 shadow-2xs">
            <div className="flex items-center gap-1.5 pb-2 border-b border-outline-variant/20">
              <Tag size={13} className="text-primary" />
              <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
                1. Basic Specifications
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                Requirement Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. Roma Tomatoes, French Beans"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/60 text-sm font-semibold outline-none bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                  Category
                </label>
                <select 
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 text-xs font-semibold outline-none bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                >
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Herbs">Herbs</option>
                  <option value="Animal-Based">Animal-Based</option>
                  <option value="Grains">Grains</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                  Unit of Measurement
                </label>
                <select 
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 text-xs font-semibold outline-none bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                >
                  <option value="kg">kg</option>
                  <option value="litre">litre</option>
                  <option value="crate">crate</option>
                  <option value="bag">bag</option>
                  <option value="ton">ton</option>
                  <option value="piece">piece</option>
                  <option value="bundle">bundle</option>
                  <option value="box">box</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Volume & Target Pricing Card */}
          <div className="p-4 bg-white rounded-2xl border border-outline-variant/40 space-y-4 shadow-2xs">
            <div className="flex items-center gap-1.5 pb-2 border-b border-outline-variant/20">
              <Package size={13} className="text-primary" />
              <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
                2. Volume & Target Reference Price
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                  Quantity Needed <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="1"
                    placeholder="e.g. 1000"
                    value={formQuantityNeeded}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormQuantityNeeded(val);
                      if (val && parseFloat(val) <= 0) {
                        setErrorMessage("Quantity needed must be greater than zero.");
                      } else if (errorMessage === "Quantity needed must be greater than zero.") {
                        setErrorMessage("");
                      }
                    }}
                    className={cn(
                      "w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-sm font-extrabold outline-none bg-surface-container-lowest focus:ring-2 transition-all",
                      formQuantityNeeded !== "" && parseFloat(formQuantityNeeded) <= 0
                        ? "border-red-500 focus:ring-red-200"
                        : "border-outline-variant/60 focus:border-primary focus:ring-primary/10"
                    )}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold font-mono text-on-surface-variant/70 uppercase">
                    {formUnit}
                  </span>
                </div>
                {formQuantityNeeded !== "" && parseFloat(formQuantityNeeded) <= 0 && (
                  <p className="text-[10px] text-red-600 font-bold mt-1">
                    Quantity needed must be greater than 0.
                  </p>
                )}
              </div>

              {/* Pricing Mode Section */}
              <div className="space-y-3 p-3.5 bg-[#fcf9f2] rounded-xl border border-[#e5e2db]">
                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                  Pricing Mode <span className="text-red-500">*</span>
                </label>
                
                {(() => {
                  const subCount = selectedProduct && selectedProduct !== 'new' ? (selectedProduct.submission_count || selectedProduct.sourcing_history_count || 0) : 0;
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label 
                        onClick={() => {
                          if (subCount > 0) return;
                          setFormPricingMode('harvest_hill_offers');
                        }}
                        className={cn(
                          "p-3 rounded-xl border flex flex-col gap-1 transition-all",
                          subCount > 0 ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                          formPricingMode === 'harvest_hill_offers' 
                            ? "bg-primary/10 border-primary shadow-2xs" 
                            : "bg-white border-outline-variant/60 hover:bg-surface-container-low"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="pricing_mode" 
                            checked={formPricingMode === 'harvest_hill_offers'}
                            disabled={subCount > 0}
                            onChange={() => {}}
                            className="text-primary accent-primary cursor-pointer" 
                          />
                          <span className="font-extrabold text-xs text-on-surface">Harvest Hill offers price</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant leading-relaxed pl-5">
                          You set an explicit offered price visible to local farmers.
                        </span>
                      </label>

                      <label 
                        onClick={() => {
                          if (subCount > 0) return;
                          setFormPricingMode('farmer_proposes');
                          setFormOfferedPrice('');
                        }}
                        className={cn(
                          "p-3 rounded-xl border flex flex-col gap-1 transition-all",
                          subCount > 0 ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                          formPricingMode === 'farmer_proposes' 
                            ? "bg-primary/10 border-primary shadow-2xs" 
                            : "bg-white border-outline-variant/60 hover:bg-surface-container-low"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="pricing_mode" 
                            checked={formPricingMode === 'farmer_proposes'}
                            disabled={subCount > 0}
                            onChange={() => {}}
                            className="text-primary accent-primary cursor-pointer" 
                          />
                          <span className="font-extrabold text-xs text-on-surface">Farmer proposes price</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant leading-relaxed pl-5">
                          Farmers submit their asking price when posting harvest.
                        </span>
                      </label>
                    </div>
                  );
                })()}

                {formPricingMode === 'harvest_hill_offers' ? (
                  <div className="space-y-1.5 pt-2 border-t border-[#e5e2db]">
                    <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                      Offered Price (RWF) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                        RWF
                      </span>
                      <input 
                        type="number" 
                        placeholder="e.g. 800"
                        value={formOfferedPrice}
                        onChange={(e) => {
                          setFormOfferedPrice(e.target.value);
                          setFormPrice(e.target.value);
                        }}
                        className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-outline-variant/60 text-sm font-extrabold text-primary outline-none bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[10.5px] text-amber-950 font-medium flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-800 shrink-0" />
                    <span>The farmer will submit their asking price when submitting a harvest offer.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Status & Deadline Card */}
          <div className="p-4 bg-white rounded-2xl border border-outline-variant/40 space-y-4 shadow-2xs">
            <div className="flex items-center gap-1.5 pb-2 border-b border-outline-variant/20">
              <Clock size={13} className="text-primary" />
              <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
                3. Lifecycle & Timeline
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                  Status
                </label>
                <select 
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-outline-variant/60 text-[10.5px] font-bold outline-none bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer uppercase tracking-wider"
                >
                  <option value="open">OPEN (Active)</option>
                  <option value="draft">DRAFT (Private)</option>
                  <option value="closed">CLOSED (Ended)</option>
                  <option value="archived">ARCHIVED</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                  Submission Deadline
                </label>
                <input 
                  type="date" 
                  value={formSubmissionDeadline}
                  onChange={(e) => setFormSubmissionDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/60 text-xs font-semibold outline-none bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                />
              </div>
            </div>

            {formStatus === 'open' && formSubmissionDeadline && formSubmissionDeadline < new Date().toISOString().slice(0, 10) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-[11px] text-amber-950">Submission Deadline Expired</p>
                  <p className="text-[10px] text-amber-800 leading-relaxed mt-0.5">
                    The submission deadline ({formSubmissionDeadline}) has passed. Please update the deadline date to today or a future date to activate this requirement as OPEN.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                Preferred Harvest / Delivery Window
              </label>
              <input 
                type="text" 
                placeholder="e.g. Late August 2026 harvest cycle"
                value={formPreferredPeriod}
                onChange={(e) => setFormPreferredPeriod(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/60 text-xs font-medium outline-none bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* Section 4: Quality & Description Card */}
          <div className="p-4 bg-white rounded-2xl border border-outline-variant/40 space-y-4 shadow-2xs">
            <div className="flex items-center gap-1.5 pb-2 border-b border-outline-variant/20">
              <ShieldCheck size={13} className="text-primary" />
              <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
                4. Quality Standards & Details
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                Quality Requirements
              </label>
              <textarea 
                rows={3}
                placeholder="Describe specific quality standards, grading criteria, or packaging requirements for this crop..."
                value={formQualityRequirements}
                onChange={(e) => setFormQualityRequirements(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/60 text-xs font-medium outline-none bg-surface-container-lowest focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider block">
                Requirement Description
              </label>
              <textarea 
                rows={2}
                placeholder="Describe what Harvest Hill is looking for in this supply cycle..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/60 text-xs font-medium outline-none bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
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

              {/* Optional Bulk Deal Offer */}
              <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                    Optional Bulk Deal Offer
                  </span>
                  <span className="text-[9px] font-semibold text-emerald-700">Tiered Pricing</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-emerald-900 uppercase">Min Bulk Qty</label>
                    <input
                      type="number"
                      value={harvestBulkMinQty}
                      onChange={(e) => setHarvestBulkMinQty(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full px-3 py-2 rounded-lg border border-emerald-300 text-xs font-semibold bg-white outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-emerald-900 uppercase">Bulk Price / Unit (RWF)</label>
                    <input
                      type="number"
                      value={harvestBulkPrice}
                      onChange={(e) => setHarvestBulkPrice(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full px-3 py-2 rounded-lg border border-emerald-300 text-xs font-semibold bg-white outline-none focus:border-emerald-600"
                    />
                  </div>
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

      {/* Master Product Sourcing & Negotiation History Audit Drawer */}
      <DetailDrawer
        isOpen={!!historyProduct}
        onClose={() => setHistoryProduct(null)}
        title={historyProduct ? `Sourcing & Negotiation History: ${historyProduct.name}` : ''}
        subtitle="Harvest Hill Master Product Audit Trail"
        footer={
          <button
            onClick={() => setHistoryProduct(null)}
            className="w-full py-2.5 bg-surface-container-low border border-outline-variant/30 text-on-surface-variant rounded-xl font-bold hover:bg-surface-container-high transition-all cursor-pointer text-xs"
          >
            Close Sourcing Audit Log
          </button>
        }
      >
        {historyProduct && (
          <div className="space-y-5 font-sans text-xs">
            {/* Master Product Overview Box */}
            <div className="p-4 bg-emerald-50/90 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-emerald-950">{historyProduct.name}</h3>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">{historyProduct.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-800 font-extrabold block">Aggregated Live Stock</span>
                  <span className="text-base font-black text-emerald-700 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-sm inline-block mt-0.5">
                    {(historyProduct.total_available_quantity || 0).toLocaleString()} {historyProduct.unit}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60 text-emerald-900">
                <div>
                  <span className="text-[9px] uppercase font-bold text-emerald-800 block">Master Selling Price</span>
                  <span className="font-extrabold text-sm text-primary">{formatPrice(historyProduct.base_price)} / {historyProduct.unit}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-emerald-800 block">Contributing Farmers</span>
                  <span className="font-extrabold text-sm">{historyProduct.sourcing_history_count || 0} Farmer Batches</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-extrabold text-[#1c1c18] uppercase tracking-wider">
                  Farmer Negotiation & Batch Log
                </h4>
                <span className="text-[10px] font-bold text-[#717971]">
                  {(historyProduct.sourcing_supplies || []).length} Total Submissions
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Filter by farmer name..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#c1c9c0] text-xs font-semibold outline-none focus:border-[#144227]"
                />
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#c1c9c0] text-xs font-bold bg-white outline-none focus:border-[#144227] cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="accepted">Accepted</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Sourcing Supply List */}
            {(() => {
              const items = (historyProduct.sourcing_supplies || []).filter((s: any) => {
                const matchesName = !historySearchTerm || (s.farmer_name || '').toLowerCase().includes(historySearchTerm.toLowerCase()) || (s.farmer_email || '').toLowerCase().includes(historySearchTerm.toLowerCase());
                const matchesStatus = historyStatusFilter === 'All' || s.status === historyStatusFilter;
                return matchesName && matchesStatus;
              });

              if (items.length === 0) {
                return (
                  <div className="p-8 text-center bg-[#f6f3ec]/50 rounded-2xl border border-[#e5e2db] text-[#717971]">
                    <p className="font-bold text-xs">No farmer negotiation logs found for this filter.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                  {items.map((supply: any, idx: number) => (
                    <div
                      key={supply.id || idx}
                      className="p-4 bg-white border border-[#e5e2db] rounded-2xl shadow-sm space-y-3 hover:border-[#144227]/40 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-xs text-[#1c1c18] block">{supply.farmer_name}</span>
                          <span className="text-[10px] text-[#717971] font-mono">{supply.farmer_email} • {supply.farmer_phone || 'No phone'}</span>
                        </div>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                          supply.status === 'accepted' && "bg-[#bceec8] text-[#00210f] border-[#bceec8]",
                          supply.status === 'pending' && "bg-amber-100 text-amber-900 border-amber-200",
                          supply.status === 'rejected' && "bg-red-100 text-red-900 border-red-200"
                        )}>
                          {supply.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-[#fcf9f2] p-2.5 rounded-xl border border-[#e5e2db] text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-[#717971] block">Quantity</span>
                          <span className="font-extrabold text-[#1c1c18]">
                            {supply.accepted_quantity ? `${supply.accepted_quantity} ${supply.unit} agreed` : `${supply.submitted_quantity} ${supply.unit} submitted`}
                          </span>
                          {supply.accepted_quantity && supply.accepted_quantity !== supply.submitted_quantity && (
                            <span className="text-[9px] text-[#717971] block font-mono">({supply.submitted_quantity} {supply.unit} proposed)</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-[#717971] block">Agreed Price</span>
                          <span className="font-extrabold text-[#144227]">
                            {formatPrice(supply.agreed_price || supply.proposed_price)} / {supply.unit}
                          </span>
                          {supply.agreed_price && supply.agreed_price !== supply.proposed_price && (
                            <span className="text-[9px] text-[#717971] block font-mono">({formatPrice(supply.proposed_price)} proposed)</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#717971] pt-1 border-t border-[#f0eee7]">
                        <span>Submitted: {supply.created_at ? new Date(supply.created_at).toLocaleDateString() : 'N/A'}</span>
                        <span className="font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Scope: {supply.visibility_scope?.replace('_', ' ') || 'Private Admin'}
                        </span>
                      </div>

                      {/* Proof Photo Thumbnail (Admin Private Audit) */}
                      {supply.photo_url && (
                        <div className="pt-1 flex items-center gap-2">
                          <img
                            src={supply.photo_url}
                            alt="Proof of harvest"
                            className="w-12 h-12 rounded-lg object-cover border border-[#e5e2db]"
                          />
                          <div className="text-[9px] text-[#717971]">
                            <span className="font-bold text-[#1c1c18] block">Proof of Real Harvest Photo</span>
                            <span>Private to Harvest Hill for negotiation audit</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </DetailDrawer>

      {/* Delegate Fresh Discount Modal */}
      {discountProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/30 relative space-y-5"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-sm">
                  <Tag size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-on-surface">Delegate Fresh Discount</h3>
                  <p className="text-xs text-on-surface-variant font-medium">{discountProduct.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setDiscountProduct(null)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between border border-outline-variant/40">
                <div>
                  <p className="text-xs font-bold text-on-surface">Standard Base Price</p>
                  <p className="text-xs text-on-surface-variant font-mono font-semibold">
                    RWF {parseFloat(discountProduct.base_price || 0).toLocaleString()} per {discountProduct.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Available Live Stock</p>
                  <p className="text-xs font-black text-emerald-700">{discountProduct.total_available_quantity || 0} {discountProduct.unit}</p>
                </div>
              </div>

              <div className="p-4 bg-orange-50/80 border border-orange-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-orange-950">Enable Fresh Deals Discount</p>
                    <p className="text-[10px] text-orange-800">Features product under Seasonal Discounts on client landing page</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={discountIsActive}
                    onChange={(e) => setDiscountIsActive(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded cursor-pointer accent-orange-600"
                  />
                </div>

                {discountIsActive && (
                  <div className="space-y-3 pt-2 border-t border-orange-200">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-orange-950 uppercase tracking-wider block">
                        Discounted Offer Price (RWF per {discountProduct.unit})
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 750"
                        value={discountPriceInput}
                        onChange={(e) => setDiscountPriceInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-orange-300 text-sm font-bold bg-white text-on-surface outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {discountPriceInput && parseFloat(discountPriceInput) > 0 && (
                      (() => {
                        const stdPrice = parseFloat(discountProduct.base_price || discountProduct.offered_price || 0);
                        const discPrice = parseFloat(discountPriceInput);
                        if (stdPrice > 0 && discPrice > 0 && discPrice < stdPrice) {
                          const savedRwf = stdPrice - discPrice;
                          const savedPercent = Math.round((savedRwf / stdPrice) * 100);
                          return (
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs animate-in fade-in duration-200 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                                  %
                                </div>
                                <div>
                                  <p className="font-extrabold text-emerald-950">Real-Time Savings</p>
                                  <p className="text-[10.5px] text-emerald-800 font-medium">
                                    Save <span className="font-extrabold font-mono text-emerald-900">RWF {savedRwf.toLocaleString()}</span> per {discountProduct.unit || 'kg'}
                                  </p>
                                </div>
                              </div>
                              <div className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg font-black text-xs font-mono shadow-2xs">
                                {savedPercent}% OFF
                              </div>
                            </div>
                          );
                        } else if (discPrice >= stdPrice && stdPrice > 0) {
                          return (
                            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                              <span>Discount price should be lower than standard base price (RWF {stdPrice.toLocaleString()}) to show savings.</span>
                            </div>
                          );
                        }
                        return null;
                      })()
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDiscountProduct(null)}
                className="flex-1 py-2.5 bg-surface-container-high hover:bg-surface-container text-on-surface-variant rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDiscount}
                disabled={isSavingDiscount}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isSavingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Discount Offer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
