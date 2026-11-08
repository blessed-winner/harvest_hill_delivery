"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUp, ArrowDown, Eye, EyeOff, Save, RotateCcw, 
  Grid, Layout, CheckCircle2, Plus, Trash2, Edit3,
  Sparkles, Layers, Image as ImageIcon, UploadCloud,
  X, ArrowRight, ExternalLink, Link as LinkIcon, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api as adminApi } from '../lib/api';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { MediaAssetItem } from './MediaLibrary';
import { useAlert } from '../../../context/AlertContext';

export interface HomepageSectionConfig {
  id: string;
  title: string;
  category: string;
  itemsPerPage: number;
  rows: number;
  cols: number;
  order: number;
  enabled: boolean;
}

export interface HomepageFeatureCard {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  link: string;
  image: string;
  order: number;
  is_active: boolean;
}

export const DEFAULT_HOMEPAGE_CONFIG: HomepageSectionConfig[] = [
  {
    id: 'featured',
    title: 'Popular now',
    category: 'Popular',
    itemsPerPage: 8,
    rows: 2,
    cols: 4,
    order: 1,
    enabled: true,
  },
  {
    id: 'deals',
    title: 'Fresh Discounts',
    category: 'Deals',
    itemsPerPage: 8,
    rows: 2,
    cols: 4,
    order: 2,
    enabled: true,
  },
  {
    id: 'vegetables_herbs',
    title: 'Fresh Vegetables & Herbs',
    category: 'Vegetables & Herbs',
    itemsPerPage: 12,
    rows: 3,
    cols: 4,
    order: 3,
    enabled: true,
  },
  {
    id: 'fruits',
    title: 'Seasonal Fruits',
    category: 'Fruits',
    itemsPerPage: 8,
    rows: 2,
    cols: 4,
    order: 4,
    enabled: true,
  },
  {
    id: 'dairy',
    title: 'Farm Dairy & Eggs',
    category: 'Dairy',
    itemsPerPage: 8,
    rows: 2,
    cols: 4,
    order: 5,
    enabled: true,
  },
  {
    id: 'grains',
    title: 'Grains & Organic Staples',
    category: 'Grains',
    itemsPerPage: 8,
    rows: 2,
    cols: 4,
    order: 6,
    enabled: true,
  },
];

export const DEFAULT_HOMEPAGE_FEATURE_CARDS: HomepageFeatureCard[] = [
  {
    id: 'card-peak-season',
    title: "Peak Season",
    description: "This week's best",
    eyebrow: "IN HARVEST",
    link: "Vegetables",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80",
    order: 1,
    is_active: true,
  },
  {
    id: 'card-new-season',
    title: "New This Season",
    description: "Just arrived",
    eyebrow: "FRESH ARRIVAL",
    link: "Fruits",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&auto=format&fit=crop&q=80",
    order: 2,
    is_active: true,
  },
  {
    id: 'card-flash-deals',
    title: "Flash Deals",
    description: "Limited time",
    eyebrow: "UP TO 35% OFF",
    link: "Deals",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80",
    order: 3,
    is_active: true,
  },
  {
    id: 'card-fresh-vegetables',
    title: "Fresh Vegetables",
    description: "Wholesale harvest",
    eyebrow: "CRATE RATES",
    link: "Vegetables",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80",
    order: 4,
    is_active: true,
  },
  {
    id: 'card-ready-to-ship',
    title: "Ready to Ship",
    description: "Fastest delivery",
    eyebrow: "SAME-DAY DISPATCH",
    link: "Seasonal",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=80",
    order: 5,
    is_active: true,
  },
];

