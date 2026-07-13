"use client";

import { useState } from 'react';
import { TrendingUp, Calendar, DollarSign, Leaf, ChevronRight, User, MapPin, Bell, CreditCard, LogOut, ShoppingCart, Check, FileText } from 'lucide-react';

interface DashboardProps {
  onNavigate: (screen: string) => void;
  addToCart: () => void;
}

export default function Dashboard({ onNavigate, addToCart }: DashboardProps) {
  // Settings Form State
  const [fullName, setFullName] = useState('Arthur Penhaligon');
  const [email, setEmail] = useState('arthur.p@kitchens.co');
  const [businessTitle, setBusinessTitle] = useState('Executive Chef');
  const [phone, setPhone] = useState('+1 (555) 012-3456');
  const [autoReorder, setAutoReorder] = useState(true);
  const [earlyAccess, setEarlyAccess] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active Settings Tab State
  const [activeTab, setActiveTab] = useState('profile');

  const favorites = [
    {
      id: 'strawberries',
      brand: 'ORGANIC FARMS LTD',
      name: 'Heirloom Strawberries',
      price: '$6.40/lb',
      img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80'
    },
    {
      id: 'spinach',
      brand: 'RIDGE VALLEY',
      name: 'Premium Baby Spinach',
      price: '$4.20/ea',
      img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80'
    },
    {
      id: 'milk',
      brand: 'HILLSIDE DAIRY',
      name: 'Grass-fed Whole Milk',
      price: '$5.50/qt',
      img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80'
    },
    {
      id: 'carrots',
      brand: 'ROOT & STEM',
      name: 'Rainbow Carrot Mix',
      price: '$3.10/lb',
      img: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&q=80'
    },
    {
      id: 'bread',
      brand: 'OLD MILL BAKERY',
      name: 'Rustic Sourdough',
      price: '$7.00/lb',
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'
    }
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Top Banner section: Welcome message & Category Volume Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome message card */}
        <div className="lg:col-span-2 bg-white border border-[#e5e2db] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight">Welcome back, Arthur.</h1>
            <p className="mt-4 text-[#414942] leading-relaxed text-sm">
              Your kitchen is currently running on <span className="font-bold text-[#144227]">84% fresh local produce</span>.
              We have some new seasonal arrivals from <span className="font-bold text-[#144227]">Green Valley Orchards</span> today.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-6 border-t border-[#f0eee7]">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#717971]">Monthly Spend</p>
              <p className="text-2xl font-bold text-[#1c1c18] mt-1">$1,240.50</p>
              <span className="flex items-center gap-1 text-xs text-[#376847] font-semibold mt-1">
                <TrendingUp size={14} /> 12% from last month
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#717971]">Total Deliveries</p>
              <p className="text-2xl font-bold text-[#1c1c18] mt-1">18 Orders</p>
              <span className="flex items-center gap-1 text-xs text-[#414942] mt-1">
                <Calendar size={14} /> Next: Tomorrow, 9AM
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#717971]">Savings Gained</p>
              <p className="text-2xl font-bold text-[#1c1c18] mt-1">$142.20</p>
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
              {[
                { name: 'FRUIT', value: '75%', color: 'bg-[#144227]' },
                { name: 'VEG', value: '60%', color: 'bg-[#376847]' },
                { name: 'DAIRY', value: '45%', color: 'bg-[#563113]' },
                { name: 'GRAIN', value: '30%', color: 'bg-[#a1d2ad]' },
              ].map((bar) => (
                <div key={bar.name} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full bg-[#f0eee7] rounded-md h-24 relative overflow-hidden flex items-end">
                    <div
                      className={`w-full ${bar.color} rounded-t-sm transition-all duration-500`}
                      style={{ height: bar.value }}
                    ></div>
                  </div>
                  <span className="text-[9px] font-bold text-[#717971] tracking-wider">{bar.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#f0eee7]/60 border border-[#e5e2db] rounded-xl p-3 flex items-start gap-2.5 mt-6">
            <span className="text-[#376847] p-1 bg-white rounded-full shadow-sm">
              <Leaf size={14} />
            </span>
            <p className="text-xs text-[#414942] leading-normal">
              Your preference for <span className="font-bold text-[#144227]">Organic Fruits</span> has saved <span className="font-bold">40kg of CO2</span> this month.
            </p>
          </div>
        </div>

      </div>

      {/* Quick Reorder Favorites Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1c1c18]">Quick Reorder Favorites</h2>
          <button
            onClick={() => onNavigate('order-history')}
            className="flex items-center gap-1 text-sm font-semibold text-[#144227] hover:underline underline-offset-4 cursor-pointer"
          >
            View All History <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {favorites.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onNavigate('product-detail')}
              className="bg-white border border-[#e5e2db] rounded-xl p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div>
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#f6f3ec] relative">
                  <img
                    src={prod.img}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-[8px] font-bold tracking-wider text-[#717971] mt-2.5 uppercase">{prod.brand}</p>
                <h3 className="text-xs font-bold text-[#1c1c18] mt-0.5 line-clamp-1 group-hover:text-[#144227] transition-colors">{prod.name}</h3>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f0eee7]">
                <span className="text-xs font-bold text-[#414942]">{prod.price}</span>
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
                onClick={() => alert("Signing out...")}
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
