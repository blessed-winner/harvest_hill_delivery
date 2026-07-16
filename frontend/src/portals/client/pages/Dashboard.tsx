"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Leaf, ChevronRight, User, MapPin, Bell, CreditCard, LogOut, ShoppingCart, Check, FileText, Loader2, Package } from 'lucide-react';
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
  const [autoReorder, setAutoReorder] = useState(true);
  const [earlyAccess, setEarlyAccess] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
        
        // Fetch recent orders to show as favorites (top products)
        const products = await clientApi.products.list({ limit: '5' });
        setFavorites(products?.results || []);
        
        // Fetch profile
        const profile = await clientApi.profile.get();
        setProfileData(profile);
        setFullName(profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : profile.email || '');
        setEmail(profile.email || '');
        setBusinessTitle(profile.business_title || '');
        setPhone(profile.phone || '');
        
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
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await clientApi.profile.update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        business_title: businessTitle,
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-8 text-center">
          <Package className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#1c1c18] mb-2">Unable to Load Dashboard</h2>
          <p className="text-sm text-[#717971] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Top Banner section: Welcome message & Category Volume Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome message card */}
        <div className="lg:col-span-2 bg-white border border-[#e5e2db] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight">
              Welcome back{profileData?.first_name ? `, ${profileData.first_name}` : ''}.
            </h1>
            <p className="mt-4 text-[#414942] leading-relaxed text-sm">
              {dashboardData?.message || 'Your dashboard is ready. Browse our fresh local produce and manage your orders.'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-6 border-t border-[#f0eee7]">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#717971]">Monthly Spend</p>
              <p className="text-2xl font-bold text-[#1c1c18] mt-1">
                ${dashboardData?.monthly_spend?.toFixed(2) || '0.00'}
              </p>
              <span className="flex items-center gap-1 text-xs text-[#376847] font-semibold mt-1">
                <TrendingUp size={14} /> {dashboardData?.spend_trend || '0%'} from last month
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#717971]">Total Orders</p>
              <p className="text-2xl font-bold text-[#1c1c18] mt-1">
                {dashboardData?.total_orders || 0} Orders
              </p>
              <span className="flex items-center gap-1 text-xs text-[#414942] mt-1">
                <Calendar size={14} /> {dashboardData?.next_delivery || 'No upcoming deliveries'}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#717971]">Savings Gained</p>
              <p className="text-2xl font-bold text-[#1c1c18] mt-1">
                ${dashboardData?.total_savings?.toFixed(2) || '0.00'}
              </p>
              <span className="flex items-center gap-1 text-xs text-[#414942] mt-1">
                <DollarSign size={14} /> Via Bulk Negotiation
              </span>
            </div>
          </div>
        </div>

        {/* Volume by Category visual card */}
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#717971]">Volume by Category</p>
            
            {/* Custom high fidelity chart */}
            <div className="h-32 flex items-end justify-around gap-2 mt-4 px-2">
              {volumeData.length > 0 ? (
                volumeData.slice(0, 4).map((item: any, index: number) => {
                  const colors = ['bg-[#144227]', 'bg-[#376847]', 'bg-[#563113]', 'bg-[#a1d2ad]'];
                  const maxVolume = Math.max(...volumeData.map((v: any) => v.volume || 0));
                  const height = maxVolume > 0 ? `${(item.volume / maxVolume) * 100}%` : '10%';
                  
                  return (
                    <div key={item.category || index} className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-full bg-[#f0eee7] rounded-md h-24 relative overflow-hidden flex items-end">
                        <div
                          className={`w-full ${colors[index % colors.length]} rounded-t-sm transition-all duration-500`}
                          style={{ height }}
                        ></div>
                      </div>
                      <span className="text-[9px] font-bold text-[#717971] tracking-wider uppercase truncate w-full text-center">
                        {item.category?.substring(0, 5) || 'N/A'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-24 flex items-center justify-center text-xs text-[#717971]">
                  No volume data available
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#f0eee7]/60 border border-[#e5e2db] rounded-xl p-3 flex items-start gap-2.5 mt-6">
            <span className="text-[#376847] p-1 bg-white rounded-full shadow-sm">
              <Leaf size={14} />
            </span>
            <p className="text-xs text-[#414942] leading-normal">
              {dashboardData?.sustainability_message || 'Supporting local farms helps reduce carbon emissions.'}
            </p>
          </div>
        </div>

      </div>

      {/* Quick Reorder Favorites Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1c1c18]">Quick Reorder Favorites</h2>
          <button
            onClick={() => onNavigate('catalog')}
            className="flex items-center gap-1 text-sm font-semibold text-[#144227] hover:underline underline-offset-4 cursor-pointer"
          >
            Browse Catalog <ChevronRight size={16} />
          </button>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {favorites.map((prod: any) => (
              <div
                key={prod.id}
                onClick={() => onNavigate('product-detail')}
                className="bg-white border border-[#e5e2db] rounded-xl p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div>
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#f6f3ec] relative">
                    <img
                      src={prod.image_url || prod.image || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80'}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-[8px] font-bold tracking-wider text-[#717971] mt-2.5 uppercase">
                    {prod.category || 'Product'}
                  </p>
                  <h3 className="text-xs font-bold text-[#1c1c18] mt-0.5 line-clamp-1 group-hover:text-[#144227] transition-colors">
                    {prod.name}
                  </h3>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f0eee7]">
                  <div>
                    <span className="block text-xs font-bold text-[#414942]">
                      ${prod.price?.toFixed(2) || '0.00'}
                    </span>
                    <span className="block text-[8px] text-[#717971] uppercase font-semibold">
                      {prod.unit || 'per unit'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart();
                    }}
                    className="bg-[#144227] text-white p-1.5 rounded-full hover:bg-[#376847] transition-colors cursor-pointer"
                  >
                    <ShoppingCart size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center shadow-sm">
            <Package className="w-12 h-12 text-[#c1c9c0] mx-auto mb-3" />
            <p className="text-sm text-[#717971] mb-4">No products available yet</p>
            <button
              onClick={() => onNavigate('catalog')}
              className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
            >
              Browse Catalog
            </button>
          </div>
        )}
      </div>

      {/* Account Settings Section */}
      <div>
        <h2 className="text-lg font-bold text-[#1c1c18] mb-5">Account Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          
          {/* Navigation Sidebar */}
          <div className="bg-white border border-[#e5e2db] rounded-xl overflow-hidden shadow-sm">
            <nav className="flex flex-col">
              {[
                { id: 'profile', label: 'Personal Profile', icon: User, action: () => setActiveTab('profile') },
                { id: 'addresses', label: 'Shipping Addresses', icon: MapPin, action: () => setActiveTab('addresses') },
                { id: 'notifications', label: 'Notifications', icon: Bell, action: () => setActiveTab('notifications') },
                { id: 'payments', label: 'Payment Methods', icon: CreditCard, action: () => setActiveTab('payments') },
                { id: 'invoices', label: 'Billing & Invoices', icon: FileText, action: () => onNavigate('invoices') },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={tab.action}
                    className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold border-b border-[#f0eee7] transition-colors cursor-pointer text-left ${
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
                onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  localStorage.removeItem('user_role');
                  window.location.href = '/login';
                }}
                className="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/20 transition-colors cursor-pointer text-left"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </nav>
          </div>

          {/* Form Content Area */}
          <div className="md:col-span-3 bg-white border border-[#e5e2db] rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-[#1c1c18] pb-3 border-b border-[#f0eee7]">Profile Details</h3>
            
            <form onSubmit={handleSave} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white transition-all text-[#1c1c18]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white transition-all text-[#1c1c18]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Business Title</label>
                  <input
                    type="text"
                    value={businessTitle}
                    onChange={(e) => setBusinessTitle(e.target.value)}
                    className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white transition-all text-[#1c1c18]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white transition-all text-[#1c1c18]"
                  />
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
                      <span className="block text-xs font-bold text-[#1c1c18]">Automatic Re-ordering</span>
                      <span className="block text-[10px] text-[#717971]">Re-order essentials when stock is predicted to be low.</span>
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
                      <span className="block text-xs font-bold text-[#1c1c18]">Early Seasonal Access</span>
                      <span className="block text-[10px] text-[#717971]">Get notified 24 hours before new seasonal crops go public.</span>
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
                  className="bg-[#144227] text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-[#376847] shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>

    </div>
  );
}