export const getFullImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function HomepageCustomizer() {
  const { toast, showConfirm } = useAlert();
  const fileUploadRef = useRef<HTMLInputElement>(null);

  // Active Tab: 'feature_cards' | 'sections'
  const [activeTab, setActiveTab] = useState<'feature_cards' | 'sections'>('feature_cards');

  // Promotional Feature Cards State
  const [featureCards, setFeatureCards] = useState<HomepageFeatureCard[]>(DEFAULT_HOMEPAGE_FEATURE_CARDS);
  const [isCardsDirty, setIsCardsDirty] = useState(false);
  const [isSavingCards, setIsSavingCards] = useState(false);
  const [cardsSavedSuccess, setCardsSavedSuccess] = useState(false);

  // Edit Card Modal State
  const [editingCard, setEditingCard] = useState<HomepageFeatureCard | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Produce Sections State (Existing)
  const [sections, setSections] = useState<HomepageSectionConfig[]>(DEFAULT_HOMEPAGE_CONFIG);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    async function loadConfigs() {
      // 1. Load Produce Sections
      let loadedSections = false;
      try {
        const settings = await adminApi.systemSettings.get();
        if (settings?.homepage_sections_config) {
          const remote = settings.homepage_sections_config;
          const parsed = typeof remote === 'string' ? JSON.parse(remote) : remote;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSections(parsed.sort((a: any, b: any) => a.order - b.order));
            localStorage.setItem('homepage_sections_config', JSON.stringify(parsed));
            loadedSections = true;
          }
        }

        // 2. Load Promotional Feature Cards
        if (settings?.homepage_feature_cards) {
          const remoteCards = settings.homepage_feature_cards;
          const parsedCards = typeof remoteCards === 'string' ? JSON.parse(remoteCards) : remoteCards;
          if (Array.isArray(parsedCards) && parsedCards.length > 0) {
            setFeatureCards(normalizeCards(parsedCards));
            localStorage.setItem('homepage_feature_cards', JSON.stringify(parsedCards));
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote section settings, using local storage:", err);
      }

      if (!loadedSections && typeof window !== 'undefined') {
        const saved = localStorage.getItem('homepage_sections_config');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSections(parsed.sort((a, b) => a.order - b.order));
            }
          } catch {}
        }
      }

      // Check local storage for feature cards if not loaded from settings
      if (typeof window !== 'undefined') {
        const savedCards = localStorage.getItem('homepage_feature_cards');
        if (savedCards) {
          try {
            const parsedCards = JSON.parse(savedCards);
            if (Array.isArray(parsedCards) && parsedCards.length > 0) {
              setFeatureCards(normalizeCards(parsedCards));
            }
          } catch {}
        }
      }

      setIsDirty(false);
      setIsCardsDirty(false);
    }
    loadConfigs();
  }, []);

  const normalizeCards = (raw: any[]): HomepageFeatureCard[] => {
    return raw.map((c, idx) => ({
      id: c.id || `card_${idx + 1}`,
      title: c.title || c.label || `Feature Card ${idx + 1}`,
      eyebrow: c.eyebrow || c.tag || '',
      description: c.description || c.subtext || '',
      link: c.link || c.category || '',
      image: c.image || '',
      order: typeof c.order === 'number' ? c.order : idx + 1,
      is_active: c.is_active !== undefined ? Boolean(c.is_active) : (c.enabled !== undefined ? Boolean(c.enabled) : true),
    })).sort((a, b) => a.order - b.order);
  };

  // --------------------------------------------------------------------------
  // Promotional Feature Cards Handlers
  // --------------------------------------------------------------------------
  const handleSaveFeatureCards = async () => {
    if (isSavingCards) return;
    setIsSavingCards(true);

    const reordered = featureCards.map((c, idx) => ({ ...c, order: idx + 1 }));
    setFeatureCards(reordered);

    if (typeof window !== 'undefined') {
      localStorage.setItem('homepage_feature_cards', JSON.stringify(reordered));
      window.dispatchEvent(new Event('homepage_config_updated'));
    }

    try {
      if ((adminApi as any).homepageFeatureCards?.update) {
        await (adminApi as any).homepageFeatureCards.update(reordered);
      } else {
        await adminApi.systemSettings.update({ homepage_feature_cards: reordered });
      }
      setIsCardsDirty(false);
      setCardsSavedSuccess(true);
      toast("Promotional cards saved and live on homepage!", "success");
      setTimeout(() => setCardsSavedSuccess(false), 3500);
    } catch (err: any) {
      console.error("Failed to save feature cards:", err);
      toast(err.message || "Failed to save promotional feature cards to backend.", "error");
    } finally {
      setIsSavingCards(false);
    }
  };

  const handleResetCardsDefault = async () => {
    const confirmed = await showConfirm(
      "Reset Promotional Cards?",
      "Are you sure you want to restore the 5 default promotional cards (Peak Season, New Arrivals, Flash Deals, etc.)? Any custom cards will be replaced.",
      { confirmText: "Reset Defaults", isDanger: true }
    );
    if (!confirmed) return;

    setFeatureCards(DEFAULT_HOMEPAGE_FEATURE_CARDS);
    setIsCardsDirty(true);
    toast("Default promotional cards loaded. Click 'Save Cards' to publish them live.", "info");
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= featureCards.length) return;

    const updated = [...featureCards];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((c, idx) => ({ ...c, order: idx + 1 }));
    setFeatureCards(reordered);
    setIsCardsDirty(true);
  };

  const toggleCardVisibility = (index: number) => {
    const updated = [...featureCards];
    updated[index] = { ...updated[index], is_active: !updated[index].is_active };
    setFeatureCards(updated);
    setIsCardsDirty(true);
  };

  const openEditModal = (card: HomepageFeatureCard, index: number) => {
    setEditingCard({ ...card });
    setEditingIndex(index);
  };

  const openNewCardModal = () => {
    const newCard: HomepageFeatureCard = {
      id: `card_${Date.now()}`,
      title: 'Special Harvest Promotion',
      eyebrow: 'SPECIAL OFFER',
      description: 'Limited seasonal batch',
      link: 'Vegetables',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80',
      order: featureCards.length + 1,
      is_active: true,
    };
    setEditingCard(newCard);
    setEditingIndex(-1); // -1 indicates brand new card
  };

  const handleDeleteCard = async (index: number) => {
    const card = featureCards[index];
    const confirmed = await showConfirm(
      "Remove Promotional Card?",
      `Are you sure you want to remove the card "${card.title}"? You can also hide it using the visibility toggle instead of deleting it.`,
      { confirmText: "Delete Card", isDanger: true }
    );
    if (!confirmed) return;

    const filtered = featureCards.filter((_, idx) => idx !== index);
    const reordered = filtered.map((c, idx) => ({ ...c, order: idx + 1 }));
    setFeatureCards(reordered);
    setIsCardsDirty(true);
    toast("Card removed. Click 'Save Cards' to persist changes.", "info");
  };

  const handleApplyCardModal = () => {
    if (!editingCard) return;

    if (!editingCard.title.trim()) {
      toast("Please provide a title for the promotional card.", "error");
      return;
    }
    if (!editingCard.image.trim()) {
      toast("Please choose or upload an image for the card.", "error");
      return;
    }

    if (editingIndex === -1) {
      // Adding new card
      const updated = [...featureCards, { ...editingCard, order: featureCards.length + 1 }];
      setFeatureCards(updated);
    } else if (editingIndex !== null) {
      // Updating existing card
      const updated = [...featureCards];
      updated[editingIndex] = { ...editingCard };
      setFeatureCards(updated);
    }

    setIsCardsDirty(true);
    setEditingCard(null);
    setEditingIndex(null);
    toast("Card updated in workspace. Remember to click 'Save Cards' to publish.", "success");
  };

  // Quick upload handler for Card Modal
  const handleDirectUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingCard) return;
    const file = e.target.files[0];
    const MAX_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast(`Image "${file.name}" exceeds the 3 MB size limit.`, "error");
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('files', file);

    try {
      setIsUploadingImage(true);
      const res = await adminApi.media.upload(formData);
      const assets: MediaAssetItem[] = res.assets || [];
      if (assets.length > 0) {
        const uploaded = assets[0];
        setEditingCard(prev => prev ? { ...prev, image: uploaded.url || uploaded.file || uploaded.file_path } : prev);
        toast("Image uploaded to Media Library and linked to card!", "success");
      }
    } catch (err: any) {
      console.error("Direct upload failed:", err);
      toast(err.message || "Failed to upload image.", "error");
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  // --------------------------------------------------------------------------
  // Produce Product Sections Handlers (Existing)
  // --------------------------------------------------------------------------
  const handleSaveConfig = async () => {
    if (!isDirty || isSaving) return;

    setIsSaving(true);
    const reordered = sections.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    setSections(reordered);
    if (typeof window !== 'undefined') {
      localStorage.setItem('homepage_sections_config', JSON.stringify(reordered));
      window.dispatchEvent(new Event('homepage_config_updated'));
    }

    try {
      await adminApi.systemSettings.update({ homepage_sections_config: reordered });
      setIsDirty(false);
      setSavedSuccess(true);
      toast("Product sections saved and live on homepage!", "success");
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save homepage settings to backend:", err);
      toast("Failed to save sections to backend.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = async () => {
    const confirmed = await showConfirm(
      "Reset Product Sections?",
      "Restore default produce catalog sections? This will reset custom ordering and counts.",
      { confirmText: "Reset Defaults", isDanger: true }
    );
    if (!confirmed) return;

    setIsSaving(true);
    setSections(DEFAULT_HOMEPAGE_CONFIG);
    if (typeof window !== 'undefined') {
      localStorage.setItem('homepage_sections_config', JSON.stringify(DEFAULT_HOMEPAGE_CONFIG));
      window.dispatchEvent(new Event('homepage_config_updated'));
    }

    try {
      await adminApi.systemSettings.update({ homepage_sections_config: DEFAULT_HOMEPAGE_CONFIG });
      setIsDirty(false);
      setSavedSuccess(true);
      toast("Default sections restored.", "success");
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to reset homepage settings on backend:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = () => {
    const newId = `section_${Date.now()}`;
    const newSection: HomepageSectionConfig = {
      id: newId,
      title: `New Produce Section ${sections.length + 1}`,
      category: 'Vegetables & Herbs',
      itemsPerPage: 8,
      rows: 2,
      cols: 4,
      order: sections.length + 1,
      enabled: true,
    };
    const updated = [...sections, newSection];
    setSections(updated);
    setIsDirty(true);
  };

  const handleDeleteSection = async (index: number) => {
    const confirmed = await showConfirm(
      "Delete Section?",
      `Are you sure you want to delete section #${index + 1}?`,
      { confirmText: "Delete Section", isDanger: true }
    );
    if (!confirmed) return;

    const updated = sections.filter((_, idx) => idx !== index);
    const reordered = updated.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    setSections(reordered);
    setIsDirty(true);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    const reordered = newSections.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    setSections(reordered);
    setIsDirty(true);
  };

  const updateSection = (index: number, field: keyof HomepageSectionConfig, value: any) => {
    const newSections = [...sections];
    const current = { ...newSections[index], [field]: value };
    
    if (field === 'itemsPerPage') {
      const num = Number(value);
      current.itemsPerPage = num;
      current.rows = Math.ceil(num / (current.cols || 4));
    }
    
    newSections[index] = current;
    setSections(newSections);
    setIsDirty(true);
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 font-sans text-on-surface">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-outline-variant/40 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Layout size={16} />
            <span>Homepage Section Manager</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">Manage Sections</h1>
          <p className="text-xs text-on-surface-variant mt-1 font-medium">
            Customize homepage promotional feature cards, produce section display order, capacities, and category mappings.
          </p>
        </div>

        {/* Tab Switcher Segmented Control */}
        <div className="flex items-center bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('feature_cards')}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'feature_cards'
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Sparkles size={14} className={activeTab === 'feature_cards' ? "text-[#2D5A3D]" : ""} />
            <span>Promo Feature Cards</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-800 font-mono border border-emerald-200">
              {featureCards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'sections'
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Grid size={14} className={activeTab === 'sections' ? "text-[#2D5A3D]" : ""} />
            <span>Product Sections</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono border border-slate-200">
              {sections.length}
            </span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PROMOTIONAL FEATURE CARDS                                      */}
      {/* ==================================================================== */}
      {activeTab === 'feature_cards' && (
        <div className="space-y-6">
          {/* Action Toolbar for Cards */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-outline-variant/40 shadow-sm">
            <div>
              <h2 className="text-base font-extrabold text-[#1C2A1E] flex items-center gap-2">
                <Sparkles size={16} className="text-[#2D5A3D]" />
                <span>Promotional Feature Cards (Banner Tiles)</span>
              </h2>
              <p className="text-xs text-[#717971] mt-0.5">
                Manage the horizontal promotional quick-links displayed beneath the main hero banner.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={openNewCardModal}
                className="px-3.5 py-2 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} />
                <span>Add Card</span>
              </button>

              <button
                type="button"
                onClick={handleResetCardsDefault}
                className="px-3.5 py-2 border border-outline-variant text-on-surface-variant hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                disabled={!isCardsDirty || isSavingCards}
                onClick={handleSaveFeatureCards}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-2",
                  isCardsDirty && !isSavingCards
                    ? "bg-[#2D5A3D] text-white hover:bg-[#1E3E2A] cursor-pointer"
                    : "bg-surface-container-high text-on-surface-variant/40 border border-outline-variant/30 cursor-not-allowed opacity-60"
                )}
              >
                <Save size={14} />
                <span>{isSavingCards ? "Saving..." : "Save Cards"}</span>
              </button>
            </div>
          </div>

          {/* Success Toast Banner */}
          {cardsSavedSuccess && (
            <div className="bg-[#bceec8] text-[#00210f] border border-[#9ed0ab] p-4 rounded-xl flex items-center justify-between font-medium text-xs shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#144227]" />
                <span>Promotional feature cards saved! Changes are live on the homepage.</span>
              </div>
            </div>
          )}

          {/* Real-time Live Homepage Preview Box */}
          <div className="bg-[#FAF7F0] border border-[#E8E4DA] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2D5A3D] animate-pulse" />
                <h3 className="text-xs font-extrabold text-[#1C2A1E] uppercase tracking-wider">
                  Live Homepage Preview (Customer View)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#717971]">
                {featureCards.filter(c => c.is_active).length} of {featureCards.length} cards visible
              </span>
            </div>

            {/* Exactly replicates the Landing page horizontal promotional grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
              {featureCards
                .filter(c => c.is_active)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((card, idx) => (
                  <div
                    key={card.id || idx}
                    className="bg-white border border-[#E8E4DA] rounded-[12px] p-2.5 flex items-center gap-3 shadow-xs transition-all group overflow-hidden"
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-[#E8E4DA] bg-[#FAF7F0] relative">
                      <img 
                        src={getFullImageUrl(card.image)} 
                        alt={card.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-extrabold text-[#2D5A3D] uppercase tracking-wider block leading-none mb-0.5 truncate">
                        {card.eyebrow || "FEATURE"}
                      </span>
                      <h4 className="text-xs font-bold text-[#1C2A1E] truncate leading-tight">
                        {card.title}
                      </h4>
                      <p className="text-[10px] text-[#717971] truncate leading-tight mt-0.5 font-medium">
                        {card.description}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
            {featureCards.filter(c => c.is_active).length === 0 && (
              <div className="text-center py-6 text-xs text-[#717971] italic">
                All promotional cards are currently hidden. At least one active card is recommended.
              </div>
            )}
          </div>

          {/* Cards List for Editing & Reordering */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#717971]">
                Configured Promotional Cards ({featureCards.length})
              </span>
              <span className="text-[11px] text-[#717971]">
                Drag or use arrows to change ordering
              </span>
            </div>

            {featureCards.map((card, idx) => (
              <div
                key={card.id || idx}
                className={cn(
                  "bg-white rounded-2xl border p-4 transition-all shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
                  card.is_active 
                    ? "border-outline-variant/60 hover:border-[#2D5A3D]/40" 
                    : "border-outline-variant/30 opacity-60 bg-surface-container-low/30"
                )}
              >
                {/* Left: Reordering Arrows + Card Number */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col gap-0.5 items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/40">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveCard(idx, 'up')}
                      className="p-1 hover:bg-white rounded-md transition-colors text-on-surface disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Left/Earlier"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <span className="font-mono text-[11px] font-extrabold text-[#2D5A3D] px-1">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      disabled={idx === featureCards.length - 1}
                      onClick={() => moveCard(idx, 'down')}
                      className="p-1 hover:bg-white rounded-md transition-colors text-on-surface disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Right/Later"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  {/* Thumbnail Image */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#E8E4DA] bg-[#FAF7F0] group shadow-xs">
                    <img 
                      src={getFullImageUrl(card.image)} 
                      alt={card.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => openEditModal(card, idx)}
                      className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Change Image"
                    >
                      <ImageIcon size={15} />
                    </button>
                  </div>

                  {/* Eyebrow, Title, Description */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#2D5A3D]/10 text-[#2D5A3D] font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded tracking-wide">
                        {card.eyebrow || "FEATURE TAG"}
                      </span>
                      <span className="text-[11px] font-semibold text-[#717971] flex items-center gap-1">
                        <LinkIcon size={11} className="text-[#717971]" />
                        <span>Target: <strong className="text-[#1C2A1E]">{card.link || "Catalog"}</strong></span>
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#1C2A1E] truncate mt-0.5">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#717971] truncate font-medium">
                      {card.description}
                    </p>
                  </div>
                </div>

                {/* Right: Status Pill & Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  {/* Visibility Badge & Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleCardVisibility(idx)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border",
                      card.is_active
                        ? "bg-[#2D5A3D] text-white border-[#2D5A3D]"
                        : "bg-surface-container-high text-on-surface-variant border-outline-variant"
                    )}
                  >
                    {card.is_active ? (
                      <>
                        <Eye size={13} />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={13} />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>

                  {/* Edit Card Button */}
                  <button
                    type="button"
                    onClick={() => openEditModal(card, idx)}
                    className="px-3 py-1.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 rounded-xl text-xs font-bold text-[#1C2A1E] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 size={13} className="text-[#2D5A3D]" />
                    <span>Edit Card</span>
                  </button>

                  {/* Delete Card Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteCard(idx)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                    title="Remove Card"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PRODUCE PRODUCT SECTIONS (EXISTING FUNCTIONALITY)              */}
      {/* ==================================================================== */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          {/* Action Toolbar for Sections */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-outline-variant/40 shadow-sm">
            <div>
              <h2 className="text-base font-extrabold text-[#1C2A1E] flex items-center gap-2">
                <Grid size={16} className="text-[#2D5A3D]" />
                <span>Product Catalog Produce Sections</span>
              </h2>
              <p className="text-xs text-[#717971] mt-0.5">
                Customize produce catalog grid sections, row counts, and category targets.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleAddSection}
                className="px-3.5 py-2 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} />
                <span>Add Section</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefault}
                className="px-3.5 py-2 border border-outline-variant text-on-surface-variant hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>Reset Defaults</span>
              </button>
              
              <button
                type="button"
                disabled={!isDirty || isSaving}
                onClick={handleSaveConfig}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-2",
                  isDirty && !isSaving
                    ? "bg-[#2D5A3D] text-white hover:bg-[#1E3E2A] cursor-pointer"
                    : "bg-surface-container-high text-on-surface-variant/40 border border-outline-variant/30 cursor-not-allowed opacity-60"
                )}
              >
                <Save size={14} />
                <span>{isSaving ? "Saving..." : "Save Sections"}</span>
              </button>
            </div>
          </div>

          {/* Success Toast Banner */}
          {savedSuccess && (
            <div className="bg-[#bceec8] text-[#00210f] border border-[#9ed0ab] p-4 rounded-xl flex items-center justify-between font-medium text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#144227]" />
                <span>Homepage layout settings saved! Changes are live on the website.</span>
              </div>
            </div>
          )}

          {/* Sections Configurator List */}
          <div className="space-y-4">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className={cn(
                  "bg-white rounded-2xl border p-5 transition-all shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5",
                  section.enabled ? "border-outline-variant/60" : "border-outline-variant/30 opacity-60 bg-surface-container-low/30"
                )}
              >
                {/* Left Order Controls & Info */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col gap-1 items-center bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/40">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className="p-1 hover:bg-white rounded-lg transition-colors text-on-surface disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Up"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <span className="font-mono text-xs font-extrabold text-primary px-1">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className="p-1 hover:bg-white rounded-lg transition-colors text-on-surface disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Down"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded">
                        Section {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-on-surface-variant font-mono">
                        Target: {section.category}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(idx, 'title', e.target.value)}
                      className="mt-1 font-bold text-sm sm:text-base text-on-surface bg-surface-container-low border border-outline-variant/40 px-3 py-1.5 rounded-lg focus:bg-white focus:border-primary outline-none min-w-[240px] sm:min-w-[320px]"
                    />
                  </div>
                </div>

                {/* Middle Configuration Settings */}
                <div className="grid grid-cols-2 gap-3 flex-1 max-w-md">
                  {/* Category Target */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Category</label>
                    <select
                      value={section.category}
                      onChange={(e) => updateSection(idx, 'category', e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/40 px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="Popular">Popular (Featured)</option>
                      <option value="Deals">Fresh Deals</option>
                      <option value="Vegetables & Herbs">Vegetables & Herbs</option>
                      <option value="Fruits">Fruits</option>
                      <option value="Herbs">Herbs</option>
                      <option value="Dairy">Dairy & Eggs</option>
                      <option value="Grains">Grains & Organic Staples</option>
                      <option value="Animal-Based">Animal-Based / Meat</option>
                      <option value="All">All Products</option>
                    </select>
                  </div>

                  {/* Products Count */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Products Displayed</label>
                    <select
                      value={section.itemsPerPage}
                      onChange={(e) => updateSection(idx, 'itemsPerPage', Number(e.target.value))}
                      className="w-full bg-surface-container-low border border-outline-variant/40 px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value={4}>4 products</option>
                      <option value={8}>8 products</option>
                      <option value={12}>12 products</option>
                      <option value={16}>16 products</option>
                      <option value={20}>20 products</option>
                    </select>
                  </div>
                </div>

                {/* Right Enable/Disable & Delete Toggles */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => updateSection(idx, 'enabled', !section.enabled)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border",
                      section.enabled
                        ? "bg-[#2D5A3D] text-white border-[#2D5A3D]"
                        : "bg-surface-container-high text-on-surface-variant border-outline-variant"
                    )}
                  >
                    {section.enabled ? (
                      <>
                        <Eye size={14} />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSection(idx)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                    title="Remove Section"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDIT / ADD PROMOTIONAL FEATURE CARD                            */}
      {/* ==================================================================== */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-surface-container-lowest">
              <div>
                <h3 className="text-base font-extrabold text-[#1C2A1E] flex items-center gap-2">
                  <Sparkles size={16} className="text-[#2D5A3D]" />
                  <span>{editingIndex === -1 ? "Add Promotional Card" : `Edit Card: ${editingCard.title}`}</span>
                </h3>
                <p className="text-xs text-[#717971] mt-0.5">
                  Update text, destination, image, and homepage visibility.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setEditingCard(null); setEditingIndex(null); }}
                className="p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Live Preview Card */}
              <div className="bg-[#FAF7F0] border border-[#E8E4DA] rounded-2xl p-4 shadow-xs space-y-2">
                <span className="text-[10px] font-extrabold text-[#2D5A3D] uppercase tracking-wider block">
                  Preview on Homepage
                </span>
                <div className="bg-white border border-[#E8E4DA] rounded-[12px] p-2.5 flex items-center gap-3 shadow-xs">
                  <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-[#E8E4DA] bg-[#FAF7F0]">
                    {editingCard.image ? (
                      <img 
                        src={getFullImageUrl(editingCard.image)} 
                        alt={editingCard.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#717971]">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[8px] font-extrabold text-[#2D5A3D] uppercase tracking-wider block leading-none mb-0.5 truncate">
                      {editingCard.eyebrow || "UPPERCASE INTRO"}
                    </span>
                    <h4 className="text-xs font-bold text-[#1C2A1E] truncate leading-tight">
                      {editingCard.title || "Promotional Title"}
                    </h4>
                    <p className="text-[10px] text-[#717971] truncate leading-tight mt-0.5 font-medium">
                      {editingCard.description || "Supporting short description"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Selection Section */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase text-[#1C2A1E] tracking-wider block">
                  Card Thumbnail Image
                </label>
                <div className="flex items-center gap-4 bg-surface-container-low/50 p-3 rounded-2xl border border-outline-variant/30">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#E8E4DA] bg-white relative">
                    {editingCard.image ? (
                      <img 
                        src={getFullImageUrl(editingCard.image)} 
                        alt="Current preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#717971]">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Choose from Media Library */}
                      <button
                        type="button"
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="px-3 py-1.5 bg-[#2D5A3D] text-white hover:bg-[#1E3E2A] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <ImageIcon size={13} />
                        <span>Media Library</span>
                      </button>

                      {/* Quick Upload directly to Media Library */}
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => fileUploadRef.current?.click()}
                        className="px-3 py-1.5 border border-outline-variant bg-white hover:bg-surface-container rounded-xl text-xs font-bold text-[#1C2A1E] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <UploadCloud size={13} />
                        <span>{isUploadingImage ? "Uploading..." : "Upload New"}</span>
                      </button>
                      <input 
                        ref={fileUploadRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleDirectUploadImage} 
                      />
                    </div>
                    <p className="text-[11px] text-[#717971]">
                      Select an existing photo from the centralized Media Library or upload a new square photo.
                    </p>
                  </div>
                </div>

                {/* Direct Image URL input (optional fallback) */}
                <input
                  type="text"
                  placeholder="Or enter image URL..."
                  value={editingCard.image}
                  onChange={(e) => setEditingCard({ ...editingCard, image: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/40 px-3 py-2 rounded-xl text-xs font-medium text-on-surface focus:bg-white focus:border-[#2D5A3D] outline-none"
                />
              </div>

              {/* Eyebrow Label & Main Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase text-[#717971] tracking-wider block">
                    Introductory Eyebrow
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IN HARVEST, UP TO 35% OFF"
                    value={editingCard.eyebrow}
                    onChange={(e) => setEditingCard({ ...editingCard, eyebrow: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 px-3 py-2 rounded-xl text-xs font-bold uppercase text-on-surface focus:bg-white focus:border-[#2D5A3D] outline-none"
                  />
                  <span className="text-[10px] text-[#717971]">Small uppercase intro tag</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase text-[#717971] tracking-wider block">
                    Main Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Peak Season, New This Season"
                    value={editingCard.title}
                    onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 px-3 py-2 rounded-xl text-xs font-bold text-on-surface focus:bg-white focus:border-[#2D5A3D] outline-none"
                  />
                  <span className="text-[10px] text-[#717971]">Primary promotional heading</span>
                </div>
              </div>

              {/* Supporting Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold uppercase text-[#717971] tracking-wider block">
                  Supporting Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. This week's best, Just arrived, Limited time"
                  value={editingCard.description}
                  onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/40 px-3 py-2 rounded-xl text-xs font-medium text-on-surface focus:bg-white focus:border-[#2D5A3D] outline-none"
                />
              </div>

              {/* Link Destination */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-[#717971] tracking-wider block">
                  Click Destination (Category or URL)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={['Vegetables', 'Fruits', 'Deals', 'Seasonal', 'Dairy', 'Herbs', 'Grains', 'All'].includes(editingCard.link) ? editingCard.link : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setEditingCard({ ...editingCard, link: e.target.value });
                      }
                    }}
                    className="bg-surface-container-low border border-outline-variant/40 px-3 py-2 rounded-xl text-xs font-bold text-on-surface outline-none cursor-pointer"
                  >
                    <option value="Vegetables">Vegetables Catalog</option>
                    <option value="Fruits">Seasonal Fruits</option>
                    <option value="Deals">Flash Deals</option>
                    <option value="Seasonal">Seasonal Specials</option>
                    <option value="Dairy">Farm Dairy & Eggs</option>
                    <option value="Herbs">Herbs & Spices</option>
                    <option value="Grains">Grains & Organic Staples</option>
                    <option value="All">All Products</option>
                    <option value="custom">Custom Link / Route...</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Destination category or /catalog path"
                    value={editingCard.link}
                    onChange={(e) => setEditingCard({ ...editingCard, link: e.target.value })}
                    className="bg-surface-container-low border border-outline-variant/40 px-3 py-2 rounded-xl text-xs font-medium text-on-surface focus:bg-white focus:border-[#2D5A3D] outline-none"
                  />
                </div>
              </div>

              {/* Visibility Switch */}
              <div className="flex items-center justify-between p-3.5 bg-surface-container-low/60 rounded-2xl border border-outline-variant/30">
                <div>
                  <h4 className="text-xs font-extrabold text-[#1C2A1E]">Card Visibility</h4>
                  <p className="text-[11px] text-[#717971]">
                    {editingCard.is_active 
                      ? "This card is visible to all shoppers on the homepage." 
                      : "This card is temporarily hidden without being deleted."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCard({ ...editingCard, is_active: !editingCard.is_active })}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border",
                    editingCard.is_active
                      ? "bg-[#2D5A3D] text-white border-[#2D5A3D]"
                      : "bg-surface-container-high text-on-surface-variant border-outline-variant"
                  )}
                >
                  {editingCard.is_active ? (
                    <>
                      <Eye size={13} />
                      <span>Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={13} />
                      <span>Hidden</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant/30 bg-surface-container-lowest">
              <button
                type="button"
                onClick={() => { setEditingCard(null); setEditingIndex(null); }}
                className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCardModal}
                className="px-5 py-2 bg-[#2D5A3D] text-white hover:bg-[#1E3E2A] rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MEDIA PICKER MODAL FOR CARD IMAGE SELECTION                           */}
      {/* ==================================================================== */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        maxSelectable={1}
        title="Choose Promotional Card Image"
        subtitle="Select 1 image from the Media Library to link to this promotional card."
        limitMessage="Select 1 image to attach to this promotional card."
        alreadyAttachedPaths={editingCard?.image ? [editingCard.image] : []}
        onSelectImages={(selected) => {
          if (selected.length > 0 && editingCard) {
            const asset = selected[0];
            setEditingCard({
              ...editingCard,
              image: asset.url || asset.file || asset.file_path,
            });
            toast(`Selected image "${asset.original_filename || 'Media Image'}"`, "success");
          }
        }}
      />
    </div>
  );
}
