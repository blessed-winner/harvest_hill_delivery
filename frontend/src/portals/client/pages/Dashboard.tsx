"use client";

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Leaf, 
  ChevronRight, 
  User, 
  MapPin, 
  LogOut, 
  ShoppingCart, 
  Check, 
  FileText, 
  Loader2, 
  Package, 
  Save, 
  Edit2, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import { clientApi } from '../lib/api';

interface DashboardProps {
  onNavigate: (screen: string) => void;
  addToCart: () => void;
}

export default function Dashboard({ onNavigate, addToCart }: DashboardProps) {
  // API Data State
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // Settings Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [businessTitle, setBusinessTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [autoReorder, setAutoReorder] = useState(true);
  const [earlyAccess, setEarlyAccess] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inline edit states for profile fields
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [editPhone, setEditPhone] = useState(false);

  // Account deletion states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Shipping Address State
  const [streetAddress, setStreetAddress] = useState('');
  const [cityDistrict, setCityDistrict] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [addressSavedSuccess, setAddressSavedSuccess] = useState(false);

  // Active Settings Tab State
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch dashboard summary
        const summary = await clientApi.dashboardSummary();
        setDashboardData(summary);
        
        // Fetch volume by category
        const volume = await clientApi.volumeByCategory();
        setVolumeData(volume || []);
        
        // Fetch recent orders to show as favorites
        const products = await clientApi.products.list({ limit: '5' });
        setFavorites(products?.results || []);
        
        // Fetch profile
        const profile = await clientApi.profile.get();
        setProfileData(profile);
        
        const cp = profile.profile || {};
        setFullName(profile.first_name || profile.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : cp.business_name || profile.username || profile.email || '');
        setEmail(profile.email || '');
        setBusinessTitle(cp.business_title || '');
        const phoneVal = cp.phone || cp.phone_number || '';
        setPhone(phoneVal);

        // Load saved preferences
        const savedPrefs = localStorage.getItem('client_preferences');
        if (savedPrefs) {
          const parsed = JSON.parse(savedPrefs);
          setAutoReorder(parsed.autoReorder ?? true);
          setEarlyAccess(parsed.earlyAccess ?? true);
        }

        // Load saved profile signature
        const existingSig = localStorage.getItem('saved_signature');
        if (existingSig) {
          setSavedSignature(existingSig);
        }

        // Load saved shipping address
        const savedAddress = localStorage.getItem('default_shipping_address');
        if (savedAddress) {
          setStreetAddress(savedAddress);
        }
        setContactPhone(phoneVal);
        
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await clientApi.profile.update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        phone_number: phone,
        business_title: businessTitle,
        business_name: fullName,
      });

      // Save preferences to localStorage
      localStorage.setItem('client_preferences', JSON.stringify({
        autoReorder,
        earlyAccess
      }));
      
      setSaveSuccess(true);
      // Turn off edit states
      setEditName(false);
      setEditEmail(false);
      setEditTitle(false);
      setEditPhone(false);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAccountDeletion = async () => {
    try {
      setDeletingAccount(true);
      // Call DELETE on user profile endpoint which schedules deactivation
      await clientApi.profile.delete();
      
      // Clear localStorage session tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      
      alert("Your account deletion has been scheduled. You will be logged out now.");
      window.location.href = '/login';
    } catch (err: any) {
      alert(err.message || "Failed to schedule account deletion");
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const fullAddr = `${streetAddress}${cityDistrict ? `, ${cityDistrict}` : ''}`;
    localStorage.setItem('default_shipping_address', fullAddr);
    if (contactPhone) {
      setPhone(contactPhone);
    }
    setAddressSavedSuccess(true);
    setTimeout(() => setAddressSavedSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#144227] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#717971]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e2db] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight font-sans">Client Portal Dashboard</h1>
          <p className="text-xs text-[#717971] mt-1">Overview of procurement, active orders, and profile configuration.</p>
        </div>
      </div>

      {/* ── KPI Metric Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#717971]">Active Orders</span>
            <div className="p-2 bg-[#f0eee7] rounded-xl text-[#144227]">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-[#1c1c18]">{dashboardData?.active_orders_count || 0}</span>
            <span className="text-[10px] text-[#717971] block mt-0.5 font-bold">In transit & processing</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#717971]">Completed Purchases</span>
            <div className="p-2 bg-[#f0eee7] rounded-xl text-[#144227]">
              <Package size={18} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-[#1c1c18]">{dashboardData?.completed_orders_count || 0}</span>
            <span className="text-[10px] text-[#717971] block mt-0.5 font-bold">Fulfilled orders</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#717971]">Spend This Month</span>
            <div className="p-2 bg-[#f0eee7] rounded-xl text-[#144227]">
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-[#1c1c18]">${parseFloat(dashboardData?.total_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-[#717971] block mt-0.5 font-bold">Total procurement volume</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#717971]">Delivered Notes</span>
            <div className="p-2 bg-[#f0eee7] rounded-xl text-[#144227]">
              <FileText size={18} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-[#1c1c18]">{dashboardData?.delivery_notes_count || 0}</span>
            <span className="text-[10px] text-[#717971] block mt-0.5 font-bold">Dispatches verified</span>
          </div>
        </div>

      </div>

      {/* ── Account Settings Section ──────────────────────────────────── */}
      <div className="space-y-4 pt-4 border-t border-[#e5e2db]">
        <h2 className="text-xl font-extrabold text-[#144227] tracking-tight">Account & Profile Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          
          {/* Navigation Sidebar */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl overflow-hidden shadow-sm">
            <nav className="flex flex-col">
              {[
                { id: 'profile', label: 'Personal Profile', icon: User, action: () => setActiveTab('profile') },
                { id: 'addresses', label: 'Shipping Addresses', icon: MapPin, action: () => setActiveTab('addresses') },
                { id: 'invoices', label: 'Billing & Invoices', icon: FileText, action: () => onNavigate('invoices') },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={tab.action}
                    className={`flex items-center gap-3 px-4 py-3.5 text-xs font-semibold border-b border-[#f0eee7] transition-colors cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#144227] text-white'
                        : 'text-[#414942] hover:bg-[#fcf9f2]'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  localStorage.removeItem('user_role');
                  window.location.href = '/login';
                }}
                className="flex items-center gap-3 px-4 py-3.5 text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/20 transition-colors cursor-pointer text-left border-b border-[#f0eee7]"
              >
                <LogOut size={16} />
                Sign Out
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-3 px-4 py-3.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100/50 transition-colors cursor-pointer text-left"
              >
                <Trash2 size={16} />
                Delete Account
              </button>
            </nav>
          </div>

          {/* Form Content Area */}
          <div className="md:col-span-3 bg-white border border-[#e5e2db] rounded-2xl p-6 sm:p-8 shadow-sm">
            
            {activeTab === 'profile' && (
              <>
                <h3 className="text-base font-bold text-[#1c1c18] pb-3 border-b border-[#f0eee7]">Profile Details</h3>
                
                <form onSubmit={handleSave} className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* Full Name Field */}
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971]">Full Name / Business Name</label>
                      {editName ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="flex-1 bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#144227]"
                          />
                          <button type="button" onClick={() => setEditName(false)} className="px-2.5 py-1.5 bg-[#144227] text-white rounded-lg text-[10px] font-bold">Done</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-[#fcf9f2]/40 px-3 py-2.5 rounded-xl border border-[#e5e2db]">
                          <span className="text-xs font-bold text-[#1c1c18]">{fullName || "Not set"}</span>
                          <button type="button" onClick={() => setEditName(true)} className="text-[#717971] hover:text-[#144227] p-1"><Edit2 size={13} /></button>
                        </div>
                      )}
                    </div>

                    {/* Email Address Field */}
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971]">Email Address</label>
                      {editEmail ? (
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#144227]"
                          />
                          <button type="button" onClick={() => setEditEmail(false)} className="px-2.5 py-1.5 bg-[#144227] text-white rounded-lg text-[10px] font-bold">Done</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-[#fcf9f2]/40 px-3 py-2.5 rounded-xl border border-[#e5e2db]">
                          <span className="text-xs font-bold text-[#1c1c18]">{email || "Not set"}</span>
                          <button type="button" onClick={() => setEditEmail(true)} className="text-[#717971] hover:text-[#144227] p-1"><Edit2 size={13} /></button>
                        </div>
                      )}
                    </div>

                    {/* Business Title Field */}
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971]">Business Title / Role</label>
                      {editTitle ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={businessTitle}
                            onChange={(e) => setBusinessTitle(e.target.value)}
                            className="flex-1 bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#144227]"
                          />
                          <button type="button" onClick={() => setEditTitle(false)} className="px-2.5 py-1.5 bg-[#144227] text-white rounded-lg text-[10px] font-bold">Done</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-[#fcf9f2]/40 px-3 py-2.5 rounded-xl border border-[#e5e2db]">
                          <span className="text-xs font-bold text-[#1c1c18]">{businessTitle || "Not set"}</span>
                          <button type="button" onClick={() => setEditTitle(true)} className="text-[#717971] hover:text-[#144227] p-1"><Edit2 size={13} /></button>
                        </div>
                      )}
                    </div>

                    {/* Contact Phone Number Field */}
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971]">Contact Phone Number</label>
                      {editPhone ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="flex-1 bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#144227]"
                          />
                          <button type="button" onClick={() => setEditPhone(false)} className="px-2.5 py-1.5 bg-[#144227] text-white rounded-lg text-[10px] font-bold">Done</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-[#fcf9f2]/40 px-3 py-2.5 rounded-xl border border-[#e5e2db]">
                          <span className="text-xs font-bold text-[#1c1c18]">{phone || "Not set"}</span>
                          <button type="button" onClick={() => setEditPhone(true)} className="text-[#717971] hover:text-[#144227] p-1"><Edit2 size={13} /></button>
                        </div>
                      )}
                    </div>

                    {/* Official Digital Signature Upload */}
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Official Client Digital Signature</label>
                      <div className="border border-dashed border-[#c1c9c0] rounded-xl p-3.5 bg-[#f6f3ec]/60 flex items-center justify-between gap-4">
                        {savedSignature ? (
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-1.5 border border-[#c1c9c0] rounded-lg max-h-16">
                              <img src={savedSignature} alt="Signature" className="max-h-12 object-contain" />
                            </div>
                            <span className="text-xs font-bold text-[#144227]">Signature Saved on Profile</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#717971]">No default signature uploaded yet</span>
                        )}
                        <label className="bg-[#144227] text-white text-[10px] font-bold px-3 py-2 rounded-lg hover:bg-[#376847] cursor-pointer transition-colors shrink-0">
                          {savedSignature ? "Change Signature" : "Upload Signature"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const dataUrl = ev.target?.result as string;
                                  setSavedSignature(dataUrl);
                                  localStorage.setItem('saved_signature', dataUrl);
                                };
                                reader.readAsDataURL(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                  </div>

                  {/* Preference Settings checkboxes */}
                  <div className="pt-4 border-t border-[#f0eee7]">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#717971] mb-4">Preference Settings</p>
                    
                    <div className="space-y-4">
                      {/* Pref 1 */}
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={autoReorder}
                          onChange={() => setAutoReorder(!autoReorder)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all mt-0.5 ${
                          autoReorder
                            ? 'bg-[#144227] border-[#144227] text-white'
                            : 'border-[#c1c9c0] bg-white group-hover:border-[#144227]'
                        }`}>
                          {autoReorder && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-[#1c1c18]">Receive Email Notifications</span>
                          <span className="block text-[10px] text-[#717971]">Receive automated email updates regarding order deliveries.</span>
                        </div>
                      </label>

                      {/* Pref 2 */}
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={earlyAccess}
                          onChange={() => setEarlyAccess(!earlyAccess)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all mt-0.5 ${
                          earlyAccess
                            ? 'bg-[#144227] border-[#144227] text-white'
                            : 'border-[#c1c9c0] bg-white group-hover:border-[#144227]'
                        }`}>
                          {earlyAccess && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-[#1c1c18]">Receive Inventory Low Alerts</span>
                          <span className="block text-[10px] text-[#717971]">Notify when preferred fresh catalog products are running low in stock.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Save Changes Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#f0eee7]">
                    <div className="h-6">
                      {saveSuccess && (
                        <span className="text-xs font-semibold text-[#376847] flex items-center gap-1.5 animate-fadeIn">
                          <span className="w-1.5 h-1.5 bg-[#376847] rounded-full"></span>
                          Changes saved successfully!
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#144227] text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-[#376847] shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={14} /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {activeTab === 'addresses' && (
              <>
                <h3 className="text-base font-bold text-[#1c1c18] pb-3 border-b border-[#f0eee7]">Shipping Addresses</h3>
                <p className="text-xs text-[#717971] mt-2">Manage your default delivery address. This address will be automatically prefilled during checkout.</p>
                
                <form onSubmit={handleSaveAddress} className="mt-6 space-y-6">
                  <div>
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Street / Warehouse Address <span className="text-red-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="E.g. 100 Harvest Avenue, Block 4 B, Kigali"
                      className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white transition-all text-[#1c1c18]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">City / District</label>
                      <input
                        type="text"
                        value={cityDistrict}
                        onChange={(e) => setCityDistrict(e.target.value)}
                        placeholder="E.g. Gasabo, Kigali"
                        className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white transition-all text-[#1c1c18]"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Delivery Contact Phone</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="E.g. +250 788 123 456"
                        className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white transition-all text-[#1c1c18]"
                      />
                    </div>
                  </div>

                  {/* Save Address Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#f0eee7]">
                    <div className="h-6">
                      {addressSavedSuccess && (
                        <span className="text-xs font-semibold text-[#376847] flex items-center gap-1.5 animate-fadeIn">
                          <span className="w-1.5 h-1.5 bg-[#376847] rounded-full"></span>
                          Default shipping address saved & prefilled for checkout!
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="bg-[#144227] text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-[#376847] shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Save size={14} /> Save Shipping Address
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>

        </div>
      </div>

      {/* ACCOUNT DELETION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#e5e2db] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-extrabold text-[#1c1c18]">Confirm Account Deletion</h3>
            </div>
            
            <p className="text-xs text-[#717971] leading-relaxed">
              Are you absolutely sure you want to request account deletion? Your account will be deactivated immediately, and all your personal profiles, records, and access rights will be permanently deleted after <strong>10 days</strong>.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-[#c1c9c0] text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleAccountDeletion}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-2"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scheduling...
                  </>
                ) : (
                  "Yes, Delete Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
