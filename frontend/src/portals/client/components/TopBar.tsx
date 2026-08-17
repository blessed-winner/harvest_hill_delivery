import React, { useEffect, useState, useRef } from 'react';
import { User, History, Bell, ShoppingCart, Menu, X, Clock, Handshake, Package, AlertCircle, Search, MapPin } from 'lucide-react';
import Link from 'next/link';
import { clientApi } from '../lib/api';
import { CurrencyToggle } from '../../../components/CurrencyToggle';
import { DefaultProfileAvatar } from '../../../components/DefaultProfileAvatar';

interface TopBarProps {
  activeScreen: string;
  onNavigate: (screen: string, category?: string, productId?: number, querySearch?: string) => void;
  cartCount: number;
  onMenuClick?: () => void;
}

function getNotifyIcon(title: string) {
  const t = (title || '').toLowerCase();
  if (t.includes('deal') || t.includes('agreement') || t.includes('negotiation') || t.includes('order')) return Handshake;
  if (t.includes('demand') || t.includes('product') || t.includes('harvest') || t.includes('stock')) return Package;
  if (t.includes('alert') || t.includes('dispute') || t.includes('system')) return AlertCircle;
  return Bell;
}

function formatRelativeTime(dateStr: string) {
  if (!dateStr) return '';
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function TopBar({ activeScreen, onNavigate, cartCount, onMenuClick }: TopBarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState('all');
  const [topSearchTerm, setTopSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleScroll = (id: string) => {
    if (activeScreen !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await clientApi.notifications.list();
      setNotifications(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const loadProfilePhoto = async () => {
    try {
      const data = await clientApi.profile.get();
      setProfilePhoto(data.avatar || data.profile?.avatar || null);
    } catch {}
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('user_role');
      setIsLoggedIn(!!token);
      setUserRole(role);
      if (token) {
        loadProfilePhoto();
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);

        const handleProfileUpdated = () => {
          loadProfilePhoto();
        };

        const handleAuthChanged = () => {
          const freshToken = localStorage.getItem('access_token');
          setIsLoggedIn(!!freshToken);
          if (!freshToken) setNotifications([]);
        };

        window.addEventListener('profile-updated', handleProfileUpdated);
        window.addEventListener('auth-changed', handleAuthChanged);

        return () => {
          clearInterval(interval);
          window.removeEventListener('profile-updated', handleProfileUpdated);
          window.removeEventListener('auth-changed', handleAuthChanged);
        };
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNotifyOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: number | string) => {
    try {
      await clientApi.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await clientApi.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleDeleteNotif = async (id: number | string) => {
    try {
      await clientApi.notifications.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleDeleteAllNotifs = async () => {
    try {
      await clientApi.notifications.deleteAll();
      setNotifications([]);
    } catch (err) {
      console.error("Failed to delete all notifications:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const unreadNotifs = notifications.filter(n => !n.is_read);
  const readNotifs = notifications.filter(n => n.is_read);

  const [deliveryLocation, setDeliveryLocation] = useState('Kigali, Sector 4');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isBusinessOpen, setIsBusinessOpen] = useState(false);

  const locations = [
    'Kigali, Sector 4 (Central)',
    'Nyarugenge, City Center',
    'Gasabo, Kimironko',
    'Kicukiro, Sonatube',
    'Musanze, Northern Hub',
    'Rubavu, Lakefront'
  ];

  return (
    <header className="sticky top-0 z-50 shadow-sm font-sans bg-white border-b border-[#e5e2db]">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 sm:gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-1.5 hover:bg-[#FAF7F0] rounded-lg transition-colors cursor-pointer"
              title="Toggle Menu"
            >
              <Menu className="h-5 w-5 text-[#2D5A3D]" />
            </button>
          )}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-1.5 text-lg sm:text-2xl font-extrabold text-[#2D5A3D] tracking-tight hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span>Harvest Hill<span className="text-[#4A7C59] font-normal text-xs sm:text-sm hidden sm:inline ml-1">Delivery</span></span>
          </button>
        </div>

        {/* Large Dominant Search Bar with Instant Live Search */}
        <div className="flex-1 max-w-2xl mx-2 sm:mx-4 flex items-center">
          <div className="flex w-full bg-[#FAF7F0] border border-[#DCD6C8] focus-within:border-[#2D5A3D] focus-within:ring-1 focus-within:ring-[#2D5A3D] rounded-xl overflow-hidden shadow-inner transition-all">
            <select 
              value={searchCategory}
              onChange={(e) => {
                const cat = e.target.value;
                setSearchCategory(cat);
                onNavigate('catalog', cat !== 'all' ? cat : undefined, undefined, topSearchTerm);
              }}
              className="hidden md:block bg-transparent text-xs font-bold px-3 text-[#414942] border-r border-[#DCD6C8] outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Dairy">Dairy</option>
              <option value="Grains">Grains</option>
              <option value="Herbs">Herbs</option>
            </select>
            <input
              type="text"
              value={topSearchTerm}
              onChange={(e) => {
                const val = e.target.value;
                setTopSearchTerm(val);
                onNavigate('catalog', searchCategory !== 'all' ? searchCategory : undefined, undefined, val);
              }}
              placeholder="Search fresh produce, organic dairy, meat, bakery..."
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[#1C2A1E] focus:outline-none placeholder-[#888888]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onNavigate('catalog', searchCategory !== 'all' ? searchCategory : undefined, undefined, topSearchTerm);
                }
              }}
            />
            <button 
              onClick={() => onNavigate('catalog', searchCategory !== 'all' ? searchCategory : undefined, undefined, topSearchTerm)}
              className="bg-[#2D5A3D] text-white px-4 py-2 hover:bg-[#1E3E2A] transition-colors cursor-pointer flex items-center justify-center"
              title="Search Catalog"
            >
              <Search size={16} />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-xs">
          {/* For Business Link */}
          <button
            onClick={() => setIsBusinessOpen(true)}
            className="hidden md:inline-block text-[#4A7C59] hover:text-[#2D5A3D] font-semibold underline decoration-dotted underline-offset-4 transition-colors cursor-pointer"
          >
            For Business
          </button>

          {/* Account */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const role = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
                  if (role === 'farmer') {
                    window.location.href = '/farmer?view=settings';
                  } else if (role === 'admin') {
                    window.location.href = '/admin?tab=settings';
                  } else {
                    onNavigate('dashboard');
                  }
                }}
                className="flex items-center gap-1.5 p-1 hover:bg-[#FAF7F0] rounded-lg transition-colors cursor-pointer text-[#1C2A1E] font-medium"
                title="Account Settings"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-7 h-7 rounded-full object-cover border border-[#c1c9c0]" />
                ) : (
                  <DefaultProfileAvatar className="w-7 h-7" />
                )}
                <span className="hidden lg:inline font-semibold">Account</span>
              </button>

              {/* Notifications Engine */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsNotifyOpen(prev => !prev)}
                  className="p-1.5 hover:bg-[#FAF7F0] rounded-lg transition-colors relative cursor-pointer text-[#414942]"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 min-w-[15px] h-[15px] bg-[#D9381E] text-white font-mono text-[8px] font-bold flex items-center justify-center rounded-full px-1 border border-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotifyOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] sm:w-[360px] bg-white border border-[#e5e2db] rounded-2xl shadow-2xl z-[80] overflow-hidden flex flex-col font-sans transition-all">
                    <div className="flex items-center justify-between px-5 py-3.5 bg-[#2D5A3D] text-white shrink-0">
                      <div>
                        <span className="font-extrabold text-sm block">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] text-white/80 font-medium">{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-[#9ed0ab] hover:underline cursor-pointer">Mark all read</button>
                        )}
                        {notifications.length > 0 && (
                          <button onClick={handleDeleteAllNotifs} className="text-[10px] font-bold text-red-200 hover:underline cursor-pointer">Clear all</button>
                        )}
                        <button onClick={() => setIsNotifyOpen(false)} className="text-white/70 hover:text-white cursor-pointer"><X size={16} /></button>
                      </div>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-[#f0eee7]">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#717971] space-y-2">
                          <Bell className="w-8 h-8 text-[#2D5A3D] mx-auto opacity-30 animate-pulse" />
                          <p className="font-bold text-[#1c1c18]">No new notifications</p>
                        </div>
                      ) : (
                        <>
                          {unreadNotifs.map(n => (
                            <div key={n.id} onClick={() => handleMarkRead(n.id)} className="p-3 bg-[#2D5A3D]/5 hover:bg-[#2D5A3D]/10 border-l-4 border-[#2D5A3D] cursor-pointer">
                              <p className="text-xs font-bold text-[#2D5A3D]">{n.title || 'Notification'}</p>
                              <p className="text-[11px] text-[#414942] mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                          ))}
                          {readNotifs.map(n => (
                            <div key={n.id} className="p-3 hover:bg-[#FAF7F0]">
                              <p className="text-xs font-bold text-[#414942]">{n.title || 'Notification'}</p>
                              <p className="text-[11px] text-[#717971] mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="flex items-center gap-1 text-[#1C2A1E] font-semibold hover:text-[#2D5A3D] px-2 py-1 rounded-md transition-colors">
                <User size={15} />
                <span className="hidden sm:inline">Account</span>
              </Link>
            </div>
          )}

          {/* Cart Icon */}
          <button
            onClick={() => onNavigate('cart')}
            className="p-1.5 hover:bg-[#FAF7F0] rounded-xl transition-colors relative cursor-pointer text-[#1C2A1E] hover:text-[#2D5A3D]"
            title="Harvest Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] bg-[#2D5A3D] text-white font-mono text-[9px] font-extrabold flex items-center justify-center rounded-full px-1 shadow-sm border border-white">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 3: Category Nav Row */}
      <nav className="border-t border-[#E8E4DA] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto scrollbar-hide py-2.5 gap-6 text-xs font-semibold text-[#414942] whitespace-nowrap">
          <button 
            onClick={() => onNavigate('catalog', 'Deals')} 
            className="text-[#D9381E] font-extrabold hover:underline cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span className="bg-[#FFF0ED] text-[#D9381E] px-1.5 py-0.5 rounded text-[10px]">%</span> Deals
          </button>
          <button onClick={() => onNavigate('catalog', 'Vegetables')} className="hover:text-[#2D5A3D] cursor-pointer transition-colors shrink-0">Vegetables</button>
          <button onClick={() => onNavigate('catalog', 'Fruits')} className="hover:text-[#2D5A3D] cursor-pointer transition-colors shrink-0">Fruits</button>
          <button onClick={() => onNavigate('catalog', 'Dairy')} className="hover:text-[#2D5A3D] cursor-pointer transition-colors shrink-0">Dairy</button>
          <button onClick={() => onNavigate('catalog', 'Grains')} className="hover:text-[#2D5A3D] cursor-pointer transition-colors shrink-0">Grains</button>
          <button onClick={() => onNavigate('catalog', 'Herbs')} className="hover:text-[#2D5A3D] cursor-pointer transition-colors shrink-0">Herbs</button>
          <button onClick={() => onNavigate('catalog', 'Seasonal')} className="hover:text-[#2D5A3D] cursor-pointer transition-colors shrink-0">Seasonal</button>
          <button onClick={() => onNavigate('catalog', 'Bulk Orders')} className="hover:text-[#2D5A3D] cursor-pointer transition-colors shrink-0">Bulk Orders</button>
          <button onClick={() => onNavigate('catalog', 'Sell')} className="text-[#2D5A3D] font-bold hover:underline cursor-pointer transition-colors shrink-0">Sell on Harvest Hill</button>
        </div>
      </nav>

      {/* Business Modal */}
      {isBusinessOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E8E4DA] space-y-4">
            <div className="flex justify-between items-center border-b border-[#E8E4DA] pb-3">
              <h3 className="text-lg font-bold text-[#2D5A3D]">Harvest Hill for Business</h3>
              <button onClick={() => setIsBusinessOpen(false)} className="text-[#888888] hover:text-black cursor-pointer"><X size={18} /></button>
            </div>
            <p className="text-xs text-[#414942] leading-relaxed">
              We supply restaurants, hotels, schools, and wholesale clients with direct-from-farm produce crates at volume rates.
            </p>
            <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E8E4DA] text-xs space-y-1 text-[#1C2A1E]">
              <p><strong>Direct Line:</strong> +250 788 123 456</p>
              <p><strong>Wholesale Email:</strong> wholesale@harvesthill.rw</p>
              <p><strong>Delivery Window:</strong> 5:00 AM - 10:00 AM daily</p>
            </div>
            <button
              onClick={() => {
                setIsBusinessOpen(false);
                onNavigate('catalog', 'Bulk Orders');
              }}
              className="w-full bg-[#2D5A3D] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-[#1E3E2A] transition-colors cursor-pointer"
            >
              Explore Bulk Catalog
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

