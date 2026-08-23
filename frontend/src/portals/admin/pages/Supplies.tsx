import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Handshake, CheckCircle2, Archive, Check, X, RefreshCw, AlertCircle, AlertTriangle, Trash2, Send, Sparkles, MessageSquare, Edit3, Save, Eye, Lock, ShieldCheck, Globe, Users, UserCheck, Tag, Package, FileText, Plus } from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { api, apiRequest } from '../lib/api';
import { useAlert } from '../../../context/AlertContext';
import { ContextualNegotiationPane } from '../../common/components/ContextualNegotiationPane';

interface SuppliesProps {
  searchTerm?: string;
}

export function Supplies({ searchTerm: propSearchTerm = '' }: SuppliesProps) {
  const { toast, showConfirm } = useAlert();
  const [supplies, setSupplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupply, setSelectedSupply] = useState<any | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [activeStatusTab, setActiveStatusTab] = useState('All');
  const [showFarmerNames, setShowFarmerNames] = useState(false);

  // Search state
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchTerm = propSearchTerm || internalSearchTerm;
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadSupplies = React.useCallback(() => {
    setIsLoading(true);
    const query = debouncedSearchTerm.trim() ? `?search=${encodeURIComponent(debouncedSearchTerm.trim())}` : '';
    apiRequest(`/api/supplies/${query}`)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.results || []);
        setSupplies(list);
      })
      .catch(err => {
        console.error("Failed to load supplies:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadSupplies();
  }, [loadSupplies]);

  useEffect(() => {
    api.systemSettings.get().then((res: any) => {
      if (res && res.show_farmer_names_to_clients !== undefined) {
        setShowFarmerNames(!!res.show_farmer_names_to_clients);
      }
    }).catch(() => {});
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);



  // Success acceptance modal state
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    productName: string;
  }>({
    isOpen: false,
    productName: '',
  });

  // Negotiation Agreement Form State
  const [agreedQtyInput, setAgreedQtyInput] = useState('');
  const [agreedPriceInput, setAgreedPriceInput] = useState('');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [targetProductId, setTargetProductId] = useState('');
  const [masterProducts, setMasterProducts] = useState<any[]>([]);
  const [isSubmittingAgreement, setIsSubmittingAgreement] = useState(false);

  // Admin Direct Edit Supply State
  const [editSupply, setEditSupply] = useState<any | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editUnit, setEditUnit] = useState('kg');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Contextual Negotiation Pane State
  const [activeNegotiationSupply, setActiveNegotiationSupply] = useState<any | null>(null);

  // Fresh Deals Discount Modal State
  const [discountSupply, setDiscountSupply] = useState<any | null>(null);
  const [discountIsActive, setDiscountIsActive] = useState(false);
  const [discountPriceInput, setDiscountPriceInput] = useState('');
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);

  // Permanent Delete High-Stakes Warning Modal State
  const [deleteWarningSupply, setDeleteWarningSupply] = useState<any | null>(null);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);
  const [isArchivingInstead, setIsArchivingInstead] = useState(false);

  // Supplier Notes Modal State
  const [showAdminNotesModal, setShowAdminNotesModal] = useState(false);

  // Visibility & Access Controls Modal State
  const [visibilitySupply, setVisibilitySupply] = useState<any | null>(null);
  const [visibilityScopeInput, setVisibilityScopeInput] = useState('HARVEST_HILL_ONLY');
  const [discloseFarmerNameInput, setDiscloseFarmerNameInput] = useState(false);

  // Custom Farmer Supply Approval & Master Product Creation Flow State
  const [approveChoiceSupply, setApproveChoiceSupply] = useState<any | null>(null);
  const [approvalMode, setApprovalMode] = useState<'choice' | 'direct' | 'requirement' | null>(null);

  // Direct Harvest Form State
  const [directName, setDirectName] = useState('');
  const [directCategory, setDirectCategory] = useState('Vegetables');
  const [directUnit, setDirectUnit] = useState('kg');
  const [directPrice, setDirectPrice] = useState('');
  const [directQuantity, setDirectQuantity] = useState('');
  const [directNotes, setDirectNotes] = useState('');
  const [directImages, setDirectImages] = useState<Array<{ id: string; url: string; isFarmer?: boolean; file?: File }>>([]);

  // Requirement Template Form State
  const [reqName, setReqName] = useState('');
  const [reqCategory, setReqCategory] = useState('Vegetables');
  const [reqUnit, setReqUnit] = useState('kg');
  const [reqOfferedPrice, setReqOfferedPrice] = useState('');
  const [reqQuantityNeeded, setReqQuantityNeeded] = useState('');
  const [reqDeadline, setReqDeadline] = useState('');
  const [reqHarvestPeriod, setReqHarvestPeriod] = useState('Late Season');
  const [reqQualityRequirements, setReqQualityRequirements] = useState('');

  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);
  const [selectedClients, setSelectedClients] = useState<any[]>([]);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  const fetchAvailableClients = async () => {
    try {
      setIsLoadingClients(true);
      const res = await apiRequest('/api/accounts/users/?role=client');
      const list = Array.isArray(res) ? res : (res?.results || []);
      setAvailableClients(list);
    } catch {
      setAvailableClients([]);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const isSupplyUnreadAction = (sup: any) => {
    if (!sup || sup.status === 'accepted' || sup.status === 'rejected') return false;
    const latest = sup.latest_offer;
    if (!latest) return false;
    const isFarmerSender = latest.sender_role === 'farmer' || latest.sender === 'farmer';
    return isFarmerSender && (latest.offer_status === 'PENDING' || !latest.is_read);
  };

  const getCleanFarmerNotes = (sup: any) => {
    if (!sup || !sup.notes) return '';
    let text = String(sup.notes).trim();
    if (text.toLowerCase().includes('admin terms') || text.toLowerCase().includes('may you lower') || text.startsWith('[Admin Terms]')) {
      return '';
    }
    return text;
  };

  const hasUnreadNegotiationAction = (group: any) => {
    if (!group || !group.supplies) return false;
    return group.supplies.some((s: any) => isSupplyUnreadAction(s));
  };

  const handleOpenVisibilityModal = (supply: any) => {
    setVisibilitySupply(supply);
    const scope = supply.visibility_scope || 'HARVEST_HILL_ONLY';
    setVisibilityScopeInput(scope);
    setDiscloseFarmerNameInput(!!supply.disclose_farmer_name);
    
    // Load existing target clients if any
    const existingTargets = supply.target_clients_detail || supply.target_clients || [];
    setSelectedClients(existingTargets);
    setClientSearchQuery('');
    fetchAvailableClients();
  };

  const handleSaveDiscountOffer = async () => {
    if (!discountSupply) return;
    try {
      setIsSavingDiscount(true);
      const parsedDiscountPrice = discountPriceInput ? parseFloat(discountPriceInput) : null;
      await api.supplies.update(discountSupply.id, {
        is_discounted: discountIsActive,
        discount_price: discountIsActive ? parsedDiscountPrice : null,
      });

      toast(`Fresh deal discount settings saved!`, "success");
      setDiscountSupply(null);
      loadSupplies();
    } catch (err: any) {
      toast(err.message || "Failed to save discount settings.", "error");
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const handleAbortDiscount = async (supply: any) => {
    try {
      await api.supplies.update(supply.id, {
        is_discounted: false,
        discount_price: null,
      });
      const stdPrice = supply.agreed_price || supply.price;
      toast(`Fresh deal aborted. Price reverted to standard (${formatCurrency(stdPrice)}).`, "success");
      setSelectedSupply(null);
      loadSupplies();
    } catch (err: any) {
      toast(err.message || "Failed to abort fresh deal.", "error");
    }
  };

  const handleSaveVisibilityControls = async () => {
    if (!visibilitySupply) return;

    if ((visibilityScopeInput === 'SPECIFIC_CLIENTS' || visibilityScopeInput === 'specific_clients') && selectedClients.length === 0) {
      toast("Select at least one client for this visibility option.", "warning");
      return;
    }

    try {
      setIsSavingVisibility(true);
      const clientIds = selectedClients.map(c => c.id || c.user_id || c.pk);
      await api.supplies.update(visibilitySupply.id, {
        visibility_scope: visibilityScopeInput,
        disclose_farmer_name: discloseFarmerNameInput,
        target_clients: clientIds,
      });

      toast(`Visibility settings saved!`, "success");
      setVisibilitySupply(null);
      loadSupplies();
    } catch (err: any) {
      toast(err.message || "Failed to save visibility settings.", "error");
    } finally {
      setIsSavingVisibility(false);
    }
  };

  const customSupplies = React.useMemo(() => {
    return supplies.filter((s: any) => 
      !s.product || 
      s.product === null || 
      s.is_suggested_product || 
      !!s.custom_product_name || 
      !!s.suggested_product_name ||
      !!s.client_request ||
      !!s.product_request ||
      (s.product_detail && (s.product_detail.is_suggested_product || s.product_detail.isCustom || s.product_detail.isRequest))
    );
  }, [supplies]);

  const filteredCustomSupplies = React.useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return customSupplies;
    const q = searchTerm.trim().toLowerCase();
    return customSupplies.filter((sup: any) => {
      const name = (sup.custom_product_name || sup.suggested_product_name || sup.product_detail?.name || '').toLowerCase();
      const cat = (sup.custom_category || sup.product_detail?.category || '').toLowerCase();
      const farmer = (sup.farmer_name || sup.farmer?.farm_name || '').toLowerCase();
      return name.includes(q) || cat.includes(q) || farmer.includes(q);
    });
  }, [customSupplies, searchTerm]);

  const pendingCustomCount = React.useMemo(() => {
    return customSupplies.filter((s: any) => s.status === 'pending' || !s.status).length;
  }, [customSupplies]);

  const handleOpenApproveChoiceModal = (supply: any) => {
    setApproveChoiceSupply(supply);
    setupDirectHarvestForm(supply);
  };

  const handleRejectCustomSubmission = async (supply: any) => {
    if (!supply) return;
    if (!window.confirm(`Are you sure you want to reject the custom submission for "${supply.custom_product_name || supply.suggested_product_name || 'Crop Harvest'}"?`)) {
      return;
    }
    try {
      await api.supplies.update(supply.id, { status: 'rejected' });
      toast("Custom crop submission rejected.", "info");
      setSelectedSupply(null);
      loadSupplies();
    } catch (err: any) {
      console.error("Failed to reject submission:", err);
      toast(err.message || "Failed to reject custom submission.", "error");
    }
  };

  const setupDirectHarvestForm = (supply: any) => {
    const name = (supply.custom_product_name || supply.suggested_product_name || supply.product_detail?.name || 'Custom Harvest').trim();
    setDirectName(name);
    setDirectCategory(supply.custom_category || supply.product_detail?.category || 'Vegetables');
    setDirectUnit(supply.custom_unit || supply.unit || 'kg');

    let priceVal = Number(supply.agreed_price || supply.price || supply.proposed_price || 0);
    if (priceVal > 0 && priceVal < 100) {
      priceVal = Math.round(priceVal * 1473.97);
    }
    setDirectPrice(priceVal ? String(priceVal) : '');
    setDirectQuantity(String(supply.accepted_quantity || supply.quantity || ''));
    setDirectNotes(supply.notes || '');

    const imgs: Array<{ id: string; url: string; isFarmer?: boolean; file?: File }> = [];
    const mainPhoto = supply.photo || supply.photo_url;
    if (mainPhoto) {
      imgs.push({ id: 'photo-main', url: mainPhoto, isFarmer: true });
    }
    if (Array.isArray(supply.images)) {
      supply.images.forEach((imgObj: any, idx: number) => {
        const u = typeof imgObj === 'string' ? imgObj : (imgObj.image_url || imgObj.image);
        if (u && !imgs.some(existing => existing.url === u)) {
          imgs.push({ id: `photo-farmer-${idx}`, url: u, isFarmer: true });
        }
      });
    }
    setDirectImages(imgs);
    setApprovalMode('direct');
  };

  const setupRequirementForm = (supply: any) => {
    const name = (supply.custom_product_name || supply.suggested_product_name || supply.product_detail?.name || 'Custom Harvest').trim();
    setReqName(name);
    setReqCategory(supply.custom_category || supply.product_detail?.category || 'Vegetables');
    setReqUnit(supply.custom_unit || supply.unit || 'kg');

    let priceVal = Number(supply.agreed_price || supply.price || supply.proposed_price || 0);
    if (priceVal > 0 && priceVal < 100) {
      priceVal = Math.round(priceVal * 1473.97);
    }
    setReqOfferedPrice(priceVal ? String(priceVal) : '');
    setReqQuantityNeeded(String(supply.accepted_quantity || supply.quantity || ''));

    const defaultDeadline = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    setReqDeadline(defaultDeadline);
    setReqHarvestPeriod('Late Season');
    setReqQualityRequirements(supply.notes || 'Grade A inspection specs, cold storage handling.');
    setApprovalMode('requirement');
  };

  const handleAddDirectImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newImgs = Array.from(files).map((file, idx) => ({
      id: `img-new-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      isFarmer: false,
      file,
    }));
    setDirectImages(prev => [...prev, ...newImgs]);
  };

  const handleRemoveDirectImage = (idToRemove: string) => {
    setDirectImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  const handleSaveDirectHarvest = async () => {
    if (!approveChoiceSupply) return;
    const priceNum = parseFloat(directPrice);
    const qtyNum = parseFloat(directQuantity);

    if (!directName.trim()) {
      toast("Crop / Product name is required.", "warning");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      toast("Please enter a valid price per unit.", "warning");
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast("Please enter a valid available quantity.", "warning");
      return;
    }

    try {
      setIsSubmittingApproval(true);

      const mainImg = directImages.find(img => img.url)?.url || null;

      const productPayload: Record<string, any> = {
        name: directName.trim(),
        category: directCategory,
        unit: directUnit,
        pricing_mode: 'harvest_hill_offers',
        offered_price: priceNum,
        base_price: priceNum,
        quantity_needed: qtyNum,
        status: 'open',
        notes: directNotes,
      };

      if (mainImg) {
        productPayload.image_url = mainImg;
      }

      const newProduct = await api.products.create(productPayload);
      const newProdId = newProduct.id || newProduct.pk;

      await api.supplies.update(approveChoiceSupply.id, {
        product: newProdId,
        status: 'accepted',
        agreed_price: priceNum,
        accepted_quantity: qtyNum,
      });

      toast(`Master Product "${directName}" created directly & harvest supply approved!`, "success");
      setApproveChoiceSupply(null);
      setApprovalMode(null);
      loadSupplies();
    } catch (err: any) {
      console.error("Failed to create master product directly:", err);
      toast(err.message || "Failed to publish Master Product.", "error");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleSaveRequirementTemplate = async () => {
    if (!approveChoiceSupply) return;
    const priceNum = parseFloat(reqOfferedPrice);
    const qtyNum = parseFloat(reqQuantityNeeded);

    if (!reqName.trim()) {
      toast("Product requirement name is required.", "warning");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      toast("Please enter a valid offered price.", "warning");
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast("Please enter a valid quantity needed.", "warning");
      return;
    }

    try {
      setIsSubmittingApproval(true);

      const productPayload: Record<string, any> = {
        name: reqName.trim(),
        category: reqCategory,
        unit: reqUnit,
        pricing_mode: 'harvest_hill_offers',
        offered_price: priceNum,
 base_price: priceNum,
        quantity_needed: qtyNum,
        status: 'open',
        submission_deadline: reqDeadline || null,
        preferred_harvest_period: reqHarvestPeriod,
        quality_requirements: reqQualityRequirements,
      };

      if (approveChoiceSupply.photo) {
        productPayload.image_url = approveChoiceSupply.photo;
      }

      const newProduct = await api.products.create(productPayload);
      const newProdId = newProduct.id || newProduct.pk;

      await api.supplies.update(approveChoiceSupply.id, {
        product: newProdId,
        status: 'accepted',
        agreed_price: priceNum,
        accepted_quantity: qtyNum,
      });

      toast(`Product Requirement template "${reqName}" created & harvest supply approved!`, "success");
      setApproveChoiceSupply(null);
      setApprovalMode(null);
      loadSupplies();
    } catch (err: any) {
      console.error("Failed to create product requirement template:", err);
      toast(err.message || "Failed to create requirement template.", "error");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleOpenEditModal = (supply: any) => {
    setEditSupply(supply);
    setEditQty(String(supply.quantity || ''));
    setEditPrice(String(supply.price || supply.proposed_price || ''));
    setEditUnit(supply.unit || 'kg');
    setEditNotes(supply.notes || '');
  };

  const handleSaveAdminEdit = async () => {
    if (!editSupply) return;
    const parsedQty = parseFloat(editQty);
    const parsedPrice = parseFloat(editPrice);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast("Please enter a valid quantity greater than zero.", "warning");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast("Please enter a valid price per unit greater than zero.", "warning");
      return;
    }

    try {
      setIsSavingEdit(true);
      await apiRequest(`/api/supplies/${editSupply.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          quantity: parsedQty,
          price: parsedPrice,
          unit: editUnit,
          notes: editNotes.trim()
        })
      });

      toast("Supply details updated successfully!", "success");
      setEditSupply(null);
      setSelectedSupply(null);
      loadSupplies();
    } catch (err: any) {
      toast(err.message || "Failed to update supply.", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [adminThread, setAdminThread] = useState<any>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  const loadAdminThread = async (supplyId: number | string) => {
    if (!supplyId) return;
    try {
      setIsLoadingThread(true);
      const res = await apiRequest(`/api/negotiations/threads/?supply_id=${supplyId}`);
      let currentThread: any = null;
      if (Array.isArray(res)) {
        currentThread = res.find((t: any) => String(t.supply) === String(supplyId) || String(t.supply_detail?.id) === String(supplyId)) || null;
      } else if (res?.results) {
        currentThread = res.results.find((t: any) => String(t.supply) === String(supplyId) || String(t.supply_detail?.id) === String(supplyId)) || null;
      }
      setAdminThread(currentThread || null);

      if (currentThread && Array.isArray(currentThread.offers) && currentThread.offers.length > 0) {
        const latestOffer = currentThread.offers[currentThread.offers.length - 1];
        if (latestOffer) {
          if (latestOffer.price !== undefined && latestOffer.price !== null) {
            setAgreedPriceInput(String(latestOffer.price));
          }
          if (latestOffer.quantity !== undefined && latestOffer.quantity !== null) {
            setAgreedQtyInput(String(latestOffer.quantity));
          }
        }
      }
    } catch {
      setAdminThread(null);
    } finally {
      setIsLoadingThread(false);
    }
  };

  const handleDeleteOfferTerm = async (offerId: number) => {
    if (!adminThread || !selectedSupply) return;
    const confirmed = await showConfirm("Delete Negotiation Term", "Are you sure you want to delete this negotiation term?", { isDanger: true });
    if (!confirmed) return;
    try {
      await api.negotiations.deleteOffer(adminThread.id, offerId);
      toast("Negotiation term removed.", "success");
      loadAdminThread(selectedSupply.id);
    } catch (err: any) {
      toast(err.message || "Failed to delete term.", "error");
    }
  };

  useEffect(() => {
    if (selectedSupply?.id) {
      setAgreedQtyInput(selectedSupply.accepted_quantity ? String(selectedSupply.accepted_quantity) : String(selectedSupply.quantity || ''));
      setAgreedPriceInput(selectedSupply.agreed_price ? String(selectedSupply.agreed_price) : String(selectedSupply.price || ''));
      setTargetProductId(selectedSupply.product ? String(selectedSupply.product) : '');
      setAdminNotesInput('');
      loadAdminThread(selectedSupply.id);
    } else {
      setAdminThread(null);
    }
  }, [selectedSupply?.id]);

  useEffect(() => {
    api.products.list().then(res => setMasterProducts(res || [])).catch(() => {});
  }, []);

  const handleCounterSupply = async () => {
    if (!selectedSupply) return;
    const parsedQty = parseFloat(agreedQtyInput || '0');
    const parsedPrice = parseFloat(agreedPriceInput || '0');

    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast("Accepted quantity must be greater than zero.", "warning");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast("Agreed farmer price must be greater than zero.", "warning");
      return;
    }

    try {
      setIsSubmittingAgreement(true);
      const payload: any = {
        accepted_quantity: parsedQty,
        agreed_price: parsedPrice,
        admin_notes: adminNotesInput.trim(),
      };
      if (targetProductId) {
        payload.product_id = targetProductId;
      }

      await api.supplies.counterSupply(selectedSupply.id, payload);
      toast(`Counter-proposal (${parsedQty} ${selectedSupply.unit} @ RWF ${parsedPrice}) sent to farmer! Live notification dispatched.`, "success");
      setAdminNotesInput('');
      loadAdminThread(selectedSupply.id);
      loadSupplies();
    } catch (err: any) {
      toast(err.message || "Failed to send counter-proposal.", "error");
    } finally {
      setIsSubmittingAgreement(false);
    }
  };

  const handleAgreeSupply = async () => {
    if (!selectedSupply) return;
    const parsedQty = parseFloat(agreedQtyInput || '0');
    const parsedPrice = parseFloat(agreedPriceInput || '0');

    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast("Accepted quantity must be greater than zero.", "warning");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast("Agreed farmer price must be greater than zero.", "warning");
      return;
    }

    const prodName = selectedSupply.product_detail?.name || selectedSupply.suggested_product_name || selectedSupply.custom_product_name || 'Harvest Batch';
    const confirmed = await showConfirm(
      "Finalize B2B Agreement & Aggregate Stock",
      `Are you sure you want to accept ${parsedQty} ${selectedSupply.unit} of "${prodName}" @ ${formatCurrency(parsedPrice)}/${selectedSupply.unit} into master stock? This will finalize terms and issue notifications.`
    );
    if (!confirmed) return;

    try {
      setIsSubmittingAgreement(true);
      const payload: any = {
        accepted_quantity: parsedQty,
        agreed_price: parsedPrice,
        admin_notes: adminNotesInput.trim(),
        approve_suggested: true
      };
      if (targetProductId) {
        payload.product_id = targetProductId;
      }

      await api.supplies.agreeSupply(selectedSupply.id, payload);
      toast("Negotiated terms agreed & supply accepted into master stock!", "success");
      setSuccessModal({
        isOpen: true,
        productName: prodName,
      });
      setSelectedSupply(null);
      loadSupplies();
    } catch (err: any) {
      toast(err.message || "Failed to agree terms.", "error");
    } finally {
      setIsSubmittingAgreement(false);
    }
  };

  const safeParseFloat = (val: any): number => {
    if (val === null || val === undefined) return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (val: any) => {
    if (val === null || val === undefined || val === '') return 'RWF 0';
    let num = safeParseFloat(val);
    if (num > 0 && num < 100) {
      num = Math.round(num * 1473.97);
    }
    return `RWF ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const statusMap: Record<string, string> = {
    'Pending': 'pending',
    'Accepted': 'accepted',
    'Rejected': 'rejected',
  };



  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeStatusTab, searchTerm]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedSupply]);

  const handleUpdateStatus = async (supplyId: number | string, newStatus: string) => {
    try {
      await api.supplies.update(supplyId, { status: newStatus });
      const supplyObj = supplies.find(s => s.id === supplyId);
      setSelectedSupply(null);
      loadSupplies();
      if (newStatus === 'accepted') {
        setSuccessModal({
          isOpen: true,
          productName: supplyObj?.product_detail?.name || 'Supply',
        });
      }
    } catch (err: any) {
      toast(err.message || "Failed to update supply status.", "error");
    }
  };

  const handleArchiveSupply = async (supplyId: number | string) => {
    try {
      await api.supplies.update(supplyId, { is_archived: true });
      setSelectedSupply(null);
      loadSupplies();
    } catch (err: any) {
      toast(err.message || "Failed to archive supply.", "error");
    }
  };

  const handleBulkArchive = async () => {
    try {
      await Promise.all(selectedIds.map(id => api.supplies.update(id, { is_archived: true })));
      setSelectedIds([]);
      loadSupplies();
    } catch (err: any) {
      console.error("Bulk archive failed:", err);
      toast("Failed to archive some items.", "error");
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm(
      "Bulk Delete Supplies",
      `Are you sure you want to permanently delete the ${selectedIds.length} selected supplies?`
    );
    if (!confirmed) return;
    try {
      await Promise.all(selectedIds.map(id => api.supplies.delete(id)));
      setSelectedIds([]);
      loadSupplies();
    } catch (err: any) {
      console.error("Bulk delete failed:", err);
      toast("Failed to delete some items.", "error");
    }
  };

  // Group supplies into Master Product entities (1 row per Master Product)
  const masterProductGroups = React.useMemo(() => {
    const map = new Map<string, {
      id: string;
      productId: string | number | null;
      displayId?: string;
      name: string;
      category: string;
      unit: string;
      totalAvailableStock: number;
      batchCount: number;
      supplierCount: number;
      masterSellingPrice: number;
      isDiscounted: boolean;
      discountPrice: number | null;
      effectivePrice: number;
      status: string;
      supplies: any[];
      primarySupply: any;
      isArchived: boolean;
    }>();

    for (const sup of supplies) {
      const isCustomSupply = 
        !sup.product || 
        sup.product === null || 
        sup.is_suggested_product || 
        !!sup.custom_product_name || 
        !!sup.suggested_product_name ||
        !!sup.client_request ||
        !!sup.product_request ||
        (sup.product_detail && (sup.product_detail.is_suggested_product || sup.product_detail.isCustom || sup.product_detail.isRequest));

      if (isCustomSupply) {
        continue;
      }

      const prodName = (sup.product_detail?.name || 'Produce').trim();
      const prodId = sup.product || sup.product_detail?.id || prodName.toLowerCase();
      const displayId = sup.product_detail?.displayId || sup.product_detail?.display_id || sup.displayId || sup.display_id || '';
      const key = String(prodId);

      const isAccepted = sup.status === 'accepted';
      const qty = isAccepted ? Number(sup.accepted_quantity ?? sup.quantity ?? 0) : 0;
      
      const masterPrice = Number(sup.product_detail?.price || sup.product_detail?.base_price || sup.product_detail?.offered_price || sup.agreed_price || sup.price || 0);
      const isDisc = !!(sup.product_detail?.is_discounted || sup.is_discounted);
      const discPrice = (sup.product_detail?.discount_price || sup.discount_price) ? Number(sup.product_detail?.discount_price || sup.discount_price) : null;
      const effPrice = isDisc && discPrice ? discPrice : masterPrice;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          productId: sup.product || null,
          displayId: displayId,
          name: prodName,
          category: (sup.product_detail?.category || sup.custom_category || 'Vegetables').toUpperCase(),
          unit: sup.unit || sup.product_detail?.unit || 'kg',
          totalAvailableStock: qty,
          batchCount: 1,
          supplierCount: 1,
          masterSellingPrice: masterPrice,
          isDiscounted: isDisc,
          discountPrice: discPrice,
          effectivePrice: effPrice,
          status: isAccepted ? 'accepted' : sup.status,
          supplies: [sup],
          primarySupply: sup,
          isArchived: !!sup.is_archived,
        });
      } else {
        const group = map.get(key)!;
        if (!group.displayId && displayId) {
          group.displayId = displayId;
        }
        group.supplies.push(sup);
        group.batchCount += 1;
        if (isAccepted) {
          group.totalAvailableStock += qty;
          group.status = 'accepted';
        }
        if (sup.is_archived) {
          group.isArchived = true;
        }
        const distinctFarmers = new Set(group.supplies.map(s => s.farmer_name || s.farmer?.farm_name || 'Partner Farm'));
        group.supplierCount = distinctFarmers.size;
      }
    }

    const allGroups = Array.from(map.values());

    return allGroups.filter(g => {
      // 1. Status Filter
      if (activeStatusTab === 'Archived') {
        if (!g.isArchived) return false;
      } else if (activeStatusTab === 'Active') {
        if (g.isArchived || g.totalAvailableStock <= 0) return false;
      } else if (activeStatusTab === 'Pending') {
        if (g.isArchived || g.totalAvailableStock > 0) return false;
      } else {
        // 'All'
        if (g.isArchived) return false;
      }

      // 2. Search Filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = g.name.toLowerCase().includes(query);
        const matchesDisplayId = (g.displayId || '').toLowerCase().includes(query);
        const matchesCategory = g.category.toLowerCase().includes(query);
        const matchesSupplier = g.supplies.some(s => (s.farmer_name || s.farmer || '').toLowerCase().includes(query));
        return matchesName || matchesDisplayId || matchesCategory || matchesSupplier;
      }

      return true;
    });
  }, [supplies, activeStatusTab, searchTerm]);

  // Pagination calculations (operates on Master Product groups)
  const groupsPerPage = 8;
  const indexOfLastGroup = currentPage * groupsPerPage;
  const indexOfFirstGroup = indexOfLastGroup - groupsPerPage;
  const currentGroups = masterProductGroups.slice(indexOfFirstGroup, indexOfLastGroup);
  const totalPages = Math.ceil(masterProductGroups.length / groupsPerPage);

  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 min-h-[calc(100vh-56px)] flex flex-col bg-[#f9f9f7]">
      <div className="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-primary mb-1">Supply Logs</h2>
          <p className="text-sm text-on-surface-variant font-medium">Manage inbound stock proposals and bulk deals.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Supply Logs Backend Search Bar */}
          <div className="relative w-72 sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant/60">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Search master products by ID or name..."
              value={searchTerm}
              onChange={(e) => setInternalSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-outline-variant rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setInternalSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-on-surface-variant hover:text-on-surface font-extrabold text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
          <div className="flex bg-surface-container-low p-1 rounded-lg shrink-0 overflow-x-auto">
            {['All', 'Pending', 'Active', 'Custom Submissions', 'Archived'].map((t) => {
              const isCustomTab = t === 'Custom Submissions';
              const label = isCustomTab
                ? (pendingCustomCount > 0 ? `Custom Submissions (${pendingCustomCount})` : 'Custom Submissions')
                : t;

              return (
                <button 
                  key={t} 
                  onClick={() => setActiveStatusTab(t)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                    activeStatusTab === t ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  <span>{label}</span>
                  {isCustomTab && pendingCustomCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" title={`${pendingCustomCount} custom harvest submission(s) pending review`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom Submissions Top Notification Link Banner */}
      {pendingCustomCount > 0 && activeStatusTab !== 'Custom Submissions' && (
        <div className="mb-4 bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-950">
                {pendingCustomCount} Custom Farmer Crop Submission{pendingCustomCount > 1 ? 's' : ''} Pending Review
              </h4>
              <p className="text-xs text-amber-800 font-medium mt-0.5">
                Farmers submitted harvest proposals for custom crops not linked to standard requirement templates. Review, negotiate prices, or publish them as Master Products.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveStatusTab('Custom Submissions')}
            className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <span>View Custom Submissions</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 bg-primary/10 border border-primary/20 rounded-xl px-5 py-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-xs font-bold text-primary font-sans">
            {selectedIds.length} items selected
          </span>
          <div className="flex gap-2">
            {activeStatusTab !== 'Archived' && (
              <button
                onClick={handleBulkArchive}
                className="px-3.5 py-1.5 bg-[#144227] text-white rounded-lg font-mono text-[10px] uppercase tracking-wider hover:opacity-90 font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Archive size={12} /> Archive
              </button>
            )}
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-red-700 font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={12} /> Delete
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3.5 py-1.5 bg-white border border-[#c1c9c0] text-[#414942] rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-surface-container-low font-bold transition-all cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-on-surface-variant">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3 opacity-80" />
              <p className="text-sm font-bold text-primary">Loading supplies...</p>
              <p className="text-xs text-on-surface-variant/70 mt-0.5">Fetching latest stock proposals</p>
            </div>
          ) : activeStatusTab === 'Custom Submissions' ? (
            <div>
              <div className="p-4 border-b border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest">
                <div>
                  <h3 className="text-base font-extrabold text-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Custom Farmer Harvest Submissions
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                    Proposals submitted by farmers for unlisted/custom crops. Negotiate prices with farmers and convert agreed harvests into official Master Products.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0 self-start sm:self-auto">
                  {filteredCustomSupplies.length} Custom Harvest Proposal{filteredCustomSupplies.length === 1 ? '' : 's'}
                </span>
              </div>

              {filteredCustomSupplies.length === 0 ? (
                <div className="p-12 text-center text-on-surface-variant space-y-2">
                  <Package className="w-10 h-10 mx-auto opacity-30 text-primary" />
                  <p className="text-sm font-bold">No custom crop submissions found.</p>
                  <p className="text-xs">When farmers submit harvests for custom crops not listed in active demands, they will appear here.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse font-sans">
                  <thead className="border-b border-outline-variant bg-surface-container-low sticky top-0 z-10">
                    <tr className="text-[9px] font-extrabold text-on-surface-variant uppercase tracking-widest">
                      <th className="px-3 py-2.5 text-center w-8">
                        <input 
                          type="checkbox"
                          checked={filteredCustomSupplies.length > 0 && filteredCustomSupplies.every(s => selectedIds.includes(s.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const ids = filteredCustomSupplies.map(s => s.id);
                              setSelectedIds(Array.from(new Set([...selectedIds, ...ids])));
                            } else {
                              const ids = filteredCustomSupplies.map(s => s.id);
                              setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
                            }
                          }}
                          className="rounded border-[#c1c9c0] text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5"
                        />
                      </th>
                      <th className="px-4 py-2.5">Custom Crop</th>
                      <th className="px-4 py-2.5">Farmer Submitter</th>
                      <th className="px-4 py-2.5 text-right">Available Stock</th>
                      <th className="px-4 py-2.5">Asking / Agreed Price</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Inspection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {filteredCustomSupplies.map((sup: any) => {
                      const cropName = (sup.custom_product_name || sup.suggested_product_name || sup.product_detail?.name || 'Custom Crop').trim();
                      const category = (sup.custom_category || sup.product_detail?.category || 'VEGETABLES').toUpperCase();
                      const unit = sup.custom_unit || sup.unit || 'kg';
                      const isAccepted = sup.status === 'accepted';
                      const isRejected = sup.status === 'rejected';
                      const askingPrice = Number(sup.proposed_price || sup.price || 0);
                      const agreedPrice = Number(sup.agreed_price || 0);
                      const activePrice = agreedPrice > 0 ? agreedPrice : askingPrice;
                      const qty = Number(sup.accepted_quantity || sup.quantity || 0);
                      const farmerName = sup.farmer_name || sup.farmer?.farm_name || 'Farmer Submitter';
                      const photoUrl = sup.photo || sup.photo_url || (sup.images && sup.images[0]?.image) || null;

                      return (
                        <tr 
                          key={sup.id} 
                          onClick={() => setSelectedSupply(sup)}
                          className="hover:bg-surface-container-low/70 transition-colors cursor-pointer group"
                        >
                          <td className="px-3 py-3 text-center w-8" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={selectedIds.includes(sup.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(prev => [...prev, sup.id]);
                                } else {
                                  setSelectedIds(prev => prev.filter(id => id !== sup.id));
                                }
                              }}
                              className="rounded border-[#c1c9c0] text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5"
                            />
                          </td>

                          {/* Custom Crop Name & Photo Thumbnail */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {photoUrl ? (
                                <img 
                                  src={photoUrl} 
                                  alt={cropName} 
                                  className="w-8 h-8 rounded-lg object-cover border border-outline-variant/60 bg-surface-container-low shrink-0 shadow-2xs" 
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 border border-amber-200/60 flex items-center justify-center shrink-0">
                                  <Package size={15} />
                                </div>
                              )}

                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-on-surface">{cropName}</p>
                                  <span className="text-[8px] font-extrabold uppercase tracking-wider bg-surface-container-high text-primary px-1.5 py-0.5 rounded border border-outline-variant/30 shrink-0">
                                    {category}
                                  </span>
                                </div>
                                <p className="text-[9.5px] font-medium text-on-surface-variant uppercase tracking-wider mt-0.5">
                                  Unit: {unit} · Submitted by Farmer
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Farmer Submitter */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-xs font-bold text-on-surface">
                              <Users size={12} className="text-primary shrink-0" />
                              <span>{farmerName}</span>
                            </div>
                            {sup.available_date && (
                              <p className="text-[9.5px] text-on-surface-variant font-medium mt-0.5">
                                Ready: {sup.available_date}
                              </p>
                            )}
                          </td>

                          {/* Available Stock */}
                          <td className="px-4 py-3 text-right">
                            <p className="font-mono text-xs font-bold text-on-surface">
                              {qty.toLocaleString()} {unit}
                            </p>
                          </td>

                          {/* Price */}
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs font-bold text-primary">
                              {formatCurrency(activePrice)} / {unit}
                            </p>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border inline-flex items-center gap-1",
                              isAccepted ? "bg-emerald-100 text-emerald-900 border-emerald-300" :
                              isRejected ? "bg-red-100 text-red-900 border-red-300" :
                              "bg-amber-100 text-amber-900 border-amber-300"
                            )}>
                              {isAccepted ? (sup.product ? 'Approved' : 'Negotiated') : (isRejected ? 'Rejected' : 'Pending')}
                            </span>
                          </td>

                          {/* Inspection Link */}
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedSupply(sup)}
                              className="inline-flex items-center gap-1 py-1 px-2.5 bg-surface-container-high hover:bg-surface-container-highest text-primary rounded-lg font-bold text-[10.5px] transition-all border border-outline-variant/60 cursor-pointer shadow-2xs group-hover:border-primary/40"
                              title="Inspect custom crop submission details"
                            >
                              <span>Inspect</span>
                              <ChevronRight size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : masterProductGroups.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-on-surface-variant">
              <AlertCircle className="w-8 h-8 opacity-40 text-primary mb-2" />
              <p className="text-sm font-bold">No master products found.</p>
              {searchTerm && (
                <p className="text-xs text-on-surface-variant mt-1">
                  No products matched <strong className="text-primary">"{searchTerm}"</strong>. Try searching by ID (e.g. MST-000001) or crop name.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/40 bg-surface-container-low text-[9px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                    <th className="px-3 py-2.5 text-center w-8">
                      <input 
                        type="checkbox"
                        checked={currentGroups.length > 0 && currentGroups.every(g => g.supplies.every(s => selectedIds.includes(s.id)))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const allIds = currentGroups.flatMap(g => g.supplies.map(s => s.id));
                            setSelectedIds(Array.from(new Set([...selectedIds, ...allIds])));
                          } else {
                            const allIds = currentGroups.flatMap(g => g.supplies.map(s => s.id));
                            setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
                          }
                        }}
                        className="rounded border-[#c1c9c0] text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5"
                      />
                    </th>
                    <th className="px-4 py-2.5">Master Product</th>
                    <th className="px-4 py-2.5">Suppliers</th>
                    <th className="px-4 py-2.5 text-right">Available Stock</th>
                    <th className="px-4 py-2.5">Selling Price</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {currentGroups.map((group) => (
                    <tr 
                      key={group.id} 
                      onClick={() => setSelectedSupply(group.primarySupply)}
                      className="hover:bg-surface-container-low/70 transition-colors cursor-pointer group"
                    >
                      <td className="px-3 py-3 text-center w-8" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={group.supplies.every(s => selectedIds.includes(s.id))}
                          onChange={(e) => {
                            const ids = group.supplies.map(s => s.id);
                            if (e.target.checked) {
                              setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
                            } else {
                              setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
                            }
                          }}
                          className="rounded border-[#c1c9c0] text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-on-surface">{group.name}</p>
                            {group.displayId && (
                              <span className="text-[8.5px] font-mono font-extrabold bg-[#144227]/10 text-[#144227] px-1.5 py-0.5 rounded border border-[#144227]/20 shrink-0">
                                {group.displayId}
                              </span>
                            )}
                            {hasUnreadNegotiationAction(group) && (
                              <span 
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse shrink-0"
                                title="New farmer negotiation message / counter-offer awaiting response"
                              >
                                <span className="w-1 h-1 rounded-full bg-amber-600 animate-ping shrink-0" />
                                <MessageSquare size={9} className="text-amber-800 shrink-0" />
                                <span>New Message</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[9.5px] font-medium text-on-surface-variant uppercase tracking-wider mt-0.5">
                            {group.category} · {group.batchCount} batch{group.batchCount > 1 ? 'es' : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-on-surface font-semibold">
                          <Users size={12} className="text-primary shrink-0" />
                          <span>
                            {showFarmerNames
                              ? (group.primarySupply.farmer_name || group.primarySupply.farmer?.farm_name || 'Farmer Submitter')
                              : `${group.supplierCount} supplier${group.supplierCount > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-mono text-xs font-bold text-on-surface">
                          {group.totalAvailableStock.toLocaleString()} {group.unit || 'kg'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-bold text-primary">
                          {formatCurrency(group.masterSellingPrice)} / {group.unit || 'kg'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border inline-flex items-center gap-1",
                          group.status === 'accepted' ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "bg-amber-100 text-amber-900 border-amber-300"
                        )}>
                          {group.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                          <span>Inspect</span>
                          <ChevronRight size={14} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dynamic Pagination Bar */}
        {masterProductGroups.length > 0 && activeStatusTab !== 'Custom Submissions' && (
          <div className="px-4 sm:px-6 py-3 border-t border-outline-variant/40 bg-surface-container-lowest flex items-center justify-between gap-4 shrink-0">
            <p className="text-xs font-semibold text-on-surface-variant">
              Showing <span className="font-bold text-on-surface">{indexOfFirstGroup + 1}</span> to <span className="font-bold text-on-surface">{Math.min(indexOfFirstGroup + groupsPerPage, masterProductGroups.length)}</span> of <span className="font-bold text-on-surface">{masterProductGroups.length}</span> master products
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1 border border-outline-variant/60 rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-primary px-2 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1 border border-outline-variant/60 rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DETAIL DRAWER (Inspection Panel) ───────────────────────────────── */}
      {(() => {
        const isHarvestHillSubmission = selectedSupply && (
          (selectedSupply.farmer_name || '').toLowerCase().includes('harvest hill') ||
          (selectedSupply.farmer?.farm_name || '').toLowerCase().includes('harvest hill') ||
          selectedSupply.farmer?.user?.role === 'admin'
        );

        const isCustomCropSubmission = selectedSupply && (
          !selectedSupply.product || 
          selectedSupply.is_suggested_product || 
          !!selectedSupply.custom_product_name || 
          !!selectedSupply.suggested_product_name ||
          !!selectedSupply.client_request ||
          !!selectedSupply.product_request
        );

        const latestOffer = selectedSupply?.latest_offer;
        const offerStatus = (latestOffer?.offer_status || latestOffer?.status || '').toUpperCase();
        const hasNegotiationStarted = !!(selectedSupply?.has_admin_negotiation || selectedSupply?.latest_offer || selectedSupply?.status === 'in_negotiation' || selectedSupply?.status === 'counter_offered');
        const isNegotiationInProcess = hasNegotiationStarted && offerStatus !== 'ACCEPTED' && selectedSupply?.status !== 'accepted';
        const isAlreadyApproved = selectedSupply && (!!selectedSupply.product || (selectedSupply.status === 'accepted' && !!selectedSupply.product));
        const isRejected = selectedSupply && selectedSupply.status === 'rejected';

        return (
          <DetailDrawer
            isOpen={!!selectedSupply}
            onClose={() => setSelectedSupply(null)}
            title={selectedSupply?.product_detail?.name || selectedSupply?.custom_product_name || selectedSupply?.suggested_product_name || 'Supply Details'}
            subtitle="Inbound Supply Manager"
            footer={
              selectedSupply && (
                <div className="space-y-2.5 w-full font-sans text-xs">
                  {/* Custom Submission Specific Actions */}
                  {isCustomCropSubmission && !selectedSupply.is_archived ? (
                    <div className="space-y-2.5 w-full">
                      <button 
                        type="button"
                        onClick={() => {
                          const supToNeg = selectedSupply;
                          setSelectedSupply(null);
                          setActiveNegotiationSupply(supToNeg);
                        }}
                        className="w-full py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant/60 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-2xs"
                      >
                        <Handshake size={14} /> Negotiate
                      </button>

                      {isAlreadyApproved ? (
                        <span className="w-full py-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs shadow-2xs select-none">
                          <CheckCircle2 size={14} /> Approved
                        </span>
                      ) : isRejected ? (
                        <span className="w-full py-2.5 bg-red-100 text-red-900 border border-red-300 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs shadow-2xs select-none">
                          <X size={14} /> Rejected
                        </span>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            type="button"
                            onClick={() => {
                              const supToApprove = selectedSupply;
                              setSelectedSupply(null);
                              handleOpenApproveChoiceModal(supToApprove);
                            }}
                            className="w-full py-2.5 bg-primary text-white hover:opacity-90 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-sm"
                            title="Approve custom submission"
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>

                          <button 
                            type="button"
                            onClick={() => {
                              const supToReject = selectedSupply;
                              handleRejectCustomSubmission(supToReject);
                            }}
                            className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-2xs"
                            title="Reject custom submission"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Standard Supply Log Actions */
                    <>
                      {selectedSupply.status === 'pending' && !selectedSupply.is_archived && (
                        <div>
                          <button 
                            onClick={async () => {
                              const confirmed = await showConfirm("Reject Supply Proposal", "Are you sure you want to reject this supply proposal?");
                              if (confirmed) {
                                handleUpdateStatus(selectedSupply.id, 'rejected');
                              }
                            }}
                            className="w-full py-2.5 px-3 bg-[#7f1d1d] text-white rounded-xl font-bold hover:bg-red-800 transition-all cursor-pointer text-xs shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <X size={15} /> Reject Proposal
                          </button>
                        </div>
                      )}

                      {!selectedSupply.is_archived && (
                        <div className="w-full">
                          {isHarvestHillSubmission ? (
                            <button 
                              type="button"
                              onClick={() => {
                                const supToEdit = selectedSupply;
                                setSelectedSupply(null);
                                handleOpenEditModal(supToEdit);
                              }}
                              className="w-full py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-[#376847] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-sm"
                            >
                              <Edit3 size={14} /> Edit Supply
                            </button>
                          ) : (
                            <button 
                              type="button"
                              onClick={() => {
                                const supToNeg = selectedSupply;
                                setSelectedSupply(null);
                                setActiveNegotiationSupply(supToNeg);
                              }}
                              className="w-full py-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold hover:bg-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                            >
                              <Handshake size={14} /> Contextual Negotiation Pane
                            </button>
                          )}
                        </div>
                      )}

                      {!selectedSupply.is_archived && (
                        <div className={cn("grid gap-2.5", selectedSupply.is_discounted ? "grid-cols-1" : "grid-cols-2")}>
                          {!selectedSupply.is_discounted && (
                            <button
                              type="button"
                              onClick={() => {
                                const sup = selectedSupply;
                                setSelectedSupply(null);
                                setDiscountSupply(sup);
                                setDiscountIsActive(!!sup.is_discounted);
                                setDiscountPriceInput(sup.discount_price ? String(sup.discount_price) : '');
                              }}
                              className="w-full py-2.5 bg-orange-50/80 border border-orange-200 text-orange-950 rounded-xl font-extrabold hover:bg-orange-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-2xs"
                            >
                              <Tag size={13} className="text-orange-700" />
                              <span>Fresh Deals</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const sup = selectedSupply;
                              setSelectedSupply(null);
                              setVisibilitySupply(sup);
                              setVisibilityScopeInput(sup.visibility_scope || 'private_admin');
                              setDiscloseFarmerNameInput(!!sup.disclose_farmer_name);
                            }}
                            className="w-full py-2.5 bg-[#f6f3ec] border border-[#e5e2db] text-[#1c1c18] rounded-xl font-extrabold hover:bg-[#f0eee7] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-2xs"
                          >
                            <Eye size={13} className="text-primary" />
                            <span>Visibility</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {!selectedSupply.is_archived && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button 
                        onClick={() => handleArchiveSupply(selectedSupply.id)}
                        className="w-full py-2.5 bg-white border border-outline-variant/60 text-on-surface rounded-xl font-bold hover:bg-surface-container-high transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      >
                        <Archive size={14} className="text-on-surface-variant" /> Archive
                      </button>
                      <button 
                        onClick={() => {
                          const sup = selectedSupply;
                          setDeleteWarningSupply(sup);
                        }}
                        className="w-full py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => setSelectedSupply(null)}
                    className="w-full py-2.5 bg-surface-container-low border border-outline-variant/30 text-on-surface-variant rounded-xl font-bold hover:bg-surface-container-high transition-all cursor-pointer text-xs"
                  >
                    Close
                  </button>
                </div>
              )
            }
      >
        {selectedSupply && (
          <div className="space-y-5 font-sans text-xs">
            {/* Multi-Image Gallery Selector */}
            {(() => {
              const galleryImages: string[] = [];
              const seen = new Set<string>();

              const getFullImageUrl = (url?: string | null) => {
                if (!url) return '';
                if (url.startsWith('http://') || url.startsWith('https://')) return url;
                const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
              };

              const addImg = (url?: string | null) => {
                if (!url) return;
                const fullUrl = getFullImageUrl(url);
                if (fullUrl && !seen.has(fullUrl)) {
                  seen.add(fullUrl);
                  galleryImages.push(fullUrl);
                }
              };

              // Prioritize custom batch photo
              addImg(selectedSupply.photo);

              // Add additional uploaded batch photos
              if (Array.isArray(selectedSupply.images) && selectedSupply.images.length > 0) {
                selectedSupply.images.forEach((imgObj: any) => {
                  addImg(imgObj.image_url || imgObj.image);
                });
              }

              // Fall back to catalog template image ONLY if no batch photos exist
              if (galleryImages.length === 0) {
                addImg(selectedSupply.product_detail?.image_url || selectedSupply.product_detail?.image);
              }

              if (galleryImages.length === 0) return null;

              const activeImg = galleryImages[activeImageIndex] || galleryImages[0];

              return (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center px-0.5">
                    <h4 className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">
                      Harvest Photos ({galleryImages.length})
                    </h4>
                    {galleryImages.length > 1 && (
                      <span className="text-[10px] text-on-surface-variant/70 font-mono">
                        {activeImageIndex + 1} of {galleryImages.length}
                      </span>
                    )}
                  </div>

                  {/* Main Active Image Display */}
                  <div className="h-56 w-full rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container-low shadow-sm relative group">
                    <img 
                      src={activeImg} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      alt="Selected harvest batch" 
                    />
                  </div>

                  {/* Interactive Thumbnail Gallery Selector */}
                  {galleryImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {galleryImages.map((imgUrl, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={cn(
                            "w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 bg-surface-container-low",
                            activeImageIndex === index 
                              ? "border-primary ring-2 ring-primary/20 scale-105 shadow-sm" 
                              : "border-outline-variant/40 opacity-70 hover:opacity-100 hover:border-outline"
                          )}
                        >
                          <img src={imgUrl} className="w-full h-full object-cover" alt={`Thumbnail ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Custom Crop Notice Banner */}
            {!selectedSupply.product && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl space-y-1">
                <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-700" /> Custom Crop Proposal
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  This harvest was submitted as a custom proposal. You can review all details and photos above before approving or rejecting.
                </p>
              </div>
            )}

            {/* Side-by-Side / Stacked Requirement vs Farmer Submission Comparison */}
            <div className="space-y-3 font-sans">
              {/* Requirement Box */}
              {(selectedSupply.product_detail || selectedSupply.custom_product_name) && (
                <div className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#E8E4DA] space-y-2.5">
                  <div className="flex justify-between items-center pb-1.5 border-b border-[#E8E4DA]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2D5A3D]">
                      Harvest Hill Requirement
                    </span>
                    <span className="text-[10px] font-bold text-[#717971]">
                      Deadline: {selectedSupply.product_detail?.submission_deadline || 'Open'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    {/* Left Side: Crop Requirement & Target Price */}
                    <div className="space-y-3 min-w-0 pr-1">
                      <div>
                        <span className="text-[9.5px] text-[#717971] font-bold block uppercase tracking-wider mb-0.5">Crop Requirement</span>
                        <span className="font-extrabold text-[#1C2A1E] leading-snug block break-words">
                          {selectedSupply.product_detail?.name || selectedSupply.custom_product_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-[#717971] font-bold block uppercase tracking-wider mb-0.5">Reference Target Price</span>
                        <span className="font-extrabold text-[#2D5A3D] block">
                          {formatCurrency(selectedSupply.product_detail?.base_price || selectedSupply.base_price || selectedSupply.price)} / {selectedSupply.unit}
                        </span>
                      </div>
                    </div>

                    {/* Right Side: Quantity Needed & Category (Separated with border-l divider) */}
                    <div className="space-y-3 min-w-0 pl-3.5 border-l border-[#E8E4DA]">
                      <div>
                        <span className="text-[9.5px] text-[#717971] font-bold block uppercase tracking-wider mb-0.5">Quantity Needed</span>
                        <span className="font-extrabold text-[#1C2A1E] block">
                          {(() => {
                            const templateQty = parseFloat(selectedSupply.product_detail?.quantity_needed || 0);
                            const displayQty = templateQty > 0 ? templateQty : parseFloat(selectedSupply.quantity || 0);
                            return `${displayQty.toLocaleString()} ${selectedSupply.unit}`;
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-[#717971] font-bold block uppercase tracking-wider mb-0.5">Category</span>
                        <span className="font-bold text-[#1C2A1E] block">
                          {selectedSupply.product_detail?.category || selectedSupply.custom_category || 'Vegetables'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedSupply.product_detail?.quality_requirements && (
                    <div className="pt-2 border-t border-[#E8E4DA] text-[11px] text-[#414942]">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#717971] block mb-1">Quality Requirements</span>
                      <p className="whitespace-pre-line font-mono text-[10.5px] bg-white p-2.5 rounded-lg border border-[#E8E4DA]">{selectedSupply.product_detail?.quality_requirements}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Farmer Submission Box */}
              <div className="p-3.5 bg-white rounded-xl border border-outline-variant/50 space-y-2 shadow-2xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-outline-variant/30">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    Farmer Harvest Offer
                    {isSupplyUnreadAction(selectedSupply) && (
                      <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping shrink-0" />
                        <MessageSquare size={10} className="text-amber-800 shrink-0" />
                        <span>New Negotiation Message</span>
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant">
                    Submitted by {selectedSupply.farmer_name || 'Partner Farm'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9.5px] text-on-surface-variant font-bold block uppercase tracking-wider">Available Quantity</span>
                    <span className="font-extrabold text-on-surface">{selectedSupply.quantity} {selectedSupply.unit}</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-on-surface-variant font-bold block uppercase tracking-wider">Farmer Asking Price</span>
                    <span className="font-extrabold text-primary">{formatCurrency(selectedSupply.price || selectedSupply.proposed_price)} / {selectedSupply.unit}</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-on-surface-variant font-bold block uppercase tracking-wider">Harvest Date</span>
                    <span className="font-bold text-on-surface">{selectedSupply.available_date || 'Freshly Harvested'}</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-on-surface-variant font-bold block uppercase tracking-wider">Farm Location</span>
                    <span className="font-medium text-on-surface-variant">{selectedSupply.farmer_location || 'Rwanda'}</span>
                  </div>
                </div>

                {(() => {
                  const cleanNotes = getCleanFarmerNotes(selectedSupply);
                  if (!cleanNotes) return null;
                  return (
                    <div className="pt-2 border-t border-outline-variant/30 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1">
                          <FileText size={13} className="text-primary shrink-0" /> Supplier Notes
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAdminNotesModal(!showAdminNotesModal)}
                          className="text-[10.5px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                        >
                          {showAdminNotesModal ? 'Hide Notes' : 'View Supplier Notes'}
                        </button>
                      </div>

                      {showAdminNotesModal && (
                        <div className="mt-1.5 p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface font-medium leading-relaxed whitespace-pre-line text-xs animate-in fade-in duration-200">
                          {cleanNotes}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Master Product Supply Composition Breakdown Card */}
            {(() => {
              const currentProdName = selectedSupply.product_detail?.name || selectedSupply.custom_product_name || selectedSupply.suggested_product_name;
              const siblingSupplies = supplies.filter(s => 
                (s.product_detail?.name || s.custom_product_name || s.suggested_product_name) === currentProdName
              );

              const totalAcceptedStock = siblingSupplies
                .filter(s => s.status === 'accepted')
                .reduce((sum, s) => sum + Number(s.accepted_quantity ?? s.quantity ?? 0), 0);

              return (
                <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/60 space-y-3 font-sans shadow-2xs">
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-1.5">
                        <Package size={14} /> Master Product Inventory Composition
                      </h4>
                      <p className="text-[10.5px] text-on-surface-variant font-medium mt-0.5">
                        {siblingSupplies.length} Supply Batch{siblingSupplies.length > 1 ? 'es' : ''} • {totalAcceptedStock.toLocaleString()} {selectedSupply.unit} Total Stock
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {siblingSupplies.map((sup, idx) => (
                      <div 
                        key={sup.id || idx} 
                        onClick={() => setSelectedSupply(sup)}
                        className={cn(
                          "p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer",
                          selectedSupply.id === sup.id ? "bg-primary/10 border-primary shadow-2xs" : "bg-white border-outline-variant/40 hover:bg-surface-container-high"
                        )}
                      >
                        <div>
                          <p className="font-extrabold text-on-surface flex items-center gap-1.5 flex-wrap">
                            <span className="flex items-center gap-1"><UserCheck size={13} className="text-primary" /> {sup.farmer_name || 'Partner Farm'}</span>
                            <span className="text-[9px] font-mono text-on-surface-variant/70">({sup.supply_number || 'SUP-BATCH'})</span>
                            {isSupplyUnreadAction(sup) && (
                              <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping shrink-0" />
                                <span>New Message</span>
                              </span>
                            )}
                          </p>
                          <p className="text-[10.5px] font-medium text-on-surface-variant mt-0.5">
                            Acquisition Price: <span className="font-bold font-mono text-primary">{formatCurrency(sup.agreed_price || sup.price)}</span> / {sup.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-xs block text-on-surface">
                            {Number(sup.accepted_quantity ?? sup.quantity ?? 0).toLocaleString()} {sup.unit}
                          </span>
                          <span className={cn(
                            "text-[9px] font-extrabold px-2 py-0.5 rounded uppercase mt-0.5 inline-block",
                            sup.status === 'accepted' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {sup.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* B2B Term Agreement Form vs Finalized Stats Display */}
            {isHarvestHillSubmission ? null : selectedSupply.status === 'accepted' ? (
              <div className="p-4 bg-emerald-50/90 rounded-2xl border border-emerald-300/80 space-y-3 font-sans shadow-xs">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-700" /> Finalized B2B Terms & Stock Aggregated
                  </span>
                  <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase">
                    Deal Closed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                    <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Accepted Quantity</p>
                    <p className="text-sm font-extrabold text-emerald-950 mt-0.5">{selectedSupply.accepted_quantity || selectedSupply.quantity} {selectedSupply.unit}</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                    <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Agreed Farmer Price</p>
                    <p className="text-sm font-extrabold text-primary mt-0.5">{formatCurrency(selectedSupply.agreed_price || selectedSupply.price)} / {selectedSupply.unit}</p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 flex justify-between items-center shadow-2xs">
                  <span className="text-xs font-bold text-emerald-900">Total Batch Payout Value</span>
                  <span className="text-sm font-black text-secondary">
                    {formatCurrency((selectedSupply.accepted_quantity || selectedSupply.quantity) * (selectedSupply.agreed_price || selectedSupply.price))}
                  </span>
                </div>

                {(() => {
                  const agreedTermsList: string[] = [];

                  if (adminThread?.offers && Array.isArray(adminThread.offers)) {
                    adminThread.offers.forEach((o: any) => {
                      if (o.is_offer === false) return; // Exclude plain chat messages
                      const txt = (o.terms || '').trim();
                      if (txt && !txt.startsWith('[Admin Terms]') && !txt.toLowerCase().includes('farmer proposed') && !txt.toLowerCase().includes('harvest hill counter')) {
                        const splitItems = txt.split(/\r?\n|;/).map((s: string) => s.trim()).filter(Boolean);
                        splitItems.forEach((item: string) => {
                          if (!agreedTermsList.includes(item)) agreedTermsList.push(item);
                        });
                      }
                    });
                  }

                  if (selectedSupply.notes && selectedSupply.notes.includes('[Agreed Terms]:')) {
                    const legacyPart = selectedSupply.notes.split('[Agreed Terms]:')[1]?.trim();
                    if (legacyPart) {
                      const legacyItems = legacyPart.split(/\r?\n|;/).map((s: string) => s.trim()).filter(Boolean);
                      legacyItems.forEach((item: string) => {
                        if (!agreedTermsList.includes(item)) agreedTermsList.push(item);
                      });
                    }
                  }

                  if (agreedTermsList.length === 0) return null;

                  return (
                    <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-2 font-sans shadow-2xs">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-700 shrink-0" /> Finalized Agreed Terms
                      </p>
                      <ul className="space-y-1.5 pl-1">
                        {agreedTermsList.map((term, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-medium text-emerald-950 leading-relaxed">
                            <span className="text-emerald-700 font-bold text-sm leading-none mt-0.5">•</span>
                            <span>{term}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <Handshake size={14} className="text-emerald-700" /> Negotiate Terms & Aggregate Inventory
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Harvest Hill Admin Tool
                  </span>
                </div>

                {/* Interactive Admin Negotiation Chat & Terms History Window */}
                <div className="space-y-2 font-sans">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-emerald-700" /> Negotiation Chat & Terms History
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {adminThread?.offers?.length || 0} Message{(adminThread?.offers?.length || 0) === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-3 bg-white/95 rounded-xl border border-emerald-300/80 space-y-2.5 shadow-2xs">
                    {isLoadingThread ? (
                      <div className="py-6 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
                        <RefreshCw size={14} className="animate-spin text-emerald-700" /> Loading negotiation chat...
                      </div>
                    ) : adminThread?.offers && adminThread.offers.length > 0 ? (
                      adminThread.offers.map((offer: any, idx: number) => {
                        const isFarmer = offer.sender === 'farmer';
                        const isPlainMessage = offer.is_offer === false;

                        if (isPlainMessage) {
                          return (
                            <div 
                              key={offer.id || idx}
                              className={cn(
                                "flex items-start gap-2.5 max-w-[88%] group relative text-xs font-sans my-1.5",
                                isFarmer ? "mr-auto" : "ml-auto flex-row-reverse"
                              )}
                            >
                              <div className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-mono font-bold text-white shrink-0 shadow-2xs mt-0.5",
                                isFarmer ? "bg-amber-700" : "bg-[#144227]"
                              )}>
                                {isFarmer ? 'FM' : 'HH'}
                              </div>

                              <div className="relative max-w-[90%]">
                                <div className={cn(
                                  "p-3 rounded-2xl text-xs leading-relaxed shadow-2xs border",
                                  isFarmer 
                                    ? "bg-amber-50/90 text-amber-950 border-amber-200/90 rounded-tl-none" 
                                    : "bg-[#144227] text-white border-[#144227] rounded-tr-none"
                                )}>
                                  <div className={cn(
                                    "flex items-center justify-between gap-3 mb-1 text-[9.5px] pb-1 border-b",
                                    isFarmer ? "border-amber-200/60 text-amber-900/80" : "border-white/20 text-emerald-100"
                                  )}>
                                    <span className="font-extrabold">{isFarmer ? (offer.sender_name || 'Farmer') : 'Harvest Hill Delivery'}</span>
                                    <span className="font-mono text-[8.5px] opacity-80">
                                      {offer.created_at ? new Date(offer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                    </span>
                                  </div>
                                  <p className="font-medium whitespace-pre-line text-xs">
                                    {offer.message || offer.terms}
                                  </p>
                                </div>

                                {/* Hover Trash Delete Option */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOfferTerm(offer.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 -right-1 z-30 p-1 bg-red-100 text-red-700 rounded-full border border-red-200 hover:bg-red-200 cursor-pointer shadow-md"
                                  title="Delete message"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          );
                        }

                        {/* Render Structured Negotiation Offer Card */}
                        return (
                          <div 
                            key={offer.id || idx}
                            className={cn(
                              "p-3.5 rounded-2xl border text-xs font-sans space-y-2 relative group transition-all shadow-2xs my-2",
                              isFarmer 
                                ? "bg-amber-50/90 border-amber-300/80 text-amber-950" 
                                : "bg-emerald-50/90 border-emerald-300/80 text-emerald-950"
                            )}
                          >
                            {/* Hover Trash Delete Option */}
                            <button
                              type="button"
                              onClick={() => handleDeleteOfferTerm(offer.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-30 p-1 bg-red-100 text-red-700 rounded-full border border-red-200 hover:bg-red-200 cursor-pointer shadow-md"
                              title="Delete negotiation term"
                            >
                              <Trash2 size={11} />
                            </button>

                            {/* Card Header Badge */}
                            <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
                              <span className="text-[9.5px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                                <span className={cn(
                                  "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-bold text-white shadow-2xs",
                                  isFarmer ? "bg-amber-700" : "bg-emerald-800"
                                )}>
                                  {isFarmer ? 'FM' : 'HH'}
                                </span>
                                <span className="font-extrabold">{isFarmer ? (offer.sender_name || 'Farmer') : 'Harvest Hill Delivery'}</span>
                                <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold bg-white/80 border border-black/10 text-primary">
                                  {offer.parent_offer ? 'COUNTER PROPOSAL' : 'OFFER TERMS'}
                                </span>
                              </span>
                              <span className="text-[8px] font-mono opacity-70 pr-5">
                                {offer.created_at ? new Date(offer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                              </span>
                            </div>

                            {/* Proposed Specs Grid */}
                            <div className="flex items-center gap-4 bg-white/90 p-2.5 rounded-xl border border-black/10 font-mono text-xs">
                              <div>
                                <p className="text-[8px] font-extrabold text-emerald-900 uppercase">Proposed Price</p>
                                <p className="font-black text-emerald-950">{formatCurrency(offer.price)} / {selectedSupply.unit}</p>
                              </div>
                              <div className="h-6 w-px bg-black/10" />
                              <div>
                                <p className="text-[8px] font-extrabold text-emerald-900 uppercase">Proposed Qty</p>
                                <p className="font-black text-emerald-950">{offer.quantity} {selectedSupply.unit}</p>
                              </div>
                            </div>

                            {/* Custom Terms Note */}
                            {(offer.terms || offer.message) && (
                              <p className="text-[11px] font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-black/10 text-emerald-950">
                                {offer.terms || offer.message}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3.5 bg-white/80 rounded-xl border border-emerald-200/80 text-xs space-y-1">
                        <p className="font-extrabold text-emerald-950">No negotiation started yet for this supply.</p>
                        <p className="text-emerald-900/80 text-[11px] leading-relaxed">
                          This supply is pending review and has no active negotiation thread.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                      Submitted Qty ({selectedSupply.unit})
                    </label>
                    <div className="px-3 py-2 bg-emerald-100/50 rounded-xl font-bold text-xs text-emerald-950 border border-emerald-200">
                      {selectedSupply.quantity} {selectedSupply.unit}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                      Agreed Accepted Qty ({selectedSupply.unit})
                    </label>
                    <input 
                      type="number" 
                      value={agreedQtyInput} 
                      onChange={(e) => setAgreedQtyInput(e.target.value)}
                      placeholder={`e.g. ${selectedSupply.quantity || 100}`}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 font-bold text-xs outline-none focus:border-emerald-700 text-emerald-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                      Proposed Price
                    </label>
                    <div className="px-3 py-2 bg-emerald-100/50 rounded-xl font-bold text-xs text-emerald-950 border border-emerald-200">
                      {formatCurrency(selectedSupply.price)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                      Agreed Farmer Price (RWF)
                    </label>
                    <input 
                      type="number" 
                      value={agreedPriceInput} 
                      onChange={(e) => setAgreedPriceInput(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 font-bold text-xs outline-none focus:border-emerald-700 text-emerald-950"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[9px] font-extrabold uppercase text-emerald-950">Target Master Product</label>
                  <select
                    value={targetProductId}
                    onChange={(e) => setTargetProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 font-bold text-xs outline-none focus:border-emerald-700 text-emerald-950 cursor-pointer"
                  >
                    <option value="">
                      {selectedSupply.is_suggested_product || !selectedSupply.product
                        ? `[Approve Suggested Master Product: "${selectedSupply.suggested_product_name || selectedSupply.custom_product_name}"]`
                        : `-- Select Existing Master Product Template --`}
                    </option>
                    {masterProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category} - {formatCurrency(p.base_price)}/{p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Custom Terms / Admin Notes Text Field */}
                <div className="space-y-1 pt-1">
                  <label className="text-[9px] font-extrabold uppercase text-emerald-950">
                    Optional Custom Terms / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="Add optional delivery or payment terms..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-medium outline-none focus:border-emerald-700 text-emerald-950 resize-none placeholder:text-emerald-900/40"
                  />
                </div>

                {/* Validation Warning Feedback */}
                {(() => {
                  const parsedQty = parseFloat(agreedQtyInput || '0');
                  const parsedPrice = parseFloat(agreedPriceInput || '0');
                  const submittedQty = parseFloat(String(selectedSupply.quantity || '0'));
                  const isExceedingQty = parsedQty > submittedQty;
                  const isInvalid = isNaN(parsedQty) || parsedQty <= 0 || isNaN(parsedPrice) || parsedPrice <= 0 || isExceedingQty;

                  if (isExceedingQty) {
                    return (
                      <div className="p-2 rounded-lg bg-red-100 border border-red-300 text-[10px] font-bold text-red-800 text-center animate-in fade-in duration-200">
                        Accepted quantity ({parsedQty} {selectedSupply.unit}) cannot exceed submitted harvest quantity ({submittedQty} {selectedSupply.unit}).
                      </div>
                    );
                  }

                  if (isInvalid) {
                    return (
                      <div className="p-2 rounded-lg bg-red-100 border border-red-300 text-[10px] font-bold text-red-800 text-center">
                        Accepted quantity and agreed farmer price must both be greater than 0.
                      </div>
                    );
                  }
                  return null;
                })()}

                {(() => {
                  const parsedQty = parseFloat(agreedQtyInput || '0');
                  const parsedPrice = parseFloat(agreedPriceInput || '0');
                  const submittedQty = parseFloat(String(selectedSupply.quantity || '0'));
                  const isExceedingQty = parsedQty > submittedQty;
                  const isInvalid = isNaN(parsedQty) || parsedQty <= 0 || isNaN(parsedPrice) || parsedPrice <= 0 || isExceedingQty;

                  const latestOffer = adminThread?.offers && adminThread.offers.length > 0
                    ? adminThread.offers[adminThread.offers.length - 1]
                    : null;

                  const isLatestOfferByMe = latestOffer 
                    ? (latestOffer.sender === 'admin' || latestOffer.sender_role === 'admin' || latestOffer.sender_role === 'staff')
                    : false;

                  const origQty = latestOffer
                    ? parseFloat(String(latestOffer.quantity))
                    : parseFloat(String(selectedSupply.accepted_quantity ?? selectedSupply.quantity ?? '0'));

                  const origPrice = latestOffer
                    ? parseFloat(String(latestOffer.price))
                    : parseFloat(String(selectedSupply.agreed_price ?? (selectedSupply.proposed_price || selectedSupply.price || '0')));

                  const isQtyChanged = Math.abs(parsedQty - origQty) > 0.001;
                  const isPriceChanged = Math.abs(parsedPrice - origPrice) > 0.001;
                  const isNotesEntered = adminNotesInput.trim().length > 0;
                  const isProductSelected = !!targetProductId && String(targetProductId) !== String(selectedSupply.product || '');

                  const isTermsUpdated = isQtyChanged || isPriceChanged || isNotesEntered || isProductSelected;
                  const isCounterDisabled = isSubmittingAgreement || isInvalid || !isTermsUpdated;
                  const isAcceptDisabled = isSubmittingAgreement || isInvalid || isLatestOfferByMe || isTermsUpdated;

                  return (
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isCounterDisabled}
                        onClick={handleCounterSupply}
                        className="flex-1 py-3 bg-[#2c5234] hover:bg-[#1e3a29] text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title={
                          isInvalid
                            ? (isExceedingQty ? "Accepted quantity cannot exceed submitted quantity" : "Accepted quantity and agreed price must both be greater than 0")
                            : !isTermsUpdated
                            ? "Modify price, quantity, custom notes, or target product to enable counter button"
                            : "Send counter-proposal terms to farmer"
                        }
                      >
                        <Send size={15} /> Counter
                      </button>
                      <button
                        type="button"
                        disabled={isAcceptDisabled}
                        onClick={handleAgreeSupply}
                        className="flex-1 py-3 bg-[#144227] hover:bg-[#0f2e1b] text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title={
                          isInvalid
                            ? (isExceedingQty ? "Accepted quantity cannot exceed submitted quantity" : "Accepted quantity and agreed price must both be greater than 0")
                            : isTermsUpdated
                            ? "You modified negotiation terms. Click 'Counter' to propose these terms to the farmer first."
                            : isLatestOfferByMe
                            ? "Waiting for the farmer to accept or counter your latest proposal."
                            : "Accept terms and finalize harvest into master stock"
                        }
                      >
                        <CheckCircle2 size={15} /> Accept
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Active Fresh Deal Banner (Rendered right below finalized negotiation terms when supply is discounted) */}
            {selectedSupply.is_discounted && (
              <div className="p-3.5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 rounded-2xl border border-orange-300/80 space-y-2.5 font-sans shadow-2xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                      <Tag size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-orange-950">Active Fresh Deal</span>
                        {selectedSupply.discount_price && (
                          <span className="px-2 py-0.5 bg-orange-600 text-white text-[9.5px] font-black rounded-full uppercase tracking-wider font-mono">
                            {(() => {
                              const stdP = parseFloat(selectedSupply.agreed_price || selectedSupply.price || selectedSupply.base_price || 0);
                              const discP = parseFloat(selectedSupply.discount_price);
                              if (stdP > 0 && discP < stdP) {
                                return `${Math.round(((stdP - discP) / stdP) * 100)}% OFF`;
                              }
                              return 'Active';
                            })()}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-orange-900 font-mono mt-0.5">
                        Discounted Price: <span className="font-extrabold text-orange-950 text-xs">{formatCurrency(selectedSupply.discount_price)}</span> / {selectedSupply.unit || 'kg'}
                        <span className="text-[10px] text-on-surface-variant/70 font-normal ml-1.5 border-l border-orange-300 pl-1.5">
                          (Standard: {formatCurrency(selectedSupply.agreed_price || selectedSupply.price)})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Deal Payout Price & Savings Box */}
                {selectedSupply.discount_price && (
                  (() => {
                    const qty = parseFloat(selectedSupply.accepted_quantity || selectedSupply.quantity || 0);
                    const stdP = parseFloat(selectedSupply.agreed_price || selectedSupply.price || selectedSupply.base_price || 0);
                    const discP = parseFloat(selectedSupply.discount_price);
                    const discTotal = qty * discP;
                    const stdTotal = qty * stdP;
                    const savedBatchRwf = stdTotal - discTotal;

                    return (
                      <div className="bg-white/90 p-2.5 rounded-xl border border-orange-200/80 flex items-center justify-between text-xs shadow-2xs">
                        <div>
                          <p className="text-[9.5px] font-extrabold text-orange-900 uppercase tracking-wider">Total Deal Price ({qty} {selectedSupply.unit || 'kg'})</p>
                          <p className="text-sm font-black text-orange-950 font-mono mt-0.5">
                            {formatCurrency(discTotal)}
                          </p>
                        </div>
                        {savedBatchRwf > 0 && (
                          <div className="text-right">
                            <p className="text-[9.5px] font-extrabold text-emerald-800 uppercase tracking-wider">Total Batch Savings</p>
                            <p className="text-xs font-black text-emerald-700 font-mono mt-0.5">
                              Save {formatCurrency(savedBatchRwf)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}

                {/* Actions: Edit Fresh Deal vs Abort Deal */}
                <div className="flex items-center gap-2 pt-1 border-t border-orange-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      const sup = selectedSupply;
                      setSelectedSupply(null);
                      setDiscountSupply(sup);
                      setDiscountIsActive(true);
                      setDiscountPriceInput(sup.discount_price ? String(sup.discount_price) : '');
                    }}
                    className="flex-1 py-2 px-3 bg-white hover:bg-orange-100/70 text-orange-950 border border-orange-300 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Edit3 size={13} className="text-orange-800" />
                    <span>Edit Deal</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = await showConfirm(
                        "Abort Fresh Deal?",
                        `Are you sure you want to abort the fresh deal discount for ${selectedSupply.product_detail?.name || selectedSupply.custom_product_name || 'this supply'}? Price will revert back to standard (${formatCurrency(selectedSupply.agreed_price || selectedSupply.price)}).`
                      );
                      if (confirmed) {
                        handleAbortDiscount(selectedSupply);
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <X size={13} />
                    <span>Abort Deal</span>
                  </button>
                </div>
              </div>
            )}

            {(() => {
              const targetMaster = masterProducts.find(p => String(p.id) === String(selectedSupply.product || selectedSupply.product_detail?.id));
              const masterPrice = Number(targetMaster?.base_price ?? selectedSupply.product_detail?.base_price ?? selectedSupply.base_price ?? selectedSupply.agreed_price ?? selectedSupply.price ?? 0);

              const currentProdName = selectedSupply.product_detail?.name || selectedSupply.custom_product_name || selectedSupply.suggested_product_name;
              const siblingSupplies = supplies.filter(s => 
                (s.product_detail?.name || s.custom_product_name || s.suggested_product_name) === currentProdName
              );

              const totalAcceptedStock = siblingSupplies
                .filter(s => s.status === 'accepted')
                .reduce((sum, s) => sum + Number(s.accepted_quantity ?? s.quantity ?? 0), 0);

              const liveAcceptedQty = totalAcceptedStock > 0 
                ? totalAcceptedStock 
                : Number(selectedSupply.accepted_quantity ?? selectedSupply.quantity ?? 0);

              const totalValuedBatchPrice = liveAcceptedQty * masterPrice;

              return (
                <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20">
                  <span className="text-xs text-on-surface-variant font-bold">Total Valued Batch Price</span>
                  <span className="text-sm font-black text-secondary">
                    {formatCurrency(totalValuedBatchPrice)}
                  </span>
                </div>
              );
            })()}
          </div>
        )}
      </DetailDrawer>
    );
  })()}

      {/* Success Modal Pop-up */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/50 transform scale-100 transition-all space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-700">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-extrabold text-[#144227]">
              Proposal Accepted!
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              The supply proposal for <strong className="text-primary">{successModal.productName}</strong> has been accepted successfully.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setSuccessModal({ isOpen: false, productName: '' })}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold font-sans text-base hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Direct Edit Supply Modal */}
      {editSupply && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/60 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-on-surface">Edit Harvest / Supply Listing</h3>
                <p className="text-xs text-on-surface-variant font-medium">Harvest Hill Admin Direct Supply Manager</p>
              </div>
              <button
                type="button"
                onClick={() => setEditSupply(null)}
                className="p-1.5 rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-on-surface-variant">Quantity</label>
                  <input
                    type="number"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl font-bold text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-on-surface-variant">Unit</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl font-bold text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-on-surface-variant">Price per Unit (RWF)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl font-bold text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-on-surface-variant">Notes / Admin Terms</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Enter supply notes or delivery terms..."
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-medium text-on-surface outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-outline-variant/30">
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveAdminEdit}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-[#376847] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Save size={15} /> {isSavingEdit ? "Saving..." : "Save Supply Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditSupply(null)}
                className="px-5 py-3 bg-surface-container-low border border-outline-variant/40 text-on-surface-variant rounded-xl font-bold text-xs hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Negotiation Pane */}
      <ContextualNegotiationPane
        isOpen={!!activeNegotiationSupply}
        onClose={() => setActiveNegotiationSupply(null)}
        contextType="FARMER"
        supply={activeNegotiationSupply}
        currentUserRole="admin"
        onNegotiationUpdated={() => loadSupplies()}
      />

      {/* Admin Fresh Deals Discount Modal */}
      {discountSupply && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/60 space-y-5 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#1c1c18]">Delegate Fresh Deal Discount</h3>
                  <p className="text-[10px] text-[#717971] font-semibold">Configure seasonal promotion offer pricing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDiscountSupply(null)}
                className="p-1.5 rounded-xl text-[#717971] hover:bg-[#f0eee7] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 bg-[#f6f3ec]/60 rounded-2xl border border-[#e5e2db] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-[#717971] uppercase tracking-wider">Crop Batch</p>
                <p className="text-xs font-extrabold text-[#1c1c18] mt-0.5">
                  {discountSupply.product_detail?.name || discountSupply.custom_product_name || 'Harvest Supply'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-extrabold text-[#717971] uppercase tracking-wider">Standard Price</p>
                <p className="text-xs font-black text-primary font-mono mt-0.5">{formatCurrency(discountSupply.agreed_price || discountSupply.price)}</p>
              </div>
            </div>

            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setDiscountIsActive(!discountIsActive)}>
                <div>
                  <p className="text-xs font-extrabold text-orange-950">Enable Fresh Deals Discount</p>
                  <p className="text-[10px] text-orange-800 leading-relaxed mt-0.5">
                    Features supply under Seasonal Discounts on client landing page.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={discountIsActive}
                  onChange={(e) => setDiscountIsActive(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded cursor-pointer accent-orange-600"
                />
              </div>

              {discountIsActive && (
                <div className="space-y-3 pt-3 border-t border-orange-200">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-orange-950 uppercase tracking-wider block">
                      Discounted Offer Price (RWF per {discountSupply.unit})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-900">RWF</span>
                      <input
                        type="number"
                        placeholder="e.g. 600"
                        value={discountPriceInput}
                        onChange={(e) => setDiscountPriceInput(e.target.value)}
                        className="w-full pl-12 pr-3 py-2 rounded-xl border border-orange-300 text-sm font-extrabold bg-white text-[#1c1c18] outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {discountPriceInput && parseFloat(discountPriceInput) > 0 && (
                    (() => {
                      const stdPrice = parseFloat(discountSupply.agreed_price || discountSupply.price || discountSupply.base_price || 0);
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
                                  Save <span className="font-extrabold font-mono text-emerald-900">RWF {savedRwf.toLocaleString()}</span> per {discountSupply.unit || 'kg'}
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
                            <span>Discount price should be lower than standard price ({formatCurrency(stdPrice)}) to show savings.</span>
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-[#e5e2db]">
              <button
                type="button"
                onClick={() => setDiscountSupply(null)}
                className="flex-1 py-2.5 bg-[#f0eee7] hover:bg-[#e5e2db] text-[#414942] rounded-xl font-bold transition-all cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDiscountOffer}
                disabled={isSavingDiscount}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-extrabold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs"
              >
                <Tag size={14} />
                <span>{isSavingDiscount ? 'Saving...' : 'Save Discount'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete High-Stakes Warning Modal */}
      {deleteWarningSupply && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-red-200 space-y-5 text-left relative font-sans">
            
            {/* Header with warning badge */}
            <div className="flex items-start gap-4 border-b border-red-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle size={26} />
              </div>
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-200">
                  Permanent Database Deletion Warning
                </span>
                <h3 className="text-lg font-extrabold text-[#1c1c18]">
                  Delete this supply permanently?
                </h3>
                <p className="text-xs font-mono font-bold text-red-700">
                  {deleteWarningSupply.supply_number || `SUP-${String(deleteWarningSupply.id).slice(0, 8).toUpperCase()}`} — {deleteWarningSupply.product_detail?.name || deleteWarningSupply.custom_product_name || 'Harvest Supply'} ({deleteWarningSupply.quantity} {deleteWarningSupply.unit || 'kg'})
                </p>
              </div>
            </div>

            {/* Clear Explanation of Stakes in Short Sentences */}
            <div className="p-4 bg-red-50/80 rounded-2xl border border-red-200/80 space-y-3 text-xs text-red-950">
              <p className="font-extrabold text-sm text-red-900">
                High-Stakes Action Details:
              </p>
              <ul className="space-y-2 list-disc list-inside leading-relaxed text-[#1c1c18]">
                <li><strong className="text-red-800">Irreversible:</strong> This supply record will be permanently deleted from the database and cannot be retrieved.</li>
                <li><strong className="text-red-800">Data Loss:</strong> All historical negotiation logs, batch photos, and sourcing audit trails linked to this harvest will be destroyed.</li>
                <li><strong className="text-emerald-800">Recommended Option:</strong> If you only want to hide this item from active client marketplace catalog stock, select <strong className="text-emerald-800">Archive Instead</strong>.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                disabled={isArchivingInstead || isDeletingPermanently}
                onClick={async () => {
                  try {
                    setIsArchivingInstead(true);
                    await api.supplies.update(deleteWarningSupply.id, { is_archived: true });
                    toast("Supply archived successfully. Historical records preserved.", "success");
                    setDeleteWarningSupply(null);
                    setSelectedSupply(null);
                    loadSupplies();
                  } catch (err: any) {
                    toast(err.message || "Failed to archive supply.", "error");
                  } finally {
                    setIsArchivingInstead(false);
                  }
                }}
                className="flex-1 py-3 px-4 bg-[#144227] hover:bg-[#0f2e1b] text-white rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Archive size={15} />
                <span>{isArchivingInstead ? 'Archiving...' : 'Archive Instead (Recommended)'}</span>
              </button>

              <button
                type="button"
                disabled={isArchivingInstead || isDeletingPermanently}
                onClick={async () => {
                  try {
                    setIsDeletingPermanently(true);
                    await api.supplies.delete(deleteWarningSupply.id);
                    toast("Supply permanently deleted from database.", "success");
                    setDeleteWarningSupply(null);
                    setSelectedSupply(null);
                    loadSupplies();
                  } catch (err: any) {
                    toast(err.message || "Failed to delete supply.", "error");
                  } finally {
                    setIsDeletingPermanently(false);
                  }
                }}
                className="py-3 px-4 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={15} />
                <span>{isDeletingPermanently ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setDeleteWarningSupply(null)}
                className="text-xs font-bold text-[#717971] hover:text-[#1c1c18] transition-colors cursor-pointer"
              >
                Cancel Action
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Admin Visibility & Access Controls Modal */}
      {visibilitySupply && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/60 space-y-5 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#1c1c18]">Visibility & Client Access</h3>
                  <p className="text-[10px] text-[#717971] font-semibold">Set marketplace visibility and anonymity controls</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVisibilitySupply(null)}
                className="p-1.5 rounded-xl text-[#717971] hover:bg-[#f0eee7] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 bg-[#f6f3ec]/60 rounded-2xl border border-[#e5e2db] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-[#717971] uppercase tracking-wider">Crop Batch</p>
                <p className="text-xs font-extrabold text-[#1c1c18] mt-0.5">
                  {visibilitySupply.product_detail?.name || visibilitySupply.custom_product_name || 'Harvest Supply'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-extrabold text-[#717971] uppercase tracking-wider">Batch Number</p>
                <p className="text-xs font-bold text-primary font-mono mt-0.5">{visibilitySupply.supply_number || `SUP-${String(visibilitySupply.id).slice(0, 6).toUpperCase()}`}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-[#1c1c18] uppercase tracking-wider block">
                  Marketplace Visibility Scope
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'HARVEST_HILL_ONLY', label: 'Harvest Hill Delivery Only', desc: 'Restricted internally to Harvest Hill Delivery administration', icon: Lock },
                    { id: 'SPECIFIC_CLIENTS', label: 'Specific Chosen Clients', desc: 'Exclusive access to designated wholesale client accounts', icon: Users },
                    { id: 'REGISTERED_CLIENTS', label: 'All Registered Clients', desc: 'Visible to all authenticated client buyer accounts', icon: UserCheck },
                    { id: 'PUBLIC', label: 'Public Marketplace', desc: 'Accessible to all visitors, including guests and registered clients', icon: Globe },
                  ].map((item) => {
                    const isSelected = visibilityScopeInput === item.id || (
                      item.id === 'HARVEST_HILL_ONLY' && visibilityScopeInput === 'private_admin'
                    ) || (
                      item.id === 'SPECIFIC_CLIENTS' && visibilityScopeInput === 'specific_clients'
                    ) || (
                      item.id === 'REGISTERED_CLIENTS' && visibilityScopeInput === 'all_clients'
                    ) || (
                      item.id === 'PUBLIC' && visibilityScopeInput === 'public'
                    );
                    const IconComp = item.icon;
                    return (
                      <label
                        key={item.id}
                        onClick={() => setVisibilityScopeInput(item.id)}
                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#144227]/5 border-[#144227] shadow-xs'
                            : 'bg-white border-[#e5e2db] hover:bg-[#f6f3ec]/40'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected ? 'bg-[#144227] text-white' : 'bg-[#f0eee7] text-[#717971]'
                        }`}>
                          <IconComp size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-extrabold ${isSelected ? 'text-[#144227]' : 'text-[#1c1c18]'}`}>
                              {item.label}
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-[#144227]"></span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#717971] leading-relaxed mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Specific Chosen Clients Selection Control */}
              {(visibilityScopeInput === 'SPECIFIC_CLIENTS' || visibilityScopeInput === 'specific_clients') && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 font-sans animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-extrabold text-amber-950 uppercase tracking-wider block">
                      Choose clients who can access this harvest
                    </label>
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {selectedClients.length} Selected
                    </span>
                  </div>

                  {/* Client Search Input */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search username or email..."
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-amber-300 bg-white text-xs font-medium text-[#1c1c18] outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {clientSearchQuery && (
                      <button 
                        type="button"
                        onClick={() => setClientSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-800 hover:text-amber-950 text-xs font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Matching Search Results Dropdown */}
                  {clientSearchQuery.trim().length > 0 && (
                    <div className="max-h-36 overflow-y-auto custom-scrollbar bg-white rounded-xl border border-amber-200 divide-y divide-amber-100 shadow-xs">
                      {availableClients
                        .filter(c => {
                          const q = clientSearchQuery.toLowerCase();
                          const email = (c.email || '').toLowerCase();
                          const uname = (c.username || '').toLowerCase();
                          const bname = (c.client_profile?.business_name || c.business_name || '').toLowerCase();
                          return email.includes(q) || uname.includes(q) || bname.includes(q);
                        })
                        .map(c => {
                          const cid = c.client_profile?.id || c.id;
                          const isAlreadySelected = selectedClients.some(sc => (sc.id || sc.user_id) === cid || sc.email === c.email);
                          const displayName = c.client_profile?.business_name || c.username || c.email;

                          return (
                            <div 
                              key={c.id} 
                              onClick={() => {
                                if (!isAlreadySelected) {
                                  setSelectedClients(prev => [...prev, {
                                    id: cid,
                                    email: c.email,
                                    username: c.username,
                                    name: displayName
                                  }]);
                                  setClientSearchQuery('');
                                }
                              }}
                              className={`p-2 px-3 text-xs flex items-center justify-between transition-colors ${
                                isAlreadySelected ? 'bg-amber-50 opacity-60 cursor-not-allowed' : 'hover:bg-amber-100/60 cursor-pointer'
                              }`}
                            >
                              <div>
                                <p className="font-extrabold text-amber-950">{displayName}</p>
                                <p className="text-[10px] text-amber-800 font-mono">{c.email}</p>
                              </div>
                              <button 
                                type="button"
                                disabled={isAlreadySelected}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isAlreadySelected ? 'bg-amber-200 text-amber-800' : 'bg-primary text-white hover:opacity-90'
                                }`}
                              >
                                {isAlreadySelected ? 'Added' : '+ Add'}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Selected Clients Tags / Removable Chips */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-bold text-amber-900 uppercase tracking-wider block">Selected clients:</span>
                    {selectedClients.length === 0 ? (
                      <p className="text-[11px] text-amber-800 italic">No clients selected yet. Search above to add wholesale clients.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedClients.map((c, idx) => (
                          <span 
                            key={c.id || idx} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-950 shadow-2xs"
                          >
                            <span>{c.email || c.username || c.name}</span>
                            <button 
                              type="button"
                              onClick={() => setSelectedClients(prev => prev.filter((_, i) => i !== idx))}
                              className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 flex items-center justify-center text-[10px] font-black cursor-pointer transition-colors"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-4 bg-white border border-[#e5e2db] rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setDiscloseFarmerNameInput(!discloseFarmerNameInput)}>
                  <div className="pr-4">
                    <p className="text-xs font-extrabold text-[#1c1c18]">Disclose Farm Name to Buyers</p>
                    <p className="text-[10px] text-[#717971] leading-relaxed mt-0.5">
                      When off, supplier displays anonymously as <strong className="text-[#144227]">"Harvest Hill Delivery"</strong>.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={discloseFarmerNameInput}
                    onChange={(e) => setDiscloseFarmerNameInput(e.target.checked)}
                    className="w-4 h-4 rounded border-[#c1c9c0] text-[#144227] focus:ring-[#144227] cursor-pointer accent-[#144227]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-[#e5e2db]">
              <button
                type="button"
                onClick={() => setVisibilitySupply(null)}
                className="flex-1 py-2.5 bg-[#f0eee7] hover:bg-[#e5e2db] text-[#414942] rounded-xl font-bold transition-all cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVisibilityControls}
                disabled={isSavingVisibility}
                className="flex-1 py-2.5 bg-[#144227] hover:bg-[#376847] text-white rounded-xl font-extrabold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs"
              >
                <Save size={14} />
                <span>{isSavingVisibility ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Master Product Listing Modal */}
      {approveChoiceSupply && approvalMode === 'direct' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/50 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-primary">Direct Master Product Listing</h3>
                  <p className="text-xs text-on-surface-variant font-medium">Publish harvest submission directly into Master Product inventory</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setApproveChoiceSupply(null);
                  setApprovalMode(null);
                }}
                className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Crop / Product Name *</label>
                <input
                  type="text"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant font-bold text-xs focus:border-primary outline-none"
                  placeholder="e.g. Red Gala Apples"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Category</label>
                  <select
                    value={directCategory}
                    onChange={(e) => setDirectCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant font-bold text-xs focus:border-primary outline-none bg-white"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Herbs">Herbs</option>
                    <option value="Grains">Grains</option>
                    <option value="Animal-Based">Animal-Based</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Unit</label>
                  <input
                    type="text"
                    value={directUnit}
                    onChange={(e) => setDirectUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant font-bold text-xs focus:border-primary outline-none"
                    placeholder="e.g. kg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Selling / Offered Price (RWF/{directUnit}) *</label>
                  <input
                    type="number"
                    value={directPrice}
                    onChange={(e) => setDirectPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant font-black text-xs text-primary focus:border-primary outline-none"
                    placeholder="e.g. 1200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Available Quantity ({directUnit}) *</label>
                  <input
                    type="number"
                    value={directQuantity}
                    onChange={(e) => setDirectQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant font-bold text-xs focus:border-primary outline-none"
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Master Harvest Images</label>
                  <span className="text-[9.5px] text-on-surface-variant">Farmer images pre-loaded. Click ✕ to remove.</span>
                </div>

                <div className="flex flex-wrap gap-2 items-center pt-1">
                  {directImages.map((img) => (
                    <div key={img.id} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-outline-variant/80 bg-surface-container-low shadow-2xs">
                      <img src={img.url} alt="Harvest thumbnail" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveDirectImage(img.id)}
                        className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow hover:bg-red-700 transition-colors cursor-pointer"
                        title="Delete image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <label className="w-14 h-14 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary flex flex-col items-center justify-center cursor-pointer text-on-surface-variant hover:text-primary transition-all bg-surface-container-lowest hover:bg-surface-container-low">
                    <Plus size={16} />
                    <span className="text-[8px] font-bold uppercase mt-0.5">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAddDirectImages(e.target.files)}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Harvest Notes & Specs</label>
                <textarea
                  rows={2}
                  value={directNotes}
                  onChange={(e) => setDirectNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant text-xs font-medium focus:border-primary outline-none resize-none"
                  placeholder="Freshly harvested Grade A produce details..."
                />
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/40 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setApproveChoiceSupply(null);
                  setApprovalMode(null);
                }}
                className="py-2.5 px-4 border border-outline-variant text-on-surface-variant rounded-xl font-bold text-xs hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDirectHarvest}
                disabled={isSubmittingApproval}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <span>{isSubmittingApproval ? 'Publishing...' : 'Publish Master Product'}</span>
                <CheckCircle2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Requirement Template Modal (Option B) */}
      {approveChoiceSupply && approvalMode === 'requirement' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/50 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-primary">Create Product Requirement Template</h3>
                  <p className="text-xs text-on-surface-variant font-medium">Create a public requirement template for farmers to view & submit harvests</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setApproveChoiceSupply(null);
                  setApprovalMode(null);
                }}
                className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Product Name *</label>
                <input
                  type="text"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant font-bold text-xs focus:border-primary outline-none"
                  placeholder="e.g. Red Gala Apples"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Category</label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant font-bold text-xs focus:border-primary outline-none bg-white"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Herbs">Herbs</option>
                    <option value="Grains">Grains</option>
                    <option value="Animal-Based">Animal-Based</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Unit</label>
                  <input
                    type="text"
                    value={reqUnit}
                    onChange={(e) => setReqUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant font-bold text-xs focus:border-primary outline-none"
                    placeholder="e.g. kg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Offered Price (RWF/{reqUnit}) *</label>
                  <input
                    type="number"
                    value={reqOfferedPrice}
                    onChange={(e) => setReqOfferedPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant font-black text-xs text-primary focus:border-primary outline-none"
                    placeholder="e.g. 1200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Quantity Needed ({reqUnit}) *</label>
                  <input
                    type="number"
                    value={reqQuantityNeeded}
                    onChange={(e) => setReqQuantityNeeded(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant font-bold text-xs focus:border-primary outline-none"
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Submission Deadline</label>
                  <input
                    type="date"
                    value={reqDeadline}
                    onChange={(e) => setReqDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant font-bold text-xs focus:border-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Harvest Period</label>
                  <input
                    type="text"
                    value={reqHarvestPeriod}
                    onChange={(e) => setReqHarvestPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant font-bold text-xs focus:border-primary outline-none"
                    placeholder="e.g. Late September"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Quality Requirements & Specs</label>
                <textarea
                  rows={2}
                  value={reqQualityRequirements}
                  onChange={(e) => setReqQualityRequirements(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant text-xs font-medium focus:border-primary outline-none resize-none"
                  placeholder="Grade A inspection specs, cold storage handling..."
                />
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/40 flex gap-2">
              <button
                type="button"
                onClick={() => setApprovalMode('choice')}
                className="py-2.5 px-4 border border-outline-variant text-on-surface-variant rounded-xl font-bold text-xs hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveRequirementTemplate}
                disabled={isSubmittingApproval}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <span>{isSubmittingApproval ? 'Creating Template...' : 'Create Requirement Template'}</span>
                <CheckCircle2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
